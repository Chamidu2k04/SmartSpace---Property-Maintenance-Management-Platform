using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Models.Scheduling;

namespace SmartSpace.API.Data.Scheduling;

/// <summary>
/// EF Core ModelBuilder configurations strictly for Component 4: Scheduling module (TechnicianProfiles, Appointments, Quotations).
/// </summary>
public static class SchedulingDbContextExtensions
{
    /// <summary>
    /// Extension method to configure EF Core mappings for all Scheduling entities.
    /// </summary>
    public static void ConfigureSchedulingModule(this ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TechnicianProfile>(entity =>
        {
            entity.ToTable("TechnicianProfiles");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.TradeSpecialty).HasConversion<string>().IsRequired();
            entity.Property(t => t.HourlyRate).HasColumnType("decimal(18,2)").IsRequired();
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("Appointments");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Status).HasConversion<string>().IsRequired();
        });

        modelBuilder.Entity<Quotation>(entity =>
        {
            entity.ToTable("Quotations");
            entity.HasKey(q => q.Id);
            entity.Property(q => q.LaborCost).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(q => q.PartsCost).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(q => q.TotalCost).HasColumnType("decimal(18,2)").IsRequired();
        });
    }
}
