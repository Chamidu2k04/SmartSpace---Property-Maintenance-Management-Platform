using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models.PropertyManagement;

namespace SmartSpace.API.DTOs.PropertyManagement;

public class UpdateUnitRequestDto
{
    [Required(ErrorMessage = "Unit number is required.")]
    public string UnitNumber { get; set; } = string.Empty;

    public int Floor { get; set; }

    public UnitStatus Status { get; set; }
}
