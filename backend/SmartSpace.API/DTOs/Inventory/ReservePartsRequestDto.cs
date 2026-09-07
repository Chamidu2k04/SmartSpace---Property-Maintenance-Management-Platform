using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// DTO for requesting a parts reservation for a maintenance ticket.
/// </summary>
public class ReservePartsRequestDto
{
    [Required(ErrorMessage = "Ticket ID is required.")]
    public Guid TicketId { get; set; }

    [Required(ErrorMessage = "Item ID is required.")]
    public Guid ItemId { get; set; }

    [Required(ErrorMessage = "Quantity is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; }
}
