# Configuration Management

Manage .NET application configuration with appsettings, user secrets, environment variables, and options pattern.

## Usage

**Manage user secrets:**
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "$ARGUMENTS"
```

**List configuration:**
```bash
dotnet user-secrets list
```

**Environment configuration:**
```bash
export ASPNETCORE_ENVIRONMENT=Development
dotnet run
```

## Implementation

I'll help you implement robust configuration management using .NET's configuration system with proper secret management and environment-specific settings.

### Configuration Strategy

1. **Analyze current configuration structure**
2. **Implement hierarchical configuration sources**
3. **Set up secure secret management**
4. **Configure environment-specific settings**
5. **Implement strongly-typed configuration with options pattern**

### Configuration Sources Hierarchy

**Configuration loading order (last wins):**
```csharp
// Program.cs - Configuration setup
var builder = WebApplication.CreateBuilder(args);

// Configuration sources are automatically loaded in this order:
// 1. appsettings.json
// 2. appsettings.{Environment}.json
// 3. User secrets (Development environment only)
// 4. Environment variables
// 5. Command-line arguments

// Add additional configuration sources if needed
builder.Configuration.AddJsonFile("custom-settings.json", optional: true);
builder.Configuration.AddIniFile("settings.ini", optional: true);
```

### Base Configuration Files

**appsettings.json (shared settings):**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=MyAppDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "AppSettings": {
    "ApplicationName": "My Application",
    "Version": "1.0.0",
    "MaxFileUploadSize": 10485760,
    "EnableFeatureFlags": true
  },
  "ExternalServices": {
    "EmailService": {
      "BaseUrl": "https://api.emailservice.com",
      "Timeout": "00:00:30"
    },
    "PaymentGateway": {
      "BaseUrl": "https://api.payments.com",
      "Timeout": "00:01:00"
    }
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information"
    },
    "WriteTo": [
      {
        "Name": "Console"
      },
      {
        "Name": "File",
        "Args": {
          "path": "./logs/app-.log",
          "rollingInterval": "Day"
        }
      }
    ]
  }
}
```

**appsettings.Development.json:**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=MyAppDb_Dev;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "AppSettings": {
    "EnableDetailedErrors": true,
    "EnableSwagger": true
  },
  "ExternalServices": {
    "EmailService": {
      "BaseUrl": "https://api-dev.emailservice.com"
    },
    "PaymentGateway": {
      "BaseUrl": "https://sandbox.payments.com"
    }
  }
}
```

**appsettings.Production.json:**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AppSettings": {
    "EnableDetailedErrors": false,
    "EnableSwagger": false
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning"
    },
    "WriteTo": [
      {
        "Name": "Console"
      }
    ]
  }
}
```

### User Secrets Management

**Initialize and manage user secrets:**
```bash
# Initialize user secrets for the project
dotnet user-secrets init

# Set connection string
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=MyAppDb;User Id=myuser;Password=mypassword;"

# Set API keys
dotnet user-secrets set "ExternalServices:EmailService:ApiKey" "your-email-api-key"
dotnet user-secrets set "ExternalServices:PaymentGateway:ApiKey" "your-payment-api-key"

# Set complex nested configuration
dotnet user-secrets set "JWT:SecretKey" "your-super-secret-jwt-signing-key"
dotnet user-secrets set "JWT:Issuer" "https://localhost:5001"
dotnet user-secrets set "JWT:Audience" "https://localhost:5001"

# List all secrets
dotnet user-secrets list

# Remove specific secret
dotnet user-secrets remove "ExternalServices:EmailService:ApiKey"

# Clear all secrets
dotnet user-secrets clear
```

### Strongly-Typed Configuration

**Configuration classes:**
```csharp
// Configuration/AppSettings.cs
public class AppSettings
{
    public const string SectionName = "AppSettings";
    
    public string ApplicationName { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public long MaxFileUploadSize { get; set; }
    public bool EnableFeatureFlags { get; set; }
    public bool EnableDetailedErrors { get; set; }
    public bool EnableSwagger { get; set; }
}

// Configuration/ExternalServiceSettings.cs
public class ExternalServiceSettings
{
    public string BaseUrl { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(30);
}

public class ExternalServicesSettings
{
    public const string SectionName = "ExternalServices";
    
    public ExternalServiceSettings EmailService { get; set; } = new();
    public ExternalServiceSettings PaymentGateway { get; set; } = new();
}

// Configuration/JwtSettings.cs
public class JwtSettings
{
    public const string SectionName = "JWT";
    
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public TimeSpan TokenLifetime { get; set; } = TimeSpan.FromHours(1);
}
```

