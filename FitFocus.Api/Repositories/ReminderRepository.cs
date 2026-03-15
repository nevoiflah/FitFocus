using FitFocus.Api.Infrastructure;
using FitFocus.Api.Models.Domain;
using FitFocus.Api.Repositories.Interfaces;
using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Repositories;

public sealed class ReminderRepository(ISqlConnectionFactory connectionFactory) : IReminderRepository
{
    public async Task<List<MedicationReminder>> GetByUserAsync(int userId)
    {
        const string sql = """
            SELECT Id, UserId, MedicationName, Dosage, ReminderTime, IsActive
            FROM dbo.FitFocus_MedicationRemindersApp
            WHERE UserId = @UserId
            ORDER BY ReminderTime
            """;

        var results = new List<MedicationReminder>();
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(new MedicationReminder
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                MedicationName = reader.GetString(reader.GetOrdinal("MedicationName")),
                Dosage = reader.GetString(reader.GetOrdinal("Dosage")),
                ReminderTime = TimeOnly.FromTimeSpan(reader.GetTimeSpan(reader.GetOrdinal("ReminderTime"))),
                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
            });
        }

        return results;
    }

    public async Task<int> CreateAsync(MedicationReminder reminder)
    {
        const string sql = """
            INSERT INTO dbo.FitFocus_MedicationRemindersApp (UserId, MedicationName, Dosage, ReminderTime, IsActive)
            OUTPUT INSERTED.Id
            VALUES (@UserId, @MedicationName, @Dosage, @ReminderTime, @IsActive)
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", reminder.UserId);
        command.Parameters.AddWithValue("@MedicationName", reminder.MedicationName);
        command.Parameters.AddWithValue("@Dosage", reminder.Dosage);
        command.Parameters.AddWithValue("@ReminderTime", reminder.ReminderTime.ToTimeSpan());
        command.Parameters.AddWithValue("@IsActive", reminder.IsActive);
        await connection.OpenAsync();
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> UpdateAsync(int id, int userId, MedicationReminder reminder)
    {
        const string sql = """
            UPDATE dbo.FitFocus_MedicationRemindersApp
            SET MedicationName = @MedicationName,
                Dosage = @Dosage,
                ReminderTime = @ReminderTime,
                IsActive = @IsActive,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id AND UserId = @UserId
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@MedicationName", reminder.MedicationName);
        command.Parameters.AddWithValue("@Dosage", reminder.Dosage);
        command.Parameters.AddWithValue("@ReminderTime", reminder.ReminderTime.ToTimeSpan());
        command.Parameters.AddWithValue("@IsActive", reminder.IsActive);
        await connection.OpenAsync();
        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        const string sql = "DELETE FROM dbo.FitFocus_MedicationRemindersApp WHERE Id = @Id AND UserId = @UserId";
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@UserId", userId);
        await connection.OpenAsync();
        return await command.ExecuteNonQueryAsync() > 0;
    }
}
