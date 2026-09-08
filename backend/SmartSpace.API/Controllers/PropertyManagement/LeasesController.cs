using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSpace.API.DTOs.PropertyManagement;
using SmartSpace.API.Models;
using SmartSpace.API.Services.PropertyManagement;

namespace SmartSpace.API.Controllers.PropertyManagement;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeasesController : ControllerBase
{
    private readonly ILeaseService _leaseService;

    public LeasesController(ILeaseService leaseService)
    {
        _leaseService = leaseService;
    }

    /// <summary>
    /// Creates a lease for a tenant and unit. Restricted to PropertyManager role.
    /// Prevents double-booking if unit status is already Occupied.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.PropertyManager))]
    public async Task<ActionResult<LeaseResponseDto>> CreateLease([FromBody] CreateLeaseRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var lease = await _leaseService.CreateLeaseAsync(request);
            return Ok(lease);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Fetches active lease details for the currently authenticated Tenant.
    /// </summary>
    [HttpGet("my-active")]
    [Authorize(Roles = nameof(UserRole.Tenant))]
    public async Task<ActionResult<LeaseResponseDto>> GetMyActiveLease()
    {
        var tenantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out var tenantId))
        {
            return Unauthorized(new { message = "Invalid or missing tenant authentication token." });
        }

        var lease = await _leaseService.GetActiveLeaseForTenantAsync(tenantId);
        if (lease == null)
        {
            return NotFound(new { message = "No active lease found for this tenant." });
        }

        return Ok(lease);
    }

    /// <summary>
    /// Gets all leases. Restricted to PropertyManager.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = nameof(UserRole.PropertyManager))]
    public async Task<ActionResult<List<LeaseResponseDto>>> GetAllLeases()
    {
        var leases = await _leaseService.GetAllLeasesAsync();
        return Ok(leases);
    }
}
