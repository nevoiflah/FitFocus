namespace FitFocus.Api.Models.Domain;

public sealed class MealEntry
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public int? DailyLogId { get; init; }
    public string MealType { get; init; } = string.Empty;
    public string MealName { get; init; } = string.Empty;
    public int? Calories { get; init; }
    public decimal? ProteinGrams { get; init; }
    public decimal? CarbsGrams { get; init; }
    public decimal? FatGrams { get; init; }
    public string? ImageUrl { get; init; }
}
