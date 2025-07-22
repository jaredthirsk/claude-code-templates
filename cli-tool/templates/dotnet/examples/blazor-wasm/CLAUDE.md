# Blazor WebAssembly Project Configuration

This file provides specific guidance for Blazor WebAssembly (WASM) application development using Claude Code.

## Project Overview

This is a Blazor WebAssembly application project optimized for client-side web development running entirely in the browser, with support for Progressive Web Apps (PWA), offline capabilities, and modern web standards.

## Blazor WebAssembly-Specific Development Commands

### Project Management
- `dotnet new blazorwasm -n MyBlazorWasmApp` - Create new Blazor WASM project
- `dotnet new blazorwasm -n MyApp --pwa` - Create with PWA support
- `dotnet run` - Start development server
- `dotnet watch run` - Start with hot reload
- `dotnet publish -c Release` - Build for production

### PWA Development
- `dotnet new blazorwasm --pwa -n MyPwaApp` - Create PWA-enabled app
- Service worker configuration in `wwwroot/service-worker.js`
- Manifest configuration in `wwwroot/manifest.json`

### Package Management
- `dotnet add package Microsoft.AspNetCore.Components.WebAssembly` - Core WASM components
- `dotnet add package Microsoft.AspNetCore.Components.WebAssembly.DevServer` - Development server
- `dotnet add package System.Net.Http.Json` - HTTP JSON extensions

### Development Tools
- `dotnet test` - Run component tests
- `dotnet format` - Format code
- `dotnet publish -c Release -o ./publish` - Publish optimized build

## Blazor WebAssembly Project Structure

```
MyBlazorWasmApp/
├── Program.cs                  # Application entry point
├── App.razor                   # Root component
├── _Imports.razor             # Global using statements
├── Components/                # Reusable components (.NET 8+)
│   ├── Layout/               # Layout components
│   │   ├── MainLayout.razor
│   │   ├── NavMenu.razor
│   │   └── MainLayout.razor.css
│   ├── Pages/                # Page components
│   │   ├── Home.razor
│   │   ├── Counter.razor
│   │   ├── FetchData.razor
│   │   └── Weather.razor
│   └── Shared/               # Shared components
│       ├── SurveyPrompt.razor
│       └── LoadingIndicator.razor
├── Services/                 # Client-side services
│   ├── WeatherForecastService.cs
│   ├── ApiService.cs
│   └── LocalStorageService.cs
├── Models/                   # Data models
│   ├── WeatherForecast.cs
│   └── ApiResponse.cs
├── wwwroot/                  # Static web assets
│   ├── index.html           # Main HTML page
│   ├── manifest.json        # PWA manifest
│   ├── service-worker.js    # PWA service worker
│   ├── css/
│   │   ├── app.css
│   │   └── bootstrap/
│   ├── js/
│   │   └── app.js
│   ├── icon-192.png         # PWA icons
│   ├── icon-512.png
│   └── favicon.png
├── appsettings.json         # Configuration
└── MyBlazorWasmApp.csproj   # Project file
```

## Program.cs Configuration

```csharp
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using MyBlazorWasmApp.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Configure HTTP client for API calls
builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) 
});

// Register custom services
builder.Services.AddScoped<WeatherForecastService>();
builder.Services.AddScoped<ApiService>();
builder.Services.AddScoped<LocalStorageService>();

// Add logging
builder.Services.AddLogging();

// Build and run the application
await builder.Build().RunAsync();
```

## HTTP Client and API Integration

### API Service Implementation
```csharp
// Services/ApiService.cs
using System.Net.Http.Json;
using System.Text.Json;

public class ApiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ApiService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApiService(HttpClient httpClient, ILogger<ApiService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task<T?> GetAsync<T>(string endpoint)
    {
        try
        {
            _logger.LogInformation("Fetching data from {Endpoint}", endpoint);
            var response = await _httpClient.GetFromJsonAsync<T>(endpoint, _jsonOptions);
            return response;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error occurred while fetching from {Endpoint}", endpoint);
            throw;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Request timeout occurred while fetching from {Endpoint}", endpoint);
            throw;
        }
    }

    public async Task<TResponse?> PostAsync<TRequest, TResponse>(string endpoint, TRequest data)
    {
        try
        {
            _logger.LogInformation("Posting data to {Endpoint}", endpoint);
            var response = await _httpClient.PostAsJsonAsync(endpoint, data, _jsonOptions);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<TResponse>(_jsonOptions);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error occurred while posting to {Endpoint}", endpoint);
            throw;
        }
    }
}
```

