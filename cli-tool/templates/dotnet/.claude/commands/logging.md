# Logging Setup

Configure structured logging with Serilog, Microsoft.Extensions.Logging, and application monitoring.

## Usage

**Configure Serilog:**
```bash
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
```

**Setup with specific configuration:**
```bash
# Configure logging level
export ASPNETCORE_Logging__LogLevel__Default=$ARGUMENTS
```

## Implementation

I'll help you implement comprehensive structured logging with proper configuration, performance considerations, and monitoring integration.

### Logging Strategy

1. **Analyze current logging requirements and patterns**
2. **Set up structured logging with Serilog**
3. **Configure appropriate sinks and formatters**
4. **Implement logging best practices and performance optimization**
5. **Set up monitoring and alerting integration**

### Serilog Configuration

**Program.cs setup with Serilog:**
```csharp
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("ApplicationName", "MyApplication")
        .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
        .Enrich.WithMachineName()
        .Enrich.WithThreadId()
        .WriteTo.Console(
            outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
        .WriteTo.File(
            path: "./logs/app-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
        .WriteTo.Conditional(
            condition: context.HostingEnvironment.IsProduction(),
            configureSink: sink => sink.ApplicationInsights(
                TelemetryConfiguration.CreateDefault(),
                TelemetryConverter.Traces));

    // Set minimum level based on environment
    if (context.HostingEnvironment.IsDevelopment())
    {
        configuration.MinimumLevel.Debug()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning);
    }
    else
    {
        configuration.MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning);
    }
});

var app = builder.Build();

// Add request logging middleware
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
        diagnosticContext.Set("RemoteIpAddress", httpContext.Connection.RemoteIpAddress);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"]);
        diagnosticContext.Set("UserId", httpContext.User?.FindFirst("sub")?.Value);
    };
});

app.Run();
```

### Configuration-Based Logging

**appsettings.json logging configuration:**
```json
{
  "Serilog": {
    "Using": ["Serilog.Sinks.Console", "Serilog.Sinks.File"],
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.EntityFrameworkCore": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "./logs/app-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30,
          "outputTemplate": "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      }
    ],
    "Enrich": ["FromLogContext", "WithMachineName", "WithThreadId"],
    "Properties": {
      "ApplicationName": "MyApplication"
    }
  }
}
```

**appsettings.Development.json:**
```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Microsoft.EntityFrameworkCore.Database.Command": "Information"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      }
    ]
  }
}
```

### Structured Logging Best Practices

**Service with proper logging:**
```csharp
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UserService> _logger;

    public UserService(IUserRepository userRepository, ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<User> GetUserAsync(int userId)
    {
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["Operation"] = "GetUser",
            ["UserId"] = userId
        });

        _logger.LogDebug("Starting user retrieval for {UserId}", userId);

        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            
            if (user == null)
            {
                _logger.LogWarning("User not found: {UserId}", userId);
                throw new UserNotFoundException($"User with ID {userId} not found");
            }

            _logger.LogInformation("Successfully retrieved user {UserId} ({UserEmail})", 
                user.Id, user.Email);

            return user;
        }
        catch (UserNotFoundException)
        {
            throw; // Re-throw business exceptions
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve user {UserId}", userId);
            throw;
        }
    }

    public async Task<User> CreateUserAsync(CreateUserRequest request)
    {
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["Operation"] = "CreateUser",
            ["UserEmail"] = request.Email
        });

        _logger.LogInformation("Creating new user with email {UserEmail}", request.Email);

        try
        {
            var user = new User
            {
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow
            };

            var createdUser = await _userRepository.AddAsync(user);

            _logger.LogInformation("Successfully created user {UserId} ({UserEmail})",
                createdUser.Id, createdUser.Email);

            return createdUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create user with email {UserEmail}", request.Email);
            throw;
        }
    }
}
```

### Performance Logging

**Performance monitoring with logging:**
```csharp
public class PerformanceLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceLoggingMiddleware> _logger;

    public PerformanceLoggingMiddleware(RequestDelegate next, ILogger<PerformanceLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = Guid.NewGuid().ToString("N")[..8];

        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["RequestId"] = requestId,
            ["RequestPath"] = context.Request.Path,
            ["RequestMethod"] = context.Request.Method
        });

        try
        {
            _logger.LogDebug("Request started: {RequestMethod} {RequestPath}", 
                context.Request.Method, context.Request.Path);

            await _next(context);

            stopwatch.Stop();

            var elapsedMs = stopwatch.ElapsedMilliseconds;
            var level = elapsedMs switch
            {
                > 5000 => LogLevel.Warning,
                > 2000 => LogLevel.Information,
                _ => LogLevel.Debug
            };

            _logger.Log(level, "Request completed: {RequestMethod} {RequestPath} {StatusCode} in {ElapsedMs}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                elapsedMs);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Request failed: {RequestMethod} {RequestPath} in {ElapsedMs}ms",
                context.Request.Method,
                context.Request.Path,
                stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}
```

