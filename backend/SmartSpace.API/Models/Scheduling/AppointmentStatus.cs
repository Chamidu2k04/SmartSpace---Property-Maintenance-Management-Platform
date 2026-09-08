using System.Text.Json.Serialization;

namespace SmartSpace.API.Models.Scheduling;

/// <summary>
/// Defines the current status of a scheduled maintenance appointment.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AppointmentStatus
{
    Scheduled,
    InProgress,
    Completed,
    Cancelled
}
