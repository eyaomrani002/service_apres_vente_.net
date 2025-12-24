using System.ComponentModel.DataAnnotations;

namespace ClientAPI.Models
{
    public class Commande
    {
        public int Id { get; set; }

        [Required]
        public int ClientId { get; set; }

        [Required]
        [MaxLength(30)]
        public string Statut { get; set; } = "En attente";

        public DateTime DateCreation { get; set; } = DateTime.Now;

        [Range(0, double.MaxValue)]
        public decimal Total { get; set; }

        public ICollection<CommandeLigne> Lignes { get; set; } = new List<CommandeLigne>();

        public Client Client { get; set; }
    }
}
