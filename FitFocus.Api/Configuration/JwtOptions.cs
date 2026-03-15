namespace FitFocus.Api.Configuration;

public sealed class JwtOptions
{
    public string Issuer { get; init; } = "FitFocus.Api";
    public string Audience { get; init; } = "FitFocus.Mobile";
    public string Key { get; init; } = "FitFocus_Replace_This_Signing_Key";
    public int ExpiresInMinutes { get; init; } = 180;
}
