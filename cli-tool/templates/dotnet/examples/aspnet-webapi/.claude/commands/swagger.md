# Swagger/OpenAPI Documentation Command

Generate comprehensive API documentation using Swagger/OpenAPI with security schemes, examples, and advanced features.

## Usage

**Setup Swagger with authentication:**
```bash
# Setup Swagger with JWT authentication support
# /swagger --with-jwt --with-examples --with-versioning
```

**Configure OpenAPI documentation:**
```bash
# /swagger $ARGUMENTS --detailed --with-xml-comments
```

## Implementation

I'll create comprehensive OpenAPI documentation setup with JWT authentication, detailed schemas, examples, and API versioning support.

### Swagger Configuration Strategy

1. **Configure Swashbuckle with advanced options**
2. **Set up JWT authentication in Swagger UI**
3. **Generate detailed API documentation with examples**
4. **Implement API versioning support**
5. **Add XML comments and schema documentation**

### Complete Swagger Implementation

#### Program.cs Configuration

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add API versioning
builder.Services.AddApiVersioning(options =>
{
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new QueryStringApiVersionReader("version"),
        new HeaderApiVersionReader("X-Version"),
        new MediaTypeApiVersionReader("ver"));
});

builder.Services.AddVersionedApiExplorer(setup =>
{
    setup.GroupNameFormat = "'v'VVV";
    setup.SubstituteApiVersionInUrl = true;
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Basic API information
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "My API",
        Description = "A comprehensive ASP.NET Core Web API with authentication and authorization",
        TermsOfService = new Uri("https://example.com/terms"),
        Contact = new OpenApiContact
        {
            Name = "API Support",
            Email = "support@example.com",
            Url = new Uri("https://example.com/contact")
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    options.SwaggerDoc("v2", new OpenApiInfo
    {
        Version = "v2",
        Title = "My API V2",
        Description = "Version 2 of the comprehensive ASP.NET Core Web API"
    });

    // JWT Authentication configuration
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // API Key authentication (optional)
    options.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "API Key Authentication. Add 'X-API-Key' header with your API key.",
        Name = "X-API-Key",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    // Include XML comments
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // Custom schema mappings
    options.MapType<DateTime>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "date-time",
        Example = new Microsoft.OpenApi.Any.OpenApiString(DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
    });

    options.MapType<TimeSpan>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "duration",
        Example = new Microsoft.OpenApi.Any.OpenApiString("PT1H30M")
    });

    // Custom operation filters
    options.OperationFilter<AuthorizeCheckOperationFilter>();
    options.OperationFilter<SwaggerExcludeFilter>();
    options.DocumentFilter<SwaggerDocumentFilter>();

    // Schema filters
    options.SchemaFilter<SwaggerExcludePropertyFilter>();
    options.SchemaFilter<EnumSchemaFilter>();

    // Configure for API versioning
    options.DocInclusionPredicate((version, desc) =>
    {
        if (!desc.TryGetMethodInfo(out var methodInfo))
            return false;

        var versions = methodInfo.DeclaringType?
            .GetCustomAttributes<ApiVersionAttribute>(true)
            .SelectMany(attr => attr.Versions);

        var maps = methodInfo
            .GetCustomAttributes<MapToApiVersionAttribute>(true)
            .SelectMany(attr => attr.Versions)
            .ToArray();

        return versions?.Any(v => $"v{v}" == version) == true &&
               (!maps.Any() || maps.Any(v => $"v{v}" == version));
    });

    // Enable annotations
    options.EnableAnnotations();
});

var app = builder.Build();

// Configure Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(options =>
    {
        options.RouteTemplate = "api-docs/{documentName}/swagger.json";
    });
    
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/api-docs/v1/swagger.json", "My API V1");
        options.SwaggerEndpoint("/api-docs/v2/swagger.json", "My API V2");
        
        options.RoutePrefix = "api-docs";
        options.DocumentTitle = "My API Documentation";
        options.DefaultModelsExpandDepth(2);
        options.DefaultModelRendering(Swashbuckle.AspNetCore.SwaggerUI.ModelRendering.Model);
        options.DisplayOperationId();
        options.DisplayRequestDuration();
        options.EnableDeepLinking();
        options.EnableFilter();
        options.ShowExtensions();
        options.ShowCommonExtensions();
        options.EnableValidator();
        
        // Inject custom CSS
        options.InjectStylesheet("/swagger-ui/custom.css");
        
        // Inject custom JavaScript
        options.InjectJavascript("/swagger-ui/custom.js");
        
        // OAuth2 configuration (if needed)
        options.OAuthClientId("swagger-ui");
        options.OAuthAppName("Swagger UI");
        options.OAuthScopeSeparator(" ");
        options.OAuthUsePkce();
    });
}

