using Microsoft.AspNetCore.Mvc;
using ClientAPI.Models;
using ClientAPI.Models.Repositories;

namespace ClientAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommandesController : ControllerBase
    {
        private readonly ICommandeRepository _commandeRepository;
        private readonly IClientRepository _clientRepository;
        private readonly ILogger<CommandesController> _logger;

        public CommandesController(
            ICommandeRepository commandeRepository,
            IClientRepository clientRepository,
            ILogger<CommandesController> logger)
        {
            _commandeRepository = commandeRepository;
            _clientRepository = clientRepository;
            _logger = logger;
        }

        // GET: api/commandes
        [HttpGet]
        public ActionResult<IEnumerable<Commande>> GetCommandes()
        {
            try
            {
                var commandes = _commandeRepository.GetAll();
                return Ok(commandes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/commandes");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/commandes/5
        [HttpGet("{id}")]
        public ActionResult<Commande> GetCommande(int id)
        {
            try
            {
                var commande = _commandeRepository.GetById(id);
                if (commande == null)
                    return NotFound($"Commande avec ID {id} non trouvée");
                return Ok(commande);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/commandes/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/commandes/client/3
        [HttpGet("client/{clientId}")]
        public ActionResult<IEnumerable<Commande>> GetCommandesByClient(int clientId)
        {
            try
            {
                if (!_clientRepository.ClientExists(clientId))
                    return NotFound($"Client avec ID {clientId} non trouvé");

                var commandes = _commandeRepository.GetByClientId(clientId);
                return Ok(commandes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/commandes/client/{clientId}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        public record CommandeLigneDto(int ArticleId, int Quantite, decimal PrixUnitaire);
        public record CreateCommandeDto(int ClientId, List<CommandeLigneDto> Lignes, string? Statut = null);

        // POST: api/commandes
        [HttpPost]
        public ActionResult<Commande> CreateCommande([FromBody] CreateCommandeDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest("Payload manquant");

                if (dto.Lignes == null || dto.Lignes.Count == 0)
                    return BadRequest("Au moins une ligne de commande est requise");

                if (!_clientRepository.ClientExists(dto.ClientId))
                    return BadRequest($"Client avec ID {dto.ClientId} n'existe pas");

                var lignes = dto.Lignes.Select(l => new CommandeLigne
                {
                    ArticleId = l.ArticleId,
                    Quantite = l.Quantite,
                    PrixUnitaire = l.PrixUnitaire
                });

                var commande = new Commande
                {
                    ClientId = dto.ClientId,
                    Statut = string.IsNullOrWhiteSpace(dto.Statut) ? "Payée" : dto.Statut.Trim(),
                    DateCreation = DateTime.Now
                };

                var created = _commandeRepository.CreateWithLines(commande, lignes);
                return CreatedAtAction(nameof(GetCommande), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/commandes");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/commandes/5/statut
        [HttpPut("{id}/statut")]
        public ActionResult<Commande> UpdateStatut(int id, [FromBody] string statut)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(statut))
                    return BadRequest("Statut requis");

                var updated = _commandeRepository.UpdateStatut(id, statut.Trim());
                if (updated == null)
                    return NotFound($"Commande avec ID {id} non trouvée");

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/commandes/{id}/statut");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}
