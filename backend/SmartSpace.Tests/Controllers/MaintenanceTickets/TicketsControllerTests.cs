using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SmartSpace.API.Controllers.MaintenanceTickets;
using SmartSpace.API.DTOs.MaintenanceTickets;
using SmartSpace.API.Models.MaintenanceTickets;
using SmartSpace.API.Services.MaintenanceTickets;
using Xunit;

namespace SmartSpace.Tests.Controllers.MaintenanceTickets;

public class TicketsControllerTests
{
    private readonly Mock<ITicketService> _mockTicketService;
    private readonly TicketsController _controller;
    private readonly Guid _tenantId = Guid.NewGuid();

    public TicketsControllerTests()
    {
        _mockTicketService = new Mock<ITicketService>();
        _controller = new TicketsController(_mockTicketService.Object);

        // Mock the User context for authorization
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _tenantId.ToString()),
            new Claim(ClaimTypes.Role, "Tenant")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    // ---------------------------------------------------------
    // CreateTicket Tests
    // ---------------------------------------------------------

    // VIVA PREP: This tests the "normal" (happy path) scenario where a valid request
    // successfully creates a ticket and returns a 201 Created response.
    [Fact]
    public async Task CreateTicket_ValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var requestDto = new TicketCreationRequestDto
        {
            UnitId = Guid.NewGuid(),
            Description = "Leaking pipe in bathroom",
            UrgencyLevel = UrgencyLevel.Medium
        };

        var createdTicket = new TicketDetailResponseDto
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            UnitId = requestDto.UnitId,
            Description = requestDto.Description,
            UrgencyLevel = requestDto.UrgencyLevel.ToString(),
            Status = TicketStatus.Submitted.ToString()
        };

        _mockTicketService
            .Setup(s => s.CreateTicketAsync(_tenantId, requestDto))
            .ReturnsAsync(createdTicket);

        // Act
        var result = await _controller.CreateTicket(requestDto);

        // Assert
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(TicketsController.GetTicketById), createdAtActionResult.ActionName);
        var returnValue = Assert.IsType<TicketDetailResponseDto>(createdAtActionResult.Value);
        Assert.Equal(createdTicket.Id, returnValue.Id);
    }

    // VIVA PREP: This is an "invalid" case testing validation. If the Model is invalid
    // (e.g., missing required fields), the controller should return a 400 Bad Request.
    [Fact]
    public async Task CreateTicket_InvalidModelState_ReturnsValidationProblem()
    {
        // Arrange
        _controller.ModelState.AddModelError("Description", "Required");
        var requestDto = new TicketCreationRequestDto(); // Missing fields

        // Act
        var result = await _controller.CreateTicket(requestDto);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.IsType<ValidationProblemDetails>(objectResult.Value);
    }

    // VIVA PREP: This is a "boundary" or error handling case where the service throws an
    // ArgumentException (e.g., invalid unit or tenant mismatch), returning a 400 Bad Request.
    [Fact]
    public async Task CreateTicket_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var requestDto = new TicketCreationRequestDto
        {
            UnitId = Guid.NewGuid(),
            Description = "Broken window",
            UrgencyLevel = UrgencyLevel.Low
        };

        _mockTicketService
            .Setup(s => s.CreateTicketAsync(_tenantId, requestDto))
            .ThrowsAsync(new ArgumentException("Invalid unit ID"));

        // Act
        var result = await _controller.CreateTicket(requestDto);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    // ---------------------------------------------------------
    // UpdateStatus Tests
    // ---------------------------------------------------------

    // VIVA PREP: Tests the successful "normal" update of a ticket's status.
    // It verifies that a 204 No Content is returned when the update succeeds.
    [Fact]
    public async Task UpdateStatus_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var ticketId = Guid.NewGuid();
        var updateDto = new UpdateTicketStatusDto { Status = TicketStatus.Scheduled };

        _mockTicketService
            .Setup(s => s.UpdateTicketStatusAsync(ticketId, updateDto.Status))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UpdateStatus(ticketId, updateDto);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    // VIVA PREP: This is an "invalid" boundary case where we try to update
    // a ticket that doesn't exist, expecting a 404 Not Found response.
    [Fact]
    public async Task UpdateStatus_TicketNotFound_ReturnsNotFound()
    {
        // Arrange
        var ticketId = Guid.NewGuid();
        var updateDto = new UpdateTicketStatusDto { Status = TicketStatus.Completed };

        _mockTicketService
            .Setup(s => s.UpdateTicketStatusAsync(ticketId, updateDto.Status))
            .ReturnsAsync(false); // Indicates ticket wasn't found

        // Act
        var result = await _controller.UpdateStatus(ticketId, updateDto);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }
}
