using FitFocus.Api.Extensions;
using FitFocus.Api.Models.Domain;
using FitFocus.Api.Models.Requests;
using FitFocus.Api.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitFocus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class MealsController(IMealRepository meals) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MealEntry>>> GetAll([FromQuery] DateOnly? date, [FromQuery] string? mealType)
    {
        var userId = User.GetUserId();
        var result = await meals.GetAsync(userId, date, mealType);
        return Ok(result);
    }

    [HttpGet("range")]
    public async Task<ActionResult<List<MealEntry>>> GetRange([FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        var userId = User.GetUserId();
        var result = await meals.GetRangeAsync(userId, from, to);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult> Create(CreateMealRequest request)
    {
        var userId = User.GetUserId();
        var id = await meals.CreateAsync(new MealEntry
        {
            UserId = userId,
            DailyLogId = request.DailyLogId,
            LogDate = request.LogDate,
            MealType = request.MealType.Trim(),
            MealName = request.MealName.Trim(),
            Calories = request.Calories,
            ImageUrl = request.ImageUrl
        });

        return Ok(new { id });
    }

    [HttpGet("by-log/{dailyLogId:int}")]
    public async Task<ActionResult<List<MealEntry>>> ByLog(int dailyLogId)
    {
        var userId = User.GetUserId();
        var result = await meals.GetByLogIdAsync(userId, dailyLogId);
        return Ok(result);
    }

    [HttpDelete("{mealId:int}")]
    public async Task<ActionResult> Delete(int mealId)
    {
        var userId = User.GetUserId();
        var deleted = await meals.DeleteAsync(mealId, userId);
        return deleted ? NoContent() : NotFound();
    }
}
