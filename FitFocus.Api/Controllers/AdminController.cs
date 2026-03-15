using FitFocus.Api.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitFocus.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public sealed class AdminController(IUserRepository users) : ControllerBase
{
    [HttpGet("users")]
    public async Task<ActionResult> GetUsers()
    {
        var data = await users.GetAllAsync();
        return Ok(data.Select(u => new
        {
            u.Id,
            u.Email,
            u.FullName,
            u.Role,
            u.DateOfBirth,
            u.HeightCm,
            u.WeightKg,
            u.Gender
        }));
    }
}
