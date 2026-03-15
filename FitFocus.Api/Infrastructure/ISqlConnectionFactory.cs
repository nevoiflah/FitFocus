using Microsoft.Data.SqlClient;

namespace FitFocus.Api.Infrastructure;

public interface ISqlConnectionFactory
{
    SqlConnection CreateConnection();
}
