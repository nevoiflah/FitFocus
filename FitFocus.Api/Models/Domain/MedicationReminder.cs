namespace FitFocus.Api.Models.Domain;

public sealed class MedicationReminder
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public string MedicationName { get; init; } = string.Empty;
    public string Dosage { get; init; } = string.Empty;
    public TimeOnly ReminderTime { get; init; }
    public bool IsActive { get; init; }
}
