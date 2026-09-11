namespace SmartSpace.API.Services.MaintenanceTickets;

/// <summary>
/// Email notification service interface for the Maintenance Ticket module.
/// Handles automated emails triggered by ticket lifecycle events.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends an HTML resolution-confirmation email to the tenant when their maintenance
    /// ticket status is updated to Completed.
    /// </summary>
    /// <param name="tenantEmail">Tenant's email address.</param>
    /// <param name="tenantName">Tenant's full display name.</param>
    /// <param name="ticketId">The resolved ticket's unique identifier (string form of Guid).</param>
    /// <param name="description">Short description of the resolved maintenance request.</param>
    Task SendTicketResolvedEmailAsync(string tenantEmail, string tenantName, string ticketId, string description);
}
