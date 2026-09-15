using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// Request payload sent by the Flutter mobile app when a Technician marks a job as completed.
/// </summary>
public class ConsumePartsRequestDto
{
    /// <summary>
    /// The ticket ID for which the parts were used.
    /// </summary>
    [Required(ErrorMessage = "TicketId is required.")]
    public Guid TicketId { get; set; }

    /// <summary>
    /// List of parts and quantities used for this maintenance ticket.
    /// </summary>
    [Required(ErrorMessage = "UsedParts list is required.")]
    [MinLength(1, ErrorMessage = "At least one used part must be specified.")]
    public List<PartUsageDto> UsedParts { get; set; } = new();
}
