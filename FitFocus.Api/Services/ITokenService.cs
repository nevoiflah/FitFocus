using FitFocus.Api.Models.Domain;

namespace FitFocus.Api.Services;

public interface ITokenService
{
    string Generate(User user);
}
