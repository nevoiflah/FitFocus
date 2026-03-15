using FitFocus.Api.Models.Domain;
using FitFocus.Api.Models.Requests;
using FitFocus.Api.Models.Responses;
using FitFocus.Api.Repositories.Interfaces;
using FitFocus.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FitFocus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(
    IUserRepository users,
    IPasswordService passwordService,
    ITokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var existing = await users.GetByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (existing is not null)
        {
            return Conflict("Email already exists.");
        }

        var user = new User
        {
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            PasswordHash = passwordService.HashPassword(request.Password),
            Role = "User"
        };

        var userId = await users.CreateAsync(user);
        var created = await users.GetByIdAsync(userId);
        if (created is null)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, "Could not create user.");
        }

        var token = tokenService.Generate(created);
        return Ok(ToAuthResponse(created, token));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await users.GetByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null || !passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid email or password.");
        }

        var token = tokenService.Generate(user);
        return Ok(ToAuthResponse(user, token));
    }

    private static AuthResponse ToAuthResponse(User user, string token)
    {
        return new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role
        };
    }
}
