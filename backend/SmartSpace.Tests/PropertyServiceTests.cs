using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.PropertyManagement;
using SmartSpace.API.Models.PropertyManagement;
using SmartSpace.API.Services.MaintenanceTickets;
using SmartSpace.API.Services.PropertyManagement;
using Xunit;

namespace SmartSpace.Tests;

public sealed class PropertyServiceTests
{
    [Fact]
    public async Task CreateProperty_WithInitialUnits_PersistsPropertyAndVacantUnits()
    {
        await using var context = CreateContext();
        var service = new PropertyService(context, new FakeFileStorageService());

        var result = await service.CreatePropertyAsync(new CreatePropertyRequestDto
        {
            Name = "Lake View Apartments",
            Address = "42 Temple Road",
            City = "Colombo",
            InitialUnits =
            [
                new CreateUnitSubRequestDto { UnitNumber = "A-101", Floor = 1 },
                new CreateUnitSubRequestDto { UnitNumber = "B-204", Floor = 2 }
            ]
        });

        Assert.Equal("Lake View Apartments", result.Name);
        Assert.Equal(2, result.Units.Count);
        Assert.All(result.Units, unit => Assert.Equal(nameof(UnitStatus.Vacant), unit.Status));
        Assert.Equal(1, await context.Properties.CountAsync());
        Assert.Equal(2, await context.Units.CountAsync());
    }

    [Fact]
    public async Task CreateUnit_WhenPropertyDoesNotExist_ThrowsKeyNotFoundException()
    {
        await using var context = CreateContext();
        var service = new PropertyService(context, new FakeFileStorageService());

        var action = () => service.CreateUnitAsync(new CreateUnitRequestDto
        {
            PropertyId = Guid.NewGuid(),
            UnitNumber = "A-101",
            Floor = 1
        });

        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(action);
        Assert.Contains("was not found", exception.Message);
    }

    [Fact]
    public async Task UpdateUnit_WithActiveLease_CannotChangeStatusFromOccupied()
    {
        await using var context = CreateContext();
        var property = NewProperty();
        var unit = NewUnit(property, UnitStatus.Occupied);
        unit.Leases.Add(new Lease
        {
            UnitId = unit.Id,
            TenantId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddYears(1),
            MonthlyRent = 75000m,
            IsActive = true
        });
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        var service = new PropertyService(context, new FakeFileStorageService());

        var action = () => service.UpdateUnitAsync(unit.Id, new UpdateUnitRequestDto
        {
            UnitNumber = unit.UnitNumber,
            Floor = unit.Floor,
            Status = UnitStatus.Vacant
        });

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(action);
        Assert.Contains("must remain Occupied", exception.Message);
        Assert.Equal(UnitStatus.Occupied, unit.Status);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"property-tests-{Guid.NewGuid()}")
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Property NewProperty(string? imageUrl = null) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Property",
        Address = "1 Test Street",
        City = "Colombo",
        ImageUrl = imageUrl
    };

    private static Unit NewUnit(Property property, UnitStatus status)
    {
        var unit = new Unit
        {
            Id = Guid.NewGuid(),
            PropertyId = property.Id,
            Property = property,
            UnitNumber = "A-101",
            Floor = 1,
            Status = status
        };
        property.Units.Add(unit);
        return unit;
    }

    private sealed class FakeFileStorageService : IFileStorageService
    {
        public Task<string> SaveFileAsync(IFormFile file, Guid ticketId) =>
            Task.FromResult($"https://files.example/tickets/{ticketId}");

        public Task<string> SavePropertyImageAsync(IFormFile file, Guid propertyId) =>
            Task.FromResult($"https://files.example/properties/{propertyId}");
    }
}
