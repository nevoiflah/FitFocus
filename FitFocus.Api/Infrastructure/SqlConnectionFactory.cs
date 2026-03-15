using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Infrastructure;

public sealed class SqlConnectionFactory(IConfiguration configuration) : ISqlConnectionFactory
{
    private readonly string _connectionString = configuration.GetConnectionString("myProjDB")
        ?? throw new InvalidOperationException("Connection string 'myProjDB' is missing.");

    public SqlConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }
}
