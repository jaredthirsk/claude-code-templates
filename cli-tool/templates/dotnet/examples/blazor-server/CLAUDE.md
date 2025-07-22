# Blazor Server Project Configuration

This file provides specific guidance for Blazor Server application development using Claude Code.

## Project Overview

This is a Blazor Server application project optimized for interactive web UI development with server-side rendering, real-time updates via SignalR, and component-based architecture.

## Blazor Server-Specific Development Commands

### Project Management
- `dotnet new blazorserver -n MyBlazorApp` - Create new Blazor Server project
- `dotnet run` - Start development server
- `dotnet watch run` - Start with hot reload
- `dotnet run --urls="https://localhost:5001"` - Run with specific URL

### Component Development
- `dotnet new blazor-component -n MyComponent` - Create new Blazor component (if template installed)
- `dotnet add package Microsoft.AspNetCore.Components.Web` - Add component libraries

### Database Integration
- `dotnet add package Microsoft.EntityFrameworkCore.SqlServer` - Add EF Core SQL Server
- `dotnet add package Microsoft.EntityFrameworkCore.Tools` - Add EF tools
- `dotnet ef migrations add InitialCreate` - Create migrations
- `dotnet ef database update` - Update database

### Development Tools
- `dotnet test` - Run component and integration tests
- `dotnet format` - Format Razor and C# code
- `dotnet build --configuration Release` - Build for production

## Blazor Server Project Structure

```
MyBlazorApp/
├── Components/                  # Reusable components (.NET 8+)
│   ├── Layout/                 # Layout components
│   │   ├── MainLayout.razor
│   │   ├── NavMenu.razor
│   │   └── MainLayout.razor.css
│   ├── Pages/                  # Page components
│   │   ├── Home.razor
│   │   ├── Counter.razor
│   │   ├── Weather.razor
│   │   └── Users/
│   │       ├── UserList.razor
│   │       └── UserDetail.razor
│   ├── Shared/                 # Shared components
│   │   ├── UserCard.razor
│   │   └── LoadingSpinner.razor
│   └── App.razor              # Root component
├── Services/                   # Business logic services
│   ├── IUserService.cs
│   ├── UserService.cs
│   └── WeatherForecastService.cs
├── Data/                       # Data access layer
│   ├── ApplicationDbContext.cs
│   ├── Models/
│   │   └── User.cs
│   └── Migrations/
├── wwwroot/                    # Static files
│   ├── css/
│   │   ├── site.css
│   │   └── bootstrap/
│   ├── js/
│   │   └── site.js
│   ├── images/
│   └── favicon.png
├── Program.cs                  # Application configuration
├── appsettings.json           # Configuration
├── _Imports.razor             # Global using statements
└── MyBlazorApp.csproj         # Project file
```

## Program.cs Configuration

```csharp
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.EntityFrameworkCore;
using MyBlazorApp.Data;
using MyBlazorApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Add Blazor Server services
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

// Database configuration
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Service registration
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<WeatherForecastService>();

// Add SignalR (for Blazor Server communication)
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 32 * 1024; // 32KB
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.MapRazorPages();
app.MapBlazorHub(); // Essential for Blazor Server
app.MapFallbackToPage("/_Host");

app.Run();
```

## Component Development Best Practices

### Basic Component Structure
```razor
@* Components/Shared/UserCard.razor *@
@using MyBlazorApp.Data.Models

<div class="card user-card">
    <div class="card-body">
        <h5 class="card-title">@User.FirstName @User.LastName</h5>
        <p class="card-text">@User.Email</p>
        <button class="btn btn-primary" @onclick="OnViewDetails">
            View Details
        </button>
        @if (ShowDetails)
        {
            <div class="mt-3">
                <p><strong>Phone:</strong> @User.PhoneNumber</p>
                <p><strong>Created:</strong> @User.CreatedAt.ToString("yyyy-MM-dd")</p>
            </div>
        }
    </div>
</div>

@code {
    [Parameter, EditorRequired]
    public User User { get; set; } = new();

    [Parameter]
    public EventCallback<User> OnUserSelected { get; set; }

    private bool ShowDetails { get; set; } = false;

    private async Task OnViewDetails()
    {
        ShowDetails = !ShowDetails;
        if (OnUserSelected.HasDelegate)
        {
            await OnUserSelected.InvokeAsync(User);
        }
    }
}
```

