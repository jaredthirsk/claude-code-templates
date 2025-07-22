# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a .NET project optimized for modern .NET 8+ development. The project uses industry-standard tools and follows best practices for scalable application development with ASP.NET Core and Blazor.

## Development Commands

### .NET CLI Commands
- `dotnet --version` - Check .NET version
- `dotnet new list` - List available project templates
- `dotnet new <template>` - Create new project from template
- `dotnet restore` - Restore NuGet packages
- `dotnet clean` - Clean build outputs
- `dotnet build` - Build the project
- `dotnet run` - Run the application
- `dotnet watch` - Run with file watching (hot reload)
- `dotnet publish` - Publish the application for deployment

### Package Management
- `dotnet add package <package-name>` - Add NuGet package
- `dotnet remove package <package-name>` - Remove NuGet package
- `dotnet list package` - List project packages
- `dotnet list package --outdated` - Show outdated packages
- `dotnet add reference <project>` - Add project reference
- `dotnet nuget locals all --clear` - Clear NuGet cache

### Testing Commands
- `dotnet test` - Run all tests
- `dotnet test --logger trx` - Run tests with TRX logger
- `dotnet test --collect:"XPlat Code Coverage"` - Run tests with code coverage
- `dotnet test --filter <filter>` - Run specific tests by filter
- `dotnet test --verbosity normal` - Run tests with detailed output
- `dotnet test --no-build` - Run tests without building

### Code Quality Commands
- `dotnet format` - Format code using built-in formatter
- `dotnet format --verify-no-changes` - Check code formatting without changes
- `dotnet format --include <files>` - Format specific files
- `dotnet build --configuration Release` - Build in release mode
- `dotnet build --warnaserror` - Treat warnings as errors

### Database Commands (Entity Framework)
- `dotnet ef migrations add <name>` - Add new migration
- `dotnet ef database update` - Update database to latest migration
- `dotnet ef migrations remove` - Remove last migration
- `dotnet ef database drop` - Drop database
- `dotnet ef dbcontext scaffold` - Scaffold DbContext from existing database

### Development Tools
- `dotnet dev-certs https --trust` - Trust HTTPS development certificate
- `dotnet user-secrets init` - Initialize user secrets
- `dotnet user-secrets set <key> <value>` - Set user secret
- `dotnet tool install --global <tool>` - Install global .NET tool
- `dotnet tool list --global` - List installed global tools

## Technology Stack

### Core Technologies
- **.NET 8+** - Primary runtime and framework
- **C#** - Primary programming language (C# 12+)
- **NuGet** - Package management
- **.NET CLI** - Command-line interface

### Web Frameworks
- **ASP.NET Core** - High-performance web framework
- **ASP.NET Core Web API** - RESTful API development
- **ASP.NET Core MVC** - Model-View-Controller pattern
- **Blazor Server** - Server-side Blazor applications
- **Blazor WebAssembly** - Client-side Blazor applications
- **SignalR** - Real-time web functionality

### Data Access & ORM
- **Entity Framework Core** - Modern ORM for .NET
- **Dapper** - Lightweight micro-ORM
- **SQL Server** - Microsoft's database server
- **PostgreSQL** - Open-source database
- **SQLite** - Lightweight database for development

### Testing Frameworks
- **xUnit** - Primary testing framework for .NET
- **NUnit** - Alternative testing framework
- **MSTest** - Microsoft's testing framework
- **Moq** - Mocking framework
- **FluentAssertions** - Expressive assertion library
- **Bogus** - Data generation for tests

### Code Quality Tools
- **.NET Format** - Built-in code formatter
- **StyleCop.Analyzers** - Code style analysis
- **SonarAnalyzer** - Code quality analysis
- **Roslynator** - Roslyn-based code analyzers
- **EditorConfig** - Code style configuration

### Popular NuGet Packages
- **Serilog** - Structured logging
- **AutoMapper** - Object-to-object mapping
- **FluentValidation** - Input validation
- **MediatR** - Mediator pattern implementation
- **Polly** - Resilience and transient-fault-handling
- **Swashbuckle** - Swagger/OpenAPI documentation

