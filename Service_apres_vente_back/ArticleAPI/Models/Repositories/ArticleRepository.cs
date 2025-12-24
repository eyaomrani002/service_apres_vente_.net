using Microsoft.EntityFrameworkCore;
using ArticleAPI.Data;
using ArticleAPI.Models;

namespace ArticleAPI.Models.Repositories
{
    public class ArticleRepository : IArticleRepository
    {
        private readonly ArticleAPIContext _context;

        public ArticleRepository(ArticleAPIContext context) => _context = context;

        public Article GetById(int id) =>
            _context.Articles.Find(id);

        public IList<Article> GetAll() =>
            _context.Articles.OrderBy(a => a.Nom).ToList();

        public void Add(Article article)
        {
            _context.Articles.Add(article);
            _context.SaveChanges();
        }

        public Article Update(Article article)
        {
            var existing = _context.Articles.Find(article.Id);
            if (existing != null)
            {
                existing.Reference = article.Reference;
                existing.Nom = article.Nom;
                existing.Type = article.Type;
                existing.DateAchat = article.DateAchat;
                existing.DureeGarantieMois = article.DureeGarantieMois;
                existing.Description = article.Description;
                existing.PrixAchat = article.PrixAchat;
                existing.EstEnStock = article.EstEnStock;
                existing.ImageUrl = article.ImageUrl;
                _context.SaveChanges();
            }
            return existing;
        }

        public void Delete(int id)
        {
            var article = _context.Articles.Find(id);
            if (article != null)
            {
                _context.Articles.Remove(article);
                _context.SaveChanges();
            }
        }

        public IList<Article> GetByType(string type) =>
            _context.Articles
                .Where(a => a.Type == type)
                .OrderBy(a => a.Nom)
                .ToList();

        public IList<Article> FindByReference(string reference) =>
            _context.Articles
                .Where(a => a.Reference.Contains(reference))
                .OrderBy(a => a.Nom)
                .ToList();

        public IQueryable<Article> GetAllQueryable() =>
            _context.Articles.AsQueryable();

        public IQueryable<Article> GetByTypeQueryable(string type)
        {
            var query = _context.Articles.AsQueryable();
            if (!string.IsNullOrEmpty(type))
                query = query.Where(a => a.Type == type);
            return query;
        }

        public IQueryable<Article> AdvancedSearch(
            string searchTerm = null,
            string type = null,
            decimal? prixMin = null,
            decimal? prixMax = null,
            bool? enStock = null,
            bool? sousGarantie = null,
            string sortBy = "nom")
        {
            var query = _context.Articles.AsQueryable();

            // Filtre par terme de recherche
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(a =>
                    a.Reference.Contains(searchTerm) ||
                    a.Nom.Contains(searchTerm) ||
                    (a.Description != null && a.Description.Contains(searchTerm)));
            }

            // Filtre par type
            if (!string.IsNullOrEmpty(type))
                query = query.Where(a => a.Type == type);

            // Filtre par prix
            if (prixMin.HasValue)
                query = query.Where(a => a.PrixAchat >= prixMin.Value);
            if (prixMax.HasValue)
                query = query.Where(a => a.PrixAchat <= prixMax.Value);

            // Filtre par stock
            if (enStock.HasValue)
                query = query.Where(a => a.EstEnStock == enStock.Value);

            // Filtre par garantie
            if (sousGarantie.HasValue)
            {
                var maintenant = DateTime.Now;
                if (sousGarantie.Value)
                    query = query.Where(a => maintenant <= a.DateAchat.AddMonths(a.DureeGarantieMois));
                else
                    query = query.Where(a => maintenant > a.DateAchat.AddMonths(a.DureeGarantieMois));
            }

            // Tri
            switch (sortBy?.ToLower())
            {
                case "reference":
                    query = query.OrderBy(a => a.Reference);
                    break;
                case "reference-desc":
                    query = query.OrderByDescending(a => a.Reference);
                    break;
                case "prix-asc":
                    query = query.OrderBy(a => a.PrixAchat);
                    break;
                case "prix-desc":
                    query = query.OrderByDescending(a => a.PrixAchat);
                    break;
                case "date":
                    query = query.OrderBy(a => a.DateAchat);
                    break;
                case "date-desc":
                    query = query.OrderByDescending(a => a.DateAchat);
                    break;
                case "garantie":
                    query = query.OrderBy(a => a.FinGarantie);
                    break;
                case "garantie-desc":
                    query = query.OrderByDescending(a => a.FinGarantie);
                    break;
                case "nom-desc":
                    query = query.OrderByDescending(a => a.Nom);
                    break;
                default:
                    query = query.OrderBy(a => a.Nom);
                    break;
            }

            return query;
        }

        public bool ReferenceExists(string reference) =>
            _context.Articles.Any(a => a.Reference == reference);

        public int Count() =>
            _context.Articles.Count();

        public int CountByType(string type) =>
            _context.Articles.Count(a => a.Type == type);
    }
}