# FitFocus API

ASP.NET Core Web API backend for the FitFocus mobile app, targeting .NET 9.

## Main capabilities

- JWT auth (`/api/auth/register`, `/api/auth/login`)
- Profile management (`/api/profile`)
- Daily health logs (`/api/dailylogs`, `/api/dailylogs/range`)
- Meals (`/api/meals`, `/api/meals/range`)
- Medication reminders (`/api/reminders`)
- Dashboard risk summary (`/api/dashboard/summary`)
- Device token registration + test push (`/api/notifications/register-device`, `/api/notifications/send-test`)
- Admin users list (`/api/admin/users`, role: `Admin`)

## Database

- Uses SQL Server connection string named `myProjDB`.
- On startup, runs `sql/CreateFitFocusTables.sql` to create:
  - `FitFocus_UsersApp`
  - `FitFocus_DailyLogsApp`
  - `FitFocus_MealsApp`
  - `FitFocus_MedicationRemindersApp`
  - `FitFocus_DeviceTokensApp`

## Run

```bash
dotnet restore
dotnet run
```

Swagger will be available in development mode.

## Reliability notes

- The API no longer hard-fails startup when the SQL server is temporarily unavailable.
- Database bootstrap runs in the background after the app starts.
- Health is exposed at `GET /health`.
- You can override the SQL connection without editing tracked settings files:

```bash
export FITFOCUS_DB_CONNECTION="Server=...;Database=...;User Id=...;Password=...;"
export FITFOCUS_ALLOWED_ORIGINS="http://localhost:8081,http://127.0.0.1:8081"
```

If the health endpoint reports `degraded`, the API is running but the database is currently unavailable.
