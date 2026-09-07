using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.Scheduling;

/// <summary>
/// Data Transfer Object for submitting a new quotation request.
/// </summary>
public class CreateQuotationDto
{
    /// <summary>
    /// Unique identifier of the maintenance ticket associated with this quotation.
    /// </summary>
    [Required(ErrorMessage = "TicketId is required.")]
    public Guid TicketId { get; set; }

    /// <summary>
    /// Estimated labor cost for performing the maintenance work.
    /// </summary>
    [Required(ErrorMessage = "LaborCost is required.")]
    [Range(0, (double)decimal.MaxValue, ErrorMessage = "LaborCost must be a non-negative value.")]
    public decimal LaborCost { get; set; }

    /// <summary>
    /// Estimated parts and materials cost for the maintenance work.
    /// </summary>
    [Required(ErrorMessage = "PartsCost is required.")]
    [Range(0, (double)decimal.MaxValue, ErrorMessage = "PartsCost must be a non-negative value.")]
    public decimal PartsCost { get; set; }
}
