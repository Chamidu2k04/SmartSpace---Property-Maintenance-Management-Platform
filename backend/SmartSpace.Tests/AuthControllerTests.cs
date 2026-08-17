using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace SmartSpace.Tests;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetProfile_WithoutToken_ShouldReturn401Unauthorized()
    {
        // Act - Send request without Authorization header
        var response = await _client.GetAsync("/api/auth/profile");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
