using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class TokenRequestModel
    {
        [Required(ErrorMessage = "L'email est obligatoire")]
        [EmailAddress(ErrorMessage = "Format d'email invalide")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Le mot de passe est obligatoire")]
        [DataType(DataType.Password)]
        public string Password { get; set; }
    }
}