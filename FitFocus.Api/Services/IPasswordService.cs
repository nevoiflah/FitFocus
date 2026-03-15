namespace FitFocus.Api.Services;

public interface IPasswordService
{
    string HashPassword(string rawPassword);
    bool VerifyPassword(string rawPassword, string hashedPassword);
}
