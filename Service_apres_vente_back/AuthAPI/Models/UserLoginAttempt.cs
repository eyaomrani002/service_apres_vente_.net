using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class UserLoginAttempt
    {
        [Key]
        public string Email { get; set; } = string.Empty;

        public int FailedAttempts { get; set; }

        public DateTime? LockoutEnd { get; set; }

        public DateTime LastAttempt { get; set; } = DateTime.UtcNow;

        public bool IsLockedOut => LockoutEnd.HasValue && LockoutEnd > DateTime.UtcNow;
    }
}