using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.PropertyManagement;

public class UpdateLeaseRequestDto
{
    [Required] public DateTime StartDate { get; set; }
    [Required] public DateTime EndDate { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Monthly rent must be greater than zero.")]
    public decimal MonthlyRent { get; set; }
}
