using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuthAPI.Models;
using AuthAPI.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace AuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly UserManager<ApplicationUser> _userManager;

        public AuthController(
            IAuthService authService,
            IRefreshTokenService refreshTokenService,
            UserManager<ApplicationUser> userManager)
        {
            _authService = authService;
            _refreshTokenService = refreshTokenService;
            _userManager = userManager;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(model);

            if (!result.IsAuthenticated)
                return BadRequest(new { message = result.Message });

            // Définir le refresh token dans un cookie HttpOnly
            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new
            {
                result.Token,
                result.RefreshToken,
                result.Email,
                result.Username,
                result.UserId,
                result.FirstName,
                result.LastName,
                result.Roles,
                result.TokenExpiration,
                result.RefreshTokenExpiration,
                result.Message
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync([FromBody] TokenRequestModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.GetTokenAsync(model);

            if (!result.IsAuthenticated)
                return Unauthorized(new { message = result.Message });

            // Définir le refresh token dans un cookie HttpOnly
            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new
            {
                result.Token,
                result.RefreshToken,
                result.Email,
                result.Username,
                result.UserId,
                result.FirstName,
                result.LastName,
                result.Roles,
                result.TokenExpiration,
                result.RefreshTokenExpiration,
                result.Message
            });
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshTokenAsync()
        {
            // Récupérer le refresh token depuis le cookie
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
                return BadRequest(new { message = "Refresh token is required in cookie" });

            // Récupérer le token d'accès depuis le header Authorization
            var authorizationHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
                return BadRequest(new { message = "Access token is required in Authorization header" });

            var accessToken = authorizationHeader.Substring("Bearer ".Length).Trim();

            var model = new RefreshTokenRequest
            {
                Token = accessToken,
                RefreshToken = refreshToken
            };

            var result = await _authService.RefreshTokenAsync(model);

            if (!result.IsAuthenticated)
                return Unauthorized(new { message = result.Message });

            // Mettre à jour le cookie refresh token
            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new
            {
                result.Token,
                result.RefreshToken,
                result.Email,
                result.Username,
                result.UserId,
                result.FirstName,
                result.LastName,
                result.Roles,
                result.TokenExpiration,
                result.RefreshTokenExpiration,
                result.Message
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> LogoutAsync()
        {
            var userId = User.FindFirst("uid")?.Value;

            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { message = "Invalid user" });

            var result = await _authService.LogoutAsync(userId);

            // Supprimer le cookie refresh token
            Response.Cookies.Delete("refreshToken");

            if (!result)
                return BadRequest(new { message = "Logout failed" });

            return Ok(new { message = "Déconnexion réussie" });
        }

        [Authorize]
        [HttpPost("logout-all")]
        public async Task<IActionResult> LogoutAllAsync()
        {
            var userId = User.FindFirst("uid")?.Value;

            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { message = "Invalid user" });

            var result = await _authService.LogoutAsync(userId);

            // Supprimer le cookie refresh token
            Response.Cookies.Delete("refreshToken");

            if (!result)
                return BadRequest(new { message = "Revoke all tokens failed" });

            return Ok(new { message = "Tous les tokens ont été révoqués" });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfileAsync()
        {
            var userId = User.FindFirst("uid")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Récupérer les rôles de l'utilisateur
            var roles = await _authService.GetUserRolesAsync(userId);

            return Ok(new
            {
                user.Id,
                user.UserName,
                user.Email,
                user.FirstName,
                user.LastName,
                user.PhoneNumber,
                user.CreatedAt,
                user.LastLoginAt,
                user.IsActive,
                user.FailedLoginAttempts,
                user.LockoutEnd,
                user.LastPasswordChange,
                Roles = roles
            });
        }

        // ========== NOUVEAUX ENDPOINTS ==========

        [Authorize]
        [HttpPost("changepassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = User.FindFirst("uid")?.Value;
                var success = await _authService.ChangePasswordAsync(userId, model);

                if (!success)
                    return BadRequest(new { message = "Password change failed. Check your old password." });

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = User.FindFirst("uid")?.Value;
                var success = await _authService.UpdateProfileAsync(userId, model);

                if (!success)
                    return BadRequest(new { message = "Profile update failed" });

                // Récupérer l'utilisateur mis à jour
                var user = await _authService.GetUserByIdAsync(userId);
                var roles = await _authService.GetUserRolesAsync(userId);

                return Ok(new
                {
                    message = "Profile updated successfully",
                    user = new
                    {
                        user.Id,
                        user.UserName,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        user.PhoneNumber,
                        Roles = roles
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ResetPasswordModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var success = await _authService.ResetPasswordAsync(model);

                // Pour des raisons de sécurité, on retourne toujours OK même si l'email n'existe pas
                return Ok(new
                {
                    message = "If an account with that email exists, a password reset link has been sent."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordConfirmModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var success = await _authService.ResetPasswordConfirmAsync(model);

                if (!success)
                    return BadRequest(new { message = "Password reset failed. The token may be invalid or expired." });

                return Ok(new { message = "Password has been reset successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("toggle-user/{userId}")]
        public async Task<IActionResult> ToggleUserStatus(string userId)
        {
            try
            {
                var success = await _authService.ToggleUserStatusAsync(userId);

                if (!success)
                    return BadRequest(new { message = "Failed to toggle user status" });

                var user = await _authService.GetUserByIdAsync(userId);

                return Ok(new
                {
                    userId,
                    isActive = user.IsActive,
                    message = $"User {user.Email} is now {(user.IsActive ? "active" : "inactive")}"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("login-history")]
        public async Task<IActionResult> GetLoginHistory([FromQuery] int days = 30)
        {
            try
            {
                var userId = User.FindFirst("uid")?.Value;
                var audits = await _authService.GetLoginAuditsAsync(userId, days);

                return Ok(new
                {
                    count = audits.Count,
                    days,
                    audits = audits.Select(a => new
                    {
                        a.LoginTime,
                        a.Success,
                        a.IPAddress,
                        a.UserAgent,
                        a.FailureReason
                    })
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("stats")]
        public async Task<IActionResult> GetUserStats()
        {
            try
            {
                var userId = User.FindFirst("uid")?.Value;
                var stats = await _authService.GetUserStatsAsync(userId);

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var users = await _authService.GetAllUsersAsync(page, pageSize);
                var totalUsers = await _authService.CountUsersAsync();

                var userDtos = new List<object>();

                foreach (var user in users)
                {
                    var roles = await _authService.GetUserRolesAsync(user.Id);
                    userDtos.Add(new
                    {
                        user.Id,
                        user.UserName,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        user.PhoneNumber,
                        user.CreatedAt,
                        user.LastLoginAt,
                        user.IsActive,
                        user.FailedLoginAttempts,
                        user.LockoutEnd,
                        user.LastPasswordChange,
                        Roles = roles,
                        PasswordAge = user.LastPasswordChange.HasValue
                            ? (DateTime.UtcNow - user.LastPasswordChange.Value).Days
                            : (DateTime.UtcNow - user.CreatedAt).Days
                    });
                }

                return Ok(new
                {
                    total = totalUsers,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling(totalUsers / (double)pageSize),
                    users = userDtos
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserById(string userId)
        {
            try
            {
                var user = await _authService.GetUserByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                var roles = await _authService.GetUserRolesAsync(userId);
                var audits = await _authService.GetLoginAuditsAsync(userId, 30);
                var stats = await _authService.GetUserStatsAsync(userId);

                return Ok(new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    user.PhoneNumber,
                    user.CreatedAt,
                    user.LastLoginAt,
                    user.IsActive,
                    user.FailedLoginAttempts,
                    user.LockoutEnd,
                    user.LastPasswordChange,
                    Roles = roles,
                    RecentLogins = audits.Count,
                    Stats = stats
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("addrole")]
        public async Task<IActionResult> AddRoleAsync([FromBody] AddRoleModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.AddRoleAsync(model);

            if (!string.IsNullOrEmpty(result))
                return BadRequest(new { message = result });

            return Ok(new { message = "Role added successfully", model });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("createrole")]
        public async Task<IActionResult> CreateRoleAsync([FromBody] string roleName)
        {
            if (string.IsNullOrEmpty(roleName))
                return BadRequest(new { message = "Role name cannot be empty" });

            var result = await _authService.CreateRoleAsync(roleName);

            if (result != "Role created successfully")
                return BadRequest(new { message = result });

            return Ok(new { message = result });
        }

        [Authorize]
        [HttpGet("validate")]
        public IActionResult ValidateToken()
        {
            var userId = User.FindFirst("uid")?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var firstName = User.FindFirst("firstName")?.Value;
            var lastName = User.FindFirst("lastName")?.Value;
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            return Ok(new
            {
                IsValid = true,
                UserId = userId,
                Username = username,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                Roles = roles,
                Message = "Token is valid"
            });
        }

        [Authorize]
        [HttpGet("check-password-expiry")]
        public async Task<IActionResult> CheckPasswordExpiry()
        {
            try
            {
                var userId = User.FindFirst("uid")?.Value;
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                var passwordExpiryDays = 90; // Valeur par défaut
                var daysSinceLastChange = user.LastPasswordChange.HasValue
                    ? (DateTime.UtcNow - user.LastPasswordChange.Value).Days
                    : (DateTime.UtcNow - user.CreatedAt).Days;

                var daysRemaining = passwordExpiryDays - daysSinceLastChange;
                var requiresChange = daysRemaining <= 7 || user.PasswordChangeRequired;

                return Ok(new
                {
                    requiresChange,
                    daysSinceLastChange,
                    daysRemaining,
                    lastPasswordChange = user.LastPasswordChange,
                    message = requiresChange
                        ? $"Password will expire in {daysRemaining} days. Please change your password."
                        : "Password is up to date."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                SameSite = SameSiteMode.Strict,
                Secure = Request.IsHttps,
                Path = "/"
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}