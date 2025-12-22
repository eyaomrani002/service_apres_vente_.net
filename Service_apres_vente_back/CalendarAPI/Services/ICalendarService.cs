using CalendarAPI.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CalendarAPI.Services
{
    public interface ICalendarService
    {
        Task<Appointment> ScheduleAsync(ScheduleRequest request);
        Task<bool> DeleteAsync(Guid id);
        Task<IReadOnlyList<Appointment>> GetAppointmentsAsync(Guid technicianId, DateTime dateUtc);
        Task<Appointment?> GetByIdAsync(Guid id);
    }
}
