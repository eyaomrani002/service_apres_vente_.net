using Microsoft.EntityFrameworkCore;
using ClientAPI.Data;
using ClientAPI.Models;

namespace ClientAPI.Models.Repositories
{
    public class ReclamationRepository : IReclamationRepository
    {
        private readonly ClientAPIContext _context;

        public ReclamationRepository(ClientAPIContext context) => _context = context;

        // ========== CRUD RECLAMATIONS ==========

        public Reclamation GetReclamationById(int id) =>
            _context.Reclamations.Find(id);

        public IList<Reclamation> GetAllReclamations() =>
            _context.Reclamations
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        public void AddReclamation(Reclamation reclamation)
        {
            _context.Reclamations.Add(reclamation);
            _context.SaveChanges();
        }

        public Reclamation UpdateReclamation(Reclamation reclamation)
        {
            var existing = _context.Reclamations.Find(reclamation.Id);
            if (existing != null)
            {
                existing.Description = reclamation.Description;
                existing.Statut = reclamation.Statut;
                existing.DateResolution = reclamation.DateResolution;
                existing.ClientId = reclamation.ClientId;
                existing.ArticleId = reclamation.ArticleId;
                _context.SaveChanges();
            }
            return existing;
        }

        public void DeleteReclamation(int id)
        {
            var reclamation = _context.Reclamations.Find(id);
            if (reclamation != null)
            {
                _context.Reclamations.Remove(reclamation);
                _context.SaveChanges();
            }
        }

        // ========== MÉTHODES SPÉCIFIQUES ==========

        public IList<Reclamation> GetReclamationsByClientId(int clientId) =>
            _context.Reclamations
                .Where(r => r.ClientId == clientId)
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        public IList<Reclamation> GetReclamationsByArticleId(int articleId) =>
            _context.Reclamations
                .Where(r => r.ArticleId == articleId)
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        // ========== RECHERCHE ==========

        public IList<Reclamation> SearchReclamations(string searchTerm) =>
            _context.Reclamations
                .Where(r => r.Description.Contains(searchTerm))
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        // ========== QUERYABLE POUR PAGINATION ==========

        public IQueryable<Reclamation> GetAllReclamationsQueryable() =>
            _context.Reclamations.AsQueryable();

        public IQueryable<Reclamation> GetReclamationsByClientIdQueryable(int clientId) =>
            _context.Reclamations
                .Where(r => r.ClientId == clientId)
                .AsQueryable();

        // ========== RECHERCHE AVANCÉE ==========

        public IQueryable<Reclamation> AdvancedReclamationSearch(
            string searchTerm = null,
            int? clientId = null,
            int? articleId = null,
            string statut = null,
            DateTime? dateDebut = null,
            DateTime? dateFin = null,
            string sortBy = "dateCreation")
        {
            var query = _context.Reclamations.AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
                query = query.Where(r => r.Description.Contains(searchTerm));

            if (clientId.HasValue)
                query = query.Where(r => r.ClientId == clientId.Value);

            if (articleId.HasValue)
                query = query.Where(r => r.ArticleId == articleId.Value);

            if (!string.IsNullOrEmpty(statut))
                query = query.Where(r => r.Statut == statut);

            if (dateDebut.HasValue)
                query = query.Where(r => r.DateCreation >= dateDebut.Value);

            if (dateFin.HasValue)
                query = query.Where(r => r.DateCreation <= dateFin.Value);

            switch (sortBy?.ToLower())
            {
                case "statut":
                    query = query.OrderBy(r => r.Statut);
                    break;
                case "client":
                    query = query.OrderBy(r => r.ClientId);
                    break;
                case "dateCreation-desc":
                    query = query.OrderByDescending(r => r.DateCreation);
                    break;
                default:
                    query = query.OrderBy(r => r.DateCreation);
                    break;
            }

            return query;
        }

        // ========== MÉTHODES UTILITAIRES ==========

        public bool ReclamationExists(int id) =>
            _context.Reclamations.Any(r => r.Id == id);

        public int CountReclamations() =>
            _context.Reclamations.Count();

        public int CountReclamationsByStatut(string statut) =>
            _context.Reclamations.Count(r => r.Statut == statut);

        public int CountReclamationsForClient(int clientId) =>
            _context.Reclamations.Count(r => r.ClientId == clientId);

        // ========== MÉTHODES MÉTIER ==========

        public IList<Reclamation> GetReclamationsEnRetard()
        {
            var dateLimite = DateTime.Now.AddDays(-7);
            return _context.Reclamations
                .Where(r => r.Statut != "Résolu" && r.DateCreation < dateLimite)
                .OrderBy(r => r.DateCreation)
                .ToList();
        }

        public IList<Reclamation> GetReclamationsResolues() =>
            _context.Reclamations
                .Where(r => r.Statut == "Résolu")
                .OrderByDescending(r => r.DateResolution)
                .ToList();

        public Dictionary<string, int> GetStatistiquesReclamations()
        {
            var stats = new Dictionary<string, int>
            {
                ["Total"] = _context.Reclamations.Count(),
                ["En attente"] = _context.Reclamations.Count(r => r.Statut == "En attente"),
                ["En cours"] = _context.Reclamations.Count(r => r.Statut == "En cours"),
                ["Résolues"] = _context.Reclamations.Count(r => r.Statut == "Résolu"),
                ["En retard"] = GetReclamationsEnRetard().Count
            };

            return stats;
        }

        // ========== MÉTHODES POUR LES JOINTURES ==========

        public Reclamation GetReclamationWithClient(int id) =>
            _context.Reclamations
                .Include(r => r.Client)
                .FirstOrDefault(r => r.Id == id);

        public IList<Reclamation> GetAllReclamationsWithClients() =>
            _context.Reclamations
                .Include(r => r.Client)
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        public int CountReclamationsByStatutForClient(int clientId, string statut) =>
        _context.Reclamations.Count(r => r.ClientId == clientId && r.Statut == statut);

        public DateTime? GetDerniereReclamationForClient(int clientId) =>
            _context.Reclamations
                .Where(r => r.ClientId == clientId)
                .OrderByDescending(r => r.DateCreation)
                .Select(r => (DateTime?)r.DateCreation)
                .FirstOrDefault();
    }

}