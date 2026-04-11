using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Infrastructure;

public sealed class SqlConnectionFactory(IConfiguration configuration) : ISqlConnectionFactory
{
    private readonly string _connectionString = ResolveConnectionString(configuration);

    public SqlConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("FITFOCUS_DB_CONNECTION")
            ?? configuration.GetConnectionString("myProjDB")
            ?? throw new InvalidOperationException("Connection string 'myProjDB' is missing.");

        var builder = new SqlConnectionStringBuilder(connectionString);
        if (builder.ConnectTimeout <= 0 || builder.ConnectTimeout > 10)
        {
            builder.ConnectTimeout = 8;
        }

        return builder.ConnectionString;
    }
}
