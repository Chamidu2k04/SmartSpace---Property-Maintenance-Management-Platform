using SmartSpace.API.Models;

namespace SmartSpace.API.Models.PropertyManagement;

public class Lease
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UnitId { get; set; }
    public Guid TenantId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public bool IsActive { get; set; } = true;

    public Unit Unit { get; set; } = null!;
    public User Tenant { get; set; } = null!;
}
