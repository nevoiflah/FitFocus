using System.Security.Cryptography;
using System.Text;

namespace FitFocus.Api.Services;

public sealed class PasswordService : IPasswordService
{
    public string HashPassword(string rawPassword)
    {
        var salt = Guid.NewGuid().ToString("N");
        var hash = ComputeSha256($"{salt}:{rawPassword}");
        return $"{salt}:{hash}";
    }

    public bool VerifyPassword(string rawPassword, string hashedPassword)
    {
        var parts = hashedPassword.Split(':');
        if (parts.Length != 2)
        {
            return false;
        }

        var salt = parts[0];
        var expectedHash = parts[1];
        var actualHash = ComputeSha256($"{salt}:{rawPassword}");
        return expectedHash.Equals(actualHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string ComputeSha256(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}
