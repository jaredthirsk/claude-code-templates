# Model and DTO Command

Generate data transfer objects (DTOs), request/response models, and validation attributes for ASP.NET Core Web API.

## Usage

**Create model for entity:**
```bash
# Create User-related models (request, response, etc.)
# /model User
```

**Create specific model types:**
```bash
# /model $ARGUMENTS --request --response --validation
```

## Implementation

I'll create comprehensive data models including request DTOs, response DTOs, validation attributes, and mapping configurations following API design best practices.

### Model Generation Strategy

1. **Analyze entity structure and API requirements**
2. **Generate request models with validation**
3. **Create response models with proper serialization**
4. **Implement model mapping and conversion**
5. **Add comprehensive validation attributes**

### Complete Model Set

#### Request Models

```csharp
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MyApp.Models.Requests
{
    /// <summary>
    /// Request model for creating a new user
    /// </summary>
    public class CreateUserRequest
    {
        /// <summary>
        /// User's first name
        /// </summary>
        [Required(ErrorMessage = "First name is required")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "First name must be between 2 and 50 characters")]
        [RegularExpression(@"^[a-zA-Z\s\-'\.]+$", ErrorMessage = "First name contains invalid characters")]
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// User's last name
        /// </summary>
        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Last name must be between 2 and 50 characters")]
        [RegularExpression(@"^[a-zA-Z\s\-'\.]+$", ErrorMessage = "Last name contains invalid characters")]
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// User's email address
        /// </summary>
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// User's phone number (optional)
        /// </summary>
        [Phone(ErrorMessage = "Invalid phone number format")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// User's date of birth (optional)
        /// </summary>
        [DataType(DataType.Date)]
        [AgeValidation(MinAge = 13, MaxAge = 120, ErrorMessage = "Age must be between 13 and 120 years")]
        public DateTime? DateOfBirth { get; set; }

        /// <summary>
        /// User's preferred language code (e.g., "en-US", "es-ES")
        /// </summary>
        [StringLength(10, ErrorMessage = "Language code cannot exceed 10 characters")]
        [RegularExpression(@"^[a-z]{2}-[A-Z]{2}$", ErrorMessage = "Invalid language code format (expected: xx-XX)")]
        public string? LanguageCode { get; set; } = "en-US";
    }

    /// <summary>
    /// Request model for updating an existing user
    /// </summary>
    public class UpdateUserRequest
    {
        /// <summary>
        /// User's first name
        /// </summary>
        [Required(ErrorMessage = "First name is required")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "First name must be between 2 and 50 characters")]
        [RegularExpression(@"^[a-zA-Z\s\-'\.]+$", ErrorMessage = "First name contains invalid characters")]
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// User's last name
        /// </summary>
        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Last name must be between 2 and 50 characters")]
        [RegularExpression(@"^[a-zA-Z\s\-'\.]+$", ErrorMessage = "Last name contains invalid characters")]
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// User's email address
        /// </summary>
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// User's phone number (optional)
        /// </summary>
        [Phone(ErrorMessage = "Invalid phone number format")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// User's date of birth (optional)
        /// </summary>
        [DataType(DataType.Date)]
        [AgeValidation(MinAge = 13, MaxAge = 120, ErrorMessage = "Age must be between 13 and 120 years")]
        public DateTime? DateOfBirth { get; set; }

        /// <summary>
        /// User's preferred language code
        /// </summary>
        [StringLength(10, ErrorMessage = "Language code cannot exceed 10 characters")]
        [RegularExpression(@"^[a-z]{2}-[A-Z]{2}$", ErrorMessage = "Invalid language code format (expected: xx-XX)")]
        public string? LanguageCode { get; set; }
    }

    /// <summary>
    /// Request model for user search operations
    /// </summary>
    public class UserSearchRequest
    {
        /// <summary>
        /// Search term for name or email
        /// </summary>
        [StringLength(100, ErrorMessage = "Search term cannot exceed 100 characters")]
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by active/inactive users
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// Filter by users created after this date
        /// </summary>
        [DataType(DataType.Date)]
        public DateTime? CreatedAfter { get; set; }

        /// <summary>
        /// Filter by users created before this date
        /// </summary>
        [DataType(DataType.Date)]
        public DateTime? CreatedBefore { get; set; }

        /// <summary>
        /// Page number for pagination
        /// </summary>
        [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than 0")]
        public int Page { get; set; } = 1;

        /// <summary>
        /// Number of items per page
        /// </summary>
        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 10;

        /// <summary>
        /// Field to sort by
        /// </summary>
        [AllowedValues("firstName", "lastName", "email", "createdAt", "updatedAt")]
        public string SortBy { get; set; } = "createdAt";

        /// <summary>
        /// Sort direction (asc/desc)
        /// </summary>
        [AllowedValues("asc", "desc")]
        public string SortDirection { get; set; } = "desc";
    }

    /// <summary>
    /// Request model for bulk user operations
    /// </summary>
    public class BulkUserRequest
    {
        /// <summary>
        /// List of user IDs to perform bulk operation on
        /// </summary>
        [Required(ErrorMessage = "User IDs are required")]
        [MinLength(1, ErrorMessage = "At least one user ID is required")]
        [MaxLength(100, ErrorMessage = "Cannot process more than 100 users at once")]
        public List<int> UserIds { get; set; } = new();

        /// <summary>
        /// Operation to perform (activate, deactivate, delete)
        /// </summary>
        [Required(ErrorMessage = "Operation is required")]
        [AllowedValues("activate", "deactivate", "delete")]
        public string Operation { get; set; } = string.Empty;

        /// <summary>
        /// Reason for the bulk operation (optional)
        /// </summary>
        [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
        public string? Reason { get; set; }
    }
}
```

