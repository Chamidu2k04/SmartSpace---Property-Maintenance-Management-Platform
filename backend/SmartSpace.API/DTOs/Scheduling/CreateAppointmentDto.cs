using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.Scheduling;

/// <summary>
/// Data Transfer Object for creating a new appointment.
/// </summary>
public class CreateAppointmentDto
{
    /// <summary>
    /// Identifier of the associated maintenance ticket.
    /// </summary>
    [Required(ErrorMessage = "TicketId is required.")]
    public Guid TicketId { get; set; }

    /// <summary>
    /// Identifier of the assigned technician profile.
    /// </summary>
    [Required(ErrorMessage = "TechnicianId is required.")]
    public Guid TechnicianId { get; set; }

    /// <summary>
    /// Scheduled date for the maintenance appointment.
    /// </summary>
    [Required(ErrorMessage = "ScheduledDate is required.")]
    public DateOnly ScheduledDate { get; set; }

    /// <summary>
    /// Scheduled start time for the appointment.
    /// </summary>
    [Required(ErrorMessage = "StartTime is required.")]
    public TimeOnly StartTime { get; set; }

    /// <summary>
    /// Scheduled end time for the appointment.
    /// </summary>
    [Required(ErrorMessage = "EndTime is required.")]
    public TimeOnly EndTime { get; set; }
}
