namespace FitFocus.Api.Infrastructure;

public interface IDatabaseBootstrapper
{
    Task EnsureTablesAsync();
}
