namespace FitFocus.Api.Models.Responses;

public sealed class DashboardSummaryResponse
{
    public int DaysAnalyzed { get; init; }
    public decimal AvgSleepHours { get; init; }
    public decimal AvgMoodScore { get; init; }
    public decimal AvgStressScore { get; init; }
    public decimal AvgWaterLiters { get; init; }
    public int TotalMealsLogged { get; init; }
    public decimal RiskScore { get; init; }
    public string RiskLevel { get; init; } = "Low";
    public List<string> RiskSignals { get; init; } = [];
}
