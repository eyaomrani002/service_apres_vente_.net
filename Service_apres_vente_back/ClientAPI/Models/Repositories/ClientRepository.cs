using Microsoft.EntityFrameworkCore;
using ClientAPI.Data;
using ClientAPI.Models;

namespace ClientAPI.Models.Repositories
{
    public class ClientRepository : IClientRepository
    {
        private readonly ClientAPIContext _context;

        public ClientRepository(ClientAPIContext context) => _context = context;

        // ========== CRUD CLIENTS ==========

        public Client GetClientById(int id) =>
            _context.Clients.Find(id);

        public IList<Client> GetAllClients() =>
            _context.Clients.OrderBy(c => c.Nom).ToList();

        public void AddClient(Client client)
        {
            _context.Clients.Add(client);
            _context.SaveChanges();
        }

        public Client UpdateClient(Client client)
        {
            var existing = _context.Clients.Find(client.Id);
            if (existing != null)
            {
                existing.Nom = client.Nom;
                existing.Email = client.Email;
                existing.Telephone = client.Telephone;
                existing.Adresse = client.Adresse;
                _context.SaveChanges();
            }
            return existing;
        }

        public void DeleteClient(int id)
        {
            var client = _context.Clients.Find(id);
            if (client != null)
            {
                _context.Clients.Remove(client);
                _context.SaveChanges();
            }
        }

        // ========== RECHERCHE ==========

        public Client GetClientByEmail(string email) =>
            _context.Clients.FirstOrDefault(c => c.Email == email);

        public IList<Client> SearchClients(string searchTerm) =>
            _context.Clients
                .Where(c => c.Nom.Contains(searchTerm) ||
                           c.Email.Contains(searchTerm) ||
                           (c.Telephone != null && c.Telephone.Contains(searchTerm)))
                .OrderBy(c => c.Nom)
                .ToList();

        // ========== QUERYABLE POUR PAGINATION ==========

        public IQueryable<Client> GetAllClientsQueryable() =>
            _context.Clients.AsQueryable();

        // ========== RECHERCHE AVANCÉE ==========

        public IQueryable<Client> AdvancedClientSearch(
            string searchTerm = null,
            string email = null,
            bool? avecReclamations = null,
            string sortBy = "nom")
        {
            var query = _context.Clients.AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(c => c.Nom.Contains(searchTerm) ||
                                        c.Email.Contains(searchTerm) ||
                                        (c.Telephone != null && c.Telephone.Contains(searchTerm)));
            }

            if (!string.IsNullOrEmpty(email))
                query = query.Where(c => c.Email == email);

            if (avecReclamations.HasValue)
            {
                if (avecReclamations.Value)
                    query = query.Where(c => _context.Reclamations.Any(r => r.ClientId == c.Id));
                else
                    query = query.Where(c => !_context.Reclamations.Any(r => r.ClientId == c.Id));
            }

            switch (sortBy?.ToLower())
            {
                case "date":
                    query = query.OrderBy(c => c.DateInscription);
                    break;
                case "date-desc":
                    query = query.OrderByDescending(c => c.DateInscription);
                    break;
                case "nom-desc":
                    query = query.OrderByDescending(c => c.Nom);
                    break;
                default:
                    query = query.OrderBy(c => c.Nom);
                    break;
            }

            return query;
        }

        // ========== MÉTHODES UTILITAIRES ==========

        public bool ClientExists(int id) =>
            _context.Clients.Any(c => c.Id == id);

        public bool EmailExists(string email) =>
            _context.Clients.Any(c => c.Email == email);

        public int CountClients() =>
            _context.Clients.Count();

        // ========== MÉTHODES MÉTIER ==========

        public IList<Client> GetClientsAvecReclamations() =>
            _context.Clients
                .Where(c => _context.Reclamations.Any(r => r.ClientId == c.Id))
                .OrderByDescending(c => _context.Reclamations.Count(r => r.ClientId == c.Id))
                .ToList();

        public int CountReclamationsForClient(int clientId) =>
            _context.Reclamations.Count(r => r.ClientId == clientId);

        public int CountReclamationsEnCoursForClient(int clientId) =>
            _context.Reclamations.Count(r => r.ClientId == clientId && r.Statut == "En cours");

        public DateTime? GetDerniereReclamationForClient(int clientId) =>
            _context.Reclamations
                .Where(r => r.ClientId == clientId)
                .Max(r => (DateTime?)r.DateCreation);
    }
}