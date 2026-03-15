using System.ComponentModel.DataAnnotations;

namespace FitFocus.Api.Models.Requests;

public sealed class SendTestPushRequest
{
    [Required, MaxLength(100)]
    public string Title { get; init; } = "FitFocus reminder";

    [Required, MaxLength(400)]
    public string Body { get; init; } = "Time to check your wellness log.";
}
