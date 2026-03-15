using FitFocus.Api.Models.Domain;

namespace FitFocus.Api.Repositories.Interfaces;

public interface IDailyLogRepository
{
    Task<DailyLog?> GetByDateAsync(int userId, DateOnly date);
    Task<List<DailyLog>> GetRangeAsync(int userId, DateOnly from, DateOnly to);
    Task<int> CreateAsync(DailyLog log);
    Task<bool> UpdateAsync(int id, int userId, DailyLog log);
    Task<bool> DeleteAsync(int id, int userId);
}
