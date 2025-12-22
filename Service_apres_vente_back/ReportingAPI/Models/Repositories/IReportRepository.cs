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
    }
}
