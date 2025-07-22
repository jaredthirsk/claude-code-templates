# Service Layer Command

Generate business logic services with dependency injection, proper error handling, and clean architecture patterns.

## Usage

**Create service class:**
```bash
# Create UserService with CRUD operations
# /service User
```

**Create service with specific features:**
```bash
# /service $ARGUMENTS --with-caching --with-logging --with-validation
```

## Implementation

I'll create a comprehensive service layer with business logic, data access abstraction, error handling, and dependency injection following clean architecture principles.

### Service Generation Strategy

1. **Analyze business domain and requirements**
2. **Generate service interface and implementation**
3. **Implement proper error handling and logging**
4. **Add caching and performance optimizations**
5. **Include validation and business rules**

### Complete Service Implementation

```csharp
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using MyApp.Core.Entities;
using MyApp.Core.Exceptions;
using MyApp.Core.Interfaces.Repositories;
using MyApp.Core.Interfaces.Services;
using MyApp.Models.Requests;
using MyApp.Models.Responses;
using MyApp.Configuration;

namespace MyApp.Services
{
    /// <summary>
    /// Service for managing user operations
    /// </summary>
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _cache;
        private readonly ILogger<UserService> _logger;
        private readonly UserSettings _userSettings;

        private const string USERS_CACHE_KEY = "all_users";
        private const string USER_CACHE_KEY_PREFIX = "user_";

        public UserService(
            IUserRepository userRepository,
            IEmailService emailService,
            IMemoryCache cache,
            ILogger<UserService> logger,
            IOptions<UserSettings> userSettings)
        {
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _userSettings = userSettings?.Value ?? throw new ArgumentNullException(nameof(userSettings));
        }

        /// <summary>
        /// Gets all users with optional filtering and pagination
        /// </summary>
        public async Task<PagedResponse<UserResponse>> GetUsersAsync(
            string? search = null, 
            int page = 1, 
            int pageSize = 10)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Operation"] = "GetUsers",
                ["Search"] = search ?? "none",
                ["Page"] = page,
                ["PageSize"] = pageSize
            });

            try
            {
                _logger.LogInformation("Retrieving users with pagination: page {Page}, size {PageSize}", page, pageSize);

                ValidatePaginationParameters(page, pageSize);

                // Try cache first for non-filtered requests
                var cacheKey = $"{USERS_CACHE_KEY}_{search}_{page}_{pageSize}";
                if (_cache.TryGetValue(cacheKey, out PagedResponse<UserResponse>? cachedResult))
                {
                    _logger.LogDebug("Returning cached users result");
                    return cachedResult;
                }

                var (users, totalCount) = await _userRepository.GetPagedAsync(search, page, pageSize);

                var userResponses = users.Select(MapToUserResponse).ToList();

                var result = new PagedResponse<UserResponse>
                {
                    Data = userResponses,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                // Cache for a short time
                _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));

                _logger.LogInformation("Retrieved {UserCount} users (total: {TotalCount})", userResponses.Count, totalCount);
                return result;
            }
            catch (Exception ex) when (!(ex is ValidationException))
            {
                _logger.LogError(ex, "Error retrieving users");
                throw new ServiceException("An error occurred while retrieving users", ex);
            }
        }

        /// <summary>
        /// Gets a user by ID
        /// </summary>
        public async Task<UserResponse?> GetUserByIdAsync(int id)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Operation"] = "GetUserById",
                ["UserId"] = id
            });

            try
            {
                ValidateUserId(id);

                _logger.LogDebug("Retrieving user {UserId}", id);

                // Check cache first
                var cacheKey = $"{USER_CACHE_KEY_PREFIX}{id}";
                if (_cache.TryGetValue(cacheKey, out UserResponse? cachedUser))
                {
                    _logger.LogDebug("Returning cached user {UserId}", id);
                    return cachedUser;
                }

                var user = await _userRepository.GetByIdAsync(id);

                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found", id);
                    return null;
                }

                var userResponse = MapToUserResponse(user);

                // Cache individual user
                _cache.Set(cacheKey, userResponse, TimeSpan.FromMinutes(15));

                _logger.LogInformation("Retrieved user {UserId} ({UserEmail})", user.Id, user.Email);
                return userResponse;
            }
            catch (Exception ex) when (!(ex is ValidationException))
            {
                _logger.LogError(ex, "Error retrieving user {UserId}", id);
                throw new ServiceException($"An error occurred while retrieving user {id}", ex);
            }
        }

        /// <summary>
        /// Creates a new user
        /// </summary>
        public async Task<UserResponse> CreateUserAsync(CreateUserRequest request)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Operation"] = "CreateUser",
                ["UserEmail"] = request.Email
            });

            try
            {
                _logger.LogInformation("Creating new user with email {UserEmail}", request.Email);

                await ValidateCreateUserRequest(request);

                var user = new User
                {
                    FirstName = request.FirstName.Trim(),
                    LastName = request.LastName.Trim(),
                    Email = request.Email.Trim().ToLowerInvariant(),
                    PhoneNumber = request.PhoneNumber?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var createdUser = await _userRepository.AddAsync(user);

                // Clear relevant caches
                ClearUsersCaches();

                var userResponse = MapToUserResponse(createdUser);

                // Send welcome email asynchronously
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendWelcomeEmailAsync(createdUser.Email, createdUser.FirstName);
                        _logger.LogInformation("Welcome email sent to {UserEmail}", createdUser.Email);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to send welcome email to {UserEmail}", createdUser.Email);
                    }
                });

                _logger.LogInformation("Successfully created user {UserId} ({UserEmail})", 
                    createdUser.Id, createdUser.Email);

                return userResponse;
            }
            catch (DuplicateEmailException)
            {
                _logger.LogWarning("Attempt to create user with duplicate email {UserEmail}", request.Email);
                throw;
            }
            catch (Exception ex) when (!(ex is ValidationException))
            {
                _logger.LogError(ex, "Error creating user with email {UserEmail}", request.Email);
                throw new ServiceException("An error occurred while creating the user", ex);
            }
        }

        /// <summary>
        /// Updates an existing user
        /// </summary>
        public async Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Operation"] = "UpdateUser",
                ["UserId"] = id
            });

            try
            {
                _logger.LogInformation("Updating user {UserId}", id);

                ValidateUserId(id);
                await ValidateUpdateUserRequest(request, id);

                var existingUser = await _userRepository.GetByIdAsync(id);
                if (existingUser == null)
                {
                    _logger.LogWarning("User {UserId} not found for update", id);
                    return null;
                }

                var emailChanged = !string.Equals(existingUser.Email, request.Email, StringComparison.OrdinalIgnoreCase);

                // Update user properties
                existingUser.FirstName = request.FirstName.Trim();
                existingUser.LastName = request.LastName.Trim();
                existingUser.Email = request.Email.Trim().ToLowerInvariant();
                existingUser.PhoneNumber = request.PhoneNumber?.Trim();
                existingUser.UpdatedAt = DateTime.UtcNow;

                var updatedUser = await _userRepository.UpdateAsync(existingUser);

                // Clear caches
                ClearUserCaches(id);

                // Send email verification if email changed
                if (emailChanged)
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _emailService.SendEmailVerificationAsync(updatedUser.Email, updatedUser.FirstName);
                            _logger.LogInformation("Email verification sent to new address {UserEmail}", updatedUser.Email);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to send email verification to {UserEmail}", updatedUser.Email);
                        }
                    });
                }

                var userResponse = MapToUserResponse(updatedUser);

                _logger.LogInformation("Successfully updated user {UserId}", id);
                return userResponse;
            }
            catch (Exception ex) when (!(ex is ValidationException))
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                throw new ServiceException($"An error occurred while updating user {id}", ex);
            }
        }

        /// <summary>
        /// Deletes a user
        /// </summary>
        public async Task<bool> DeleteUserAsync(int id)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Operation"] = "DeleteUser",
                ["UserId"] = id
            });

            try
            {
                _logger.LogInformation("Deleting user {UserId}", id);

                ValidateUserId(id);

                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found for deletion", id);
                    return false;
                }

                // Soft delete approach
                user.IsActive = false;
                user.DeletedAt = DateTime.UtcNow;
                await _userRepository.UpdateAsync(user);

                // Alternative: Hard delete
                // await _userRepository.DeleteAsync(id);

                // Clear caches
                ClearUserCaches(id);

                _logger.LogInformation("Successfully deleted user {UserId} ({UserEmail})", id, user.Email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                throw new ServiceException($"An error occurred while deleting user {id}", ex);
            }
        }

        /// <summary>
        /// Gets user statistics
        /// </summary>
        public async Task<UserStatisticsResponse> GetUserStatisticsAsync()
        {
            try
            {
                _logger.LogInformation("Retrieving user statistics");

                const string cacheKey = "user_statistics";
                if (_cache.TryGetValue(cacheKey, out UserStatisticsResponse? cachedStats))
                {
                    return cachedStats;
                }

                var stats = await _userRepository.GetStatisticsAsync();

                var response = new UserStatisticsResponse
                {
                    TotalUsers = stats.TotalUsers,
                    ActiveUsers = stats.ActiveUsers,
                    NewUsersThisMonth = stats.NewUsersThisMonth,
                    LastUpdateTime = DateTime.UtcNow
                };

                _cache.Set(cacheKey, response, TimeSpan.FromMinutes(10));

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user statistics");
                throw new ServiceException("An error occurred while retrieving user statistics", ex);
            }
        }

        /// <summary>
        /// Searches users by criteria
        /// </summary>
        public async Task<List<UserResponse>> SearchUsersAsync(UserSearchCriteria criteria)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Operation"] = "SearchUsers"
            });

            try
            {
                _logger.LogInformation("Searching users with criteria");

                var users = await _userRepository.SearchAsync(criteria);
                var userResponses = users.Select(MapToUserResponse).ToList();

                _logger.LogInformation("Found {UserCount} users matching criteria", userResponses.Count);
                return userResponses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching users");
                throw new ServiceException("An error occurred while searching users", ex);
            }
        }

        #region Private Methods

        private UserResponse MapToUserResponse(User user)
        {
            return new UserResponse
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = $"{user.FirstName} {user.LastName}",
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }

        private async Task ValidateCreateUserRequest(CreateUserRequest request)
        {
            // Check for duplicate email
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new DuplicateEmailException($"User with email '{request.Email}' already exists");
            }

            // Additional business validations
            if (!IsValidDomain(request.Email))
            {
                throw new ValidationException($"Email domain '{GetDomain(request.Email)}' is not allowed");
            }
        }

        private async Task ValidateUpdateUserRequest(UpdateUserRequest request, int userId)
        {
            // Check for duplicate email (excluding current user)
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null && existingUser.Id != userId)
            {
                throw new DuplicateEmailException($"Email '{request.Email}' is already in use by another user");
            }

            if (!IsValidDomain(request.Email))
            {
                throw new ValidationException($"Email domain '{GetDomain(request.Email)}' is not allowed");
            }
        }

        private static void ValidateUserId(int id)
        {
            if (id <= 0)
            {
                throw new ValidationException("User ID must be a positive number");
            }
        }

        private static void ValidatePaginationParameters(int page, int pageSize)
        {
            if (page < 1)
            {
                throw new ValidationException("Page number must be greater than 0");
            }

            if (pageSize < 1 || pageSize > 100)
            {
                throw new ValidationException("Page size must be between 1 and 100");
            }
        }

        private bool IsValidDomain(string email)
        {
            if (_userSettings.AllowedDomains?.Any() != true)
            {
                return true; // No domain restrictions
            }

            var domain = GetDomain(email);
            return _userSettings.AllowedDomains.Contains(domain, StringComparer.OrdinalIgnoreCase);
        }

        private static string GetDomain(string email)
        {
            var atIndex = email.LastIndexOf('@');
            return atIndex > 0 ? email.Substring(atIndex + 1) : "";
        }

        private void ClearUsersCaches()
        {
            // Clear all user-related cache entries
            var cacheKeys = new List<string> { USERS_CACHE_KEY };
            
            // Add more specific cache keys if needed
            foreach (var key in cacheKeys)
            {
                _cache.Remove(key);
            }

            _logger.LogDebug("Cleared users caches");
        }

        private void ClearUserCaches(int userId)
        {
            var cacheKey = $"{USER_CACHE_KEY_PREFIX}{userId}";
            _cache.Remove(cacheKey);
            ClearUsersCaches(); // Also clear list caches
            
            _logger.LogDebug("Cleared cache for user {UserId}", userId);
        }

        #endregion
    }
}
```