### Component with Dependency Injection
```razor
@* Components/Pages/UserList.razor *@
@page "/users"
@using MyBlazorApp.Services
@inject IUserService UserService
@inject IJSRuntime JSRuntime
@rendermode InteractiveServer

<PageTitle>Users</PageTitle>

<h3>User Management</h3>

@if (isLoading)
{
    <LoadingSpinner />
}
else if (users != null && users.Any())
{
    <div class="row">
        @foreach (var user in users)
        {
            <div class="col-md-4 mb-3">
                <UserCard User="user" OnUserSelected="HandleUserSelected" />
            </div>
        }
    </div>
    
    <button class="btn btn-success" @onclick="ShowCreateForm">
        Add New User
    </button>
}
else
{
    <div class="alert alert-info">
        <p>No users found. <button class="btn btn-link p-0" @onclick="ShowCreateForm">Create the first user</button></p>
    </div>
}

@if (showCreateForm)
{
    <CreateUserForm OnUserCreated="HandleUserCreated" OnCancel="HideCreateForm" />
}

@code {
    private List<User>? users;
    private bool isLoading = true;
    private bool showCreateForm = false;

    protected override async Task OnInitializedAsync()
    {
        await LoadUsers();
    }

    private async Task LoadUsers()
    {
        isLoading = true;
        try
        {
            users = await UserService.GetAllUsersAsync();
        }
        catch (Exception ex)
        {
            await JSRuntime.InvokeVoidAsync("console.error", $"Error loading users: {ex.Message}");
        }
        finally
        {
            isLoading = false;
        }
    }

    private async Task HandleUserSelected(User user)
    {
        await JSRuntime.InvokeVoidAsync("console.log", $"User selected: {user.FirstName} {user.LastName}");
    }

    private void ShowCreateForm() => showCreateForm = true;
    private void HideCreateForm() => showCreateForm = false;

    private async Task HandleUserCreated(User newUser)
    {
        showCreateForm = false;
        await LoadUsers(); // Refresh the list
        await JSRuntime.InvokeVoidAsync("alert", $"User '{newUser.FirstName} {newUser.LastName}' created successfully!");
    }
}
```

### Form Component with Validation
```razor
@* Components/Shared/CreateUserForm.razor *@
@using System.ComponentModel.DataAnnotations
@using MyBlazorApp.Services

<div class="modal" style="display: block; background: rgba(0,0,0,0.5);">
    <div class="modal-dialog">
        <div class="modal-content">
            <EditForm Model="userModel" OnValidSubmit="HandleValidSubmit">
                <DataAnnotationsValidator />
                <div class="modal-header">
                    <h5 class="modal-title">Create New User</h5>
                </div>
                <div class="modal-body">
                    <ValidationSummary />
                    
                    <div class="mb-3">
                        <label class="form-label">First Name</label>
                        <InputText class="form-control" @bind-Value="userModel.FirstName" />
                        <ValidationMessage For="() => userModel.FirstName" />
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Last Name</label>
                        <InputText class="form-control" @bind-Value="userModel.LastName" />
                        <ValidationMessage For="() => userModel.LastName" />
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <InputText class="form-control" @bind-Value="userModel.Email" type="email" />
                        <ValidationMessage For="() => userModel.Email" />
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Phone Number</label>
                        <InputText class="form-control" @bind-Value="userModel.PhoneNumber" />
                        <ValidationMessage For="() => userModel.PhoneNumber" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @onclick="OnCancel">Cancel</button>
                    <button type="submit" class="btn btn-primary" disabled="@isSubmitting">
                        @if (isSubmitting)
                        {
                            <span class="spinner-border spinner-border-sm me-2"></span>
                        }
                        Create User
                    </button>
                </div>
            </EditForm>
        </div>
    </div>
</div>

@code {
    [Parameter, EditorRequired]
    public EventCallback<User> OnUserCreated { get; set; }

    [Parameter, EditorRequired]
    public EventCallback OnCancel { get; set; }

    [Inject]
    public IUserService UserService { get; set; } = null!;

    private CreateUserModel userModel = new();
    private bool isSubmitting = false;

    private async Task HandleValidSubmit()
    {
        isSubmitting = true;
        try
        {
            var user = await UserService.CreateUserAsync(new CreateUserRequest
            {
                FirstName = userModel.FirstName,
                LastName = userModel.LastName,
                Email = userModel.Email,
                PhoneNumber = userModel.PhoneNumber
            });

            await OnUserCreated.InvokeAsync(user);
        }
        finally
        {
            isSubmitting = false;
        }
    }

    private class CreateUserModel
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }
    }
}
```

