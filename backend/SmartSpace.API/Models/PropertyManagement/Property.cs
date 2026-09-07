namespace SmartSpace.API.Models.PropertyManagement;

public class Property
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;

    public List<Unit> Units { get; set; } = new();
}
