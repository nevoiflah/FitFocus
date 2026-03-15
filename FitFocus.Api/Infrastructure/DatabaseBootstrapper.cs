using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Infrastructure;

public sealed class DatabaseBootstrapper(
    ISqlConnectionFactory connectionFactory,
    IWebHostEnvironment environment) : IDatabaseBootstrapper
{
    public async Task EnsureTablesAsync()
    {
        var sqlPath = Path.Combine(environment.ContentRootPath, "sql", "CreateFitFocusTables.sql");
        if (!File.Exists(sqlPath))
        {
            return;
        }

        var sql = await File.ReadAllTextAsync(sqlPath);
        if (string.IsNullOrWhiteSpace(sql))
        {
            return;
        }

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}
