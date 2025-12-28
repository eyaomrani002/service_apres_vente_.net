using System.Collections.Generic;
using System.Linq;
using InterventionAPI.Models;

namespace InterventionAPI.Models.Repositories
{
    public interface IInterventionRepository
    {
        // CRUD Interventions
        Intervention GetById(int id);
        IList<Intervention> GetAll();
        void Add(Intervention intervention);
        Intervention Update(Intervention intervention);
        void Delete(int id);
        
        // Création avec logique de garantie
        Task<Intervention> CreateInterventionAvecGarantie(Intervention intervention);

        // CRUD Factures
        Facture? GetFactureById(int id);
        Facture? GetFactureByInterventionId(int interventionId);
        Facture? GetFactureByNumero(string numero);
        IList<Facture> GetAllFactures();
        void AddFacture(Facture facture);
        Facture UpdateFacture(Facture facture);
        void DeleteFacture(int id);

        // Méthodes spécifiques
        IList<Intervention> GetByReclamationId(int reclamationId);
        IList<Intervention> GetByTechnicienId(int technicienId);
        IList<Intervention> GetByStatut(string statut);
        IList<Intervention> GetInterventionsGratuites();
        IList<Intervention> GetInterventionsPayantes();
        IList<Intervention> GetInterventionsEnRetard();
        IList<Intervention> GetInterventionsSansFacture();

        // Méthodes Factures
        IList<Facture> GetFacturesByStatut(string statut);
        IList<Facture> GetFacturesImpaye();
        IList<Facture> GetFacturesParPeriode(DateTime debut, DateTime fin);
        decimal GetTotalFacturesParPeriode(DateTime debut, DateTime fin);

        // Méthodes de recherche
        IList<Intervention> SearchInterventions(string searchTerm);
        IList<Facture> SearchFactures(string searchTerm);
        IQueryable<Intervention> GetAllInterventionsQueryable();
        IQueryable<Facture> GetAllFacturesQueryable();

        // Techniciens
        IList<Technicien> GetTechniciens();
        IList<Technicien> GetTechniciensDisponibles();
        Technicien? GetTechnicienById(int id);
        Technicien? GetTechnicienByUserId(string userId);
        Technicien AddTechnicien(Technicien technicien);
        Technicien? UpdateTechnicien(Technicien technicien);
        void DeleteTechnicien(int id);
        Technicien? SetDisponibilite(int id, string disponibilite);

        // Recherche avancée
        IQueryable<Intervention> AdvancedInterventionSearch(
            string searchTerm = null,
            int? reclamationId = null,
            int? technicienId = null,
            string statut = null,
            DateTime? dateDebut = null,
            DateTime? dateFin = null,
            bool? estGratuite = null,
            decimal? coutMin = null,
            decimal? coutMax = null,
            string sortBy = "date");

        IQueryable<Facture> AdvancedFactureSearch(
            string searchTerm = null,
            string numero = null,
            string clientNom = null,
            string statut = null,
            DateTime? dateDebut = null,
            DateTime? dateFin = null,
            decimal? montantMin = null,
            decimal? montantMax = null,
            string sortBy = "date");

        // Méthodes utilitaires
        bool InterventionExists(int id);
        bool FactureExists(int id);
        bool TechnicienExists(int id);
        int CountInterventions();
        int CountFactures();
        int CountInterventionsByStatut(string statut);
        int CountFacturesByStatut(string statut);

        // Statistiques
        Dictionary<string, decimal> GetCoutMoyenParType();
        Dictionary<int, int> GetInterventionsParTechnicien();
        Dictionary<string, int> GetStatistiquesInterventions();
        Dictionary<string, decimal> GetStatistiquesFinancieres();

        // Méthodes métier
        Task<decimal?> CalculerCoutIntervention(int reclamationId, bool articleSousGarantie);
        Task<bool> VerifierGarantieArticle(int articleId);
        string GenererNumeroFacture();
        Facture? CreerFacturePourIntervention(int interventionId);
    }
}