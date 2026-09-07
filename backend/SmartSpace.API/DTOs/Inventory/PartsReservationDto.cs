using SmartSpace.API.Models.Inventory;

namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// DTO for returning details of a parts reservation.
/// </summary>
public class PartsReservationDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int QuantityReserved { get; set; }
    public ReservationStatus Status { get; set; }
}
