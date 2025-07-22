# Entity Framework Migration Management

Manage Entity Framework Core migrations with best practices for database schema evolution.

## Usage

**Create migration:**
```bash
dotnet ef migrations add $ARGUMENTS
```

**Update database:**
```bash
dotnet ef database update
```

**Rollback migration:**
```bash
dotnet ef database update PreviousMigrationName
```

## Implementation

I'll help you manage Entity Framework migrations safely with proper database versioning and rollback strategies.

### Migration Strategy

1. **Analyze current database schema and model changes**
2. **Generate appropriate migration with descriptive naming**
3. **Review migration code for data safety**
4. **Apply migration with proper error handling**
5. **Provide rollback instructions if needed**

### Essential Migration Commands

**Add new migration:**
```bash
dotnet ef migrations add InitialCreate
dotnet ef migrations add AddUserProfiles
dotnet ef migrations add UpdateProductConstraints
```

**Update database to latest:**
```bash
dotnet ef database update
```

**Update to specific migration:**
```bash
dotnet ef database update AddUserProfiles
```

**Remove last migration (if not applied):**
```bash
dotnet ef migrations remove
```

**Generate SQL script:**
```bash
dotnet ef migrations script
dotnet ef migrations script InitialCreate AddUserProfiles
```

### Migration Best Practices

**Migration naming conventions:**
```bash
# Good migration names
dotnet ef migrations add AddUserEmailIndex
dotnet ef migrations add UpdateOrderStatusConstraints
dotnet ef migrations add CreateAuditTables
dotnet ef migrations add SeedInitialData

# Avoid generic names
dotnet ef migrations add Update1
dotnet ef migrations add Changes
```

**Safe migration patterns:**
```csharp
// Example migration with data preservation
public partial class AddUserEmailIndex : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add index (safe operation)
        migrationBuilder.CreateIndex(
            name: "IX_Users_Email",
            table: "Users",
            column: "Email",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Users_Email",
            table: "Users");
    }
}
```

### DbContext Configuration

**Proper DbContext setup:**
```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        
        // Seed data
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Email = "admin@example.com", FirstName = "Admin", LastName = "User" }
        );

        base.OnModelCreating(modelBuilder);
    }
}
```

### Advanced Migration Scenarios

**Data migration with custom logic:**
```csharp
public partial class MigrateUserData : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add new column
        migrationBuilder.AddColumn<string>(
            name: "FullName",
            table: "Users",
            type: "nvarchar(200)",
            maxLength: 200,
            nullable: true);

        // Migrate existing data
        migrationBuilder.Sql(@"
            UPDATE Users 
            SET FullName = FirstName + ' ' + LastName 
            WHERE FirstName IS NOT NULL AND LastName IS NOT NULL
        ");

        // Make column required after data migration
        migrationBuilder.AlterColumn<string>(
            name: "FullName",
            table: "Users",
            type: "nvarchar(200)",
            maxLength: 200,
            nullable: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "FullName",
            table: "Users");
    }
}
```

### Production Migration Strategies

**Generate production script:**
```bash
# Generate script for production deployment
dotnet ef migrations script --idempotent --output ./Scripts/migrate-to-latest.sql

# Generate script between specific migrations
dotnet ef migrations script 20231201_AddUsers 20231215_UpdateProducts --output ./Scripts/update-script.sql
```

**Environment-specific configurations:**
```csharp
// Program.cs with environment-specific migration behavior
if (app.Environment.IsDevelopment())
{
    // Auto-migrate in development
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.Migrate();
}
else
{
    // In production, check for pending migrations
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var pendingMigrations = context.Database.GetPendingMigrations();
    
    if (pendingMigrations.Any())
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("Pending migrations found: {Migrations}", string.Join(", ", pendingMigrations));
    }
}
```

### Troubleshooting Common Issues

**Reset migrations (development only):**
```bash
# Remove all migrations
rm -rf Migrations/

# Drop database
dotnet ef database drop

# Create new initial migration
dotnet ef migrations add InitialCreate
dotnet ef database update
```

**Handle migration conflicts:**
```bash
# If multiple developers created migrations
dotnet ef migrations remove  # Remove conflicting migration
git pull origin main         # Get latest changes
dotnet ef migrations add YourNewMigrationName  # Add migration again
```

**Seed data management:**
```csharp
// Use HasData for simple seed data
modelBuilder.Entity<Role>().HasData(
    new Role { Id = 1, Name = "Admin" },
    new Role { Id = 2, Name = "User" }
);

// For complex seed data, use custom migration
public partial class SeedRolesAndPermissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.InsertData(
            table: "Roles",
            columns: new[] { "Id", "Name", "Description" },
            values: new object[,]
            {
                { 1, "Admin", "Administrator role with full access" },
                { 2, "User", "Standard user role" }
            });
    }
}
```

### Database Provider Configurations

**SQL Server:**
```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet ef migrations add InitialCreate --context ApplicationDbContext
```

**PostgreSQL:**
```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet ef migrations add InitialCreate --context ApplicationDbContext
```

**SQLite (for development):**
```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet ef migrations add InitialCreate --context ApplicationDbContext
```

I'll analyze your current database schema, create appropriate migrations with proper naming and safety checks, and provide rollback strategies for safe database evolution.