## State Management

### Cascading Values
```razor
@* App.razor or MainLayout.razor *@
<CascadingValue Value="currentUser">
    <CascadingValue Value="appSettings">
        @Body
    </CascadingValue>
</CascadingValue>

@code {
    private User? currentUser;
    private AppSettings appSettings = new();

    protected override async Task OnInitializedAsync()
    {
        // Initialize cascading values
        appSettings = await ConfigurationService.GetSettingsAsync();
        currentUser = await AuthService.GetCurrentUserAsync();
    }
}
```

### Scoped Services for State
```csharp
// Services/AppStateService.cs
public class AppStateService
{
    private readonly List<User> _users = new();
    
    public event Action? OnStateChanged;

    public IReadOnlyList<User> Users => _users.AsReadOnly();

    public void AddUser(User user)
    {
        _users.Add(user);
        NotifyStateChanged();
    }

    public void UpdateUser(User user)
    {
        var index = _users.FindIndex(u => u.Id == user.Id);
        if (index >= 0)
        {
            _users[index] = user;
            NotifyStateChanged();
        }
    }

    public void RemoveUser(int userId)
    {
        var user = _users.FirstOrDefault(u => u.Id == userId);
        if (user != null)
        {
            _users.Remove(user);
            NotifyStateChanged();
        }
    }

    private void NotifyStateChanged() => OnStateChanged?.Invoke();
}
```

## JavaScript Interop

### Calling JavaScript from Blazor
```razor
@inject IJSRuntime JSRuntime

<button class="btn btn-primary" @onclick="ShowAlert">Show Alert</button>
<button class="btn btn-info" @onclick="ScrollToTop">Scroll to Top</button>

@code {
    private async Task ShowAlert()
    {
        await JSRuntime.InvokeVoidAsync("alert", "Hello from Blazor!");
    }

    private async Task ScrollToTop()
    {
        await JSRuntime.InvokeVoidAsync("window.scrollTo", 0, 0);
    }

    private async Task<string> GetUserAgent()
    {
        return await JSRuntime.InvokeAsync<string>("eval", "navigator.userAgent");
    }
}
```

### Custom JavaScript Functions
```javascript
// wwwroot/js/site.js
window.blazorFunctions = {
    showConfirmDialog: (message) => {
        return confirm(message);
    },
    
    saveToLocalStorage: (key, value) => {
        localStorage.setItem(key, value);
    },
    
    getFromLocalStorage: (key) => {
        return localStorage.getItem(key);
    },
    
    focusElement: (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.focus();
        }
    }
};
```

## Real-time Features with SignalR

### SignalR Hub
```csharp
// Hubs/ChatHub.cs
using Microsoft.AspNetCore.SignalR;

public class ChatHub : Hub
{
    public async Task SendMessage(string user, string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Group(groupName).SendAsync("UserJoined", $"{Context.ConnectionId} joined {groupName}");
    }
}
```

