using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using AuthAPI.Helpers;
using AuthAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;

namespace AuthAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly JWT _jwt;
        private readonly ApplicationDbContext _context;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IRefreshTokenService refreshTokenService,
            IOptions<JWT> jwt,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _refreshTokenService = refreshTokenService;
            _jwt = jwt.Value;
            _context = context;
        }

        public async Task<AuthModel> RegisterAsync(RegisterModel model)
        {
            if (await _userManager.FindByEmailAsync(model.Email) is not null)
                return new AuthModel { Message = "Email is already registered!" };

            if (await _userManager.FindByNameAsync(model.Username) is not null)
                return new AuthModel { Message = "Username is already registered!" };

            var user = new ApplicationUser
            {
                UserName = model.Username,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                EmailConfirmed = true // Pour faciliter les tests
            };

            var defaultRole = "Client";

            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return new AuthModel { Message = errors };
            }

            if (!await _roleManager.RoleExistsAsync(defaultRole))
            {
                await _roleManager.CreateAsync(new IdentityRole(defaultRole));
            }

            await _userManager.AddToRoleAsync(user, defaultRole);

            var jwtSecurityToken = await CreateJwtToken(user);
            var refreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);
            var rolesList = await _userManager.GetRolesAsync(user);

            // Mettre à jour la dernière connexion
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            return new AuthModel
            {
                Email = user.Email,
                TokenExpiration = jwtSecurityToken.ValidTo,
                IsAuthenticated = true,
                Roles = rolesList.ToList(),
                Token = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken),
                RefreshToken = refreshToken.Token,
                RefreshTokenExpiration = refreshToken.ExpiresOn,
                Username = user.UserName,
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Message = "Inscription réussie"
            };
        }

        public async Task<AuthModel> GetTokenAsync(TokenRequestModel model)
        {
            var authModel = new AuthModel();

            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user is null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                authModel.Message = "Email or Password is incorrect!";
                return authModel;
            }

            // Vérifier si l'utilisateur est actif
            if (!user.IsActive)
            {
                authModel.Message = "Account is deactivated. Please contact administrator.";
                return authModel;
            }

            var jwtSecurityToken = await CreateJwtToken(user);
            var refreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);
            var rolesList = await _userManager.GetRolesAsync(user);

            // Mettre à jour la dernière connexion
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            authModel.IsAuthenticated = true;
            authModel.Token = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
            authModel.RefreshToken = refreshToken.Token;
            authModel.Email = user.Email;
            authModel.Username = user.UserName;
            authModel.UserId = user.Id;
            authModel.FirstName = user.FirstName;
            authModel.LastName = user.LastName;
            authModel.TokenExpiration = jwtSecurityToken.ValidTo;
            authModel.RefreshTokenExpiration = refreshToken.ExpiresOn;
            authModel.Roles = rolesList.ToList();
            authModel.Message = "Connexion réussie";

            return authModel;
        }

        public async Task<AuthModel> RefreshTokenAsync(RefreshTokenRequest model)
        {
            var authModel = new AuthModel();

            try
            {
                // Valider le token JWT existant
                var principal = GetPrincipalFromExpiredToken(model.Token);
                if (principal == null)
                {
                    authModel.Message = "Invalid token";
                    return authModel;
                }

                var userId = principal.FindFirst("uid")?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    authModel.Message = "Invalid token";
                    return authModel;
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    authModel.Message = "User not found";
                    return authModel;
                }

                // Valider le refresh token
                var isValidRefreshToken = await _refreshTokenService.ValidateRefreshToken(userId, model.RefreshToken);
                if (!isValidRefreshToken)
                {
                    authModel.Message = "Invalid refresh token";
                    return authModel;
                }

                // Révoquer l'ancien refresh token
                var newRefreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);
                await _refreshTokenService.RevokeRefreshToken(model.RefreshToken, newRefreshToken.Token);

                // Générer un nouveau token JWT
                var newJwtToken = await CreateJwtToken(user);

                var rolesList = await _userManager.GetRolesAsync(user);

                authModel.IsAuthenticated = true;
                authModel.Token = new JwtSecurityTokenHandler().WriteToken(newJwtToken);
                authModel.RefreshToken = newRefreshToken.Token;
                authModel.Email = user.Email;
                authModel.Username = user.UserName;
                authModel.UserId = user.Id;
                authModel.FirstName = user.FirstName;
                authModel.LastName = user.LastName;
                authModel.TokenExpiration = newJwtToken.ValidTo;
                authModel.RefreshTokenExpiration = newRefreshToken.ExpiresOn;
                authModel.Roles = rolesList.ToList();
                authModel.Message = "Token refreshed successfully";

                return authModel;
            }
            catch (Exception ex)
            {
                authModel.Message = $"Error refreshing token: {ex.Message}";
                return authModel;
            }
        }

        public async Task<bool> LogoutAsync(string userId)
        {
            try
            {
                await _refreshTokenService.RevokeAllRefreshTokens(userId);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> AddRoleAsync(AddRoleModel model)
        {
            var user = await _userManager.FindByIdAsync(model.UserId);

            if (user is null)
                return "Invalid user ID";

            // Vérifier si le rôle existe, sinon le créer
            if (!await _roleManager.RoleExistsAsync(model.Role))
            {
                await _roleManager.CreateAsync(new IdentityRole(model.Role));
            }

            if (await _userManager.IsInRoleAsync(user, model.Role))
                return "User already assigned to this role";

            var result = await _userManager.AddToRoleAsync(user, model.Role);

            return result.Succeeded ? string.Empty : "Something went wrong";
        }

        public async Task<string> CreateRoleAsync(string roleName)
        {
            if (await _roleManager.RoleExistsAsync(roleName))
                return "Role already exists";

            var result = await _roleManager.CreateAsync(new IdentityRole(roleName));

            return result.Succeeded ? "Role created successfully" : "Failed to create role";
        }

        public async Task<ApplicationUser> GetUserByIdAsync(string userId)
        {
            return await _userManager.FindByIdAsync(userId);
        }

        private async Task<JwtSecurityToken> CreateJwtToken(ApplicationUser user)
        {
            var userClaims = await _userManager.GetClaimsAsync(user);
            var roles = await _userManager.GetRolesAsync(user);
            var roleClaims = new List<Claim>();

            foreach (var role in roles)
                roleClaims.Add(new Claim("roles", role));

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("uid", user.Id),
                new Claim("firstName", user.FirstName),
                new Claim("lastName", user.LastName)
            }
            .Union(userClaims)
            .Union(roleClaims);

            var symmetricSecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
            var signingCredentials = new SigningCredentials(symmetricSecurityKey, SecurityAlgorithms.HmacSha256);

            var jwtSecurityToken = new JwtSecurityToken(
                issuer: _jwt.Issuer,
                audience: _jwt.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwt.DurationInMinutes),
                signingCredentials: signingCredentials);

            return jwtSecurityToken;
        }
        // Ajoutez cette méthode dans la classe AuthService
        public async Task<List<string>> GetUserRolesAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return new List<string>();

            var roles = await _userManager.GetRolesAsync(user);
            return roles.ToList();
        }
        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key)),
                ValidateLifetime = false // Important : on ignore l'expiration ici
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

                if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                    throw new SecurityTokenException("Invalid token");

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}