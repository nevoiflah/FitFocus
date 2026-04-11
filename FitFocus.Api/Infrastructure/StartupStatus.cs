namespace FitFocus.Api.Infrastructure;

public sealed class StartupStatus
{
    public DateTimeOffset StartedAtUtc { get; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DatabaseCheckedAtUtc { get; private set; }
    public bool DatabaseReady { get; private set; }
    public string? DatabaseMessage { get; private set; }

    public void MarkDatabaseReady()
    {
        DatabaseReady = true;
        DatabaseCheckedAtUtc = DateTimeOffset.UtcNow;
        DatabaseMessage = "Database bootstrap completed successfully.";
    }

    public void MarkDatabaseUnavailable(string message)
    {
        DatabaseReady = false;
        DatabaseCheckedAtUtc = DateTimeOffset.UtcNow;
        DatabaseMessage = message;
    }
}
