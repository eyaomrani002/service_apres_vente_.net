using System;

namespace ReportingAPI.Models.DTOs
{
    public class ReportDto
    {
        public Guid Id { get; set; }
        public Guid? InterventionId { get; set; }
        public Guid? ClientId { get; set; }
        public Guid? TechnicianId { get; set; }
        public bool? IsWarranty { get; set; }
        public decimal? Total { get; set; }
        public DateTime? GeneratedAt { get; set; }
        public string Url { get; set; }
        public string Title { get; set; }
        // Infos client enrichies
        public string ClientNom { get; set; }
        public string ClientEmail { get; set; }
        public string ClientTelephone { get; set; }
        // Infos intervention enrichies (exemple)
        public string InterventionTitre { get; set; }
        public DateTime? InterventionDate { get; set; }
    }
}