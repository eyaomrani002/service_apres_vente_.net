using System;
using System.Collections.Generic;

namespace ReportingAPI.Models.Repositories
{
    public interface IReportRepository
    {
        Report GetById(Guid id);
        IList<Report> GetAll();
        void Add(Report report);
        Report Update(Report report);
        void Delete(Guid id);

        IList<Report> GetRecent(int take = 50);
        IList<Report> FindByClient(Guid clientId);
        IList<Report> FindByIntervention(Guid interventionId);
        IList<Report> FindByTechnician(Guid technicianId);
        IList<Report> GetMonthly(int year, int month);
        IList<Report> GetFinancial(int year, int month);
        IList<Report> GetComplete();
        IList<Report> GetAudit();
        // Export all data as a placeholder - implementation may return file stream or task
        bool ExportAll();
    }
}