### Weather Service with Error Handling
```csharp
// Services/WeatherForecastService.cs
public class WeatherForecastService
{
    private readonly ApiService _apiService;
    private readonly ILogger<WeatherForecastService> _logger;

    public WeatherForecastService(ApiService apiService, ILogger<WeatherForecastService> logger)
    {
        _apiService = apiService;
        _logger = logger;
    }

    public async Task<WeatherForecast[]> GetForecastAsync()
    {
        try
        {
            var forecasts = await _apiService.GetAsync<WeatherForecast[]>("sample-data/weather.json");
            return forecasts ?? Array.Empty<WeatherForecast>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch weather forecast");
            // Return fallback data or empty array
            return GetFallbackWeatherData();
        }
    }

    private WeatherForecast[] GetFallbackWeatherData()
    {
        var startDate = DateOnly.FromDateTime(DateTime.Now);
        var summaries = new[] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };
        
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = startDate.AddDays(index),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = summaries[Random.Shared.Next(summaries.Length)]
        }).ToArray();
    }
}
```

## Component Development for WebAssembly

### Data Fetching Component
```razor
@* Components/Pages/FetchData.razor *@
@page "/fetchdata"
@using MyBlazorWasmApp.Services
@using MyBlazorWasmApp.Models
@inject WeatherForecastService ForecastService
@inject ILogger<FetchData> Logger
@rendermode InteractiveWebAssembly

<PageTitle>Weather forecast</PageTitle>

<h1>Weather forecast</h1>
<p>This component demonstrates fetching data from a service.</p>

@if (forecasts == null)
{
    <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
}
else if (hasError)
{
    <div class="alert alert-danger">
        <h4>Error Loading Data</h4>
        <p>Unable to load weather forecast. Please try again later.</p>
        <button class="btn btn-primary" @onclick="LoadData">Retry</button>
    </div>
}
else
{
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Date</th>
                <th>Temp. (C)</th>
                <th>Temp. (F)</th>
                <th>Summary</th>
            </tr>
        </thead>
        <tbody>
            @foreach (var forecast in forecasts)
            {
                <tr>
                    <td>@forecast.Date.ToShortDateString()</td>
                    <td>@forecast.TemperatureC</td>
                    <td>@forecast.TemperatureF</td>
                    <td>@forecast.Summary</td>
                </tr>
            }
        </tbody>
    </table>
}

@code {
    private WeatherForecast[]? forecasts;
    private bool hasError = false;

    protected override async Task OnInitializedAsync()
    {
        await LoadData();
    }

    private async Task LoadData()
    {
        try
        {
            hasError = false;
            forecasts = null; // Show loading
            forecasts = await ForecastService.GetForecastAsync();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error loading weather data");
            hasError = true;
        }
    }
}
```

