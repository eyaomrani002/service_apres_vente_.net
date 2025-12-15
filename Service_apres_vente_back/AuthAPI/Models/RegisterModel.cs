using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class RegisterModel
    {
        [Required(ErrorMessage = "Le prénom est obligatoire")]
        [StringLength(50, ErrorMessage = "Le prénom ne peut pas dépasser 50 caractères")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Le nom est obligatoire")]
        [StringLength(50, ErrorMessage = "Le nom ne peut pas dépasser 50 caractères")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Le nom d'utilisateur est obligatoire")]
        [StringLength(50, ErrorMessage = "Le nom d'utilisateur ne peut pas dépasser 50 caractères")]
        public string Username { get; set; }

        [Required(ErrorMessage = "L'email est obligatoire")]
        [EmailAddress(ErrorMessage = "Format d'email invalide")]
        [StringLength(128, ErrorMessage = "L'email ne peut pas dépasser 128 caractères")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Le mot de passe est obligatoire")]
        [StringLength(256, MinimumLength = 6, ErrorMessage = "Le mot de passe doit contenir entre 6 et 256 caractères")]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [Required(ErrorMessage = "La confirmation du mot de passe est obligatoire")]
        [Compare("Password", ErrorMessage = "Les mots de passe ne correspondent pas")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; }
    }
}