using AuthAPI.Models;

namespace AuthAPI.Services
{
    public interface IRefreshTokenService
    {
        Task<RefreshToken> GenerateRefreshToken(string userId);
        Task<RefreshToken> GetRefreshTokenByToken(string token);
        Task RevokeRefreshToken(string token, string replacedByToken = null);
        Task<bool> ValidateRefreshToken(string userId, string token);
        Task RevokeAllRefreshTokens(string userId);
        Task<List<RefreshToken>> GetUserRefreshTokens(string userId);
    }
}