namespace CalendarAPI.Models
{
    public class Appointment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TechnicianId { get; set; }
        public DateTime StartUtc { get; set; }
        public DateTime EndUtc { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
