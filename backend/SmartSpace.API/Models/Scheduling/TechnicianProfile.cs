using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSpace.API.Models.Scheduling;

/// <summary>
/// Entity representing a technician profile in the TechnicianProfiles database table.
/// </summary>
[Table("TechnicianProfiles")]
public class TechnicianProfile
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public TradeSpecialty TradeSpecialty { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal HourlyRate { get; set; }
}
