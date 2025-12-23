using NotificationAPI.Models;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace NotificationAPI.Services
{
    public interface INotificationService
    {
        Task<Notification> SendAsync(SendNotificationRequest request, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Notification>> GetRecentAsync(int take = 50, CancellationToken cancellationToken = default);
        Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<byte[]> ExportAsync(DateTime? since = null, string? type = null, CancellationToken cancellationToken = default);
        Task<NotificationMetrics> GetMetricsAsync(CancellationToken cancellationToken = default);
    }
}
