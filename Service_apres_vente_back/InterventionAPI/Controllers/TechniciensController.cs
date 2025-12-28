using Microsoft.AspNetCore.Mvc;
using InterventionAPI.Models;
using InterventionAPI.Models.Repositories;

namespace InterventionAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TechniciensController : ControllerBase
    {
        private readonly IInterventionRepository _repository;
        private readonly ILogger<TechniciensController> _logger;

        public TechniciensController(IInterventionRepository repository, ILogger<TechniciensController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        // GET: api/techniciens
        [HttpGet]
        public ActionResult<IEnumerable<Technicien>> GetAll()
        {
            var list = _repository.GetTechniciens();
            return Ok(list);
        }

        // GET: api/techniciens/disponibles
        [HttpGet("disponibles")]
        public ActionResult<IEnumerable<Technicien>> GetDisponibles()
        {
            var list = _repository.GetTechniciensDisponibles();
            return Ok(list);
        }

        // GET: api/techniciens/5
        [HttpGet("{id}")]
        public ActionResult<Technicien> GetById(int id)
        {
            var technicien = _repository.GetTechnicienById(id);
            if (technicien == null) return NotFound();
            return Ok(technicien);
        }

        // POST: api/techniciens
        [HttpPost]
        public ActionResult<Technicien> Create([FromBody] Technicien technicien)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var created = _repository.AddTechnicien(technicien);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT: api/techniciens/5
        [HttpPut("{id}")]
        public ActionResult<Technicien> Update(int id, [FromBody] Technicien technicien)
        {
            if (id != technicien.Id) return BadRequest("ID mismatch");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var updated = _repository.UpdateTechnicien(technicien);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        // PUT: api/techniciens/5/disponibilite
        [HttpPut("{id}/disponibilite")]
        public ActionResult<Technicien> SetDisponibilite(int id, [FromBody] string disponibilite)
        {
            if (string.IsNullOrWhiteSpace(disponibilite)) return BadRequest("Disponibilité requise");
            var updated = _repository.SetDisponibilite(id, disponibilite);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        // DELETE: api/techniciens/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            if (!_repository.TechnicienExists(id)) return NotFound();
            _repository.DeleteTechnicien(id);
            return NoContent();
        }
    }
}
