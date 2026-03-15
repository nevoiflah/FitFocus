using FitFocus.Api.Models.Domain;

namespace FitFocus.Api.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int userId);
    Task<List<User>> GetAllAsync();
    Task<int> CreateAsync(User user);
    Task UpdateProfileAsync(int userId, string fullName, DateOnly? dob, decimal? heightCm, decimal? weightKg, string? gender);
}
