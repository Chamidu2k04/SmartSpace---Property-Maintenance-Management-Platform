using System.Net;
using System.Net.Mail;

namespace SmartSpace.API.Services.Common;

/// <summary>
/// Implementation of email notifications using System.Net.Mail and SMTP configuration from appsettings.json.
/// Includes comprehensive logging and exception handling to prevent external email provider issues from disrupting API transactions.
/// </summary>
public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Constructs and dispatches a booking confirmation email asynchronously.
    /// </summary>
    public async Task SendBookingConfirmationEmailAsync(string recipientEmail, string recipientName, Guid ticketId, decimal totalCost)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail))
        {
            _logger.LogWarning("Email sending skipped: Recipient email address is null or empty for ticket {TicketId}.", ticketId);
            return;
        }

        try
        {
            // Read SMTP configuration from appsettings.json (with production-ready fallback defaults)
            var smtpHost = _configuration["Smtp:Host"] ?? "localhost";
            var smtpPort = int.TryParse(_configuration["Smtp:Port"], out var port) ? port : 587;
            var smtpUsername = _configuration["Smtp:Username"] ?? string.Empty;
            var smtpPassword = _configuration["Smtp:Password"] ?? string.Empty;
            var enableSsl = bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) ? ssl : true;
            var senderEmail = _configuration["Smtp:SenderEmail"] ?? "noreply@smartspace.com";
            var senderName = _configuration["Smtp:SenderName"] ?? "SmartSpace Property Management";

            // Check if SMTP configuration contains placeholder / unconfigured credentials (Development Mock Mode)
            bool isPlaceholder = string.IsNullOrWhiteSpace(smtpUsername) ||
                                 smtpUsername.Contains("your_email") ||
                                 smtpPassword.Contains("your_app_password") ||
                                 smtpHost.Equals("localhost", StringComparison.OrdinalIgnoreCase);

            if (isPlaceholder)
            {
                _logger.LogInformation(
                    "[MOCK EMAIL SERVICE] SMTP credentials not configured (Development/Viva Mock Mode). " +
                    "Simulated booking confirmation email sent to '{RecipientEmail}' ({RecipientName}) for Maintenance Ticket '{TicketId}' after Property Manager quotation approval (Total Cost ${TotalCost:N2}).",
                    recipientEmail, recipientName, ticketId, totalCost);
                return;
            }

            // Construct real email message content
            using var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = $"SmartSpace Maintenance Booking Confirmation - Approved by Property Manager (Ticket #{ticketId.ToString()[..8]})",
                Body = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                        <h2 style='color: #2c3e50;'>SmartSpace Quotation Approved by Property Manager</h2>
                        <p>Dear <strong>{WebUtility.HtmlEncode(recipientName)}</strong>,</p>
                        <p>Great news! The maintenance quotation for ticket <strong>#{ticketId}</strong> has been officially <strong>approved by the Property Manager</strong>.</p>
                        <div style='background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;'>
                            <p style='margin: 5px 0;'><strong>Ticket ID:</strong> {ticketId}</p>
                            <p style='margin: 5px 0;'><strong>Approved Total Cost:</strong> ${totalCost:N2}</p>
                            <p style='margin: 5px 0;'><strong>Approval Status:</strong> Approved by Property Manager</p>
                        </div>
                        <p>The assigned technician will proceed with scheduling and fulfilling the required maintenance tasks.</p>
                        <br/>
                        <p>Best regards,<br/><strong>SmartSpace Property Management Team</strong></p>
                    </body>
                    </html>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(new MailAddress(recipientEmail, recipientName));

            // Configure SMTP client
            using var smtpClient = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(smtpUsername, smtpPassword)
            };

            // Dispatch email asynchronously
            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("Booking confirmation email successfully dispatched via SMTP to {RecipientEmail} for Ticket {TicketId}.", recipientEmail, ticketId);
        }
        catch (Exception ex)
        {
            // Log external email delivery exception safely without rethrowing, ensuring API approval transaction succeeds
            _logger.LogError(ex, "Failed to send booking confirmation email to {RecipientEmail} for Ticket {TicketId}.", recipientEmail, ticketId);
        }
    }
}
