using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models.Inventory;

namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// DTO for creating a new inventory spare part.
/// </summary>
public class CreateInventoryItemDto
{
    [Required(ErrorMessage = "Supplier ID is required.")]
    public Guid SupplierId { get; set; }

    [Required(ErrorMessage = "Item name is required.")]
    [MaxLength(150, ErrorMessage = "Item name cannot exceed 150 characters.")]
    public string ItemName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Category is required.")]
    public InventoryCategory Category { get; set; }

    [Required(ErrorMessage = "Stock quantity is required.")]
    [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative.")]
    public int StockQuantity { get; set; }

    [Required(ErrorMessage = "Unit cost is required.")]
    [Range(0.0, (double)decimal.MaxValue, ErrorMessage = "Unit cost cannot be negative.")]
    public decimal UnitCost { get; set; }
}
