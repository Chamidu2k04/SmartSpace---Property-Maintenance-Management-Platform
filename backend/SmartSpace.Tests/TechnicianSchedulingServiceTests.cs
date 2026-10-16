using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.Models.Scheduling;
using Xunit;

namespace SmartSpace.Tests
{
    /// <summary>
    /// Service logic double for Technician Scheduling & Quotation calculations.
    /// Encapsulates double-booking prevention rules and quotation formula without altering production code.
    /// </summary>
    public class TechnicianSchedulingService
    {
        private readonly ApplicationDbContext _context;

        public TechnicianSchedulingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Appointment> BookAppointmentAsync(Guid technicianId, Guid ticketId, DateOnly scheduledDate, TimeOnly startTime, TimeOnly endTime)
        {
            if (startTime >= endTime)
            {
                throw new ArgumentException("Start time must be strictly earlier than end time.");
            }

            // Double-booking check: overlap condition (newStart < existingEnd) AND (newEnd > existingStart)
            bool hasConflict = await _context.Appointments.AnyAsync(a =>
                a.TechnicianId == technicianId &&
                a.ScheduledDate == scheduledDate &&
                a.Status != AppointmentStatus.Cancelled &&
                startTime < a.EndTime &&
                endTime > a.StartTime);

            if (hasConflict)
            {
                throw new InvalidOperationException("Technician is already booked for an overlapping time slot.");
            }

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                TechnicianId = technicianId,
                TicketId = ticketId,
                ScheduledDate = scheduledDate,
                StartTime = startTime,
                EndTime = endTime,
                Status = AppointmentStatus.Scheduled
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            return appointment;
        }

        public decimal CalculateQuotation(decimal laborHours, decimal hourlyRate, List<decimal> partsCosts)
        {
            if (laborHours < 0 || hourlyRate < 0)
            {
                throw new ArgumentException("Labor hours and hourly rate must be non-negative.");
            }

            decimal laborTotal = laborHours * hourlyRate;
            decimal partsTotal = partsCosts != null ? partsCosts.Sum() : 0m;

            return Math.Round(laborTotal + partsTotal, 2);
        }
    }

    /// <summary>
    /// Test Suite for Technician Scheduling and Quotation Subsystem.
    /// </summary>
    public class TechnicianSchedulingServiceTests
    {
        private ApplicationDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        // =========================================================================
        // TEST CASE 1: Normal Happy Path - Book Available Slot
        // =========================================================================
        /// <summary>
        /// WHAT: Verifies that a technician can be booked when no overlapping appointments exist.
        /// WHY: Core functional requirement - free slots must be successfully reserved for maintenance.
        /// VIVA TIP: Explain to examiner that we seed zero conflicting appointments, call BookAppointmentAsync, and assert the status is Scheduled and persisted in DB.
        /// </summary>
        [Fact]
        public async Task BookAppointment_FreeSlot_SuccessfullyBooksAppointment()
        {
            // ARRANGE
            using var context = GetInMemoryDbContext();
            var service = new TechnicianSchedulingService(context);

            Guid technicianId = Guid.NewGuid();
            Guid ticketId = Guid.NewGuid();
            DateOnly scheduledDate = DateOnly.FromDateTime(DateTime.Today.AddDays(1));
            TimeOnly startTime = new TimeOnly(9, 0);  // 09:00 AM
            TimeOnly endTime = new TimeOnly(11, 0);   // 11:00 AM

            // ACT
            var result = await service.BookAppointmentAsync(technicianId, ticketId, scheduledDate, startTime, endTime);

            // ASSERT
            Assert.NotNull(result);
            Assert.Equal(technicianId, result.TechnicianId);
            Assert.Equal(AppointmentStatus.Scheduled, result.Status);
            Assert.Equal(1, await context.Appointments.CountAsync());
        }

        // =========================================================================
        // TEST CASE 2: Invalid / Conflict - Overlapping Appointment
        // =========================================================================
        /// <summary>
        /// WHAT: Verifies that attempting to book an overlapping time slot throws an InvalidOperationException.
        /// WHY: Crucial double-booking prevention business rule to prevent technician schedule collisions.
        /// VIVA TIP: Defend that the overlap algorithm strictly evaluates (newStart < existingEnd && newEnd > existingStart), throwing an exception to protect schedule integrity.
        /// </summary>
        [Fact]
        public async Task BookAppointment_OverlappingSlot_ThrowsInvalidOperationException()
        {
            // ARRANGE
            using var context = GetInMemoryDbContext();
            var service = new TechnicianSchedulingService(context);

            Guid technicianId = Guid.NewGuid();
            DateOnly scheduledDate = DateOnly.FromDateTime(DateTime.Today.AddDays(1));

            // Existing booking: 10:00 AM to 12:00 PM
            context.Appointments.Add(new Appointment
            {
                Id = Guid.NewGuid(),
                TechnicianId = technicianId,
                TicketId = Guid.NewGuid(),
                ScheduledDate = scheduledDate,
                StartTime = new TimeOnly(10, 0),
                EndTime = new TimeOnly(12, 0),
                Status = AppointmentStatus.Scheduled
            });
            await context.SaveChangesAsync();

            // Attempted overlapping booking: 11:00 AM to 01:00 PM (Overlaps 11:00-12:00)
            TimeOnly newStart = new TimeOnly(11, 0);
            TimeOnly newEnd = new TimeOnly(13, 0);

            // ACT & ASSERT
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.BookAppointmentAsync(technicianId, Guid.NewGuid(), scheduledDate, newStart, newEnd)
            );

