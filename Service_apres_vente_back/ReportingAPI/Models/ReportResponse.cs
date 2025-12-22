namespace ReportingAPI.Models
{
    public class ReportResponse
    {
        public Guid ReportId { get; set; }
        public Guid InterventionId { get; set; }
        public Guid ClientId { get; set; }
        public bool IsWarranty { get; set; }
        public decimal Total { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string Url { get; set; } = string.Empty; // Fake URL to fetch the PDF/file
    }
}