#### Response Models

```csharp
using System.Text.Json.Serialization;

namespace MyApp.Models.Responses
{
    /// <summary>
    /// Response model for user data
    /// </summary>
    public class UserResponse
    {
        /// <summary>
        /// Unique user identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User's first name
        /// </summary>
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// User's last name
        /// </summary>
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// User's full name (computed property)
        /// </summary>
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// User's email address
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// User's phone number
        /// </summary>
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// User's date of birth
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? DateOfBirth { get; set; }

        /// <summary>
        /// User's age (computed from date of birth)
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? Age { get; set; }

        /// <summary>
        /// User's preferred language code
        /// </summary>
        public string? LanguageCode { get; set; }

        /// <summary>
        /// Indicates if the user account is active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Indicates if the user's email is verified
        /// </summary>
        public bool IsEmailVerified { get; set; }

        /// <summary>
        /// Date when the user was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Date when the user was last updated
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Date when the user last logged in
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? LastLoginAt { get; set; }
    }

    /// <summary>
    /// Simplified user response for list views
    /// </summary>
    public class UserSummaryResponse
    {
        /// <summary>
        /// Unique user identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User's full name
        /// </summary>
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// User's email address
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Indicates if the user account is active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Date when the user was created
        /// </summary>
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Response model for paginated results
    /// </summary>
    /// <typeparam name="T">Type of items in the collection</typeparam>
    public class PagedResponse<T>
    {
        /// <summary>
        /// Collection of items for the current page
        /// </summary>
        public List<T> Data { get; set; } = new();

        /// <summary>
        /// Current page number (1-based)
        /// </summary>
        public int Page { get; set; }

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Total number of items across all pages
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages { get; set; }

        /// <summary>
        /// Indicates if there's a previous page
        /// </summary>
        public bool HasPreviousPage => Page > 1;

        /// <summary>
        /// Indicates if there's a next page
        /// </summary>
        public bool HasNextPage => Page < TotalPages;

        /// <summary>
        /// Navigation metadata
        /// </summary>
        public PaginationMetadata Pagination => new()
        {
            CurrentPage = Page,
            PageSize = PageSize,
            TotalCount = TotalCount,
            TotalPages = TotalPages,
            HasPreviousPage = HasPreviousPage,
            HasNextPage = HasNextPage
        };
    }

    /// <summary>
    /// Pagination metadata
    /// </summary>
    public class PaginationMetadata
    {
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }
    }

    /// <summary>
    /// Response model for user statistics
    /// </summary>
    public class UserStatisticsResponse
    {
        /// <summary>
        /// Total number of users in the system
        /// </summary>
        public int TotalUsers { get; set; }

        /// <summary>
        /// Number of active users
        /// </summary>
        public int ActiveUsers { get; set; }

        /// <summary>
        /// Number of inactive users
        /// </summary>
        public int InactiveUsers { get; set; }

        /// <summary>
        /// Number of users created this month
        /// </summary>
        public int NewUsersThisMonth { get; set; }

        /// <summary>
        /// Number of users created last month
        /// </summary>
        public int NewUsersLastMonth { get; set; }

        /// <summary>
        /// Growth percentage compared to last month
        /// </summary>
        public decimal GrowthPercentage { get; set; }

        /// <summary>
        /// Date when statistics were calculated
        /// </summary>
        public DateTime CalculatedAt { get; set; }
    }

    /// <summary>
    /// Response model for bulk operations
    /// </summary>
    public class BulkOperationResponse
    {
        /// <summary>
        /// Number of items successfully processed
        /// </summary>
        public int SuccessCount { get; set; }

        /// <summary>
        /// Number of items that failed to process
        /// </summary>
        public int FailureCount { get; set; }

        /// <summary>
        /// Total number of items processed
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// List of errors encountered during processing
        /// </summary>
        public List<BulkOperationError> Errors { get; set; } = new();

        /// <summary>
        /// Indicates if the operation was completely successful
        /// </summary>
        public bool IsSuccess => FailureCount == 0;
    }

    /// <summary>
    /// Error details for bulk operations
    /// </summary>
    public class BulkOperationError
    {
        /// <summary>
        /// Identifier of the item that failed
        /// </summary>
        public int ItemId { get; set; }

        /// <summary>
        /// Error message
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Error code for programmatic handling
        /// </summary>
        public string? ErrorCode { get; set; }
    }
}
```

