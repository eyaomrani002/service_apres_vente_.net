using AuthAPI.Models;

namespace AuthAPI.Services
{
    public interface IAuthService
    {
        Task<AuthModel> RegisterAsync(RegisterModel model);
        Task<AuthModel> GetTokenAsync(TokenRequestModel model);
        Task<AuthModel> RefreshTokenAsync(RefreshTokenRequest model);
        Task<bool> LogoutAsync(string userId);
        Task<string> AddRoleAsync(AddRoleModel model);
        Task<string> CreateRoleAsync(string roleName);
        Task<ApplicationUser> GetUserByIdAsync(string userId);
        Task<List<string>> GetUserRolesAsync(string userId); // AJOUTEZ cette méthode
    }
}