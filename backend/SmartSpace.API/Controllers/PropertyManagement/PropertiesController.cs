using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSpace.API.DTOs.PropertyManagement;
using SmartSpace.API.Models;
using SmartSpace.API.Services.PropertyManagement;

namespace SmartSpace.API.Controllers.PropertyManagement;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService _propertyService;

    public PropertiesController(IPropertyService propertyService)
    {
        _propertyService = propertyService;
    }

    /// <summary>
    /// Creates a new property with optional initial units. Restricted to PropertyManager role.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.PropertyManager))]
    public async Task<ActionResult<PropertyResponseDto>> CreateProperty([FromBody] CreatePropertyRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var property = await _propertyService.CreatePropertyAsync(request);
        return CreatedAtAction(nameof(GetPropertyById), new { id = property.Id }, property);
    }

    /// <summary>
    /// Gets all properties and their units. Restricted to PropertyManager role.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = nameof(UserRole.PropertyManager))]
    public async Task<ActionResult<List<PropertyResponseDto>>> GetAllProperties()
    {
        var properties = await _propertyService.GetAllPropertiesAsync();
        return Ok(properties);
    }

    /// <summary>
    /// Gets a single property by ID with its units.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PropertyResponseDto>> GetPropertyById(Guid id)
    {
        var property = await _propertyService.GetPropertyByIdAsync(id);
        if (property == null)
        {
            return NotFound(new { message = $"Property with ID '{id}' was not found." });
        }

        return Ok(property);
    }

    /// <summary>
    /// Adds a unit to an existing property. Restricted to PropertyManager role.
    /// </summary>
    [HttpPost("{propertyId:guid}/units")]
    [Authorize(Roles = nameof(UserRole.PropertyManager))]
    public async Task<ActionResult<UnitResponseDto>> AddUnit(Guid propertyId, [FromBody] CreateUnitRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        request.PropertyId = propertyId;
        try
        {
            var unit = await _propertyService.CreateUnitAsync(request);
            return Ok(unit);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
