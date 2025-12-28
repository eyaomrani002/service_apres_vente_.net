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

        public IList<Report> FindByTechnician(Guid technicianId) =>
            _context.Reports
                .Where(r => r.TechnicianId == technicianId)
                .OrderByDescending(r => r.GeneratedAt)
                .ToList();

        public IList<Report> GetMonthly(int year, int month)
        {
            var start = new DateTime(year, month, 1);
            var end = start.AddMonths(1);
            return _context.Reports
                .Where(r => r.GeneratedAt >= start && r.GeneratedAt < end)
                .OrderByDescending(r => r.GeneratedAt)
                .ToList();
        }

        public IList<Report> GetFinancial(int year, int month)
        {
            // Simple stub: reuse GetMonthly for now; real implementation would aggregate financials
            return GetMonthly(year, month);
        }

        public IList<Report> GetComplete() => GetAll();

        public IList<Report> GetAudit()
        {
            // Stub: return recent reports as an "audit" feed
            return _context.Reports
                .OrderByDescending(r => r.GeneratedAt)
                .Take(200)
                .ToList();
        }

        public bool ExportAll()
        {
            // Stub: in real system, enqueue export job or stream file
            try
            {
                // No-op for now
                return true;
            }
            catch
            {
                return false;
            }
        }

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
