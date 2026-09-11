using System.Net.Mail;

namespace SmartSpace.API.Services.MaintenanceTickets;

/// <summary>
/// Maintenance Ticket email notification service.
/// Sends automated HTML emails to tenants when their maintenance ticket is resolved.
/// Uses SMTP settings from appsettings.json ("Smtp" section).
/// Email failures are caught and logged — they will NEVER break the status update transaction.
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

    /// <inheritdoc />
    public async Task SendTicketResolvedEmailAsync(
        string tenantEmail,
        string tenantName,
        string ticketId,
        string description)
    {
        if (string.IsNullOrWhiteSpace(tenantEmail))
        {
            _logger.LogWarning(
                "Ticket-resolved email skipped: Tenant email is null or empty for Ticket {TicketId}.",
                ticketId);
            return;
        }

        try
        {
            // Read SMTP settings from appsettings.json → "Smtp" section
            var smtpHost     = _configuration["Smtp:Host"]     ?? "localhost";
            var smtpPort     = int.TryParse(_configuration["Smtp:Port"], out var port) ? port : 587;
            var smtpUsername = _configuration["Smtp:Username"] ?? string.Empty;
            var smtpPassword = _configuration["Smtp:Password"] ?? string.Empty;
            var enableSsl    = bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) ? ssl : true;
            var senderEmail  = _configuration["Smtp:SenderEmail"] ?? "noreply@smartspace.com";
            var senderName   = _configuration["Smtp:SenderName"] ?? "SmartSpace Property Maintenance";

            // Development / mock-mode guard — log and skip if credentials are not configured
            bool isPlaceholder = string.IsNullOrWhiteSpace(smtpUsername)
                                 || smtpUsername.Contains("your_email")
                                 || smtpPassword.Contains("your_app_password")
                                 || smtpHost.Equals("localhost", StringComparison.OrdinalIgnoreCase);

            if (isPlaceholder)
            {
                _logger.LogInformation(
                    "[MOCK EMAIL] SMTP not configured — simulated ticket-resolved email to '{TenantEmail}' " +
                    "({TenantName}) for Ticket '{TicketId}' | Description: {Description}.",
                    tenantEmail, tenantName, ticketId, description);
                return;
            }

            // Build a short display ID (first 8 chars, upper-case)
            var shortId        = ticketId.Length >= 8 ? ticketId[..8].ToUpper() : ticketId.ToUpper();
            // Convert UTC to Sri Lanka Standard Time (UTC+05:30) for display
            var sriLankaTimeZone = GetSriLankaTimeZone();
            var sriLankaTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, sriLankaTimeZone);
            var resolutionDate = sriLankaTime.ToString("dddd, dd MMMM yyyy 'at' HH:mm 'IST'");

            using var mail = new MailMessage
            {
                From        = new MailAddress(senderEmail, senderName),
                Subject     = $"✅ Your Maintenance Ticket #{shortId} Has Been Resolved!",
                IsBodyHtml  = true,
                Body        = BuildHtmlBody(tenantName, shortId, description, resolutionDate)
            };

            mail.To.Add(new MailAddress(tenantEmail, tenantName));

            using var smtp = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl   = enableSsl,
                Credentials = new System.Net.NetworkCredential(smtpUsername, smtpPassword)
            };

            await smtp.SendMailAsync(mail);

            _logger.LogInformation(
                "Ticket-resolved email dispatched to {TenantEmail} for Ticket {TicketId}.",
                tenantEmail, ticketId);
        }
        catch (Exception ex)
        {
            // Intentionally non-fatal — email failure must never roll back the status update
            _logger.LogError(ex,
                "Failed to send ticket-resolved email to {TenantEmail} for Ticket {TicketId}.",
                tenantEmail, ticketId);
        }
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private static string BuildHtmlBody(
        string tenantName,
        string shortId,
        string description,
        string resolutionDate)
    {
        var safeName        = System.Net.WebUtility.HtmlEncode(tenantName);
        var safeDescription = System.Net.WebUtility.HtmlEncode(description);
        var sriLankaZone    = GetSriLankaTimeZone();
        var year            = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, sriLankaZone).Year;

        return $@"
