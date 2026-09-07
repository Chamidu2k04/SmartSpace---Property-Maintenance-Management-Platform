using Microsoft.AspNetCore.Mvc;
using SmartSpace.API.DTOs.Scheduling;
using SmartSpace.API.Services.Scheduling;

namespace SmartSpace.API.Controllers.Scheduling;

/// <summary>
/// REST API Controller managing Appointment scheduling endpoints.
/// </summary>
[ApiController]
[Route("api/appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    /// <summary>
    /// Creates a new maintenance appointment (POST /api/appointments).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AppointmentResponseDto>> CreateAppointment([FromBody] CreateAppointmentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var createdAppointment = await _appointmentService.CreateAppointmentAsync(dto);
            return CreatedAtAction(nameof(GetAppointmentById), new { id = createdAppointment.Id }, createdAppointment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves all scheduled maintenance appointments (GET /api/appointments).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AppointmentResponseDto>>> GetAllAppointments()
    {
        var appointments = await _appointmentService.GetAllAppointmentsAsync();
        return Ok(appointments);
    }

    /// <summary>
    /// Retrieves appointment details by ID (GET /api/appointments/{id}).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentResponseDto>> GetAppointmentById(Guid id)
    {
        var appointment = await _appointmentService.GetAppointmentByIdAsync(id);
        if (appointment == null)
        {
            return NotFound(new { message = $"Appointment with ID '{id}' was not found." });
        }

        return Ok(appointment);
    }

    /// <summary>
    /// Retrieves all appointments assigned to a specific technician (GET /api/appointments/technician/{technicianId}).
    /// </summary>
    [HttpGet("technician/{technicianId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AppointmentResponseDto>>> GetAppointmentsByTechnicianId(Guid technicianId)
    {
        var appointments = await _appointmentService.GetAppointmentsByTechnicianIdAsync(technicianId);
        return Ok(appointments);
    }

    /// <summary>
    /// Updates the scheduled date and time range for an existing appointment (PUT /api/appointments/{id}/schedule).
    /// </summary>
    [HttpPut("{id:guid}/schedule")]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentResponseDto>> UpdateSchedule(Guid id, [FromBody] UpdateAppointmentScheduleDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updatedAppointment = await _appointmentService.UpdateScheduleAsync(id, dto);
            if (updatedAppointment == null)
            {
                return NotFound(new { message = $"Appointment with ID '{id}' was not found." });
            }

            return Ok(updatedAppointment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Soft-cancels an existing appointment (PUT /api/appointments/{id}/cancel).
    /// </summary>
    [HttpPut("{id:guid}/cancel")]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentResponseDto>> CancelAppointment(Guid id)
    {
        var success = await _appointmentService.CancelAppointmentAsync(id);
        if (!success)
        {
            return NotFound(new { message = $"Appointment with ID '{id}' was not found." });
        }

        var cancelledAppointment = await _appointmentService.GetAppointmentByIdAsync(id);
        return Ok(cancelledAppointment);
    }
}
