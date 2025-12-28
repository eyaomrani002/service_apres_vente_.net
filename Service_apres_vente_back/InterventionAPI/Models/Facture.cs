using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace InterventionAPI.Models
{
    public class Facture
    {
        public int Id { get; set; }

        [Required]
        public int InterventionId { get; set; }

        [Required]
        public string NumeroFacture { get; set; } = string.Empty;

        [Required]
        public DateTime DateFacture { get; set; } = DateTime.Now;

        [Required]
        [StringLength(100)]
        public string ClientNom { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string ClientAdresse { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ClientEmail { get; set; } = string.Empty;

        [Required]
        public decimal MontantHT { get; set; }

        [Required]
        public decimal TVA { get; set; } = 0.19m;

        [Required]
        public decimal MontantTTC
        {
            get => MontantHT * (1 + TVA);
        }

        [Required]
        [StringLength(20)]
        public string Statut { get; set; } = "En attente";

        public DateTime? DatePaiement { get; set; }

        public string? ModePaiement { get; set; }

        [StringLength(1000)]
        public string? DescriptionServices { get; set; }

        // Navigation ignorée pour la validation/binding afin d'éviter l'erreur "Intervention field is required"
        [JsonIgnore]
        [ValidateNever]
        public virtual Intervention? Intervention { get; set; } = null;
    }
}