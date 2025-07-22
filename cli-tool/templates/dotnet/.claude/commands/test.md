# Test

Run comprehensive .NET tests with coverage and detailed reporting.

## Usage

Run all tests in the solution with coverage:

```bash
dotnet test --collect:"XPlat Code Coverage"
```

Run specific test project:

```bash
dotnet test tests/MyProject.Tests/
```

## Implementation

I'll help you run .NET tests with the appropriate configuration. I can:

1. **Execute test commands** with proper parameters
2. **Generate coverage reports** in multiple formats
3. **Filter tests** by category, name, or traits
4. **Analyze test results** and suggest improvements
5. **Set up continuous testing** with watch mode

### Common Test Scenarios

**Run all tests:**
```bash
dotnet test --verbosity normal
```

**Run with coverage:**
```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory ./TestResults
```

**Filter by category:**
```bash
dotnet test --filter "Category=Unit"
```

**Run specific test:**
```bash
dotnet test --filter "Name~UserService"
```

**Watch mode:**
```bash
dotnet watch test
```

I'll execute the tests, analyze the results, and provide detailed feedback on any failures or performance issues.