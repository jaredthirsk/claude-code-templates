# Middleware Command

Generate custom ASP.NET Core middleware for cross-cutting concerns like logging, authentication, error handling, and request processing.

## Usage

**Create custom middleware:**
```bash
# Create middleware for request logging
# /middleware RequestLogging
```

**Create middleware with specific features:**
```bash
# /middleware $ARGUMENTS --with-logging --with-error-handling --with-performance
```

## Implementation

I'll create comprehensive middleware components with proper request/response handling, error management, and performance monitoring following ASP.NET Core patterns.

### Middleware Generation Strategy

1. **Analyze cross-cutting concern requirements**
2. **Generate middleware class with proper structure**
3. **Implement request/response processing logic**
4. **Add error handling and logging**
5. **Include performance monitoring and metrics**

### Complete Middleware Examples

#### Request Logging Middleware

```csharp
using Microsoft.Extensions.Primitives;
using System.Diagnostics;
using System.Text;

namespace MyApp.Middleware
{
    /// <summary>
    /// Middleware for comprehensive request/response logging
    /// </summary>
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;
        private readonly RequestLoggingOptions _options;

        public RequestLoggingMiddleware(
            RequestDelegate next,
            ILogger<RequestLoggingMiddleware> logger,
            IOptions<RequestLoggingOptions> options)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _options = options?.Value ?? new RequestLoggingOptions();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            var stopwatch = Stopwatch.StartNew();

            // Add request ID to response headers
            context.Response.Headers.Add("X-Request-Id", requestId);

            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["RequestId"] = requestId,
                ["RequestPath"] = context.Request.Path,
                ["RequestMethod"] = context.Request.Method
            });

            try
            {
                await LogRequestAsync(context, requestId);

                // Capture response body if needed
                var originalResponseStream = context.Response.Body;
                using var responseBuffer = new MemoryStream();
                
                if (_options.LogResponseBody)
                {
                    context.Response.Body = responseBuffer;
                }

                await _next(context);

                stopwatch.Stop();

                if (_options.LogResponseBody)
                {
                    responseBuffer.Seek(0, SeekOrigin.Begin);
                    await responseBuffer.CopyToAsync(originalResponseStream);
                    responseBuffer.Seek(0, SeekOrigin.Begin);
                }

                await LogResponseAsync(context, requestId, stopwatch.ElapsedMilliseconds, responseBuffer);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Request {RequestId} failed after {ElapsedMs}ms: {RequestMethod} {RequestPath}",
                    requestId, stopwatch.ElapsedMilliseconds, context.Request.Method, context.Request.Path);
                throw;
            }
        }

        private async Task LogRequestAsync(HttpContext context, string requestId)
        {
            var request = context.Request;
            
            var requestInfo = new
            {
                RequestId = requestId,
                Method = request.Method,
                Path = request.Path,
                QueryString = request.QueryString.ToString(),
                Headers = GetFilteredHeaders(request.Headers),
                ContentType = request.ContentType,
                ContentLength = request.ContentLength,
                RemoteIpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = request.Headers["User-Agent"].ToString(),
                UserId = context.User?.FindFirst("sub")?.Value,
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation("Request started: {RequestInfo}", requestInfo);

            // Log request body if configured and appropriate
            if (_options.LogRequestBody && ShouldLogRequestBody(request))
            {
                var requestBody = await ReadRequestBodyAsync(request);
                if (!string.IsNullOrEmpty(requestBody))
                {
                    _logger.LogDebug("Request {RequestId} body: {RequestBody}", requestId, requestBody);
                }
            }
        }

        private async Task LogResponseAsync(HttpContext context, string requestId, long elapsedMs, MemoryStream? responseBuffer)
        {
            var response = context.Response;
            
            var responseInfo = new
            {
                RequestId = requestId,
                StatusCode = response.StatusCode,
                ContentType = response.ContentType,
                ContentLength = response.ContentLength ?? responseBuffer?.Length,
                Headers = GetFilteredHeaders(response.Headers),
                ElapsedMs = elapsedMs,
                Timestamp = DateTime.UtcNow
            };

            var logLevel = GetLogLevel(response.StatusCode, elapsedMs);
            _logger.Log(logLevel, "Request completed: {ResponseInfo}", responseInfo);

            // Log response body if configured
            if (_options.LogResponseBody && responseBuffer != null && ShouldLogResponseBody(response))
            {
                var responseBody = await ReadStreamAsync(responseBuffer);
                if (!string.IsNullOrEmpty(responseBody))
                {
                    _logger.LogDebug("Response {RequestId} body: {ResponseBody}", requestId, responseBody);
                }
            }
        }

        private static LogLevel GetLogLevel(int statusCode, long elapsedMs)
        {
            return (statusCode, elapsedMs) switch
            {
                ( >= 500, _) => LogLevel.Error,
                ( >= 400, _) => LogLevel.Warning,
                (_, >= 5000) => LogLevel.Warning,
                (_, >= 2000) => LogLevel.Information,
                _ => LogLevel.Debug
            };
        }

        private Dictionary<string, string> GetFilteredHeaders(IHeaderDictionary headers)
        {
            var filteredHeaders = new Dictionary<string, string>();
            
            foreach (var header in headers)
            {
                if (_options.SensitiveHeaders.Contains(header.Key, StringComparer.OrdinalIgnoreCase))
                {
                    filteredHeaders[header.Key] = "[REDACTED]";
                }
                else
                {
                    filteredHeaders[header.Key] = string.Join(", ", header.Value);
                }
            }

            return filteredHeaders;
        }

        private static async Task<string> ReadRequestBodyAsync(HttpRequest request)
        {
            request.EnableBuffering();
            var buffer = new byte[Convert.ToInt32(request.ContentLength ?? 0)];
            await request.Body.ReadAsync(buffer, 0, buffer.Length);
            request.Body.Seek(0, SeekOrigin.Begin);
            return Encoding.UTF8.GetString(buffer);
        }

        private static async Task<string> ReadStreamAsync(Stream stream)
        {
            stream.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(stream, leaveOpen: true);
            var content = await reader.ReadToEndAsync();
            stream.Seek(0, SeekOrigin.Begin);
            return content;
        }

        private static bool ShouldLogRequestBody(HttpRequest request)
        {
            return request.ContentLength > 0 &&
                   request.ContentLength < 10240 && // Max 10KB
                   (request.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) == true ||
                    request.ContentType?.StartsWith("application/xml", StringComparison.OrdinalIgnoreCase) == true ||
                    request.ContentType?.StartsWith("text/", StringComparison.OrdinalIgnoreCase) == true);
        }

        private static bool ShouldLogResponseBody(HttpResponse response)
        {
            return response.ContentLength is > 0 and < 10240 && // Max 10KB
                   (response.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) == true ||
                    response.ContentType?.StartsWith("application/xml", StringComparison.OrdinalIgnoreCase) == true ||
                    response.ContentType?.StartsWith("text/", StringComparison.OrdinalIgnoreCase) == true);
        }
    }

    /// <summary>
    /// Configuration options for request logging middleware
    /// </summary>
    public class RequestLoggingOptions
    {
        public bool LogRequestBody { get; set; } = false;
        public bool LogResponseBody { get; set; } = false;
        public HashSet<string> SensitiveHeaders { get; set; } = new(StringComparer.OrdinalIgnoreCase)
        {
            "Authorization",
            "Cookie",
            "X-API-Key",
            "X-Auth-Token"
        };
    }
}
```

