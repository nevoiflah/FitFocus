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
public sealed class DailyLogsController(IDailyLogRepository logs) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DailyLog>> GetByDate([FromQuery] DateOnly date)
    {
        var userId = User.GetUserId();
        var log = await logs.GetByDateAsync(userId, date);
        return log is null ? NotFound() : Ok(log);
    }

    [HttpGet("range")]
    public async Task<ActionResult<List<DailyLog>>> GetRange([FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        var userId = User.GetUserId();
        if (from > to)
        {
            return BadRequest("from must be before to.");
        }

        var data = await logs.GetRangeAsync(userId, from, to);
        return Ok(data);
    }

    [HttpPost]
    public async Task<ActionResult> Create(UpsertDailyLogRequest request)
    {
        var userId = User.GetUserId();
        var existing = await logs.GetByDateAsync(userId, request.LogDate);
        if (existing is not null)
        {
            var updated = await logs.UpdateAsync(existing.Id, userId, new DailyLog
            {
                UserId = userId,
                LogDate = request.LogDate,
                MoodScore = request.MoodScore,
                SleepHours = request.SleepHours,
                Symptoms = request.Symptoms,
                Notes = request.Notes,
                StressScore = request.StressScore,
                WaterLiters = request.WaterLiters
            });

            return updated ? Ok(new { id = existing.Id, mode = "updated" }) : StatusCode(StatusCodes.Status500InternalServerError);
        }

        var id = await logs.CreateAsync(new DailyLog
        {
            UserId = userId,
            LogDate = request.LogDate,
            MoodScore = request.MoodScore,
            SleepHours = request.SleepHours,
            Symptoms = request.Symptoms,
            Notes = request.Notes,
            StressScore = request.StressScore,
            WaterLiters = request.WaterLiters
        });

        return CreatedAtAction(nameof(GetByDate), new { date = request.LogDate }, new { id, mode = "created" });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpsertDailyLogRequest request)
    {
        var userId = User.GetUserId();
        var updated = await logs.UpdateAsync(id, userId, new DailyLog
        {
            UserId = userId,
            LogDate = request.LogDate,
            MoodScore = request.MoodScore,
            SleepHours = request.SleepHours,
            Symptoms = request.Symptoms,
            Notes = request.Notes,
            StressScore = request.StressScore,
            WaterLiters = request.WaterLiters
        });

        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var deleted = await logs.DeleteAsync(id, userId);
        return deleted ? NoContent() : NotFound();
    }
}
