# .NET Templates

**Claude Code configuration template optimized for modern .NET 8+ development**

This folder contains a comprehensive Claude Code template specifically designed for .NET projects, supporting ASP.NET Core Web APIs, Blazor Server, and Blazor WebAssembly applications.

## 📁 What's in This Folder

This template provides the foundation for .NET development with Claude Code:

### 📄 Files Included
- **`CLAUDE.md`** - Complete .NET 8+ development guidance for Claude Code
- **`README.md`** - This documentation file

### 🎯 Template Features
When you use this template with the installer, it automatically creates:
- **`.claude/settings.json`** - Optimized settings for .NET projects
- **`.claude/commands/`** - Ready-to-use commands for common tasks

## 🚀 How to Use This Template

### Option 1: Automated Installation (Recommended)
Use the CLI installer to automatically set up this template in your project:

```bash
cd your-dotnet-project
npx claude-code-templates --language dotnet
```

The installer will:
- Copy the `CLAUDE.md` file to your project
- Auto-detect your framework (ASP.NET Core, Blazor, etc.)
- Create appropriate `.claude/` configuration files
- Set up framework-specific commands
- Configure development workflows

### Option 2: Manual Installation
Copy the template manually for more control:

```bash
# Clone the repository
git clone https://github.com/davila7/claude-code-templates.git

# Copy the .NET template
cp claude-code-templates/dotnet/CLAUDE.md your-project/

# Then use the CLI to complete the setup
cd your-project
npx claude-code-templates --language dotnet
```

## 🎨 Framework Support

This template automatically configures Claude Code for:

### Web Frameworks
- **ASP.NET Core Web API** - RESTful APIs with OpenAPI/Swagger documentation
- **ASP.NET Core MVC** - Model-View-Controller web applications
- **Minimal APIs** - Lightweight API development with .NET 8+

### UI Frameworks  
- **Blazor Server** - Server-side rendered interactive web UIs
- **Blazor WebAssembly** - Client-side .NET applications running in browser
- **Blazor Hybrid** - Native mobile and desktop applications

### Data Access & Architecture
- **Entity Framework Core** - Modern ORM with Code First/Database First
- **Clean Architecture** - Domain-driven design patterns
- **Repository Pattern** - Data access abstraction
- **CQRS with MediatR** - Command Query Responsibility Segregation

### Testing & Quality
- **xUnit, NUnit, MSTest** - Unit testing frameworks
- **Moq, NSubstitute** - Mocking frameworks
- **FluentAssertions** - Expressive test assertions
- **Bogus** - Test data generation

## 🛠️ Commands Created by the Template

When installed, this template provides commands for:

### 🧪 Testing & Quality
- **`/test`** - Run tests with xUnit, NUnit, or MSTest
- **`/coverage`** - Generate code coverage reports
- **`/format`** - Format code with built-in .NET formatter

### 🔧 Development Tools
- **`/build`** - Build solution with error checking
- **`/watch`** - Run application with hot reload
- **`/migrations`** - Manage Entity Framework migrations

### ⚡ Framework-Specific Commands
- **`/api-endpoint`** - Generate Web API controllers and endpoints
- **`/blazor-component`** - Create Blazor components with proper structure
- **`/ef-model`** - Generate Entity Framework models and DbContext
- **`/service`** - Create service classes with dependency injection

## 🎯 What Happens When You Install

### Step 1: Framework Detection
The installer analyzes your project to detect:
- `.csproj` files and target frameworks
- Project structure and dependencies
- Framework type (Web API, Blazor, Console, etc.)

### Step 2: Template Configuration  
Based on detection, it creates:
```
your-project/
├── CLAUDE.md                    # Copied from this template
├── .claude/
│   ├── settings.json           # Framework-specific settings
│   └── commands/               # Commands for your framework
│       ├── test.md
│       ├── build.md
│       ├── format.md
│       └── [framework-specific commands]
```

### Step 3: Framework Customization
For specific frameworks, additional commands are added:

**ASP.NET Core Web API Projects:**
- API endpoint generation with proper routing
- Model validation and error handling patterns
- OpenAPI/Swagger documentation helpers

**Blazor Projects:**
- Component creation with proper lifecycle methods
- State management patterns
- Server/WASM-specific optimizations

**Entity Framework Projects:**
- Migration management commands
- Model scaffolding from database
- Data seeding patterns

## 📚 What's in the CLAUDE.md File

The `CLAUDE.md` file in this folder contains comprehensive guidance for:

### Development Commands
- .NET CLI commands (build, run, test, publish)
- Package management (NuGet, project references)
- Database commands (Entity Framework migrations)
- Code quality commands (format, analyzers)

### Technology Stack Guidelines
- .NET 8+ best practices and modern C# features
- ASP.NET Core patterns (Web API, MVC, Minimal APIs)
- Blazor development (Server and WebAssembly)
- Entity Framework Core configuration and usage

### Project Structure Recommendations
- Clean Architecture patterns
- File organization conventions
- Naming conventions for .NET projects
- Dependency injection configuration

### Performance & Security
- ASP.NET Core performance optimization
- Security best practices for web applications
- Package vulnerability management
- Deployment guidelines for Azure and containers

## 🚀 Getting Started

1. **Navigate to your .NET project:**
   ```bash
   cd your-project
   ```

2. **Run the installer:**
   ```bash
   npx claude-code-templates --language dotnet
   ```

3. **Start Claude Code:**
   ```bash
   claude
   ```

4. **Try the commands:**
   ```bash
   /test              # Run your tests
   /build             # Build solution
   /api-endpoint      # Create API endpoints
   /blazor-component  # Create Blazor components
   ```

## 🔧 Customization

After installation, you can customize the setup:

### Modify Commands
Edit files in `.claude/commands/` to match your workflow:
```bash
# Edit the test command
code .claude/commands/test.md

# Add a custom command
echo "# Deploy Command" > .claude/commands/deploy.md
```

### Adjust Settings
Update `.claude/settings.json` for your project:
```json
{
  "framework": "aspnet-webapi",
  "testFramework": "xunit", 
  "database": "postgresql",
  "architecture": "clean"
}
```

### Add Framework Features
The template adapts to your specific .NET framework needs automatically.

## 📖 Learn More

- **Main Project**: [Claude Code Templates](../README.md)
- **Common Templates**: [Universal patterns](../common/README.md)
- **JavaScript Templates**: [JavaScript/TypeScript development](../javascript-typescript/README.md)
- **Python Templates**: [Python development](../python/README.md)

## 💡 Why Use This Template?

### Before (Manual Setup)
```bash
# Create CLAUDE.md from scratch
# Research .NET 8+ best practices
# Configure commands manually
# Set up testing and code quality
# Configure Entity Framework
# ... hours of setup
```

### After (With This Template)
```bash
npx claude-code-templates --language dotnet
# ✅ Everything configured in 30 seconds!
```

### Benefits
- **Instant Setup** - Get started immediately with proven .NET configurations
- **Framework-Aware** - Automatically adapts to Web API, Blazor, etc.
- **Modern .NET** - Uses .NET 8+ features and best practices
- **Testing Ready** - Pre-configured for xUnit, NUnit, and integration testing
- **Security Focused** - Includes security best practices and vulnerability checking

## 🤝 Contributing

Help improve this .NET template:

1. Test the template with different .NET project types
2. Report issues or suggest improvements
3. Add support for new .NET frameworks or tools
4. Share your customizations and best practices

Your contributions make this template better for the entire .NET community!

---

**Ready to supercharge your .NET development?** Run `npx claude-code-templates --language dotnet` in your project now!