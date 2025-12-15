using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class RefreshToken
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(450)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Token { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiresOn { get; set; }

        [NotMapped]
        public bool IsExpired => DateTime.UtcNow >= ExpiresOn;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime? RevokedOn { get; set; }

        [NotMapped]
        public bool IsActive => RevokedOn == null && !IsExpired;

        public string? ReplacedByToken { get; set; }
    }
}