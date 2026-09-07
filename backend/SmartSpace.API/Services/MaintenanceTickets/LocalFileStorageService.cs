namespace SmartSpace.API.Services.MaintenanceTickets;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".heic" };
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> SaveFileAsync(IFormFile file, Guid ticketId)
    {
        if (file.Length == 0)
            throw new ArgumentException("Uploaded file is empty.");

        if (file.Length > MaxFileSizeBytes)
            throw new ArgumentException("Uploaded file exceeds the 10 MB limit.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new ArgumentException($"File type '{extension}' is not allowed.");

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "uploads", "tickets", ticketId.ToString());
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Relative URL served via app.UseStaticFiles()
        return $"/uploads/tickets/{ticketId}/{fileName}";
    }
}