using CalendarAPI.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CalendarAPI.Services
{
    public class InMemoryCalendarService : ICalendarService
    {
        private readonly ConcurrentDictionary<Guid, Appointment> _store = new();

        public Task<Appointment> ScheduleAsync(ScheduleRequest request)
        {
            if (request.EndUtc <= request.StartUtc)
                throw new ArgumentException("EndUtc must be after StartUtc");

            var overlaps = _store.Values.Any(a => a.TechnicianId == request.TechnicianId &&
                !(request.EndUtc <= a.StartUtc || request.StartUtc >= a.EndUtc));

            if (overlaps)
                throw new InvalidOperationException("The technician is not available in the requested time range.");

            var appt = new Appointment
            {
                TechnicianId = request.TechnicianId,
                StartUtc = request.StartUtc,
                EndUtc = request.EndUtc,
                Title = request.Title,
                Notes = request.Notes
            };

            _store[appt.Id] = appt;
            return Task.FromResult(appt);
        }

        public Task<bool> DeleteAsync(Guid id)
        {
            return Task.FromResult(_store.TryRemove(id, out _));
        }

        public Task<IReadOnlyList<Appointment>> GetAppointmentsAsync(Guid technicianId, DateTime dateUtc)
        {
            var start = dateUtc.Date;
            var end = start.AddDays(1);
            var items = _store.Values
                .Where(a => a.TechnicianId == technicianId && a.StartUtc < end && a.EndUtc > start)
                .OrderBy(a => a.StartUtc)
                .ToList();
            return Task.FromResult((IReadOnlyList<Appointment>)items);
        }

        public Task<Appointment?> GetByIdAsync(Guid id)
        {
            _store.TryGetValue(id, out var appt);
            return Task.FromResult(appt);
        }
    }
}
