namespace SmartSpace.API.Services.MaintenanceTickets;

public interface IFileStorageService
{
    /// <summary>Saves the uploaded file and returns a URL/path the client can use to retrieve it.</summary>
    Task<string> SaveFileAsync(IFormFile file, Guid ticketId);
}