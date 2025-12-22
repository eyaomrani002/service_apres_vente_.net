using Microsoft.AspNetCore.Mvc;
using NotificationAPI.Models;
using NotificationAPI.Models.Repositories;

namespace NotificationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : Controller
    {
        private readonly INotificationRepository _repository;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(INotificationRepository repository, ILogger<NotificationsController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Notification>> GetNotifications([FromQuery] int take = 50)
        {
            try
            {
                var items = _repository.GetRecent(take);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/notifications");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("{id:guid}")]
        public ActionResult<Notification> GetById(Guid id)
        {
            try
            {
                var item = _repository.GetById(id);
                if (item == null) return NotFound();
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/notifications/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("search/recipient/{recipient}")]
        public ActionResult<IEnumerable<Notification>> FindByRecipient(string recipient)
        {
            try
            {
                var items = _repository.FindByRecipient(recipient);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/notifications/search/recipient/{recipient}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpPost]
        public ActionResult<Notification> Create(Notification notification)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                notification.Status = string.IsNullOrWhiteSpace(notification.Status) ? "sent" : notification.Status;
                notification.CreatedAt = DateTime.UtcNow;
                _repository.Add(notification);
                return CreatedAtAction(nameof(GetById), new { id = notification.Id }, notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/notifications");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpPut("{id:guid}")]
        public IActionResult Update(Guid id, Notification notification)
        {
            try
            {
                if (id != notification.Id) return BadRequest("ID mismatch");
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var updated = _repository.Update(notification);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/notifications/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpDelete("{id:guid}")]
        public IActionResult Delete(Guid id)
        {
            try
            {
                var existing = _repository.GetById(id);
                if (existing == null) return NotFound();
                _repository.Delete(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de DELETE /api/notifications/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}
