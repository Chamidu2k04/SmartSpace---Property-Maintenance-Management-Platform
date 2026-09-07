using SmartSpace.API.DTOs.Scheduling;

namespace SmartSpace.API.Services.Scheduling;

/// <summary>
/// Service interface defining business logic operations for Quotation management.
/// </summary>
public interface IQuotationService
{
    /// <summary>
    /// Creates a new quotation after validating business rules and calculating total costs.
    /// </summary>
    Task<QuotationResponseDto> CreateQuotationAsync(CreateQuotationDto dto);

    /// <summary>
    /// Retrieves quotation details by unique identifier.
    /// </summary>
    Task<QuotationResponseDto?> GetQuotationByIdAsync(Guid id);

    /// <summary>
    /// Retrieves a quotation by its associated maintenance ticket ID.
    /// </summary>
    Task<QuotationResponseDto?> GetQuotationByTicketIdAsync(Guid ticketId);

    /// <summary>
    /// Retrieves all quotations registered in the system.
    /// </summary>
    Task<IEnumerable<QuotationResponseDto>> GetAllQuotationsAsync();

    /// <summary>
    /// Approves a quotation, marks it as approved, and triggers email notifications (FR10).
    /// </summary>
    Task<QuotationResponseDto?> ApproveQuotationAsync(Guid id);
}