#### Exception Handling Middleware

```csharp
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text.Json;

namespace MyApp.Middleware
{
    /// <summary>
    /// Global exception handling middleware
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly ExceptionHandlingOptions _options;

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IWebHostEnvironment environment,
            IOptions<ExceptionHandlingOptions> options)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
            _options = options?.Value ?? new ExceptionHandlingOptions();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred. Request: {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            var (statusCode, problemDetails) = CreateProblemDetails(context, exception);
            
            context.Response.StatusCode = statusCode;

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var json = JsonSerializer.Serialize(problemDetails, options);
            await context.Response.WriteAsync(json);
        }

        private (int StatusCode, ProblemDetails ProblemDetails) CreateProblemDetails(
            HttpContext context, 
            Exception exception)
        {
            var requestId = context.Response.Headers["X-Request-Id"].FirstOrDefault() ?? 
                           Guid.NewGuid().ToString("N")[..8];

            return exception switch
            {
                ValidationException validationEx => CreateValidationProblem(context, validationEx, requestId),
                UnauthorizedAccessException => CreateUnauthorizedProblem(context, requestId),
                KeyNotFoundException or EntityNotFoundException => CreateNotFoundProblem(context, exception, requestId),
                DuplicateException => CreateConflictProblem(context, exception, requestId),
                BusinessRuleException businessEx => CreateBusinessRuleProblem(context, businessEx, requestId),
                _ => CreateInternalServerErrorProblem(context, exception, requestId)
            };
        }

        private (int, ProblemDetails) CreateValidationProblem(
            HttpContext context, 
            ValidationException exception, 
            string requestId)
        {
            var problemDetails = new ValidationProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Title = "One or more validation errors occurred.",
                Status = StatusCodes.Status400BadRequest,
                Instance = context.Request.Path,
                Extensions = { ["requestId"] = requestId }
            };

            if (exception.ValidationErrors?.Any() == true)
            {
                foreach (var error in exception.ValidationErrors)
                {
                    problemDetails.Errors.Add(error.Key, error.Value);
                }
            }
            else
            {
                problemDetails.Errors.Add("General", new[] { exception.Message });
            }

            return (StatusCodes.Status400BadRequest, problemDetails);
        }

        private (int, ProblemDetails) CreateUnauthorizedProblem(HttpContext context, string requestId)
        {
            var problemDetails = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7235#section-3.1",
                Title = "Unauthorized",
                Status = StatusCodes.Status401Unauthorized,
                Instance = context.Request.Path,
                Extensions = { ["requestId"] = requestId }
            };

            return (StatusCodes.Status401Unauthorized, problemDetails);
        }

        private (int, ProblemDetails) CreateNotFoundProblem(
            HttpContext context, 
            Exception exception, 
            string requestId)
        {
            var problemDetails = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                Title = "Not Found",
                Status = StatusCodes.Status404NotFound,
                Detail = _options.IncludeExceptionDetails ? exception.Message : "The requested resource was not found.",
                Instance = context.Request.Path,
                Extensions = { ["requestId"] = requestId }
            };

            return (StatusCodes.Status404NotFound, problemDetails);
        }

        private (int, ProblemDetails) CreateConflictProblem(
            HttpContext context, 
            Exception exception, 
            string requestId)
        {
            var problemDetails = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                Title = "Conflict",
                Status = StatusCodes.Status409Conflict,
                Detail = _options.IncludeExceptionDetails ? exception.Message : "A conflict occurred with the current state of the resource.",
                Instance = context.Request.Path,
                Extensions = { ["requestId"] = requestId }
            };

            return (StatusCodes.Status409Conflict, problemDetails);
        }

        private (int, ProblemDetails) CreateBusinessRuleProblem(
            HttpContext context, 
            BusinessRuleException exception, 
            string requestId)
        {
            var problemDetails = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Title = "Business Rule Violation",
                Status = StatusCodes.Status422UnprocessableEntity,
                Detail = exception.Message,
                Instance = context.Request.Path,
                Extensions = 
                { 
                    ["requestId"] = requestId,
                    ["businessRule"] = exception.RuleName
                }
            };

            return (StatusCodes.Status422UnprocessableEntity, problemDetails);
        }

        private (int, ProblemDetails) CreateInternalServerErrorProblem(
            HttpContext context, 
            Exception exception, 
            string requestId)
        {
            var problemDetails = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Title = "An error occurred while processing your request",
                Status = StatusCodes.Status500InternalServerError,
                Instance = context.Request.Path,
                Extensions = { ["requestId"] = requestId }
            };

            if (_environment.IsDevelopment() || _options.IncludeExceptionDetails)
            {
                problemDetails.Detail = exception.Message;
                problemDetails.Extensions["stackTrace"] = exception.StackTrace;
            }

            return (StatusCodes.Status500InternalServerError, problemDetails);
        }
    }

    /// <summary>
    /// Configuration options for exception handling middleware
    /// </summary>
    public class ExceptionHandlingOptions
    {
        public bool IncludeExceptionDetails { get; set; } = false;
    }
}
```

