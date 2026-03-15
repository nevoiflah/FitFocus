using FitFocus.Api.Models.Domain;
using FitFocus.Api.Models.Responses;

namespace FitFocus.Api.Services;

public interface IRiskScoreService
{
    DashboardSummaryResponse BuildSummary(int days, IReadOnlyCollection<DailyLog> logs, int totalMeals);
}
