using AuthAPI.Helpers;
using AuthAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace AuthAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly JWT _jwt;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IRefreshTokenService refreshTokenService,
            IOptions<JWT> jwt,
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<AuthService> logger,
            IHttpContextAccessor httpContextAccessor) // AJOUTER ce paramètre
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _refreshTokenService = refreshTokenService;
            _jwt = jwt.Value;
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor; // INITIALISER
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
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
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

            // Enregistrer l'audit de création
            await RecordLoginAudit(user, true, "Registration");

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

            // Vérifier les tentatives de connexion
            if (!await CheckLoginAttempts(model.Email))
            {
                authModel.Message = "Account is temporarily locked. Try again later.";
                return authModel;
            }

            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user is null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                // Enregistrer l'échec
                await RecordFailedLogin(model.Email, "Invalid credentials");

                // Mettre à jour le compteur dans l'utilisateur
                if (user != null)
                {
                    user.FailedLoginAttempts++;
                    if (user.FailedLoginAttempts >= 5)
                    {
                        user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                    }
                    await _userManager.UpdateAsync(user);
                    await RecordLoginAudit(user, false, "Invalid credentials");
                }

                authModel.Message = "Email or Password is incorrect!";
                return authModel;
            }

            // Vérifier si le compte est actif
            if (!user.IsActive)
            {
                authModel.Message = "Account is deactivated. Please contact administrator.";
                await RecordLoginAudit(user, false, "Account deactivated");
                return authModel;
            }

            // Vérifier si le compte est verrouillé
            if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            {
                authModel.Message = $"Account is locked until {user.LockoutEnd}";
                await RecordLoginAudit(user, false, "Account locked");
                return authModel;
            }

            // Réinitialiser les tentatives après succès
            await ResetLoginAttempts(model.Email);
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;

            // Enregistrer l'audit de connexion
            await RecordLoginAudit(user, true, "Login successful");

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
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    await RecordLoginAudit(user, true, "Logout");
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
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

        public async Task<List<string>> GetUserRolesAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return new List<string>();

            var roles = await _userManager.GetRolesAsync(user);
            return roles.ToList();
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

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key)),
                ValidateLifetime = false
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

        // ========== NOUVELLES MÉTHODES ==========

        public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordModel model)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            var result = await _userManager.ChangePasswordAsync(user, model.OldPassword, model.NewPassword);

            if (result.Succeeded)
            {
                user.LastPasswordChange = DateTime.UtcNow;
                user.PasswordChangeRequired = false;
                await _userManager.UpdateAsync(user);

                _logger.LogInformation($"Password changed for user: {user.Email}");
                await RecordLoginAudit(user, true, "Password changed");
                return true;
            }

            _logger.LogWarning($"Password change failed for user: {user.Email}");
            return false;
        }

        public async Task<bool> UpdateProfileAsync(string userId, UpdateProfileModel model)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.PhoneNumber = model.PhoneNumber;

            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                await RecordLoginAudit(user, true, "Profile updated");
            }

            return result.Succeeded;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !user.IsActive)
            {
                // Pour la sécurité, on ne révèle pas si l'utilisateur existe
                return true;
            }

            // Générer un token de réinitialisation
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // En production, vous enverriez un email ici
            // Pour le développement, on loggue le token
            _logger.LogInformation($"Reset password token for {user.Email}: {token}");
            await RecordLoginAudit(user, true, "Password reset requested");

            return true;
        }

        public async Task<bool> ResetPasswordConfirmAsync(ResetPasswordConfirmModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !user.IsActive)
                return false;

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);

            if (result.Succeeded)
            {
                user.LastPasswordChange = DateTime.UtcNow;
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;
                await _userManager.UpdateAsync(user);

                _logger.LogInformation($"Password reset successful for user: {user.Email}");
                await RecordLoginAudit(user, true, "Password reset successful");
                return true;
            }

            _logger.LogWarning($"Password reset failed for user: {user.Email}");
            return false;
        }

        public async Task<bool> ToggleUserStatusAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return false;

            user.IsActive = !user.IsActive;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                _logger.LogInformation($"User {user.Email} status changed to {(user.IsActive ? "active" : "inactive")}");
                await RecordLoginAudit(user, true, $"User status changed to {(user.IsActive ? "active" : "inactive")}");
            }

            return result.Succeeded;
        }

        public async Task<List<LoginAudit>> GetLoginAuditsAsync(string userId, int days = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-days);

            return await _context.LoginAudits
                .Where(a => a.UserId == userId && a.LoginTime >= cutoffDate)
                .OrderByDescending(a => a.LoginTime)
                .ToListAsync();
        }

        public async Task<Dictionary<string, object>> GetUserStatsAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return new Dictionary<string, object>();

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

            var stats = new Dictionary<string, object>
            {
                ["totalLogins"] = await _context.LoginAudits
                    .CountAsync(a => a.UserId == userId && a.Success),
                ["failedLogins"] = await _context.LoginAudits
                    .CountAsync(a => a.UserId == userId && !a.Success),
                ["recentLogins"] = await _context.LoginAudits
                    .CountAsync(a => a.UserId == userId && a.LoginTime >= thirtyDaysAgo),
                ["lastLogin"] = user.LastLoginAt,
                ["accountAge"] = (DateTime.UtcNow - user.CreatedAt).Days,
                ["passwordAge"] = user.LastPasswordChange.HasValue
                    ? (DateTime.UtcNow - user.LastPasswordChange.Value).Days
                    : (DateTime.UtcNow - user.CreatedAt).Days,
                ["isLocked"] = user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow
            };

            return stats;
        }

        public async Task<List<ApplicationUser>> GetAllUsersAsync(int page = 1, int pageSize = 20)
        {
            return await _userManager.Users
                .OrderBy(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> CountUsersAsync()
        {
            return await _userManager.Users.CountAsync();
        }

        // ========== MÉTHODES PRIVÉES ==========

        private async Task<bool> CheckLoginAttempts(string email)
        {
            var maxAttempts = _configuration.GetValue<int>("Auth:MaxLoginAttempts", 5);
            var lockoutMinutes = _configuration.GetValue<int>("Auth:LockoutMinutes", 15);

            var attempt = await _context.UserLoginAttempts
                .FirstOrDefaultAsync(a => a.Email == email);

            if (attempt == null)
            {
                attempt = new UserLoginAttempt { Email = email };
                _context.UserLoginAttempts.Add(attempt);
            }

            // Vérifier si le compte est verrouillé
            if (attempt.IsLockedOut)
            {
                _logger.LogWarning($"Account {email} is locked until {attempt.LockoutEnd}");
                return false;
            }

            // Vérifier si on doit réinitialiser le compteur
            var resetMinutes = _configuration.GetValue<int>("Auth:ResetAttemptsAfterMinutes", 30);
            if (attempt.LastAttempt < DateTime.UtcNow.AddMinutes(-resetMinutes))
            {
                attempt.FailedAttempts = 0;
            }

            attempt.LastAttempt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        private async Task RecordFailedLogin(string email, string reason = null)
        {
            var maxAttempts = _configuration.GetValue<int>("Auth:MaxLoginAttempts", 5);
            var lockoutMinutes = _configuration.GetValue<int>("Auth:LockoutMinutes", 15);

            var attempt = await _context.UserLoginAttempts
                .FirstOrDefaultAsync(a => a.Email == email);

            if (attempt == null)
            {
                attempt = new UserLoginAttempt { Email = email };
                _context.UserLoginAttempts.Add(attempt);
            }

            attempt.FailedAttempts++;
            attempt.LastAttempt = DateTime.UtcNow;

            // Verrouiller le compte si trop de tentatives
            if (attempt.FailedAttempts >= maxAttempts)
            {
                attempt.LockoutEnd = DateTime.UtcNow.AddMinutes(lockoutMinutes);
                _logger.LogWarning($"Account {email} locked for {lockoutMinutes} minutes");
            }

            await _context.SaveChangesAsync();
        }

        private async Task ResetLoginAttempts(string email)
        {
            var attempt = await _context.UserLoginAttempts
                .FirstOrDefaultAsync(a => a.Email == email);

            if (attempt != null)
            {
                attempt.FailedAttempts = 0;
                attempt.LockoutEnd = null;
                await _context.SaveChangesAsync();
            }
        }

        private async Task RecordLoginAudit(ApplicationUser user, bool success, string action, string failureReason = null)
        {
            try
            {
                var audit = new LoginAudit
                {
                    UserId = user.Id,
                    Username = user.UserName,
                    Email = user.Email,
                    LoginTime = DateTime.UtcNow,
                    IPAddress = GetClientIp(),
                    UserAgent = GetUserAgent(),
                    Success = success,
                    FailureReason = success ? null : failureReason
                };

                _context.LoginAudits.Add(audit);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to record login audit");
            }
        }

        private string GetClientIp()
        {
            try
            {
                return _httpContextAccessor?.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "Unknown";
            }
            catch
            {
                return "Unknown";
            }
        }

        private string GetUserAgent()
        {
            try
            {
                return _httpContextAccessor?.HttpContext?.Request?.Headers["User-Agent"].ToString() ?? "Unknown";
            }
            catch
            {
                return "Unknown";
            }
        }
    }
}