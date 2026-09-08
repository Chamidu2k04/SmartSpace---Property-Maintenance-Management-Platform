using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.Scheduling;
using SmartSpace.API.Models.Scheduling;

namespace SmartSpace.API.Services.Scheduling;

/// <summary>
/// Service implementation managing appointment business rules, validations, and EF Core operations.
/// </summary>
public class AppointmentService : IAppointmentService
{
    private readonly ApplicationDbContext _context;

    public AppointmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Creates a new maintenance appointment after running all required business validations.
    /// </summary>
    public async Task<AppointmentResponseDto> CreateAppointmentAsync(CreateAppointmentDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto), "Appointment data cannot be null.");
        }

        // 1. TicketId Verification: Ensure TicketId is not an empty GUID
        if (dto.TicketId == Guid.Empty)
        {
            throw new ArgumentException("TicketId cannot be empty.", nameof(dto.TicketId));
        }

        // 2. Time Validation: Ensure StartTime is strictly earlier than EndTime
        if (dto.StartTime >= dto.EndTime)
        {
            throw new ArgumentException("StartTime must be strictly earlier than EndTime.");
        }

        // 3. Foreign Key Verification: Ensure TechnicianId exists in TechnicianProfiles
        var technicianExists = await _context.TechnicianProfiles
            .AnyAsync(t => t.Id == dto.TechnicianId);

        if (!technicianExists)
        {
            throw new ArgumentException($"Technician with ID '{dto.TechnicianId}' does not exist.");
        }

        // 4. Conflict / Double-Booking Prevention: Check for overlapping active appointments on the same date
        // Overlap condition: (newStart < existingEnd) && (newEnd > existingStart)
        var hasConflict = await _context.Appointments.AnyAsync(a =>
            a.TechnicianId == dto.TechnicianId &&
            a.ScheduledDate == dto.ScheduledDate &&
            a.Status != AppointmentStatus.Cancelled &&
            dto.StartTime < a.EndTime &&
            dto.EndTime > a.StartTime);

        if (hasConflict)
        {
            throw new ArgumentException("Technician already has an overlapping appointment scheduled for this date and time.");
        }

        // Map DTO directly to Model entity
        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            TicketId = dto.TicketId,
            TechnicianId = dto.TechnicianId,
            ScheduledDate = dto.ScheduledDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Status = AppointmentStatus.Scheduled
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return MapToResponseDto(appointment);
    }

    /// <summary>
    /// Fetches an appointment by its unique identifier.
    /// </summary>
    public async Task<AppointmentResponseDto?> GetAppointmentByIdAsync(Guid id)
    {
        var appointment = await _context.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment == null)
        {
            return null;
        }

        return MapToResponseDto(appointment);
    }

    /// <summary>
    /// Fetches all appointments recorded in the platform.
    /// </summary>
    public async Task<IEnumerable<AppointmentResponseDto>> GetAllAppointmentsAsync()
    {
        var appointments = await _context.Appointments
            .AsNoTracking()
            .ToListAsync();

        return appointments.Select(MapToResponseDto).ToList();
    }

    /// <summary>
    /// Fetches all appointments assigned to a specific technician.
    /// </summary>
    public async Task<IEnumerable<AppointmentResponseDto>> GetAppointmentsByTechnicianIdAsync(Guid technicianId)
    {
        var appointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TechnicianId == technicianId)
            .ToListAsync();

        return appointments.Select(MapToResponseDto).ToList();
    }

    /// <summary>
    /// Updates the scheduled date and time range for an existing appointment.
    /// </summary>
    public async Task<AppointmentResponseDto?> UpdateScheduleAsync(Guid id, UpdateAppointmentScheduleDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto), "Schedule update data cannot be null.");
        }

        // 1. Time Validation: Ensure StartTime is strictly earlier than EndTime
        if (dto.StartTime >= dto.EndTime)
        {
            throw new ArgumentException("StartTime must be strictly earlier than EndTime.");
        }

        // Find existing appointment record
        var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id);
        if (appointment == null)
        {
            return null;
        }

        // Determine target technician (use newly provided TechnicianId if valid, otherwise keep existing)
        var targetTechnicianId = appointment.TechnicianId;
        if (dto.TechnicianId.HasValue && dto.TechnicianId.Value != Guid.Empty)
        {
            // Verify new TechnicianId exists in TechnicianProfiles
            var technicianExists = await _context.TechnicianProfiles
                .AnyAsync(t => t.Id == dto.TechnicianId.Value);

            if (!technicianExists)
            {
                throw new ArgumentException($"Technician with ID '{dto.TechnicianId.Value}' does not exist.");
            }

            targetTechnicianId = dto.TechnicianId.Value;
        }

        // Determine target status
        var targetStatus = dto.Status ?? appointment.Status;

        // 2. Conflict / Double-Booking Prevention: Check overlapping active appointments for the target technician
        if (targetStatus != AppointmentStatus.Cancelled)
        {
            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.Id != id &&
                a.TechnicianId == targetTechnicianId &&
                a.ScheduledDate == dto.ScheduledDate &&
                a.Status != AppointmentStatus.Cancelled &&
                dto.StartTime < a.EndTime &&
                dto.EndTime > a.StartTime);

            if (hasConflict)
            {
                throw new ArgumentException("Technician already has an overlapping appointment scheduled for this date and time.");
            }
        }

        // Update appointment details
        appointment.ScheduledDate = dto.ScheduledDate;
        appointment.StartTime = dto.StartTime;
        appointment.EndTime = dto.EndTime;
        appointment.TechnicianId = targetTechnicianId;

        if (dto.Status.HasValue)
        {
            appointment.Status = dto.Status.Value;
        }

        _context.Appointments.Update(appointment);
        await _context.SaveChangesAsync();

        return MapToResponseDto(appointment);
    }

    /// <summary>
    /// Performs soft cancellation of an appointment by updating its Status to Cancelled without deleting the database record.
    /// </summary>
    public async Task<bool> CancelAppointmentAsync(Guid id)
    {
        var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id);
        if (appointment == null)
        {
            return false;
        }

        // Update status to Cancelled (Soft cancellation)
        appointment.Status = AppointmentStatus.Cancelled;

        _context.Appointments.Update(appointment);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// Explicit mapping helper converting Appointment Entity directly into AppointmentResponseDto.
    /// </summary>
    private static AppointmentResponseDto MapToResponseDto(Appointment appointment)
    {
        return new AppointmentResponseDto
        {
            Id = appointment.Id,
            TicketId = appointment.TicketId,
            TechnicianId = appointment.TechnicianId,
            ScheduledDate = appointment.ScheduledDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = appointment.Status
        };
    }
}
