using Microsoft.AspNetCore.Mvc;
using SmartSpace.API.DTOs.Scheduling;
using SmartSpace.API.Services.Scheduling;

namespace SmartSpace.API.Controllers.Scheduling;

/// <summary>
/// REST API Controller managing Technician Profile endpoints.
/// </summary>
[ApiController]
[Route("api/technicians")]
public class TechniciansController : ControllerBase
{
    private readonly ITechnicianService _technicianService;

    public TechniciansController(ITechnicianService technicianService)
    {
        _technicianService = technicianService;
    }

    /// <summary>
    /// Add a new technician profile (POST /api/technicians).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TechnicianProfileResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TechnicianProfileResponseDto>> CreateTechnician([FromBody] CreateTechnicianProfileDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var createdTechnician = await _technicianService.CreateTechnicianAsync(dto);
            return CreatedAtAction(nameof(GetTechnicianById), new { id = createdTechnician.Id }, createdTechnician);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// View technician details by ID (GET /api/technicians/{id}).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TechnicianProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TechnicianProfileResponseDto>> GetTechnicianById(Guid id)
    {
        var technician = await _technicianService.GetTechnicianByIdAsync(id);
        if (technician == null)
        {
            return NotFound(new { message = $"Technician profile with ID '{id}' was not found." });
        }

        return Ok(technician);
    }

    /// <summary>
    /// View all technician profiles (GET /api/technicians).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TechnicianProfileResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TechnicianProfileResponseDto>>> GetAllTechnicians()
    {
        var technicians = await _technicianService.GetAllTechniciansAsync();
        return Ok(technicians);
    }

    /// <summary>
    /// Update technician information (PUT /api/technicians/{id}).
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TechnicianProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TechnicianProfileResponseDto>> UpdateTechnician(Guid id, [FromBody] UpdateTechnicianProfileDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updatedTechnician = await _technicianService.UpdateTechnicianAsync(id, dto);
            if (updatedTechnician == null)
            {
                return NotFound(new { message = $"Technician profile with ID '{id}' was not found." });
            }

            return Ok(updatedTechnician);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Remove or deactivate a technician profile (DELETE /api/technicians/{id}).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTechnician(Guid id)
    {
        var result = await _technicianService.DeleteTechnicianAsync(id);
        if (!result)
        {
            return NotFound(new { message = $"Technician profile with ID '{id}' was not found." });
        }

        return NoContent();
    }
}
