# Authentication & Authorization Command

Implement comprehensive authentication and authorization using JWT, Identity, and role-based access control for ASP.NET Core Web API.

## Usage

**Setup JWT authentication:**
```bash
# Setup JWT authentication with roles
# /auth JWT --with-roles --with-refresh-tokens
```

**Setup Identity authentication:**
```bash
# /auth $ARGUMENTS --identity --with-email-confirmation --with-2fa
```

## Implementation

I'll create a complete authentication and authorization system with JWT tokens, user management, role-based access control, and security best practices.

### Authentication Strategy

1. **Analyze authentication requirements and user model**
2. **Implement JWT token generation and validation**
3. **Set up user registration and login endpoints**
4. **Configure role-based authorization**
5. **Add security features (refresh tokens, password policies, etc.)**

### Complete JWT Authentication Implementation

#### JWT Service

```csharp
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MyApp.Services.Authentication
{
    /// <summary>
    /// Service for JWT token operations
    /// </summary>
    public class JwtService : IJwtService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly ILogger<JwtService> _logger;

        public JwtService(IOptions<JwtSettings> jwtSettings, ILogger<JwtService> logger)
        {
            _jwtSettings = jwtSettings.Value ?? throw new ArgumentNullException(nameof(jwtSettings));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Generates a JWT access token for the user
        /// </summary>
        public string GenerateAccessToken(User user, IList<string> roles)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSettings.SecretKey);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.Email),
                new(ClaimTypes.Email, user.Email),
                new("sub", user.Id.ToString()),
                new("email", user.Email),
                new("first_name", user.FirstName),
                new("last_name", user.LastName),
                new("email_verified", user.IsEmailVerified.ToString().ToLower()),
                new("jti", Guid.NewGuid().ToString())
            };

            // Add role claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
                claims.Add(new Claim("role", role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.Add(_jwtSettings.AccessTokenLifetime),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature),
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            _logger.LogInformation("Access token generated for user {UserId}", user.Id);
            return tokenString;
        }

        /// <summary>
        /// Generates a refresh token
        /// </summary>
        public string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }

        /// <summary>
        /// Validates and parses a JWT token
        /// </summary>
        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtSettings.SecretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _jwtSettings.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                return principal;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Token validation failed: {Token}", token[..Math.Min(token.Length, 20)]);
                return null;
            }
        }

        /// <summary>
        /// Extracts claims from a JWT token without validation
        /// </summary>
        public IEnumerable<Claim> GetClaimsFromToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jsonToken = tokenHandler.ReadJwtToken(token);
                return jsonToken.Claims;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract claims from token");
                return Enumerable.Empty<Claim>();
            }
        }

        /// <summary>
        /// Checks if a token is expired
        /// </summary>
        public bool IsTokenExpired(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jsonToken = tokenHandler.ReadJwtToken(token);
                return jsonToken.ValidTo <= DateTime.UtcNow;
            }
            catch
            {
                return true;
            }
        }
    }

    /// <summary>
    /// Interface for JWT service operations
    /// </summary>
    public interface IJwtService
    {
        string GenerateAccessToken(User user, IList<string> roles);
        string GenerateRefreshToken();
        ClaimsPrincipal? ValidateToken(string token);
        IEnumerable<Claim> GetClaimsFromToken(string token);
        bool IsTokenExpired(string token);
    }
}
```

#### Authentication Service

