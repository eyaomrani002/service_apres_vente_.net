using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AuthAPI.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<LoginAudit> LoginAudits { get; set; }
        public DbSet<UserLoginAttempt> UserLoginAttempts { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configuration pour ApplicationUser
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(u => u.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(u => u.LastName).IsRequired().HasMaxLength(50);
                entity.Property(u => u.PhoneNumber).HasMaxLength(20);
                entity.Property(u => u.CreatedAt).IsRequired();
                entity.Property(u => u.LastLoginAt);
                entity.Property(u => u.IsActive).HasDefaultValue(true);
                entity.Property(static u => u.FailedLoginAttempts).HasDefaultValue(0);
                entity.Property(u => u.LockoutEnd);
            });

            // Configuration pour RefreshToken
            builder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
                entity.Property(e => e.ExpiresOn).IsRequired();
                entity.Property(e => e.CreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.ReplacedByToken).IsRequired(false);
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasIndex(e => e.UserId);
            });

            // Configuration pour LoginAudit
            builder.Entity<LoginAudit>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LoginTime).IsRequired();
                entity.Property(e => e.IPAddress).HasMaxLength(50);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.Success).IsRequired();
                entity.Property(e => e.FailureReason).HasMaxLength(500);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.LoginTime);
                entity.HasIndex(e => e.Email);
            });

            // Configuration pour UserLoginAttempt
            builder.Entity<UserLoginAttempt>(entity =>
            {
                entity.HasKey(e => e.Email);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.FailedAttempts).IsRequired();
                entity.Property(e => e.LockoutEnd);
                entity.Property(e => e.LastAttempt).IsRequired();
            });
        }
    }
}