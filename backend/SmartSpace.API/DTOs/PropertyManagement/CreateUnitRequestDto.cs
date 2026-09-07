using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models.PropertyManagement;

namespace SmartSpace.API.DTOs.PropertyManagement;

public class CreateUnitRequestDto
{
    [Required]
    public Guid PropertyId { get; set; }

    [Required(ErrorMessage = "Unit number is required.")]
    public string UnitNumber { get; set; } = string.Empty;

    public int Floor { get; set; }

    public UnitStatus Status { get; set; } = UnitStatus.Vacant;
}
