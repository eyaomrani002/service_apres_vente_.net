using Microsoft.EntityFrameworkCore;
using InterventionAPI.Models;

namespace InterventionAPI.Data
{
    public class InterventionAPIContext : DbContext
    {
        public InterventionAPIContext(DbContextOptions<InterventionAPIContext> options)
            : base(options)
        {
        }

        public DbSet<Intervention> Interventions { get; set; }
        public DbSet<Facture> Factures { get; set; }
        public DbSet<Technicien> Techniciens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Intervention>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.TechnicienNom)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Statut)
                    .IsRequired()
                    .HasMaxLength(50)
                    .HasDefaultValue("Planifiée");

                entity.Property(e => e.Description)
                    .HasMaxLength(1000);

                entity.Property(e => e.Observations)
                    .HasMaxLength(1000);

                entity.Property(e => e.SolutionApportee)
                    .HasMaxLength(1000);

                entity.Property(e => e.CoutPieces)
                    .HasColumnType("decimal(10,2)");

                entity.Property(e => e.CoutMainOeuvre)
                    .HasColumnType("decimal(10,2)");

                entity.Property(e => e.DateIntervention)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasOne(i => i.Facture)
                    .WithOne(f => f.Intervention)
                    .HasForeignKey<Facture>(f => f.InterventionId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.ReclamationId);
                entity.HasIndex(e => e.TechnicienId);
                entity.HasIndex(e => e.Statut);
                entity.HasIndex(e => e.DateIntervention);
                entity.HasIndex(e => e.EstGratuite);

                entity.HasData(
                    new Intervention
                    {
                        Id = 1,
                        ReclamationId = 1,
                        TechnicienId = 101,
                        TechnicienNom = "Jean Dupont",
                        DateIntervention = new DateTime(2024, 1, 20, 14, 0, 0),
                        Statut = "Terminée",
                        Description = "Intervention pour réparer un robinet qui fuit",
                        Observations = "Joint usé à remplacer",
                        SolutionApportee = "Remplacement du joint défectueux",
                        CoutPieces = 15.50m,
                        CoutMainOeuvre = 45.00m,
                        EstGratuite = false,
                        DateFin = new DateTime(2024, 1, 20, 15, 30, 0)
                    },
                    new Intervention
                    {
                        Id = 2,
                        ReclamationId = 2,
                        TechnicienId = 102,
                        TechnicienNom = "Marie Martin",
                        DateIntervention = new DateTime(2024, 2, 10, 10, 0, 0),
                        Statut = "Planifiée",
                        Description = "Diagnostic du radiateur",
                        Observations = "",
                        SolutionApportee = "",
                        CoutPieces = null,
                        CoutMainOeuvre = null,
                        EstGratuite = true,
                        DateFin = null
                    }
                );
            });

            modelBuilder.Entity<Facture>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.NumeroFacture)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.ClientNom)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.ClientAdresse)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.ClientEmail)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.MontantHT)
                    .HasColumnType("decimal(10,2)");

                entity.Property(e => e.TVA)
                    .HasColumnType("decimal(5,4)");

                entity.Property(e => e.Statut)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("En attente");

                entity.Property(e => e.ModePaiement)
                    .HasMaxLength(50);

                entity.Property(e => e.DescriptionServices)
                    .HasMaxLength(1000);

                entity.Property(e => e.DateFacture)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasIndex(e => e.NumeroFacture).IsUnique();
                entity.HasIndex(e => e.InterventionId).IsUnique();
                entity.HasIndex(e => e.Statut);
                entity.HasIndex(e => e.DateFacture);

                entity.HasData(
                    new Facture
                    {
                        Id = 1,
                        InterventionId = 1,
                        NumeroFacture = "FACT-2024-001",
                        DateFacture = new DateTime(2024, 1, 21),
                        ClientNom = "Mohamed Ben Ali",
                        ClientAdresse = "Tunis, Tunisie",
                        ClientEmail = "mohamed@example.com",
                        MontantHT = 60.50m,
                        TVA = 0.19m,
                        Statut = "Payée",
                        DatePaiement = new DateTime(2024, 1, 25),
                        ModePaiement = "Virement",
                        DescriptionServices = "Réparation robinet thermostatique - Remplacement joint"
                    }
                );
            });

            modelBuilder.Entity<Technicien>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nom).IsRequired().HasMaxLength(120);
                entity.Property(e => e.Email).HasMaxLength(120);
                entity.Property(e => e.Telephone).HasMaxLength(30);
                entity.Property(e => e.Zone).HasMaxLength(120);
                entity.Property(e => e.Disponibilite).HasMaxLength(50).HasDefaultValue("Disponible");
                entity.Property(e => e.Competences).HasMaxLength(200);
                entity.Property(e => e.UserId).HasMaxLength(120);
                entity.Property(e => e.DateCreation).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.DateMaj).HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => e.UserId).IsUnique(false);
                entity.HasIndex(e => e.Email).IsUnique(false);
                entity.HasIndex(e => e.Disponibilite);

                entity.HasData(
                    new Technicien { Id = 101, Nom = "Jean Dupont", Email = "jean.dupont@example.com", Telephone = "0102030405", Zone = "Nord", Disponibilite = "Disponible", IsActif = true },
                    new Technicien { Id = 102, Nom = "Marie Martin", Email = "marie.martin@example.com", Telephone = "0607080910", Zone = "Sud", Disponibilite = "Disponible", IsActif = true }
                );
            });
        }
    }
}