using FitFocus.Api.Infrastructure;
using FitFocus.Api.Models.Domain;
using FitFocus.Api.Repositories.Interfaces;
using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Repositories;

public sealed class MealRepository(ISqlConnectionFactory connectionFactory) : IMealRepository
{
    public async Task<int> CreateAsync(MealEntry meal)
    {
        const string sql = """
            INSERT INTO dbo.FitFocus_MealsApp (UserId, DailyLogId, LogDate, MealType, MealName, Calories, ImageUrl)
            OUTPUT INSERTED.Id
            VALUES (@UserId, @DailyLogId, @LogDate, @MealType, @MealName, @Calories, @ImageUrl)
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", meal.UserId);
        command.Parameters.AddWithValue("@DailyLogId", meal.DailyLogId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@LogDate", meal.LogDate.ToDateTime(TimeOnly.MinValue));
        command.Parameters.AddWithValue("@MealType", meal.MealType);
        command.Parameters.AddWithValue("@MealName", meal.MealName);
        command.Parameters.AddWithValue("@Calories", meal.Calories ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ImageUrl", meal.ImageUrl ?? (object)DBNull.Value);
        await connection.OpenAsync();
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<MealEntry>> GetByLogIdAsync(int userId, int dailyLogId)
    {
        const string sql = """
            SELECT Id, UserId, DailyLogId, LogDate, MealType, MealName, Calories, ImageUrl
            FROM dbo.FitFocus_MealsApp
            WHERE UserId = @UserId AND DailyLogId = @DailyLogId
            ORDER BY Id DESC
            """;

        var results = new List<MealEntry>();
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@DailyLogId", dailyLogId);
        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(MapReaderToMeal(reader));
        }

        return results;
    }

    public async Task<List<MealEntry>> GetAsync(int userId, DateOnly? date, string? mealType)
    {
        var sql = new System.Text.StringBuilder("""
            SELECT Id, UserId, DailyLogId, LogDate, MealType, MealName, Calories, ImageUrl
            FROM dbo.FitFocus_MealsApp
            WHERE UserId = @UserId
            """);

        if (date.HasValue) sql.Append(" AND LogDate = @LogDate");
        if (!string.IsNullOrEmpty(mealType)) sql.Append(" AND MealType = @MealType");

        sql.Append(" ORDER BY LogDate DESC, Id DESC");

        var results = new List<MealEntry>();
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql.ToString(), connection);
        command.Parameters.AddWithValue("@UserId", userId);
        if (date.HasValue) command.Parameters.AddWithValue("@LogDate", date.Value.ToDateTime(TimeOnly.MinValue));
        if (!string.IsNullOrEmpty(mealType)) command.Parameters.AddWithValue("@MealType", mealType);

        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(MapReaderToMeal(reader));
        }
        return results;
    }

    public async Task<List<MealEntry>> GetRangeAsync(int userId, DateOnly from, DateOnly to)
    {
        const string sql = """
            SELECT Id, UserId, DailyLogId, LogDate, MealType, MealName, Calories, ImageUrl
            FROM dbo.FitFocus_MealsApp
            WHERE UserId = @UserId
              AND LogDate BETWEEN @From AND @To
            ORDER BY LogDate ASC, Id ASC
            """;

        var results = new List<MealEntry>();
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@From", from.ToDateTime(TimeOnly.MinValue));
        command.Parameters.AddWithValue("@To", to.ToDateTime(TimeOnly.MinValue));

        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(MapReaderToMeal(reader));
        }

        return results;
    }

    private static MealEntry MapReaderToMeal(SqlDataReader reader)
    {
        return new MealEntry
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
            DailyLogId = reader.IsDBNull(reader.GetOrdinal("DailyLogId")) ? null : reader.GetInt32(reader.GetOrdinal("DailyLogId")),
            LogDate = DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("LogDate"))),
            MealType = reader.GetString(reader.GetOrdinal("MealType")),
            MealName = reader.GetString(reader.GetOrdinal("MealName")),
            Calories = reader.IsDBNull(reader.GetOrdinal("Calories")) ? null : reader.GetInt32(reader.GetOrdinal("Calories")),
            ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl"))
        };
    }

    public async Task<int> CountInRangeAsync(int userId, DateOnly from, DateOnly to)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM dbo.FitFocus_MealsApp
            WHERE UserId = @UserId
              AND CreatedAt BETWEEN @From AND DATEADD(DAY, 1, @To)
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@From", from.ToDateTime(TimeOnly.MinValue));
        command.Parameters.AddWithValue("@To", to.ToDateTime(TimeOnly.MinValue));
        await connection.OpenAsync();
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> DeleteAsync(int mealId, int userId)
    {
        const string sql = "DELETE FROM dbo.FitFocus_MealsApp WHERE Id = @Id AND UserId = @UserId";

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", mealId);
        command.Parameters.AddWithValue("@UserId", userId);
        await connection.OpenAsync();
        return await command.ExecuteNonQueryAsync() > 0;
    }
}
