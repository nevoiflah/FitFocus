using System.ComponentModel.DataAnnotations;

namespace FitFocus.Api.Models.Requests;

public sealed class UnregisterDeviceTokenRequest
{
    [Required, MaxLength(300)]
    public string ExpoPushToken { get; init; } = string.Empty;
}
