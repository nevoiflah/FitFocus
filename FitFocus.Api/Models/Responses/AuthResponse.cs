namespace FitFocus.Api.Models.Responses;

public sealed class AuthResponse
{
    public required string Token { get; init; }
    public required int UserId { get; init; }
    public required string Email { get; init; }
    public required string FullName { get; init; }
    public required string Role { get; init; }
}
