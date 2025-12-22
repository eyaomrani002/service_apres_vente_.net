using CalendarAPI.Data;

namespace CalendarAPI.Models.Repositories
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly CalendarAPIContext _context;

        public AppointmentRepository(CalendarAPIContext context) => _context = context;

        public void Add(Appointment appointment)
        {
            _context.Appointments.Add(appointment);
            _context.SaveChanges();
        }

        public void Delete(Guid id)
        {
            var item = _context.Appointments.Find(id);
            if (item != null)
            {
                _context.Appointments.Remove(item);
                _context.SaveChanges();
            }
        }

        public IList<Appointment> GetAll() =>
            _context.Appointments
                .OrderBy(a => a.StartUtc)
                .ToList();

        public Appointment GetById(Guid id) =>
            _context.Appointments.Find(id);

        public IList<Appointment> GetByTechnicianAndDate(Guid technicianId, DateTime dateUtc)
        {
            var start = dateUtc.Date;
            var end = start.AddDays(1);
            return _context.Appointments
                .Where(a => a.TechnicianId == technicianId && a.StartUtc < end && a.EndUtc > start)
                .OrderBy(a => a.StartUtc)
                .ToList();
        }

        public bool Overlaps(Guid technicianId, DateTime startUtc, DateTime endUtc)
        {
            return _context.Appointments.Any(a => a.TechnicianId == technicianId &&
                !(endUtc <= a.StartUtc || startUtc >= a.EndUtc));
        }

        public Appointment Update(Appointment appointment)
        {
            var existing = _context.Appointments.Find(appointment.Id);
            if (existing != null)
            {
                existing.TechnicianId = appointment.TechnicianId;
                existing.StartUtc = appointment.StartUtc;
                existing.EndUtc = appointment.EndUtc;
                existing.Title = appointment.Title;
                existing.Notes = appointment.Notes;
                _context.SaveChanges();
            }
            return existing;
        }
    }
}
