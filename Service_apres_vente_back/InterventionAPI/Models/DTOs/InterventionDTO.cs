using System.Text.Json.Serialization;

namespace InterventionAPI.Models.DTOs
{
    public class InterventionDTO
    {
        public int Id { get; set; }
        public int ReclamationId { get; set; }
        public int TechnicienId { get; set; }
        public string TechnicienNom { get; set; } = string.Empty;
        public DateTime DateIntervention { get; set; }
        public string Statut { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Observations { get; set; } = string.Empty;
        public string SolutionApportee { get; set; } = string.Empty;
        public decimal? CoutPieces { get; set; }
        public decimal? CoutMainOeuvre { get; set; }
        public decimal? CoutTotal { get; set; }
        public bool EstGratuite { get; set; }
        public DateTime? DateFin { get; set; }
        public int? DureeMinutes { get; set; }
        public bool EnRetard { get; set; }

        // Facture simplifiée sans référence à Intervention
        public FactureSimpleDTO? Facture { get; set; }
    }

    public class FactureSimpleDTO
    {
        public int Id { get; set; }
        public int InterventionId { get; set; }
        public string NumeroFacture { get; set; } = string.Empty;
        public DateTime DateFacture { get; set; }
        public string ClientNom { get; set; } = string.Empty;
        public string ClientAdresse { get; set; } = string.Empty;
        public string ClientEmail { get; set; } = string.Empty;
        public decimal MontantHT { get; set; }
        public decimal TVA { get; set; }
        public decimal MontantTTC { get; set; }
        public string Statut { get; set; } = string.Empty;
        public DateTime? DatePaiement { get; set; }
        public string? ModePaiement { get; set; }
        public string? DescriptionServices { get; set; }
    }

    public class FactureDTO : FactureSimpleDTO
    {
        public InterventionSimpleDTO? Intervention { get; set; }
    }

    public class InterventionSimpleDTO
    {
        public int Id { get; set; }
        public int ReclamationId { get; set; }
        public string TechnicienNom { get; set; } = string.Empty;
        public DateTime DateIntervention { get; set; }
        public string Statut { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal? CoutTotal { get; set; }
        public bool EstGratuite { get; set; }
    }
}