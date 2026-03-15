namespace FitFocus.Api.Repositories.Interfaces;

public interface IDeviceTokenRepository
{
    Task UpsertAsync(int userId, string expoPushToken, string? deviceName);
    Task<List<string>> GetTokensByUserAsync(int userId);
}
