using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace InterventionAPI.Models
{
    public class Intervention
    {
        public int Id { get; set; }

        [Required]
        public int ReclamationId { get; set; }

        [Required]
        public int TechnicienId { get; set; }

        [Required]
        [StringLength(100)]
        public string TechnicienNom { get; set; } = string.Empty;

        [Required]
        public DateTime DateIntervention { get; set; } = DateTime.Now;

        [Required]
        [StringLength(50)]
        public string Statut { get; set; } = "Planifiée";

        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        [StringLength(1000)]
        public string Observations { get; set; } = string.Empty;

        [StringLength(1000)]
        public string SolutionApportee { get; set; } = string.Empty;

        public decimal? CoutPieces { get; set; }

        public decimal? CoutMainOeuvre { get; set; }

        public decimal? CoutTotal
        {
            get
            {
                decimal total = 0;
                if (CoutPieces.HasValue) total += CoutPieces.Value;
                if (CoutMainOeuvre.HasValue) total += CoutMainOeuvre.Value;
                return total > 0 ? total : null;
            }
        }

        public bool EstGratuite { get; set; } = false;

        public DateTime? DateFin { get; set; }

        public int? DureeMinutes
        {
            get
            {
                if (DateFin.HasValue)
                    return (int)(DateFin.Value - DateIntervention).TotalMinutes;
                return null;
            }
        }

        [Display(Name = "En retard")]
        public bool EnRetard => Statut == "Planifiée" && DateIntervention < DateTime.Now.AddDays(-1);

        // Ajout de [JsonIgnore] pour éviter la référence circulaire
        [JsonIgnore]
        public virtual Facture? Facture { get; set; }
    }
}