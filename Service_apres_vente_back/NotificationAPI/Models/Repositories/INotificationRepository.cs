using System;
using System.Collections.Generic;

namespace NotificationAPI.Models.Repositories
{
    public interface INotificationRepository
    {
        Notification GetById(Guid id);
        IList<Notification> GetAll();
        void Add(Notification notification);
        Notification Update(Notification notification);
        void Delete(Guid id);

        IList<Notification> GetRecent(int take = 50);
        IList<Notification> FindByRecipient(string recipient);
    }
}
