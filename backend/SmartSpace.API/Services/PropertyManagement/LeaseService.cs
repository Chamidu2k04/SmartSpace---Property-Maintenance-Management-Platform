using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.PropertyManagement;
using SmartSpace.API.Models;
using SmartSpace.API.Models.PropertyManagement;

namespace SmartSpace.API.Services.PropertyManagement;

public class LeaseService : ILeaseService
{
    private readonly ApplicationDbContext _context;

    public LeaseService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LeaseResponseDto> CreateLeaseAsync(CreateLeaseRequestDto request)
    {
        if (request.EndDate <= request.StartDate)
        {
            throw new InvalidOperationException("End date must be after start date.");
        }

        var unit = await _context.Units
            .Include(u => u.Property)
            .FirstOrDefaultAsync(u => u.Id == request.UnitId);

        if (unit == null)
        {
            throw new KeyNotFoundException($"Unit with ID '{request.UnitId}' was not found.");
        }

        // Business Logic Validation: Ensure a Property Manager cannot create a lease for a Unit if its Status is already "Occupied"
        if (unit.Status == UnitStatus.Occupied)
        {
            throw new InvalidOperationException($"Unit '{unit.UnitNumber}' is already occupied.");
        }

        var tenant = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.TenantId);
        if (tenant == null)
        {
            throw new KeyNotFoundException($"Tenant user with ID '{request.TenantId}' was not found.");
        }

        if (tenant.Role != UserRole.Tenant)
        {
            throw new InvalidOperationException($"User '{tenant.Email}' does not have the Tenant role.");
        }

        // Create Lease
        var lease = new Lease
        {
            Id = Guid.NewGuid(),
            UnitId = request.UnitId,
            TenantId = request.TenantId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MonthlyRent = request.MonthlyRent,
            IsActive = true
        };

        // Update unit status to Occupied
        unit.Status = UnitStatus.Occupied;

        _context.Leases.Add(lease);
        await _context.SaveChangesAsync();

        return new LeaseResponseDto
        {
            Id = lease.Id,
            UnitId = lease.UnitId,
            UnitNumber = unit.UnitNumber,
            TenantId = lease.TenantId,
            TenantName = tenant.FullName,
            TenantEmail = tenant.Email,
            PropertyId = unit.PropertyId,
            PropertyName = unit.Property?.Name ?? string.Empty,
            PropertyAddress = unit.Property?.Address ?? string.Empty,
            City = unit.Property?.City ?? string.Empty,
            StartDate = lease.StartDate,
            EndDate = lease.EndDate,
            MonthlyRent = lease.MonthlyRent,
            IsActive = lease.IsActive
        };
    }

    public async Task<LeaseResponseDto?> GetActiveLeaseForTenantAsync(Guid tenantId)
    {
        var lease = await _context.Leases
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .Include(l => l.Tenant)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.TenantId == tenantId && l.IsActive);

        if (lease == null)
        {
            return null;
        }

        return MapToLeaseResponseDto(lease);
    }

    public async Task<List<LeaseResponseDto>> GetAllLeasesAsync()
    {
        var leases = await _context.Leases
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .Include(l => l.Tenant)
            .AsNoTracking()
            .ToListAsync();

        return leases.Select(MapToLeaseResponseDto).ToList();
    }

    private static LeaseResponseDto MapToLeaseResponseDto(Lease lease)
    {
        return new LeaseResponseDto
        {
            Id = lease.Id,
            UnitId = lease.UnitId,
            UnitNumber = lease.Unit?.UnitNumber ?? string.Empty,
            TenantId = lease.TenantId,
            TenantName = lease.Tenant?.FullName ?? string.Empty,
            TenantEmail = lease.Tenant?.Email ?? string.Empty,
            PropertyId = lease.Unit?.PropertyId ?? Guid.Empty,
            PropertyName = lease.Unit?.Property?.Name ?? string.Empty,
            PropertyAddress = lease.Unit?.Property?.Address ?? string.Empty,
            City = lease.Unit?.Property?.City ?? string.Empty,
            StartDate = lease.StartDate,
            EndDate = lease.EndDate,
            MonthlyRent = lease.MonthlyRent,
            IsActive = lease.IsActive
        };
    }
}
