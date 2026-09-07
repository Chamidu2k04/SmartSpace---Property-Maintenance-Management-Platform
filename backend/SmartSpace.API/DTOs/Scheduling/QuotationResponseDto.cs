namespace SmartSpace.API.DTOs.Scheduling;

/// <summary>
/// Data Transfer Object representing a quotation response payload.
/// </summary>
public class QuotationResponseDto
{
    /// <summary>
    /// Unique identifier of the quotation.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Unique identifier of the associated maintenance ticket.
    /// </summary>
    public Guid TicketId { get; set; }

    /// <summary>
    /// Estimated labor cost.
    /// </summary>
    public decimal LaborCost { get; set; }

    /// <summary>
    /// Estimated parts and materials cost.
    /// </summary>
    public decimal PartsCost { get; set; }

    /// <summary>
    /// Calculated total cost (LaborCost + PartsCost).
    /// </summary>
    public decimal TotalCost { get; set; }

    /// <summary>
    /// Indicates whether the quotation has been approved by a Property Manager.
    /// </summary>
    public bool IsApproved { get; set; }
}
