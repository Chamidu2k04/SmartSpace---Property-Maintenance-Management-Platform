using SmartSpace.API.Models.PropertyManagement;

namespace SmartSpace.API.Models.MaintenanceTickets;

public class MaintenanceTicket
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Guid UnitId { get; set; }

    public string Description { get; set; } = string.Empty;
    public UrgencyLevel UrgencyLevel { get; set; } = UrgencyLevel.Low;
    public TicketStatus Status { get; set; } = TicketStatus.Submitted;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User Tenant { get; set; } = null!;
    public Unit Unit { get; set; } = null!;

    public List<TicketImage> Images { get; set; } = new();
    public List<AgentExecutionLog> AgentExecutionLogs { get; set; } = new();
}