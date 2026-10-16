using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartSpace.API.Controllers.PropertyManagement;
using SmartSpace.API.DTOs.PropertyManagement;
using SmartSpace.API.Services.PropertyManagement;
using Xunit;

namespace SmartSpace.Tests;

public sealed class PropertyLeaseControllerTests
{
    [Fact]
    public async Task CreateProperty_WithNonImageUpload_ReturnsBadRequestWithoutCallingService()
    {
        var service = new StubPropertyService();
        var controller = new PropertiesController(service);
        var file = new FormFile(Stream.Null, 0, 10, "Image", "notes.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain"
        };

        var result = await controller.CreateProperty(new CreatePropertyRequestDto
        {
            Name = "Lakeview Residences",
            Address = "24 Lake Road",
            City = "Colombo",
            Image = file
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.False(service.CreateCalled);
    }

    [Fact]
    public async Task GetMyActiveLease_WithActiveLease_ReturnsTenantLease()
    {
        var tenantId = Guid.NewGuid();
        var expected = new LeaseResponseDto
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UnitNumber = "A-101",
            PropertyName = "Lakeview Residences",
            IsActive = true
        };
        var service = new StubLeaseService { ActiveLease = expected };
        var controller = AuthenticatedLeaseController(service,
            new Claim(ClaimTypes.NameIdentifier, tenantId.ToString()));

        var result = await controller.GetMyActiveLease();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(expected, ok.Value);
    }

    private static LeasesController AuthenticatedLeaseController(
        ILeaseService service,
        params Claim[] claims)
    {
        return new LeasesController(service)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
                }
            }
        };
    }

    private sealed class StubPropertyService : IPropertyService
    {
        public PropertyResponseDto? CreatedProperty { get; init; }
        public Exception? CreateUnitError { get; init; }
        public Exception? UpdateUnitError { get; init; }
        public bool CreateCalled { get; private set; }

        public Task<PropertyResponseDto> CreatePropertyAsync(CreatePropertyRequestDto request)
        {
            CreateCalled = true;
            return Task.FromResult(CreatedProperty ?? new PropertyResponseDto());
        }

        public Task<UnitResponseDto> CreateUnitAsync(CreateUnitRequestDto request) =>
            CreateUnitError is null
                ? Task.FromResult(new UnitResponseDto())
                : Task.FromException<UnitResponseDto>(CreateUnitError);

        public Task<UnitResponseDto> UpdateUnitAsync(Guid id, UpdateUnitRequestDto request) =>
            UpdateUnitError is null
                ? Task.FromResult(new UnitResponseDto())
                : Task.FromException<UnitResponseDto>(UpdateUnitError);

        public Task<List<PropertyResponseDto>> GetAllPropertiesAsync() => Task.FromResult(new List<PropertyResponseDto>());
        public Task<PropertyResponseDto?> GetPropertyByIdAsync(Guid id) => Task.FromResult<PropertyResponseDto?>(null);
        public Task<List<UnitResponseDto>> GetUnitsByPropertyIdAsync(Guid propertyId) => Task.FromResult(new List<UnitResponseDto>());
        public Task<PropertyResponseDto> UpdatePropertyAsync(Guid id, UpdatePropertyRequestDto request) => Task.FromResult(new PropertyResponseDto());
        public Task DeletePropertyAsync(Guid id) => Task.CompletedTask;
        public Task DeleteUnitAsync(Guid id) => Task.CompletedTask;
    }

    private sealed class StubLeaseService : ILeaseService
    {
        public LeaseResponseDto? ActiveLease { get; init; }
        public Exception? CreateError { get; init; }
        public Guid? RequestedTenantId { get; private set; }

        public Task<LeaseResponseDto> CreateLeaseAsync(CreateLeaseRequestDto request) =>
            CreateError is null
                ? Task.FromResult(new LeaseResponseDto())
                : Task.FromException<LeaseResponseDto>(CreateError);

        public Task<LeaseResponseDto?> GetActiveLeaseForTenantAsync(Guid tenantId)
        {
            RequestedTenantId = tenantId;
            return Task.FromResult(ActiveLease);
        }

        public Task<List<LeaseResponseDto>> GetAllLeasesAsync() => Task.FromResult(new List<LeaseResponseDto>());
        public Task<LeaseResponseDto?> GetLeaseByIdAsync(Guid id) => Task.FromResult<LeaseResponseDto?>(null);
        public Task<LeaseResponseDto> UpdateLeaseAsync(Guid id, UpdateLeaseRequestDto request) => Task.FromResult(new LeaseResponseDto());
        public Task<LeaseResponseDto> TerminateLeaseAsync(Guid id) => Task.FromResult(new LeaseResponseDto());
        public Task DeleteLeaseAsync(Guid id) => Task.CompletedTask;
    }
}
