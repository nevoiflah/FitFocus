using System.ComponentModel.DataAnnotations;

namespace FitFocus.Api.Models.Requests;

public sealed class UpsertDailyLogRequest
{
    [Required]
    public DateOnly LogDate { get; init; }

    [Range(1, 10)]
    public int MoodScore { get; init; }

    [Range(0, 24)]
    public decimal SleepHours { get; init; }

    [Range(1, 10)]
    public int StressScore { get; init; }

    [Range(0, 20)]
    public decimal WaterLiters { get; init; }

    [MaxLength(1000)]
    public string? Symptoms { get; init; }

    [MaxLength(1000)]
    public string? Notes { get; init; }
}
