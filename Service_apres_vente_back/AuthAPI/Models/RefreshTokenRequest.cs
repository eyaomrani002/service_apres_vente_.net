using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class RefreshTokenRequest
    {
        [Required(ErrorMessage = "Le token est obligatoire")]
        public string Token { get; set; }

        public string RefreshToken { get; set; } // Rendue optionnelle
    }
}