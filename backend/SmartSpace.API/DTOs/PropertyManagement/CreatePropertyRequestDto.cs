using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.PropertyManagement;

public class CreatePropertyRequestDto
{
    [Required(ErrorMessage = "Property name is required.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Property address is required.")]
    public string Address { get; set; } = string.Empty;

    [Required(ErrorMessage = "City is required.")]
    public string City { get; set; } = string.Empty;

    public List<CreateUnitSubRequestDto>? InitialUnits { get; set; }
}

public class CreateUnitSubRequestDto
{
    [Required(ErrorMessage = "Unit number is required.")]
    public string UnitNumber { get; set; } = string.Empty;

    public int Floor { get; set; }
}
