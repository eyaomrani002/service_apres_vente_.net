using Microsoft.EntityFrameworkCore;
using ReportingAPI.Models;

namespace ReportingAPI.Data
{
    public class ReportingAPIContext : DbContext
    {
        public ReportingAPIContext(DbContextOptions<ReportingAPIContext> options)
            : base(options)
        {
        }

        public DbSet<Report> Reports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Report>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Url).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Title).HasMaxLength(200);
                entity.Property(e => e.Total).HasColumnType("decimal(10,2)");
            });
        }
    }
}
