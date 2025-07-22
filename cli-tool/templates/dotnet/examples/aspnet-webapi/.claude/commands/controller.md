# API Controller Command

Generate comprehensive ASP.NET Core Web API controllers with CRUD operations, validation, and proper HTTP responses.

## Usage

**Create basic controller:**
```bash
# Create controller for User entity
# /controller User
```

**Create controller with specific operations:**
```bash
# /controller $ARGUMENTS --with-crud --with-validation --with-swagger
```

## Implementation

I'll create a complete API controller with proper HTTP methods, status codes, validation, error handling, and OpenAPI documentation.

### Controller Generation Strategy

1. **Analyze entity/model structure**
2. **Generate controller with appropriate CRUD operations**
3. **Implement proper HTTP status codes and responses**
4. **Add input validation and error handling**
5. **Include comprehensive OpenAPI/Swagger documentation**

### Complete API Controller Example

```csharp
using Microsoft.AspNetCore.Mvc;
using MyApp.Services.Interfaces;
using MyApp.Models.Requests;
using MyApp.Models.Responses;
using System.ComponentModel.DataAnnotations;

namespace MyApp.Controllers
{
    /// <summary>
    /// Controller for managing users
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        /// <summary>
        /// Gets all users with optional filtering and pagination
        /// </summary>
        /// <param name="search">Optional search term</param>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 10)</param>
        /// <returns>Paginated list of users</returns>
        /// <response code="200">Returns the list of users</response>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResponse<UserResponse>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResponse<UserResponse>>> GetUsers(
            [FromQuery] string? search = null,
            [FromQuery, Range(1, int.MaxValue)] int page = 1,
            [FromQuery, Range(1, 100)] int pageSize = 10)
        {
            _logger.LogInformation("Getting users: page={Page}, pageSize={PageSize}, search={Search}", 
                page, pageSize, search);

            try
            {
                var result = await _userService.GetUsersAsync(search, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new ProblemDetails 
                { 
                    Title = "An error occurred while retrieving users" 
                });
            }
        }

        /// <summary>
        /// Gets a specific user by ID
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <returns>User details</returns>
        /// <response code="200">Returns the user</response>
        /// <response code="404">User not found</response>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UserResponse>> GetUser(int id)
        {
            _logger.LogInformation("Getting user {UserId}", id);

            try
            {
                var user = await _userService.GetUserByIdAsync(id);
                
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found", id);
                    return NotFound(new ProblemDetails
                    {
                        Title = "User not found",
                        Detail = $"User with ID {id} was not found"
                    });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user {UserId}", id);
                return StatusCode(500, new ProblemDetails 
                { 
                    Title = "An error occurred while retrieving the user" 
                });
            }
        }

        /// <summary>
        /// Creates a new user
        /// </summary>
        /// <param name="request">User creation request</param>
        /// <returns>Created user</returns>
        /// <response code="201">User created successfully</response>
        /// <response code="400">Invalid input data</response>
        /// <response code="409">User with email already exists</response>
        [HttpPost]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<UserResponse>> CreateUser([FromBody] CreateUserRequest request)
        {
            _logger.LogInformation("Creating user with email {Email}", request.Email);

            if (!ModelState.IsValid)
            {
                return BadRequest(new ValidationProblemDetails(ModelState));
            }

            try
            {
                var user = await _userService.CreateUserAsync(request);
                
                _logger.LogInformation("Successfully created user {UserId}", user.Id);
                
                return CreatedAtAction(
                    nameof(GetUser), 
                    new { id = user.Id }, 
                    user);
            }
            catch (DuplicateEmailException ex)
            {
                _logger.LogWarning(ex, "Attempt to create user with duplicate email {Email}", request.Email);
                return Conflict(new ProblemDetails
                {
                    Title = "Email already exists",
                    Detail = $"A user with email '{request.Email}' already exists"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user with email {Email}", request.Email);
                return StatusCode(500, new ProblemDetails 
                { 
                    Title = "An error occurred while creating the user" 
                });
            }
        }

        /// <summary>
        /// Updates an existing user
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <param name="request">User update request</param>
        /// <returns>Updated user</returns>
        /// <response code="200">User updated successfully</response>
        /// <response code="400">Invalid input data</response>
        /// <response code="404">User not found</response>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UserResponse>> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            _logger.LogInformation("Updating user {UserId}", id);

            if (!ModelState.IsValid)
            {
                return BadRequest(new ValidationProblemDetails(ModelState));
            }

            try
            {
                var user = await _userService.UpdateUserAsync(id, request);
                
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found for update", id);
                    return NotFound(new ProblemDetails
                    {
                        Title = "User not found",
                        Detail = $"User with ID {id} was not found"
                    });
                }

                _logger.LogInformation("Successfully updated user {UserId}", id);
                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, new ProblemDetails 
                { 
                    Title = "An error occurred while updating the user" 
                });
            }
        }

        /// <summary>
        /// Partially updates a user
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <param name="patchDoc">JSON patch document</param>
        /// <returns>Updated user</returns>
        /// <response code="200">User updated successfully</response>
        /// <response code="400">Invalid patch document</response>
        /// <response code="404">User not found</response>
        [HttpPatch("{id:int}")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UserResponse>> PatchUser(int id, 
            [FromBody] JsonPatchDocument<UpdateUserRequest> patchDoc)
        {
            _logger.LogInformation("Patching user {UserId}", id);

            if (patchDoc == null)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Invalid patch document",
                    Detail = "Patch document cannot be null"
                });
            }

            try
            {
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound(new ProblemDetails
                    {
                        Title = "User not found",
                        Detail = $"User with ID {id} was not found"
                    });
                }

                var userToPatch = new UpdateUserRequest
                {
                    FirstName = existingUser.FirstName,
                    LastName = existingUser.LastName,
                    Email = existingUser.Email
                };

                patchDoc.ApplyTo(userToPatch, ModelState);

                if (!ModelState.IsValid)
                {
                    return BadRequest(new ValidationProblemDetails(ModelState));
                }

                var updatedUser = await _userService.UpdateUserAsync(id, userToPatch);
                return Ok(updatedUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error patching user {UserId}", id);
                return StatusCode(500, new ProblemDetails 
                { 
                    Title = "An error occurred while updating the user" 
                });
            }
        }

        /// <summary>
        /// Deletes a user
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <returns>No content</returns>
        /// <response code="204">User deleted successfully</response>
        /// <response code="404">User not found</response>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            _logger.LogInformation("Deleting user {UserId}", id);

            try
            {
                var success = await _userService.DeleteUserAsync(id);
                
                if (!success)
                {
                    _logger.LogWarning("User {UserId} not found for deletion", id);
                    return NotFound(new ProblemDetails
                    {
                        Title = "User not found",
                        Detail = $"User with ID {id} was not found"
                    });
                }

                _logger.LogInformation("Successfully deleted user {UserId}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, new ProblemDetails 
                { 
                    Title = "An error occurred while deleting the user" 
                });
            }
        }

        /// <summary>
        /// Gets user statistics
        /// </summary>
        /// <returns>User statistics</returns>
        /// <response code="200">Returns user statistics</response>
        [HttpGet("statistics")]
        [ProducesResponseType(typeof(UserStatisticsResponse), StatusCodes.Status200OK)]
        public async Task<ActionResult<UserStatisticsResponse>> GetUserStatistics()
        {
            try
            {
                var statistics = await _userService.GetUserStatisticsAsync();
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user statistics");
                return StatusCode(500, new ProblemDetails 
                { 
                    Title = "An error occurred while retrieving statistics" 
                });
            }
        }

        /// <summary>
        /// Searches users by criteria
        /// </summary>
        /// <param name="criteria">Search criteria</param>
        /// <returns>Matching users</returns>
        /// <response code="200">Returns matching users</response>
        /// <response code="400">Invalid search criteria</response>
        [HttpPost("search")]
        [ProducesResponseType(typeof(List<UserResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<List<UserResponse>>> SearchUsers([FromBody] UserSearchCriteria criteria)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ValidationProblemDetails(ModelState));
            }

            try
            {
                var users = await _userService.SearchUsersAsync(criteria);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching users");
                return StatusCode(500, new ProblemDetails 
                { 
                    Title = "An error occurred while searching users" 
                });
            }
        }
    }
}
```

