using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs;

/// <summary>
/// DTO for new user registration.
/// Role is omitted from registration input to guarantee that users cannot self-assign elevated roles.
/// </summary>
public record UserRegistrationDto(
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 150 characters.")]
    string FullName,

    [Required(ErrorMessage = "Email address is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    [StringLength(255, ErrorMessage = "Email address cannot exceed 255 characters.")]
    string Email,

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    string Password
);

/// <summary>
/// DTO for user login credentials.
/// </summary>
public record UserLoginDto(
    [Required(ErrorMessage = "Email address is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    string Email,

    [Required(ErrorMessage = "Password is required.")]
    string Password
);

/// <summary>
/// Safe user response DTO that excludes sensitive fields like PasswordHash.
/// </summary>
public record UserResponseDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    DateTime CreatedAt
);

/// <summary>
/// DTO for updating a user's role by an Admin.
/// </summary>
public record ChangeRoleDto(
    [Required(ErrorMessage = "New role is required.")]
    [RegularExpression("^(Admin|Tenant|PropertyManager|InventoryOfficer|Technician)$",
        ErrorMessage = "Invalid role. Allowed roles: Admin, Tenant, PropertyManager, InventoryOfficer, Technician.")]
    string NewRole
);

/// <summary>
/// Response returned upon successful login or registration.
/// Contains both top-level and nested user properties for maximum client compatibility.
/// </summary>
public record AuthSuccessResponseDto(
    string Token,
    Guid Id,
    string Email,
    string FullName,
    string Role,
    UserResponseDto User
);
