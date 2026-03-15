using FitFocus.Api.Infrastructure;
using FitFocus.Api.Models.Domain;
using FitFocus.Api.Repositories.Interfaces;
using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Repositories;

public sealed class DailyLogRepository(ISqlConnectionFactory connectionFactory) : IDailyLogRepository
{
    public async Task<DailyLog?> GetByDateAsync(int userId, DateOnly date)
    {
        const string sql = """
            SELECT TOP 1 Id, UserId, LogDate, MoodScore, SleepHours, Symptoms, Notes, StressScore, WaterLiters
            FROM dbo.FitFocus_DailyLogsApp
            WHERE UserId = @UserId AND LogDate = @LogDate
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@LogDate", date.ToDateTime(TimeOnly.MinValue));
        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return Map(reader);
    }

    public async Task<List<DailyLog>> GetRangeAsync(int userId, DateOnly from, DateOnly to)
    {
        const string sql = """
            SELECT Id, UserId, LogDate, MoodScore, SleepHours, Symptoms, Notes, StressScore, WaterLiters
            FROM dbo.FitFocus_DailyLogsApp
            WHERE UserId = @UserId AND LogDate BETWEEN @From AND @To
            ORDER BY LogDate DESC
            """;

        var results = new List<DailyLog>();
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@From", from.ToDateTime(TimeOnly.MinValue));
        command.Parameters.AddWithValue("@To", to.ToDateTime(TimeOnly.MinValue));
        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(Map(reader));
        }

        return results;
    }

    public async Task<int> CreateAsync(DailyLog log)
    {
        const string sql = """
            INSERT INTO dbo.FitFocus_DailyLogsApp (UserId, LogDate, MoodScore, SleepHours, Symptoms, Notes, StressScore, WaterLiters)
            OUTPUT INSERTED.Id
            VALUES (@UserId, @LogDate, @MoodScore, @SleepHours, @Symptoms, @Notes, @StressScore, @WaterLiters)
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", log.UserId);
        command.Parameters.AddWithValue("@LogDate", log.LogDate.ToDateTime(TimeOnly.MinValue));
        command.Parameters.AddWithValue("@MoodScore", log.MoodScore);
        command.Parameters.AddWithValue("@SleepHours", log.SleepHours);
        command.Parameters.AddWithValue("@Symptoms", log.Symptoms ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Notes", log.Notes ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@StressScore", log.StressScore);
        command.Parameters.AddWithValue("@WaterLiters", log.WaterLiters);
        await connection.OpenAsync();
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> UpdateAsync(int id, int userId, DailyLog log)
    {
        const string sql = """
            UPDATE dbo.FitFocus_DailyLogsApp
            SET MoodScore = @MoodScore,
                SleepHours = @SleepHours,
                Symptoms = @Symptoms,
                Notes = @Notes,
                StressScore = @StressScore,
                WaterLiters = @WaterLiters,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id AND UserId = @UserId
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@MoodScore", log.MoodScore);
        command.Parameters.AddWithValue("@SleepHours", log.SleepHours);
        command.Parameters.AddWithValue("@Symptoms", log.Symptoms ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Notes", log.Notes ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@StressScore", log.StressScore);
        command.Parameters.AddWithValue("@WaterLiters", log.WaterLiters);
        await connection.OpenAsync();
        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        const string sql = "DELETE FROM dbo.FitFocus_DailyLogsApp WHERE Id = @Id AND UserId = @UserId";
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@UserId", userId);
        await connection.OpenAsync();
        return await command.ExecuteNonQueryAsync() > 0;
    }

    private static DailyLog Map(SqlDataReader reader)
    {
        return new DailyLog
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
            LogDate = DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("LogDate"))),
            MoodScore = reader.GetInt32(reader.GetOrdinal("MoodScore")),
            SleepHours = reader.GetDecimal(reader.GetOrdinal("SleepHours")),
            Symptoms = reader.IsDBNull(reader.GetOrdinal("Symptoms")) ? null : reader.GetString(reader.GetOrdinal("Symptoms")),
            Notes = reader.IsDBNull(reader.GetOrdinal("Notes")) ? null : reader.GetString(reader.GetOrdinal("Notes")),
            StressScore = reader.GetInt32(reader.GetOrdinal("StressScore")),
            WaterLiters = reader.GetDecimal(reader.GetOrdinal("WaterLiters"))
        };
    }
}