<!DOCTYPE html>
<html lang=""en"">
<head><meta charset=""UTF-8"" /><meta name=""viewport"" content=""width=device-width,initial-scale=1"" /></head>
<body style=""margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f4f6f8;padding:30px 0;"">
    <tr><td align=""center"">
      <table width=""600"" cellpadding=""0"" cellspacing=""0""
             style=""background:#ffffff;border-radius:12px;overflow:hidden;
                    box-shadow:0 4px 16px rgba(0,0,0,0.09);"">

        <!-- ── Header ── -->
        <tr>
          <td style=""background:linear-gradient(135deg,#1a7f5a 0%,#22a86e 100%);
                     padding:36px 40px;text-align:center;"">
            <h1 style=""margin:0;color:#ffffff;font-size:26px;font-weight:700;
                       letter-spacing:-0.5px;"">✅ Ticket Resolved</h1>
            <p style=""margin:8px 0 0;color:#c8f5e4;font-size:14px;"">
              SmartSpace Property Maintenance
            </p>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style=""padding:36px 40px;color:#2d3748;"">
            <p style=""margin:0 0 16px;font-size:16px;"">
              Dear <strong>{safeName}</strong>,
            </p>
            <p style=""margin:0 0 24px;font-size:15px;line-height:1.75;color:#4a5568;"">
              We're pleased to let you know that your maintenance request has been
              <strong style=""color:#1a7f5a;"">successfully resolved</strong>.
              Our team has completed all required work and the matter is now closed.
            </p>

            <!-- ── Details card ── -->
            <table width=""100%"" cellpadding=""0"" cellspacing=""0""
                   style=""background:#f0faf5;border-left:4px solid #22a86e;
                          border-radius:6px;margin-bottom:28px;"">
              <tr>
                <td style=""padding:18px 20px;font-size:14px;color:#2d3748;line-height:1.8;"">
                  <p style=""margin:4px 0;"">
                    <strong>🎫 Ticket ID:</strong>&nbsp;&nbsp;
                    <span style=""font-family:monospace;color:#1a7f5a;font-weight:600;"">#{shortId}</span>
                  </p>
                  <p style=""margin:4px 0;"">
                    <strong>📋 Description:</strong>&nbsp;&nbsp;{safeDescription}
                  </p>
                  <p style=""margin:4px 0;"">
                    <strong>📅 Resolution Date:</strong>&nbsp;&nbsp;{resolutionDate}
                  </p>
                  <p style=""margin:4px 0;"">
                    <strong>✔ Status:</strong>&nbsp;&nbsp;
                    <span style=""color:#1a7f5a;font-weight:600;"">Completed</span>
                  </p>
                </td>
              </tr>
            </table>

            <p style=""margin:0 0 16px;font-size:15px;line-height:1.75;color:#4a5568;"">
              If you feel the issue has not been fully addressed, please contact the
              property management team or submit a new maintenance request through SmartSpace.
            </p>
            <p style=""margin:0;font-size:15px;color:#4a5568;"">
              Thank you for choosing <strong>SmartSpace</strong> — we're committed to
              keeping your home in top condition.
            </p>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style=""background:#f7fafc;padding:20px 40px;text-align:center;
                     border-top:1px solid #e2e8f0;"">
            <p style=""margin:0;font-size:12px;color:#a0aec0;"">
              &copy; {year} SmartSpace Property Maintenance &middot; This is an automated notification.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>";
    }

    /// <summary>
    /// Returns the Sri Lanka Standard Time (UTC+05:30) TimeZoneInfo.
    /// Handles cross-platform differences: Windows uses "Sri Lanka Standard Time", Linux uses "Asia/Colombo".
    /// </summary>
    private static TimeZoneInfo GetSriLankaTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Sri Lanka Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Colombo");
        }
    }
}