#### Custom Validation Attributes

```csharp
using System.ComponentModel.DataAnnotations;

namespace MyApp.Models.Validation
{
    /// <summary>
    /// Validates age based on date of birth
    /// </summary>
    public class AgeValidationAttribute : ValidationAttribute
    {
        public int MinAge { get; set; } = 0;
        public int MaxAge { get; set; } = 150;

        protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
        {
            if (value is not DateTime dateOfBirth)
            {
                return ValidationResult.Success!; // Let Required attribute handle null/empty
            }

            var age = CalculateAge(dateOfBirth);

            if (age < MinAge || age > MaxAge)
            {
                return new ValidationResult(ErrorMessage ?? $"Age must be between {MinAge} and {MaxAge} years.");
            }

            return ValidationResult.Success!;
        }

        private static int CalculateAge(DateTime dateOfBirth)
        {
            var today = DateTime.Today;
            var age = today.Year - dateOfBirth.Year;
            
            if (dateOfBirth.Date > today.AddYears(-age))
                age--;
                
            return age;
        }
    }

    /// <summary>
    /// Validates that a value is in the allowed list
    /// </summary>
    public class AllowedValuesAttribute : ValidationAttribute
    {
        private readonly string[] _allowedValues;

        public AllowedValuesAttribute(params string[] allowedValues)
        {
            _allowedValues = allowedValues;
        }

        protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null)
            {
                return ValidationResult.Success!; // Let Required attribute handle null
            }

            var stringValue = value.ToString();
            if (_allowedValues.Contains(stringValue, StringComparer.OrdinalIgnoreCase))
            {
                return ValidationResult.Success!;
            }

            return new ValidationResult(ErrorMessage ?? $"Value must be one of: {string.Join(", ", _allowedValues)}");
        }
    }

    /// <summary>
    /// Validates that a string doesn't contain forbidden words
    /// </summary>
    public class NoForbiddenWordsAttribute : ValidationAttribute
    {
        private readonly string[] _forbiddenWords;

        public NoForbiddenWordsAttribute(params string[] forbiddenWords)
        {
            _forbiddenWords = forbiddenWords.Select(w => w.ToLowerInvariant()).ToArray();
        }

        protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
        {
            if (value?.ToString() is not string stringValue)
            {
                return ValidationResult.Success!;
            }

            var lowerValue = stringValue.ToLowerInvariant();
            var foundWord = _forbiddenWords.FirstOrDefault(word => lowerValue.Contains(word));

            if (foundWord != null)
            {
                return new ValidationResult(ErrorMessage ?? $"Text cannot contain forbidden word: {foundWord}");
            }

            return ValidationResult.Success!;
        }
    }

    /// <summary>
    /// Validates that a file upload meets size and type requirements
    /// </summary>
    public class FileValidationAttribute : ValidationAttribute
    {
        public long MaxSizeInBytes { get; set; } = 5 * 1024 * 1024; // 5MB default
        public string[]? AllowedExtensions { get; set; }
        public string[]? AllowedContentTypes { get; set; }

        protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
        {
            if (value is not IFormFile file)
            {
                return ValidationResult.Success!;
            }

            // Check file size
            if (file.Length > MaxSizeInBytes)
            {
                var maxSizeMB = MaxSizeInBytes / (1024 * 1024);
                return new ValidationResult($"File size cannot exceed {maxSizeMB}MB");
            }

            // Check file extension
            if (AllowedExtensions?.Length > 0)
            {
                var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
                if (!AllowedExtensions.Contains(extension))
                {
                    return new ValidationResult($"File extension must be one of: {string.Join(", ", AllowedExtensions)}");
                }
            }

            // Check content type
            if (AllowedContentTypes?.Length > 0)
            {
                if (!AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
                {
                    return new ValidationResult($"File type must be one of: {string.Join(", ", AllowedContentTypes)}");
                }
            }

            return ValidationResult.Success!;
        }
    }
}
```

