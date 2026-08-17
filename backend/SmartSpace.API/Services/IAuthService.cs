using SmartSpace.API.DTOs;

namespace SmartSpace.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserProfileDto?> GetUserProfileAsync(Guid userId);
}
