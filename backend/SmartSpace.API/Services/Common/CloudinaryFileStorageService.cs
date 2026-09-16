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
        => await UploadImageAsync(file, $"smartspace/tickets/{ticketId}");

    public async Task<string> SavePropertyImageAsync(IFormFile file, Guid propertyId)
        => await UploadImageAsync(file, $"smartspace/properties/{propertyId}");

    private async Task<string> UploadImageAsync(IFormFile file, string folder)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty.");

        using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        };

        try
        {
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                _logger.LogError($"Cloudinary upload failed: {uploadResult.Error.Message}");
                throw new InvalidOperationException($"Image upload failed: Cloudinary upload failed with message: {uploadResult.Error.Message}");
            }

            // Return full HTTPS URL from Cloudinary
            return uploadResult.SecureUrl.ToString();
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "Exception occurred during Cloudinary upload.");
            throw new InvalidOperationException("Image upload failed: Cloudinary is not configured or unreachable.", ex);
        }
    }
}
