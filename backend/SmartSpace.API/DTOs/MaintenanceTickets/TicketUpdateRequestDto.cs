using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models.MaintenanceTickets;

namespace SmartSpace.API.DTOs.MaintenanceTickets;

public class TicketUpdateRequestDto
{
    [Required]
    [MinLength(5)]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public UrgencyLevel UrgencyLevel { get; set; }
}
