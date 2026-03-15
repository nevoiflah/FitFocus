using FitFocus.Api.Models.Domain;
using FitFocus.Api.Models.Responses;

namespace FitFocus.Api.Services;

public sealed class RiskScoreService : IRiskScoreService
{
    public DashboardSummaryResponse BuildSummary(int days, IReadOnlyCollection<DailyLog> logs, int totalMeals)
    {
        if (logs.Count == 0)
        {
            return new DashboardSummaryResponse { DaysAnalyzed = days };
        }

        var avgSleep = logs.Average(x => x.SleepHours);
        var avgMood = logs.Average(x => x.MoodScore);
        var avgStress = logs.Average(x => x.StressScore);
        var avgWater = logs.Average(x => x.WaterLiters);

        var score = 0m;
        var signals = new List<string>();

        if (avgSleep < 6)
        {
            score += 30;
            signals.Add("Low average sleep (<6h)");
        }
        else if (avgSleep < 7)
        {
            score += 15;
        }

        if (avgMood < 5)
        {
            score += 25;
            signals.Add("Low mood trend");
        }

        if (avgStress > 7)
        {
            score += 25;
            signals.Add("High stress trend");
        }
        else if (avgStress > 6)
        {
            score += 10;
        }

        if (avgWater < 1.5m)
        {
            score += 10;
            signals.Add("Low hydration");
        }

        if (logs.Count(x => !string.IsNullOrWhiteSpace(x.Symptoms)) >= Math.Max(2, logs.Count / 3))
        {
            score += 20;
            signals.Add("Frequent symptoms reported");
        }

        score = Math.Clamp(score, 0, 100);
        var level = score switch
        {
            < 25 => "Low",
            < 55 => "Medium",
            < 80 => "High",
            _ => "Critical"
        };

        return new DashboardSummaryResponse
        {
            DaysAnalyzed = days,
            AvgSleepHours = Math.Round(avgSleep, 2),
            AvgMoodScore = Math.Round((decimal)avgMood, 2),
            AvgStressScore = Math.Round((decimal)avgStress, 2),
            AvgWaterLiters = Math.Round(avgWater, 2),
            TotalMealsLogged = totalMeals,
            RiskScore = score,
            RiskLevel = level,
            RiskSignals = signals
        };
    }
}
