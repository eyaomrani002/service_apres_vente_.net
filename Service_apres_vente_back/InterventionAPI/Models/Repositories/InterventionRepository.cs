using Microsoft.EntityFrameworkCore;
using InterventionAPI.Data;
using InterventionAPI.Models;

namespace InterventionAPI.Models.Repositories
{
    public class InterventionRepository : IInterventionRepository
    {
        private readonly InterventionAPIContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<InterventionRepository> _logger;

        public InterventionRepository(
            InterventionAPIContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<InterventionRepository> logger)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
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

        // ========== MÉTHODES MÉTIER ==========

        public async Task<bool> VerifierGarantieArticle(int articleId)
        {
            try
            {
                // Appel au microservice ArticleAPI
                var response = await _httpClient.GetAsync($"http://articleapi/api/articles/{articleId}/garantie");
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<bool>();
                    return result;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la vérification de garantie pour l'article {articleId}");
                return false;
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

        public string GenererNumeroFacture()
        {
            var now = DateTime.Now;
            var count = _context.Factures
                .Count(f => f.DateFacture.Year == now.Year && f.DateFacture.Month == now.Month) + 1;

            return $"FACT-{now:yyyy}-{now:MM}-{count:D3}";
        }

        public Facture? CreerFacturePourIntervention(int interventionId)
        {
            var intervention = GetById(interventionId);
            if (intervention == null || intervention.EstGratuite || intervention.Facture != null)
                return null;

            // Récupérer les infos du client (appel à ClientAPI)
            // Pour l'instant, on utilise des valeurs par défaut
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
                DescriptionServices = $"Intervention: {intervention.Description}\nSolution: {intervention.SolutionApportee}"
            };

            AddFacture(facture);
            return facture;
        }
    }
}