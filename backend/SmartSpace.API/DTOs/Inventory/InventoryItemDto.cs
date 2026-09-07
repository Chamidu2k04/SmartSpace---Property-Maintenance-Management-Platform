using SmartSpace.API.Models.Inventory;

namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// Data Transfer Object for returning inventory spare part details.
/// </summary>
public class InventoryItemDto
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public InventoryCategory Category { get; set; }
    public int StockQuantity { get; set; }
    public decimal UnitCost { get; set; }
}
