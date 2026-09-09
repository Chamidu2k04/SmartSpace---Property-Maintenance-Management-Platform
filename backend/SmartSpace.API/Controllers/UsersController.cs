using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs;
using SmartSpace.API.Models;

namespace SmartSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.PropertyManager))]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Returns safe user summaries, optionally filtered by role.</summary>
    [HttpGet]
    public async Task<ActionResult<List<UserSummaryDto>>> GetUsers([FromQuery] UserRole? role = null)
    {
        var query = _context.Users.AsNoTracking();
        if (role.HasValue)
        {
            query = query.Where(user => user.Role == role.Value);
        }

        var userRecords = await query
            .OrderBy(user => user.FullName)
            .Select(user => new { user.Id, user.Email, user.FullName, user.Role })
            .ToListAsync();

        var users = userRecords
            .Select(user => new UserSummaryDto(user.Id, user.Email, user.FullName, user.Role.ToString()))
            .ToList();

        return Ok(users);
    }
}