### Interactive Form Component
```razor
@* Components/Shared/ContactForm.razor *@
@using System.ComponentModel.DataAnnotations
@using System.Text.Json

<div class="card">
    <div class="card-header">
        <h3>Contact Us</h3>
    </div>
    <div class="card-body">
        <EditForm Model="contactModel" OnValidSubmit="HandleValidSubmit" OnInvalidSubmit="HandleInvalidSubmit">
            <DataAnnotationsValidator />
            
            <div class="mb-3">
                <label class="form-label">Name</label>
                <InputText class="form-control" @bind-Value="contactModel.Name" />
                <ValidationMessage For="() => contactModel.Name" />
            </div>

            <div class="mb-3">
                <label class="form-label">Email</label>
                <InputText class="form-control" @bind-Value="contactModel.Email" type="email" />
                <ValidationMessage For="() => contactModel.Email" />
            </div>

            <div class="mb-3">
                <label class="form-label">Subject</label>
                <InputSelect class="form-select" @bind-Value="contactModel.Subject">
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Support</option>
                    <option value="feedback">Feedback</option>
                </InputSelect>
                <ValidationMessage For="() => contactModel.Subject" />
            </div>

            <div class="mb-3">
                <label class="form-label">Message</label>
                <InputTextArea class="form-control" rows="4" @bind-Value="contactModel.Message" />
                <ValidationMessage For="() => contactModel.Message" />
            </div>

            <div class="mb-3">
                <button type="submit" class="btn btn-primary" disabled="@isSubmitting">
                    @if (isSubmitting)
                    {
                        <span class="spinner-border spinner-border-sm me-2"></span>
                        Sending...
                    }
                    else
                    {
                        Send Message
                    }
                </button>
                <button type="button" class="btn btn-secondary ms-2" @onclick="ResetForm">Reset</button>
            </div>
        </EditForm>

        @if (submitResult != null)
        {
            <div class="alert @(submitResult.IsSuccess ? "alert-success" : "alert-danger")">
                @submitResult.Message
            </div>
        }
    </div>
</div>

@code {
    [Inject]
    public ApiService ApiService { get; set; } = null!;

    private ContactModel contactModel = new();
    private bool isSubmitting = false;
    private SubmitResult? submitResult;

    private async Task HandleValidSubmit()
    {
        isSubmitting = true;
        submitResult = null;

        try
        {
            // Simulate API call or use actual endpoint
            await Task.Delay(1000); // Simulate network delay
            
            // For demo purposes - in real app, call API
            submitResult = new SubmitResult
            {
                IsSuccess = true,
                Message = "Thank you! Your message has been sent successfully."
            };

            ResetForm();
        }
        catch (Exception ex)
        {
            submitResult = new SubmitResult
            {
                IsSuccess = false,
                Message = $"Sorry, there was an error sending your message: {ex.Message}"
            };
        }
        finally
        {
            isSubmitting = false;
        }
    }

    private void HandleInvalidSubmit()
    {
        submitResult = new SubmitResult
        {
            IsSuccess = false,
            Message = "Please correct the errors above and try again."
        };
    }

    private void ResetForm()
    {
        contactModel = new ContactModel();
        submitResult = null;
    }

    private class ContactModel
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please select a subject")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Message is required")]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Message must be between 10 and 1000 characters")]
        public string Message { get; set; } = string.Empty;
    }

    private class SubmitResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
```

## Local Storage Integration

```csharp
// Services/LocalStorageService.cs
using Microsoft.JSInterop;
using System.Text.Json;

public class LocalStorageService
{
    private readonly IJSRuntime _jsRuntime;
    private readonly JsonSerializerOptions _jsonOptions;

    public LocalStorageService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task SetItemAsync<T>(string key, T value)
    {
        var json = JsonSerializer.Serialize(value, _jsonOptions);
        await _jsRuntime.InvokeVoidAsync("localStorage.setItem", key, json);
    }

    public async Task<T?> GetItemAsync<T>(string key)
    {
        var json = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", key);
        
        if (string.IsNullOrEmpty(json))
            return default;

        try
        {
            return JsonSerializer.Deserialize<T>(json, _jsonOptions);
        }
        catch
        {
            return default;
        }
    }

    public async Task RemoveItemAsync(string key)
    {
        await _jsRuntime.InvokeVoidAsync("localStorage.removeItem", key);
    }

    public async Task ClearAsync()
    {
        await _jsRuntime.InvokeVoidAsync("localStorage.clear");
    }
}
```

## Progressive Web App (PWA) Features

### Service Worker Configuration
```javascript
// wwwroot/service-worker.js
const CACHE_NAME = 'blazor-app-v1';
const urlsToCache = [
    '/',
    '/css/app.css',
    '/js/app.js',
    '/manifest.json',
    '/_framework/blazor.webassembly.js'
];

self.addEventListener('install', event => {
    console.log('Service Worker installing');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Handle background sync
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Background sync event');
        // Handle background tasks
    }
});

// Handle push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Default notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
    };

    event.waitUntil(
        self.registration.showNotification('Blazor App Notification', options)
    );
});
```

### PWA Manifest
```json
// wwwroot/manifest.json
{
    "name": "My Blazor WebAssembly App",
    "short_name": "BlazorWASM",
    "description": "A Progressive Web App built with Blazor WebAssembly",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#0d6efd",
    "background_color": "#ffffff",
    "orientation": "portrait-primary",
    "icons": [
        {
            "src": "icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable any"
        },
        {
            "src": "icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable any"
        }
    ],
    "categories": ["productivity", "utilities"]
}
```

## Performance Optimization

### Lazy Loading Components
```razor
@* App.razor with lazy loading *@
<Router AppAssembly="@typeof(App).Assembly" AdditionalAssemblies="new[] { typeof(ComponentLibrary.Component1).Assembly }">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
    </Found>
    <NotFound>
        <PageTitle>Not found</PageTitle>
        <LayoutView Layout="@typeof(MainLayout)">
            <p role="alert">Sorry, there's nothing at this address.</p>
        </LayoutView>
    </NotFound>
</Router>
```

