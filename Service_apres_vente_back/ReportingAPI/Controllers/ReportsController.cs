using Microsoft.AspNetCore.Mvc;
using ReportingAPI.Models;
using ReportingAPI.Models.Repositories;

namespace ReportingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : Controller
    {
        private readonly IReportRepository _repository;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(IReportRepository repository, ILogger<ReportsController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Report>> GetReports([FromQuery] int take = 50)
        {
            try
            {
                var items = _repository.GetRecent(take);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reports");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("{id:guid}")]
        public ActionResult<Report> GetById(Guid id)
        {
            try
            {
                var item = _repository.GetById(id);
                if (item == null) return NotFound();
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reports/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("client/{clientId:guid}")]
        public ActionResult<IEnumerable<Report>> GetByClient(Guid clientId)
        {
            try
            {
                var items = _repository.FindByClient(clientId);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reports/client/{clientId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("intervention/{interventionId:guid}")]
        public ActionResult<IEnumerable<Report>> GetByIntervention(Guid interventionId)
        {
            try
            {
                var items = _repository.FindByIntervention(interventionId);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reports/intervention/{interventionId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("technicien/{technicianId:guid}")]
        public ActionResult<IEnumerable<Report>> GetByTechnician(Guid technicianId)
        {
            try
            {
                var items = _repository.FindByTechnician(technicianId);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reports/technicien/{technicianId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("monthly")]
        public ActionResult<IEnumerable<Report>> GetMonthly([FromQuery] int year = 0, [FromQuery] int month = 0)
        {
            try
            {
                var now = DateTime.UtcNow;
                if (year <= 0) year = now.Year;
                if (month <= 0) month = now.Month;
                var items = _repository.GetMonthly(year, month);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reports/monthly");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("financial")]
        public ActionResult<IEnumerable<Report>> GetFinancial([FromQuery] int year = 0, [FromQuery] int month = 0)
        {
            try
            {
                var now = DateTime.UtcNow;
                if (year <= 0) year = now.Year;
                if (month <= 0) month = now.Month;
                var items = _repository.GetFinancial(year, month);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reports/financial");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("complete")]
        public ActionResult<IEnumerable<Report>> GetComplete()
        {
            try
            {
                var items = _repository.GetComplete();
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reports/complete");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpPost("export-all")]
        public IActionResult ExportAll()
        {
            try
            {
                var ok = _repository.ExportAll();
                if (!ok) return StatusCode(500, "Export failed");
                return Accepted(new { message = "Export started" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/reports/export-all");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpGet("audit")]
        public ActionResult<IEnumerable<Report>> GetAudit()
        {
            try
            {
                var items = _repository.GetAudit();
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reports/audit");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpPost]
        public ActionResult<Report> Create([FromBody] ReportRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var report = new Report
                {
                    InterventionId = request.InterventionId,
                    ClientId = request.ClientId,
                    IsWarranty = request.IsWarranty,
                    Total = request.Total,
                    GeneratedAt = DateTime.UtcNow,
                    Url = $"https://reports.local/{Guid.NewGuid()}"
                };
                _repository.Add(report);
                return CreatedAtAction(nameof(GetById), new { id = report.Id }, report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/reports");
                return StatusCode(500, "Erreur serveur");
            }
        }

        [HttpPut("{id:guid}")]
        public IActionResult Update(Guid id, [FromBody] Report report)
        {
            try
            {
                if (id != report.Id) return BadRequest("ID mismatch");
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var updated = _repository.Update(report);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/reports/{id}");
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
                _logger.LogError(ex, $"Erreur lors de DELETE /api/reports/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}