```csharp
using Microsoft.AspNetCore.Identity;
using MyApp.Core.Entities;
using MyApp.Models.Requests.Auth;
using MyApp.Models.Responses.Auth;

namespace MyApp.Services.Authentication
{
    /// <summary>
    /// Service for authentication operations
    /// </summary>
    public class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;
        private readonly IJwtService _jwtService;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthenticationService> _logger;
        private readonly AuthenticationSettings _settings;

        public AuthenticationService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            RoleManager<IdentityRole<int>> roleManager,
            IJwtService jwtService,
            IRefreshTokenRepository refreshTokenRepository,
            IEmailService emailService,
            ILogger<AuthenticationService> logger,
            IOptions<AuthenticationSettings> settings)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _signInManager = signInManager ?? throw new ArgumentNullException(nameof(signInManager));
            _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
            _jwtService = jwtService ?? throw new ArgumentNullException(nameof(jwtService));
            _refreshTokenRepository = refreshTokenRepository ?? throw new ArgumentNullException(nameof(refreshTokenRepository));
            _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        }

        /// <summary>
        /// Registers a new user
        /// </summary>
        public async Task<AuthResult> RegisterAsync(RegisterRequest request)
        {
            using var scope = _logger.BeginScope(new { Operation = "Register", Email = request.Email });

            try
            {
                _logger.LogInformation("Attempting to register user with email {Email}", request.Email);

                // Check if user already exists
                var existingUser = await _userManager.FindByEmailAsync(request.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning("Registration failed: User with email {Email} already exists", request.Email);
                    return AuthResult.Failure("A user with this email already exists");
                }

                // Create user
                var user = new User
                {
                    UserName = request.Email,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var result = await _userManager.CreateAsync(user, request.Password);

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogWarning("User creation failed for {Email}: {Errors}", request.Email, errors);
                    return AuthResult.Failure(errors);
                }

                // Assign default role
                await _userManager.AddToRoleAsync(user, "User");

                // Send email confirmation if required
                if (_settings.RequireEmailConfirmation)
                {
                    await SendEmailConfirmationAsync(user);
                }

                _logger.LogInformation("User {UserId} registered successfully with email {Email}", user.Id, user.Email);

                var tokens = await GenerateTokensAsync(user);
                return AuthResult.Success(tokens, user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user with email {Email}", request.Email);
                return AuthResult.Failure("An error occurred during registration");
            }
        }

        /// <summary>
        /// Authenticates a user and returns tokens
        /// </summary>
        public async Task<AuthResult> LoginAsync(LoginRequest request)
        {
            using var scope = _logger.BeginScope(new { Operation = "Login", Email = request.Email });

            try
            {
                _logger.LogInformation("Login attempt for user {Email}", request.Email);

                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    _logger.LogWarning("Login failed: User {Email} not found", request.Email);
                    return AuthResult.Failure("Invalid email or password");
                }

                if (!user.IsActive)
                {
                    _logger.LogWarning("Login failed: User {Email} is inactive", request.Email);
                    return AuthResult.Failure("Account is inactive");
                }

                // Check email confirmation if required
                if (_settings.RequireEmailConfirmation && !await _userManager.IsEmailConfirmedAsync(user))
                {
                    _logger.LogWarning("Login failed: Email not confirmed for user {Email}", request.Email);
                    return AuthResult.Failure("Email address is not confirmed");
                }

                var signInResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

                if (!signInResult.Succeeded)
                {
                    var reason = signInResult switch
                    {
                        { IsLockedOut: true } => "Account is locked out",
                        { RequiresTwoFactor: true } => "Two-factor authentication required",
                        { IsNotAllowed: true } => "Account is not allowed to sign in",
                        _ => "Invalid email or password"
                    };

                    _logger.LogWarning("Login failed for {Email}: {Reason}", request.Email, reason);
                    return AuthResult.Failure(reason);
                }

                // Update last login
                user.LastLoginAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);

                _logger.LogInformation("User {UserId} logged in successfully", user.Id);

                var tokens = await GenerateTokensAsync(user);
                return AuthResult.Success(tokens, user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for user {Email}", request.Email);
                return AuthResult.Failure("An error occurred during login");
            }
        }

        /// <summary>
        /// Refreshes access token using refresh token
        /// </summary>
        public async Task<AuthResult> RefreshTokenAsync(RefreshTokenRequest request)
        {
            try
            {
                _logger.LogInformation("Refresh token attempt");

                var refreshToken = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
                
                if (refreshToken == null || refreshToken.IsExpired || refreshToken.IsRevoked)
                {
                    _logger.LogWarning("Invalid or expired refresh token");
                    return AuthResult.Failure("Invalid refresh token");
                }

                var user = await _userManager.FindByIdAsync(refreshToken.UserId.ToString());
                if (user == null || !user.IsActive)
                {
                    _logger.LogWarning("User not found or inactive for refresh token");
                    return AuthResult.Failure("Invalid user");
                }

                // Revoke old refresh token
                refreshToken.IsRevoked = true;
                refreshToken.RevokedAt = DateTime.UtcNow;
                await _refreshTokenRepository.UpdateAsync(refreshToken);

                // Generate new tokens
                var tokens = await GenerateTokensAsync(user);
                
                _logger.LogInformation("Tokens refreshed for user {UserId}", user.Id);
                return AuthResult.Success(tokens, user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token");
                return AuthResult.Failure("An error occurred during token refresh");
            }
        }

        /// <summary>
        /// Revokes a refresh token
        /// </summary>
        public async Task<bool> RevokeTokenAsync(string token, int userId)
        {
            try
            {
                var refreshToken = await _refreshTokenRepository.GetByTokenAsync(token);
                
                if (refreshToken == null || refreshToken.UserId != userId)
                {
                    return false;
                }

                refreshToken.IsRevoked = true;
                refreshToken.RevokedAt = DateTime.UtcNow;
                await _refreshTokenRepository.UpdateAsync(refreshToken);

                _logger.LogInformation("Refresh token revoked for user {UserId}", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking token for user {UserId}", userId);
                return false;
            }
        }

        /// <summary>
        /// Changes user password
        /// </summary>
        public async Task<AuthResult> ChangePasswordAsync(ChangePasswordRequest request, int userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user == null)
                {
                    return AuthResult.Failure("User not found");
                }

                var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
                
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return AuthResult.Failure(errors);
                }

                _logger.LogInformation("Password changed for user {UserId}", userId);
                return AuthResult.Success("Password changed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", userId);
                return AuthResult.Failure("An error occurred while changing password");
            }
        }

        private async Task<AuthTokens> GenerateTokensAsync(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _jwtService.GenerateAccessToken(user, roles);
            var refreshTokenValue = _jwtService.GenerateRefreshToken();

            var refreshToken = new RefreshToken
            {
                Token = refreshTokenValue,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            };

            await _refreshTokenRepository.AddAsync(refreshToken);

            return new AuthTokens
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenValue,
                ExpiresIn = (int)TimeSpan.FromHours(1).TotalSeconds,
                TokenType = "Bearer"
            };
        }

        private async Task SendEmailConfirmationAsync(User user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var confirmationLink = $"{_settings.ClientUrl}/confirm-email?userId={user.Id}&token={WebUtility.UrlEncode(token)}";
            
            await _emailService.SendEmailConfirmationAsync(user.Email, user.FirstName, confirmationLink);
            _logger.LogInformation("Email confirmation sent to {Email}", user.Email);
        }
    }
}
```