## Project Structure Guidelines

### File Organization
```
src/
├── MyApp.Api/               # Web API project
│   ├── Controllers/         # API controllers
│   ├── Models/             # Request/response models
│   ├── Services/           # Business logic services
│   ├── Middleware/         # Custom middleware
│   ├── Configuration/      # Configuration setup
│   ├── Program.cs          # Application entry point
│   └── MyApp.Api.csproj    # Project file
├── MyApp.Core/             # Core business logic
│   ├── Entities/           # Domain entities
│   ├── Interfaces/         # Service interfaces
│   ├── Services/           # Business services
│   ├── Extensions/         # Extension methods
│   └── MyApp.Core.csproj   # Project file
├── MyApp.Infrastructure/    # Infrastructure layer
│   ├── Data/              # Data access layer
│   │   ├── Context/       # DbContext classes
│   │   ├── Repositories/  # Repository implementations
│   │   └── Migrations/    # EF Core migrations
│   ├── External/          # External service integrations
│   └── MyApp.Infrastructure.csproj
├── MyApp.Blazor/          # Blazor application
│   ├── Components/        # Blazor components
│   ├── Pages/            # Page components
│   ├── Services/         # Client-side services
│   ├── wwwroot/          # Static files
│   └── MyApp.Blazor.csproj
tests/
├── MyApp.UnitTests/       # Unit tests
│   ├── Controllers/       # Controller tests
│   ├── Services/          # Service tests
│   └── MyApp.UnitTests.csproj
├── MyApp.IntegrationTests/ # Integration tests
│   ├── Api/              # API integration tests
│   └── MyApp.IntegrationTests.csproj
└── MyApp.TestHelpers/     # Test utilities
    └── MyApp.TestHelpers.csproj
```

### Naming Conventions
- **Namespaces**: Use PascalCase matching folder structure (`MyApp.Api.Controllers`)
- **Classes/Interfaces**: Use PascalCase (`UserService`, `IUserRepository`)
- **Methods**: Use PascalCase (`GetUserById`)
- **Properties**: Use PascalCase (`FirstName`)
- **Fields**: Use camelCase with underscore prefix (`_userName`)
- **Parameters/Variables**: Use camelCase (`userId`)
- **Constants**: Use PascalCase (`MaxRetryAttempts`)
- **Files**: Use PascalCase matching class name (`UserController.cs`)

## .NET Guidelines

### C# Language Features
- Use modern C# 12+ features (primary constructors, collection expressions, etc.)
- Leverage nullable reference types for better null safety
- Use pattern matching and switch expressions
- Prefer record types for immutable data
- Use global using directives for commonly used namespaces
- Utilize file-scoped namespaces for cleaner code

### Code Style
- Follow Microsoft's C# coding conventions
- Use meaningful names for classes, methods, and variables
- Keep methods focused and single-purpose
- Use XML documentation comments for public APIs
- Prefer composition over inheritance
- Use dependency injection for loose coupling

### Best Practices
- Use `async`/`await` for I/O-bound operations
- Implement proper exception handling with specific exception types
- Use `ILogger` for structured logging
- Configure services in `Program.cs` using dependency injection
- Use strongly-typed configuration with `IOptions<T>`
- Implement health checks for production applications
- Use cancellation tokens for long-running operations

## ASP.NET Core Guidelines

### Web API Development
- Use attribute routing for clean URL structures
- Implement proper HTTP status code responses
- Use model validation with data annotations or FluentValidation
- Return appropriate response types (`ActionResult<T>`)
- Implement API versioning for long-term maintainability
- Add Swagger/OpenAPI documentation

