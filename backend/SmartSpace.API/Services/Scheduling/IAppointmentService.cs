using SmartSpace.API.DTOs.Scheduling;

namespace SmartSpace.API.Services.Scheduling;

/// <summary>
/// Interface defining business logic operations for appointment management.
/// </summary>
public interface IAppointmentService
{
    /// <summary>
    /// Creates a new maintenance appointment after validating time intervals, ticket, technician, and schedule conflicts.
    /// </summary>
    Task<AppointmentResponseDto> CreateAppointmentAsync(CreateAppointmentDto dto);

    /// <summary>
    /// Retrieves a specific appointment by its unique identifier.
    /// </summary>
    Task<AppointmentResponseDto?> GetAppointmentByIdAsync(Guid id);

    /// <summary>
    /// Retrieves all recorded appointments.
    /// </summary>
    Task<IEnumerable<AppointmentResponseDto>> GetAllAppointmentsAsync();

    /// <summary>
    /// Retrieves all appointments assigned to a specific technician.
    /// </summary>
    Task<IEnumerable<AppointmentResponseDto>> GetAppointmentsByTechnicianIdAsync(Guid technicianId);

    /// <summary>
    /// Updates the scheduled date and time range for an existing appointment.
    /// </summary>
    Task<AppointmentResponseDto?> UpdateScheduleAsync(Guid id, UpdateAppointmentScheduleDto dto);

    /// <summary>
    /// Soft-cancels an appointment by updating its status to Cancelled.
    /// </summary>
    Task<bool> CancelAppointmentAsync(Guid id);
}
