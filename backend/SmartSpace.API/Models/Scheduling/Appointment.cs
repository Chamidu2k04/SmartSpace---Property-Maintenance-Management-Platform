using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSpace.API.Models.Scheduling;

/// <summary>
/// Entity representing a maintenance appointment in the Appointments database table.
/// </summary>
[Table("Appointments")]
public class Appointment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TicketId { get; set; }

    [Required]
    public Guid TechnicianId { get; set; }

    [Required]
    public DateOnly ScheduledDate { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }

    [Required]
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
}