// Serve static files for Swagger UI customization
app.UseStaticFiles();

app.Run();
```

#### Custom Swagger Filters

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;

namespace MyApp.Swagger.Filters
{
    /// <summary>
    /// Adds authorization information to Swagger operations
    /// </summary>
    public class AuthorizeCheckOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var hasAuthorize = context.MethodInfo.DeclaringType?.GetCustomAttributes<AuthorizeAttribute>(true).Any() == true ||
                              context.MethodInfo.GetCustomAttributes<AuthorizeAttribute>(true).Any();

            if (hasAuthorize)
            {
                operation.Responses.TryAdd("401", new OpenApiResponse { Description = "Unauthorized" });
                operation.Responses.TryAdd("403", new OpenApiResponse { Description = "Forbidden" });

                var authAttributes = context.MethodInfo.GetCustomAttributes<AuthorizeAttribute>(true)
                    .Union(context.MethodInfo.DeclaringType?.GetCustomAttributes<AuthorizeAttribute>(true) ?? Array.Empty<AuthorizeAttribute>());

                var roles = authAttributes
                    .Where(a => !string.IsNullOrEmpty(a.Roles))
                    .SelectMany(a => a.Roles!.Split(','))
                    .Select(r => r.Trim())
                    .Distinct()
                    .ToList();

                var policies = authAttributes
                    .Where(a => !string.IsNullOrEmpty(a.Policy))
                    .Select(a => a.Policy!)
                    .Distinct()
                    .ToList();

                var description = new List<string>();
                
                if (roles.Any())
                {
                    description.Add($"**Required Roles:** {string.Join(", ", roles)}");
                }

                if (policies.Any())
                {
                    description.Add($"**Required Policies:** {string.Join(", ", policies)}");
                }

                if (description.Any())
                {
                    operation.Description = (operation.Description ?? "") + "\n\n" + string.Join("\n", description);
                }

                operation.Security = new List<OpenApiSecurityRequirement>
                {
                    new()
                    {
                        {
                            new OpenApiSecurityScheme
                            {
                                Reference = new OpenApiReference
                                {
                                    Type = ReferenceType.SecurityScheme,
                                    Id = "Bearer"
                                }
                            },
                            Array.Empty<string>()
                        }
                    }
                };
            }

            var allowAnonymous = context.MethodInfo.GetCustomAttributes<AllowAnonymousAttribute>(true).Any();
            if (allowAnonymous)
            {
                operation.Security?.Clear();
                operation.Description = (operation.Description ?? "") + "\n\n**Note:** This endpoint allows anonymous access.";
            }
        }
    }

    /// <summary>
    /// Excludes properties marked with SwaggerExclude attribute
    /// </summary>
    public class SwaggerExcludePropertyFilter : ISchemaFilter
    {
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (schema.Properties == null || context.Type == null)
                return;

            var excludedProperties = context.Type.GetProperties()
                .Where(prop => prop.GetCustomAttribute<SwaggerExcludeAttribute>() != null)
                .Select(prop => prop.Name.ToCamelCase())
                .ToList();

            foreach (var excludedProperty in excludedProperties)
            {
                if (schema.Properties.ContainsKey(excludedProperty))
                {
                    schema.Properties.Remove(excludedProperty);
                }
            }
        }
    }

    /// <summary>
    /// Excludes operations marked with SwaggerExclude attribute
    /// </summary>
    public class SwaggerExcludeFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var excludeAttribute = context.MethodInfo.GetCustomAttribute<SwaggerExcludeAttribute>();
            if (excludeAttribute != null)
            {
                // This will effectively hide the operation
                operation.Deprecated = true;
                operation.Summary = "[Hidden] " + (operation.Summary ?? "");
            }
        }
    }

    /// <summary>
    /// Improves enum documentation
    /// </summary>
    public class EnumSchemaFilter : ISchemaFilter
    {
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (context.Type.IsEnum)
            {
                schema.Type = "string";
                schema.Format = null;
                
                var enumNames = Enum.GetNames(context.Type);
                var enumValues = Enum.GetValues(context.Type);
                
                schema.Enum = enumNames
                    .Select(name => new Microsoft.OpenApi.Any.OpenApiString(name))
                    .Cast<Microsoft.OpenApi.Any.IOpenApiAny>()
                    .ToList();

                // Add description with enum values
                var descriptions = new List<string>();
                for (int i = 0; i < enumNames.Length; i++)
                {
                    var value = Convert.ToInt32(enumValues.GetValue(i));
                    descriptions.Add($"- **{enumNames[i]}** ({value})");
                }

                schema.Description = $"Possible values:\n{string.Join("\n", descriptions)}";
            }
        }
    }

    /// <summary>
    /// Document-level customizations
    /// </summary>
    public class SwaggerDocumentFilter : IDocumentFilter
    {
        public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
        {
            // Add custom servers
            swaggerDoc.Servers = new List<OpenApiServer>
            {
                new() { Url = "https://api.example.com", Description = "Production server" },
                new() { Url = "https://staging-api.example.com", Description = "Staging server" },
                new() { Url = "https://localhost:7001", Description = "Development server" }
            };

            // Remove unwanted schemas
            var schemasToRemove = new[] { "ProblemDetails", "ValidationProblemDetails" };
            foreach (var schemaToRemove in schemasToRemove)
            {
                swaggerDoc.Components.Schemas.Remove(schemaToRemove);
            }

            // Add global tags
            swaggerDoc.Tags = new List<OpenApiTag>
            {
                new() { Name = "Authentication", Description = "User authentication and authorization operations" },
                new() { Name = "Users", Description = "User management operations" },
                new() { Name = "Products", Description = "Product management operations" }
            };
        }
    }
}

/// <summary>
/// Attribute to exclude properties or operations from Swagger documentation
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Method)]
public class SwaggerExcludeAttribute : Attribute
{
}

/// <summary>
/// Extension methods for string manipulation
/// </summary>
public static class StringExtensions
{
    public static string ToCamelCase(this string str)
    {
        if (string.IsNullOrEmpty(str) || char.IsLower(str, 0))
            return str;

        return char.ToLowerInvariant(str[0]) + str[1..];
    }
}
```

