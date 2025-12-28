using Microsoft.EntityFrameworkCore;
using CalendarAPI.Models;

namespace CalendarAPI.Data
{
    public class CalendarAPIContext : DbContext
    {
        public CalendarAPIContext(DbContextOptions<CalendarAPIContext> options)
            : base(options)
        {
        }

        public DbSet<Appointment> Appointments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Planned");
            });
        }
    }
}
