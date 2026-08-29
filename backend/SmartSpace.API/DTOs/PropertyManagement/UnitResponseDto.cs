namespace SmartSpace.API.DTOs.PropertyManagement;

public class UnitResponseDto
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public string UnitNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PropertyName { get; set; }
}
