using SmartSpace.API.DTOs.PropertyManagement;

namespace SmartSpace.API.Services.PropertyManagement;

public interface IPropertyService
{
    Task<PropertyResponseDto> CreatePropertyAsync(CreatePropertyRequestDto request);
    Task<List<PropertyResponseDto>> GetAllPropertiesAsync();
    Task<PropertyResponseDto?> GetPropertyByIdAsync(Guid id);
    Task<UnitResponseDto> CreateUnitAsync(CreateUnitRequestDto request);
    Task<List<UnitResponseDto>> GetUnitsByPropertyIdAsync(Guid propertyId);
    Task<PropertyResponseDto> UpdatePropertyAsync(Guid id, UpdatePropertyRequestDto request);
    Task DeletePropertyAsync(Guid id);
    Task<UnitResponseDto> UpdateUnitAsync(Guid id, UpdateUnitRequestDto request);
    Task DeleteUnitAsync(Guid id);
}
