using System.ComponentModel.DataAnnotations;

namespace InterventionAPI.Models
{
    public class Technicien
    {
        public int Id { get; set; }

        [Required]
        [StringLength(120)]
        public string Nom { get; set; } = string.Empty;

        [StringLength(120)]
        public string? Email { get; set; }

        [StringLength(30)]
        public string? Telephone { get; set; }

        [StringLength(120)]
        public string? Zone { get; set; }

        [StringLength(50)]
        public string Disponibilite { get; set; } = "Disponible"; // Disponible, Occupé, Indisponible

        public bool IsActif { get; set; } = true;

        [StringLength(200)]
        public string? Competences { get; set; } // simple CSV pour rester léger

        [StringLength(120)]
        public string? UserId { get; set; } // lien vers AuthAPI

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
        public DateTime DateMaj { get; set; } = DateTime.UtcNow;
    }
}