### Blazor Component with SignalR
```razor
@* Components/Chat.razor *@
@using Microsoft.AspNetCore.SignalR.Client
@inject NavigationManager Navigation
@implements IAsyncDisposable
@rendermode InteractiveServer

<div class="chat-container">
    <div class="messages" style="height: 300px; overflow-y: auto;">
        @foreach (var message in messages)
        {
            <div class="message mb-2">
                <strong>@message.User:</strong> @message.Text
            </div>
        }
    </div>
    
    <div class="chat-input mt-3">
        <div class="input-group">
            <input @bind="messageInput" @onkeypress="OnKeyPress" class="form-control" placeholder="Type a message..." />
            <button class="btn btn-primary" @onclick="SendMessage" disabled="@(!IsConnected)">Send</button>
        </div>
    </div>
    
    <div class="connection-status">
        Status: <span class="@(IsConnected ? "text-success" : "text-danger")">
            @(IsConnected ? "Connected" : "Disconnected")
        </span>
    </div>
</div>

@code {
    private HubConnection? hubConnection;
    private List<ChatMessage> messages = new();
    private string messageInput = string.Empty;
    private string currentUser = "Anonymous";

    protected override async Task OnInitializedAsync()
    {
        hubConnection = new HubConnectionBuilder()
            .WithUrl(Navigation.ToAbsoluteUri("/chathub"))
            .Build();

        hubConnection.On<string, string>("ReceiveMessage", (user, message) =>
        {
            messages.Add(new ChatMessage { User = user, Text = message });
            InvokeAsync(StateHasChanged);
        });

        await hubConnection.StartAsync();
    }

    private async Task SendMessage()
    {
        if (hubConnection is not null && !string.IsNullOrWhiteSpace(messageInput))
        {
            await hubConnection.SendAsync("SendMessage", currentUser, messageInput);
            messageInput = string.Empty;
        }
    }

    private async Task OnKeyPress(KeyboardEventArgs e)
    {
        if (e.Key == "Enter")
        {
            await SendMessage();
        }
    }

    public bool IsConnected =>
        hubConnection?.State == HubConnectionState.Connected;

    public async ValueTask DisposeAsync()
    {
        if (hubConnection is not null)
        {
            await hubConnection.DisposeAsync();
        }
    }

    private class ChatMessage
    {
        public string User { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
    }
}
```

## Performance Optimization

### Component Rendering Optimization
```razor
@* Use ShouldRender to control re-rendering *@
@code {
    private int previousCount;
    
    protected override bool ShouldRender()
    {
        if (Count != previousCount)
        {
            previousCount = Count;
            return true;
        }
        return false;
    }
}
```

### Virtualization for Large Lists
```razor
@using Microsoft.AspNetCore.Components.Web.Virtualization

<Virtualize Items="largeItemList" Context="item">
    <div class="item">
        <h4>@item.Title</h4>
        <p>@item.Description</p>
    </div>
</Virtualize>
```

## Testing Blazor Components

### bUnit Testing Framework
```csharp
// Tests/Components/UserCardTests.cs
using Bunit;
using Microsoft.Extensions.DependencyInjection;
using MyBlazorApp.Components.Shared;

public class UserCardTests : TestContext
{
    [Fact]
    public void UserCard_RendersCorrectly()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com"
        };

        // Act
        var component = RenderComponent<UserCard>(parameters => parameters
            .Add(p => p.User, user));

        // Assert
        Assert.Contains("John Doe", component.Markup);
        Assert.Contains("john@example.com", component.Markup);
    }

    [Fact]
    public void UserCard_ViewDetailsButton_TogglesDetails()
    {
        // Arrange
        var user = new User { FirstName = "Jane", LastName = "Smith", PhoneNumber = "123-456-7890" };
        var component = RenderComponent<UserCard>(parameters => parameters.Add(p => p.User, user));

        // Act
        var button = component.Find("button:contains('View Details')");
        button.Click();

        // Assert
        Assert.Contains("123-456-7890", component.Markup);
    }
}
```

## Error Handling

### Global Error Boundary
```razor
@* Components/Shared/ErrorBoundary.razor *@
<ErrorBoundary>
    <ChildContent>
        @ChildContent
    </ChildContent>
    <ErrorContent>
        <div class="alert alert-danger">
            <h4>An error occurred</h4>
            <p>Something went wrong. Please refresh the page or contact support.</p>
        </div>
    </ErrorContent>
</ErrorBoundary>

@code {
    [Parameter]
    public RenderFragment? ChildContent { get; set; }
}
```

## Development Workflow

### Getting Started
1. Create project: `dotnet new blazorserver -n MyBlazorApp`
2. Add necessary packages for Entity Framework, authentication, etc.
3. Configure services in `Program.cs`
4. Create components in `Components/` folder
5. Set up database with `dotnet ef migrations add` and `dotnet ef database update`
6. Run application: `dotnet watch run`

### Hot Reload Development
- Use `dotnet watch run` for automatic recompilation
- Changes to Razor components reload automatically
- CSS changes are applied without restart
- C# code changes trigger rebuild

### Debugging
- Set breakpoints in component code-behind
- Use browser dev tools for JavaScript debugging
- Monitor SignalR connection in Network tab
- Use `@* Debug: @variable *@` for quick debugging