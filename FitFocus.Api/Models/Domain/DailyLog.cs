namespace FitFocus.Api.Models.Domain;

public sealed class DailyLog
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public DateOnly LogDate { get; init; }
    public int MoodScore { get; init; }
    public decimal SleepHours { get; init; }
    public string? Symptoms { get; init; }
    public string? Notes { get; init; }
    public int StressScore { get; init; }
    public decimal WaterLiters { get; init; }
}
