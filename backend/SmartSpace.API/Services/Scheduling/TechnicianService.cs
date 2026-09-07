using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.Scheduling;
using SmartSpace.API.Models;
using SmartSpace.API.Models.Scheduling;

namespace SmartSpace.API.Services.Scheduling;

/// <summary>
/// Service implementation handling technician profile business logic and EF Core database operations.
/// </summary>
public class TechnicianService : ITechnicianService
{
    private readonly ApplicationDbContext _context;

    public TechnicianService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Creates a technician profile. Looks up an existing user by email or creates a new User in the Users table first, 
    /// then creates the TechnicianProfile.
    /// </summary>
    public async Task<TechnicianProfileResponseDto> CreateTechnicianAsync(CreateTechnicianProfileDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto), "Technician DTO cannot be null.");
        }

        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.FullName))
        {
            throw new ArgumentException("Email and FullName must be provided to create a technician.");
        }

        Guid targetUserId;

        // Check if user with this email already exists in Users table
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (existingUser != null)
        {
            targetUserId = existingUser.Id;
        }
        else
        {
            // Save new User details into the Users table
            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                FullName = dto.FullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(string.IsNullOrWhiteSpace(dto.Password) ? "Password123!" : dto.Password),
                Role = UserRole.Technician,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            targetUserId = newUser.Id;
        }

        // Save Technician Profile data into the TechnicianProfiles table
        var technician = new TechnicianProfile
        {
            Id = Guid.NewGuid(),
            UserId = targetUserId,
            TradeSpecialty = dto.TradeSpecialty,
            HourlyRate = dto.HourlyRate
        };

        _context.TechnicianProfiles.Add(technician);
        await _context.SaveChangesAsync();

        return await MapToResponseDtoAsync(technician);
    }

    /// <summary>
    /// Retrieves a single technician profile by its unique identifier.
    /// </summary>
    public async Task<TechnicianProfileResponseDto?> GetTechnicianByIdAsync(Guid id)
    {
        var technician = await _context.TechnicianProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id || t.UserId == id);

        if (technician == null)
        {
            return null;
        }

        return await MapToResponseDtoAsync(technician);
    }

    /// <summary>
    /// Retrieves all technician profiles registered in the system.
    /// </summary>
    public async Task<IEnumerable<TechnicianProfileResponseDto>> GetAllTechniciansAsync()
    {
        var technicians = await _context.TechnicianProfiles
            .AsNoTracking()
            .ToListAsync();

        var result = new List<TechnicianProfileResponseDto>();
        foreach (var tech in technicians)
        {
            result.Add(await MapToResponseDtoAsync(tech));
        }

        return result;
    }

    /// <summary>
    /// Updates technician profile details (trade specialty, hourly rate) and user details (email, full name).
    /// </summary>
    public async Task<TechnicianProfileResponseDto?> UpdateTechnicianAsync(Guid id, UpdateTechnicianProfileDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto), "Update DTO cannot be null.");
        }

        var technician = await _context.TechnicianProfiles.FirstOrDefaultAsync(t => t.Id == id || t.UserId == id);
        if (technician == null)
        {
            return null;
        }

        // Update technician profile details
        technician.TradeSpecialty = dto.TradeSpecialty;
        technician.HourlyRate = dto.HourlyRate;
        _context.TechnicianProfiles.Update(technician);

        // Update corresponding user details in Users table
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == technician.UserId);
        if (user != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var existingUserWithEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != user.Id);
                if (existingUserWithEmail != null)
                {
                    throw new ArgumentException($"User with email '{dto.Email}' already exists.");
                }
                user.Email = dto.Email;
            }
            if (!string.IsNullOrWhiteSpace(dto.FullName))
            {
                user.FullName = dto.FullName;
            }
            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }
            _context.Users.Update(user);
        }

        await _context.SaveChangesAsync();

        return await MapToResponseDtoAsync(technician);
    }

    /// <summary>
    /// Removes a technician profile, associated appointments, and the corresponding user account from the database.
    /// </summary>
    public async Task<bool> DeleteTechnicianAsync(Guid id)
    {
        var technician = await _context.TechnicianProfiles
            .FirstOrDefaultAsync(t => t.Id == id || t.UserId == id);

        if (technician == null)
        {
            return false;
        }

        // Remove associated appointments
        var appointments = await _context.Appointments
            .Where(a => a.TechnicianId == technician.Id)
            .ToListAsync();

        if (appointments.Any())
        {
            _context.Appointments.RemoveRange(appointments);
        }

        // Remove corresponding user account from Users table
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == technician.UserId);
        if (user != null)
        {
            _context.Users.Remove(user);
        }

        _context.TechnicianProfiles.Remove(technician);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Helper method to map TechnicianProfile entity to TechnicianProfileResponseDto including User information.
    /// </summary>
    private async Task<TechnicianProfileResponseDto> MapToResponseDtoAsync(TechnicianProfile technician)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == technician.UserId);

        return new TechnicianProfileResponseDto
        {
            Id = technician.Id,
            UserId = technician.UserId,
            Email = user?.Email,
            FullName = user?.FullName,
            TradeSpecialty = technician.TradeSpecialty,
            HourlyRate = technician.HourlyRate
        };
    }
}
