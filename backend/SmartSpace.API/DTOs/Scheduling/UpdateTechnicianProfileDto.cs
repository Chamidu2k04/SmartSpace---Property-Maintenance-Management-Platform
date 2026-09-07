using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models.Scheduling;

namespace SmartSpace.API.DTOs.Scheduling;

/// <summary>
/// Data Transfer Object for updating technician profile and user details.
/// </summary>
public class UpdateTechnicianProfileDto
{
    /// <summary>
    /// Optional updated email address for the technician user.
    /// </summary>
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters.")]
    public string? Email { get; set; }

    /// <summary>
    /// Optional updated full name for the technician user.
    /// </summary>
    [StringLength(150, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 150 characters.")]
    public string? FullName { get; set; }

    /// <summary>
    /// Optional updated password for the technician user account.
    /// </summary>
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string? Password { get; set; }

    [Required(ErrorMessage = "TradeSpecialty is required.")]
    [EnumDataType(typeof(TradeSpecialty), ErrorMessage = "Invalid trade specialty.")]
    public TradeSpecialty TradeSpecialty { get; set; }

    [Required(ErrorMessage = "HourlyRate is required.")]
    [Range(0.01, 10000.00, ErrorMessage = "Hourly rate must be greater than 0 & less than 10000.")]
    public decimal HourlyRate { get; set; }
}
