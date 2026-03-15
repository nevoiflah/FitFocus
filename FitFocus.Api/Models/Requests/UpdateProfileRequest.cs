using System.ComponentModel.DataAnnotations;

namespace FitFocus.Api.Models.Requests;

public sealed class UpdateProfileRequest
{
    [Required, MaxLength(120)]
    public string FullName { get; init; } = string.Empty;

    public DateOnly? DateOfBirth { get; init; }
    public decimal? HeightCm { get; init; }
    public decimal? WeightKg { get; init; }

    [MaxLength(20)]
    public string? Gender { get; init; }
}
