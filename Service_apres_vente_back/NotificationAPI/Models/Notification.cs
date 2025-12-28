using System;

namespace NotificationAPI.Models
{
    public class Notification
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Type { get; set; } = "info"; // email, sms, push, etc.
        public string Recipient { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "queued"; // queued, sent, failed
        public bool Read { get; set; } = false;
    }
}
