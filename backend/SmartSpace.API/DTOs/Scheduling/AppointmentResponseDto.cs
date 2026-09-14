using SmartSpace.API.Models.Scheduling;

namespace SmartSpace.API.DTOs.Scheduling;

/// <summary>
/// Data Transfer Object representing an appointment response payload.
/// </summary>
public class AppointmentResponseDto
{
    /// <summary>
    /// Unique identifier of the appointment.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identifier of the associated maintenance ticket.
    /// </summary>
    public Guid TicketId { get; set; }

    /// <summary>
    /// Identifier of the assigned technician profile.
    /// </summary>
    public Guid TechnicianId { get; set; }

    /// <summary>
    /// Scheduled date for the maintenance appointment.
    /// </summary>
    public DateOnly ScheduledDate { get; set; }

    /// <summary>
    /// Scheduled start time for the appointment.
    /// </summary>
    public TimeOnly StartTime { get; set; }

    /// <summary>
    /// Scheduled end time for the appointment.
    /// </summary>
    public TimeOnly EndTime { get; set; }

    /// <summary>
    /// Current lifecycle status of the appointment.
    /// </summary>
    public AppointmentStatus Status { get; set; }

    /// <summary>
    /// Name of the property associated with the maintenance appointment.
    /// </summary>
    public string PropertyName { get; set; } = string.Empty;

    /// <summary>
    /// Unit number associated with the maintenance appointment.
    /// </summary>
    public string UnitNumber { get; set; } = string.Empty;

    /// <summary>
    /// Floor number associated with the maintenance unit.
    /// </summary>
    public int Floor { get; set; }
}
