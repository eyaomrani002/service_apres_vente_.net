using Microsoft.EntityFrameworkCore;
using AuthAPI.Models;
using System.Security.Cryptography;

namespace AuthAPI.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public RefreshTokenService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<RefreshToken> GenerateRefreshToken(string userId)
        {
            var refreshToken = new RefreshToken
            {
                UserId = userId,
                Token = GenerateRandomToken(),
                CreatedOn = DateTime.UtcNow,
                ExpiresOn = DateTime.UtcNow.AddDays(Convert.ToInt32(_configuration["JWT:RefreshTokenDurationInDays"] ?? "7"))
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return refreshToken;
        }

        public async Task<RefreshToken> GetRefreshTokenByToken(string token)
        {
            return await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == token);
        }

        public async Task RevokeRefreshToken(string token, string replacedByToken = null)
        {
            var refreshToken = await GetRefreshTokenByToken(token);
            if (refreshToken != null)
            {
                refreshToken.RevokedOn = DateTime.UtcNow;
                refreshToken.ReplacedByToken = replacedByToken;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ValidateRefreshToken(string userId, string token)
        {
            var refreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt =>
                    rt.UserId == userId &&
                    rt.Token == token &&
                    rt.RevokedOn == null &&  // Remplace IsActive par cette vérification
                    rt.ExpiresOn > DateTime.UtcNow);  // Et celle-ci

            return refreshToken != null;
        }

        public async Task RevokeAllRefreshTokens(string userId)
        {
            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedOn == null)  // Remplace IsActive
                .ToListAsync();

            foreach (var token in refreshTokens)
            {
                token.RevokedOn = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<RefreshToken>> GetUserRefreshTokens(string userId)
        {
            return await _context.RefreshTokens
                .Where(rt => rt.UserId == userId)
                .OrderByDescending(rt => rt.CreatedOn)
                .ToListAsync();
        }

        private string GenerateRandomToken()
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
                return Convert.ToBase64String(randomBytes)
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .Replace("=", "");
            }
        }
    }
}