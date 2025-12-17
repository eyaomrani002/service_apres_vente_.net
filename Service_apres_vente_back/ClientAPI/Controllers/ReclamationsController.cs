using Microsoft.AspNetCore.Mvc;
using ClientAPI.Models;
using ClientAPI.Models.Repositories;
using System.ComponentModel.DataAnnotations;

namespace ClientAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReclamationsController : ControllerBase
    {
        private readonly IReclamationRepository _repository;
        private readonly IClientRepository _clientRepository;
        private readonly ILogger<ReclamationsController> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly HttpClient _httpClient;

        public ReclamationsController(
            IReclamationRepository repository,
            IClientRepository clientRepository,
            ILogger<ReclamationsController> logger,
            IWebHostEnvironment environment,
            IHttpClientFactory httpClientFactory)
        {
            _repository = repository;
            _clientRepository = clientRepository;
            _logger = logger;
            _environment = environment;
            _httpClient = httpClientFactory.CreateClient();
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
                    reclamation.Priorite,
                    reclamation.TypeProbleme,
                    reclamation.PhotosUrls,
                    reclamation.PiecesNecessaires,
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
        public async Task<ActionResult<Reclamation>> CreateReclamation(Reclamation reclamation)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (!_clientRepository.ClientExists(reclamation.ClientId))
                    return BadRequest($"Client avec ID {reclamation.ClientId} n'existe pas");

                // Validation croisée: vérifier que l'article existe dans ArticleAPI
                if (reclamation.ArticleId <= 0)
                    return BadRequest("ArticleId est requis");

                try
                {
                    var articleResp = await _httpClient.GetAsync($"https://localhost:7174/api/articles/{reclamation.ArticleId}");
                    if (!articleResp.IsSuccessStatusCode)
                        return BadRequest($"Article avec ID {reclamation.ArticleId} n'existe pas");
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogWarning(ex, "ArticleAPI non accessible pour vérifier l'existence de l'article {ArticleId}", reclamation.ArticleId);
                    return StatusCode(503, "Service ArticleAPI indisponible pour validation");
                }

                reclamation.DateCreation = DateTime.Now;
                reclamation.Statut = "En attente";

                // Initialiser les listes si null
                reclamation.PhotosUrls ??= new List<string>();
                reclamation.PiecesNecessaires ??= new List<ReclamationPiece>();

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

                var existing = _repository.GetReclamationById(id);
                if (existing == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                // Si la réclamation est marquée comme résolue, ajouter la date de résolution
                if (reclamation.Statut == "Résolu" && existing.Statut != "Résolu")
                    reclamation.DateResolution = DateTime.Now;
                else if (reclamation.Statut != "Résolu" && existing.Statut == "Résolu")
                    reclamation.DateResolution = null;

                var updated = _repository.UpdateReclamation(reclamation);
                if (updated == null)
                    return NotFound();

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

        // ========== NOUVEAUX ENDPOINTS POUR LES FONCTIONNALITÉS AJOUTÉES ==========

        // POST: api/reclamations/{id}/upload-photo
        [HttpPost("{id}/upload-photo")]
        public async Task<IActionResult> UploadPhoto(int id, IFormFile file)
        {
            try
            {
                var reclamation = _repository.GetReclamationById(id);
                if (reclamation == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                if (file == null || file.Length == 0)
                    return BadRequest("Aucun fichier sélectionné");

                // Validation du type de fichier
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
                    return BadRequest("Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou BMP");

                // Validation de la taille
                if (file.Length > 5 * 1024 * 1024) // 5MB max
                    return BadRequest("Le fichier est trop volumineux (max 5MB)");

                // Créer le dossier s'il n'existe pas
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "reclamations");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // Générer un nom de fichier unique
                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                // Sauvegarder le fichier
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Créer l'URL d'accès
                var fileUrl = $"/uploads/reclamations/{fileName}";

                // Initialiser la liste si null
                reclamation.PhotosUrls ??= new List<string>();
                reclamation.PhotosUrls.Add(fileUrl);

                _repository.UpdateReclamation(reclamation);

                return Ok(new
                {
                    message = "Photo uploadée avec succès",
                    url = fileUrl,
                    fileName = file.FileName,
                    size = file.Length
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de POST /api/reclamations/{id}/upload-photo");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // POST: api/reclamations/{id}/assign-technician
        [HttpPut("{id}/assign-technician")]
        public async Task<IActionResult> AssignTechnician(int id, [FromBody] AssignTechnicianDto assignDto)
        {
            try
            {
                var reclamation = _repository.GetReclamationById(id);
                if (reclamation == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                // Vérifier si le technicien existe (appel à InterventionAPI)
                using var httpClient = new HttpClient();
                try
                {
                    var response = await httpClient.GetAsync($"http://localhost:7228/api/interventions/techniciens/{assignDto.TechnicienId}");
                    if (!response.IsSuccessStatusCode)
                        return BadRequest($"Technicien avec ID {assignDto.TechnicienId} non trouvé");
                }
                catch (HttpRequestException)
                {
                    _logger.LogWarning("InterventionAPI non disponible, vérification du technicien ignorée");
                }

                // Mettre à jour le statut
                reclamation.Statut = "Assignée";

                // Vous pourriez ajouter un champ TechnicienId dans Reclamation si nécessaire
                // reclamation.TechnicienId = assignDto.TechnicienId;

                var updated = _repository.UpdateReclamation(reclamation);

                // Créer une intervention si elle n'existe pas encore
                try
                {
                    var interventionData = new
                    {
                        ReclamationId = id,
                        TechnicienId = assignDto.TechnicienId,
                        Description = $"Intervention pour la réclamation #{id}",
                        DateIntervention = DateTime.Now.AddDays(1), // Planifier pour demain
                        Statut = "Planifiée"
                    };

                    var interventionResponse = await httpClient.PostAsJsonAsync(
                        "http://localhost:7228/api/interventions",
                        interventionData);

                    if (interventionResponse.IsSuccessStatusCode)
                    {
                        _logger.LogInformation($"Intervention créée pour la réclamation {id}");
                    }
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogWarning(ex, "Impossible de créer l'intervention, InterventionAPI non disponible");
                }

                return Ok(new
                {
                    message = $"Technicien {assignDto.TechnicienId} assigné avec succès",
                    reclamation = updated
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/reclamations/{id}/assign-technician");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // POST: api/reclamations/{id}/add-piece
        [HttpPost("{id}/add-piece")]
        public IActionResult AddPiece(int id, [FromBody] ReclamationPiece piece)
        {
            try
            {
                var reclamation = _repository.GetReclamationById(id);
                if (reclamation == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                piece.ReclamationId = id;
                reclamation.PiecesNecessaires ??= new List<ReclamationPiece>();
                reclamation.PiecesNecessaires.Add(piece);

                var updated = _repository.UpdateReclamation(reclamation);
                return Ok(new
                {
                    message = "Pièce ajoutée avec succès",
                    piece = piece,
                    reclamation = updated
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de POST /api/reclamations/{id}/add-piece");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/reclamations/{id}/update-piece/{pieceId}
        [HttpPut("{id}/update-piece/{pieceId}")]
        public IActionResult UpdatePiece(int id, int pieceId, [FromBody] ReclamationPiece updatedPiece)
        {
            try
            {
                var reclamation = _repository.GetReclamationById(id);
                if (reclamation == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                if (reclamation.PiecesNecessaires == null)
                    return BadRequest("Cette réclamation n'a pas de pièces");

                var piece = reclamation.PiecesNecessaires.FirstOrDefault(p => p.Id == pieceId);
                if (piece == null)
                    return NotFound($"Pièce avec ID {pieceId} non trouvée");

                // Mettre à jour la pièce
                piece.Reference = updatedPiece.Reference;
                piece.Description = updatedPiece.Description;
                piece.Quantite = updatedPiece.Quantite;
                piece.Fournie = updatedPiece.Fournie;

                var updatedReclamation = _repository.UpdateReclamation(reclamation);
                return Ok(new
                {
                    message = "Pièce mise à jour avec succès",
                    piece = piece,
                    reclamation = updatedReclamation
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/reclamations/{id}/update-piece/{pieceId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // DELETE: api/reclamations/{id}/remove-piece/{pieceId}
        [HttpDelete("{id}/remove-piece/{pieceId}")]
        public IActionResult RemovePiece(int id, int pieceId)
        {
            try
            {
                var reclamation = _repository.GetReclamationById(id);
                if (reclamation == null)
                    return NotFound($"Réclamation avec ID {id} non trouvée");

                if (reclamation.PiecesNecessaires == null)
                    return BadRequest("Cette réclamation n'a pas de pièces");

                var piece = reclamation.PiecesNecessaires.FirstOrDefault(p => p.Id == pieceId);
                if (piece == null)
                    return NotFound($"Pièce avec ID {pieceId} non trouvée");

                reclamation.PiecesNecessaires.Remove(piece);

                // Si la liste est vide, la mettre à null
                if (!reclamation.PiecesNecessaires.Any())
                    reclamation.PiecesNecessaires = null;

                var updatedReclamation = _repository.UpdateReclamation(reclamation);
                return Ok(new
                {
                    message = "Pièce supprimée avec succès",
                    reclamation = updatedReclamation
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de DELETE /api/reclamations/{id}/remove-piece/{pieceId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/reclamations/dashboard/stats
        [HttpGet("dashboard/stats")]
        public ActionResult<object> GetDashboardStats()
        {
            try
            {
                var allReclamations = _repository.GetAllReclamations();
                var maintenant = DateTime.Now;
                var ilYAMois = maintenant.AddMonths(-1);

                var stats = new
                {
                    Total = allReclamations.Count,
                    EnAttente = allReclamations.Count(r => r.Statut == "En attente"),
                    EnCours = allReclamations.Count(r => r.Statut == "En cours"),
                    Resolues = allReclamations.Count(r => r.Statut == "Résolu"),
                    EnRetard = allReclamations.Count(r => r.EnRetard),

                    // Par priorité
                    PrioriteBasse = allReclamations.Count(r => r.Priorite == "Basse"),
                    PrioriteMoyenne = allReclamations.Count(r => r.Priorite == "Moyenne"),
                    PrioriteHaute = allReclamations.Count(r => r.Priorite == "Haute"),
                    PrioriteUrgente = allReclamations.Count(r => r.Priorite == "Urgente"),

                    // Par type de problème
                    ParTypeProbleme = allReclamations
                        .GroupBy(r => r.TypeProbleme)
                        .ToDictionary(g => g.Key, g => g.Count()),

                    // Évolution mensuelle
                    CeMois = allReclamations.Count(r => r.DateCreation >= ilYAMois),
                    MoisPrecedent = allReclamations.Count(r =>
                        r.DateCreation >= ilYAMois.AddMonths(-1) && r.DateCreation < ilYAMois),

                    // Temps moyen de résolution
                    TempsMoyenResolution = allReclamations
                        .Where(r => r.DureeJours.HasValue)
                        .Select(r => r.DureeJours.Value)
                        .DefaultIfEmpty(0)
                        .Average(),

                    // Réclamations avec photos
                    AvecPhotos = allReclamations.Count(r =>
                        r.PhotosUrls != null && r.PhotosUrls.Any()),

                    // Réclamations avec pièces nécessaires
                    AvecPieces = allReclamations.Count(r =>
                        r.PiecesNecessaires != null && r.PiecesNecessaires.Any()),

                    // Top clients avec réclamations
                    TopClients = allReclamations
                        .GroupBy(r => r.ClientId)
                        .Select(g => new
                        {
                            ClientId = g.Key,
                            NombreReclamations = g.Count(),
                            ReclamationsEnCours = g.Count(r => r.Statut != "Résolu")
                        })
                        .OrderByDescending(x => x.NombreReclamations)
                        .Take(10)
                        .ToList()
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/reclamations/dashboard/stats");
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
            [FromQuery] string priorite = null,
            [FromQuery] string typeProbleme = null,
            [FromQuery] DateTime? dateDebut = null,
            [FromQuery] DateTime? dateFin = null,
            [FromQuery] bool? avecPhotos = null,
            [FromQuery] bool? avecPieces = null,
            [FromQuery] string sortBy = "dateCreation")
        {
            try
            {
                var query = _repository.AdvancedReclamationSearch(
                    searchTerm, clientId, articleId, statut, dateDebut, dateFin, sortBy);

                // Appliquer les nouveaux filtres
                if (!string.IsNullOrEmpty(priorite))
                    query = query.Where(r => r.Priorite == priorite);

                if (!string.IsNullOrEmpty(typeProbleme))
                    query = query.Where(r => r.TypeProbleme == typeProbleme);

                if (avecPhotos.HasValue)
                {
                    if (avecPhotos.Value)
                        query = query.Where(r => r.PhotosUrls != null && r.PhotosUrls.Any());
                    else
                        query = query.Where(r => r.PhotosUrls == null || !r.PhotosUrls.Any());
                }

                if (avecPieces.HasValue)
                {
                    if (avecPieces.Value)
                        query = query.Where(r => r.PiecesNecessaires != null && r.PiecesNecessaires.Any());
                    else
                        query = query.Where(r => r.PiecesNecessaires == null || !r.PiecesNecessaires.Any());
                }

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
                else if (nouveauStatut != "Résolu" && reclamation.DateResolution.HasValue)
                    reclamation.DateResolution = null;

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
                    r.Priorite,
                    r.TypeProbleme,
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

        // GET: api/reclamations/by-priority/{priorite}
        [HttpGet("by-priority/{priorite}")]
        public ActionResult<IEnumerable<Reclamation>> GetReclamationsByPriority(string priorite)
        {
            try
            {
                var allReclamations = _repository.GetAllReclamations();
                var reclamations = allReclamations
                    .Where(r => r.Priorite.Equals(priorite, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reclamations/by-priority/{priorite}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/reclamations/by-type/{typeProbleme}
        [HttpGet("by-type/{typeProbleme}")]
        public ActionResult<IEnumerable<Reclamation>> GetReclamationsByType(string typeProbleme)
        {
            try
            {
                var allReclamations = _repository.GetAllReclamations();
                var reclamations = allReclamations
                    .Where(r => r.TypeProbleme.Equals(typeProbleme, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/reclamations/by-type/{typeProbleme}");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }

    // ========== DTOs POUR LES NOUVELLES FONCTIONNALITÉS ==========

    public class AssignTechnicianDto
    {
        [Required]
        public int TechnicienId { get; set; }

        public string? Notes { get; set; }
    }

    public class UploadPhotoDto
    {
        [Required]
        public IFormFile File { get; set; }

        public string? Description { get; set; }
    }
}