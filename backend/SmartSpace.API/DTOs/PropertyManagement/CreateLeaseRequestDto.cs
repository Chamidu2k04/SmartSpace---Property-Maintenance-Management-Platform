using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.PropertyManagement;

public class CreateLeaseRequestDto
{
    [Required(ErrorMessage = "UnitId is required.")]
    public Guid UnitId { get; set; }

    [Required(ErrorMessage = "TenantId is required.")]
    public Guid TenantId { get; set; }

    [Required(ErrorMessage = "StartDate is required.")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required.")]
    public DateTime EndDate { get; set; }

    [Required(ErrorMessage = "MonthlyRent is required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Monthly rent must be greater than zero.")]
    public decimal MonthlyRent { get; set; }
}
