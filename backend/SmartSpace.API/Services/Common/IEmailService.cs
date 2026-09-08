namespace SmartSpace.API.Services.Common;

/// <summary>
/// Service interface for dispatching email notifications across the SmartSpace platform.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends a booking confirmation notification email to a specified recipient upon quotation approval (FR10).
    /// </summary>
    /// <param name="recipientEmail">Target recipient's email address.</param>
    /// <param name="recipientName">Target recipient's display name.</param>
    /// <param name="ticketId">Identifier of the maintenance ticket being confirmed.</param>
    /// <param name="totalCost">Approved total quotation cost.</param>
    Task SendBookingConfirmationEmailAsync(string recipientEmail, string recipientName, Guid ticketId, decimal totalCost);
}
