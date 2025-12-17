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

        // NOUVELLES PROPRIÉTÉS AJOUTÉES
        [Display(Name = "Priorité")]
        [StringLength(20)]
        public string Priorite { get; set; } = "Moyenne"; // "Basse", "Moyenne", "Haute", "Urgente"

        [Display(Name = "Type de problème")]
        [StringLength(50)]
        public string TypeProbleme { get; set; } = "Général"; // "Fuite", "Chauffage", "Électrique", "Montage"

        [Display(Name = "Photos (URLs)")]
        public List<string>? PhotosUrls { get; set; }

        [Display(Name = "Pièces nécessaires")]
        public List<ReclamationPiece>? PiecesNecessaires { get; set; }

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

    public class ReclamationPiece
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "La référence est obligatoire")]
        [StringLength(50, ErrorMessage = "La référence ne peut pas dépasser 50 caractères")]
        public string Reference { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "La description ne peut pas dépasser 200 caractères")]
        public string Description { get; set; } = string.Empty;

        [Range(1, 100, ErrorMessage = "La quantité doit être entre 1 et 100")]
        public int Quantite { get; set; } = 1;

        public bool Fournie { get; set; } = false;

        public int ReclamationId { get; set; }
    }
}