### Middleware Configuration
```csharp
// Program.cs example
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### Security Best Practices
- Enable HTTPS redirection
- Use authentication and authorization middleware
- Implement CORS policy appropriately
- Validate all inputs
- Use HTTPS certificates in production
- Implement rate limiting

## Blazor Guidelines

### Component Development
- Use PascalCase for component names
- Separate code-behind using partial classes when needed
- Use `@rendermode` directives appropriately (InteractiveServer, InteractiveWebAssembly)
- Implement proper component lifecycle methods
- Use cascading parameters for shared state

### Blazor Server Specifics
- Configure SignalR hub for real-time communication
- Handle connection management for reliability
- Use server-side state management
- Implement proper error boundaries

### Blazor WebAssembly Specifics
- Optimize bundle size for faster loading
- Use lazy loading for large components
- Implement offline capabilities with PWA features
- Handle client-side routing appropriately

## Testing Standards

### Test Structure
- Organize tests to mirror source code structure
- Use descriptive test method names explaining the scenario
- Follow AAA pattern (Arrange, Act, Assert)
- Use test fixtures and builders for test data
- Group related tests in test classes

### Unit Testing Best Practices
```csharp
[Fact]
public async Task GetUserById_ExistingUser_ReturnsUser()
{
    // Arrange
    var userId = 1;
    var expectedUser = new User { Id = userId, Name = "John Doe" };
    var mockRepository = new Mock<IUserRepository>();
    mockRepository.Setup(r => r.GetByIdAsync(userId))
              .ReturnsAsync(expectedUser);
    var service = new UserService(mockRepository.Object);

    // Act
    var result = await service.GetUserByIdAsync(userId);

    // Assert
    result.Should().NotBeNull();
    result.Id.Should().Be(userId);
    result.Name.Should().Be("John Doe");
}
```

### Integration Testing
- Use `WebApplicationFactory<T>` for API testing
- Test complete request/response cycles
- Use in-memory databases for data layer testing
- Mock external dependencies
- Test authentication and authorization

### Coverage Goals
- Aim for 80%+ unit test coverage for business logic
- Focus on critical paths and complex logic
- Write integration tests for API endpoints
- Test error conditions and edge cases
- Use mutation testing for quality assessment

## Entity Framework Core Guidelines

### DbContext Configuration
```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
```

### Migration Management
- Use descriptive names for migrations
- Review generated migrations before applying
- Use data seeding for initial data
- Test migrations on staging environment
- Keep migrations in source control

## Security Guidelines

### Package Security
- Regularly update NuGet packages
- Use `dotnet list package --vulnerable` to check for vulnerabilities
- Pin package versions in production
- Use private NuGet feeds for internal packages

### Code Security
- Validate all inputs using model validation
- Use parameterized queries to prevent SQL injection
- Implement proper authentication (JWT, Identity, etc.)
- Use HTTPS for all communications
- Store secrets in secure locations (Azure Key Vault, user secrets)
- Implement proper error handling without exposing sensitive information

## Performance Considerations

### General Performance
- Use async/await for I/O operations
- Implement caching strategies (memory cache, distributed cache)
- Use connection pooling for databases
- Optimize database queries and use proper indexing
- Profile applications using diagnostic tools

### ASP.NET Core Performance
- Use response caching and compression
- Implement health checks
- Use proper dependency injection lifetimes
- Monitor application metrics
- Use CDN for static assets

## Development Workflow

### Before Starting
1. Verify .NET 8+ is installed: `dotnet --version`
2. Restore packages: `dotnet restore`
3. Check build: `dotnet build`
4. Run tests: `dotnet test`

### During Development
1. Use hot reload: `dotnet watch run`
2. Run tests frequently: `dotnet test`
3. Format code: `dotnet format`
4. Use meaningful commit messages
5. Review code changes before committing

### Before Committing
1. Run full test suite: `dotnet test`
2. Check code formatting: `dotnet format --verify-no-changes`
3. Build in release mode: `dotnet build --configuration Release`
4. Check for warnings: `dotnet build --warnaserror`
5. Review security vulnerabilities: `dotnet list package --vulnerable`

## Deployment Guidelines

### Publishing Applications
- Use `dotnet publish -c Release` for production builds
- Configure environment-specific settings
- Use Docker for containerized deployments
- Implement proper logging and monitoring
- Set up health checks and readiness probes

### Azure Deployment
- Use Azure App Service for web applications
- Configure Application Insights for monitoring
- Use Azure SQL Database or CosmosDB for data
- Set up CI/CD pipelines with Azure DevOps or GitHub Actions