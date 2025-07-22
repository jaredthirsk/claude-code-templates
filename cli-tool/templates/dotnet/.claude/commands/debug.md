# Debug

Debug .NET applications with comprehensive diagnostics and troubleshooting.

## Usage

Start debugging session:

```bash
dotnet run --configuration Debug
```

Debug with specific arguments:

```bash
dotnet run -- --environment Development
```

## Implementation

I'll help you debug your .NET application by analyzing runtime behavior and identifying issues. I can:

1. **Analyze application logs** and exception details
2. **Set up debugging configuration** for different environments
3. **Identify performance bottlenecks** and memory issues
4. **Provide debugging best practices** and tools
5. **Help with breakpoint strategies** and diagnostic commands

### Debugging Techniques

**Run with debugging:**
```bash
dotnet run --configuration Debug --verbosity diagnostic
```

**Check application health:**
```bash
# Monitor performance counters
dotnet-counters monitor --process-id [pid]
```

**Memory diagnostics:**
```bash
# Capture memory dump
dotnet-dump collect --process-id [pid]
```

**Performance profiling:**
```bash
# Capture performance trace
dotnet-trace collect --process-id [pid] --duration 00:00:30
```

I'll analyze your application for debugging opportunities, set up appropriate diagnostic tools, identify performance bottlenecks, and provide specific debugging strategies for your codebase.