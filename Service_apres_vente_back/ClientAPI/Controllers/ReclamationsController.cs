using Microsoft.AspNetCore.Mvc;
using ClientAPI.Models;
using ClientAPI.Models.Repositories;

namespace ClientAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReclamationsController : ControllerBase
    {
        private readonly IReclamationRepository _repository;
        private readonly IClientRepository _clientRepository;
        private readonly ILogger<ReclamationsController> _logger;

        public ReclamationsController(
            IReclamationRepository repository,
            IClientRepository clientRepository,
            ILogger<ReclamationsController> logger)
        {
            _repository = repository;
            _clientRepository = clientRepository;
            _logger = logger;
        }

        // ========== ENDPOINTS RECLAMATIONS ==========

        // GET: api/reclamations
        [HttpGet]
        public ActionResult<IEnumerable<Reclamation>> GetReclamations()
        {
            try
            {
                var reclamations = _repository.GetAllReclamations();
                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reclamations");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/reclamations/5
        [HttpGet("{id}")]
        public ActionResult<Reclamation> GetReclamation(int id)
        {
            try
            {
                var reclamation = _repository.GetReclamationById(id);
                if (reclamation == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                // Enrichir avec les informations du client
                var reclamationDetail = new
                {
                    reclamation.Id,
                    reclamation.Description,
                    reclamation.DateCreation,
                    reclamation.DateResolution,
                    reclamation.Statut,
                    reclamation.ClientId,
                    reclamation.ArticleId,
                    reclamation.DureeJours,
                    reclamation.EstResolue,
                    reclamation.EnRetard,
                    Client = _clientRepository.GetClientById(reclamation.ClientId)
                };

                return Ok(reclamationDetail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reclamations/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // POST: api/reclamations
        [HttpPost]
        public ActionResult<Reclamation> CreateReclamation(Reclamation reclamation)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (!_clientRepository.ClientExists(reclamation.ClientId))
                    return BadRequest($"Client avec ID {reclamation.ClientId} n'existe pas");

                reclamation.DateCreation = DateTime.Now;
                reclamation.Statut = "En attente";

                _repository.AddReclamation(reclamation);
                return CreatedAtAction(nameof(GetReclamation), new { id = reclamation.Id }, reclamation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/reclamations");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/reclamations/5
        [HttpPut("{id}")]
        public IActionResult UpdateReclamation(int id, Reclamation reclamation)
        {
            try
            {
                if (id != reclamation.Id)
                    return BadRequest("ID mismatch");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Si la réclamation est marquée comme résolue, ajouter la date de résolution
                if (reclamation.Statut == "Résolu" && !reclamation.DateResolution.HasValue)
                    reclamation.DateResolution = DateTime.Now;

                var updated = _repository.UpdateReclamation(reclamation);
                if (updated == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/reclamations/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // DELETE: api/reclamations/5
        [HttpDelete("{id}")]
        public IActionResult DeleteReclamation(int id)
        {
            try
            {
                if (!_repository.ReclamationExists(id))
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                _repository.DeleteReclamation(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de DELETE /api/reclamations/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // ========== ENDPOINTS SPÉCIFIQUES ==========

        // GET: api/reclamations/client/5
        [HttpGet("client/{clientId}")]
        public ActionResult<IEnumerable<Reclamation>> GetReclamationsByClient(int clientId)
        {
            try
            {
                if (!_clientRepository.ClientExists(clientId))
                    return NotFound($"Client avec ID {clientId} non trouvé");

                var reclamations = _repository.GetReclamationsByClientId(clientId);
                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reclamations/client/{clientId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/reclamations/article/5
        [HttpGet("article/{articleId}")]
        public ActionResult<IEnumerable<Reclamation>> GetReclamationsByArticle(int articleId)
        {
            try
            {
                var reclamations = _repository.GetReclamationsByArticleId(articleId);
                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reclamations/article/{articleId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/reclamations/search/term
        [HttpGet("search/{term}")]
        public ActionResult<IEnumerable<Reclamation>> SearchReclamations(string term)
        {
            try
            {
                var reclamations = _repository.SearchReclamations(term);
                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reclamations/search/{term}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // ========== ENDPOINTS STATISTIQUES ==========

        // GET: api/reclamations/stats
        [HttpGet("stats")]
        public ActionResult<object> GetStats()
        {
            try
            {
                var stats = _repository.GetStatistiquesReclamations();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reclamations/stats");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/reclamations/en-retard
        [HttpGet("en-retard")]
        public ActionResult<IEnumerable<Reclamation>> GetReclamationsEnRetard()
        {
            try
            {
                var reclamations = _repository.GetReclamationsEnRetard();
                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reclamations/en-retard");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/reclamations/resolues
        [HttpGet("resolues")]
        public ActionResult<IEnumerable<Reclamation>> GetReclamationsResolues()
        {
            try
            {
                var reclamations = _repository.GetReclamationsResolues();
                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reclamations/resolues");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // ========== ENDPOINTS AVANCÉS ==========

        // GET: api/reclamations/advanced
        [HttpGet("advanced")]
        public ActionResult<IEnumerable<Reclamation>> AdvancedReclamationSearch(
            [FromQuery] string searchTerm = null,
            [FromQuery] int? clientId = null,
            [FromQuery] int? articleId = null,
            [FromQuery] string statut = null,
            [FromQuery] DateTime? dateDebut = null,
            [FromQuery] DateTime? dateFin = null,
            [FromQuery] string sortBy = "dateCreation")
        {
            try
            {
                var query = _repository.AdvancedReclamationSearch(
                    searchTerm, clientId, articleId, statut, dateDebut, dateFin, sortBy);
                var reclamations = query.ToList();
                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reclamations/advanced");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/reclamations/5/changer-statut
        [HttpPut("{id}/changer-statut")]
        public IActionResult ChangerStatutReclamation(int id, [FromBody] string nouveauStatut)
        {
            try
            {
                var reclamation = _repository.GetReclamationById(id);
                if (reclamation == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                reclamation.Statut = nouveauStatut;

                if (nouveauStatut == "Résolu" && !reclamation.DateResolution.HasValue)
                    reclamation.DateResolution = DateTime.Now;

                var updated = _repository.UpdateReclamation(reclamation);
                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/reclamations/{id}/changer-statut");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/reclamations/with-clients
        [HttpGet("with-clients")]
        public ActionResult<IEnumerable<object>> GetReclamationsWithClients()
        {
            try
            {
                var reclamations = _repository.GetAllReclamationsWithClients();
                var result = reclamations.Select(r => new
                {
                    r.Id,
                    r.Description,
                    r.DateCreation,
                    r.Statut,
                    Client = r.Client != null ? new
                    {
                        r.Client.Id,
                        r.Client.Nom,
                        r.Client.Email
                    } : null
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reclamations/with-clients");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}