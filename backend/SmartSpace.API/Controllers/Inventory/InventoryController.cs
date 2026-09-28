using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.Inventory;
using SmartSpace.API.Models.Inventory;

namespace SmartSpace.API.Controllers.Inventory;

/// <summary>
/// Manages spare parts inventory and reservation workflows for maintenance operations.
/// Accessible by Inventory Officers and Technicians.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "InventoryOfficer,Technician,PropertyManager")]
public class InventoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public InventoryController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GET /api/inventory
    /// Retrieves a list of all spare parts in the inventory.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InventoryItemDto>>> GetAllInventory([FromQuery] InventoryCategory? category = null)
    {
        var query = _context.InventoryItems
            .Include(i => i.Supplier)
            .AsNoTracking();

        if (category.HasValue)
        {
            query = query.Where(i => i.Category == category.Value);
        }

        var items = await query
            .Select(i => new InventoryItemDto
            {
                Id = i.Id,
                SupplierId = i.SupplierId,
                SupplierName = i.Supplier != null ? i.Supplier.Name : string.Empty,
                ItemName = i.ItemName,
                Category = i.Category,
                StockQuantity = i.StockQuantity,
                UnitCost = i.UnitCost
            })
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>
    /// GET /api/inventory/{id}
    /// Retrieves a single spare part by its unique identifier.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InventoryItemDto>> GetItemById(Guid id)
    {
        var item = await _context.InventoryItems
            .Include(i => i.Supplier)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item == null)
        {
            return NotFound(new { message = $"Inventory item with ID '{id}' was not found." });
        }

        var itemDto = new InventoryItemDto
        {
            Id = item.Id,
            SupplierId = item.SupplierId,
            SupplierName = item.Supplier != null ? item.Supplier.Name : string.Empty,
            ItemName = item.ItemName,
            Category = item.Category,
            StockQuantity = item.StockQuantity,
            UnitCost = item.UnitCost
        };

        return Ok(itemDto);
    }

    /// <summary>
    /// POST /api/inventory
    /// Adds a new spare part to the inventory.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<InventoryItemDto>> CreateItem([FromBody] CreateInventoryItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validate that the referenced Supplier exists in the database
        var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
        if (supplier == null)
        {
            return BadRequest(new { message = $"Supplier with ID '{dto.SupplierId}' does not exist." });
        }

        var newItem = new InventoryItem
        {
            Id = Guid.NewGuid(),
            SupplierId = dto.SupplierId,
            ItemName = dto.ItemName.Trim(),
            Category = dto.Category,
            StockQuantity = dto.StockQuantity,
            UnitCost = dto.UnitCost
        };

        _context.InventoryItems.Add(newItem);
        await _context.SaveChangesAsync();

        var responseDto = new InventoryItemDto
        {
            Id = newItem.Id,
            SupplierId = newItem.SupplierId,
            SupplierName = supplier.Name,
            ItemName = newItem.ItemName,
            Category = newItem.Category,
            StockQuantity = newItem.StockQuantity,
            UnitCost = newItem.UnitCost
        };

        return CreatedAtAction(nameof(GetItemById), new { id = newItem.Id }, responseDto);
    }

    /// <summary>
    /// PUT /api/inventory/{id}
    /// Updates an existing spare part's details.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<InventoryItemDto>> UpdateItem(Guid id, [FromBody] UpdateInventoryItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { message = $"Inventory item with ID '{id}' was not found." });
        }

        // Validate that the assigned supplier exists
        var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
        if (supplier == null)
        {
            return BadRequest(new { message = $"Supplier with ID '{dto.SupplierId}' does not exist." });
        }

        item.SupplierId = dto.SupplierId;
        item.ItemName = dto.ItemName.Trim();
        item.Category = dto.Category;
        item.StockQuantity = dto.StockQuantity;
        item.UnitCost = dto.UnitCost;

        await _context.SaveChangesAsync();

        var responseDto = new InventoryItemDto
        {
            Id = item.Id,
            SupplierId = item.SupplierId,
            SupplierName = supplier.Name,
            ItemName = item.ItemName,
            Category = item.Category,
            StockQuantity = item.StockQuantity,
            UnitCost = item.UnitCost
        };

        return Ok(responseDto);
    }

    /// <summary>
    /// DELETE /api/inventory/{id}
    /// Removes a spare part from the inventory.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { message = $"Inventory item with ID '{id}' was not found." });
        }

        // Business check: Prevent deletion if there are active reservations for this item
        var hasActiveReservations = await _context.PartsReservations
            .AnyAsync(r => r.ItemId == id && r.Status != ReservationStatus.Consumed);

        if (hasActiveReservations)
        {
            return BadRequest(new
            {
                message = $"Cannot delete item '{item.ItemName}' because it is linked to active or pending reservations."
            });
        }

        _context.InventoryItems.Remove(item);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Inventory item '{item.ItemName}' was successfully deleted." });
    }

    /// <summary>
    /// GET /api/inventory/low-stock
    /// Returns a list of spare parts whose stock has fallen below the safety threshold (default: less than 5 items).
    /// </summary>
    [HttpGet("low-stock")]
    public async Task<ActionResult<IEnumerable<InventoryItemDto>>> GetLowStockItems([FromQuery] int threshold = 5)
    {
        if (threshold < 1)
        {
            return BadRequest(new { message = "Threshold must be greater than or equal to 1." });
        }

        var lowStockItems = await _context.InventoryItems
            .Include(i => i.Supplier)
            .AsNoTracking()
            .Where(i => i.StockQuantity < threshold)
            .OrderBy(i => i.StockQuantity)
            .Select(i => new InventoryItemDto
            {
                Id = i.Id,
                SupplierId = i.SupplierId,
                SupplierName = i.Supplier != null ? i.Supplier.Name : string.Empty,
                ItemName = i.ItemName,
                Category = i.Category,
                StockQuantity = i.StockQuantity,
                UnitCost = i.UnitCost
            })
            .ToListAsync();

        return Ok(lowStockItems);
    }

    /// <summary>
    /// POST /api/inventory/reserve
    /// Critical endpoint used by the system and AI workflow to stage a parts reservation.
    /// Validates item existence and stock sufficiency. Sets status to PendingApproval.
    /// Note: StockQuantity is NOT permanently deducted at this reservation stage.
    /// </summary>
    [HttpPost("reserve")]
    public async Task<ActionResult<PartsReservationDto>> ReserveParts([FromBody] ReservePartsRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // 1. Strict validation: Verify ItemId exists in the database
        var item = await _context.InventoryItems.FindAsync(dto.ItemId);
        if (item == null)
        {
            return BadRequest(new { message = $"Inventory item with ID '{dto.ItemId}' does not exist." });
        }

        // 2. Strict validation: Verify StockQuantity >= requested quantity
        if (item.StockQuantity < dto.Quantity)
        {
            return BadRequest(new
            {
                message = $"Insufficient stock for item '{item.ItemName}'. Available: {item.StockQuantity}, Requested: {dto.Quantity}."
            });
        }

        // 3. Optional validation: Verify TicketId exists in MaintenanceTickets if linked
        var ticketExists = await _context.MaintenanceTickets.AnyAsync(t => t.Id == dto.TicketId);
        if (!ticketExists)
        {
            return BadRequest(new { message = $"Maintenance ticket with ID '{dto.TicketId}' does not exist." });
        }

        // 4. Create new PartsReservation record with status PendingApproval
        // CRITICAL: StockQuantity is intentionally NOT deducted at this stage
        var reservation = new PartsReservation
        {
            Id = Guid.NewGuid(),
            TicketId = dto.TicketId,
            ItemId = dto.ItemId,
            QuantityReserved = dto.Quantity,
            Status = ReservationStatus.PendingApproval
        };

        _context.PartsReservations.Add(reservation);
        await _context.SaveChangesAsync();

        var responseDto = new PartsReservationDto
        {
            Id = reservation.Id,
            TicketId = reservation.TicketId,
            ItemId = reservation.ItemId,
            ItemName = item.ItemName,
            QuantityReserved = reservation.QuantityReserved,
            Status = reservation.Status
        };

        return Ok(responseDto);
    }

    /// <summary>
    /// POST /api/inventory/consume
    /// Permanently deducts used inventory stock when a technician completes a maintenance task.
    /// Accessible only by Technicians.
    /// </summary>
    [HttpPost("consume")]
    [Authorize(Roles = "Technician")]
    public async Task<IActionResult> ConsumeParts([FromBody] ConsumePartsRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // 1. Basic validation: ensure the list is not empty
        if (request.UsedParts == null || !request.UsedParts.Any())
        {
            return BadRequest(new { message = "No parts provided to consume." });
        }

        // List to hold validated items and deduction quantities
        var itemsToDeduct = new List<(InventoryItem Item, int QuantityToDeduct)>();

        // 2. Loop Through Parts & Stock Check
        foreach (var partDto in request.UsedParts)
        {
            // Find the inventory item in the database
            var item = await _context.InventoryItems.FindAsync(partDto.ItemId);

            // Check if item exists
            if (item == null)
            {
                return BadRequest(new 
                { 
                    message = $"Inventory item with ID '{partDto.ItemId}' does not exist." 
                });
            }

            // Check if there is enough stock available
            if (item.StockQuantity < partDto.QuantityUsed)
            {
                return BadRequest(new 
                { 
                    message = $"Not enough stock for item '{item.ItemName}'. Available: {item.StockQuantity}, Requested: {partDto.QuantityUsed}." 
                });
            }

            // Stash valid item and deduction amount
            itemsToDeduct.Add((item, partDto.QuantityUsed));
        }

        // 3. Deduct Stock (executed only after verifying ALL items have sufficient stock)
        foreach (var (item, quantityToDeduct) in itemsToDeduct)
        {
            item.StockQuantity -= quantityToDeduct;
        }

        // 4. Save changes in a single database transaction
        await _context.SaveChangesAsync();

        return Ok(new 
        { 
            message = "Parts consumed successfully and inventory updated.",
            ticketId = request.TicketId,
            consumedCount = itemsToDeduct.Count
        });
    }

    /// <summary>
    /// GET /api/inventory/check-stock
    /// Returns real-time stock availability for spare parts.
    /// Calculates available stock by subtracting active (non-consumed) reservations from physical stock.
    /// This prevents the AI agent from recommending parts that are already locked for another ticket.
    /// </summary>
    [HttpGet("check-stock")]
    public async Task<ActionResult<IEnumerable<AvailableStockCheckDto>>> CheckAvailableStock(
        [FromQuery] InventoryCategory? category = null,
        [FromQuery] string? searchTerm = null)
    {
        // 1. Fetch items with their reservations (no-tracking for read-only speed)
        var query = _context.InventoryItems
            .Include(i => i.PartsReservations)
            .AsNoTracking();

        // 2. Filter by category if requested (e.g., Plumbing, Electrical)
        if (category.HasValue)
        {
            query = query.Where(i => i.Category == category.Value);
        }

        // 3. Filter by search keyword in the part name if provided
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(i => i.ItemName.ToLower().Contains(term));
        }

        // 4. Project into DTO with dynamic calculation of available stock
        var results = await query
            .Select(i => new AvailableStockCheckDto
            {
                ItemId = i.Id,
                ItemName = i.ItemName,
                Category = i.Category,
                PhysicalStock = i.StockQuantity,
                // Sum only pending or approved reservations that have not yet been consumed
                ReservedStock = i.PartsReservations
                    .Where(r => r.Status != ReservationStatus.Consumed)
                    .Sum(r => (int?)r.QuantityReserved) ?? 0,
                // Available stock is physical stock minus active reservations
                AvailableStock = i.StockQuantity - (i.PartsReservations
                    .Where(r => r.Status != ReservationStatus.Consumed)
                    .Sum(r => (int?)r.QuantityReserved) ?? 0),
                UnitCost = i.UnitCost
            })
            .Where(r => r.AvailableStock > 0) // Only return parts that have stock ready to use
            .ToListAsync();

        return Ok(results);
    }

    /// <summary>
    /// POST /api/inventory/ai-chat
    /// Proxies AI assistant chat requests to the Python AI service.
    /// Provides seamless access for mobile devices and web clients across all network topologies.
    /// </summary>
    [HttpPost("ai-chat")]
    [AllowAnonymous]
    public async Task<IActionResult> ChatWithAiAssistant(
        [FromBody] JsonElement payload,
        [FromServices] IHttpClientFactory httpClientFactory,
        [FromServices] IConfiguration configuration)
    {
        try
        {
            var aiBaseUrl = configuration["AiService:BaseUrl"] ?? "http://127.0.0.1:8000";
            var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(45);

            var request = new HttpRequestMessage(HttpMethod.Post, $"{aiBaseUrl}/api/inventory-assistant/chat")
            {
                Content = new StringContent(payload.GetRawText(), Encoding.UTF8, "application/json")
            };

            // Forward Authorization header if provided by caller
            if (Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                request.Headers.TryAddWithoutValidation("Authorization", authHeader.ToString());
            }

            var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { detail = $"Failed to reach AI service: {ex.Message}" });
        }
    }
}

