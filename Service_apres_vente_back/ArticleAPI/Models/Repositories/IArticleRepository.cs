using System.Collections.Generic;
using System.Linq;

namespace ArticleAPI.Models.Repositories
{
    public interface IArticleRepository
    {
        // CRUD basique
        Article GetById(int id);
        IList<Article> GetAll();
        void Add(Article article);
        Article Update(Article article);
        void Delete(int id);

        // Méthodes de recherche
        IList<Article> GetByType(string type);
        IList<Article> FindByReference(string reference);

        // Pour pagination et filtres
        IQueryable<Article> GetAllQueryable();
        IQueryable<Article> GetByTypeQueryable(string type);

        // Recherche avancée
        IQueryable<Article> AdvancedSearch(
            string searchTerm = null,
            string type = null,
            decimal? prixMin = null,
            decimal? prixMax = null,
            bool? enStock = null,
            bool? sousGarantie = null,
            string sortBy = "nom");

        // Méthodes utilitaires
        bool ReferenceExists(string reference);
        int Count();
        int CountByType(string type);
    }
}