# Publish Command

Publish .NET applications for production deployment with optimization and platform targeting.

## Usage

**Basic publish:**
```bash
dotnet publish --configuration Release
```

**Publish with specific arguments:**
```bash
dotnet publish $ARGUMENTS
```

**Platform-specific publish:**
```bash
dotnet publish --runtime win-x64 --self-contained
```

## Implementation

I'll help you publish your .NET application with appropriate optimizations, platform targeting, and deployment configurations.

### Publishing Strategy

1. **Analyze project type and deployment target**
2. **Configure optimal publish settings**
3. **Apply performance optimizations**
4. **Generate deployment artifacts**
5. **Provide deployment guidance and verification**

### Common Publish Scenarios

**Web application for cloud deployment:**
```bash
dotnet publish --configuration Release --output ./publish
```

**Self-contained executable:**
```bash
dotnet publish --configuration Release --runtime win-x64 --self-contained true --output ./publish
```

**Framework-dependent deployment:**
```bash
dotnet publish --configuration Release --runtime linux-x64 --self-contained false --output ./publish
```

**Single file deployment:**
```bash
dotnet publish --configuration Release --runtime win-x64 --self-contained true --output ./publish -p:PublishSingleFile=true
```

### Optimization Settings

**Project file optimizations:**
```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <!-- Release configuration optimizations -->
  <PropertyGroup Condition="'$(Configuration)' == 'Release'">
    <PublishTrimmed>true</PublishTrimmed>
    <PublishSingleFile>true</PublishSingleFile>
    <PublishReadyToRun>true</PublishReadyToRun>
    <TrimMode>link</TrimMode>
    <SelfContained>true</SelfContained>
    <RuntimeIdentifier>linux-x64</RuntimeIdentifier>
    <EnableCompressionInSingleFile>true</EnableCompressionInSingleFile>
    <DebugType>none</DebugType>
    <DebugSymbols>false</DebugSymbols>
  </PropertyGroup>

  <!-- Trimming configuration -->
  <PropertyGroup>
    <TrimmerRemoveSymbols>true</TrimmerRemoveSymbols>
    <TrimmerSingleWarn>false</TrimmerSingleWarn>
  </PropertyGroup>
</Project>
```

### Platform-Specific Builds

**Windows deployment:**
```bash
# Windows Service
dotnet publish --configuration Release --runtime win-x64 --self-contained true -p:PublishSingleFile=true

# IIS deployment
dotnet publish --configuration Release --output ./publish --runtime win-x64 --self-contained false
```

**Linux deployment:**
```bash
# Docker container
dotnet publish --configuration Release --runtime linux-x64 --self-contained false --output ./publish

# Standalone Linux executable
dotnet publish --configuration Release --runtime linux-x64 --self-contained true -p:PublishSingleFile=true
```

**Cross-platform deployment:**
```bash
# Portable deployment (requires .NET runtime on target)
dotnet publish --configuration Release --output ./publish
```

### Docker Deployment

**Multi-stage Dockerfile:**
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MyApp.csproj", "./"]
RUN dotnet restore "MyApp.csproj"
COPY . .
RUN dotnet build "MyApp.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "MyApp.csproj" -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 80
EXPOSE 443
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MyApp.dll"]
```

**Optimized Docker build:**
```bash
# Build optimized Docker image
docker build -t myapp:latest .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .
```

### Cloud Deployment Configurations

**Azure App Service:**
```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <AspNetCoreHostingModel>InProcess</AspNetCoreHostingModel>
  <PublishProfile>FolderProfile</PublishProfile>
</PropertyGroup>
```

**AWS Lambda:**
```xml
<PropertyGroup>
  <AWSProjectType>Lambda</AWSProjectType>
  <GenerateRuntimeConfigurationFiles>true</GenerateRuntimeConfigurationFiles>
  <AssemblyName>MyApp</AssemblyName>
  <Package>Lambda.zip</Package>
</PropertyGroup>
```

### Production Configurations

**appsettings.Production.json:**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "System": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "#{DATABASE_CONNECTION_STRING}#"
  },
  "AllowedHosts": "*",
  "DetailedErrors": false,
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    }
  }
}
```

**Environment-specific builds:**
```bash
# Staging environment
dotnet publish --configuration Release --output ./publish/staging -p:EnvironmentName=Staging

# Production environment  
dotnet publish --configuration Release --output ./publish/production -p:EnvironmentName=Production
```

### Performance Optimization

**AOT (Ahead of Time) compilation:**
```xml
<PropertyGroup>
  <PublishAot>true</PublishAot>
  <OptimizationPreference>Size</OptimizationPreference>
  <IlcOptimizationPreference>Size</IlcOptimizationPreference>
  <IlcGenerateStackTraceData>false</IlcGenerateStackTraceData>
</PropertyGroup>
```

**ReadyToRun optimization:**
```xml
<PropertyGroup>
  <PublishReadyToRun>true</PublishReadyToRun>
  <PublishReadyToRunShowWarnings>true</PublishReadyToRunShowWarnings>
</PropertyGroup>
```

### Deployment Verification

**Health check endpoint:**
```csharp
// Add to Program.cs
app.MapGet("/health", () => new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    version = typeof(Program).Assembly.GetName().Version?.ToString(),
    environment = app.Environment.EnvironmentName
});
```

**Post-deployment validation script:**
```bash
#!/bin/bash
# validate-deployment.sh

APP_URL="https://your-app.com"
HEALTH_ENDPOINT="$APP_URL/health"

echo "Validating deployment..."

# Check health endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_ENDPOINT)
if [ $response -eq 200 ]; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed (HTTP $response)"
    exit 1
fi

# Check application startup
echo "Checking application startup..."
if curl -s $APP_URL | grep -q "<!DOCTYPE html>"; then
    echo "✓ Application responding correctly"
else
    echo "✗ Application not responding properly"
    exit 1
fi

echo "Deployment validation completed successfully!"
```

### CI/CD Integration

**GitHub Actions workflow:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 8.0.x
        
    - name: Restore dependencies
      run: dotnet restore
      
    - name: Build
      run: dotnet build --configuration Release --no-restore
      
    - name: Test
      run: dotnet test --no-build --verbosity normal
      
    - name: Publish
      run: dotnet publish --configuration Release --output ./publish --no-build
      
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'my-app'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './publish'
```

I'll analyze your project structure, determine the optimal publish configuration for your deployment target, apply appropriate optimizations, and guide you through the deployment process with verification steps.