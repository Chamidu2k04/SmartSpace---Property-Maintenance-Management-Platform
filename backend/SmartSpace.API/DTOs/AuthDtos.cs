using System.ComponentModel.DataAnnotations;
using SmartSpace.API.Models;

namespace SmartSpace.API.DTOs;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required] string FullName,
    [Required] UserRole Role
);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponseDto(
    string Token,
    Guid Id,
    string Email,
    string FullName,
    string Role
);

public record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    DateTime CreatedAt
);
