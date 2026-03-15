using System.ComponentModel.DataAnnotations;

namespace FitFocus.Api.Models.Requests;

public sealed class RegisterDeviceTokenRequest
{
    [Required, MaxLength(300)]
    public string ExpoPushToken { get; init; } = string.Empty;

    [MaxLength(120)]
    public string? DeviceName { get; init; }
}
