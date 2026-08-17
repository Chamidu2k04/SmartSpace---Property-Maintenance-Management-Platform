using SmartSpace.API.Services;
using Xunit;

namespace SmartSpace.Tests;

public class PasswordHasherTests
{
    private readonly IPasswordHasher _hasher;

    public PasswordHasherTests()
    {
        _hasher = new BCryptPasswordHasher();
    }

    [Fact]
    public void HashPassword_ShouldReturnHashedString_AndVerifyCorrectly()
    {
        // Arrange
        string plainPassword = "SecurePassword123!";

        // Act
        string hashedPassword = _hasher.HashPassword(plainPassword);
        bool isValid = _hasher.VerifyPassword(plainPassword, hashedPassword);
        bool isInvalid = _hasher.VerifyPassword("WrongPassword!", hashedPassword);

        // Assert
        Assert.NotNull(hashedPassword);
        Assert.NotEqual(plainPassword, hashedPassword);
        Assert.True(isValid, "VerifyPassword should return true for correct password.");
        Assert.False(isInvalid, "VerifyPassword should return false for incorrect password.");
    }
}
