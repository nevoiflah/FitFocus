using System.Text;
using FitFocus.Api.Configuration;
using FitFocus.Api.Infrastructure;
using FitFocus.Api.Repositories;
using FitFocus.Api.Repositories.Interfaces;
using FitFocus.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
builder.Services.AddSingleton<IPasswordService, PasswordService>();
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddSingleton<IRiskScoreService, RiskScoreService>();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IDatabaseBootstrapper, DatabaseBootstrapper>();
builder.Services.AddSingleton<StartupStatus>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IDailyLogRepository, DailyLogRepository>();
builder.Services.AddScoped<IMealRepository, MealRepository>();
builder.Services.AddScoped<IReminderRepository, ReminderRepository>();
builder.Services.AddScoped<IDeviceTokenRepository, DeviceTokenRepository>();

var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = ResolveAllowedOrigins(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy("FitFocusClient", policy =>
    {
        if (builder.Environment.IsDevelopment() && IsWildcard(allowedOrigins))
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        if (allowedOrigins.Length == 0 || IsWildcard(allowedOrigins))
        {
            policy
                .WithOrigins("http://localhost:8081", "http://127.0.0.1:8081", "http://localhost:19006")
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();
var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("FitFocus.Startup");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        if (exception is null)
        {
            return;
        }

        logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

        var problem = exception switch
        {
            SqlException => new ProblemDetails
            {
                Title = "Database unavailable",
                Detail = "The API is running, but the database is currently unavailable. Try again shortly.",
                Status = StatusCodes.Status503ServiceUnavailable
            },
            TimeoutException => new ProblemDetails
            {
                Title = "Request timed out",
                Detail = "The request took too long to complete. Try again shortly.",
                Status = StatusCodes.Status503ServiceUnavailable
            },
            _ => new ProblemDetails
            {
                Title = "Unexpected server error",
                Detail = "The server hit an unexpected error while handling the request.",
                Status = StatusCodes.Status500InternalServerError
            }
        };

        problem.Extensions["traceId"] = context.TraceIdentifier;

        context.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problem, cancellationToken: context.RequestAborted);
    });
});

app.Lifetime.ApplicationStarted.Register(() =>
{
    _ = Task.Run(async () =>
    {
        using var scope = app.Services.CreateScope();
        var dbBootstrapper = scope.ServiceProvider.GetRequiredService<IDatabaseBootstrapper>();
        var startupStatus = scope.ServiceProvider.GetRequiredService<StartupStatus>();

        try
        {
            using var bootstrapTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(8));
            await dbBootstrapper.EnsureTablesAsync(bootstrapTimeout.Token);
            startupStatus.MarkDatabaseReady();
            logger.LogInformation("Database bootstrap completed successfully.");
        }
        catch (OperationCanceledException)
        {
            startupStatus.MarkDatabaseUnavailable("Database bootstrap timed out. The API started in degraded mode.");
            logger.LogWarning("Database bootstrap timed out. Continuing startup in degraded mode.");
        }
        catch (SqlException ex)
        {
            startupStatus.MarkDatabaseUnavailable("Database bootstrap failed. The API started in degraded mode.");
            logger.LogWarning(ex, "Database bootstrap failed. Continuing startup in degraded mode.");
        }
        catch (Exception ex)
        {
            startupStatus.MarkDatabaseUnavailable("Database bootstrap hit an unexpected error. The API started in degraded mode.");
            logger.LogError(ex, "Unexpected database bootstrap failure. Continuing startup in degraded mode.");
        }
    });
});

app.UseHttpsRedirection();
app.UseCors("FitFocusClient");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", (StartupStatus startupStatus) =>
{
    var status = startupStatus.DatabaseReady ? "ok" : "degraded";
    return Results.Ok(new
    {
        status,
        startedAtUtc = startupStatus.StartedAtUtc,
        database = new
        {
            ready = startupStatus.DatabaseReady,
            checkedAtUtc = startupStatus.DatabaseCheckedAtUtc,
            message = startupStatus.DatabaseMessage ?? "Database bootstrap has not run yet."
        }
    });
});

app.MapControllers();

app.Run();

static string[] ResolveAllowedOrigins(IConfiguration configuration)
{
    var envOverride = Environment.GetEnvironmentVariable("FITFOCUS_ALLOWED_ORIGINS");
    if (!string.IsNullOrWhiteSpace(envOverride))
    {
        return envOverride
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    }

    return configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
}

static bool IsWildcard(IReadOnlyList<string> origins)
{
    return origins.Count == 0 || origins.Any(origin => origin == "*");
}
