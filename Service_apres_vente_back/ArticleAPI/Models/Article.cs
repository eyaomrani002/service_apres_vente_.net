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