#### Authentication Controller

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.Services.Authentication;
using MyApp.Models.Requests.Auth;
using System.Security.Claims;

namespace MyApp.Controllers
{
    /// <summary>
    /// Authentication controller for user registration, login, and token management
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthenticationService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthenticationService authService, ILogger<AuthController> logger)
        {
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Registers a new user account
        /// </summary>
        /// <param name="request">User registration information</param>
        /// <returns>Authentication tokens if successful</returns>
        /// <response code="200">Registration successful</response>
        /// <response code="400">Invalid registration data</response>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ValidationProblemDetails(ModelState));
            }

            var result = await _authService.RegisterAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Registration failed",
                    Detail = result.ErrorMessage
                });
            }

            var response = new AuthResponse
            {
                User = new UserInfo
                {
                    Id = result.User!.Id,
                    Email = result.User.Email,
                    FirstName = result.User.FirstName,
                    LastName = result.User.LastName,
                    IsEmailVerified = result.User.IsEmailVerified
                },
                Tokens = result.Tokens!,
                Message = "Registration successful"
            };

            return Ok(response);
        }

        /// <summary>
        /// Authenticates a user and returns access tokens
        /// </summary>
        /// <param name="request">Login credentials</param>
        /// <returns>Authentication tokens if successful</returns>
        /// <response code="200">Login successful</response>
        /// <response code="400">Invalid credentials</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ValidationProblemDetails(ModelState));
            }

            var result = await _authService.LoginAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Login failed",
                    Detail = result.ErrorMessage
                });
            }

            var response = new AuthResponse
            {
                User = new UserInfo
                {
                    Id = result.User!.Id,
                    Email = result.User.Email,
                    FirstName = result.User.FirstName,
                    LastName = result.User.LastName,
                    IsEmailVerified = result.User.IsEmailVerified
                },
                Tokens = result.Tokens!,
                Message = "Login successful"
            };

            return Ok(response);
        }

        /// <summary>
        /// Refreshes an access token using a refresh token
        /// </summary>
        /// <param name="request">Refresh token request</param>
        /// <returns>New access tokens</returns>
        /// <response code="200">Token refresh successful</response>
        /// <response code="400">Invalid refresh token</response>
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(AuthTokens), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuthTokens>> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ValidationProblemDetails(ModelState));
            }

            var result = await _authService.RefreshTokenAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Token refresh failed",
                    Detail = result.ErrorMessage
                });
            }

            return Ok(result.Tokens);
        }

        /// <summary>
        /// Revokes a refresh token
        /// </summary>
        /// <param name="request">Token revocation request</param>
        /// <returns>Success status</returns>
        /// <response code="200">Token revoked successfully</response>
        /// <response code="400">Invalid token</response>
        [HttpPost("revoke")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var success = await _authService.RevokeTokenAsync(request.RefreshToken, userId);

            if (!success)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Token revocation failed",
                    Detail = "Invalid or already revoked token"
                });
            }

            return Ok(new { message = "Token revoked successfully" });
        }

        /// <summary>
        /// Changes the current user's password
        /// </summary>
        /// <param name="request">Password change request</param>
        /// <returns>Success status</returns>
        /// <response code="200">Password changed successfully</response>
        /// <response code="400">Invalid password data</response>
        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ValidationProblemDetails(ModelState));
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _authService.ChangePasswordAsync(request, userId);

            if (!result.IsSuccess)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Password change failed",
                    Detail = result.ErrorMessage
                });
            }

            return Ok(new { message = result.SuccessMessage });
        }

        /// <summary>
        /// Gets the current user's profile information
        /// </summary>
        /// <returns>User profile</returns>
        /// <response code="200">User profile retrieved successfully</response>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserProfile), StatusCodes.Status200OK)]
        public IActionResult GetProfile()
        {
            var profile = new UserProfile
            {
                Id = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value),
                Email = User.FindFirst(ClaimTypes.Email)!.Value,
                FirstName = User.FindFirst("first_name")!.Value,
                LastName = User.FindFirst("last_name")!.Value,
                Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList(),
                IsEmailVerified = bool.Parse(User.FindFirst("email_verified")!.Value)
            };

            return Ok(profile);
        }
    }
}
```

### Program.cs Configuration

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add Identity
builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
    // Password settings
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false; // Set to true in production
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings.SecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Add authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("UserOrAdmin", policy => policy.RequireRole("User", "Admin"));
    options.AddPolicy("EmailVerified", policy => policy.RequireClaim("email_verified", "true"));
});

// Register services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();

var app = builder.Build();

// Seed roles and admin user
using (var scope = app.Services.CreateScope())
{
    await SeedRolesAndAdminUser(scope.ServiceProvider);
}

app.UseAuthentication();
app.UseAuthorization();

app.Run();

static async Task SeedRolesAndAdminUser(IServiceProvider services)
{
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
    var userManager = services.GetRequiredService<UserManager<User>>();

    // Create roles
    var roles = new[] { "Admin", "User" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<int>(role));
        }
    }

    // Create admin user
    var adminEmail = "admin@example.com";
    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        var adminUser = new User
        {
            UserName = adminEmail,
            Email = adminEmail,
            FirstName = "Admin",
            LastName = "User",
            IsEmailVerified = true,
            IsActive = true
        };

        var result = await userManager.CreateAsync(adminUser, "Admin123!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}
```

I'll generate a complete authentication and authorization system with JWT tokens, Identity integration, role-based access control, refresh tokens, password policies, and security best practices following modern authentication patterns.