### Configuration Registration

**Program.cs configuration setup:**
```csharp
var builder = WebApplication.CreateBuilder(args);

// Register strongly-typed configuration
builder.Services.Configure<AppSettings>(
    builder.Configuration.GetSection(AppSettings.SectionName));

builder.Services.Configure<ExternalServicesSettings>(
    builder.Configuration.GetSection(ExternalServicesSettings.SectionName));

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName));

// Alternative: Register with validation
builder.Services.AddOptions<AppSettings>()
    .Bind(builder.Configuration.GetSection(AppSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Register configuration as singleton services
builder.Services.AddSingleton(provider =>
    provider.GetRequiredService<IOptions<AppSettings>>().Value);

var app = builder.Build();
```

### Configuration Validation

**Validated configuration classes:**
```csharp
using System.ComponentModel.DataAnnotations;

public class DatabaseSettings
{
    public const string SectionName = "Database";
    
    [Required]
    [MinLength(10)]
    public string ConnectionString { get; set; } = string.Empty;
    
    [Range(1, 300)]
    public int CommandTimeout { get; set; } = 30;
    
    [Range(1, 100)]
    public int MaxPoolSize { get; set; } = 20;
}

public class EmailSettings
{
    public const string SectionName = "Email";
    
    [Required]
    [EmailAddress]
    public string FromAddress { get; set; } = string.Empty;
    
    [Required]
    public string FromName { get; set; } = string.Empty;
    
    [Required]
    [Url]
    public string SmtpServer { get; set; } = string.Empty;
    
    [Range(1, 65535)]
    public int Port { get; set; } = 587;
}
```

### Using Configuration in Services

**Service with configuration injection:**
```csharp
public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        _logger.LogInformation("Sending email from {FromAddress} to {ToAddress}",
            _emailSettings.FromAddress, to);

        // Implementation using _emailSettings
        var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.Port);
        // ... rest of implementation
    }
}

// Alternative: Using IOptionsMonitor for hot-reload
public class ConfigurableService
{
    private readonly IOptionsMonitor<AppSettings> _appSettings;

    public ConfigurableService(IOptionsMonitor<AppSettings> appSettings)
    {
        _appSettings = appSettings;
    }

    public void DoWork()
    {
        var currentSettings = _appSettings.CurrentValue;
        // Settings will automatically update if configuration changes
    }
}
```

### Environment Variables

**Environment variable mapping:**
```bash
# Set environment variables (Linux/macOS)
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="Server=prod-server;Database=ProdDb;..."
export AppSettings__ApplicationName="Production App"
export ExternalServices__EmailService__ApiKey="prod-email-key"

# Windows PowerShell
$env:ASPNETCORE_ENVIRONMENT="Production"
$env:ConnectionStrings__DefaultConnection="Server=prod-server;Database=ProdDb;..."
$env:AppSettings__ApplicationName="Production App"
```

### Configuration in Different Environments

**Docker environment configuration:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  webapp:
    image: myapp:latest
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=sqlserver;Database=MyApp;User Id=sa;Password=YourPassword123;
      - AppSettings__ApplicationName=Docker App
      - ExternalServices__EmailService__ApiKey=${EMAIL_API_KEY}
    ports:
      - "80:80"
```

**Kubernetes ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  appsettings.json: |
    {
      "AppSettings": {
        "ApplicationName": "Kubernetes App"
      },
      "Logging": {
        "LogLevel": {
          "Default": "Information"
        }
      }
    }
```

### Configuration Testing

**Configuration testing utilities:**
```csharp
// Tests/ConfigurationTests.cs
public class ConfigurationTests
{
    [Fact]
    public void Configuration_Should_Load_Successfully()
    {
        // Arrange
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .AddJsonFile("appsettings.Development.json")
            .Build();

        // Act
        var appSettings = configuration.GetSection("AppSettings").Get<AppSettings>();

        // Assert
        Assert.NotNull(appSettings);
        Assert.NotEmpty(appSettings.ApplicationName);
    }

    [Fact]
    public void EmailSettings_Should_Validate_Successfully()
    {
        // Arrange
        var emailSettings = new EmailSettings
        {
            FromAddress = "test@example.com",
            FromName = "Test App",
            SmtpServer = "https://smtp.example.com",
            Port = 587
        };

        // Act
        var validationResults = ValidateModel(emailSettings);

        // Assert
        Assert.Empty(validationResults);
    }

    private List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }
}
```

I'll analyze your current configuration setup, implement proper configuration management with strongly-typed options, set up secure secret handling, and ensure proper environment-specific configuration management.