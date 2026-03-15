using System.ComponentModel.DataAnnotations;

namespace FitFocus.Api.Models.Requests;

public sealed class CreateMealRequest
{
    public int? DailyLogId { get; init; }

    [Required, MaxLength(40)]
    public string MealType { get; init; } = "Meal";

    [Required, MaxLength(120)]
    public string MealName { get; init; } = string.Empty;

    public int? Calories { get; init; }
    public decimal? ProteinGrams { get; init; }
    public decimal? CarbsGrams { get; init; }
    public decimal? FatGrams { get; init; }
    public string? ImageUrl { get; init; }
}
