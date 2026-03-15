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
            INSERT INTO dbo.FitFocus_MealsApp (UserId, DailyLogId, MealType, MealName, Calories, ProteinGrams, CarbsGrams, FatGrams, ImageUrl)
            OUTPUT INSERTED.Id
            VALUES (@UserId, @DailyLogId, @MealType, @MealName, @Calories, @ProteinGrams, @CarbsGrams, @FatGrams, @ImageUrl)
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", meal.UserId);
        command.Parameters.AddWithValue("@DailyLogId", meal.DailyLogId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@MealType", meal.MealType);
        command.Parameters.AddWithValue("@MealName", meal.MealName);
        command.Parameters.AddWithValue("@Calories", meal.Calories ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ProteinGrams", meal.ProteinGrams ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@CarbsGrams", meal.CarbsGrams ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@FatGrams", meal.FatGrams ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ImageUrl", meal.ImageUrl ?? (object)DBNull.Value);
        await connection.OpenAsync();
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<MealEntry>> GetByLogIdAsync(int userId, int dailyLogId)
    {
        const string sql = """
            SELECT Id, UserId, DailyLogId, MealType, MealName, Calories, ProteinGrams, CarbsGrams, FatGrams, ImageUrl
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
            results.Add(new MealEntry
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                DailyLogId = reader.IsDBNull(reader.GetOrdinal("DailyLogId")) ? null : reader.GetInt32(reader.GetOrdinal("DailyLogId")),
                MealType = reader.GetString(reader.GetOrdinal("MealType")),
                MealName = reader.GetString(reader.GetOrdinal("MealName")),
                Calories = reader.IsDBNull(reader.GetOrdinal("Calories")) ? null : reader.GetInt32(reader.GetOrdinal("Calories")),
                ProteinGrams = reader.IsDBNull(reader.GetOrdinal("ProteinGrams")) ? null : reader.GetDecimal(reader.GetOrdinal("ProteinGrams")),
                CarbsGrams = reader.IsDBNull(reader.GetOrdinal("CarbsGrams")) ? null : reader.GetDecimal(reader.GetOrdinal("CarbsGrams")),
                FatGrams = reader.IsDBNull(reader.GetOrdinal("FatGrams")) ? null : reader.GetDecimal(reader.GetOrdinal("FatGrams")),
                ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl"))
            });
        }

        return results;
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
