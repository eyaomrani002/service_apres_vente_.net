using Microsoft.AspNetCore.Mvc;
using ReportingAPI.Models;
using ReportingAPI.Models.Repositories;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.IO;

namespace ReportingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : Controller
    {
        private readonly IReportRepository _repository;
        private readonly ILogger<ReportsController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public ReportsController(IReportRepository repository, ILogger<ReportsController> logger, IHttpClientFactory httpClientFactory)
        {
            _repository = repository;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
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

        // GET: api/reports/{id}/pdf
        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> GeneratePdf(string id)
        {
            try
            {
                if (!Guid.TryParse(id, out var reportId))
                {
                    return BadRequest("ID de rapport invalide");
                }

                var report = _repository.GetById(reportId);
                if (report == null)
                {
                    return NotFound($"Rapport avec ID {id} non trouvé");
                }

                // Récupérer les données client
                var clientInfo = await GetClientInfoAsync(report.ClientId);
                // Récupérer les données d'intervention
                var interventionInfo = await GetInterventionInfoAsync(report.InterventionId);
                // Récupérer les données technicien
                var technicianInfo = await GetTechnicianInfoAsync(report.TechnicianId);

                // Générer le PDF
                var pdfBytes = GeneratePdfContent(report, clientInfo, interventionInfo, technicianInfo);
                // Retourner le PDF
                return File(pdfBytes, "application/pdf", $"rapport-{report.Id}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la génération du PDF pour le rapport {id}");
                return StatusCode(500, "Erreur lors de la génération du PDF");
            }
        }

        private async Task<dynamic> GetClientInfoAsync(Guid clientId)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync($"https://localhost:7076/apigateway/clients/{clientId}");
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<dynamic>();
                }
                _logger.LogWarning($"Impossible de récupérer le client {clientId}");
                return new { Nom = $"Client {clientId.ToString().Substring(0, 8)}", Email = "", Telephone = "" };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Erreur lors de la récupération du client {clientId}");
                return new { Nom = $"Client {clientId.ToString().Substring(0, 8)}", Email = "", Telephone = "" };
            }
        }

        private async Task<dynamic> GetInterventionInfoAsync(Guid interventionId)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync($"https://localhost:7076/apigateway/interventions/{interventionId}");
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<dynamic>();
                }
                _logger.LogWarning($"Impossible de récupérer l'intervention {interventionId}");
                return new { Statut = "Inconnu", DateIntervention = System.DateTime.MinValue, Description = "" };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Erreur lors de la récupération de l'intervention {interventionId}");
                return new { Statut = "Inconnu", DateIntervention = System.DateTime.MinValue, Description = "" };
            }
        }

        private async Task<dynamic> GetTechnicianInfoAsync(Guid? technicianId)
        {
            if (!technicianId.HasValue)
            {
                return new { Nom = "Non assigné", Email = "", Telephone = "" };
            }
            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync($"https://localhost:7076/apigateway/techniciens/{technicianId}");
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<dynamic>();
                }
                _logger.LogWarning($"Impossible de récupérer le technicien {technicianId}");
                return new { Nom = $"Technicien {technicianId.ToString().Substring(0, 8)}", Email = "", Telephone = "" };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Erreur lors de la récupération du technicien {technicianId}");
                return new { Nom = $"Technicien {technicianId.ToString().Substring(0, 8)}", Email = "", Telephone = "" };
            }
        }

        private byte[] GeneratePdfContent(Report report, dynamic clientInfo, dynamic interventionInfo, dynamic technicianInfo)
        {
            // Utilisation de QuestPDF ou iTextSharp recommandée en production
            try
            {
                using (var ms = new MemoryStream())
                {
                    // PDF factice pour l'exemple
                    var dummyPdf = $"PDF Rapport\nID: {report.Id}\nClient: {clientInfo?.Nom}\nIntervention: {interventionInfo?.Statut}";
                    return System.Text.Encoding.UTF8.GetBytes(dummyPdf);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la génération du PDF");
                return System.Text.Encoding.UTF8.GetBytes($"Erreur PDF: {ex.Message}");
            }
        }
    }
}