using SmartSpace.API.DTOs.MaintenanceTickets;
using TicketStatus = SmartSpace.API.Models.MaintenanceTickets.TicketStatus;

namespace SmartSpace.API.Services.MaintenanceTickets;

public interface ITicketService
{
    Task<TicketDetailResponseDto> CreateTicketAsync(Guid tenantId, TicketCreationRequestDto dto);

    Task<List<TicketSummaryResponseDto>> GetTicketsForTenantAsync(Guid tenantId);

    Task<List<TicketSummaryResponseDto>> GetAllTicketsAsync(TicketStatus? statusFilter);

    Task<TicketDetailResponseDto?> GetTicketByIdAsync(Guid ticketId, Guid requestingUserId, string requestingUserRole);

    Task<bool> UpdateTicketStatusAsync(Guid ticketId, TicketStatus newStatus);

    Task<bool> DeleteTicketAsync(Guid ticketId);
}