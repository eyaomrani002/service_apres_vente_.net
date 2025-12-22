using CalendarAPI.Models;
using CalendarAPI.Models.Repositories;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CalendarAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalendarController : ControllerBase
    {
        private readonly IAppointmentRepository _repository;
        private readonly ILogger<CalendarController> _logger;

        public CalendarController(IAppointmentRepository repository, ILogger<CalendarController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpPost("appointments")]
        public IActionResult Schedule([FromBody] ScheduleRequest request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                if (request.EndUtc <= request.StartUtc)
                    return BadRequest(new { error = "EndUtc must be after StartUtc" });

                var overlaps = _repository.Overlaps(request.TechnicianId, request.StartUtc, request.EndUtc);
                if (overlaps)
                    return Conflict(new { error = "The technician is not available in the requested time range." });

                var appt = new Appointment
                {
                    TechnicianId = request.TechnicianId,
                    StartUtc = request.StartUtc,
                    EndUtc = request.EndUtc,
                    Title = request.Title,
                    Notes = request.Notes
                };
                _repository.Add(appt);
                return CreatedAtAction(nameof(GetById), new { id = appt.Id }, appt);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/calendar/appointments");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("appointments")]
        public IActionResult GetAppointments([FromQuery] Guid technicianId, [FromQuery] DateTime dateUtc)
        {
            try
            {
                var items = _repository.GetByTechnicianAndDate(technicianId, dateUtc);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/calendar/appointments");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("appointments/{id:guid}")]
        public IActionResult GetById(Guid id)
        {
            try
            {
                var appt = _repository.GetById(id);
                if (appt == null) return NotFound();
                return Ok(appt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/calendar/appointments/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpDelete("appointments/{id:guid}")]
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
                _logger.LogError(ex, $"Erreur lors de DELETE /api/calendar/appointments/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}