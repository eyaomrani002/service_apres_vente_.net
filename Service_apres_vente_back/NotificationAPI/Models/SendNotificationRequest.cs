using System.ComponentModel.DataAnnotations;

namespace NotificationAPI.Models
{
    public class SendNotificationRequest
    {
        [Required]
        public string Type { get; set; } = "info";

        [Required]
        public string Recipient { get; set; } = string.Empty;

        public string Subject { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;
    }
}
