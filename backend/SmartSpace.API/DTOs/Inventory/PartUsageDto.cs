using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// Represents an individual spare part and the quantity used during a maintenance job.
/// </summary>
public class PartUsageDto
{
    /// <summary>
    /// The unique identifier of the inventory item being consumed.
    /// </summary>
    [Required(ErrorMessage = "ItemId is required.")]
    public Guid ItemId { get; set; }

    /// <summary>
    /// The quantity of the item consumed (must be at least 1).
    /// </summary>
    [Required(ErrorMessage = "QuantityUsed is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "QuantityUsed must be at least 1.")]
    public int QuantityUsed { get; set; }
}
