using ClientAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace ClientAPI.Models.Repositories
{
    public class CommandeRepository : ICommandeRepository
    {
        private readonly ClientAPIContext _context;

        public CommandeRepository(ClientAPIContext context)
        {
            _context = context;
        }

        public IEnumerable<Commande> GetAll()
        {
            return _context.Commandes
                .Include(c => c.Lignes)
                .AsNoTracking()
                .ToList();
        }

        public Commande? GetById(int id)
        {
            return _context.Commandes
                .Include(c => c.Lignes)
                .AsNoTracking()
                .FirstOrDefault(c => c.Id == id);
        }

        public IEnumerable<Commande> GetByClientId(int clientId)
        {
            return _context.Commandes
                .Include(c => c.Lignes)
                .Where(c => c.ClientId == clientId)
                .OrderByDescending(c => c.DateCreation)
                .AsNoTracking()
                .ToList();
        }

        public Commande CreateWithLines(Commande commande, IEnumerable<CommandeLigne> lignes)
        {
            var lignesList = lignes.ToList();
            foreach (var ligne in lignesList)
            {
                ligne.MontantLigne = ligne.PrixUnitaire * ligne.Quantite;
            }

            commande.Total = lignesList.Sum(l => l.MontantLigne);
            commande.Lignes = lignesList;

            _context.Commandes.Add(commande);
            _context.SaveChanges();
            return commande;
        }

        public Commande? UpdateStatut(int id, string statut)
        {
            var commande = _context.Commandes.FirstOrDefault(c => c.Id == id);
            if (commande == null) return null;

            commande.Statut = statut;
            _context.SaveChanges();
            return commande;
        }
    }
}
