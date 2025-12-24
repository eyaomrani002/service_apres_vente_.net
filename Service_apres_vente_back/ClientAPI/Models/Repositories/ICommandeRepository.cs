using ClientAPI.Models;

namespace ClientAPI.Models.Repositories
{
    public interface ICommandeRepository
    {
        IEnumerable<Commande> GetAll();
        Commande? GetById(int id);
        IEnumerable<Commande> GetByClientId(int clientId);
        Commande CreateWithLines(Commande commande, IEnumerable<CommandeLigne> lignes);
        Commande? UpdateStatut(int id, string statut);
    }
}