### Centralized Logging Solutions

**Elasticsearch with Serilog:**
```csharp
// Add package: Serilog.Sinks.Elasticsearch
builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri("http://elasticsearch:9200"))
        {
            IndexFormat = "myapp-logs-{0:yyyy.MM.dd}",
            AutoRegisterTemplate = true,
            NumberOfShards = 2,
            NumberOfReplicas = 1,
            Template = new
            {
                settings = new
                {
                    number_of_shards = 2,
                    number_of_replicas = 1
                }
            }
        });
});
```

**Application Insights integration:**
```csharp
// Add packages: 
// Microsoft.ApplicationInsights.AspNetCore
// Serilog.Sinks.ApplicationInsights

builder.Services.AddApplicationInsightsTelemetry();

builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .WriteTo.ApplicationInsights(
            TelemetryConfiguration.CreateDefault(),
            TelemetryConverter.Traces);
});
```

### Custom Log Enrichers

**Custom enricher for correlation IDs:**
```csharp
public class CorrelationIdEnricher : ILogEventEnricher
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CorrelationIdEnricher(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var correlationId = _httpContextAccessor.HttpContext?.Request.Headers["X-Correlation-ID"].FirstOrDefault()
                           ?? Guid.NewGuid().ToString("N")[..8];

        var property = propertyFactory.CreateProperty("CorrelationId", correlationId);
        logEvent.AddPropertyIfAbsent(property);
    }
}

// Register enricher
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<ILogEventEnricher, CorrelationIdEnricher>();
```

### Logging Filters and Sampling

**High-volume logging with sampling:**
```csharp
public class SamplingEnricher : ILogEventEnricher
{
    private static int _counter = 0;
    private readonly int _sampleRate;

    public SamplingEnricher(int sampleRate = 10)
    {
        _sampleRate = sampleRate;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        // Only log every Nth debug message
        if (logEvent.Level == LogEventLevel.Debug)
        {
            var count = Interlocked.Increment(ref _counter);
            if (count % _sampleRate != 0)
            {
                logEvent.AddPropertyIfAbsent(
                    propertyFactory.CreateProperty("Sampled", true));
            }
        }
    }
}
```

### Security and Privacy

**Sensitive data filtering:**
```csharp
public class SensitiveDataFilter : ILogEventFilter
{
    private readonly string[] _sensitiveProperties = 
    {
        "password", "creditcard", "ssn", "email"
    };

    public bool IsEnabled(LogEvent logEvent)
    {
        // Filter out log events containing sensitive data
        var messageTemplate = logEvent.MessageTemplate.Text.ToLowerInvariant();
        
        return !_sensitiveProperties.Any(prop => 
            messageTemplate.Contains(prop.ToLowerInvariant()));
    }
}

// Usage in configuration
.Filter.With<SensitiveDataFilter>()
```

### Monitoring and Alerting

**Health check logging:**
```csharp
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<ExternalApiHealthCheck>("external_api");

// Custom health check with logging
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;
    private readonly ILogger<DatabaseHealthCheck> _logger;

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            using var dbContext = _contextFactory.CreateDbContext();
            await dbContext.Database.CanConnectAsync(cancellationToken);

            _logger.LogDebug("Database health check passed");
            return HealthCheckResult.Healthy("Database connection successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return HealthCheckResult.Unhealthy("Database connection failed", ex);
        }
    }
}
```

### Log Analysis and Queries

**Structured log queries (for Elasticsearch/Kibana):**
```json
{
  "query": {
    "bool": {
      "must": [
        { "range": { "@timestamp": { "gte": "now-1h" } } },
        { "term": { "Level": "Error" } },
        { "wildcard": { "MessageTemplate": "*User*" } }
      ]
    }
  }
}
```

I'll analyze your current logging setup, implement structured logging with appropriate sinks, configure performance monitoring, set up centralized logging if needed, and ensure proper log security and filtering practices.