using FitFocus.Api.Extensions;
using FitFocus.Api.Models.Requests;
using FitFocus.Api.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitFocus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ProfileController(IUserRepository users) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var userId = User.GetUserId();
        var user = await users.GetByIdAsync(userId);
        if (user is null)
        {
            return NotFound();
        }

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FullName,
            user.DateOfBirth,
            user.HeightCm,
            user.WeightKg,
            user.Gender,
            user.Role
        });
    }

    [HttpPut]
    public async Task<ActionResult> Update(UpdateProfileRequest request)
    {
        var userId = User.GetUserId();
        await users.UpdateProfileAsync(
            userId,
            request.FullName.Trim(),
            request.DateOfBirth,
            request.HeightCm,
            request.WeightKg,
            request.Gender?.Trim());

        return NoContent();
    }
}
