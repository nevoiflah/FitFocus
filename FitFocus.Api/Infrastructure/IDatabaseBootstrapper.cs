namespace FitFocus.Api.Infrastructure;

public interface IDatabaseBootstrapper
{
    Task EnsureTablesAsync(CancellationToken cancellationToken = default);
}
