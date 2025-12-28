namespace ReportingAPI.Models
{
    public class Report
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid InterventionId { get; set; }
        public Guid ClientId { get; set; }
        // Optional: link report to a technician (for technicien-specific reports)
        public Guid? TechnicianId { get; set; }
        public bool IsWarranty { get; set; }
        public decimal Total { get; set; }
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public string Url { get; set; } = string.Empty;
        public string? Title { get; set; }
    }
}
