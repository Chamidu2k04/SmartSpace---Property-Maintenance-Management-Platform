using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SmartSpace.API.Services.MaintenanceTickets;

namespace SmartSpace.API.Services.Common;

public class CloudinaryFileStorageService : IFileStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryFileStorageService> _logger;

    public CloudinaryFileStorageService(Cloudinary cloudinary, ILogger<CloudinaryFileStorageService> logger)
    {
        _cloudinary = cloudinary;
        _logger = logger;
    }

    public async Task<string> SaveFileAsync(IFormFile file, Guid ticketId)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty.");

        using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = $"smartspace/tickets/{ticketId}",
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        if (uploadResult.Error != null)
        {
            _logger.LogError($"Cloudinary upload failed: {uploadResult.Error.Message}");
            throw new Exception($"Cloudinary upload failed: {uploadResult.Error.Message}");
        }

        // Return full HTTPS URL from Cloudinary
        return uploadResult.SecureUrl.ToString();
    }
}
