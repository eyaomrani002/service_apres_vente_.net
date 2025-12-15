using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class AddRoleModel
    {
        [Required(ErrorMessage = "L'ID de l'utilisateur est obligatoire")]
        public string UserId { get; set; }

        [Required(ErrorMessage = "Le rôle est obligatoire")]
        public string Role { get; set; }
    }
}