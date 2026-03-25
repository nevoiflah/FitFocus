using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FitFocus.Api.Extensions;
using FitFocus.Api.Models.Requests;
using FitFocus.Api.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitFocus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class NotificationsController(
    IDeviceTokenRepository deviceTokens,
    IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpPost("register-device")]
    public async Task<ActionResult> RegisterDevice(RegisterDeviceTokenRequest request)
    {
        var userId = User.GetUserId();
        await deviceTokens.UpsertAsync(userId, request.ExpoPushToken.Trim(), request.DeviceName?.Trim());
        return NoContent();
    }

    [HttpPost("unregister-device")]
    public async Task<ActionResult> UnregisterDevice(UnregisterDeviceTokenRequest request)
    {
        var userId = User.GetUserId();
        await deviceTokens.DeleteAsync(userId, request.ExpoPushToken.Trim());
        return NoContent();
    }

    [HttpPost("send-test")]
    public async Task<ActionResult> SendTest(SendTestPushRequest request)
    {
        var userId = User.GetUserId();
        var tokens = await deviceTokens.GetTokensByUserAsync(userId);
        if (tokens.Count == 0)
        {
            return BadRequest("No device tokens registered for this user.");
        }

        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var sent = 0;
        var failed = new List<string>();
        foreach (var token in tokens.Distinct())
        {
            var payload = new
            {
                to = token,
                title = request.Title,
                body = request.Body,
                sound = "default",
                data = new { source = "FitFocus", utc = DateTime.UtcNow }
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://exp.host/--/api/v2/push/send", content);
            if (response.IsSuccessStatusCode)
            {
                sent++;
            }
            else
            {
                var body = await response.Content.ReadAsStringAsync();
                failed.Add($"Token {token[..Math.Min(16, token.Length)]}... -> {(int)response.StatusCode}: {body}");
            }
        }

        return Ok(new { sent, total = tokens.Count, failed });
    }
}
