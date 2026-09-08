using SmartSpace.API.Models.Scheduling;

namespace SmartSpace.API.DTOs.Scheduling;

/// <summary>
/// Data Transfer Object for returning technician profile details.
/// </summary>
public class TechnicianProfileResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public TradeSpecialty TradeSpecialty { get; set; }
    public decimal HourlyRate { get; set; }
}
