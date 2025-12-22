using System;
using System.Collections.Generic;

namespace CalendarAPI.Models.Repositories
{
    public interface IAppointmentRepository
    {
        Appointment GetById(Guid id);
        IList<Appointment> GetAll();
        void Add(Appointment appointment);
        Appointment Update(Appointment appointment);
        void Delete(Guid id);

        IList<Appointment> GetByTechnicianAndDate(Guid technicianId, DateTime dateUtc);
        bool Overlaps(Guid technicianId, DateTime startUtc, DateTime endUtc);
    }
}