#### Rate Limiting Middleware (Pre .NET 7)

```csharp
using Microsoft.Extensions.Caching.Memory;
using System.Net;

namespace MyApp.Middleware
{
    /// <summary>
    /// Rate limiting middleware using memory cache
    /// </summary>
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly RateLimitingOptions _options;

        public RateLimitingMiddleware(
            RequestDelegate next,
            IMemoryCache cache,
            ILogger<RateLimitingMiddleware> logger,
            IOptions<RateLimitingOptions> options)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _options = options?.Value ?? new RateLimitingOptions();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var clientIdentifier = GetClientIdentifier(context);
            var endpoint = GetEndpointKey(context);
            var cacheKey = $"rate_limit_{clientIdentifier}_{endpoint}";

            if (!_cache.TryGetValue(cacheKey, out RateLimitInfo rateLimitInfo))
            {
                rateLimitInfo = new RateLimitInfo
                {
                    RequestCount = 1,
                    WindowStart = DateTime.UtcNow
                };
                
                _cache.Set(cacheKey, rateLimitInfo, _options.WindowSize);
            }
            else
            {
                if (DateTime.UtcNow - rateLimitInfo.WindowStart >= _options.WindowSize)
                {
                    // Reset window
                    rateLimitInfo.RequestCount = 1;
                    rateLimitInfo.WindowStart = DateTime.UtcNow;
                }
                else
                {
                    rateLimitInfo.RequestCount++;
                }

                _cache.Set(cacheKey, rateLimitInfo, _options.WindowSize);
            }

            // Add rate limit headers
            var remainingRequests = Math.Max(0, _options.MaxRequests - rateLimitInfo.RequestCount);
            var resetTime = rateLimitInfo.WindowStart.Add(_options.WindowSize);

            context.Response.Headers.Add("X-RateLimit-Limit", _options.MaxRequests.ToString());
            context.Response.Headers.Add("X-RateLimit-Remaining", remainingRequests.ToString());
            context.Response.Headers.Add("X-RateLimit-Reset", ((DateTimeOffset)resetTime).ToUnixTimeSeconds().ToString());

            if (rateLimitInfo.RequestCount > _options.MaxRequests)
            {
                _logger.LogWarning("Rate limit exceeded for client {ClientIdentifier} on endpoint {Endpoint}. Count: {RequestCount}",
                    clientIdentifier, endpoint, rateLimitInfo.RequestCount);

                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.Headers.Add("Retry-After", ((int)_options.WindowSize.TotalSeconds).ToString());

                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = "Rate limit exceeded",
                    message = $"Maximum {_options.MaxRequests} requests per {_options.WindowSize.TotalMinutes} minutes allowed",
                    retryAfter = (int)_options.WindowSize.TotalSeconds
                }));

                return;
            }

            await _next(context);
        }

        private string GetClientIdentifier(HttpContext context)
        {
            // Try to get user ID first
            var userId = context.User?.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                return $"user_{userId}";
            }

            // Try API key
            var apiKey = context.Request.Headers["X-API-Key"].FirstOrDefault();
            if (!string.IsNullOrEmpty(apiKey))
            {
                return $"apikey_{apiKey.GetHashCode()}";
            }

            // Fall back to IP address
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            return $"ip_{ipAddress}";
        }

        private static string GetEndpointKey(HttpContext context)
        {
            return $"{context.Request.Method}_{context.Request.Path}";
        }

        private class RateLimitInfo
        {
            public int RequestCount { get; set; }
            public DateTime WindowStart { get; set; }
        }
    }

    /// <summary>
    /// Configuration options for rate limiting middleware
    /// </summary>
    public class RateLimitingOptions
    {
        public int MaxRequests { get; set; } = 100;
        public TimeSpan WindowSize { get; set; } = TimeSpan.FromMinutes(1);
    }
}
```

