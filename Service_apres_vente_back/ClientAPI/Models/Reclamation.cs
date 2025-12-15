using System.ComponentModel.DataAnnotations;

namespace ClientAPI.Models
{
    public class Reclamation
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "La description est obligatoire")]
        [StringLength(1000, ErrorMessage = "La description ne peut pas dépasser 1000 caractères")]
        [Display(Name = "Description du problème")]
        public string Description { get; set; } = string.Empty;

        [Display(Name = "Date de création")]
        public DateTime DateCreation { get; set; } = DateTime.Now;

        [Display(Name = "Date de résolution")]
        public DateTime? DateResolution { get; set; }

        [Required(ErrorMessage = "Le statut est obligatoire")]
        [StringLength(50, ErrorMessage = "Le statut ne peut pas dépasser 50 caractères")]
        [Display(Name = "Statut")]
        public string Statut { get; set; } = "En attente";

        // Référence au client
        [Display(Name = "ID Client")]
        public int ClientId { get; set; }

        // Référence à l'article (dans ArticleAPI)
        [Display(Name = "ID Article")]
        public int ArticleId { get; set; }

        // Navigation property
        public virtual Client? Client { get; set; }

        // Propriétés calculées
        [Display(Name = "Durée (jours)")]
        public int? DureeJours
        {
            get
            {
                if (DateResolution.HasValue)
                    return (int)(DateResolution.Value - DateCreation).TotalDays;
                if (Statut == "Résolu")
                    return (int)(DateTime.Now - DateCreation).TotalDays;
                return null;
            }
        }

        [Display(Name = "Est résolue")]
        public bool EstResolue => Statut == "Résolu";

        [Display(Name = "En retard")]
        public bool EnRetard => !EstResolue && (DateTime.Now - DateCreation).TotalDays > 7;
    }
}