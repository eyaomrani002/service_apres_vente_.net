using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NotificationAPI.Models;
using NotificationAPI.Models.Repositories;

namespace NotificationAPI.Services
{
    public class NotificationService : INotificationService
    {
        private static readonly HashSet<string> SmsTypes = new(StringComparer.OrdinalIgnoreCase) { "sms", "text" };
        private readonly INotificationRepository _repository;
        private readonly ISmsSender _smsSender;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(INotificationRepository repository, ISmsSender smsSender, ILogger<NotificationService> logger)
        {
            _repository = repository;
            _smsSender = smsSender;
            _logger = logger;
        }

        public async Task<Notification> SendAsync(SendNotificationRequest request, CancellationToken cancellationToken = default)
        {
            var type = string.IsNullOrWhiteSpace(request.Type) ? "info" : request.Type.Trim();
            var notification = new Notification
            {
                Type = type,
                Recipient = request.Recipient.Trim(),
                Subject = request.Subject,
                Message = request.Message,
                Status = "queued",
                CreatedAt = DateTime.UtcNow
            };

            if (IsSmsType(type))
            {
                var smsResult = await _smsSender.SendAsync(notification.Recipient, notification.Message, cancellationToken);
                notification.Status = smsResult.IsSuccessful ? "sent" : "failed";
                if (!smsResult.IsSuccessful && string.IsNullOrWhiteSpace(notification.Subject))
                {
                    notification.Subject = "SMS delivery failure";
                }
                _logger.LogInformation("SMS notification prepared for {Recipient} with status {Status}", notification.Recipient, notification.Status);
            }
            else
            {
                notification.Status = "sent";
            }

            _repository.Add(notification);
            _logger.LogInformation("Notification {Id} stored with status {Status}", notification.Id, notification.Status);
            return notification;
        }

        public Task<IReadOnlyList<Notification>> GetRecentAsync(int take = 50, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var items = _repository.GetRecent(take);
            return Task.FromResult((IReadOnlyList<Notification>)items);
        }

        public Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var item = _repository.GetById(id);
            return Task.FromResult(item);
        }

        public Task<byte[]> ExportAsync(DateTime? since = null, string? type = null, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var items = FilterNotifications(_repository.GetAll(), since, type).ToList();
            var builder = new StringBuilder();
            builder.AppendLine("Id,Type,Recipient,Subject,Message,Status,CreatedAt");
            foreach (var notification in items)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var line = string.Join(",",
                    EscapeForCsv(notification.Id.ToString()),
                    EscapeForCsv(notification.Type),
                    EscapeForCsv(notification.Recipient),
                    EscapeForCsv(notification.Subject),
                    EscapeForCsv(notification.Message),
                    EscapeForCsv(notification.Status),
                    EscapeForCsv(notification.CreatedAt.ToString("o", CultureInfo.InvariantCulture)));
                builder.AppendLine(line);
            }

            return Task.FromResult(Encoding.UTF8.GetBytes(builder.ToString()));
        }

        public Task<NotificationMetrics> GetMetricsAsync(CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var items = _repository.GetAll();
            var metrics = new NotificationMetrics
            {
                Total = items.Count,
                LastNotificationAt = items.OrderByDescending(n => n.CreatedAt).FirstOrDefault()?.CreatedAt
            };

            foreach (var group in items.GroupBy(n => string.IsNullOrWhiteSpace(n.Status) ? "unknown" : n.Status.Trim()))
            {
                metrics.ByStatus[group.Key] = group.Count();
            }

            foreach (var group in items.GroupBy(n => string.IsNullOrWhiteSpace(n.Type) ? "unknown" : n.Type.Trim()))
            {
                metrics.ByType[group.Key] = group.Count();
            }

            return Task.FromResult(metrics);
        }

        private static IEnumerable<Notification> FilterNotifications(IEnumerable<Notification> source, DateTime? since, string? type)
        {
            var query = source.AsEnumerable();
            if (since != null)
            {
                query = query.Where(n => n.CreatedAt >= since.Value);
            }

            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(n => string.Equals(n.Type, type.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            return query;
        }

        private static string EscapeForCsv(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var escaped = value.Replace("\"", "\"\"");
            if (escaped.Contains(',') || escaped.Contains('"') || escaped.Contains('\n'))
            {
                return $"\"{escaped}\"";
            }

            return escaped;
        }

        private static bool IsSmsType(string type) => SmsTypes.Contains(type);
    }
}