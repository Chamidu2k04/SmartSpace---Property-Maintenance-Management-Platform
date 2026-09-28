using SmartSpace.API.Models.Inventory;

namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// DTO representing real-time stock availability for an inventory item.
/// Used by the system and AI agents to check actual available stock
/// after subtracting active reservations from physical stock.
/// </summary>
public class AvailableStockCheckDto
{
    public Guid ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public InventoryCategory Category { get; set; }
    public int PhysicalStock { get; set; }
    public int ReservedStock { get; set; }
    public int AvailableStock { get; set; }
    public decimal UnitCost { get; set; }
}
