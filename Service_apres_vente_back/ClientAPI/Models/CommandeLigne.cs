using System.ComponentModel.DataAnnotations;

namespace ClientAPI.Models
{
    public class CommandeLigne
    {
        public int Id { get; set; }

        [Required]
        public int CommandeId { get; set; }

        [Required]
        public int ArticleId { get; set; }

        [Range(1, int.MaxValue)]
        public int Quantite { get; set; }

        [Range(0, double.MaxValue)]
        public decimal PrixUnitaire { get; set; }

        [Range(0, double.MaxValue)]
        public decimal MontantLigne { get; set; }

        public Commande Commande { get; set; }
    }
}
