using SmartSpace.API.DTOs.Scheduling;

namespace SmartSpace.API.Services.Scheduling;

/// <summary>
/// Service interface for technician profile business logic and data access operations.
/// </summary>
public interface ITechnicianService
{
    Task<TechnicianProfileResponseDto> CreateTechnicianAsync(CreateTechnicianProfileDto dto);
    Task<TechnicianProfileResponseDto?> GetTechnicianByIdAsync(Guid id);
    Task<IEnumerable<TechnicianProfileResponseDto>> GetAllTechniciansAsync();
    Task<TechnicianProfileResponseDto?> UpdateTechnicianAsync(Guid id, UpdateTechnicianProfileDto dto);
    Task<bool> DeleteTechnicianAsync(Guid id);
}
