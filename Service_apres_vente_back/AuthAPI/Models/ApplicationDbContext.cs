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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configuration pour ApplicationUser
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(u => u.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(u => u.LastName).IsRequired().HasMaxLength(50);
                entity.Property(u => u.CreatedAt).IsRequired();
                entity.Property(u => u.LastLoginAt);
                entity.Property(u => u.IsActive).HasDefaultValue(true);
            });

            // Configuration pour RefreshToken - SIMPLIFIÉ
            builder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Token)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.UserId)
                    .IsRequired()
                    .HasMaxLength(450);

                entity.Property(e => e.ExpiresOn)
                    .IsRequired();

                entity.Property(e => e.CreatedOn)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(e => e.ReplacedByToken)
                    .IsRequired(false);

                // Index unique sur le token
                entity.HasIndex(e => e.Token)
                    .IsUnique();

                // Index sur UserId pour les performances
                entity.HasIndex(e => e.UserId);

                // RETIREZ la relation ForeignKey pour éviter les problèmes de cascade
                // entity.HasOne<ApplicationUser>()
                //     .WithMany()
                //     .HasForeignKey(rt => rt.UserId)
                //     .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}