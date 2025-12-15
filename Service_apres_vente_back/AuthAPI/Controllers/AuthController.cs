using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuthAPI.Models;
using AuthAPI.Services;
using System.Security.Claims;

namespace AuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IRefreshTokenService _refreshTokenService;

        public AuthController(IAuthService authService, IRefreshTokenService refreshTokenService)
        {
            _authService = authService;
            _refreshTokenService = refreshTokenService;
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
                user.CreatedAt,
                user.LastLoginAt,
                user.IsActive,
                Roles = roles
            });
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

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                SameSite = SameSiteMode.Strict,
                Secure = false,
                Path = "/"
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}