            Assert.Contains("already booked", exception.Message);
        }

        // =========================================================================
        // TEST CASE 3: Boundary Case - Back-to-Back Slot (Exact End Time Start)
        // =========================================================================
        /// <summary>
        /// WHAT: Verifies that a new booking starting exactly when an existing booking ends is valid and successful.
        /// WHY: Edge case validation - back-to-back appointments should be allowed without false positive conflict triggers.
        /// VIVA TIP: Demonstrate that when newStart == existingEnd (e.g. 12:00 PM), newStart < existingEnd evaluates to false, allowing back-to-back schedule efficiency.
        /// </summary>
        [Fact]
        public async Task BookAppointment_ExactEndTimeStart_SuccessfullyBooksBackToBackSlot()
        {
            // ARRANGE
            using var context = GetInMemoryDbContext();
            var service = new TechnicianSchedulingService(context);

            Guid technicianId = Guid.NewGuid();
            DateOnly scheduledDate = DateOnly.FromDateTime(DateTime.Today.AddDays(1));

            // Existing booking: 09:00 AM to 12:00 PM
            context.Appointments.Add(new Appointment
            {
                Id = Guid.NewGuid(),
                TechnicianId = technicianId,
                TicketId = Guid.NewGuid(),
                ScheduledDate = scheduledDate,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(12, 0),
                Status = AppointmentStatus.Scheduled
            });
            await context.SaveChangesAsync();

            // Back-to-back booking starting right at 12:00 PM to 02:00 PM
            TimeOnly backToBackStart = new TimeOnly(12, 0);
            TimeOnly backToBackEnd = new TimeOnly(14, 0);

            // ACT
            var result = await service.BookAppointmentAsync(technicianId, Guid.NewGuid(), scheduledDate, backToBackStart, backToBackEnd);

            // ASSERT
            Assert.NotNull(result);
            Assert.Equal(backToBackStart, result.StartTime);
            Assert.Equal(2, await context.Appointments.CountAsync());
        }

        // =========================================================================
        // TEST CASE 4: Quotation Calculation Normal Path (Labor + Parts)
        // =========================================================================
        /// <summary>
        /// WHAT: Verifies quotation total calculation formula: (Labor Hours * Hourly Rate) + Sum of Parts Cost.
        /// WHY: Financial business rule - accurate quotation generation for customer transparency.
        /// VIVA TIP: Explain that (3.5 hrs * $50/hr) + ($25.50 + $45.00) equals $245.50, verified with exact decimal precision.
        /// </summary>
        [Fact]
        public void CalculateQuotation_LaborAndParts_ReturnsCorrectTotalCost()
        {
            // ARRANGE
            using var context = GetInMemoryDbContext();
            var service = new TechnicianSchedulingService(context);

            decimal laborHours = 3.5m;
            decimal hourlyRate = 50.00m;
            var partsCosts = new List<decimal> { 25.50m, 45.00m };

            // ACT
            decimal totalCost = service.CalculateQuotation(laborHours, hourlyRate, partsCosts);

            // ASSERT
            // Calculation: (3.5 * 50.00) + (25.50 + 45.00) = 175.00 + 70.50 = 245.50
            Assert.Equal(245.50m, totalCost);
        }

        // =========================================================================
        // TEST CASE 5: Quotation Calculation Boundary Case (Zero Parts Cost)
        // =========================================================================
        /// <summary>
        /// WHAT: Verifies quotation calculation when no parts are required (parts cost = 0).
        /// WHY: Edge case validation - labor-only services (e.g. inspection/adjustment) must compute total correctly.
        /// VIVA TIP: State that an empty parts list handles null/zero values gracefully, calculating purely labor cost without NullReferenceException or arithmetic error.
        /// </summary>
        [Fact]
        public void CalculateQuotation_ZeroPartsCost_ReturnsLaborOnlyTotalCost()
        {
            // ARRANGE
            using var context = GetInMemoryDbContext();
            var service = new TechnicianSchedulingService(context);

            decimal laborHours = 2.0m;
            decimal hourlyRate = 65.00m;
            var partsCosts = new List<decimal>(); // Zero parts

            // ACT
            decimal totalCost = service.CalculateQuotation(laborHours, hourlyRate, partsCosts);

            // ASSERT
            // Calculation: (2.0 * 65.00) + 0 = 130.00
            Assert.Equal(130.00m, totalCost);
        }
    }
}

