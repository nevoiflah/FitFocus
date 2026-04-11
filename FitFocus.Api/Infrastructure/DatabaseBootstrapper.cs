using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Infrastructure;

public sealed class DatabaseBootstrapper(
    ISqlConnectionFactory connectionFactory,
    IWebHostEnvironment environment,
    ILogger<DatabaseBootstrapper> logger) : IDatabaseBootstrapper
{
    public async Task EnsureTablesAsync(CancellationToken cancellationToken = default)
    {
        var sqlPath = Path.Combine(environment.ContentRootPath, "sql", "CreateFitFocusTables.sql");
        if (!File.Exists(sqlPath))
        {
            logger.LogWarning("Database bootstrap SQL file was not found at {SqlPath}. Skipping bootstrap.", sqlPath);
            return;
        }

        var sql = await File.ReadAllTextAsync(sqlPath, cancellationToken);
        if (string.IsNullOrWhiteSpace(sql))
        {
            logger.LogWarning("Database bootstrap SQL file at {SqlPath} was empty. Skipping bootstrap.", sqlPath);
            return;
        }

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.CommandTimeout = 10;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
