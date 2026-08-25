using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Models;
using SmartSpace.API.Models.PropertyManagement;
using SmartSpace.API.Models.MaintenanceTickets;

namespace SmartSpace.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Lease> Leases => Set<Lease>();

    public DbSet<MaintenanceTicket> MaintenanceTickets => Set<MaintenanceTicket>();
    public DbSet<TicketImage> TicketImages => Set<TicketImage>();
    public DbSet<AgentExecutionLog> AgentExecutionLogs => Set<AgentExecutionLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(150);
            entity.Property(u => u.Role).HasConversion<string>().IsRequired();
            entity.Property(u => u.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<Property>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.HasMany(p => p.Units)
                  .WithOne(u => u.Property)
                  .HasForeignKey(u => u.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Unit>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Status)
                  .HasConversion<string>();

            entity.HasMany(u => u.Leases)
                  .WithOne(l => l.Unit)
                  .HasForeignKey(l => l.UnitId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Lease>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.HasOne(l => l.Tenant)
                  .WithMany()
                  .HasForeignKey(l => l.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- Maintenance Request Management (Member 2) ----
        modelBuilder.Entity<MaintenanceTicket>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.Property(t => t.UrgencyLevel)
                  .HasConversion<string>()
                  .HasMaxLength(20);

            entity.Property(t => t.Status)
                  .HasConversion<string>()
                  .HasMaxLength(20);

            entity.HasOne(t => t.Tenant)
                  .WithMany()
                  .HasForeignKey(t => t.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.Unit)
                  .WithMany()
                  .HasForeignKey(t => t.UnitId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(t => t.Images)
                  .WithOne(i => i.Ticket)
                  .HasForeignKey(i => i.TicketId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(t => t.AgentExecutionLogs)
                  .WithOne(l => l.Ticket)
                  .HasForeignKey(l => l.TicketId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(t => t.TenantId);
            entity.HasIndex(t => t.Status);
        });

        modelBuilder.Entity<TicketImage>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.HasIndex(i => i.TicketId);
        });

        modelBuilder.Entity<AgentExecutionLog>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.Property(l => l.WorkflowState)
                  .HasColumnType("jsonb");

            entity.HasIndex(l => l.TicketId);
        });

        // Seed 4 dummy users (one for each Role) with default hashed password "Password123!"
        var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "tenant@smartspace.com",
                PasswordHash = defaultPasswordHash,
                FullName = "John Tenant",
                Role = UserRole.Tenant,
                CreatedAt = seedDate
            },
            new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Email = "manager@smartspace.com",
                PasswordHash = defaultPasswordHash,
                FullName = "Sarah PropertyManager",
                Role = UserRole.PropertyManager,
                CreatedAt = seedDate
            },
            new User
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Email = "technician@smartspace.com",
                PasswordHash = defaultPasswordHash,
                FullName = "Alex Technician",
                Role = UserRole.Technician,
                CreatedAt = seedDate
            },
            new User
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Email = "inventory@smartspace.com",
                PasswordHash = defaultPasswordHash,
                FullName = "Morgan InventoryOfficer",
                Role = UserRole.InventoryOfficer,
                CreatedAt = seedDate
            }
        );
    }
}