### Service Interface Definition

```csharp
using MyApp.Models.Requests;
using MyApp.Models.Responses;

namespace MyApp.Core.Interfaces.Services
{
    /// <summary>
    /// Interface for user service operations
    /// </summary>
    public interface IUserService
    {
        Task<PagedResponse<UserResponse>> GetUsersAsync(string? search = null, int page = 1, int pageSize = 10);
        Task<UserResponse?> GetUserByIdAsync(int id);
        Task<UserResponse> CreateUserAsync(CreateUserRequest request);
        Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request);
        Task<bool> DeleteUserAsync(int id);
        Task<UserStatisticsResponse> GetUserStatisticsAsync();
        Task<List<UserResponse>> SearchUsersAsync(UserSearchCriteria criteria);
    }
}
```

### Dependency Injection Registration

```csharp
// Program.cs or Extension method
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBusinessServices(this IServiceCollection services)
    {
        // Register services
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IProductService, ProductService>();
        
        // Register repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        
        // Add memory cache
        services.AddMemoryCache();
        
        // Add configuration
        services.Configure<UserSettings>(configuration.GetSection("UserSettings"));
        
        return services;
    }
}
```

### Custom Exceptions

```csharp
namespace MyApp.Core.Exceptions
{
    public class ServiceException : Exception
    {
        public ServiceException(string message) : base(message) { }
        public ServiceException(string message, Exception innerException) : base(message, innerException) { }
    }

    public class ValidationException : Exception
    {
        public ValidationException(string message) : base(message) { }
    }

    public class DuplicateEmailException : Exception
    {
        public DuplicateEmailException(string message) : base(message) { }
    }

    public class UserNotFoundException : Exception
    {
        public UserNotFoundException(string message) : base(message) { }
    }
}
```

I'll generate a comprehensive service layer with proper business logic, error handling, caching, logging, validation, and dependency injection following clean architecture and SOLID principles.