using FitFocus.Api.Infrastructure;
using FitFocus.Api.Repositories.Interfaces;
using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Repositories;

public sealed class DeviceTokenRepository(ISqlConnectionFactory connectionFactory) : IDeviceTokenRepository
{
    public async Task UpsertAsync(int userId, string expoPushToken, string? deviceName)
    {
        const string sql = """
            MERGE dbo.FitFocus_DeviceTokensApp AS target
            USING (SELECT @UserId AS UserId, @ExpoPushToken AS ExpoPushToken) AS source
            ON target.UserId = source.UserId AND target.ExpoPushToken = source.ExpoPushToken
            WHEN MATCHED THEN
                UPDATE SET DeviceName = @DeviceName, LastSeenAt = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (UserId, ExpoPushToken, DeviceName, LastSeenAt)
                VALUES (@UserId, @ExpoPushToken, @DeviceName, SYSUTCDATETIME());
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@ExpoPushToken", expoPushToken);
        command.Parameters.AddWithValue("@DeviceName", deviceName ?? (object)DBNull.Value);
        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }

    public async Task DeleteAsync(int userId, string expoPushToken)
    {
        const string sql = "DELETE FROM dbo.FitFocus_DeviceTokensApp WHERE UserId = @UserId AND ExpoPushToken = @ExpoPushToken";
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@ExpoPushToken", expoPushToken);
        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }

    public async Task<List<string>> GetTokensByUserAsync(int userId)
    {
        const string sql = """
            SELECT ExpoPushToken
            FROM dbo.FitFocus_DeviceTokensApp
            WHERE UserId = @UserId
            ORDER BY LastSeenAt DESC
            """;

        var results = new List<string>();
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(reader.GetString(0));
        }

        return results;
    }
}
