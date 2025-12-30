using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClientAPI.Models
{
    public class Client
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Le nom est obligatoire")]
        [StringLength(100, ErrorMessage = "Le nom ne peut pas dépasser 100 caractères")]
        [Display(Name = "Nom complet")]
        public string Nom { get; set; } = string.Empty;

        [Required(ErrorMessage = "L'email est obligatoire")]
        [EmailAddress(ErrorMessage = "Format d'email invalide")]
        [StringLength(100, ErrorMessage = "L'email ne peut pas dépasser 100 caractères")]
        [Display(Name = "Adresse email")]
        public string Email { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Format de téléphone invalide")]
        [StringLength(20, ErrorMessage = "Le téléphone ne peut pas dépasser 20 caractères")]
        [Display(Name = "Téléphone")]
        public string? Telephone { get; set; }

        [StringLength(200, ErrorMessage = "L'adresse ne peut pas dépasser 200 caractères")]
        [Display(Name = "Adresse")]
        public string? Adresse { get; set; }

        [Display(Name = "ID utilisateur Auth0")]
        public string? UserId { get; set; }

        [Display(Name = "Date d'inscription")]
        public DateTime DateInscription { get; set; } = DateTime.Now;

        // Navigation property (ignorée en JSON pour éviter les cycles)
        [JsonIgnore]
        public virtual ICollection<Reclamation> Reclamations { get; set; } = new List<Reclamation>();

        [JsonIgnore]
        public virtual ICollection<Commande> Commandes { get; set; } = new List<Commande>();

        // Propriétés calculées
        [Display(Name = "Nombre de réclamations")]
        public int NombreReclamations => Reclamations?.Count ?? 0;

        [Display(Name = "Réclamations en cours")]
        public int ReclamationsEnCours => Reclamations?.Count(r => r.Statut == "En cours") ?? 0;

        // Nouveau code (corrigé) :
        [Display(Name = "Dernière réclamation")]
        public DateTime? DerniereReclamation
        {
            get
            {
                if (Reclamations == null || !Reclamations.Any())
                    return null;
                return Reclamations.Max(r => r.DateCreation);
            }
        }
    }
}