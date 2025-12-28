using CalendarAPI.Models;
using CalendarAPI.Models.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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
            {
                _logger.LogWarning("Model validation failed: {@ModelState}", ModelState);
                return ValidationProblem(ModelState);
            }

            try
            {
                _logger.LogInformation("Creating appointment: {@Request}", request);

                if (request.EndUtc <= request.StartUtc)
                {
                    _logger.LogWarning("EndUtc must be after StartUtc. Start: {StartUtc}, End: {EndUtc}", request.StartUtc, request.EndUtc);
                    return BadRequest(new { error = "EndUtc must be after StartUtc" });
                }

                var overlaps = _repository.Overlaps(request.TechnicianId, request.StartUtc, request.EndUtc);
                if (overlaps)
                {
                    _logger.LogWarning("Overlap detected for technician {TechnicianId}", request.TechnicianId);
                    return Conflict(new { error = "The technician is not available in the requested time range." });
                }

                var appt = new Appointment
                {
                    TechnicianId = request.TechnicianId,
                    ClientId = request.ClientId,
                    TicketId = request.TicketId,
                    ReclamationId = request.ReclamationId,
                    StartUtc = request.StartUtc,
                    EndUtc = request.EndUtc,
                    Title = request.Title,
                    Notes = request.Notes,
                    Status = string.IsNullOrWhiteSpace(request.Status) ? "Planned" : request.Status
                };
                _repository.Add(appt);

                _logger.LogInformation("Appointment created: {Id}", appt.Id);
                return CreatedAtAction(nameof(GetById), new { id = appt.Id }, appt);
            }
            catch (ArgumentException ex)
            {
                _logger.LogError(ex, "ArgumentException in Schedule: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message, details = "ArgumentException occurred" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "InvalidOperationException in Schedule: {Message}", ex.Message);
                return Conflict(new { error = ex.Message, details = "InvalidOperationException occurred" });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error in Schedule");
                return StatusCode(500, new { error = "Database error occurred", details = dbEx.InnerException?.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in Schedule");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("appointments")]
        public IActionResult GetAppointments([FromQuery] Guid? technicianId, [FromQuery] DateTime dateUtc)
        {
            try
            {
                IList<Appointment> items;

                if (technicianId.HasValue && technicianId.Value != Guid.Empty)
                {
                    items = _repository.GetByTechnicianAndDate(technicianId.Value, dateUtc);
                }
                else
                {
                    // Sans technicien : retourner tous les rendez-vous du jour
                    items = _repository.GetByDate(dateUtc);
                }

                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/calendar/appointments");
                return StatusCode(500, new { error = "Erreur serveur", details = ex.Message });
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
        
        [HttpPut("appointments/{id:guid}")]
        public IActionResult Update(Guid id, [FromBody] Appointment appointment)
        {
            if (appointment == null)
            {
                _logger.LogWarning("Update called with null appointment");
                return BadRequest(new { error = "Appointment payload is required" });
            }

            if (appointment.Id == Guid.Empty)
            {
                _logger.LogWarning("Appointment.Id is empty in update payload");
                return BadRequest(new { error = "Appointment Id is required" });
            }

            if (id != appointment.Id)
            {
                _logger.LogWarning("Route id {RouteId} does not match payload id {PayloadId}", id, appointment.Id);
                return BadRequest(new { error = "Route id does not match appointment id in payload" });
            }

            try
            {
                // Basic validation
                if (appointment.EndUtc <= appointment.StartUtc)
                {
                    _logger.LogWarning("EndUtc must be after StartUtc for update. Start: {StartUtc}, End: {EndUtc}", appointment.StartUtc, appointment.EndUtc);
                    return BadRequest(new { error = "EndUtc must be after StartUtc" });
                }

                // Check overlap for technician (exclude the appointment being updated)
                if (appointment.TechnicianId != Guid.Empty && _repository.Overlaps(appointment.TechnicianId, appointment.StartUtc, appointment.EndUtc, appointment.Id))
                {
                    _logger.LogWarning("Overlap detected during update for technician {TechnicianId}", appointment.TechnicianId);
                    return Conflict(new { error = "The technician is not available in the requested time range." });
                }

                var updated = _repository.Update(appointment);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                _logger.LogError(ex, "ArgumentException in Update: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message, details = "ArgumentException occurred" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "InvalidOperationException in Update: {Message}", ex.Message);
                return Conflict(new { error = ex.Message, details = "InvalidOperationException occurred" });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error in Update");
                return StatusCode(500, new { error = "Database error occurred", details = dbEx.InnerException?.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in Update");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message, stackTrace = ex.StackTrace });
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