using Microsoft.EntityFrameworkCore;
using ReportingAPI.Data;

namespace ReportingAPI.Models.Repositories
{
    public class ReportRepository : IReportRepository
    {
        private readonly ReportingAPIContext _context;

        public ReportRepository(ReportingAPIContext context) => _context = context;

        public void Add(Report report)
        {
            _context.Reports.Add(report);
            _context.SaveChanges();
        }

        public void Delete(Guid id)
        {
            var item = _context.Reports.Find(id);
            if (item != null)
            {
                _context.Reports.Remove(item);
                _context.SaveChanges();
            }
        }

        public IList<Report> FindByClient(Guid clientId) =>
            _context.Reports
                .Where(r => r.ClientId == clientId)
                .OrderByDescending(r => r.GeneratedAt)
                .ToList();

        public IList<Report> FindByIntervention(Guid interventionId) =>
            _context.Reports
                .Where(r => r.InterventionId == interventionId)
                .OrderByDescending(r => r.GeneratedAt)
                .ToList();

        public IList<Report> GetAll() =>
            _context.Reports
                .OrderByDescending(r => r.GeneratedAt)
                .ToList();

        public Report GetById(Guid id) =>
            _context.Reports.Find(id);

        public IList<Report> GetRecent(int take = 50) =>
            _context.Reports
                .OrderByDescending(r => r.GeneratedAt)
                .Take(take)
                .ToList();

        public Report Update(Report report)
        {
            var existing = _context.Reports.Find(report.Id);
            if (existing != null)
            {
                existing.Title = report.Title;
                existing.Url = report.Url;
                existing.Total = report.Total;
                existing.IsWarranty = report.IsWarranty;
                existing.ClientId = report.ClientId;
                existing.InterventionId = report.InterventionId;
                _context.SaveChanges();
            }
            return existing;
        }
    }
}