#### Enhanced Controller Documentation

```csharp
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace MyApp.Controllers
{
    /// <summary>
    /// User management operations
    /// </summary>
    [ApiController]
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiVersion("1.0")]
    [ApiVersion("2.0")]
    [Tags("Users")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public class UsersController : ControllerBase
    {
        /// <summary>
        /// Retrieves a paginated list of users
        /// </summary>
        /// <param name="search">Optional search term to filter users by name or email</param>
        /// <param name="page">Page number (1-based)</param>
        /// <param name="pageSize">Number of items per page (1-100)</param>
        /// <param name="sortBy">Field to sort by</param>
        /// <param name="sortDirection">Sort direction (asc/desc)</param>
        /// <returns>A paginated list of users</returns>
        /// <remarks>
        /// Sample request:
        /// 
        ///     GET /api/v1/users?search=john&amp;page=1&amp;pageSize=10&amp;sortBy=firstName&amp;sortDirection=asc
        /// 
        /// This endpoint supports filtering, pagination, and sorting. Use the search parameter to find specific users.
        /// The response includes pagination metadata to help with navigation.
        /// </remarks>
        /// <response code="200">Returns the paginated list of users</response>
        /// <response code="400">Invalid pagination parameters</response>
        /// <response code="401">Unauthorized - JWT token required</response>
        [HttpGet]
        [SwaggerOperation(
            Summary = "Get users with pagination",
            Description = "Retrieves a paginated and filtered list of users with sorting options",
            OperationId = "GetUsers",
            Tags = new[] { "Users" }
        )]
        [SwaggerResponse(200, "Success", typeof(PagedResponse<UserResponse>), 
            Example = @"{
                ""data"": [
                    {
                        ""id"": 1,
                        ""firstName"": ""John"",
                        ""lastName"": ""Doe"",
                        ""email"": ""john.doe@example.com"",
                        ""isActive"": true,
                        ""createdAt"": ""2023-01-15T10:30:00Z""
                    }
                ],
                ""page"": 1,
                ""pageSize"": 10,
                ""totalCount"": 1,
                ""totalPages"": 1
            }")]
        [SwaggerResponse(400, "Bad Request", typeof(ValidationProblemDetails))]
        [SwaggerResponse(401, "Unauthorized", typeof(ProblemDetails))]
        public async Task<ActionResult<PagedResponse<UserResponse>>> GetUsers(
            [FromQuery, SwaggerParameter("Search term for filtering users")] string? search = null,
            [FromQuery, SwaggerParameter("Page number (minimum: 1)", Required = false)] int page = 1,
            [FromQuery, SwaggerParameter("Items per page (1-100)", Required = false)] int pageSize = 10,
            [FromQuery, SwaggerParameter("Sort field")] string sortBy = "createdAt",
            [FromQuery, SwaggerParameter("Sort direction")] string sortDirection = "desc")
        {
            // Implementation
            throw new NotImplementedException();
        }

        /// <summary>
        /// Creates a new user account
        /// </summary>
        /// <param name="request">User creation data</param>
        /// <returns>The created user</returns>
        /// <remarks>
        /// Sample request:
        /// 
        ///     POST /api/v1/users
        ///     {
        ///         "firstName": "Jane",
        ///         "lastName": "Smith",
        ///         "email": "jane.smith@example.com",
        ///         "phoneNumber": "+1-555-123-4567",
        ///         "dateOfBirth": "1990-05-15"
        ///     }
        /// 
        /// All fields except phoneNumber and dateOfBirth are required.
        /// Email addresses must be unique and valid.
        /// </remarks>
        [HttpPost]
        [SwaggerOperation(
            Summary = "Create a new user",
            Description = "Creates a new user account with the provided information",
            OperationId = "CreateUser"
        )]
        [SwaggerRequestExample(typeof(CreateUserRequest), typeof(CreateUserRequestExample))]
        [SwaggerResponse(201, "User created successfully", typeof(UserResponse))]
        [SwaggerResponse(400, "Invalid user data", typeof(ValidationProblemDetails))]
        [SwaggerResponse(409, "Email already exists", typeof(ProblemDetails))]
        public async Task<ActionResult<UserResponse>> CreateUser(
            [FromBody, SwaggerRequestBody("User creation data", Required = true)] CreateUserRequest request)
        {
            // Implementation
            throw new NotImplementedException();
        }
    }
}

/// <summary>
/// Example for CreateUserRequest
/// </summary>
public class CreateUserRequestExample : IExamplesProvider<CreateUserRequest>
{
    public CreateUserRequest GetExamples()
    {
        return new CreateUserRequest
        {
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane.smith@example.com",
            PhoneNumber = "+1-555-123-4567",
            DateOfBirth = new DateTime(1990, 5, 15)
        };
    }
}
```

