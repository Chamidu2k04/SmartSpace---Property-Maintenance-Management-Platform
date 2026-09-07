namespace SmartSpace.API.Models.MaintenanceTickets;

public class TicketImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public MaintenanceTicket Ticket { get; set; } = null!;
}