### Bundle Size Optimization
```xml
<!-- MyBlazorWasmApp.csproj -->
<Project Sdk="Microsoft.NET.Sdk.BlazorWebAssembly">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <PublishTrimmed>true</PublishTrimmed>
    <TrimMode>link</TrimMode>
    <InvariantGlobalization>true</InvariantGlobalization>
    <BlazorEnableCompression>true</BlazorEnableCompression>
  </PropertyGroup>
  
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly" Version="8.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.DevServer" Version="8.0.0" PrivateAssets="all" />
  </ItemGroup>
</Project>
```

## Offline Capabilities

### Offline Detection Component
```razor
@* Components/Shared/OfflineIndicator.razor *@
@using Microsoft.JSInterop
@inject IJSRuntime JSRuntime
@implements IAsyncDisposable

@if (!isOnline)
{
    <div class="alert alert-warning fixed-top text-center" style="z-index: 9999;">
        <i class="fas fa-wifi-slash me-2"></i>
        You are currently offline. Some features may not be available.
    </div>
}

@code {
    private bool isOnline = true;
    private IJSObjectReference? jsModule;
    private DotNetObjectReference<OfflineIndicator>? objRef;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            jsModule = await JSRuntime.InvokeAsync<IJSObjectReference>("import", "./js/offline.js");
            objRef = DotNetObjectReference.Create(this);
            await jsModule.InvokeVoidAsync("initializeOfflineDetection", objRef);
        }
    }

    [JSInvokable]
    public async Task OnOnlineStatusChanged(bool online)
    {
        isOnline = online;
        await InvokeAsync(StateHasChanged);
    }

    public async ValueTask DisposeAsync()
    {
        if (jsModule is not null)
        {
            await jsModule.DisposeAsync();
        }
        objRef?.Dispose();
    }
}
```

### Offline JavaScript Module
```javascript
// wwwroot/js/offline.js
export function initializeOfflineDetection(dotNetRef) {
    function updateOnlineStatus() {
        dotNetRef.invokeMethodAsync('OnOnlineStatusChanged', navigator.onLine);
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    return {
        dispose: () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        }
    };
}
```

## Testing Blazor WebAssembly

### Component Testing with bUnit
```csharp
// Tests/Components/CounterTests.cs
using Bunit;
using Microsoft.Extensions.DependencyInjection;
using MyBlazorWasmApp.Components.Pages;

public class CounterTests : TestContext
{
    [Fact]
    public void Counter_InitialValue_IsZero()
    {
        // Arrange & Act
        var component = RenderComponent<Counter>();

        // Assert
        var paragraph = component.Find("p");
        Assert.Contains("Current count: 0", paragraph.TextContent);
    }

    [Fact]
    public void Counter_ClickButton_IncrementsValue()
    {
        // Arrange
        var component = RenderComponent<Counter>();
        var button = component.Find("button");

        // Act
        button.Click();

        // Assert
        var paragraph = component.Find("p");
        Assert.Contains("Current count: 1", paragraph.TextContent);
    }
}
```

## Deployment Considerations

### GitHub Pages Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

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
        
    - name: Publish
      run: dotnet publish -c Release -o release
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: release/wwwroot
```

### Azure Static Web Apps
```json
// staticwebapp.config.json
{
    "routes": [
        {
            "route": "/*",
            "serve": "/index.html",
            "statusCode": 200
        }
    ],
    "navigationFallback": {
        "rewrite": "/index.html"
    },
    "mimeTypes": {
        ".dll": "application/octet-stream",
        ".wasm": "application/wasm"
    }
}
```

## Development Workflow

### Getting Started
1. Create project: `dotnet new blazorwasm -n MyBlazorWasmApp --pwa`
2. Add necessary packages for HTTP client, services
3. Configure services in `Program.cs`
4. Create components in `Components/` folder
5. Set up API integration and local storage
6. Run application: `dotnet watch run`

### Building for Production
1. Optimize: `dotnet publish -c Release`
2. Test offline functionality
3. Validate PWA features (manifest, service worker)
4. Check bundle size and performance
5. Deploy to static hosting service

### Performance Testing
- Use browser dev tools to monitor WASM module loading
- Test offline functionality
- Verify service worker caching
- Monitor bundle size and optimize as needed