using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.PropertyManagement;
using SmartSpace.API.Models.PropertyManagement;

namespace SmartSpace.API.Services.PropertyManagement;

public class PropertyService : IPropertyService
{
    private readonly ApplicationDbContext _context;

    public PropertyService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PropertyResponseDto> CreatePropertyAsync(CreatePropertyRequestDto request)
    {
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Address = request.Address,
            City = request.City
        };

        if (request.InitialUnits != null && request.InitialUnits.Count > 0)
        {
            foreach (var unitDto in request.InitialUnits)
            {
                property.Units.Add(new Unit
                {
                    Id = Guid.NewGuid(),
                    PropertyId = property.Id,
                    UnitNumber = unitDto.UnitNumber,
                    Floor = unitDto.Floor,
                    Status = UnitStatus.Vacant
                });
            }
        }

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        return MapToPropertyResponseDto(property);
    }

    public async Task<List<PropertyResponseDto>> GetAllPropertiesAsync()
    {
        var properties = await _context.Properties
            .Include(p => p.Units)
            .AsNoTracking()
            .ToListAsync();

        return properties.Select(MapToPropertyResponseDto).ToList();
    }

    public async Task<PropertyResponseDto?> GetPropertyByIdAsync(Guid id)
    {
        var property = await _context.Properties
            .Include(p => p.Units)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        return property == null ? null : MapToPropertyResponseDto(property);
    }

    public async Task<UnitResponseDto> CreateUnitAsync(CreateUnitRequestDto request)
    {
        var propertyExists = await _context.Properties.AnyAsync(p => p.Id == request.PropertyId);
        if (!propertyExists)
        {
            throw new KeyNotFoundException($"Property with ID '{request.PropertyId}' was not found.");
        }

        var unit = new Unit
        {
            Id = Guid.NewGuid(),
            PropertyId = request.PropertyId,
            UnitNumber = request.UnitNumber,
            Floor = request.Floor,
            Status = request.Status
        };

        _context.Units.Add(unit);
        await _context.SaveChangesAsync();

        var property = await _context.Properties.FindAsync(request.PropertyId);

        return new UnitResponseDto
        {
            Id = unit.Id,
            PropertyId = unit.PropertyId,
            UnitNumber = unit.UnitNumber,
            Floor = unit.Floor,
            Status = unit.Status.ToString(),
            PropertyName = property?.Name
        };
    }

    public async Task<List<UnitResponseDto>> GetUnitsByPropertyIdAsync(Guid propertyId)
    {
        var units = await _context.Units
            .Include(u => u.Property)
            .Where(u => u.PropertyId == propertyId)
            .AsNoTracking()
            .ToListAsync();

        return units.Select(u => new UnitResponseDto
        {
            Id = u.Id,
            PropertyId = u.PropertyId,
            UnitNumber = u.UnitNumber,
            Floor = u.Floor,
            Status = u.Status.ToString(),
            PropertyName = u.Property?.Name
        }).ToList();
    }

    public async Task<PropertyResponseDto> UpdatePropertyAsync(Guid id, UpdatePropertyRequestDto request)
    {
        var property = await _context.Properties.Include(p => p.Units).FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException($"Property with ID '{id}' was not found.");

        property.Name = request.Name.Trim();
        property.Address = request.Address.Trim();
        property.City = request.City.Trim();
        await _context.SaveChangesAsync();
        return MapToPropertyResponseDto(property);
    }

    public async Task DeletePropertyAsync(Guid id)
    {
        var property = await _context.Properties
            .Include(p => p.Units).ThenInclude(u => u.Leases)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException($"Property with ID '{id}' was not found.");

        if (property.Units.Any(u => u.Leases.Count > 0))
        {
            throw new InvalidOperationException("A property with lease history cannot be deleted.");
        }

        var unitIds = property.Units.Select(u => u.Id).ToList();
        if (await _context.MaintenanceTickets.AnyAsync(t => unitIds.Contains(t.UnitId)))
        {
            throw new InvalidOperationException("A property with maintenance history cannot be deleted.");
        }

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();
    }

    public async Task<UnitResponseDto> UpdateUnitAsync(Guid id, UpdateUnitRequestDto request)
    {
        var unit = await _context.Units.Include(u => u.Property).Include(u => u.Leases).FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"Unit with ID '{id}' was not found.");

        if (unit.Leases.Any(l => l.IsActive) && request.Status != UnitStatus.Occupied)
        {
            throw new InvalidOperationException("A unit with an active lease must remain Occupied.");
        }

        unit.UnitNumber = request.UnitNumber.Trim();
        unit.Floor = request.Floor;
        unit.Status = request.Status;
        await _context.SaveChangesAsync();
        return new UnitResponseDto { Id = unit.Id, PropertyId = unit.PropertyId, UnitNumber = unit.UnitNumber, Floor = unit.Floor, Status = unit.Status.ToString(), PropertyName = unit.Property.Name };
    }

    public async Task DeleteUnitAsync(Guid id)
    {
        var unit = await _context.Units.Include(u => u.Leases).FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"Unit with ID '{id}' was not found.");

        if (unit.Leases.Count > 0 || await _context.MaintenanceTickets.AnyAsync(t => t.UnitId == id))
        {
            throw new InvalidOperationException("A unit with lease or maintenance history cannot be deleted.");
        }

        _context.Units.Remove(unit);
        await _context.SaveChangesAsync();
    }

    private static PropertyResponseDto MapToPropertyResponseDto(Property property)
    {
        return new PropertyResponseDto
        {
            Id = property.Id,
            Name = property.Name,
            Address = property.Address,
            City = property.City,
            Units = property.Units.Select(u => new UnitResponseDto
            {
                Id = u.Id,
                PropertyId = u.PropertyId,
                UnitNumber = u.UnitNumber,
                Floor = u.Floor,
                Status = u.Status.ToString(),
                PropertyName = property.Name
            }).ToList()
        };
    }
}
