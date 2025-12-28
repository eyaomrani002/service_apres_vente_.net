using Microsoft.EntityFrameworkCore;
using NotificationAPI.Data;

namespace NotificationAPI.Models.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly NotificationAPIContext _context;

        public NotificationRepository(NotificationAPIContext context) => _context = context;

        public void Add(Notification notification)
        {
            _context.Notifications.Add(notification);
            _context.SaveChanges();
        }

        public void Delete(Guid id)
        {
            var item = _context.Notifications.Find(id);
            if (item != null)
            {
                _context.Notifications.Remove(item);
                _context.SaveChanges();
            }
        }

        public IList<Notification> FindByRecipient(string recipient) =>
            _context.Notifications
                .Where(n => n.Recipient.Contains(recipient))
                .OrderByDescending(n => n.CreatedAt)
                .ToList();

        public IList<Notification> GetAll() =>
            _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .ToList();

        public Notification GetById(Guid id) =>
            _context.Notifications.Find(id);

        public IList<Notification> GetRecent(int take = 50) =>
            _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .Take(take)
                .ToList();

        public Notification Update(Notification notification)
        {
            var existing = _context.Notifications.Find(notification.Id);
            if (existing != null)
            {
                existing.Type = notification.Type;
                existing.Recipient = notification.Recipient;
                existing.Subject = notification.Subject;
                existing.Message = notification.Message;
                existing.Status = notification.Status;
                existing.Read = notification.Read;
                _context.SaveChanges();
            }
            return existing;
        }

        public Notification? MarkRead(Guid id)
        {
            var existing = _context.Notifications.Find(id);
            if (existing != null && !existing.Read)
            {
                existing.Read = true;
                _context.SaveChanges();
            }
            return existing;
        }
    }
}
