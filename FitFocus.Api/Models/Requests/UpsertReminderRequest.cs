using System.ComponentModel.DataAnnotations;

namespace FitFocus.Api.Models.Requests;

public sealed class UpsertReminderRequest
{
    [Required, MaxLength(120)]
    public string MedicationName { get; init; } = string.Empty;

    [Required, MaxLength(120)]
    public string Dosage { get; init; } = string.Empty;

    [Required]
    public TimeOnly ReminderTime { get; init; }

    public bool IsActive { get; init; } = true;
}
