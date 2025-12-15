using Microsoft.EntityFrameworkCore;
using ClientAPI.Models;

namespace ClientAPI.Data
{
    public class ClientAPIContext : DbContext
    {
        public ClientAPIContext(DbContextOptions<ClientAPIContext> options)
            : base(options)
        {
        }

        public DbSet<Client> Clients { get; set; }
        public DbSet<Reclamation> Reclamations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuration Client
            modelBuilder.Entity<Client>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Nom)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Telephone)
                    .HasMaxLength(20);

                entity.Property(e => e.Adresse)
                    .HasMaxLength(200);

                entity.HasIndex(e => e.Email)
                    .IsUnique();
            });

            // Configuration Reclamation
            modelBuilder.Entity<Reclamation>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Description)
                    .IsRequired()
                    .HasMaxLength(1000);

                entity.Property(e => e.Statut)
                    .IsRequired()
                    .HasMaxLength(50)
                    .HasDefaultValue("En attente");

                entity.Property(e => e.DateCreation)
                    .HasDefaultValueSql("GETDATE()");

                // Relation Client -> Reclamations
                entity.HasOne(r => r.Client)
                    .WithMany(c => c.Reclamations)
                    .HasForeignKey(r => r.ClientId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Index pour les recherches
                entity.HasIndex(e => e.Statut);
                entity.HasIndex(e => e.DateCreation);
            });

            // Données initiales
            modelBuilder.Entity<Client>().HasData(
                new Client
                {
                    Id = 1,
                    Nom = "Mohamed Ben Ali",
                    Email = "mohamed@example.com",
                    Telephone = "12345678",
                    Adresse = "Tunis, Tunisie"
                },
                new Client
                {
                    Id = 2,
                    Nom = "Fatma Ahmed",
                    Email = "fatma@example.com",
                    Telephone = "87654321",
                    Adresse = "Sousse, Tunisie"
                }
            );

            modelBuilder.Entity<Reclamation>().HasData(
                new Reclamation
                {
                    Id = 1,
                    Description = "Robinet qui fuit dans la salle de bain",
                    DateCreation = new DateTime(2024, 1, 10),
                    Statut = "En cours",
                    ClientId = 1,
                    ArticleId = 1 // Référence à ArticleAPI
                },
                new Reclamation
                {
                    Id = 2,
                    Description = "Radiateur ne chauffe pas correctement",
                    DateCreation = new DateTime(2024, 1, 15),
                    Statut = "En attente",
                    ClientId = 2,
                    ArticleId = 2
                }
            );
        }
    }
}