using FitFocus.Api.Models.Domain;

namespace FitFocus.Api.Repositories.Interfaces;

public interface IReminderRepository
{
    Task<List<MedicationReminder>> GetByUserAsync(int userId);
    Task<int> CreateAsync(MedicationReminder reminder);
    Task<bool> UpdateAsync(int id, int userId, MedicationReminder reminder);
    Task<bool> DeleteAsync(int id, int userId);
}
