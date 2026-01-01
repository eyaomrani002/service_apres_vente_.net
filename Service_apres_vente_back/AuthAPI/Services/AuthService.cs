using AuthAPI.Helpers;
using AuthAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using System.Collections.Concurrent;

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
        private readonly IHttpClientFactory _httpClientFactory;

        // Circuit breaker pour éviter les appels répétés en cas d'échec
        private static readonly ConcurrentDictionary<string, DateTime> _syncFailures = new();
        private static readonly TimeSpan _syncFailureCooldown = TimeSpan.FromMinutes(5);

        public AuthService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IRefreshTokenService refreshTokenService,
            IOptions<JWT> jwt,
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<AuthService> logger,
            IHttpContextAccessor httpContextAccessor,
            IHttpClientFactory httpClientFactory)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _refreshTokenService = refreshTokenService;
            _jwt = jwt.Value;
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _httpClientFactory = httpClientFactory;
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

            // Synchronisation améliorée avec circuit breaker
            var syncEnabled = _configuration.GetValue<bool>("ClientSync:Enabled", true);
            if (syncEnabled)
            {
                // Execute synchronously during registration to ensure the client profile is created immediately.
                try
                {
                    var success = await SyncClientWithClientAPI(user);
                    if (!success) await EnsureClientProfileAsync(user);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erreur lors de la synchronisation client pendant l'inscription pour {Email}", user.Email);
                }
            }

            var jwtSecurityToken = await CreateJwtToken(user);
            var refreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);
            var rolesList = await _userManager.GetRolesAsync(user);

            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

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

            if (!await CheckLoginAttempts(model.Email))
            {
                authModel.Message = "Account is temporarily locked. Try again later.";
                return authModel;
            }

            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user is null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                await RecordFailedLogin(model.Email, "Invalid credentials");

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

            if (!user.IsActive)
            {
                authModel.Message = "Account is deactivated. Please contact administrator.";
                await RecordLoginAudit(user, false, "Account deactivated");
                return authModel;
            }

            if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            {
                authModel.Message = $"Account is locked until {user.LockoutEnd}";
                await RecordLoginAudit(user, false, "Account locked");
                return authModel;
            }

            await ResetLoginAttempts(model.Email);
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;

            await RecordLoginAudit(user, true, "Login successful");

            // Synchronisation en arrière-plan
            var syncEnabled = _configuration.GetValue<bool>("ClientSync:Enabled", true);
            if (syncEnabled)
            {
                _ = Task.Run(async () => await EnsureClientProfileAsync(user));
            }

            var jwtSecurityToken = await CreateJwtToken(user);
            var refreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);
            var rolesList = await _userManager.GetRolesAsync(user);

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

                var isValidRefreshToken = await _refreshTokenService.ValidateRefreshToken(userId, model.RefreshToken);
                if (!isValidRefreshToken)
                {
                    authModel.Message = "Invalid refresh token";
                    return authModel;
                }

                var newRefreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);
                await _refreshTokenService.RevokeRefreshToken(model.RefreshToken, newRefreshToken.Token);

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

            if (!await _roleManager.RoleExistsAsync(model.Role))
            {
                await _roleManager.CreateAsync(new IdentityRole(model.Role));
            }

            if (await _userManager.IsInRoleAsync(user, model.Role))
                return "User already assigned to this role";

            var result = await _userManager.AddToRoleAsync(user, model.Role);

            // Si on ajoute le rôle Client, synchroniser avec ClientAPI
            if (result.Succeeded && model.Role == "Client")
            {
                var syncEnabled = _configuration.GetValue<bool>("ClientSync:Enabled", true);
                if (syncEnabled)
                {
                    _ = Task.Run(async () => await EnsureClientProfileAsync(user));
                }
            }

            return result.Succeeded ? string.Empty : "Something went wrong";
        }

        public async Task<string> RemoveRoleAsync(AddRoleModel model)
        {
            var user = await _userManager.FindByIdAsync(model.UserId);

            if (user is null)
                return "Invalid user ID";

            if (!await _roleManager.RoleExistsAsync(model.Role))
                return "Role does not exist";

            if (!await _userManager.IsInRoleAsync(user, model.Role))
                return "User is not assigned to this role";

            var result = await _userManager.RemoveFromRoleAsync(user, model.Role);

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
            {
                // Add multiple claim types for compatibility with different consumers
                roleClaims.Add(new Claim(ClaimTypes.Role, role));
                roleClaims.Add(new Claim("role", role));
                roleClaims.Add(new Claim("roles", role));
            }

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("uid", user.Id),
                new Claim("firstName", user.FirstName),
                new Claim("lastName", user.LastName)
            };

            if (user.TechnicienId.HasValue)
            {
                claims.Add(new Claim("technicienId", user.TechnicienId.Value.ToString()));
            }

            claims = claims
                .Union(userClaims)
                .Union(roleClaims)
                .ToList();

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

                // Synchroniser avec ClientAPI si c'est un client
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("Client"))
                {
                    var syncEnabled = _configuration.GetValue<bool>("ClientSync:Enabled", true);
                    if (syncEnabled)
                    {
                        _ = Task.Run(async () => await UpdateClientProfileAsync(user));
                    }
                }
            }

            return result.Succeeded;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !user.IsActive)
            {
                return true;
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

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
    // ========== NOUVELLE MÉTHODE SIMPLIFIÉE (à utiliser) ==========
    private async Task<bool> SyncClientWithClientAPI(ApplicationUser user)
    {
        try
        {
            _logger.LogInformation("🔧 [NEW] Starting client sync for {Email}", user.Email);
            
            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Contains("Client"))
            {
                _logger.LogDebug("User {Email} doesn't have Client role, skipping sync", user.Email);
                return false;
            }

            var gatewayBaseUrl = _configuration["GatewayBaseUrl"] ?? "https://localhost:7076";
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(15);

            var encodedEmail = Uri.EscapeDataString(user.Email ?? string.Empty);
            
            // Étape 1: Vérifier si le client existe déjà
            var checkUrl = $"{gatewayBaseUrl}/apigateway/internal/clients/email/{encodedEmail}";
            var checkResponse = await httpClient.GetAsync(checkUrl);
            
            if (checkResponse.IsSuccessStatusCode)
            {
                _logger.LogInformation("✅ [NEW] Client {Email} already exists in ClientAPI", user.Email);
                return true;
            }

            // Étape 2: Créer le client
            var createUrl = $"{gatewayBaseUrl}/apigateway/internal/clients";
            var payload = new
            {
                Nom = $"{user.FirstName} {user.LastName}".Trim(),
                Email = user.Email,
                Telephone = user.PhoneNumber ?? string.Empty,
                Adresse = string.Empty,
                DateInscription = DateTime.Now
            };

            _logger.LogInformation("[NEW] Creating client {Email} via Gateway", user.Email);
            var createResponse = await httpClient.PostAsJsonAsync(createUrl, payload);

            if (createResponse.IsSuccessStatusCode)
            {
                _logger.LogInformation("✅ [NEW] Successfully created client {Email} in ClientAPI", user.Email);
                return true;
            }
            else
            {
                var errorContent = await createResponse.Content.ReadAsStringAsync();
                _logger.LogError("❌ [NEW] Failed to create client {Email}: {StatusCode} - {Error}", 
                    user.Email, createResponse.StatusCode, errorContent);
                
                // Fallback: essayer l'ancienne méthode
                _logger.LogWarning("⚠️ Falling back to old method for {Email}", user.Email);
                await EnsureClientProfileAsync(user);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [NEW] Error syncing client {Email} with ClientAPI", user.Email);
            
            // Fallback: essayer l'ancienne méthode
            _logger.LogWarning("⚠️ Falling back to old method after exception for {Email}", user.Email);
            await EnsureClientProfileAsync(user);
            return false;
        }
    }
        // ========== SYNCHRONISATION AVEC CLIENTAPI (AMÉLIORÉE) ==========

        private async Task EnsureClientProfileAsync(ApplicationUser user)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Vérifier le circuit breaker
            if (_syncFailures.TryGetValue(user.Email, out var lastFailure) &&
                DateTime.UtcNow - lastFailure < _syncFailureCooldown)
            {
                _logger.LogDebug("Synchronisation ignorée pour {Email} (échec récent)", user.Email);
                return;
            }

            try
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (!roles.Contains("Client"))
                {
                    _logger.LogDebug("Utilisateur {Email} n'a pas le rôle Client, synchronisation ignorée", user.Email);
                    return;
                }

                var gatewayBaseUrl = _configuration["GatewayBaseUrl"];
                if (string.IsNullOrWhiteSpace(gatewayBaseUrl))
                {
                    gatewayBaseUrl = "https://localhost:7076";
                    _logger.LogDebug("GatewayBaseUrl non configuré, utilisation de {BaseUrl}", gatewayBaseUrl);
                }

                var clientApiBaseUrl = _configuration["ClientApiBaseUrl"];
                if (string.IsNullOrWhiteSpace(clientApiBaseUrl))
                {
                    clientApiBaseUrl = "https://localhost:7025";
                    _logger.LogDebug("ClientApiBaseUrl non configuré, utilisation de {BaseUrl}", clientApiBaseUrl);
                }

                var maxRetries = _configuration.GetValue<int>("ClientSync:MaxRetries", 3);
                var timeoutSeconds = _configuration.GetValue<int>("ClientSync:TimeoutSeconds", 15);

                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);

                var encodedEmail = Uri.EscapeDataString(user.Email ?? string.Empty);

                // Configuration des endpoints selon la priorité Ocelot
                var getEndpoints = new List<string>
                {
                    $"{gatewayBaseUrl}/apigateway/internal/clients/email/{encodedEmail}", // Priorité 0 (sans auth)
                    $"{gatewayBaseUrl}/apigateway/clients/email/{encodedEmail}", // Priorité 1 (avec auth)
                    $"{clientApiBaseUrl}/api/clients/email/{encodedEmail}" // Direct
                };

                bool clientExists = false;

                foreach (var endpoint in getEndpoints)
                {
                    try
                    {
                        _logger.LogDebug("Vérification GET {Endpoint} pour {Email}", endpoint, user.Email);
                        var getResponse = await httpClient.GetAsync(endpoint);

                        if (getResponse.IsSuccessStatusCode)
                        {
                            _logger.LogInformation("✅ Profil client existant pour {Email}", user.Email);

                            // Lire le contenu pour vérifier si UserId est renseigné
                            try
                            {
                                var json = await getResponse.Content.ReadAsStringAsync();
                                using var doc = System.Text.Json.JsonDocument.Parse(json);
                                var root = doc.RootElement;

                                string existingUserId = null;
                                if (root.TryGetProperty("userId", out var prop) && prop.ValueKind == System.Text.Json.JsonValueKind.String)
                                    existingUserId = prop.GetString();
                                else if (root.TryGetProperty("UserId", out prop) && prop.ValueKind == System.Text.Json.JsonValueKind.String)
                                    existingUserId = prop.GetString();

                                // If UserId missing, attempt to update the client to set UserId
                                if (string.IsNullOrWhiteSpace(existingUserId))
                                {
                                    string clientId = null;
                                    if (root.TryGetProperty("id", out var idProp) && idProp.ValueKind == System.Text.Json.JsonValueKind.String)
                                        clientId = idProp.GetString();
                                    else if (root.TryGetProperty("Id", out idProp) && idProp.ValueKind == System.Text.Json.JsonValueKind.Number)
                                        clientId = idProp.GetRawText();

                                    if (!string.IsNullOrEmpty(clientId))
                                    {
                                        var updatePayload = new { UserId = user.Id };
                                        var putEndpoints = new List<string>
                                        {
                                            $"{gatewayBaseUrl}/apigateway/internal/clients/{clientId}",
                                            $"{gatewayBaseUrl}/apigateway/clients/{clientId}",
                                            $"{clientApiBaseUrl}/api/clients/{clientId}"
                                        };

                                        foreach (var putEndpoint in putEndpoints)
                                        {
                                            try
                                            {
                                                _logger.LogDebug("Tentative PUT {Endpoint} pour définir UserId pour {Email}", putEndpoint, user.Email);
                                                var putResp = await httpClient.PutAsJsonAsync(putEndpoint, updatePayload);
                                                if (putResp.IsSuccessStatusCode)
                                                {
                                                    _logger.LogInformation("✅ Mis à jour UserId pour client {Email} via {Endpoint}", user.Email, putEndpoint);
                                                    break;
                                                }
                                                else
                                                {
                                                    var err = await putResp.Content.ReadAsStringAsync();
                                                    _logger.LogWarning("Échec PUT {Endpoint} : {Status} - {Error}", putEndpoint, putResp.StatusCode, err);
                                                }
                                            }
                                            catch (Exception ex)
                                            {
                                                _logger.LogDebug(ex, "Erreur lors du PUT {Endpoint}", putEndpoint);
                                            }
                                        }
                                    }
                                    else
                                    {
                                        _logger.LogDebug("Impossible de déterminer l'ID client depuis la réponse pour {Email}", user.Email);
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Impossible de lire ou traiter la réponse client existant pour {Email}", user.Email);
                            }

                            clientExists = true;
                            break;
                        }

                        if (getResponse.StatusCode == HttpStatusCode.NotFound)
                        {
                            _logger.LogDebug("Client {Email} non trouvé à {Endpoint}", user.Email, endpoint);
                            break; // Passe à la création
                        }

                        _logger.LogWarning("Statut inattendu pour {Email} à {Endpoint}: {Status}",
                            user.Email, endpoint, getResponse.StatusCode);
                    }
                    catch (HttpRequestException ex)
                    {
                        _logger.LogDebug("Service non disponible: {Endpoint} - {Message}", endpoint, ex.Message);
                        continue;
                    }
                    catch (TaskCanceledException)
                    {
                        _logger.LogWarning("Timeout pour {Endpoint}", endpoint);
                        continue;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug("Erreur lors de la vérification {Endpoint}: {Message}", endpoint, ex.Message);
                        continue;
                    }
                }

                // Si le client n'existe pas, le créer
                if (!clientExists)
                {
                    var payload = new
                    {
                        Nom = $"{user.FirstName} {user.LastName}".Trim(),
                        Email = user.Email,
                        Telephone = user.PhoneNumber ?? string.Empty,
                        Adresse = string.Empty,
                        UserId = user.Id
                    };

                    var createEndpoints = new List<string>
                    {
                        $"{gatewayBaseUrl}/apigateway/internal/clients", // Sans auth
                        $"{gatewayBaseUrl}/apigateway/clients", // Avec auth
                        $"{clientApiBaseUrl}/api/clients" // Direct
                    };

                    bool created = false;

                    foreach (var endpoint in createEndpoints)
                    {
                        try
                        {
                            _logger.LogDebug("Tentative POST {Endpoint} pour {Email}", endpoint, user.Email);
                            var createResponse = await httpClient.PostAsJsonAsync(endpoint, payload);

                            if (createResponse.IsSuccessStatusCode)
                            {
                                _logger.LogInformation("✅ Profil client créé pour {Email} via {Endpoint}", user.Email, endpoint);
                                created = true;
                                break;
                            }

                            // Lire le contenu de l'erreur si possible
                            string errorContent = "N/A";
                            try
                            {
                                errorContent = await createResponse.Content.ReadAsStringAsync();
                            }
                            catch { }

                            _logger.LogWarning("Échec création client {Email} via {Endpoint}: {Status} - {Error}",
                                user.Email, endpoint, createResponse.StatusCode, errorContent);
                        }
                        catch (HttpRequestException ex)
                        {
                            _logger.LogDebug("Service non disponible: {Endpoint} - {Message}", endpoint, ex.Message);
                        }
                        catch (TaskCanceledException)
                        {
                            _logger.LogWarning("Timeout création client: {Endpoint}", endpoint);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogDebug("Erreur création client {Endpoint}: {Message}", endpoint, ex.Message);
                        }
                    }

                    if (!created)
                    {
                        throw new Exception($"Échec de la création du profil client pour {user.Email}");
                    }
                }

                // En cas de succès, nettoyer le cache d'échec
                _syncFailures.TryRemove(user.Email, out _);
            }
            catch (Exception ex)
            {
                // Enregistrer l'échec dans le cache
                _syncFailures[user.Email] = DateTime.UtcNow;
                _logger.LogError(ex, "Erreur lors de la synchronisation du profil client pour {Email}", user.Email);
            }
            finally
            {
                stopwatch.Stop();
                _logger.LogDebug("Synchronisation client pour {Email} terminée en {ElapsedMs}ms",
                    user.Email, stopwatch.ElapsedMilliseconds);
            }
        }
    // ========== MÉTHODE UNIQUE POUR LES APPELS ==========
    private async Task SynchronizeClientProfile(ApplicationUser user)
    {
        // Utiliser d'abord la nouvelle méthode, avec fallback sur l'ancienne
        try
        {
            await SyncClientWithClientAPI(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in new sync method, trying old method for {Email}", user.Email);
            await EnsureClientProfileAsync(user);
        }
    }
        private async Task UpdateClientProfileAsync(ApplicationUser user)
        {
            try
            {
                var gatewayBaseUrl = _configuration["GatewayBaseUrl"] ?? "https://localhost:7076";
                var timeoutSeconds = _configuration.GetValue<int>("ClientSync:TimeoutSeconds", 15);

                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);

                // Récupérer le client existant - d'abord via la route interne
                var encodedEmail = Uri.EscapeDataString(user.Email ?? string.Empty);

                // Essayer d'abord la route interne (sans auth)
                var getResponse = await httpClient.GetAsync($"{gatewayBaseUrl}/apigateway/internal/clients/email/{encodedEmail}");

                if (!getResponse.IsSuccessStatusCode)
                {
                    // Essayer la route normale (avec auth)
                    getResponse = await httpClient.GetAsync($"{gatewayBaseUrl}/apigateway/clients/email/{encodedEmail}");
                }

                if (!getResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Client {Email} introuvable pour mise à jour", user.Email);
                    return;
                }

                dynamic clientData;
                try
                {
                    clientData = await getResponse.Content.ReadFromJsonAsync<dynamic>();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur lors de la lecture des données client pour {Email}", user.Email);
                    return;
                }

                var clientId = clientData?.id?.ToString() ?? clientData?.Id?.ToString();

                if (string.IsNullOrEmpty(clientId))
                {
                    _logger.LogWarning("ID client non trouvé pour {Email}", user.Email);
                    return;
                }

                // Mettre à jour le client - d'abord via la route interne
                var payload = new
                {
                    Nom = $"{user.FirstName} {user.LastName}".Trim(),
                    Email = user.Email,
                    Telephone = user.PhoneNumber ?? string.Empty,
                    Adresse = string.Empty
                };

                // Essayer la route interne d'abord
                var updateResponse = await httpClient.PutAsJsonAsync($"{gatewayBaseUrl}/apigateway/internal/clients/{clientId}", payload);

                if (!updateResponse.IsSuccessStatusCode)
                {
                    // Essayer la route normale
                    updateResponse = await httpClient.PutAsJsonAsync($"{gatewayBaseUrl}/apigateway/clients/{clientId}", payload);
                }

                if (updateResponse.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Profil client mis à jour pour {Email}", user.Email);
                }
                else
                {
                    var errorContent = await updateResponse.Content.ReadAsStringAsync();
                    _logger.LogWarning("Échec de mise à jour du profil client pour {Email}: {Status} - {Error}",
                        user.Email, updateResponse.StatusCode, errorContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erreur lors de la mise à jour du profil client pour {Email}", user.Email);
            }
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

            if (attempt.IsLockedOut)
            {
                _logger.LogWarning($"Account {email} is locked until {attempt.LockoutEnd}");
                return false;
            }

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