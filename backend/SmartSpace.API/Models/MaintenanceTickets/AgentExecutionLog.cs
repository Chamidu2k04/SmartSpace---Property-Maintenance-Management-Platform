namespace SmartSpace.API.Models.MaintenanceTickets;

public class AgentExecutionLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }

    /// <summary>e.g. "TriageAgent", "PolicyAgent", "InventoryAgent", "SchedulingAgent"</summary>
    public string AgentRole { get; set; } = string.Empty;

    public string ActionTaken { get; set; } = string.Empty;

    /// <summary>Structured AI output/trace. Mapped to native PostgreSQL jsonb in ApplicationDbContext.</summary>
    public string WorkflowState { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public MaintenanceTicket Ticket { get; set; } = null!;
}