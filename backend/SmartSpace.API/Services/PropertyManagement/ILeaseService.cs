using SmartSpace.API.DTOs.PropertyManagement;

namespace SmartSpace.API.Services.PropertyManagement;

public interface ILeaseService
{
    Task<LeaseResponseDto> CreateLeaseAsync(CreateLeaseRequestDto request);
    Task<LeaseResponseDto?> GetActiveLeaseForTenantAsync(Guid tenantId);
    Task<List<LeaseResponseDto>> GetAllLeasesAsync();
    Task<LeaseResponseDto?> GetLeaseByIdAsync(Guid id);
    Task<LeaseResponseDto> UpdateLeaseAsync(Guid id, UpdateLeaseRequestDto request);
    Task<LeaseResponseDto> TerminateLeaseAsync(Guid id);
    Task DeleteLeaseAsync(Guid id);
}