#### Custom CSS and JavaScript

**wwwroot/swagger-ui/custom.css:**
```css
/* Custom Swagger UI styling */
.swagger-ui .topbar {
    background-color: #1b1b1b;
}

.swagger-ui .topbar .download-url-wrapper {
    display: none;
}

.swagger-ui .info .title {
    color: #3b4151;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.swagger-ui .scheme-container {
    padding: 30px 0;
    background-color: #fafafa;
}

.swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #49cc90;
}

.swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #1890ff;
}

.swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #ffc107;
}

.swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #f5222d;
}
```

**wwwroot/swagger-ui/custom.js:**
```javascript
// Custom Swagger UI functionality
window.onload = function() {
    // Add custom header
    const topbar = document.querySelector('.topbar');
    if (topbar) {
        const customHeader = document.createElement('div');
        customHeader.innerHTML = '<h2 style="color: white; margin: 0; padding: 10px;">My API Documentation</h2>';
        topbar.appendChild(customHeader);
    }

    // Auto-fill authorization header with example token
    setTimeout(() => {
        const authButton = document.querySelector('.authorize');
        if (authButton) {
            authButton.addEventListener('click', () => {
                setTimeout(() => {
                    const tokenInput = document.querySelector('input[placeholder*="Bearer"]');
                    if (tokenInput && !tokenInput.value) {
                        tokenInput.value = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
                        tokenInput.placeholder = 'Enter your JWT token here';
                    }
                }, 100);
            });
        }
    }, 1000);
};
```

I'll generate comprehensive Swagger/OpenAPI documentation with JWT authentication support, detailed examples, API versioning, custom styling, and advanced documentation features following OpenAPI 3.0 specifications.