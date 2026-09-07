namespace SmartSpace.API.DTOs.MaintenanceTickets;

public class TicketDetailResponseDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UnitId { get; set; }
    public string UnitNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string UrgencyLevel { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<string> ImageUrls { get; set; } = new();
    public List<AgentExecutionLogDto> AgentExecutionLogs { get; set; } = new();
}

public class AgentExecutionLogDto
{
    public string AgentRole { get; set; } = string.Empty;
    public string ActionTaken { get; set; } = string.Empty;
    public string WorkflowState { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
}