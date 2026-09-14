using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSpace.API.DTOs.MaintenanceTickets;
using SmartSpace.API.Services.MaintenanceTickets;
using TicketStatus = SmartSpace.API.Models.MaintenanceTickets.TicketStatus;

namespace SmartSpace.API.Controllers.MaintenanceTickets;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpPost]
    [Authorize(Roles = "Tenant")]
    [RequestSizeLimit(50_000_000)]
    public async Task<IActionResult> CreateTicket([FromForm] TicketCreationRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var tenantId = GetUserId();

        try
        {
            var created = await _ticketService.CreateTicketAsync(tenantId, dto);
            return CreatedAtAction(nameof(GetTicketById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-tickets")]
    [Authorize(Roles = "Tenant")]
    public async Task<ActionResult<List<TicketSummaryResponseDto>>> GetMyTickets()
    {
        var tenantId = GetUserId();
        var tickets = await _ticketService.GetTicketsForTenantAsync(tenantId);
        return Ok(tickets);
    }

    [HttpGet]
    [Authorize(Roles = "PropertyManager")]
    public async Task<ActionResult<List<TicketSummaryResponseDto>>> GetAllTickets([FromQuery] TicketStatus? status)
    {
        var tickets = await _ticketService.GetAllTicketsAsync(status);
        return Ok(tickets);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDetailResponseDto>> GetTicketById(Guid id)
    {
        var userId = GetUserId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        var ticket = await _ticketService.GetTicketByIdAsync(id, userId, role);

        if (ticket == null)
        {
            return NotFound();
        }

        return Ok(ticket);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Tenant")]
    public async Task<IActionResult> UpdateTicket(Guid id, [FromBody] TicketUpdateRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var tenantId = GetUserId();

        try
        {
            var success = await _ticketService.UpdateTicketAsync(id, tenantId, request);
            if (!success)
            {
                return NotFound(new { message = "Ticket not found." });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "PropertyManager,Technician")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTicketStatusDto dto)
    {
        var updated = await _ticketService.UpdateTicketStatusAsync(id, dto.Status);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    /// <summary>
    /// DELETE /api/tickets/{id}
    /// Soft-deletes a ticket (sets IsDeleted = true, keeps the row for audit history).
    /// PropertyManager only.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "PropertyManager")]
    public async Task<IActionResult> DeleteTicket(Guid id)
    {
        var deleted = await _ticketService.DeleteTicketAsync(id);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    private Guid GetUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idClaim) || !Guid.TryParse(idClaim, out var userId))
        {
            throw new UnauthorizedAccessException("No valid user id found in token.");
        }
        return userId;
    }
}