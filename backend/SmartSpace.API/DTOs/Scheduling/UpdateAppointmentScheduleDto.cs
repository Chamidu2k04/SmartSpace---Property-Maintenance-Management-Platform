using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models.Scheduling;

namespace SmartSpace.API.DTOs.Scheduling;

/// <summary>
/// Data Transfer Object for updating an existing appointment's date, time, or status details.
/// </summary>
public class UpdateAppointmentScheduleDto
{
    /// <summary>
    /// Updated date for the appointment.
    /// </summary>
    [Required(ErrorMessage = "ScheduledDate is required.")]
    public DateOnly ScheduledDate { get; set; }

    /// <summary>
    /// Updated start time for the appointment.
    /// </summary>
    [Required(ErrorMessage = "StartTime is required.")]
    public TimeOnly StartTime { get; set; }

    /// <summary>
    /// Updated end time for the appointment.
    /// </summary>
    [Required(ErrorMessage = "EndTime is required.")]
    public TimeOnly EndTime { get; set; }

    /// <summary>
    /// Optional updated status for the appointment (Scheduled, InProgress, Completed, Cancelled).
    /// </summary>
    public AppointmentStatus? Status { get; set; }

    /// <summary>
    /// Optional updated technician profile ID to reassign the appointment to a different technician.
    /// </summary>
    public Guid? TechnicianId { get; set; }
}
