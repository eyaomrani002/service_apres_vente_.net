using System.Threading;
using System.Threading.Tasks;

namespace NotificationAPI.Services
{
    public interface ISmsSender
    {
        Task<SmsResult> SendAsync(string recipient, string body, CancellationToken cancellationToken = default);
    }
}