using System.ComponentModel.DataAnnotations;

namespace CalendarAPI.Models
{
    public class ScheduleRequest
    {
        [Required]
        public Guid TechnicianId { get; set; }

        [Required]
        public DateTime StartUtc { get; set; }

        [Required]
        public DateTime EndUtc { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Notes { get; set; }
    }
}
