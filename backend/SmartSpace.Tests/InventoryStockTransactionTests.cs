using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Controllers.Inventory;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.Inventory;
using SmartSpace.API.Models.Inventory;
using Xunit;

namespace SmartSpace.Tests;

/// <summary>
/// Unit and Transactional tests for InventoryController stock deduction (consumption) workflows.
/// Designed for SE3090 Assignment 2 & Quality Management testing specifications.
/// Evaluates normal, boundary, invalid, and atomic-rollback transaction scenarios.
/// </summary>
public class InventoryStockTransactionTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly InventoryController _controller;
    private readonly Supplier _testSupplier;

    public InventoryStockTransactionTests()
    {
        // Use a unique in-memory database per test run for strict test isolation
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"SmartSpace_Inventory_Test_{Guid.NewGuid()}")
            .Options;

        _context = new ApplicationDbContext(options);

        // Seed common supplier required for foreign key relationships
        _testSupplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Name = "Apex Hardware Supplies",
            ContactEmail = "orders@apexhardware.lk",
            Phone = "+94112345678"
        };
        _context.Suppliers.Add(_testSupplier);
        _context.SaveChanges();

        _controller = new InventoryController(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // =========================================================================
    // NORMAL TEST CASES (Happy Path Stock Deductions)
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it does: Verifies that consuming a valid quantity within current stock bounds succeeds.
    /// Why written: Proves the primary business logic works: StockQuantity decreases by exactly the requested amount and returns HTTP 200 OK.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WithSufficientStock_DeductsQuantityAndReturnsOk()
    {
        // Arrange
        var part = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = _testSupplier.Id,
            ItemName = "PVC Pipe 1-inch (3m)",
            Category = InventoryCategory.Plumbing,
            StockQuantity = 20,
            UnitCost = 450.00m
        };
        _context.InventoryItems.Add(part);
        await _context.SaveChangesAsync();

        var request = new ConsumePartsRequestDto
        {
            TicketId = Guid.NewGuid(),
            UsedParts = new List<PartUsageDto>
            {
                new PartUsageDto { ItemId = part.Id, QuantityUsed = 6 }
            }
        };

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, okResult.StatusCode);

        var updatedPart = await _context.InventoryItems.FindAsync(part.Id);
        Assert.NotNull(updatedPart);
        Assert.Equal(14, updatedPart.StockQuantity); // 20 - 6 = 14
    }

    /// <summary>
    /// VIVA PREP:
    /// What it does: Validates multi-item stock consumption in a single transaction.
    /// Why written: In real maintenance tasks, a technician often consumes multiple distinct parts simultaneously.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WithMultipleValidParts_DeductsAllAndReturnsOk()
    {
        // Arrange
        var partA = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = _testSupplier.Id,
            ItemName = "Circuit Breaker 16A",
            Category = InventoryCategory.Electrical,
            StockQuantity = 15,
            UnitCost = 1200.00m
        };
        var partB = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = _testSupplier.Id,
            ItemName = "Electrical Conduit Box",
            Category = InventoryCategory.Electrical,
            StockQuantity = 8,
            UnitCost = 350.00m
        };
        _context.InventoryItems.AddRange(partA, partB);
        await _context.SaveChangesAsync();

        var request = new ConsumePartsRequestDto
        {
            TicketId = Guid.NewGuid(),
            UsedParts = new List<PartUsageDto>
            {
                new PartUsageDto { ItemId = partA.Id, QuantityUsed = 5 },
                new PartUsageDto { ItemId = partB.Id, QuantityUsed = 3 }
            }
        };

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, okResult.StatusCode);

        var refreshedA = await _context.InventoryItems.FindAsync(partA.Id);
        var refreshedB = await _context.InventoryItems.FindAsync(partB.Id);
        Assert.Equal(10, refreshedA!.StockQuantity); // 15 - 5 = 10
        Assert.Equal(5, refreshedB!.StockQuantity);  // 8 - 3 = 5
    }

    // =========================================================================
    // BOUNDARY TEST CASES (Edge conditions: stock = 0, quantity = 1)
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it does: Tests the exact boundary where requested quantity equals total available stock.
    /// Why written: Validates that stock can safely drop to exactly zero without triggering an underflow or off-by-one error.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WithExactAvailableStock_ReducesStockToZeroSuccessfully()
    {
        // Arrange
        var part = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = _testSupplier.Id,
            ItemName = "Water Tap Mixer Valve",
            Category = InventoryCategory.Plumbing,
            StockQuantity = 4,
            UnitCost = 2800.00m
        };
        _context.InventoryItems.Add(part);
        await _context.SaveChangesAsync();

        var request = new ConsumePartsRequestDto
        {
            TicketId = Guid.NewGuid(),
            UsedParts = new List<PartUsageDto>
            {
                new PartUsageDto { ItemId = part.Id, QuantityUsed = 4 } // Exactly all 4
            }
        };

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, okResult.StatusCode);

        var updatedPart = await _context.InventoryItems.FindAsync(part.Id);
        Assert.NotNull(updatedPart);
        Assert.Equal(0, updatedPart.StockQuantity); // Reaches boundary 0
    }

    /// <summary>
    /// VIVA PREP:
    /// What it does: Tests minimum allowable non-zero consumption unit (1 unit).
    /// Why written: Ensures the lower positive boundary quantity (1) correctly updates stock.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WithMinimumQuantityOfOne_DeductsSingleUnit()
    {
        // Arrange
        var part = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = _testSupplier.Id,
            ItemName = "Capacitor 45uF",
            Category = InventoryCategory.HVAC,
            StockQuantity = 10,
            UnitCost = 1500.00m
        };
        _context.InventoryItems.Add(part);
        await _context.SaveChangesAsync();

        var request = new ConsumePartsRequestDto
        {
            TicketId = Guid.NewGuid(),
            UsedParts = new List<PartUsageDto>
            {
                new PartUsageDto { ItemId = part.Id, QuantityUsed = 1 }
            }
        };

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, okResult.StatusCode);

        var updatedPart = await _context.InventoryItems.FindAsync(part.Id);
        Assert.Equal(9, updatedPart!.StockQuantity); // 10 - 1 = 9
    }

    // =========================================================================
    // INVALID & FAILURE TEST CASES (Input validation & Error handling)
    // =========================================================================

    /// <summary>
    /// VIVA PREP:
    /// What it does: Tests controller response when payload contains an empty UsedParts array.
    /// Why written: Guards against blank requests and confirms HTTP 400 Bad Request is returned.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WithEmptyPartsList_ReturnsBadRequest()
    {
        // Arrange
        var request = new ConsumePartsRequestDto
        {
            TicketId = Guid.NewGuid(),
            UsedParts = new List<PartUsageDto>() // Empty list
        };

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }

    /// <summary>
    /// VIVA PREP:
    /// What it does: Tests deduction attempt with a non-existent ItemId.
    /// Why written: Protects system against referencing deleted or fabricated inventory items.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WithNonExistentItemId_ReturnsBadRequest()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        var request = new ConsumePartsRequestDto
        {
            TicketId = Guid.NewGuid(),
            UsedParts = new List<PartUsageDto>
            {
                new PartUsageDto { ItemId = nonExistentId, QuantityUsed = 2 }
            }
        };

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }

    /// <summary>
    /// VIVA PREP:
    /// What it does: Tests over-consumption where requested quantity exceeds available warehouse stock.
    /// Why written: Prevents negative inventory balances and maintains financial and stock audit accuracy.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WithInsufficientStock_ReturnsBadRequestAndDoesNotDeduct()
    {
        // Arrange
        var part = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = _testSupplier.Id,
            ItemName = "Heavy Duty Ball Valve",
            Category = InventoryCategory.Plumbing,
            StockQuantity = 3, // Only 3 available
            UnitCost = 950.00m
        };
        _context.InventoryItems.Add(part);
        await _context.SaveChangesAsync();

        var request = new ConsumePartsRequestDto
        {
            TicketId = Guid.NewGuid(),
            UsedParts = new List<PartUsageDto>
            {
                new PartUsageDto { ItemId = part.Id, QuantityUsed = 10 } // Requesting 10
            }
        };

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequestResult.StatusCode);

        // Ensure stock is untouched
        var currentPart = await _context.InventoryItems.FindAsync(part.Id);
        Assert.Equal(3, currentPart!.StockQuantity);
    }

    /// <summary>
    /// VIVA PREP:
    /// What it does: Tests ATOMIC TRANSACTION integrity. If one item in a multi-item batch fails, no items should be deducted.
    /// Why written: Crucial for Quality Management Viva. Proves the two-phase deduction pattern:
    /// Phase 1 verifies ALL parts have sufficient stock; Phase 2 performs mutations only if all passed.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WhenOneItemFailsStockCheck_DoesNotDeductAnyStockFromOtherItems()
    {
        // Arrange
        var validPart = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = _testSupplier.Id,
            ItemName = "LED Panel Light 18W",
            Category = InventoryCategory.Electrical,
            StockQuantity = 10,
            UnitCost = 850.00m
        };
        var shortStockPart = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = _testSupplier.Id,
            ItemName = "Air Conditioner Compressor",
            Category = InventoryCategory.HVAC,
            StockQuantity = 1, // Only 1 available
            UnitCost = 25000.00m
        };
        _context.InventoryItems.AddRange(validPart, shortStockPart);
        await _context.SaveChangesAsync();

        var request = new ConsumePartsRequestDto
        {
            TicketId = Guid.NewGuid(),
            UsedParts = new List<PartUsageDto>
            {
                new PartUsageDto { ItemId = validPart.Id, QuantityUsed = 3 },     // Sufficient
                new PartUsageDto { ItemId = shortStockPart.Id, QuantityUsed = 5 } // Insufficient (1 available)
            }
        };

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequestResult.StatusCode);

        // CRITICAL CHECK: validPart MUST NOT be deducted because the transaction as a whole failed
        var refreshedValidPart = await _context.InventoryItems.FindAsync(validPart.Id);
        var refreshedShortPart = await _context.InventoryItems.FindAsync(shortStockPart.Id);

        Assert.Equal(10, refreshedValidPart!.StockQuantity); // Untouched at 10
        Assert.Equal(1, refreshedShortPart!.StockQuantity);   // Untouched at 1
    }

    /// <summary>
    /// VIVA PREP:
    /// What it does: Tests that invalid ModelState triggers standard BadRequest.
    /// Why written: Validates ASP.NET Core framework integration and data validation layer enforcement.
    /// </summary>
    [Fact]
    public async Task ConsumeParts_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("TicketId", "TicketId is required.");
        var request = new ConsumePartsRequestDto();

        // Act
        var result = await _controller.ConsumeParts(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }
}
