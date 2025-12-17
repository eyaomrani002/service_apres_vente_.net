using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class ResetPasswordModel
    {
        [Required(ErrorMessage = "L'email est obligatoire")]
        [EmailAddress(ErrorMessage = "Format d'email invalide")]
        public string Email { get; set; } = string.Empty;
    }
}

public class ResetPasswordConfirmModel
{
    [Required(ErrorMessage = "L'email est obligatoire")]
    [EmailAddress(ErrorMessage = "Format d'email invalide")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le token est obligatoire")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le nouveau mot de passe est obligatoire")]
    [StringLength(256, MinimumLength = 6, ErrorMessage = "Le mot de passe doit contenir entre 6 et 256 caractères")]
    [DataType(DataType.Password)]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "La confirmation du mot de passe est obligatoire")]
    [Compare("NewPassword", ErrorMessage = "Les mots de passe ne correspondent pas")]
    [DataType(DataType.Password)]
    public string ConfirmPassword { get; set; } = string.Empty;
}