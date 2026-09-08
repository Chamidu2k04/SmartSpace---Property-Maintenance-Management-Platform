using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSpace.API.Models.Inventory;

public class InventoryItem
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SupplierId { get; set; }

    [Required]
    [MaxLength(150)]
    public string ItemName { get; set; } = string.Empty;

    [Required]
    public InventoryCategory Category { get; set; }

    [Required]
    public int StockQuantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitCost { get; set; }

    // Navigation properties
    public Supplier? Supplier { get; set; }
    public List<PartsReservation> PartsReservations { get; set; } = new();
}
