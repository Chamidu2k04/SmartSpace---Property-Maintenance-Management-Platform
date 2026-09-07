using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSpace.API.DTOs.Scheduling;
using SmartSpace.API.Services.Scheduling;

namespace SmartSpace.API.Controllers.Scheduling;

/// <summary>
/// REST API Controller managing Quotation creation, retrieval, and approval workflows.
/// </summary>
[ApiController]
[Route("api/quotations")]
public class QuotationsController : ControllerBase
{
    private readonly IQuotationService _quotationService;

    public QuotationsController(IQuotationService quotationService)
    {
        _quotationService = quotationService;
    }

    /// <summary>
    /// Creates a new maintenance cost quotation (POST /api/quotations).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(QuotationResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<QuotationResponseDto>> CreateQuotation([FromBody] CreateQuotationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var createdQuotation = await _quotationService.CreateQuotationAsync(dto);
            return CreatedAtAction(nameof(GetQuotationById), new { id = createdQuotation.Id }, createdQuotation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves all cost quotations (GET /api/quotations).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<QuotationResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<QuotationResponseDto>>> GetAllQuotations()
    {
        var quotations = await _quotationService.GetAllQuotationsAsync();
        return Ok(quotations);
    }

    /// <summary>
    /// Retrieves quotation details by unique quotation ID (GET /api/quotations/{id}).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(QuotationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuotationResponseDto>> GetQuotationById(Guid id)
    {
        var quotation = await _quotationService.GetQuotationByIdAsync(id);
        if (quotation == null)
        {
            return NotFound(new { message = $"Quotation with ID '{id}' was not found." });
        }

        return Ok(quotation);
    }

    /// <summary>
    /// Retrieves a quotation associated with a specific maintenance ticket (GET /api/quotations/ticket/{ticketId}).
    /// </summary>
    [HttpGet("ticket/{ticketId:guid}")]
    [ProducesResponseType(typeof(QuotationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuotationResponseDto>> GetQuotationByTicketId(Guid ticketId)
    {
        var quotation = await _quotationService.GetQuotationByTicketIdAsync(ticketId);
        if (quotation == null)
        {
            return NotFound(new { message = $"Quotation for Maintenance Ticket ID '{ticketId}' was not found." });
        }

        return Ok(quotation);
    }

    /// <summary>
    /// Approves a cost quotation by ID (POST /api/quotations/{id}/approve).
    /// Access strictly restricted to authenticated Property Managers.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "PropertyManager")]
    [ProducesResponseType(typeof(QuotationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuotationResponseDto>> ApproveQuotation(Guid id)
    {
        // Explicit Role Validation: Ensure only logged-in Property Managers can approve quotations
        if (User.Identity?.IsAuthenticated == true && !User.IsInRole("PropertyManager"))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new 
            { 
                message = "Access denied: Only Property Managers are authorized to approve maintenance quotations." 
            });
        }

        try
        {
            var approvedQuotation = await _quotationService.ApproveQuotationAsync(id);
            if (approvedQuotation == null)
            {
                return NotFound(new { message = $"Quotation with ID '{id}' was not found." });
            }

            return Ok(approvedQuotation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
