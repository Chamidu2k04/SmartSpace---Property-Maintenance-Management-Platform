using SmartSpace.API.Models;

namespace SmartSpace.API.Services;

public interface IJwtService
{
    string GenerateToken(User user);
}
