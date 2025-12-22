using NotificationAPI.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NotificationAPI.Services
{
    public interface INotificationService
    {
        Task<Notification> SendAsync(SendNotificationRequest request);
        Task<IReadOnlyList<Notification>> GetRecentAsync(int take = 50);
        Task<Notification?> GetByIdAsync(Guid id);
    }
}
