using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using NotificationAPI.Models;
using NotificationAPI.Models.Repositories;
using NotificationAPI.Services;

namespace NotificationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : Controller
    {
        private readonly INotificationRepository _repository;
        private readonly INotificationService _service;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(INotificationRepository repository, INotificationService service, ILogger<NotificationsController> logger)
        {
            _repository = repository;
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications([FromQuery] int take = 50)
        {
            try
            {
                var items = await _service.GetRecentAsync(take);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/notifications");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<Notification>> GetById(Guid id)
        {
            try
            {
                var item = await _service.GetByIdAsync(id);
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
        public async Task<ActionResult<Notification>> Create(SendNotificationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var notification = await _service.SendAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = notification.Id }, notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/notifications");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpPost("{id:guid}/read")]
        public ActionResult<Notification> MarkRead(Guid id)
        {
            try
            {
                var updated = _repository.MarkRead(id);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de POST /api/notifications/{id}/read");
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

        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] DateTime? since = null, [FromQuery] string? type = null)
        {
            try
            {
                var payload = await _service.ExportAsync(since, type);
                return File(payload, "text/csv", "notifications.csv");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/notifications/export");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("metrics")]
        public async Task<IActionResult> Metrics()
        {
            try
            {
                var metrics = await _service.GetMetricsAsync();
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/notifications/metrics");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("health")]
        public async Task<IActionResult> Health()
        {
            try
            {
                var metrics = await _service.GetMetricsAsync();
                return Ok(new
                {
                    status = "Healthy",
                    totalNotifications = metrics.Total,
                    lastNotification = metrics.LastNotificationAt,
                    statusBreakdown = metrics.ByStatus,
                    typeBreakdown = metrics.ByType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/notifications/health");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}
