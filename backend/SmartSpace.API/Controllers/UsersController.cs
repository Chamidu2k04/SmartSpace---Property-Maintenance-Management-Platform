using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs;
using SmartSpace.API.Models;

namespace SmartSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,PropertyManager")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Returns a list of users. Supports filtering by search keyword and role.
    /// Example: GET /api/users?search=john&role=Tenant
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] string? search = null, [FromQuery] UserRole? role = null)
    {
        IQueryable<User> query = _context.Users.AsNoTracking();

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term));
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserResponseDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Role.ToString(),
                u.CreatedAt
            ))
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Update a specific user's system role (Admin only).
    /// Example: PUT /api/users/{id}/role
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/role")]
    [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] ChangeRoleDto dto)
    {
        // Prevent an administrator from modifying their own role
        var currentAdminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (Guid.TryParse(currentAdminIdClaim, out var currentAdminId) && currentAdminId == id)
        {
            return BadRequest(new { message = "You cannot modify your own administrator role." });
        }

        if (!Enum.TryParse<UserRole>(dto.NewRole, true, out var parsedRole))
        {
            return BadRequest(new
            {
                message = $"Invalid role '{dto.NewRole}'. Allowed roles: Admin, Tenant, PropertyManager, InventoryOfficer, Technician."
            });
        }

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = $"User with ID '{id}' was not found." });
        }

        user.Role = parsedRole;
        await _context.SaveChangesAsync();

        return Ok(new UserResponseDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.CreatedAt
        ));
    }
}