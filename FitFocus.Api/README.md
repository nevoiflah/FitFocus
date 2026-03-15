# FitFocus API

ASP.NET Core Web API backend for the FitFocus mobile app.

## Main capabilities

- JWT auth (`/api/auth/register`, `/api/auth/login`)
- Profile management (`/api/profile`)
- Daily health logs (`/api/dailylogs`)
- Meals (`/api/meals`)
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
