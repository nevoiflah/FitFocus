# FitFocus (Course Project)

This workspace now contains:

- `FitFocus.Api` - ASP.NET Core Web API + SQL Server tables with `FitFocus_` prefix
- `FitFocus.Mobile` - Expo React Native mobile app connected to the API

## Implemented features

- JWT auth: register + login
- Profile management
- Daily log create/update by date
- Dashboard with risk scoring and signals
- Meals with image selection + list by daily log id
- Medication reminders + local scheduled notifications
- Push flow:
  - mobile registers Expo device token to backend
  - backend can send test push via Expo push API
- Admin endpoint (`Admin` role): users list

## 1) Run backend

```bash
cd FitFocus.Api
dotnet restore
dotnet run
```

Notes:
- Connection string key is `myProjDB` in `appsettings.json`.
- Tables are auto-created on startup from `sql/CreateFitFocusTables.sql`.

## 2) Run mobile app

```bash
cd FitFocus.Mobile
npm install
npm start
```

## API base URL for mobile

In `FitFocus.Mobile/app.json`:

```json
"extra": {
  "apiBaseUrl": "http://localhost:5117/api"
}
```

For a physical phone, replace `localhost` with your computer LAN IP.

## Test checklist (recommended)

1. Register a new user and log in.
2. Save daily log twice on same date (should update, not fail).
3. Add meal with image and reload list by daily log id.
4. Add reminder and verify local scheduled notification.
5. In profile, press `Send Test Push` after token registration.
6. (Optional admin) Set role in DB and re-login:

```sql
UPDATE dbo.FitFocus_UsersApp SET Role='Admin' WHERE Email='nevo.iflah6@gmail.com';
```
