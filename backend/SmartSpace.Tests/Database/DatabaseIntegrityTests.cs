using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.Models;
using SmartSpace.API.Models.Inventory;
using SmartSpace.API.Models.MaintenanceTickets;
using SmartSpace.API.Models.PropertyManagement;
using SmartSpace.API.Models.Scheduling;
using Xunit;

namespace SmartSpace.Tests.Database;

/// <summary>
/// Database Integration, Constraint, Referential Integrity, and Transaction tests for SmartSpace.
/// Conforms to SE3090 Assignment 2 (Testing Scope: Database Testing).
/// Validates:
///  - Unique constraints and schema rules
///  - Cascade deletion behaviors (Property -> Unit, MaintenanceTicket -> TicketImage)
///  - Restrict deletion rules (Supplier -> InventoryItem, Unit -> Lease)
///  - Foreign key constraint enforcement
///  - ACID transaction commit & rollback atomicity
///  - EF Core database seeding and decimal precision
/// </summary>
public class DatabaseIntegrityTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly ApplicationDbContext _context;

    public DatabaseIntegrityTests()
    {
        // Open an isolated in-memory SQLite relational connection
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        // Strictly enforce SQLite foreign key constraints and referential actions (PRAGMA foreign_keys = ON)
        using (var command = _connection.CreateCommand())
        {
            command.CommandText = "PRAGMA foreign_keys = ON;";
            command.ExecuteNonQuery();
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new ApplicationDbContext(options);
        _context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private ApplicationDbContext CreateNewContextInstance()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(_connection)
            .Options;

        return new ApplicationDbContext(options);
    }

    // =========================================================================
    // 1. CONSTRAINT TESTING (Unique Indexes & Schema Rules)
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it tests: Unique constraint on User.Email.
    /// Why written: Proves database rejects duplicate registration attempts at persistence level.
    /// Expected result: DbUpdateException is thrown when saving a duplicate email.
    /// </summary>
    [Fact]
    public async Task Constraint_UniqueEmail_ThrowsDbUpdateExceptionOnDuplicate()
    {
        // Arrange: "tenant@smartspace.com" is already inserted by EF ModelBuilder Seed Data
        var duplicateUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tenant@smartspace.com", // Duplicate of seeded email
            PasswordHash = "hashedpassword",
            FullName = "Imposter Tenant",
            Role = UserRole.Tenant,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(duplicateUser);

        // Act & Assert
        await Assert.ThrowsAsync<DbUpdateException>(async () =>
        {
            await _context.SaveChangesAsync();
        });
    }

    /// <summary>
    /// VIVA PREP:
    /// What it tests: User uniqueness constraint with two brand-new accounts sharing an email.
    /// Expected result: First save succeeds, second save throws DbUpdateException.
    /// </summary>
    [Fact]
    public async Task Constraint_UniqueEmail_AllowsFirstRejectsSecondIdenticalEmail()
    {
        var email = $"manager.{Guid.NewGuid():N}@smartspace.lk";

        var user1 = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = "hash1",
            FullName = "Manager One",
            Role = UserRole.PropertyManager,
            CreatedAt = DateTime.UtcNow
        };

        var user2 = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = "hash2",
            FullName = "Manager Two",
            Role = UserRole.PropertyManager,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user1);
        await _context.SaveChangesAsync();

        _context.Users.Add(user2);
        await Assert.ThrowsAsync<DbUpdateException>(async () =>
        {
            await _context.SaveChangesAsync();
        });
    }

    // =========================================================================
    // 2. REFERENTIAL INTEGRITY - CASCADE DELETE
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it tests: Cascade delete rule on Property -> Units (DeleteBehavior.Cascade).
    /// Why written: Deleting a Property must automatically purge its constituent Units to prevent orphaned units.
    /// Expected result: Deleting Property removes all linked Units from database.
    /// </summary>
    [Fact]
    public async Task ReferentialIntegrity_PropertyCascadeDelete_RemovesAssociatedUnits()
    {
        // Arrange
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Name = "Lotus Tower Residences",
            Address = "100 DR Wijewardena Mawatha",
            City = "Colombo 10"
        };

        var unit1 = new Unit { Id = Guid.NewGuid(), PropertyId = property.Id, UnitNumber = "101", Floor = 1 };
        var unit2 = new Unit { Id = Guid.NewGuid(), PropertyId = property.Id, UnitNumber = "102", Floor = 1 };
        var unit3 = new Unit { Id = Guid.NewGuid(), PropertyId = property.Id, UnitNumber = "201", Floor = 2 };

        _context.Properties.Add(property);
        _context.Units.AddRange(unit1, unit2, unit3);
        await _context.SaveChangesAsync();

        // Verify entities exist
        using (var verifyContext = CreateNewContextInstance())
        {
            var savedUnits = await verifyContext.Units.Where(u => u.PropertyId == property.Id).CountAsync();
            Assert.Equal(3, savedUnits);
        }

        // Act: Delete Property
        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();

        // Assert: Dependent units should be cascaded and deleted
        using (var verifyContext = CreateNewContextInstance())
        {
            var remainingUnits = await verifyContext.Units.Where(u => u.PropertyId == property.Id).CountAsync();
            var remainingProperty = await verifyContext.Properties.FindAsync(property.Id);

            Assert.Null(remainingProperty);
            Assert.Equal(0, remainingUnits);
        }
    }

    /// <summary>
    /// VIVA PREP:
    /// What it tests: Cascade delete rule on MaintenanceTicket -> TicketImages (DeleteBehavior.Cascade).
    /// Expected result: Deleting a ticket purges its image attachment records.
    /// </summary>
    [Fact]
    public async Task ReferentialIntegrity_TicketCascadeDelete_RemovesAssociatedTicketImages()
    {
        // Arrange
        var tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"); // Seeded user

        var property = new Property { Id = Guid.NewGuid(), Name = "Emerald Heights", Address = "Colombo 03", City = "Colombo" };
        var unit = new Unit { Id = Guid.NewGuid(), PropertyId = property.Id, UnitNumber = "3A", Floor = 3 };

        var ticket = new MaintenanceTicket
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UnitId = unit.Id,
            Description = "Severe water leakage under sink",
            UrgencyLevel = UrgencyLevel.High,
            Status = TicketStatus.Submitted
        };

        var image1 = new TicketImage { Id = Guid.NewGuid(), TicketId = ticket.Id, ImageUrl = "https://cdn.example.com/leak1.jpg" };
        var image2 = new TicketImage { Id = Guid.NewGuid(), TicketId = ticket.Id, ImageUrl = "https://cdn.example.com/leak2.jpg" };

        _context.Properties.Add(property);
        _context.Units.Add(unit);
        _context.MaintenanceTickets.Add(ticket);
        _context.TicketImages.AddRange(image1, image2);
        await _context.SaveChangesAsync();

        // Act: Delete the Ticket
        _context.MaintenanceTickets.Remove(ticket);
        await _context.SaveChangesAsync();

        // Assert: Images should be purged automatically
        using (var verifyContext = CreateNewContextInstance())
        {
            var remainingImages = await verifyContext.TicketImages.Where(i => i.TicketId == ticket.Id).CountAsync();
            Assert.Equal(0, remainingImages);
        }
    }

    // =========================================================================
    // 3. REFERENTIAL INTEGRITY - RESTRICT DELETE
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it tests: Restrict delete rule on Supplier -> InventoryItem (DeleteBehavior.Restrict).
    /// Why written: Prevents accidental deletion of a supplier that still has active catalog parts.
    /// Expected result: Database throws DbUpdateException blocking deletion.
    /// </summary>
    [Fact]
    public async Task ReferentialIntegrity_SupplierRestrictDelete_PreventsDeletionWhenItemsExist()
    {
        // Arrange
        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Name = "Pioneer Electricals",
            ContactEmail = "sales@pioneerelec.lk",
            Phone = "+94119998888"
        };

        var item = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = supplier.Id,
            ItemName = "16A Circuit Breaker",
            Category = InventoryCategory.Electrical,
            StockQuantity = 25,
            UnitCost = 450.00m
        };

        _context.Suppliers.Add(supplier);
        _context.InventoryItems.Add(item);
        await _context.SaveChangesAsync();

        // Act & Assert: Attempting to remove the supplier in the database must fail due to foreign key constraint
        using var deleteContext = CreateNewContextInstance();
        var supplierToDelete = new Supplier { Id = supplier.Id };
        deleteContext.Suppliers.Attach(supplierToDelete);
        deleteContext.Suppliers.Remove(supplierToDelete);

        await Assert.ThrowsAsync<DbUpdateException>(async () =>
        {
            await deleteContext.SaveChangesAsync();
        });
    }

    /// <summary>
    /// VIVA PREP:
    /// What it tests: Restrict delete rule on Unit -> Lease (DeleteBehavior.Restrict).
    /// Why written: A property unit cannot be deleted while an active or historical lease contract points to it.
    /// Expected result: Database throws DbUpdateException.
    /// </summary>
    [Fact]
    public async Task ReferentialIntegrity_UnitRestrictDelete_PreventsDeletionWhenLeaseExists()
    {
        // Arrange
        var tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"); // Seeded user

        var property = new Property { Id = Guid.NewGuid(), Name = "Royal Palm Park", Address = "Nawala", City = "Rajagiriya" };
        var unit = new Unit { Id = Guid.NewGuid(), PropertyId = property.Id, UnitNumber = "Unit 10", Floor = 1 };

        var lease = new Lease
        {
            Id = Guid.NewGuid(),
            UnitId = unit.Id,
            TenantId = tenantId,
            StartDate = DateTime.UtcNow.AddMonths(-2),
            EndDate = DateTime.UtcNow.AddMonths(10),
            MonthlyRent = 85000.00m,
            IsActive = true
        };

        _context.Properties.Add(property);
        _context.Units.Add(unit);
        _context.Leases.Add(lease);
        await _context.SaveChangesAsync();

        // Act & Assert: Attempting to delete the unit from the database must fail due to active lease reference
        using var deleteContext = CreateNewContextInstance();
        var unitToDelete = new Unit { Id = unit.Id };
        deleteContext.Units.Attach(unitToDelete);
        deleteContext.Units.Remove(unitToDelete);

        await Assert.ThrowsAsync<DbUpdateException>(async () =>
        {
            await deleteContext.SaveChangesAsync();
        });
    }

    // =========================================================================
    // 4. FOREIGN KEY VALIDATION (Invalid Parent References)
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it tests: Foreign key constraint validation on MaintenanceTicket.TenantId and UnitId.
    /// Why written: Ensures orphaned tickets referencing non-existent tenant accounts are rejected by the DB engine.
    /// Expected result: DbUpdateException is thrown.
    /// </summary>
    [Fact]
    public async Task ForeignKey_MaintenanceTicket_ThrowsExceptionWhenTenantDoesNotExist()
    {
        // Arrange: Valid property and unit, but non-existent tenant GUID
        var property = new Property { Id = Guid.NewGuid(), Name = "Horizon Residencies", Address = "Malabe", City = "Colombo" };
        var unit = new Unit { Id = Guid.NewGuid(), PropertyId = property.Id, UnitNumber = "H-102", Floor = 1 };

        _context.Properties.Add(property);
        _context.Units.Add(unit);
        await _context.SaveChangesAsync();

        var nonExistentTenantId = Guid.NewGuid();

        var invalidTicket = new MaintenanceTicket
        {
            Id = Guid.NewGuid(),
            TenantId = nonExistentTenantId, // Non-existent foreign key
            UnitId = unit.Id,
            Description = "Broken door handle",
            UrgencyLevel = UrgencyLevel.Low,
            Status = TicketStatus.Submitted
        };

        _context.MaintenanceTickets.Add(invalidTicket);

        // Act & Assert
        await Assert.ThrowsAsync<DbUpdateException>(async () =>
        {
            await _context.SaveChangesAsync();
        });
    }

    // =========================================================================
    // 5. TRANSACTION TESTING (ACID Commit & Atomic Rollback)
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it tests: ACID Rollback atomicity during a multi-operation inventory workflow.
    /// Why written: If stock quantity is reduced but reservation insertion fails, the transaction must
    ///              roll back completely to prevent silent inventory shrinkage.
    /// Expected result: On rollback, StockQuantity remains at its initial value (50).
    /// </summary>
    [Fact]
    public async Task Transaction_AtomicRollback_RestoresOriginalStockOnFailure()
    {
        // Arrange
        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Name = "Colombo Plumbing Wholesale",
            ContactEmail = "info@colomboplumbing.lk"
        };

        var item = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = supplier.Id,
            ItemName = "PVC Ball Valve 1/2-inch",
            Category = InventoryCategory.Plumbing,
            StockQuantity = 50,
            UnitCost = 850.00m
        };

        _context.Suppliers.Add(supplier);
        _context.InventoryItems.Add(item);
        await _context.SaveChangesAsync();

        // Act: Execute transaction that fails midway
        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                // Step 1: Deduct stock
                item.StockQuantity -= 15;
                await _context.SaveChangesAsync();

                // Step 2: Simulate failure (e.g. downstream external service crash)
                throw new InvalidOperationException("Simulated unexpected failure during parts reservation dispatch.");
            }
            catch
            {
                // Step 3: Rollback transaction
                await transaction.RollbackAsync();
            }
        }

        // Assert: Read with a fresh context to ensure no dirty read
        using (var verifyContext = CreateNewContextInstance())
        {
            var verifiedItem = await verifyContext.InventoryItems.FindAsync(item.Id);
            Assert.NotNull(verifiedItem);
            Assert.Equal(50, verifiedItem.StockQuantity); // Intact, rollback succeeded
        }
    }

    /// <summary>
    /// VIVA PREP:
    /// What it tests: ACID Commit atomicity across multiple entities (Appointment + Quotation).
    /// Why written: Both the scheduled appointment and its financial estimate must persist atomically together.
    /// Expected result: Both entities are successfully committed and queryable.
    /// </summary>
    [Fact]
    public async Task Transaction_AtomicCommit_PersistsBothAppointmentAndQuotation()
    {
        // Arrange
        var ticketId = Guid.NewGuid();
        var technicianUserId = Guid.Parse("33333333-3333-3333-3333-333333333333"); // Seeded technician

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            TechnicianId = technicianUserId,
            ScheduledDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(11, 0),
            Status = AppointmentStatus.Scheduled
        };

        var quotation = new Quotation
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            LaborCost = 3500.00m,
            PartsCost = 1200.00m,
            TotalCost = 4700.00m,
            IsApproved = true
        };

        // Act: Commit both in a single transaction
        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            _context.Appointments.Add(appointment);
            _context.Quotations.Add(quotation);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }

        // Assert: Verify with a separate context instance
        using (var verifyContext = CreateNewContextInstance())
        {
            var savedAppointment = await verifyContext.Appointments.FindAsync(appointment.Id);
            var savedQuotation = await verifyContext.Quotations.FindAsync(quotation.Id);

            Assert.NotNull(savedAppointment);
            Assert.NotNull(savedQuotation);
            Assert.Equal(AppointmentStatus.Scheduled, savedAppointment.Status);
            Assert.Equal(4700.00m, savedQuotation.TotalCost);
        }
    }

    // =========================================================================
    // 6. SEED DATA & MIGRATION MODEL VERIFICATION
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it tests: Initial seed data in ApplicationDbContext.OnModelCreating.
    /// Why written: Guarantees that baseline system accounts (Tenant, PropertyManager, Technician, InventoryOfficer)
    ///              are always populated when the database is created.
    /// Expected result: All 4 seeded accounts exist with expected roles.
    /// </summary>
    [Fact]
    public async Task SeedData_InitialDatabaseCreation_ContainsDefaultRoles()
    {
        var seededUsers = await _context.Users.ToListAsync();

        Assert.Equal(4, seededUsers.Count);
        Assert.Contains(seededUsers, u => u.Role == UserRole.Tenant && u.Email == "tenant@smartspace.com");
        Assert.Contains(seededUsers, u => u.Role == UserRole.PropertyManager && u.Email == "manager@smartspace.com");
        Assert.Contains(seededUsers, u => u.Role == UserRole.Technician && u.Email == "technician@smartspace.com");
        Assert.Contains(seededUsers, u => u.Role == UserRole.InventoryOfficer && u.Email == "inventory@smartspace.com");
    }

    /// <summary>
    /// VIVA PREP:
    /// What it tests: Precision and persistence of decimal(18,2) monetary fields in Quotation entity.
    /// Expected result: Preserves monetary precision without unwanted truncation or type errors.
    /// </summary>
    [Fact]
    public async Task DataIntegrity_DecimalPrecision_PreservesTwoDecimalPlacesAccurately()
    {
        var quotation = new Quotation
        {
            Id = Guid.NewGuid(),
            TicketId = Guid.NewGuid(),
            LaborCost = 15250.75m,
            PartsCost = 8490.50m,
            TotalCost = 23741.25m,
            IsApproved = false
        };

        _context.Quotations.Add(quotation);
        await _context.SaveChangesAsync();

        using (var verifyContext = CreateNewContextInstance())
        {
            var saved = await verifyContext.Quotations.FindAsync(quotation.Id);
            Assert.NotNull(saved);
            Assert.Equal(15250.75m, saved.LaborCost);
            Assert.Equal(8490.50m, saved.PartsCost);
            Assert.Equal(23741.25m, saved.TotalCost);
        }
    }
}
