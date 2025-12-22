using ReportingAPI.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ReportingAPI.Services
{
    public class DummyReportingService : IReportingService
    {
        private readonly ConcurrentDictionary<Guid, ReportResponse> _store = new();

        public Task<ReportResponse> GenerateAsync(ReportRequest request)
        {
            var id = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var resp = new ReportResponse
            {
                ReportId = id,
                InterventionId = request.InterventionId,
                ClientId = request.ClientId,
                IsWarranty = request.IsWarranty,
                Total = request.Total,
                GeneratedAt = now,
                Url = $"https://reports.local/{id}"
            };

            _store[id] = resp;
            return Task.FromResult(resp);
        }

        public Task<ReportResponse?> GetAsync(Guid reportId)
        {
            _store.TryGetValue(reportId, out var resp);
            return Task.FromResult(resp);
        }

        public Task<IReadOnlyList<ReportResponse>> GetRecentAsync(int take = 50)
        {
            var list = _store.Values
                .OrderByDescending(r => r.GeneratedAt)
                .Take(take)
                .ToList();
            return Task.FromResult((IReadOnlyList<ReportResponse>)list);
        }
    }
}
