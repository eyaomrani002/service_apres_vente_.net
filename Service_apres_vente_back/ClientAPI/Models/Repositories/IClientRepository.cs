using System.Collections.Generic;
using System.Linq;

namespace ClientAPI.Models.Repositories
{
    public interface IClientRepository
    {
        // CRUD Clients
        Client GetClientById(int id);
        IList<Client> GetAllClients();
        void AddClient(Client client);
        Client UpdateClient(Client client);
        void DeleteClient(int id);

        // Méthodes de recherche
        Client GetClientByEmail(string email);
        IList<Client> SearchClients(string searchTerm);

        // Pour pagination et filtres
        IQueryable<Client> GetAllClientsQueryable();

        // Recherche avancée
        IQueryable<Client> AdvancedClientSearch(
            string searchTerm = null,
            string email = null,
            bool? avecReclamations = null,
            string sortBy = "nom");

        // Méthodes utilitaires
        bool ClientExists(int id);
        bool EmailExists(string email);
        int CountClients();

        // Méthodes spécifiques métier
        IList<Client> GetClientsAvecReclamations();
        int CountReclamationsForClient(int clientId);
        int CountReclamationsEnCoursForClient(int clientId);
        DateTime? GetDerniereReclamationForClient(int clientId);
    }
}