### Middleware Registration Extensions

```csharp
namespace MyApp.Extensions
{
    /// <summary>
    /// Extension methods for middleware registration
    /// </summary>
    public static class MiddlewareExtensions
    {
        /// <summary>
        /// Adds request logging middleware
        /// </summary>
        public static IApplicationBuilder UseRequestLogging(
            this IApplicationBuilder app,
            Action<RequestLoggingOptions>? configureOptions = null)
        {
            var options = new RequestLoggingOptions();
            configureOptions?.Invoke(options);

            return app.UseMiddleware<RequestLoggingMiddleware>(Options.Create(options));
        }

        /// <summary>
        /// Adds global exception handling middleware
        /// </summary>
        public static IApplicationBuilder UseGlobalExceptionHandling(
            this IApplicationBuilder app,
            Action<ExceptionHandlingOptions>? configureOptions = null)
        {
            var options = new ExceptionHandlingOptions();
            configureOptions?.Invoke(options);

            return app.UseMiddleware<ExceptionHandlingMiddleware>(Options.Create(options));
        }

        /// <summary>
        /// Adds rate limiting middleware
        /// </summary>
        public static IApplicationBuilder UseCustomRateLimiting(
            this IApplicationBuilder app,
            Action<RateLimitingOptions>? configureOptions = null)
        {
            var options = new RateLimitingOptions();
            configureOptions?.Invoke(options);

            return app.UseMiddleware<RateLimitingMiddleware>(Options.Create(options));
        }

        /// <summary>
        /// Adds correlation ID middleware
        /// </summary>
        public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app)
        {
            return app.Use(async (context, next) =>
            {
                var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() ??
                                   Guid.NewGuid().ToString("N")[..12];

                context.Response.Headers.Add("X-Correlation-ID", correlationId);
                context.Items["CorrelationId"] = correlationId;

                await next();
            });
        }

        /// <summary>
        /// Adds security headers middleware
        /// </summary>
        public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        {
            return app.Use(async (context, next) =>
            {
                context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
                context.Response.Headers.Add("X-Frame-Options", "DENY");
                context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
                context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
                context.Response.Headers.Add("Content-Security-Policy", 
                    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

                await next();
            });
        }
    }
}
```

### Middleware Pipeline Configuration

```csharp
// Program.cs middleware configuration
var app = builder.Build();

// Configure middleware pipeline (order matters!)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseGlobalExceptionHandling(options =>
    {
        options.IncludeExceptionDetails = false;
    });
    app.UseHsts();
}

// Security middleware
app.UseSecurityHeaders();
app.UseCorrelationId();
app.UseHttpsRedirection();

// Rate limiting (before authentication)
app.UseCustomRateLimiting(options =>
{
    options.MaxRequests = 1000;
    options.WindowSize = TimeSpan.FromHours(1);
});

// Request logging
app.UseRequestLogging(options =>
{
    options.LogRequestBody = app.Environment.IsDevelopment();
    options.LogResponseBody = app.Environment.IsDevelopment();
});

// Standard middleware
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// API middleware
app.MapControllers();

app.Run();
```

I'll generate custom middleware components based on your specific requirements with proper error handling, logging, performance monitoring, and following ASP.NET Core middleware patterns and conventions.