using FitFocus.Api.Infrastructure;
using FitFocus.Api.Models.Domain;
using FitFocus.Api.Repositories.Interfaces;
using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Repositories;

public sealed class UserRepository(ISqlConnectionFactory connectionFactory) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email)
    {
        const string sql = """
            SELECT TOP 1 Id, Email, PasswordHash, FullName, DateOfBirth, HeightCm, WeightKg, Gender, Role
            FROM dbo.FitFocus_UsersApp
            WHERE Email = @Email
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Email", email);
        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapUser(reader);
    }

    public async Task<User?> GetByIdAsync(int userId)
    {
        const string sql = """
            SELECT TOP 1 Id, Email, PasswordHash, FullName, DateOfBirth, HeightCm, WeightKg, Gender, Role
            FROM dbo.FitFocus_UsersApp
            WHERE Id = @Id
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", userId);
        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapUser(reader);
    }

    public async Task<int> CreateAsync(User user)
    {
        const string sql = """
            INSERT INTO dbo.FitFocus_UsersApp (Email, PasswordHash, FullName, Role)
            OUTPUT INSERTED.Id
            VALUES (@Email, @PasswordHash, @FullName, @Role)
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Email", user.Email);
        command.Parameters.AddWithValue("@PasswordHash", user.PasswordHash);
        command.Parameters.AddWithValue("@FullName", user.FullName);
        command.Parameters.AddWithValue("@Role", user.Role);
        await connection.OpenAsync();
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<User>> GetAllAsync()
    {
        const string sql = """
            SELECT Id, Email, PasswordHash, FullName, DateOfBirth, HeightCm, WeightKg, Gender, Role
            FROM dbo.FitFocus_UsersApp
            ORDER BY Id DESC
            """;

        var results = new List<User>();
        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        await connection.OpenAsync();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(MapUser(reader));
        }

        return results;
    }

    public async Task UpdateProfileAsync(int userId, string fullName, DateOnly? dob, decimal? heightCm, decimal? weightKg, string? gender)
    {
        const string sql = """
            UPDATE dbo.FitFocus_UsersApp
            SET FullName = @FullName,
                DateOfBirth = @DateOfBirth,
                HeightCm = @HeightCm,
                WeightKg = @WeightKg,
                Gender = @Gender,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", userId);
        command.Parameters.AddWithValue("@FullName", fullName);
        command.Parameters.AddWithValue("@DateOfBirth", dob.HasValue ? dob.Value.ToDateTime(TimeOnly.MinValue) : DBNull.Value);
        command.Parameters.AddWithValue("@HeightCm", heightCm ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@WeightKg", weightKg ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Gender", gender ?? (object)DBNull.Value);
        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }

    public async Task UpdatePasswordHashAsync(int userId, string passwordHash)
    {
        const string sql = """
            UPDATE dbo.FitFocus_UsersApp
            SET PasswordHash = @PasswordHash,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id
            """;

        await using var connection = connectionFactory.CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", userId);
        command.Parameters.AddWithValue("@PasswordHash", passwordHash);
        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }

    private static User MapUser(SqlDataReader reader)
    {
        return new User
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            Email = reader.GetString(reader.GetOrdinal("Email")),
            PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
            FullName = reader.GetString(reader.GetOrdinal("FullName")),
            DateOfBirth = reader.IsDBNull(reader.GetOrdinal("DateOfBirth"))
                ? null
                : DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("DateOfBirth"))),
            HeightCm = reader.IsDBNull(reader.GetOrdinal("HeightCm")) ? null : reader.GetDecimal(reader.GetOrdinal("HeightCm")),
            WeightKg = reader.IsDBNull(reader.GetOrdinal("WeightKg")) ? null : reader.GetDecimal(reader.GetOrdinal("WeightKg")),
            Gender = reader.IsDBNull(reader.GetOrdinal("Gender")) ? null : reader.GetString(reader.GetOrdinal("Gender")),
            Role = reader.GetString(reader.GetOrdinal("Role"))
        };
    }
}
