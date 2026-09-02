using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.Models.Inventory;

public class Supplier
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string ContactEmail { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    // Navigation property
    public List<InventoryItem> InventoryItems { get; set; } = new();
}
