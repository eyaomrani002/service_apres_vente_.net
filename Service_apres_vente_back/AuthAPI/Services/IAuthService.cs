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
        Task<List<string>> GetUserRolesAsync(string userId);

        // Nouvelles méthodes
        Task<bool> ChangePasswordAsync(string userId, ChangePasswordModel model);
        Task<bool> UpdateProfileAsync(string userId, UpdateProfileModel model);
        Task<bool> ResetPasswordAsync(ResetPasswordModel model);
        Task<bool> ResetPasswordConfirmAsync(ResetPasswordConfirmModel model);
        Task<bool> ToggleUserStatusAsync(string userId);
        Task<List<LoginAudit>> GetLoginAuditsAsync(string userId, int days = 30);
        Task<Dictionary<string, object>> GetUserStatsAsync(string userId);
        Task<List<ApplicationUser>> GetAllUsersAsync(int page = 1, int pageSize = 20);
        Task<int> CountUsersAsync();
    }
}