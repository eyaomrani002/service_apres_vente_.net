using Microsoft.AspNetCore.Mvc;
using ArticleAPI.Models;
using ArticleAPI.Models.Repositories;

namespace ArticleAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArticlesController : ControllerBase
    {
        private readonly IArticleRepository _repository;
        private readonly ILogger<ArticlesController> _logger;

        public ArticlesController(IArticleRepository repository, ILogger<ArticlesController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        // GET: api/articles
        [HttpGet]
        public ActionResult<IEnumerable<Article>> GetArticles()
        {
            try
            {
                var articles = _repository.GetAll();
                return Ok(articles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/articles");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/articles/5
        [HttpGet("{id}")]
        public ActionResult<Article> GetArticle(int id)
        {
            try
            {
                var article = _repository.GetById(id);
                if (article == null)
                    return NotFound();
                return Ok(article);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/articles/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/articles/type/Sanitaire
        [HttpGet("type/{type}")]
        public ActionResult<IEnumerable<Article>> GetByType(string type)
        {
            try
            {
                var articles = _repository.GetByType(type);
                return Ok(articles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/articles/type/{type}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/articles/search/SAN
        [HttpGet("search/{reference}")]
        public ActionResult<IEnumerable<Article>> Search(string reference)
        {
            try
            {
                var articles = _repository.FindByReference(reference);
                return Ok(articles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/articles/search/{reference}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/articles/advanced
        [HttpGet("advanced")]
        public ActionResult<IEnumerable<Article>> AdvancedSearch(
            [FromQuery] string searchTerm = null,
            [FromQuery] string type = null,
            [FromQuery] decimal? prixMin = null,
            [FromQuery] decimal? prixMax = null,
            [FromQuery] bool? enStock = null,
            [FromQuery] bool? sousGarantie = null,
            [FromQuery] string sortBy = "nom")
        {
            try
            {
                var query = _repository.AdvancedSearch(
                    searchTerm, type, prixMin, prixMax, enStock, sousGarantie, sortBy);
                var articles = query.ToList();
                return Ok(articles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/articles/advanced");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // POST: api/articles
        [HttpPost]
        public ActionResult<Article> CreateArticle(Article article)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Vérifier si la référence existe déjà
                if (_repository.ReferenceExists(article.Reference))
                    return BadRequest("Cette référence existe déjà");

                _repository.Add(article);
                return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, article);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de POST /api/articles");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // PUT: api/articles/5
        [HttpPut("{id}")]
        public IActionResult UpdateArticle(int id, Article article)
        {
            try
            {
                if (id != article.Id)
                    return BadRequest("ID mismatch");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var existing = _repository.GetById(id);
                if (existing == null)
                    return NotFound();

                // Vérifier si la référence a changé et si elle existe déjà
                if (existing.Reference != article.Reference && _repository.ReferenceExists(article.Reference))
                    return BadRequest("Cette référence existe déjà");

                var updated = _repository.Update(article);
                if (updated == null)
                    return NotFound();

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de PUT /api/articles/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // DELETE: api/articles/5
        [HttpDelete("{id}")]
        public IActionResult DeleteArticle(int id)
        {
            try
            {
                var article = _repository.GetById(id);
                if (article == null)
                    return NotFound();

                _repository.Delete(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de DELETE /api/articles/{id}");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/articles/stats
        [HttpGet("stats")]
        public ActionResult<object> GetStats()
        {
            try
            {
                var articles = _repository.GetAll();
                var stats = new
                {
                    Total = _repository.Count(),
                    Sanitaire = _repository.CountByType("Sanitaire"),
                    Chauffage = _repository.CountByType("Chauffage"),
                    EnStock = articles.Count(a => a.EstEnStock),
                    SousGarantie = articles.Count(a => a.EstSousGarantie),
                    PrixMoyen = articles.Any() ? articles.Average(a => a.PrixAchat) : 0,
                    PrixMax = articles.Any() ? articles.Max(a => a.PrixAchat) : 0,
                    PrixMin = articles.Any() ? articles.Min(a => a.PrixAchat) : 0
                };
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de GET /api/articles/stats");
                return StatusCode(500, "Erreur serveur");
            }
        }

        // GET: api/articles/5/garantie
        [HttpGet("{id}/garantie")]
        public ActionResult<bool> CheckGarantie(int id)
        {
            try
            {
                var article = _repository.GetById(id);
                if (article == null)
                    return NotFound();

                return Ok(article.EstSousGarantie);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de GET /api/articles/{id}/garantie");
                return StatusCode(500, "Erreur serveur");
            }
        }
    }
}