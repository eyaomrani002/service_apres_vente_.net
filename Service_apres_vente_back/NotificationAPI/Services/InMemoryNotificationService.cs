using NotificationAPI.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NotificationAPI.Services
{
    public class InMemoryNotificationService : INotificationService
    {
        private readonly ConcurrentDictionary<Guid, Notification> _store = new();

        public Task<Notification> SendAsync(SendNotificationRequest request)
        {
            var notif = new Notification
            {
                Type = request.Type,
                Recipient = request.Recipient,
                Subject = request.Subject,
                Message = request.Message,
                Status = "sent",
                CreatedAt = DateTime.UtcNow
            };

            _store[notif.Id] = notif;
            return Task.FromResult(notif);
        }

        public Task<IReadOnlyList<Notification>> GetRecentAsync(int take = 50)
        {
            var list = _store.Values
                .OrderByDescending(n => n.CreatedAt)
                .Take(take)
                .ToList();
            return Task.FromResult((IReadOnlyList<Notification>)list);
        }

        public Task<Notification?> GetByIdAsync(Guid id)
        {
            _store.TryGetValue(id, out var notif);
            return Task.FromResult(notif);
        }

        public Task<Notification> SendAsync(SendNotificationRequest request, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public Task<IReadOnlyList<Notification>> GetRecentAsync(int take = 50, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public Task<byte[]> ExportAsync(DateTime? since = null, string? type = null, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public Task<NotificationMetrics> GetMetricsAsync(CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