#### Model Mapping Extensions

```csharp
using MyApp.Core.Entities;
using MyApp.Models.Requests;
using MyApp.Models.Responses;

namespace MyApp.Models.Extensions
{
    /// <summary>
    /// Extension methods for model mapping
    /// </summary>
    public static class ModelMappingExtensions
    {
        /// <summary>
        /// Maps User entity to UserResponse
        /// </summary>
        public static UserResponse ToResponse(this User user)
        {
            return new UserResponse
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                DateOfBirth = user.DateOfBirth,
                Age = user.DateOfBirth?.CalculateAge(),
                LanguageCode = user.LanguageCode,
                IsActive = user.IsActive,
                IsEmailVerified = user.IsEmailVerified,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt
            };
        }

        /// <summary>
        /// Maps User entity to UserSummaryResponse
        /// </summary>
        public static UserSummaryResponse ToSummaryResponse(this User user)
        {
            return new UserSummaryResponse
            {
                Id = user.Id,
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                Email = user.Email,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };
        }

        /// <summary>
        /// Maps CreateUserRequest to User entity
        /// </summary>
        public static User ToEntity(this CreateUserRequest request)
        {
            return new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = request.Email.Trim().ToLowerInvariant(),
                PhoneNumber = request.PhoneNumber?.Trim(),
                DateOfBirth = request.DateOfBirth,
                LanguageCode = request.LanguageCode?.Trim(),
                IsActive = true,
                IsEmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Updates User entity from UpdateUserRequest
        /// </summary>
        public static void UpdateFromRequest(this User user, UpdateUserRequest request)
        {
            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            user.Email = request.Email.Trim().ToLowerInvariant();
            user.PhoneNumber = request.PhoneNumber?.Trim();
            user.DateOfBirth = request.DateOfBirth;
            user.LanguageCode = request.LanguageCode?.Trim();
            user.UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Calculates age from date of birth
        /// </summary>
        public static int CalculateAge(this DateTime dateOfBirth)
        {
            var today = DateTime.Today;
            var age = today.Year - dateOfBirth.Year;
            
            if (dateOfBirth.Date > today.AddYears(-age))
                age--;
                
            return age;
        }

        /// <summary>
        /// Creates a paged response from a collection
        /// </summary>
        public static PagedResponse<T> ToPagedResponse<T>(
            this IEnumerable<T> items, 
            int page, 
            int pageSize, 
            int totalCount)
        {
            return new PagedResponse<T>
            {
                Data = items.ToList(),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }
    }
}
```

I'll generate comprehensive data models with proper validation, serialization attributes, mapping methods, and follow API design best practices for request/response patterns.