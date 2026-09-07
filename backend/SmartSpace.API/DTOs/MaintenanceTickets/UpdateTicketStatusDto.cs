using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models.MaintenanceTickets;

namespace SmartSpace.API.DTOs.MaintenanceTickets;

public class UpdateTicketStatusDto
{
    [Required]
    public TicketStatus Status { get; set; }
}