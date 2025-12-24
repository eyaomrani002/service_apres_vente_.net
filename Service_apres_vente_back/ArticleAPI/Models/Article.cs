using System.ComponentModel.DataAnnotations;

namespace ArticleAPI.Models
{
    public class Article
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Reference { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Nom { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // "Sanitaire" ou "Chauffage"

        [Required]
        public DateTime DateAchat { get; set; }

        [Required]
        [Range(0, 120)]
        public int DureeGarantieMois { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [Range(0, 999999.99)]
        public decimal PrixAchat { get; set; }

        [StringLength(300)]
        public string? ImageUrl { get; set; }
        // Ajouter ces propriétés pour le SAV
        [Display(Name = "Numéro de série")]
        [StringLength(100)]
        public string? NumeroSerie { get; set; }

        [Display(Name = "Date d'installation")]
        public DateTime? DateInstallation { get; set; }

        [Display(Name = "Lieu d'installation")]
        [StringLength(200)]
        public string? LieuInstallation { get; set; }

        [Display(Name = "Type d'installation")]
        [StringLength(50)]
        public string? TypeInstallation { get; set; } // "Murale", "Sol", "Encastrée"
        public bool EstEnStock { get; set; } = true;

        // Propriété calculée pour savoir si l'article est sous garantie
        public bool EstSousGarantie
        {
            get
            {
                return DateTime.Now <= DateAchat.AddMonths(DureeGarantieMois);
            }
        }

        // Date de fin de garantie
        public DateTime FinGarantie => DateAchat.AddMonths(DureeGarantieMois);
    }
}