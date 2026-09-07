using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models.MaintenanceTickets;

namespace SmartSpace.API.DTOs.MaintenanceTickets;

/// <summary>Bound from multipart/form-data so text fields and photo(s) arrive in one request.</summary>
public class TicketCreationRequestDto
{
    [Required]
    public Guid UnitId { get; set; }

    [Required]
    [MinLength(5, ErrorMessage = "Please provide a more detailed description.")]
    public string Description { get; set; } = string.Empty;

    [Required]
    public UrgencyLevel UrgencyLevel { get; set; }

    /// <summary>One or more photos taken from the tenant's device camera.</summary>
    public List<IFormFile>? Images { get; set; }
}