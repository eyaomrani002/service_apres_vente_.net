using System;
using System.Collections.Generic;

namespace NotificationAPI.Models
{
    public sealed class NotificationMetrics
    {
        public int Total { get; init; }
        public DateTime? LastNotificationAt { get; init; }
        public IDictionary<string, int> ByStatus { get; init; } = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        public IDictionary<string, int> ByType { get; init; } = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
    }
}