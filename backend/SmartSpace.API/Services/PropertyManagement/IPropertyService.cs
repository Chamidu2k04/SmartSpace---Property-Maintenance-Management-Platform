using SmartSpace.API.DTOs.PropertyManagement;

namespace SmartSpace.API.Services.PropertyManagement;

public interface IPropertyService
{
    Task<PropertyResponseDto> CreatePropertyAsync(CreatePropertyRequestDto request);
    Task<List<PropertyResponseDto>> GetAllPropertiesAsync();
    Task<PropertyResponseDto?> GetPropertyByIdAsync(Guid id);
    Task<UnitResponseDto> CreateUnitAsync(CreateUnitRequestDto request);
    Task<List<UnitResponseDto>> GetUnitsByPropertyIdAsync(Guid propertyId);
}
