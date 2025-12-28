using Microsoft.AspNetCore.Mvc;
using InterventionAPI.Models;
using InterventionAPI.Models.Repositories;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace InterventionAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InterventionsController : ControllerBase
    {
        private readonly IInterventionRepository _repository;
        private readonly ILogger<InterventionsController> _logger;
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private const string NotificationEndpoint = "https://localhost:7076/apigateway/notifications";
        private const string ClientApiBase = "https://localhost:7025/api";

        public InterventionsController(
            IInterventionRepository repository,
            ILogger<InterventionsController> logger,
            IHttpClientFactory httpClientFactory,
            IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _httpContextAccessor = httpContextAccessor;
        }

        private HttpRequestMessage CreateRequest(HttpMethod method, string url)
        {
            var req = new HttpRequestMessage(method, url);
            var authHeader = _httpContextAccessor.HttpContext?.Request?.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(authHeader))
            {
                req.Headers.TryAddWithoutValidation("Authorization", authHeader);
            }
            return req;
        }

        private async Task TrySendNotificationAsync(string recipient, string subject, string message, string type = "info")
        {
            try
            {
                var payload = new { Type = type, Recipient = recipient, Subject = subject, Message = message };
                var resp = await _httpClient.PostAsJsonAsync(NotificationEndpoint, payload);
                if (!resp.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Notification non envoyée (status {Status}) vers {Recipient}", resp.StatusCode, recipient);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Échec lors de l'envoi de notification vers {Recipient}", recipient);
            }
        }

        private async Task<string?> GetClientEmailAsync(int clientId)
        {
            try
            {
                var resp = await _httpClient.GetAsync($"{ClientApiBase}/clients/{clientId}");
                if (!resp.IsSuccessStatusCode) return null;
                var json = await resp.Content.ReadAsStringAsync();
                var doc = System.Text.Json.JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("email", out var emailEl) && emailEl.ValueKind == System.Text.Json.JsonValueKind.String)
                    return emailEl.GetString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Impossible de récupérer l'email du client {ClientId}", clientId);
            }
            return null;
        }

        // ========== INTERVENTIONS ==========

        // GET: api/interventions
        [HttpGet]
        public ActionResult<IEnumerable<Intervention>> GetInterventions()
        {
            try
            {
                var interventions = _repository.GetAll();
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/5
        [HttpGet("{id}")]
        public ActionResult<Intervention> GetIntervention(int id)
        {
            try
            {
                var intervention = _repository.GetById(id);
                if (intervention == null)
                    return NotFound($"Intervention avec ID {id} non trouvée");
                return Ok(intervention);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // POST: api/interventions
        [HttpPost]
        public async Task<ActionResult<Intervention>> CreateIntervention(Intervention intervention)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Vérifier que le technicien existe
                if (!_repository.TechnicienExists(intervention.TechnicienId))
                    return BadRequest($"Technicien avec ID {intervention.TechnicienId} non trouvé");

                // Validations croisées strictes
                // 1) Vérifier que la réclamation existe (ClientAPI)
                try
                {
                    var reclResponse = await _httpClient.SendAsync(CreateRequest(HttpMethod.Get, $"https://localhost:7025/api/reclamations/{intervention.ReclamationId}"));
                    if (!reclResponse.IsSuccessStatusCode)
                        return BadRequest($"Réclamation avec ID {intervention.ReclamationId} n'existe pas");

                    // 2) Vérifier que le client lié existe (ClientAPI)
                    try
                    {
                        var json = await reclResponse.Content.ReadAsStringAsync();
                        // La réponse inclut normalement ClientId
                        var doc = System.Text.Json.JsonDocument.Parse(json);
                        if (doc.RootElement.TryGetProperty("clientId", out var clientIdEl))
                        {
                            var clientId = clientIdEl.GetInt32();
                            var clientResp = await _httpClient.SendAsync(CreateRequest(HttpMethod.Get, $"https://localhost:7025/api/clients/{clientId}"));
                            if (!clientResp.IsSuccessStatusCode)
                                return BadRequest($"Client avec ID {clientId} n'existe pas");
                        }
                        else
                        {
                            _logger.LogWarning("Impossible d'extraire ClientId de la réponse réclamation {ReclamationId}", intervention.ReclamationId);
                        }
                    }
                    catch (Exception exInner)
                    {
                        _logger.LogWarning(exInner, "Erreur lors de la validation du client lié à la réclamation {ReclamationId}", intervention.ReclamationId);
                    }
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogWarning(ex, "ClientAPI non accessible pour valider la réclamation {ReclamationId}", intervention.ReclamationId);
                    return StatusCode(503, "Service ClientAPI indisponible pour validation");
                }

                // Utiliser la logique métier de garantie: gratuite si article sous garantie
                Intervention created;
                try
                {
                    created = await _repository.CreateInterventionAvecGarantie(intervention);
                }
                catch (InvalidOperationException ex)
                {
                    _logger.LogWarning(ex, "Validation métier échouée lors de la création intervention");
                    return BadRequest(ex.Message);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur métier lors de la création intervention");
                    return StatusCode(500, "Erreur serveur");
                }

                // Notifier le client lié à la réclamation
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var reclResponse = await _httpClient.GetAsync($"{ClientApiBase}/reclamations/{intervention.ReclamationId}");
                        if (reclResponse.IsSuccessStatusCode)
                        {
                            var reclJson = await reclResponse.Content.ReadAsStringAsync();
                            var reclDoc = System.Text.Json.JsonDocument.Parse(reclJson);
                            if (reclDoc.RootElement.TryGetProperty("clientId", out var cidEl))
                            {
                                var email = await GetClientEmailAsync(cidEl.GetInt32());
                                if (!string.IsNullOrWhiteSpace(email))
                                {
                                    await TrySendNotificationAsync(email, "Intervention planifiée", $"Votre intervention #{created.Id} est planifiée (réclamation #{intervention.ReclamationId}).");
                                }
                            }
                        }
                    }
                    catch (Exception exNotify)
                    {
                        _logger.LogWarning(exNotify, "Notification client non envoyée après création intervention {InterventionId}", created.Id);
                    }
                });

                return CreatedAtAction(nameof(GetIntervention), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/interventions");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/interventions/5
        [HttpPut("{id}")]
        public IActionResult UpdateIntervention(int id, Intervention intervention)
        {
            try
            {
                if (id != intervention.Id)
                    return BadRequest("ID mismatch");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (!_repository.TechnicienExists(intervention.TechnicienId))
                    return BadRequest($"Technicien avec ID {intervention.TechnicienId} non trouvé");

                if (!_repository.InterventionExists(id))
                    return NotFound($"Intervention avec ID {id} non trouvée");

                var updated = _repository.Update(intervention);
                if (updated == null)
                    return NotFound();

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/interventions/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // DELETE: api/interventions/5
        [HttpDelete("{id}")]
        public IActionResult DeleteIntervention(int id)
        {
            try
            {
                if (!_repository.InterventionExists(id))
                    return NotFound($"Intervention avec ID {id} non trouvée");

                _repository.Delete(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de DELETE /api/interventions/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/reclamation/5
        [HttpGet("reclamation/{reclamationId}")]
        public ActionResult<IEnumerable<Intervention>> GetInterventionsByReclamation(int reclamationId)
        {
            try
            {
                var interventions = _repository.GetByReclamationId(reclamationId);
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/reclamation/{reclamationId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/technicien/101
        [HttpGet("technicien/{technicienId}")]
        public ActionResult<IEnumerable<Intervention>> GetInterventionsByTechnicien(int technicienId)
        {
            try
            {
                var interventions = _repository.GetByTechnicienId(technicienId);
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/technicien/{technicienId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/statut/Planifiée
        [HttpGet("statut/{statut}")]
        public ActionResult<IEnumerable<Intervention>> GetInterventionsByStatut(string statut)
        {
            try
            {
                var interventions = _repository.GetByStatut(statut);
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/statut/{statut}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/gratuites
        [HttpGet("gratuites")]
        public ActionResult<IEnumerable<Intervention>> GetInterventionsGratuites()
        {
            try
            {
                var interventions = _repository.GetInterventionsGratuites();
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/gratuites");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/payantes
        [HttpGet("payantes")]
        public ActionResult<IEnumerable<Intervention>> GetInterventionsPayantes()
        {
            try
            {
                var interventions = _repository.GetInterventionsPayantes();
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/payantes");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/en-retard
        [HttpGet("en-retard")]
        public ActionResult<IEnumerable<Intervention>> GetInterventionsEnRetard()
        {
            try
            {
                var interventions = _repository.GetInterventionsEnRetard();
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/en-retard");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/sans-facture
        [HttpGet("sans-facture")]
        public ActionResult<IEnumerable<Intervention>> GetInterventionsSansFacture()
        {
            try
            {
                var interventions = _repository.GetInterventionsSansFacture();
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/sans-facture");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/search/terme
        [HttpGet("search/{term}")]
        public ActionResult<IEnumerable<Intervention>> SearchInterventions(string term)
        {
            try
            {
                var interventions = _repository.SearchInterventions(term);
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/search/{term}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/advanced
        [HttpGet("advanced")]
        public ActionResult<IEnumerable<Intervention>> AdvancedSearch(
            [FromQuery] string searchTerm = null,
            [FromQuery] int? reclamationId = null,
            [FromQuery] int? technicienId = null,
            [FromQuery] string statut = null,
            [FromQuery] DateTime? dateDebut = null,
            [FromQuery] DateTime? dateFin = null,
            [FromQuery] bool? estGratuite = null,
            [FromQuery] decimal? coutMin = null,
            [FromQuery] decimal? coutMax = null,
            [FromQuery] string sortBy = "date")
        {
            try
            {
                var query = _repository.AdvancedInterventionSearch(
                    searchTerm, reclamationId, technicienId, statut,
                    dateDebut, dateFin, estGratuite, coutMin, coutMax, sortBy);

                var interventions = query.ToList();
                return Ok(interventions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/advanced");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/interventions/5/changer-statut
        [HttpPut("{id}/changer-statut")]
        public async Task<IActionResult> ChangerStatutIntervention(int id, [FromBody] string nouveauStatut)
        {
            try
            {
                var intervention = _repository.GetById(id);
                if (intervention == null)
                    return NotFound($"Intervention avec ID {id} non trouvée");

                intervention.Statut = nouveauStatut;

                if (nouveauStatut == "Terminée" && !intervention.DateFin.HasValue)
                    intervention.DateFin = DateTime.Now;

                if (nouveauStatut == "Terminée" && !intervention.EstGratuite && intervention.Facture == null)
                {
                    _repository.CreerFacturePourIntervention(id);
                }

                var updated = _repository.Update(intervention);

                // Notification client pour changement de statut
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var reclResp = await _httpClient.GetAsync($"{ClientApiBase}/reclamations/{intervention.ReclamationId}");
                        if (reclResp.IsSuccessStatusCode)
                        {
                            var reclJson = await reclResp.Content.ReadAsStringAsync();
                            var reclDoc = System.Text.Json.JsonDocument.Parse(reclJson);
                            if (reclDoc.RootElement.TryGetProperty("clientId", out var cidEl))
                            {
                                var email = await GetClientEmailAsync(cidEl.GetInt32());
                                if (!string.IsNullOrWhiteSpace(email))
                                {
                                    await TrySendNotificationAsync(email, "Mise à jour intervention", $"L'intervention #{id} est maintenant '{nouveauStatut}'.");
                                }
                            }
                        }
                    }
                    catch (Exception exNotify)
                    {
                        _logger.LogWarning(exNotify, "Notification client non envoyée pour changement statut intervention {InterventionId}", id);
                    }
                });

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/interventions/{id}/changer-statut");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // POST: api/interventions/5/creer-facture
        [HttpPost("{id}/creer-facture")]
        public IActionResult CreerFacturePourIntervention(int id)
        {
            try
            {
                var intervention = _repository.GetById(id);
                if (intervention == null)
                    return NotFound($"Intervention avec ID {id} non trouvée");

                if (intervention.EstGratuite)
                    return BadRequest("Impossible de créer une facture pour une intervention gratuite");

                if (intervention.Facture != null)
                    return BadRequest("Une facture existe déjà pour cette intervention");

                var facture = _repository.CreerFacturePourIntervention(id);
                if (facture == null)
                    return BadRequest("Erreur lors de la création de la facture");

                // Notifier le client de la facture créée
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var reclResp = await _httpClient.GetAsync($"{ClientApiBase}/reclamations/{intervention.ReclamationId}");
                        if (reclResp.IsSuccessStatusCode)
                        {
                            var reclJson = await reclResp.Content.ReadAsStringAsync();
                            var reclDoc = System.Text.Json.JsonDocument.Parse(reclJson);
                            if (reclDoc.RootElement.TryGetProperty("clientId", out var cidEl))
                            {
                                var email = await GetClientEmailAsync(cidEl.GetInt32());
                                if (!string.IsNullOrWhiteSpace(email))
                                {
                                    await TrySendNotificationAsync(email, "Facture créée", $"Une facture ({facture.NumeroFacture}) a été générée pour l'intervention #{id}.");
                                }
                            }
                        }
                    }
                    catch (Exception exNotify)
                    {
                        _logger.LogWarning(exNotify, "Notification facture non envoyée pour intervention {InterventionId}", id);
                    }
                });

                return CreatedAtAction(nameof(GetFacture), new { id = facture.Id }, facture);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de POST /api/interventions/{id}/creer-facture");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // ========== FACTURES ==========

        // GET: api/interventions/factures
        [HttpGet("factures")]
        public ActionResult<IEnumerable<Facture>> GetFactures()
        {
            try
            {
                var factures = _repository.GetAllFactures();
                return Ok(factures);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/factures");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/factures/5
        [HttpGet("factures/{id}")]
        public ActionResult<Facture> GetFacture(int id)
        {
            try
            {
                var facture = _repository.GetFactureById(id);
                if (facture == null)
                    return NotFound($"Facture avec ID {id} non trouvée");
                return Ok(facture);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/factures/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/factures/intervention/5
        [HttpGet("factures/intervention/{interventionId}")]
        public ActionResult<Facture> GetFactureByIntervention(int interventionId)
        {
            try
            {
                var facture = _repository.GetFactureByInterventionId(interventionId);
                if (facture == null)
                    return NotFound($"Aucune facture trouvée pour l'intervention {interventionId}");
                return Ok(facture);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/factures/intervention/{interventionId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/factures/numero/FACT-2024-001
        [HttpGet("factures/numero/{numero}")]
        public ActionResult<Facture> GetFactureByNumero(string numero)
        {
            try
            {
                var facture = _repository.GetFactureByNumero(numero);
                if (facture == null)
                    return NotFound($"Facture avec numéro {numero} non trouvée");
                return Ok(facture);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/factures/numero/{numero}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // POST: api/interventions/factures
        [HttpPost("factures")]
        public ActionResult<Facture> CreateFacture(Facture facture)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var intervention = _repository.GetById(facture.InterventionId);
                if (intervention == null)
                    return BadRequest($"Intervention avec ID {facture.InterventionId} non trouvée");

                var existingFacture = _repository.GetFactureByInterventionId(facture.InterventionId);
                if (existingFacture != null)
                    return BadRequest("Une facture existe déjà pour cette intervention");

                if (string.IsNullOrEmpty(facture.NumeroFacture))
                    facture.NumeroFacture = _repository.GenererNumeroFacture();

                _repository.AddFacture(facture);

                // Notifier le client pour la création de facture
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var reclResp = await _httpClient.GetAsync($"{ClientApiBase}/reclamations/{intervention.ReclamationId}");
                        if (reclResp.IsSuccessStatusCode)
                        {
                            var reclJson = await reclResp.Content.ReadAsStringAsync();
                            var reclDoc = System.Text.Json.JsonDocument.Parse(reclJson);
                            if (reclDoc.RootElement.TryGetProperty("clientId", out var cidEl))
                            {
                                var email = await GetClientEmailAsync(cidEl.GetInt32());
                                if (!string.IsNullOrWhiteSpace(email))
                                {
                                    await TrySendNotificationAsync(email, "Facture disponible", $"Votre facture {facture.NumeroFacture} est disponible pour l'intervention #{facture.InterventionId}.");
                                }
                            }
                        }
                    }
                    catch (Exception exNotify)
                    {
                        _logger.LogWarning(exNotify, "Notification client non envoyée après création facture {FactureId}", facture.Id);
                    }
                });

                return CreatedAtAction(nameof(GetFacture), new { id = facture.Id }, facture);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/interventions/factures");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/interventions/factures/5
        [HttpPut("factures/{id}")]
        public IActionResult UpdateFacture(int id, Facture facture)
        {
            try
            {
                if (id != facture.Id)
                    return BadRequest("ID mismatch");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (!_repository.FactureExists(id))
                    return NotFound($"Facture avec ID {id} non trouvée");

                var updated = _repository.UpdateFacture(facture);
                if (updated == null)
                    return NotFound();

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/interventions/factures/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // DELETE: api/interventions/factures/5
        [HttpDelete("factures/{id}")]
        public IActionResult DeleteFacture(int id)
        {
            try
            {
                if (!_repository.FactureExists(id))
                    return NotFound($"Facture avec ID {id} non trouvée");

                _repository.DeleteFacture(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de DELETE /api/interventions/factures/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/factures/statut/Payée
        [HttpGet("factures/statut/{statut}")]
        public ActionResult<IEnumerable<Facture>> GetFacturesByStatut(string statut)
        {
            try
            {
                var factures = _repository.GetFacturesByStatut(statut);
                return Ok(factures);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/factures/statut/{statut}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/factures/impayees
        [HttpGet("factures/impayees")]
        public ActionResult<IEnumerable<Facture>> GetFacturesImpaye()
        {
            try
            {
                var factures = _repository.GetFacturesImpaye();
                return Ok(factures);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/factures/impayees");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/factures/search/terme
        [HttpGet("factures/search/{term}")]
        public ActionResult<IEnumerable<Facture>> SearchFactures(string term)
        {
            try
            {
                var factures = _repository.SearchFactures(term);
                return Ok(factures);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/interventions/factures/search/{term}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/factures/advanced
        [HttpGet("factures/advanced")]
        public ActionResult<IEnumerable<Facture>> AdvancedFactureSearch(
            [FromQuery] string searchTerm = null,
            [FromQuery] string numero = null,
            [FromQuery] string clientNom = null,
            [FromQuery] string statut = null,
            [FromQuery] DateTime? dateDebut = null,
            [FromQuery] DateTime? dateFin = null,
            [FromQuery] decimal? montantMin = null,
            [FromQuery] decimal? montantMax = null,
            [FromQuery] string sortBy = "date")
        {
            try
            {
                var query = _repository.AdvancedFactureSearch(
                    searchTerm, numero, clientNom, statut, dateDebut, dateFin, montantMin, montantMax, sortBy);

                var factures = query.ToList();
                return Ok(factures);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/factures/advanced");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/interventions/factures/5/changer-statut
        [HttpPut("factures/{id}/changer-statut")]
        public IActionResult ChangerStatutFacture(int id, [FromBody] string nouveauStatut)
        {
            try
            {
                var facture = _repository.GetFactureById(id);
                if (facture == null)
                    return NotFound($"Facture avec ID {id} non trouvée");

                facture.Statut = nouveauStatut;

                if (nouveauStatut == "Payée" && !facture.DatePaiement.HasValue)
                    facture.DatePaiement = DateTime.Now;

                var updated = _repository.UpdateFacture(facture);

                // Notifier le client si paiement confirmé
                _ = Task.Run(async () =>
                {
                    try
                    {
                        if (string.Equals(nouveauStatut, "Payée", StringComparison.OrdinalIgnoreCase))
                        {
                            var intervention = _repository.GetById(facture.InterventionId);
                            if (intervention != null)
                            {
                                var reclResp = await _httpClient.GetAsync($"{ClientApiBase}/reclamations/{intervention.ReclamationId}");
                                if (reclResp.IsSuccessStatusCode)
                                {
                                    var reclJson = await reclResp.Content.ReadAsStringAsync();
                                    var reclDoc = System.Text.Json.JsonDocument.Parse(reclJson);
                                    if (reclDoc.RootElement.TryGetProperty("clientId", out var cidEl))
                                    {
                                        var email = await GetClientEmailAsync(cidEl.GetInt32());
                                        if (!string.IsNullOrWhiteSpace(email))
                                        {
                                            await TrySendNotificationAsync(email, "Facture payée", $"Votre facture {facture.NumeroFacture} a été réglée. Merci.");
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception exNotify)
                    {
                        _logger.LogWarning(exNotify, "Notification paiement facture non envoyée {FactureId}", facture.Id);
                    }
                });

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/interventions/factures/{id}/changer-statut");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/interventions/factures/periode
        [HttpGet("factures/periode")]
        public ActionResult<IEnumerable<Facture>> GetFacturesParPeriode(
            [FromQuery] DateTime debut,
            [FromQuery] DateTime fin)
        {
            try
            {
                var factures = _repository.GetFacturesParPeriode(debut, fin);
                return Ok(factures);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/factures/periode");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // ========== STATISTIQUES ==========

        // GET: api/interventions/stats
        [HttpGet("stats")]
        public ActionResult<object> GetStats()
        {
            try
            {
                var interventions = _repository.GetStatistiquesInterventions();
                var financier = _repository.GetStatistiquesFinancieres();
                var couts = _repository.GetCoutMoyenParType();
                var parTechnicien = _repository.GetInterventionsParTechnicien();

                return Ok(new
                {
                    Interventions = interventions,
                    Financier = financier,
                    CoutsMoyens = couts,
                    ParTechnicien = parTechnicien
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/interventions/stats");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}