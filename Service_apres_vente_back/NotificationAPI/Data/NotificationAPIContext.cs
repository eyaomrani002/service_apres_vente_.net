using Microsoft.EntityFrameworkCore;
using NotificationAPI.Models;

namespace NotificationAPI.Data
{
    public class NotificationAPIContext : DbContext
    {
        public NotificationAPIContext(DbContextOptions<NotificationAPIContext> options)
            : base(options)
        {
        }

        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Recipient).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Subject).HasMaxLength(200);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            });
        }
    }
}