### API Controller Best Practices

**Base controller for common functionality:**
```csharp
[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected readonly ILogger _logger;

    protected BaseApiController(ILogger logger)
    {
        _logger = logger;
    }

    protected ActionResult<T> HandleResult<T>(T result) where T : class
    {
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    protected ActionResult HandleResult(bool result)
    {
        if (result) return Ok();
        return BadRequest();
    }

    protected IActionResult Problem(string title, string detail, int statusCode = 500)
    {
        return StatusCode(statusCode, new ProblemDetails
        {
            Title = title,
            Detail = detail,
            Status = statusCode
        });
    }
}
```

### Async Controller Patterns

**Async best practices:**
```csharp
// Good: Proper async implementation
[HttpGet("{id}")]
public async Task<ActionResult<UserResponse>> GetUser(int id, CancellationToken cancellationToken)
{
    var user = await _userService.GetUserByIdAsync(id, cancellationToken);
    return user == null ? NotFound() : Ok(user);
}

// Good: Multiple async operations
[HttpPost("bulk")]
public async Task<ActionResult> CreateBulkUsers([FromBody] List<CreateUserRequest> requests)
{
    var tasks = requests.Select(request => _userService.CreateUserAsync(request));
    var results = await Task.WhenAll(tasks);
    return Ok(results);
}
```

### Content Negotiation

**Multiple response formats:**
```csharp
[HttpGet("{id}")]
[Produces("application/json", "application/xml")]
public async Task<ActionResult<UserResponse>> GetUser(int id)
{
    var user = await _userService.GetUserByIdAsync(id);
    
    if (user == null)
        return NotFound();

    return Ok(user);
}

// Custom format handling
[HttpGet("{id}/export")]
public async Task<IActionResult> ExportUser(int id, [FromQuery] string format = "json")
{
    var user = await _userService.GetUserByIdAsync(id);
    if (user == null) return NotFound();

    return format.ToLowerInvariant() switch
    {
        "csv" => File(GenerateCsv(user), "text/csv", $"user-{id}.csv"),
        "xml" => Content(SerializeToXml(user), "application/xml"),
        _ => Ok(user)
    };
}
```

I'll generate a complete API controller based on your entity/model specifications with proper CRUD operations, validation, error handling, logging, and comprehensive OpenAPI documentation following ASP.NET Core best practices.