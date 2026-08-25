using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.MaintenanceTickets;
using MaintenanceTicketModel = SmartSpace.API.Models.MaintenanceTickets.MaintenanceTicket;
using TicketImageModel = SmartSpace.API.Models.MaintenanceTickets.TicketImage;
using TicketStatus = SmartSpace.API.Models.MaintenanceTickets.TicketStatus;

namespace SmartSpace.API.Services.MaintenanceTickets;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _db;
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<TicketService> _logger;

    public TicketService(ApplicationDbContext db, IFileStorageService fileStorage, ILogger<TicketService> logger)
    {
        _db = db;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task<TicketDetailResponseDto> CreateTicketAsync(Guid tenantId, TicketCreationRequestDto dto)
    {
        var ticket = new MaintenanceTicketModel
        {
            TenantId = tenantId,
            UnitId = dto.UnitId,
            Description = dto.Description.Trim(),
            UrgencyLevel = dto.UrgencyLevel,
            Status = TicketStatus.Submitted,
            CreatedAt = DateTime.UtcNow
        };

        _db.MaintenanceTickets.Add(ticket);
        await _db.SaveChangesAsync();

        if (dto.Images is { Count: > 0 })
        {
            foreach (var file in dto.Images)
            {
                var url = await _fileStorage.SaveFileAsync(file, ticket.Id);
                _db.TicketImages.Add(new TicketImageModel
                {
                    TicketId = ticket.Id,
                    ImageUrl = url
                });
            }

            await _db.SaveChangesAsync();
        }

        _logger.LogInformation("Ticket {TicketId} created by tenant {TenantId}", ticket.Id, tenantId);

        return await MapToDetailDto(ticket.Id)
               ?? throw new InvalidOperationException("Ticket was created but could not be reloaded.");
    }

    public async Task<List<TicketSummaryResponseDto>> GetTicketsForTenantAsync(Guid tenantId)
    {
        return await _db.MaintenanceTickets
            .Where(t => t.TenantId == tenantId && !t.IsDeleted)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TicketSummaryResponseDto
            {
                Id = t.Id,
                UnitId = t.UnitId,
                UnitNumber = t.Unit != null ? t.Unit.UnitNumber : string.Empty,
                Description = t.Description,
                UrgencyLevel = t.UrgencyLevel.ToString(),
                Status = t.Status.ToString(),
                CreatedAt = t.CreatedAt,
                ThumbnailUrl = t.Images.Select(i => i.ImageUrl).FirstOrDefault()
            })
            .ToListAsync();
    }

    public async Task<List<TicketSummaryResponseDto>> GetAllTicketsAsync(TicketStatus? statusFilter)
    {
        var query = _db.MaintenanceTickets.Where(t => !t.IsDeleted).AsQueryable();

        if (statusFilter.HasValue)
        {
            query = query.Where(t => t.Status == statusFilter.Value);
        }

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TicketSummaryResponseDto
            {
                Id = t.Id,
                UnitId = t.UnitId,
                UnitNumber = t.Unit != null ? t.Unit.UnitNumber : string.Empty,
                Description = t.Description,
                UrgencyLevel = t.UrgencyLevel.ToString(),
                Status = t.Status.ToString(),
                CreatedAt = t.CreatedAt,
                ThumbnailUrl = t.Images.Select(i => i.ImageUrl).FirstOrDefault()
            })
            .ToListAsync();
    }

    public async Task<TicketDetailResponseDto?> GetTicketByIdAsync(Guid ticketId, Guid requestingUserId, string requestingUserRole)
    {
        var ticket = await _db.MaintenanceTickets
            .Include(t => t.Unit)
            .FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted);

        if (ticket == null) return null;

        var isOwner = ticket.TenantId == requestingUserId;
        var isPrivilegedRole = requestingUserRole is "PropertyManager" or "Technician" or "InventoryOfficer";

        if (!isOwner && !isPrivilegedRole)
        {
            return null;
        }

        return await MapToDetailDto(ticketId);
    }

    public async Task<bool> UpdateTicketStatusAsync(Guid ticketId, TicketStatus newStatus)
    {
        var ticket = await _db.MaintenanceTickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted);
        if (ticket == null) return false;

        ticket.Status = newStatus;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteTicketAsync(Guid ticketId)
    {
        var ticket = await _db.MaintenanceTickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted);
        if (ticket == null) return false;

        ticket.IsDeleted = true;
        ticket.DeletedAt = DateTime.UtcNow;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Ticket {TicketId} soft-deleted", ticketId);
        return true;
    }

    private async Task<TicketDetailResponseDto?> MapToDetailDto(Guid ticketId)
    {
        var ticket = await _db.MaintenanceTickets
            .Include(t => t.Unit)
            .Include(t => t.Images)
            .Include(t => t.AgentExecutionLogs)
            .FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted);

        if (ticket == null) return null;

        return new TicketDetailResponseDto
        {
            Id = ticket.Id,
            TenantId = ticket.TenantId,
            UnitId = ticket.UnitId,
            UnitNumber = ticket.Unit?.UnitNumber ?? string.Empty,
            Description = ticket.Description,
            UrgencyLevel = ticket.UrgencyLevel.ToString(),
            Status = ticket.Status.ToString(),
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            ImageUrls = ticket.Images.Select(i => i.ImageUrl).ToList(),
            AgentExecutionLogs = ticket.AgentExecutionLogs
                .OrderBy(l => l.CreatedAt)
                .Select(l => new AgentExecutionLogDto
                {
                    AgentRole = l.AgentRole,
                    ActionTaken = l.ActionTaken,
                    WorkflowState = l.WorkflowState,
                    CreatedAt = l.CreatedAt
                })
                .ToList()
        };
    }
}