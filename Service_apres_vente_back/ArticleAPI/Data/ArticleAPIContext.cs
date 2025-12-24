using Microsoft.EntityFrameworkCore;
using ArticleAPI.Models;

namespace ArticleAPI.Data
{
    public class ArticleAPIContext : DbContext
    {
        public ArticleAPIContext(DbContextOptions<ArticleAPIContext> options)
            : base(options)
        {
        }

        public DbSet<Article> Articles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Article>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Reference)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Nom)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Type)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.ImageUrl)
                    .HasMaxLength(300);

                entity.Property(e => e.PrixAchat)
                    .HasColumnType("decimal(10,2)");

                entity.HasIndex(e => e.Reference)
                    .IsUnique();

                // Seed data
                entity.HasData(
                    new Article
                    {
                        Id = 1,
                        Reference = "SAN-001",
                        Nom = "Robinet thermostatique",
                        Type = "Sanitaire",
                        DateAchat = new DateTime(2024, 1, 15),
                        DureeGarantieMois = 24,
                        Description = "Robinet thermostatique pour salle de bain",
                        PrixAchat = 89.99m,
                        EstEnStock = true
                    },
                    new Article
                    {
                        Id = 2,
                        Reference = "CHAU-001",
                        Nom = "Radiateur à eau chaude",
                        Type = "Chauffage",
                        DateAchat = new DateTime(2023, 11, 20),
                        DureeGarantieMois = 36,
                        Description = "Radiateur en aluminium 1500W",
                        PrixAchat = 249.99m,
                        EstEnStock = true
                    },
                    new Article
                    {
                        Id = 3,
                        Reference = "SAN-002",
                        Nom = "WC suspendu",
                        Type = "Sanitaire",
                        DateAchat = new DateTime(2022, 6, 10),
                        DureeGarantieMois = 24,
                        Description = "WC suspendu avec réservoir encastré",
                        PrixAchat = 459.99m,
                        EstEnStock = false
                    }
                );
            });
        }
    }
}