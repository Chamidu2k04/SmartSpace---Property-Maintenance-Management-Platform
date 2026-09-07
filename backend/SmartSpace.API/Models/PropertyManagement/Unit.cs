using SmartSpace.API.Models;

namespace SmartSpace.API.Models.PropertyManagement;

public class Unit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PropertyId { get; set; }
    public string UnitNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public UnitStatus Status { get; set; } = UnitStatus.Vacant;

    public Property Property { get; set; } = null!;
    public List<Lease> Leases { get; set; } = new();
}
