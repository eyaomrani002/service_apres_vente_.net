using Microsoft.EntityFrameworkCore;
using InterventionAPI.Data;
using InterventionAPI.Models;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace InterventionAPI.Models.Repositories
{
    public class InterventionRepository : IInterventionRepository
    {
        private readonly InterventionAPIContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<InterventionRepository> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public InterventionRepository(
            InterventionAPIContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<InterventionRepository> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
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

        // ========== MÉTHODES DE GARANTIE ET LOGIQUE MÉTIER ==========

        public async Task<Intervention> CreateInterventionAvecGarantie(Intervention intervention)
        {
            try
            {
                // 1. Récupérer la réclamation pour avoir l'article ID
                var reclamation = await GetReclamationInfo(intervention.ReclamationId);
                if (reclamation == null)
                    throw new InvalidOperationException($"Réclamation {intervention.ReclamationId} non trouvée via gateway");

                // 2. Vérifier si l'article est sous garantie
                bool estSousGarantie = await VerifierGarantieArticle(reclamation.ArticleId);

                // 3. Appliquer la règle métier
                intervention.EstGratuite = estSousGarantie;

                if (estSousGarantie)
                {
                    // Intervention gratuite si sous garantie
                    intervention.CoutPieces = 0;
                    intervention.CoutMainOeuvre = 0;
                    intervention.Description += " (Intervention gratuite - Article sous garantie)";
                }
                else
                {
                    // Intervention payante - calculer les coûts si non fournis
                    if (!intervention.CoutPieces.HasValue)
                        intervention.CoutPieces = await CalculerCoutPiecesEstime(reclamation.ArticleId);

                    if (!intervention.CoutMainOeuvre.HasValue)
                        intervention.CoutMainOeuvre = 50.00m; // Coût main d'œuvre par défaut
                }

                // 4. Définir la date d'intervention si non spécifiée
                if (intervention.DateIntervention == default)
                    intervention.DateIntervention = DateTime.Now;

                // 5. Sauvegarder
                _context.Interventions.Add(intervention);
                await _context.SaveChangesAsync();

                // 6. Si payante et terminée, créer facture automatiquement
                if (!estSousGarantie && intervention.Statut == "Terminée")
                {
                    await CreerFactureAutomatique(intervention.Id, reclamation);
                }

                return intervention;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur dans CreateInterventionAvecGarantie");
                throw;
            }
        }

        public async Task<bool> VerifierGarantieArticle(int articleId)
        {
            try
            {
                var response = await _httpClient.SendAsync(CreateRequest(HttpMethod.Get, $"https://localhost:7076/apigateway/articles/{articleId}/garantie"));

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<bool>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    return result;
                }

                _logger.LogWarning($"ArticleAPI non accessible pour article {articleId}. Status: {response.StatusCode}");
                return false; // Par défaut, considérer comme hors garantie si API inaccessible
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur vérification garantie article {articleId}");
                return false;
            }
        }

        public async Task<ReclamationInfoDTO?> GetReclamationInfo(int reclamationId)
        {
            try
            {
                var response = await _httpClient.SendAsync(CreateRequest(HttpMethod.Get, $"https://localhost:7076/apigateway/reclamations/{reclamationId}"));

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var reclamation = JsonSerializer.Deserialize<ReclamationInfoDTO>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    return reclamation;
                }

                _logger.LogWarning($"ClientAPI non accessible pour réclamation {reclamationId}. Status: {response.StatusCode}");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur récupération réclamation {reclamationId}");
                return null;
            }
        }

        private async Task<decimal> CalculerCoutPiecesEstime(int articleId)
        {
            try
            {
                var response = await _httpClient.SendAsync(CreateRequest(HttpMethod.Get, $"https://localhost:7076/apigateway/articles/{articleId}"));

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var article = JsonSerializer.Deserialize<ArticleInfoDTO>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    // Estimation : 20% du prix d'achat pour les pièces, minimum 10€
                    return Math.Max(article?.PrixAchat * 0.2m ?? 30.00m, 10.00m);
                }

                return 30.00m; // Valeur par défaut
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Erreur calcul coût pièces article {articleId}");
                return 30.00m;
            }
        }

        private async Task<Facture?> CreerFactureAutomatique(int interventionId, ReclamationInfoDTO reclamation)
        {
            try
            {
                var intervention = await _context.Interventions
                    .Include(i => i.Facture)
                    .FirstOrDefaultAsync(i => i.Id == interventionId);

                if (intervention == null || intervention.EstGratuite || intervention.Facture != null)
                    return null;

                // Récupérer infos client
                var clientInfo = await GetClientInfo(reclamation.ClientId);

                var facture = new Facture
                {
                    InterventionId = interventionId,
                    NumeroFacture = GenererNumeroFacture(),
                    DateFacture = DateTime.Now,
                    ClientNom = clientInfo?.Nom ?? "Client non spécifié",
                    ClientAdresse = clientInfo?.Adresse ?? "Adresse non spécifiée",
                    ClientEmail = clientInfo?.Email ?? "email@exemple.com",
                    MontantHT = intervention.CoutTotal ?? 0,
                    TVA = 0.19m,
                    Statut = "En attente",
                    DescriptionServices = $"Intervention du {intervention.DateIntervention:dd/MM/yyyy}\n" +
                                         $"Description: {intervention.Description}\n" +
                                         $"Solution: {intervention.SolutionApportee ?? "Non spécifiée"}"
                };

                _context.Factures.Add(facture);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Facture {facture.NumeroFacture} créée automatiquement pour l'intervention {interventionId}");
                return facture;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur création facture automatique intervention {interventionId}");
                return null;
            }
        }

        private async Task<ClientInfoDTO?> GetClientInfo(int clientId)
        {
            try
            {
                var response = await _httpClient.SendAsync(CreateRequest(HttpMethod.Get, $"https://localhost:7076/apigateway/clients/{clientId}"));

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<ClientInfoDTO>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                }

                _logger.LogWarning($"ClientAPI non accessible pour client {clientId}");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Erreur récupération client {clientId}");
                return null;
            }
        }

        public async Task<decimal?> CalculerCoutIntervention(int reclamationId, bool articleSousGarantie)
        {
            if (articleSousGarantie)
                return null; // Gratuit si sous garantie

            // Logique de calcul du coût
            decimal coutBase = 50.00m; // Coût de base pour la main d'œuvre
            decimal margePieces = 1.2m; // Marge de 20% sur les pièces

            var interventions = GetByReclamationId(reclamationId);

            if (!interventions.Any())
                return coutBase;

            decimal totalPieces = interventions
                .Where(i => i.CoutPieces.HasValue)
                .Sum(i => i.CoutPieces.Value * margePieces);

            return coutBase + totalPieces;
        }

        // ========== CRUD INTERVENTIONS ==========

        public Intervention GetById(int id) =>
            _context.Interventions
                .Include(i => i.Facture)
                .FirstOrDefault(i => i.Id == id);

        public IList<Intervention> GetAll() =>
            _context.Interventions
                .Include(i => i.Facture)
                .OrderByDescending(i => i.DateIntervention)
                .ToList();

        public void Add(Intervention intervention)
        {
            _context.Interventions.Add(intervention);
            _context.SaveChanges();
        }

        public Intervention Update(Intervention intervention)
        {
            var existing = _context.Interventions
                .Include(i => i.Facture)
                .FirstOrDefault(i => i.Id == intervention.Id);

            if (existing != null)
            {
                existing.ReclamationId = intervention.ReclamationId;
                existing.TechnicienId = intervention.TechnicienId;
                existing.TechnicienNom = intervention.TechnicienNom;
                existing.DateIntervention = intervention.DateIntervention;
                existing.Statut = intervention.Statut;
                existing.Description = intervention.Description;
                existing.Observations = intervention.Observations;
                existing.SolutionApportee = intervention.SolutionApportee;
                existing.CoutPieces = intervention.CoutPieces;
                existing.CoutMainOeuvre = intervention.CoutMainOeuvre;
                existing.EstGratuite = intervention.EstGratuite;
                existing.DateFin = intervention.DateFin;

                _context.SaveChanges();
            }
            return existing;
        }

        public void Delete(int id)
        {
            var intervention = _context.Interventions
                .Include(i => i.Facture)
                .FirstOrDefault(i => i.Id == id);

            if (intervention != null)
            {
                _context.Interventions.Remove(intervention);
                _context.SaveChanges();
            }
        }

        // ========== CRUD FACTURES ==========

        public Facture? GetFactureById(int id) =>
            _context.Factures
                .Include(f => f.Intervention)
                .FirstOrDefault(f => f.Id == id);

        public Facture? GetFactureByInterventionId(int interventionId) =>
            _context.Factures
                .Include(f => f.Intervention)
                .FirstOrDefault(f => f.InterventionId == interventionId);

        public Facture? GetFactureByNumero(string numero) =>
            _context.Factures
                .Include(f => f.Intervention)
                .FirstOrDefault(f => f.NumeroFacture == numero);

        public IList<Facture> GetAllFactures() =>
            _context.Factures
                .Include(f => f.Intervention)
                .OrderByDescending(f => f.DateFacture)
                .ToList();

        public void AddFacture(Facture facture)
        {
            _context.Factures.Add(facture);
            _context.SaveChanges();
        }

        public Facture UpdateFacture(Facture facture)
        {
            var existing = _context.Factures
                .Include(f => f.Intervention)
                .FirstOrDefault(f => f.Id == facture.Id);

            if (existing != null)
            {
                existing.NumeroFacture = facture.NumeroFacture;
                existing.DateFacture = facture.DateFacture;
                existing.ClientNom = facture.ClientNom;
                existing.ClientAdresse = facture.ClientAdresse;
                existing.ClientEmail = facture.ClientEmail;
                existing.MontantHT = facture.MontantHT;
                existing.TVA = facture.TVA;
                existing.Statut = facture.Statut;
                existing.DatePaiement = facture.DatePaiement;
                existing.ModePaiement = facture.ModePaiement;
                existing.DescriptionServices = facture.DescriptionServices;

                _context.SaveChanges();
            }
            return existing;
        }

        public void DeleteFacture(int id)
        {
            var facture = _context.Factures.Find(id);
            if (facture != null)
            {
                _context.Factures.Remove(facture);
                _context.SaveChanges();
            }
        }

        // ========== MÉTHODES SPÉCIFIQUES INTERVENTIONS ==========

        public IList<Intervention> GetByReclamationId(int reclamationId) =>
            _context.Interventions
                .Include(i => i.Facture)
                .Where(i => i.ReclamationId == reclamationId)
                .OrderByDescending(i => i.DateIntervention)
                .ToList();

        public IList<Intervention> GetByTechnicienId(int technicienId) =>
            _context.Interventions
                .Include(i => i.Facture)
                .Where(i => i.TechnicienId == technicienId)
                .OrderByDescending(i => i.DateIntervention)
                .ToList();

        public IList<Intervention> GetByStatut(string statut) =>
            _context.Interventions
                .Include(i => i.Facture)
                .Where(i => i.Statut == statut)
                .OrderBy(i => i.DateIntervention)
                .ToList();

        public IList<Intervention> GetInterventionsGratuites() =>
            _context.Interventions
                .Include(i => i.Facture)
                .Where(i => i.EstGratuite)
                .OrderByDescending(i => i.DateIntervention)
                .ToList();

        public IList<Intervention> GetInterventionsPayantes() =>
            _context.Interventions
                .Include(i => i.Facture)
                .Where(i => !i.EstGratuite && i.CoutTotal.HasValue)
                .OrderByDescending(i => i.CoutTotal)
                .ToList();

        public IList<Intervention> GetInterventionsEnRetard() =>
            _context.Interventions
                .Include(i => i.Facture)
                .Where(i => i.EnRetard)
                .OrderBy(i => i.DateIntervention)
                .ToList();

        public IList<Intervention> GetInterventionsSansFacture() =>
            _context.Interventions
                .Include(i => i.Facture)
                .Where(i => i.Facture == null && !i.EstGratuite && i.Statut == "Terminée")
                .OrderByDescending(i => i.DateIntervention)
                .ToList();

        // ========== MÉTHODES SPÉCIFIQUES FACTURES ==========

        public IList<Facture> GetFacturesByStatut(string statut) =>
            _context.Factures
                .Include(f => f.Intervention)
                .Where(f => f.Statut == statut)
                .OrderByDescending(f => f.DateFacture)
                .ToList();

        public IList<Facture> GetFacturesImpaye() =>
            GetFacturesByStatut("Impayée");

        public IList<Facture> GetFacturesParPeriode(DateTime debut, DateTime fin) =>
            _context.Factures
                .Include(f => f.Intervention)
                .Where(f => f.DateFacture >= debut && f.DateFacture <= fin)
                .OrderByDescending(f => f.DateFacture)
                .ToList();

        public decimal GetTotalFacturesParPeriode(DateTime debut, DateTime fin) =>
            _context.Factures
                .Where(f => f.DateFacture >= debut && f.DateFacture <= fin && f.Statut != "Annulée")
                .Sum(f => f.MontantTTC);

        // ========== RECHERCHE ==========

        public IList<Intervention> SearchInterventions(string searchTerm) =>
            _context.Interventions
                .Include(i => i.Facture)
                .Where(i => i.Description.Contains(searchTerm) ||
                           i.Observations.Contains(searchTerm) ||
                           i.SolutionApportee.Contains(searchTerm) ||
                           i.TechnicienNom.Contains(searchTerm))
                .OrderByDescending(i => i.DateIntervention)
                .ToList();

        public IList<Facture> SearchFactures(string searchTerm) =>
            _context.Factures
                .Include(f => f.Intervention)
                .Where(f => f.NumeroFacture.Contains(searchTerm) ||
                           f.ClientNom.Contains(searchTerm) ||
                           f.ClientEmail.Contains(searchTerm) ||
                           (f.DescriptionServices != null && f.DescriptionServices.Contains(searchTerm)))
                .OrderByDescending(f => f.DateFacture)
                .ToList();

        public IQueryable<Intervention> GetAllInterventionsQueryable() =>
            _context.Interventions
                .Include(i => i.Facture)
                .AsQueryable();

        public IQueryable<Facture> GetAllFacturesQueryable() =>
            _context.Factures
                .Include(f => f.Intervention)
                .AsQueryable();

        // ========== TECHNICIENS ========== 

        public IList<Technicien> GetTechniciens() =>
            _context.Techniciens
                .Where(t => t.IsActif)
                .OrderBy(t => t.Nom)
                .ToList();

        public IList<Technicien> GetTechniciensDisponibles() =>
            _context.Techniciens
                .Where(t => t.IsActif && t.Disponibilite == "Disponible")
                .OrderBy(t => t.Nom)
                .ToList();

        public Technicien? GetTechnicienById(int id) =>
            _context.Techniciens.FirstOrDefault(t => t.Id == id && t.IsActif);

        public Technicien? GetTechnicienByUserId(string userId) =>
            _context.Techniciens.FirstOrDefault(t => t.UserId == userId && t.IsActif);

        public Technicien AddTechnicien(Technicien technicien)
        {
            technicien.DateCreation = DateTime.UtcNow;
            technicien.DateMaj = DateTime.UtcNow;
            _context.Techniciens.Add(technicien);
            _context.SaveChanges();
            return technicien;
        }

        public Technicien? UpdateTechnicien(Technicien technicien)
        {
            var existing = _context.Techniciens.FirstOrDefault(t => t.Id == technicien.Id);
            if (existing == null) return null;

            existing.Nom = technicien.Nom;
            existing.Email = technicien.Email;
            existing.Telephone = technicien.Telephone;
            existing.Zone = technicien.Zone;
            existing.Disponibilite = technicien.Disponibilite;
            existing.IsActif = technicien.IsActif;
            existing.Competences = technicien.Competences;
            existing.UserId = technicien.UserId ?? existing.UserId;
            existing.DateMaj = DateTime.UtcNow;

            _context.SaveChanges();
            return existing;
        }

        public void DeleteTechnicien(int id)
        {
            var existing = _context.Techniciens.FirstOrDefault(t => t.Id == id);
            if (existing == null) return;
            _context.Techniciens.Remove(existing);
            _context.SaveChanges();
        }

        public Technicien? SetDisponibilite(int id, string disponibilite)
        {
            var existing = _context.Techniciens.FirstOrDefault(t => t.Id == id);
            if (existing == null) return null;
            existing.Disponibilite = disponibilite;
            existing.DateMaj = DateTime.UtcNow;
            _context.SaveChanges();
            return existing;
        }

        // ========== RECHERCHE AVANCÉE ==========

        public IQueryable<Intervention> AdvancedInterventionSearch(
            string searchTerm = null,
            int? reclamationId = null,
            int? technicienId = null,
            string statut = null,
            DateTime? dateDebut = null,
            DateTime? dateFin = null,
            bool? estGratuite = null,
            decimal? coutMin = null,
            decimal? coutMax = null,
            string sortBy = "date")
        {
            var query = _context.Interventions
                .Include(i => i.Facture)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(i => i.Description.Contains(searchTerm) ||
                                        i.Observations.Contains(searchTerm) ||
                                        i.SolutionApportee.Contains(searchTerm) ||
                                        i.TechnicienNom.Contains(searchTerm));
            }

            if (reclamationId.HasValue)
                query = query.Where(i => i.ReclamationId == reclamationId.Value);

            if (technicienId.HasValue)
                query = query.Where(i => i.TechnicienId == technicienId.Value);

            if (!string.IsNullOrEmpty(statut))
                query = query.Where(i => i.Statut == statut);

            if (dateDebut.HasValue)
                query = query.Where(i => i.DateIntervention >= dateDebut.Value);

            if (dateFin.HasValue)
                query = query.Where(i => i.DateIntervention <= dateFin.Value);

            if (estGratuite.HasValue)
                query = query.Where(i => i.EstGratuite == estGratuite.Value);

            if (coutMin.HasValue)
                query = query.Where(i => i.CoutTotal >= coutMin.Value);

            if (coutMax.HasValue)
                query = query.Where(i => i.CoutTotal <= coutMax.Value);

            switch (sortBy?.ToLower())
            {
                case "technicien":
                    query = query.OrderBy(i => i.TechnicienNom);
                    break;
                case "statut":
                    query = query.OrderBy(i => i.Statut);
                    break;
                case "cout":
                    query = query.OrderBy(i => i.CoutTotal);
                    break;
                case "cout-desc":
                    query = query.OrderByDescending(i => i.CoutTotal);
                    break;
                case "date-desc":
                    query = query.OrderByDescending(i => i.DateIntervention);
                    break;
                default:
                    query = query.OrderBy(i => i.DateIntervention);
                    break;
            }

            return query;
        }

        public IQueryable<Facture> AdvancedFactureSearch(
            string searchTerm = null,
            string numero = null,
            string clientNom = null,
            string statut = null,
            DateTime? dateDebut = null,
            DateTime? dateFin = null,
            decimal? montantMin = null,
            decimal? montantMax = null,
            string sortBy = "date")
        {
            var query = _context.Factures
                .Include(f => f.Intervention)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(f => f.NumeroFacture.Contains(searchTerm) ||
                                        f.ClientNom.Contains(searchTerm) ||
                                        f.ClientEmail.Contains(searchTerm) ||
                                        (f.DescriptionServices != null && f.DescriptionServices.Contains(searchTerm)));
            }

            if (!string.IsNullOrEmpty(numero))
                query = query.Where(f => f.NumeroFacture.Contains(numero));

            if (!string.IsNullOrEmpty(clientNom))
                query = query.Where(f => f.ClientNom.Contains(clientNom));

            if (!string.IsNullOrEmpty(statut))
                query = query.Where(f => f.Statut == statut);

            if (dateDebut.HasValue)
                query = query.Where(f => f.DateFacture >= dateDebut.Value);

            if (dateFin.HasValue)
                query = query.Where(f => f.DateFacture <= dateFin.Value);

            if (montantMin.HasValue)
                query = query.Where(f => f.MontantTTC >= montantMin.Value);

            if (montantMax.HasValue)
                query = query.Where(f => f.MontantTTC <= montantMax.Value);

            switch (sortBy?.ToLower())
            {
                case "numero":
                    query = query.OrderBy(f => f.NumeroFacture);
                    break;
                case "client":
                    query = query.OrderBy(f => f.ClientNom);
                    break;
                case "montant":
                    query = query.OrderBy(f => f.MontantTTC);
                    break;
                case "montant-desc":
                    query = query.OrderByDescending(f => f.MontantTTC);
                    break;
                case "statut":
                    query = query.OrderBy(f => f.Statut);
                    break;
                case "date-desc":
                    query = query.OrderByDescending(f => f.DateFacture);
                    break;
                default:
                    query = query.OrderBy(f => f.DateFacture);
                    break;
            }

            return query;
        }

        // ========== MÉTHODES UTILITAIRES ==========

        public bool InterventionExists(int id) =>
            _context.Interventions.Any(i => i.Id == id);

        public bool FactureExists(int id) =>
            _context.Factures.Any(f => f.Id == id);

        public bool TechnicienExists(int id) =>
            _context.Techniciens.Any(t => t.Id == id && t.IsActif);

        public int CountInterventions() =>
            _context.Interventions.Count();

        public int CountFactures() =>
            _context.Factures.Count();

        public int CountInterventionsByStatut(string statut) =>
            _context.Interventions.Count(i => i.Statut == statut);

        public int CountFacturesByStatut(string statut) =>
            _context.Factures.Count(f => f.Statut == statut);

        // ========== STATISTIQUES ==========

        public Dictionary<string, decimal> GetCoutMoyenParType()
        {
            var interventionsPayantes = _context.Interventions
                .Where(i => i.CoutTotal.HasValue && !i.EstGratuite)
                .ToList();

            return new Dictionary<string, decimal>
            {
                ["Moyenne Pièces"] = interventionsPayantes.Any() ?
                    interventionsPayantes.Average(i => i.CoutPieces ?? 0) : 0,
                ["Moyenne Main d'œuvre"] = interventionsPayantes.Any() ?
                    interventionsPayantes.Average(i => i.CoutMainOeuvre ?? 0) : 0,
                ["Moyenne Totale"] = interventionsPayantes.Any() ?
                    interventionsPayantes.Average(i => i.CoutTotal ?? 0) : 0
            };
        }

        public Dictionary<int, int> GetInterventionsParTechnicien()
        {
            return _context.Interventions
                .GroupBy(i => i.TechnicienId)
                .Select(g => new { TechnicienId = g.Key, Count = g.Count() })
                .ToDictionary(x => x.TechnicienId, x => x.Count);
        }

        public Dictionary<string, int> GetStatistiquesInterventions()
        {
            return new Dictionary<string, int>
            {
                ["Total"] = CountInterventions(),
                ["Planifiées"] = CountInterventionsByStatut("Planifiée"),
                ["En cours"] = CountInterventionsByStatut("En cours"),
                ["Terminées"] = CountInterventionsByStatut("Terminée"),
                ["Annulées"] = CountInterventionsByStatut("Annulée"),
                ["Gratuites"] = _context.Interventions.Count(i => i.EstGratuite),
                ["Payantes"] = _context.Interventions.Count(i => !i.EstGratuite),
                ["En retard"] = GetInterventionsEnRetard().Count,
                ["Sans facture"] = GetInterventionsSansFacture().Count
            };
        }

        public Dictionary<string, decimal> GetStatistiquesFinancieres()
        {
            var factures = _context.Factures.ToList();

            return new Dictionary<string, decimal>
            {
                ["Total Factures"] = CountFactures(),
                ["Total Montant HT"] = factures.Sum(f => f.MontantHT),
                ["Total Montant TTC"] = factures.Sum(f => f.MontantTTC),
                ["Total TVA"] = factures.Sum(f => f.MontantHT * f.TVA),
                ["Moyenne Facture"] = factures.Any() ? factures.Average(f => f.MontantTTC) : 0,
                ["Factures Payées"] = _context.Factures.Where(f => f.Statut == "Payée").Sum(f => f.MontantTTC),
                ["Factures Impayées"] = _context.Factures.Where(f => f.Statut == "Impayée").Sum(f => f.MontantTTC)
            };
        }

        // ========== AUTRES MÉTHODES MÉTIER ==========

        public string GenererNumeroFacture()
        {
            var maintenant = DateTime.Now;
            var count = _context.Factures
                .Count(f => f.DateFacture.Year == maintenant.Year &&
                           f.DateFacture.Month == maintenant.Month) + 1;

            return $"FACT-{maintenant:yyyyMM}-{count:D4}";
        }

        public Facture? CreerFacturePourIntervention(int interventionId)
        {
            var intervention = GetById(interventionId);
            if (intervention == null || intervention.EstGratuite || intervention.Facture != null)
                return null;

            // Utiliser les valeurs existantes ou par défaut
            var facture = new Facture
            {
                InterventionId = interventionId,
                NumeroFacture = GenererNumeroFacture(),
                DateFacture = DateTime.Now,
                ClientNom = "Client à renseigner",
                ClientAdresse = "Adresse à renseigner",
                ClientEmail = "email@example.com",
                MontantHT = intervention.CoutTotal ?? 0,
                TVA = 0.19m,
                Statut = "En attente",
                DescriptionServices = $"Intervention: {intervention.Description}\nSolution: {intervention.SolutionApportee ?? "Non spécifiée"}"
            };

            AddFacture(facture);
            return facture;
        }

        // ========== DTOs INTERNES ==========
    }

    // DTOs pour la communication inter-services
    public class ReclamationInfoDTO
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public int ArticleId { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public DateTime DateCreation { get; set; }
    }

    public class ArticleInfoDTO
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public decimal PrixAchat { get; set; }
        public bool EstSousGarantie { get; set; }
    }

    public class ClientInfoDTO
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Adresse { get; set; } = string.Empty;
        public string Telephone { get; set; } = string.Empty;
    }
}