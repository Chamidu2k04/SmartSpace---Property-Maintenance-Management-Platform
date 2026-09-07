using SmartSpace.API.DTOs.PropertyManagement;

namespace SmartSpace.API.Services.PropertyManagement;

public interface ILeaseService
{
    Task<LeaseResponseDto> CreateLeaseAsync(CreateLeaseRequestDto request);
    Task<LeaseResponseDto?> GetActiveLeaseForTenantAsync(Guid tenantId);
    Task<List<LeaseResponseDto>> GetAllLeasesAsync();
}
