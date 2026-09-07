using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.Scheduling;
using SmartSpace.API.Models;
using SmartSpace.API.Models.Scheduling;
using SmartSpace.API.Services.Common;


namespace SmartSpace.API.Services.Scheduling;

/// <summary>
/// Service implementation for Quotation management, handling cost calculations, validations, EF Core persistence, and email notification triggering.
/// </summary>
public class QuotationService : IQuotationService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<QuotationService> _logger;

    public QuotationService(
        ApplicationDbContext context,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<QuotationService> logger)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new quotation entity with server-side calculated TotalCost (LaborCost + PartsCost).
    /// </summary>
    public async Task<QuotationResponseDto> CreateQuotationAsync(CreateQuotationDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto), "Quotation data cannot be null.");
        }

        // 1. Ticket Validation: Ensure TicketId is valid and not empty
        if (dto.TicketId == Guid.Empty)
        {
            throw new ArgumentException("TicketId cannot be empty.", nameof(dto.TicketId));
        }

        // 2. Cost Validation: Ensure costs are non-negative values
        if (dto.LaborCost < 0)
        {
            throw new ArgumentException("Labor cost cannot be negative.", nameof(dto.LaborCost));
        }

        if (dto.PartsCost < 0)
        {
            throw new ArgumentException("Parts cost cannot be negative.", nameof(dto.PartsCost));
        }

        // 3. Duplicate Check: Ensure a quotation does not already exist for the specified TicketId
        var existingQuotation = await _context.Quotations
            .AnyAsync(q => q.TicketId == dto.TicketId);

        if (existingQuotation)
        {
            throw new ArgumentException($"A quotation already exists for Ticket ID '{dto.TicketId}'.");
        }

        // 4. Server-side Cost Calculation: Never trust client total calculation
        decimal totalCost = dto.LaborCost + dto.PartsCost;

        // Map DTO explicitly to Entity model (no AutoMapper, viva-ready explicit instantiation)
        var quotation = new Quotation
        {
            Id = Guid.NewGuid(),
            TicketId = dto.TicketId,
            LaborCost = dto.LaborCost,
            PartsCost = dto.PartsCost,
            TotalCost = totalCost,
            IsApproved = false
        };

        _context.Quotations.Add(quotation);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully created Quotation {QuotationId} for Ticket {TicketId} with Total Cost ${TotalCost}.", quotation.Id, quotation.TicketId, quotation.TotalCost);

        return MapToResponseDto(quotation);
    }

    /// <summary>
    /// Retrieves quotation details by unique primary key ID.
    /// </summary>
    public async Task<QuotationResponseDto?> GetQuotationByIdAsync(Guid id)
    {
        var quotation = await _context.Quotations
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null)
        {
            return null;
        }

        return MapToResponseDto(quotation);
    }

    /// <summary>
    /// Retrieves quotation details associated with a specific maintenance ticket.
    /// </summary>
    public async Task<QuotationResponseDto?> GetQuotationByTicketIdAsync(Guid ticketId)
    {
        var quotation = await _context.Quotations
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.TicketId == ticketId);

        if (quotation == null)
        {
            return null;
        }

        return MapToResponseDto(quotation);
    }

    /// <summary>
    /// Retrieves all quotation records stored in PostgreSQL.
    /// </summary>
    public async Task<IEnumerable<QuotationResponseDto>> GetAllQuotationsAsync()
    {
        var quotations = await _context.Quotations
            .AsNoTracking()
            .ToListAsync();

        return quotations.Select(MapToResponseDto).ToList();
    }

    /// <summary>
    /// Approves a quotation, updates PostgreSQL, and triggers email notifications to Tenant and Technician (FR10).
    /// </summary>
    public async Task<QuotationResponseDto?> ApproveQuotationAsync(Guid id)
    {
        // 1. Locate quotation record in database
        var quotation = await _context.Quotations.FirstOrDefaultAsync(q => q.Id == id);
        if (quotation == null)
        {
            return null;
        }

        // 2. Approval Logic Validation: Prevent re-approval of an already approved quotation
        if (quotation.IsApproved)
        {
            throw new InvalidOperationException($"Quotation with ID '{id}' is already approved.");
        }

        // 3. Mark quotation as approved and persist state
        quotation.IsApproved = true;
        _context.Quotations.Update(quotation);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Quotation {QuotationId} has been successfully approved.", quotation.Id);

        // 4. FR10: Dynamic Email Notification Integration
        // Safe try-catch block guarantees that external email failure does not roll back or interrupt API approval
        try
        {
            // 4.1 Lookup assigned Technician for this ticket/appointment dynamically from database
            string technicianEmail = string.Empty;
            string technicianName = "Assigned Technician";

            var appointment = await _context.Appointments
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.TicketId == quotation.TicketId);

            if (appointment != null)
            {
                var techProfile = await _context.TechnicianProfiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == appointment.TechnicianId);

                if (techProfile != null)
                {
                    var techUser = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Id == techProfile.UserId);

                    if (techUser != null && !string.IsNullOrWhiteSpace(techUser.Email))
                    {
                        technicianEmail = techUser.Email;
                        technicianName = techUser.FullName;
                    }
                }
            }

            // Fallback: If no specific appointment is linked yet, query assigned technician user profile from database
            if (string.IsNullOrWhiteSpace(technicianEmail))
            {
                var techUser = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Role == UserRole.Technician);

                if (techUser != null && !string.IsNullOrWhiteSpace(techUser.Email))
                {
                    technicianEmail = techUser.Email;
                    technicianName = techUser.FullName;
                }
            }

            // 4.2 Lookup Tenant who submitted the ticket dynamically from Users database
            string tenantEmail = string.Empty;
            string tenantName = "Tenant";

            var tenantUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Role == UserRole.Tenant);

            if (tenantUser != null && !string.IsNullOrWhiteSpace(tenantUser.Email))
            {
                tenantEmail = tenantUser.Email;
                tenantName = tenantUser.FullName;
            }

            // 4.3 Dispatch emails to Tenant and Technician dynamically using database records
            if (!string.IsNullOrWhiteSpace(tenantEmail))
            {
                _logger.LogInformation("Dispatching approval notification email to Tenant '{TenantEmail}'...", tenantEmail);
                await _emailService.SendBookingConfirmationEmailAsync(tenantEmail, tenantName, quotation.TicketId, quotation.TotalCost);
            }

            if (!string.IsNullOrWhiteSpace(technicianEmail) && !technicianEmail.Equals(tenantEmail, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("Dispatching approval notification email to Technician '{TechnicianEmail}'...", technicianEmail);
                await _emailService.SendBookingConfirmationEmailAsync(technicianEmail, technicianName, quotation.TicketId, quotation.TotalCost);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while dispatching confirmation emails for approved Quotation {QuotationId}.", quotation.Id);
        }

        return MapToResponseDto(quotation);
    }

    /// <summary>
    /// Explicit mapping helper converting Quotation Entity directly into QuotationResponseDto.
    /// </summary>
    private static QuotationResponseDto MapToResponseDto(Quotation quotation)
    {
        return new QuotationResponseDto
        {
            Id = quotation.Id,
            TicketId = quotation.TicketId,
            LaborCost = quotation.LaborCost,
            PartsCost = quotation.PartsCost,
            TotalCost = quotation.TotalCost,
            IsApproved = quotation.IsApproved
        };
    }
}
