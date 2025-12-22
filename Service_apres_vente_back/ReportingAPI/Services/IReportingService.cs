using ReportingAPI.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ReportingAPI.Services
{
    public interface IReportingService
    {
        Task<ReportResponse> GenerateAsync(ReportRequest request);
        Task<ReportResponse?> GetAsync(Guid reportId);
        Task<IReadOnlyList<ReportResponse>> GetRecentAsync(int take = 50);
    }
}
