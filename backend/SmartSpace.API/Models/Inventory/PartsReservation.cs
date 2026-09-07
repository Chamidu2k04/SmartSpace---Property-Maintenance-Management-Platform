using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.Models.Inventory;

public class PartsReservation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TicketId { get; set; }

    [Required]
    public Guid ItemId { get; set; }

    [Required]
    public int QuantityReserved { get; set; }

    [Required]
    public ReservationStatus Status { get; set; }

    // Navigation property
    public InventoryItem? InventoryItem { get; set; }
}
