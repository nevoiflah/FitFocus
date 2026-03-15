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
public sealed class RemindersController(IReminderRepository reminders) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MedicationReminder>>> Get()
    {
        var userId = User.GetUserId();
        return Ok(await reminders.GetByUserAsync(userId));
    }

    [HttpPost]
    public async Task<ActionResult> Create(UpsertReminderRequest request)
    {
        var userId = User.GetUserId();
        var id = await reminders.CreateAsync(new MedicationReminder
        {
            UserId = userId,
            MedicationName = request.MedicationName.Trim(),
            Dosage = request.Dosage.Trim(),
            ReminderTime = request.ReminderTime,
            IsActive = request.IsActive
        });

        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpsertReminderRequest request)
    {
        var userId = User.GetUserId();
        var updated = await reminders.UpdateAsync(id, userId, new MedicationReminder
        {
            UserId = userId,
            MedicationName = request.MedicationName.Trim(),
            Dosage = request.Dosage.Trim(),
            ReminderTime = request.ReminderTime,
            IsActive = request.IsActive
        });

        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var deleted = await reminders.DeleteAsync(id, userId);
        return deleted ? NoContent() : NotFound();
    }
}
