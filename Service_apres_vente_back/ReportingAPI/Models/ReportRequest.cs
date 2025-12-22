using System.ComponentModel.DataAnnotations;

namespace ReportingAPI.Models
{
    public class ReportRequest
    {
        [Required]
        public Guid InterventionId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        public bool IsWarranty { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Total { get; set; }
    }
}
