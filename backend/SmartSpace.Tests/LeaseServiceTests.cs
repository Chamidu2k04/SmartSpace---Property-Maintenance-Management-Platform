using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.PropertyManagement;
using SmartSpace.API.Models;
using SmartSpace.API.Models.PropertyManagement;
using SmartSpace.API.Services.PropertyManagement;
using Xunit;

namespace SmartSpace.Tests;

public sealed class LeaseServiceTests
{
    [Fact]
    public async Task CreateLease_ForVacantUnitAndTenant_ActivatesLeaseAndOccupiesUnit()
    {
        await using var context = CreateContext();
        var (unit, tenant) = await SeedVacantUnitAndTenantAsync(context);
        var service = new LeaseService(context);
        var startDate = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        var result = await service.CreateLeaseAsync(new CreateLeaseRequestDto
        {
            UnitId = unit.Id,
            TenantId = tenant.Id,
            StartDate = startDate,
            EndDate = startDate.AddYears(1),
            MonthlyRent = 85000m
        });

        Assert.True(result.IsActive);
        Assert.Equal(85000m, result.MonthlyRent);
        Assert.Equal(tenant.FullName, result.TenantName);
        Assert.Equal(UnitStatus.Occupied, unit.Status);
        Assert.Equal(1, await context.Leases.CountAsync());
    }

    [Fact]
    public async Task CreateLease_ForOccupiedUnit_IsRejected()
    {
        await using var context = CreateContext();
        var (unit, tenant) = await SeedVacantUnitAndTenantAsync(context);
        unit.Status = UnitStatus.Occupied;
        await context.SaveChangesAsync();
        var service = new LeaseService(context);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateLeaseAsync(ValidRequest(unit.Id, tenant.Id)));

        Assert.Contains("already occupied", exception.Message);
        Assert.Empty(context.Leases);
    }

    [Fact]
    public async Task TerminateLease_DeactivatesLeaseAndReturnsUnitToVacant()
    {
        await using var context = CreateContext();
        var (unit, tenant) = await SeedVacantUnitAndTenantAsync(context);
        var service = new LeaseService(context);
        var lease = await service.CreateLeaseAsync(ValidRequest(unit.Id, tenant.Id));

        var result = await service.TerminateLeaseAsync(lease.Id);

        Assert.False(result.IsActive);
        Assert.Equal(UnitStatus.Vacant, unit.Status);
    }

    private static CreateLeaseRequestDto ValidRequest(Guid unitId, Guid tenantId)
    {
        var startDate = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        return new CreateLeaseRequestDto
        {
            UnitId = unitId,
            TenantId = tenantId,
            StartDate = startDate,
            EndDate = startDate.AddYears(1),
            MonthlyRent = 85000m
        };
    }

    private static async Task<(Unit Unit, User User)> SeedVacantUnitAndTenantAsync(
        ApplicationDbContext context,
        UserRole role = UserRole.Tenant)
    {
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Name = "City Residences",
            Address = "20 Union Place",
            City = "Colombo"
        };
        var unit = new Unit
        {
            Id = Guid.NewGuid(),
            PropertyId = property.Id,
            Property = property,
            UnitNumber = "C-305",
            Floor = 3,
            Status = UnitStatus.Vacant
        };
        property.Units.Add(unit);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{role.ToString().ToLowerInvariant()}-{Guid.NewGuid():N}@example.com",
            PasswordHash = "test-only-hash",
            FullName = "Test User",
            Role = role
        };
        context.AddRange(property, user);
        await context.SaveChangesAsync();
        return (unit, user);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"lease-tests-{Guid.NewGuid()}")
            .Options;
        return new ApplicationDbContext(options);
    }
}
