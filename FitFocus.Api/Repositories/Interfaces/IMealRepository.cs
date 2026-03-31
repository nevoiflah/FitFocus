using FitFocus.Api.Models.Domain;

namespace FitFocus.Api.Repositories.Interfaces;

public interface IMealRepository
{
    Task<int> CreateAsync(MealEntry meal);
    Task<List<MealEntry>> GetByLogIdAsync(int userId, int dailyLogId);
    Task<List<MealEntry>> GetAsync(int userId, DateOnly? date, string? mealType);
    Task<int> CountInRangeAsync(int userId, DateOnly from, DateOnly to);
    Task<bool> DeleteAsync(int mealId, int userId);
}
