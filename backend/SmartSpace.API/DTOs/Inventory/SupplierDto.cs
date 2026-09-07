namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// Data Transfer Object for returning supplier information.
/// </summary>
public class SupplierDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string? Phone { get; set; }
}
