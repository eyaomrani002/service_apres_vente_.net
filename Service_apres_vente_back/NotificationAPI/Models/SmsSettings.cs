using System;

namespace NotificationAPI.Models
{
    public sealed class SmsSettings
    {
        public string AccountSid { get; set; } = string.Empty;
        public string AuthToken { get; set; } = string.Empty;
        public string FromNumber { get; set; } = string.Empty;

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(AccountSid) &&
            !string.IsNullOrWhiteSpace(AuthToken) &&
            !string.IsNullOrWhiteSpace(FromNumber);
    }
}