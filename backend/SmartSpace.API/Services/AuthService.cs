using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs;
using SmartSpace.API.Models;

namespace SmartSpace.API.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public AuthService(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var normalizedEmail = dto.Email.ToLowerInvariant().Trim();

        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            FullName = dto.FullName.Trim(),
            Role = dto.Role,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);
        return new AuthResponseDto(token, user.Id, user.Email, user.FullName, user.Role.ToString());
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var normalizedEmail = dto.Email.ToLowerInvariant().Trim();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || !_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var token = _jwtService.GenerateToken(user);
        return new AuthResponseDto(token, user.Id, user.Email, user.FullName, user.Role.ToString());
    }

    public async Task<UserProfileDto?> GetUserProfileAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.CreatedAt
        );
    }
}
