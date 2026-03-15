using FitFocus.Api.Extensions;
using FitFocus.Api.Models.Responses;
using FitFocus.Api.Repositories.Interfaces;
using FitFocus.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitFocus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class DashboardController(
    IDailyLogRepository logs,
    IMealRepository meals,
    IRiskScoreService riskScoreService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> Summary([FromQuery] int days = 14)
    {
        days = Math.Clamp(days, 3, 90);

        var userId = User.GetUserId();
        var to = DateOnly.FromDateTime(DateTime.UtcNow);
        var from = to.AddDays(-days + 1);

        var logsRange = await logs.GetRangeAsync(userId, from, to);
        var mealsCount = await meals.CountInRangeAsync(userId, from, to);
        var summary = riskScoreService.BuildSummary(days, logsRange, mealsCount);
        return Ok(summary);
    }
}
