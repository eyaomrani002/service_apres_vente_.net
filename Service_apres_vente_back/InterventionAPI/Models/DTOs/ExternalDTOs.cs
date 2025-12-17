namespace InterventionAPI.Models.DTOs
{
    // DTOs pour la communication inter-services
    public class ReclamationInfoDTO
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public int ArticleId { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public DateTime DateCreation { get; set; }
        public string? Priorite { get; set; }
    }

    public class ArticleInfoDTO
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public decimal PrixAchat { get; set; }
        public bool EstSousGarantie { get; set; }
        public DateTime DateAchat { get; set; }
        public int DureeGarantieMois { get; set; }
    }

    public class ClientInfoDTO
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Adresse { get; set; } = string.Empty;
        public string Telephone { get; set; } = string.Empty;
    }
}