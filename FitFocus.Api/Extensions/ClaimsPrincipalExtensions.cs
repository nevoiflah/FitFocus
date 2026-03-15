using System.Security.Claims;

namespace FitFocus.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal principal)
    {
        var idClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(ClaimTypes.Name)
            ?? principal.FindFirstValue("sub");

        if (!int.TryParse(idClaim, out var userId))
        {
            throw new InvalidOperationException("Could not read user ID from token.");
        }

        return userId;
    }
}
