using Microsoft.AspNetCore.Mvc;
using ClientAPI.Models;
using ClientAPI.Models.Repositories;

namespace ClientAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly IClientRepository _clientRepository;
        private readonly IReclamationRepository _reclamationRepository;
        private readonly ILogger<ClientsController> _logger;

        public ClientsController(
            IClientRepository clientRepository,
            IReclamationRepository reclamationRepository,
            ILogger<ClientsController> logger)
        {
            _clientRepository = clientRepository;
            _reclamationRepository = reclamationRepository;
            _logger = logger;
        }

        // ========== ENDPOINTS CLIENTS ==========

        [HttpGet]
        public ActionResult<IEnumerable<object>> GetClients()
        {
            try
            {
                var clients = _clientRepository.GetAllClients();

                // Transformer en DTOs
                var clientDTOs = clients.Select(c => new
                {
                    c.Id,
                    c.Nom,
                    c.Email,
                    c.Telephone,
                    c.Adresse,
                    c.DateInscription,
                    // Ces valeurs seront calculées par le repository
                    NombreReclamations = _reclamationRepository.CountReclamationsForClient(c.Id),
                    ReclamationsEnCours = _reclamationRepository.CountReclamationsByStatutForClient(c.Id, "En cours"),
                    DerniereReclamation = _reclamationRepository.GetDerniereReclamationForClient(c.Id)
                }).ToList();

                return Ok(clientDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/clients");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/clients/5
        [HttpGet("{id}")]
        public ActionResult<Client> GetClient(int id)
        {
            try
            {
                var client = _clientRepository.GetClientById(id);
                if (client == null)
                    return NotFound($"Client avec ID {id} non trouvé");

                // Enrichir avec les informations de réclamations
                var clientDetail = new
                {
                    client.Id,
                    client.Nom,
                    client.Email,
                    client.Telephone,
                    client.Adresse,
                    client.DateInscription,
                    NombreReclamations = _reclamationRepository.CountReclamationsForClient(id),
                    ReclamationsEnCours = _reclamationRepository.CountReclamationsByStatut("En cours"),
                    DerniereReclamation = _reclamationRepository.GetReclamationsByClientId(id)
                        .OrderByDescending(r => r.DateCreation)
                        .FirstOrDefault()?.DateCreation
                };

                return Ok(clientDetail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/clients/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

// GET: api/clients/email/john@example.com
[HttpGet("email/{email}")]
public ActionResult<Client> GetClientByEmail(string email)
{
    try
    {
        var client = _clientRepository.GetClientByEmail(email);
        if (client == null)
            return NotFound($"Client avec email {email} non trouvé");
        return Ok(client);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, $"Erreur lors de GET /api/clients/email/{email}");
        return StatusCode(500, "Erreur serveur");
    }
}

        // POST: api/clients
// Dans ClientsController.cs (ClientAPI)
[HttpPost]
public ActionResult<Client> CreateClient(Client client)
{
    try
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Vérifier si l'email existe déjà
        var existingClient = _clientRepository.GetClientByEmail(client.Email);
        if (existingClient != null)
        {
            // IMPORTANT: Retourner OK, pas BadRequest pour la synchro
            _logger.LogInformation("Client with email {Email} already exists, returning existing", client.Email);
            return Ok(existingClient);  // ← Ceci est CORRECT
        }

        // Si DateInscription n'est pas fournie, mettre la date actuelle
        if (client.DateInscription == default)
            client.DateInscription = DateTime.Now;

        _clientRepository.AddClient(client);
        
        _logger.LogInformation("✅ New client created: {Email} (ID: {Id})", client.Email, client.Id);
        return CreatedAtAction(nameof(GetClient), new { id = client.Id }, client);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erreur lors de POST /api/clients");
        return StatusCode(500, "Erreur serveur");
    }
}
// Dans ClientsController.cs (ClientAPI)
[HttpPost("internal")]
[ApiExplorerSettings(IgnoreApi = true)] // Masquer de Swagger
public ActionResult<Client> CreateClientInternal([FromBody] Client client)
{
    try
    {
        // Logique simplifiée sans validation stricte
        var existing = _clientRepository.GetClientByEmail(client.Email);
        if (existing != null)
            return Ok(existing);

        if (client.DateInscription == default)
            client.DateInscription = DateTime.Now;

        _clientRepository.AddClient(client);
        return Ok(client); // Retourne OK (200) au lieu de Created (201)
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erreur dans CreateClientInternal");
        return StatusCode(500, "Erreur serveur");
    }
}
        // PUT: api/clients/5
        [HttpPut("{id}")]
        public IActionResult UpdateClient(int id, Client client)
        {
            try
            {
                if (id != client.Id)
                    return BadRequest("ID mismatch");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (!_clientRepository.ClientExists(id))
                    return NotFound($"Client avec ID {id} non trouvé");

                var updated = _clientRepository.UpdateClient(client);
                if (updated == null)
                    return NotFound();

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/clients/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // DELETE: api/clients/5
        [HttpDelete("{id}")]
        public IActionResult DeleteClient(int id)
        {
            try
            {
                if (!_clientRepository.ClientExists(id))
                    return NotFound($"Client avec ID {id} non trouvé");

                _clientRepository.DeleteClient(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de DELETE /api/clients/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // ========== ENDPOINTS DE RECHERCHE ==========

        // GET: api/clients/search/term
        [HttpGet("search/{term}")]
        public ActionResult<IEnumerable<Client>> SearchClients(string term)
        {
            try
            {
                var clients = _clientRepository.SearchClients(term);
                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/clients/search/{term}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/clients/advanced
        [HttpGet("advanced")]
        public ActionResult<IEnumerable<Client>> AdvancedClientSearch(
            [FromQuery] string searchTerm = null,
            [FromQuery] string email = null,
            [FromQuery] bool? avecReclamations = null,
            [FromQuery] string sortBy = "nom")
        {
            try
            {
                var query = _clientRepository.AdvancedClientSearch(searchTerm, email, avecReclamations, sortBy);
                var clients = query.ToList();
                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/clients/advanced");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // ========== ENDPOINTS STATISTIQUES ==========

        // GET: api/clients/stats
        [HttpGet("stats")]
        public ActionResult<object> GetStats()
        {
            try
            {
                var stats = new
                {
                    TotalClients = _clientRepository.CountClients(),
                    ClientsAvecReclamations = _clientRepository.GetClientsAvecReclamations().Count,
                    ReclamationStats = _reclamationRepository.GetStatistiquesReclamations()
                };
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/clients/stats");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/clients/avec-reclamations
        [HttpGet("avec-reclamations")]
        public ActionResult<IEnumerable<Client>> GetClientsAvecReclamations()
        {
            try
            {
                var clients = _clientRepository.GetClientsAvecReclamations();
                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/clients/avec-reclamations");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/clients/5/reclamations
        [HttpGet("{id}/reclamations")]
        public ActionResult<IEnumerable<Reclamation>> GetClientReclamations(int id)
        {
            try
            {
                if (!_clientRepository.ClientExists(id))
                    return NotFound($"Client avec ID {id} non trouvé");

                var reclamations = _reclamationRepository.GetReclamationsByClientId(id);
                return Ok(reclamations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/clients/{id}/reclamations");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}