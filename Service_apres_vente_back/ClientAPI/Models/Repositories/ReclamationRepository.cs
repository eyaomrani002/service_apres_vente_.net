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
            _context.Reclamations
                .Include(r => r.Client)
                .FirstOrDefault(r => r.Id == id);

        public IList<Reclamation> GetAllReclamations() =>
            _context.Reclamations
                .Include(r => r.Client)
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        public void AddReclamation(Reclamation reclamation)
        {
            // Initialiser les nouvelles propriétés si null
            reclamation.PhotosUrls ??= new List<string>();
            reclamation.PiecesNecessaires ??= new List<ReclamationPiece>();

            _context.Reclamations.Add(reclamation);
            _context.SaveChanges();
        }

        public Reclamation UpdateReclamation(Reclamation reclamation)
        {
            var existing = _context.Reclamations
                .Include(r => r.Client)
                .FirstOrDefault(r => r.Id == reclamation.Id);

            if (existing != null)
            {
                existing.Description = reclamation.Description;
                existing.Statut = reclamation.Statut;
                existing.DateResolution = reclamation.DateResolution;
                existing.ClientId = reclamation.ClientId;
                existing.ArticleId = reclamation.ArticleId;

                // Mettre à jour les nouvelles propriétés
                existing.Priorite = reclamation.Priorite;
                existing.TypeProbleme = reclamation.TypeProbleme;
                existing.PhotosUrls = reclamation.PhotosUrls ?? new List<string>();
                existing.PiecesNecessaires = reclamation.PiecesNecessaires ?? new List<ReclamationPiece>();

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
                .Include(r => r.Client)
                .Where(r => r.ClientId == clientId)
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        public IList<Reclamation> GetReclamationsByArticleId(int articleId) =>
            _context.Reclamations
                .Include(r => r.Client)
                .Where(r => r.ArticleId == articleId)
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        // ========== RECHERCHE ==========

        public IList<Reclamation> SearchReclamations(string searchTerm) =>
            _context.Reclamations
                .Include(r => r.Client)
                .Where(r => r.Description.Contains(searchTerm) ||
                           (r.Client != null && r.Client.Nom.Contains(searchTerm)))
                .OrderByDescending(r => r.DateCreation)
                .ToList();

        // ========== QUERYABLE POUR PAGINATION ==========

        public IQueryable<Reclamation> GetAllReclamationsQueryable() =>
            _context.Reclamations
                .Include(r => r.Client)
                .AsQueryable();

        public IQueryable<Reclamation> GetReclamationsByClientIdQueryable(int clientId) =>
            _context.Reclamations
                .Include(r => r.Client)
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
            var query = _context.Reclamations
                .Include(r => r.Client)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(r => r.Description.Contains(searchTerm) ||
                                        (r.Client != null && r.Client.Nom.Contains(searchTerm)));
            }

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
                    query = query.OrderBy(r => r.Client != null ? r.Client.Nom : "");
                    break;
                case "priorite":
                    query = query.OrderBy(r => r.Priorite);
                    break;
                case "type":
                    query = query.OrderBy(r => r.TypeProbleme);
                    break;
                case "dateCreation-desc":
                    query = query.OrderByDescending(r => r.DateCreation);
                    break;
                case "dateResolution":
                    query = query.OrderBy(r => r.DateResolution);
                    break;
                case "dateResolution-desc":
                    query = query.OrderByDescending(r => r.DateResolution);
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
                .Include(r => r.Client)
                .Where(r => r.Statut != "Résolu" && r.DateCreation < dateLimite)
                .OrderBy(r => r.DateCreation)
                .ToList();
        }

        public IList<Reclamation> GetReclamationsResolues() =>
            _context.Reclamations
                .Include(r => r.Client)
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
                ["En retard"] = GetReclamationsEnRetard().Count,

                // Nouvelles statistiques
                ["Basse"] = _context.Reclamations.Count(r => r.Priorite == "Basse"),
                ["Moyenne"] = _context.Reclamations.Count(r => r.Priorite == "Moyenne"),
                ["Haute"] = _context.Reclamations.Count(r => r.Priorite == "Haute"),
                ["Urgente"] = _context.Reclamations.Count(r => r.Priorite == "Urgente"),

                ["Avec photos"] = _context.Reclamations.Count(r =>
                    r.PhotosUrls != null && r.PhotosUrls.Any()),
                ["Avec pièces"] = _context.Reclamations.Count(r =>
                    r.PiecesNecessaires != null && r.PiecesNecessaires.Any())
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

        // ========== NOUVELLES MÉTHODES AJOUTÉES ==========

        public IList<Reclamation> GetReclamationsByPriorite(string priorite)
        {
            return _context.Reclamations
                .Include(r => r.Client)
                .Where(r => r.Priorite == priorite)
                .OrderByDescending(r => r.DateCreation)
                .ToList();
        }

        public IList<Reclamation> GetReclamationsByTypeProbleme(string typeProbleme)
        {
            return _context.Reclamations
                .Include(r => r.Client)
                .Where(r => r.TypeProbleme == typeProbleme)
                .OrderByDescending(r => r.DateCreation)
                .ToList();
        }

        public IList<Reclamation> GetReclamationsAvecPhotos()
        {
            return _context.Reclamations
                .Include(r => r.Client)
                .Where(r => r.PhotosUrls != null && r.PhotosUrls.Any())
                .OrderByDescending(r => r.DateCreation)
                .ToList();
        }

        public IList<Reclamation> GetReclamationsAvecPieces()
        {
            return _context.Reclamations
                .Include(r => r.Client)
                .Where(r => r.PiecesNecessaires != null && r.PiecesNecessaires.Any())
                .OrderByDescending(r => r.DateCreation)
                .ToList();
        }

        // ========== MÉTHODES POUR LES PIÈCES ==========

        public ReclamationPiece GetReclamationPieceById(int pieceId)
        {
            var reclamation = _context.Reclamations
                .Include(r => r.PiecesNecessaires)
                .FirstOrDefault(r => r.PiecesNecessaires != null &&
                                   r.PiecesNecessaires.Any(p => p.Id == pieceId));

            return reclamation?.PiecesNecessaires?.FirstOrDefault(p => p.Id == pieceId);
        }

        public bool UpdateReclamationPiece(ReclamationPiece piece)
        {
            var reclamation = _context.Reclamations
                .Include(r => r.PiecesNecessaires)
                .FirstOrDefault(r => r.Id == piece.ReclamationId);

            if (reclamation == null || reclamation.PiecesNecessaires == null)
                return false;

            var existingPiece = reclamation.PiecesNecessaires.FirstOrDefault(p => p.Id == piece.Id);
            if (existingPiece == null)
                return false;

            existingPiece.Reference = piece.Reference;
            existingPiece.Description = piece.Description;
            existingPiece.Quantite = piece.Quantite;
            existingPiece.Fournie = piece.Fournie;

            _context.SaveChanges();
            return true;
        }

        public bool DeleteReclamationPiece(int pieceId)
        {
            var reclamation = _context.Reclamations
                .Include(r => r.PiecesNecessaires)
                .FirstOrDefault(r => r.PiecesNecessaires != null &&
                                   r.PiecesNecessaires.Any(p => p.Id == pieceId));

            if (reclamation == null || reclamation.PiecesNecessaires == null)
                return false;

            var piece = reclamation.PiecesNecessaires.FirstOrDefault(p => p.Id == pieceId);
            if (piece == null)
                return false;

            reclamation.PiecesNecessaires.Remove(piece);

            // Si la liste est vide, la mettre à null
            if (!reclamation.PiecesNecessaires.Any())
                reclamation.PiecesNecessaires = null;

            _context.SaveChanges();
            return true;
        }

        // ========== MÉTHODES STATISTIQUES AVANCÉES ==========

        public Dictionary<string, object> GetDashboardStats()
        {
            var allReclamations = _context.Reclamations
                .Include(r => r.Client)
                .ToList();

            var maintenant = DateTime.Now;
            var ilYAMois = maintenant.AddMonths(-1);
            var ilYADeuxMois = maintenant.AddMonths(-2);

            return new Dictionary<string, object>
            {
                ["total"] = allReclamations.Count,
                ["enAttente"] = allReclamations.Count(r => r.Statut == "En attente"),
                ["enCours"] = allReclamations.Count(r => r.Statut == "En cours"),
                ["resolues"] = allReclamations.Count(r => r.Statut == "Résolu"),
                ["enRetard"] = allReclamations.Count(r => r.EnRetard),

                ["parPriorite"] = allReclamations
                    .GroupBy(r => r.Priorite)
                    .ToDictionary(g => g.Key, g => g.Count()),

                ["parType"] = allReclamations
                    .GroupBy(r => r.TypeProbleme)
                    .ToDictionary(g => g.Key, g => g.Count()),

                ["avecPhotos"] = allReclamations.Count(r =>
                    r.PhotosUrls != null && r.PhotosUrls.Any()),

                ["avecPieces"] = allReclamations.Count(r =>
                    r.PiecesNecessaires != null && r.PiecesNecessaires.Any()),

                ["evolutionMensuelle"] = new
                {
                    ceMois = allReclamations.Count(r => r.DateCreation >= ilYAMois),
                    moisPrecedent = allReclamations.Count(r =>
                        r.DateCreation >= ilYADeuxMois && r.DateCreation < ilYAMois),
                    variation = allReclamations.Count(r => r.DateCreation >= ilYAMois) -
                               allReclamations.Count(r =>
                                   r.DateCreation >= ilYADeuxMois && r.DateCreation < ilYAMois)
                },

                ["tempsMoyenResolution"] = allReclamations
                    .Where(r => r.DureeJours.HasValue)
                    .Select(r => r.DureeJours.Value)
                    .DefaultIfEmpty(0)
                    .Average(),

                ["topClients"] = allReclamations
                    .GroupBy(r => r.ClientId)
                    .Select(g => new
                    {
                        clientId = g.Key,
                        nomClient = g.First().Client?.Nom ?? "Inconnu",
                        nombreReclamations = g.Count(),
                        reclamationsEnCours = g.Count(r => r.Statut != "Résolu")
                    })
                    .OrderByDescending(x => x.nombreReclamations)
                    .Take(10)
                    .ToList()
            };
        }
    }
}