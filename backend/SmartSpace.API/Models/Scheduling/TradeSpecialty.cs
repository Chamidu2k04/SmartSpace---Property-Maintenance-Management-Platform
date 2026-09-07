using System.Text.Json.Serialization;

namespace SmartSpace.API.Models.Scheduling;

/// <summary>
/// Defines the trade specialty area of a technician.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TradeSpecialty
{
    Plumber,
    Electrician,
    Handyman
}
