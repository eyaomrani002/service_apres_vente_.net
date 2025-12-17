using System.Collections.Generic;
using System.Linq;

namespace ClientAPI.Models.Repositories
{
    public interface IReclamationRepository
    {
        // CRUD Reclamations
        Reclamation GetReclamationById(int id);
        IList<Reclamation> GetAllReclamations();
        void AddReclamation(Reclamation reclamation);
        Reclamation UpdateReclamation(Reclamation reclamation);
        void DeleteReclamation(int id);

        // Méthodes spécifiques
        IList<Reclamation> GetReclamationsByClientId(int clientId);
        IList<Reclamation> GetReclamationsByArticleId(int articleId);

        // Méthodes de recherche
        IList<Reclamation> SearchReclamations(string searchTerm);

        // Pour pagination et filtres
        IQueryable<Reclamation> GetAllReclamationsQueryable();
        IQueryable<Reclamation> GetReclamationsByClientIdQueryable(int clientId);

        // Recherche avancée
        IQueryable<Reclamation> AdvancedReclamationSearch(
            string searchTerm = null,
            int? clientId = null,
            int? articleId = null,
            string statut = null,
            DateTime? dateDebut = null,
            DateTime? dateFin = null,
            string sortBy = "dateCreation");

        // Méthodes utilitaires
        bool ReclamationExists(int id);
        int CountReclamations();
        int CountReclamationsByStatut(string statut);
        int CountReclamationsForClient(int clientId);

        // Méthodes spécifiques métier
        IList<Reclamation> GetReclamationsEnRetard();
        IList<Reclamation> GetReclamationsResolues();
        Dictionary<string, int> GetStatistiquesReclamations();

        // Méthodes pour les jointures
        Reclamation GetReclamationWithClient(int id);
        IList<Reclamation> GetAllReclamationsWithClients();

        // Nouvelles méthodes ajoutées
        int CountReclamationsByStatutForClient(int clientId, string statut);
        DateTime? GetDerniereReclamationForClient(int clientId);

        // Pour les nouvelles fonctionnalités
        IList<Reclamation> GetReclamationsByPriorite(string priorite);
        IList<Reclamation> GetReclamationsByTypeProbleme(string typeProbleme);
        IList<Reclamation> GetReclamationsAvecPhotos();
        IList<Reclamation> GetReclamationsAvecPieces();
    }
}