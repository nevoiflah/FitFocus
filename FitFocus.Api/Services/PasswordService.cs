using System.Security.Cryptography;
using System.Text;

namespace FitFocus.Api.Services;

public sealed class PasswordService : IPasswordService
{
    private const string Pbkdf2Prefix = "pbkdf2";
    private const int Iterations = 120_000;
    private const int SaltSize = 16;
    private const int HashSize = 32;

    public string HashPassword(string rawPassword)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            rawPassword,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return string.Join(
            '$',
            Pbkdf2Prefix,
            Iterations,
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public bool VerifyPassword(string rawPassword, string hashedPassword)
    {
        if (hashedPassword.StartsWith($"{Pbkdf2Prefix}$", StringComparison.Ordinal))
        {
            return VerifyPbkdf2(rawPassword, hashedPassword);
        }

        return VerifyLegacySha256(rawPassword, hashedPassword);
    }

    public bool NeedsRehash(string hashedPassword)
    {
        var parts = hashedPassword.Split('$');
        if (parts.Length != 4 || !parts[0].Equals(Pbkdf2Prefix, StringComparison.Ordinal))
        {
            return true;
        }

        return !int.TryParse(parts[1], out var configuredIterations) || configuredIterations < Iterations;
    }

    private static bool VerifyPbkdf2(string rawPassword, string hashedPassword)
    {
        var parts = hashedPassword.Split('$');
        if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        byte[] salt;
        byte[] expectedHash;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expectedHash = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actualHash = Rfc2898DeriveBytes.Pbkdf2(
            rawPassword,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expectedHash.Length);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }

    private static bool VerifyLegacySha256(string rawPassword, string hashedPassword)
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
