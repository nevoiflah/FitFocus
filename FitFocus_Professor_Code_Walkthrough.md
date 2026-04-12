# FitFocus Professor Code Walkthrough

This document is meant to prepare for oral questions about the FitFocus project.
It explains what each important code area does, why it exists, and what logic the professor can expect behind it.

This guide follows the current code in the repository, not just the original project idea.
It focuses on source code and architecture, not generated files like `package-lock.json`, icons, or other assets.

## 1. System Overview

FitFocus is a client-server health tracking system with two major parts:

1. `FitFocus.Mobile`
   This is the React Native + Expo mobile client.
   It renders the UI, stores the authenticated session locally, calls the API, manages local reminders, and displays weekly health data.

2. `FitFocus.Api`
   This is the ASP.NET Core Web API backend.
   It handles authentication, authorization, validation, database access, security, aggregation, and push-notification integration.

The project uses a clean separation of responsibilities:

1. The mobile app never talks directly to SQL Server.
2. The backend never renders UI.
3. The database is accessed only through repository classes.
4. Authentication state is carried through JWT tokens.

That separation matters because it makes the project easier to maintain, test mentally, and explain in layers.

## 2. End-to-End Request Flow

Before going file by file, this is the most important mental model to remember.

### 2.1 Login Flow

1. The user enters email and password in the mobile auth screen.
2. `FitFocus.Mobile/src/screens/AuthScreen.tsx` calls `api.login(...)`.
3. `FitFocus.Mobile/src/api.ts` sends `POST /api/auth/login`.
4. `FitFocus.Api/Controllers/AuthController.cs` looks up the user by email.
5. `PasswordService` verifies the password hash.
6. If the stored hash is in the old format, the backend rehashes it into PBKDF2 automatically.
7. `TokenService` creates a JWT.
8. The mobile app stores the session in `AsyncStorage`.
9. Future API calls automatically include `Authorization: Bearer <token>` because of the Axios request interceptor.

### 2.2 Daily Log Flow

1. The mobile app computes today's local date in `YYYY-MM-DD`.
2. The daily log screen loads today's existing record, if any.
3. On save, the app sends a `POST /api/dailylogs`.
4. The backend checks whether a log already exists for the same user and date.
5. If it exists, the controller updates it.
6. If it does not exist, the controller creates it.

This means the mobile side can use one "save" action without worrying about whether the operation is create or update.

### 2.3 Dashboard Flow

1. The dashboard computes the local Sunday-to-Saturday week.
2. It requests `/api/dailylogs/range?from=...&to=...`, `/api/profile`, and weekly meal data from `/api/meals/range?from=...&to=...`.
3. The backend returns the user's logs, profile details, and saved meals for that range.
4. The mobile app turns those entries into chart datasets for calories, mood, sleep, stress, and water, plus weekly text summaries.

The important logic here is that dates are handled as local calendar dates on the mobile side, not UTC timestamps.
That fix prevents Sunday data from showing up under Saturday.

### 2.4 Meal Flow

1. The user fills out meal data and may attach an image.
2. The app optionally looks up today's daily log ID.
3. It sends `POST /api/meals`.
4. The backend stores the meal with the user ID from the JWT.
5. The meals history screen reloads and supports filtering by date and meal type.

### 2.5 Reminder Flow

1. The user creates a medication reminder in the app.
2. The reminder is saved in the backend for persistence.
3. The app also schedules a local device notification using Expo Notifications.

This is important to explain: persistence and local notification scheduling are separate concerns.
Saving the reminder is server-side data storage.
Scheduling the reminder is client-side device behavior.

## 3. Mobile Application Walkthrough

## 3.1 `FitFocus.Mobile/App.tsx`

This is the root composition file for the mobile app.

Its main jobs are:

1. Bootstrapping the user session.
2. Setting up navigation.
3. Wiring global authentication behavior.
4. Handling push-notification readiness.

### Main logic

1. `SESSION_KEY` defines where the login session is stored in `AsyncStorage`.
2. `setAuthenticated` stores the JWT in memory via `api.setToken(...)` and also persists the session locally.
3. `logout` clears both the in-memory token and persistent storage.
4. A `useEffect` runs once on startup:
   It restores a previous session, validates it by calling `api.getProfile()`, and logs the user out if the token is no longer valid.
5. Another `useEffect` keeps push registration in sync with login state and the notifications toggle.
6. A third `useEffect` cancels scheduled local notifications when notifications are disabled.

### Why this structure was chosen

The root component owns authentication because authentication affects the entire app.
If each screen tried to manage login state separately, the project would become inconsistent very quickly.

### Navigation logic

There are two levels:

1. A stack navigator:
   It switches between `Auth` and `Main`, and it also contains the dedicated `Admin` screen.

2. A bottom tab navigator:
   It shows the main application sections after login: `Dashboard`, `Daily Log`, `Meals`, `Reminders`, and `Profile`.

The `Admin` screen is not a permanent bottom tab anymore.
It is opened from the `Profile` screen only when `session.role === "Admin"`.
That is a UI-level visibility decision.
The real security check still happens in the backend via JWT role authorization.

## 3.2 `FitFocus.Mobile/src/api.ts`

This file is the communication layer between the mobile app and the backend.
It is one of the most important files in the entire project.

### What it does

1. Resolves the correct API base URL.
2. Defines the frontend TypeScript types for API responses.
3. Creates a single Axios instance.
4. Attaches the JWT automatically to outgoing requests.
5. Handles `401 Unauthorized` globally.
6. Exposes all API operations as simple methods.

### Base URL resolution logic

The app chooses the API URL in this order:

1. `app.config.js` / environment override.
2. Expo host URI.
3. Android emulator fallback `10.0.2.2`.
4. Localhost fallback.

This matters because the project needs to work on:

1. physical phones,
2. emulators,
3. local machines,
4. different demo environments.

### Interceptor logic

The request interceptor injects the token if one exists.

The response interceptor watches for `401`.
If a `401` happens, it triggers the registered unauthorized callback from `App.tsx`, which logs the user out centrally.

That is cleaner than handling token expiry in every screen manually.

### Important API groupings

1. Auth:
   `register`, `login`

2. Profile:
   `getProfile`, `updateProfile`

3. Daily logs:
   `upsertDailyLog`, `getDailyLog`, `getDailyLogRange`

4. Meals:
   `createMeal`, `getMeals`, `getMealsRange`, `getMealsByLog`, `deleteMeal`

5. Reminders:
   `getReminders`, `createReminder`, `deleteReminder`

6. Notifications:
   `registerDeviceToken`, `unregisterDeviceToken`, `sendTestPush`

7. Admin:
   `getAdminUsers`

The dashboard is now composed from range endpoints plus profile data, rather than from a single `getDashboard` mobile API method.

## 3.3 `FitFocus.Mobile/src/types/index.ts`

This file defines the `Session` type.

It exists to make authentication state explicit and type-safe.
Without it, session objects would be unstructured JSON blobs and easier to misuse.

## 3.4 Mobile Utility Files

### `FitFocus.Mobile/src/utils/dateUtils.ts`

This file exists because local calendar dates and UTC timestamps are not the same thing.

It provides:

1. `formatLocalDate`
2. `getTodayLocalDate`
3. `startOfLocalWeek`
4. `addDays`

The core reasoning is that the backend stores logical dates like `2026-04-11`, not full timezone-aware instants.
If the app used `toISOString().slice(0, 10)`, a local midnight in Israel could shift backward into the previous UTC date.

This utility centralizes date logic and prevents those bugs.

### `FitFocus.Mobile/src/utils/errorUtils.ts`

This file standardizes error messages shown to users.

Its purpose is to avoid writing custom error-extraction logic in every screen.

It handles:

1. pure network failures,
2. server string responses,
3. validation errors,
4. structured `ProblemDetails` style responses,
5. fallback messages.

This is useful in a demo because it turns vague failures into understandable messages.

### `FitFocus.Mobile/src/utils/notificationUtils.ts`

This file handles all push and local notification logic.

Important functions:

1. `setupNotifications`
   Configures how Expo displays notifications while the app is active.

2. `scheduleLocalReminder`
   Schedules a daily local notification on the device.

3. `registerNotifications`
   Requests permission, ensures the app is on a physical device, creates an Expo push token, and returns that token.

4. `ensurePushReady`
   Registers the device token with the backend or removes it if notifications were disabled.

### Why this logic is important

Notifications are not only a UI feature.
They involve:

1. permission handling,
2. hardware capability,
3. local device scheduling,
4. backend token storage,
5. remote push delivery.

Putting this in one utility file reduces duplication and makes the flow explainable.

## 3.5 Reusable Mobile Components

These components exist to keep screens smaller and more consistent.

### `ActionButton.tsx`

This is a reusable button abstraction around `Pressable`.
It supports `primary`, `secondary`, and `danger` styles.

Why it exists:

1. visual consistency,
2. less repeated style code,
3. easier future UI changes.

### `InputField.tsx`

This wraps `TextInput` with a label and shared styling.

Important logic:
it forces left alignment for password and email fields.

That matters in Hebrew/RTL environments, where email/password input should still behave like LTR content.

### `SliderInput.tsx`

This wraps the slider input with a label and live numeric value preview.

It is used for metrics like:

1. mood,
2. stress,
3. sleep,
4. water,
5. calories,
6. height,
7. weight.

### `SegmentedPicker.tsx`

This is a reusable segmented control built with `Pressable`.
It gives a clean selection UI for fixed options like meal type and gender.

### `FilterChip.tsx`

This is a small reusable component for date and filter chips in the meals history.

### `ChartBox.tsx`

This component renders a chart card.
It is responsible for:

1. displaying today's value,
2. showing a `Today` day label,
3. rendering the line chart,
4. showing the selected data point when the user taps the chart.

The main idea is to keep all chart presentation logic out of the dashboard screen itself.

## 3.6 Mobile Screens

### `AuthScreen.tsx`

This screen handles both login and registration.

### What it does

1. Keeps login/register mode in local state.
2. Manages form fields.
3. Calls `api.getHealth()` to test API connectivity.
4. Shows a status card with:
   the API URL, source of that URL, and whether the API/database are reachable.
5. Calls either `api.register(...)` or `api.login(...)`.
6. Sends the successful session object to `App.tsx`.

### Why this logic matters

This screen does not just collect credentials.
It also helps demo reliability by showing whether the mobile app is actually connected to the backend before the professor starts using the system.

### `DailyLogScreen.tsx`

This screen is responsible for the user's daily health metrics.

### What it does

1. Computes today's local date.
2. Loads an existing daily log for that date.
3. Pre-fills the inputs if a log already exists.
4. Sends a single upsert-style save request.

### Logic behind the design

The user should think in terms of "today's log", not "record #43".
So the screen is date-driven, not ID-driven.

### `DashboardScreen.tsx`

This is the most logic-heavy screen on the mobile side.

### What it does

1. Refreshes weekly history, weekly meals, and profile data when the screen becomes focused.
2. Computes the current local week from Sunday to Saturday.
3. Builds chart data for calories, mood, sleep, stress, and water.
4. Compares calorie intake against an estimated daily burn line when the profile contains enough information.
5. Displays charts in a single centered column for readability.
6. Highlights the current day in charts and weekly text cards.
7. Shows weekly `Symptoms` and `Notes` summaries.

### Why the logic is structured this way

The dashboard is designed around time-based comparison.
That means it needs:

1. deterministic week boundaries,
2. stable label generation,
3. correct date matching,
4. readable presentation.

The move to local date utilities was essential here because dashboard logic is especially sensitive to off-by-one-day errors.

### `MealsScreen.tsx`

This screen combines form input, image handling, server persistence, and list filtering.

### What it does

1. Lets the user select meal type.
2. Enter meal name and calories.
3. Attach an image from the camera or gallery.
4. Link the meal to today's daily log if available.
5. Load meal history.
6. Filter meal history by date and meal type.
7. Delete meals.

### Logic behind linking meals to daily logs

Meals can exist independently by date, but if today's daily log exists, the app also saves `DailyLogId`.
That gives stronger relational context without forcing the user to create a daily log first.

### `RemindersScreen.tsx`

This screen lets the user create medication reminders.

### What it does

1. Loads reminders from the backend.
2. Creates reminders in persistent storage.
3. Schedules a matching local device reminder.

### Important explanation

The server stores the reminder as data.
The device schedules the notification as behavior.
That split is intentional and is a good oral-exam talking point.

### `ProfileScreen.tsx`

This screen manages user profile data and notification preferences.

### What it does

1. Loads current profile data from the backend.
2. Splits date of birth into day/month/year fields for easier UI entry.
3. Sends updates back in `YYYY-MM-DD` format.
4. Lets the user toggle notifications.
5. Lets the user send a test push notification.
6. For admin users, exposes an `Admin Panel` entry inside the top profile card.
7. Exposes logout.

### Why date of birth is split into three fields

It is a simple input strategy that avoids adding a more complex date picker flow while still producing a backend-friendly ISO-like date format.

### `AdminScreen.tsx`

This is a role-restricted screen.

It calls the admin endpoint and shows all users.
The screen itself is useful for demonstrating role-based access, but the real access control is enforced in the backend by `[Authorize(Roles = "Admin")]`.

## 3.7 Mobile Styling and Config

### `index.ts`

This is the mobile entry file used by Expo.
Its role is small but important: it tells Expo which root component to start.

### `app.json`

This is the static Expo configuration file.
It contains the app identity, icons, platform-related settings, and default `extra` values.

### `globalStyles.ts`

This file centralizes reusable layout, card, form, button, chart, and status styles.

Why it matters:

1. visual consistency,
2. less duplication,
3. faster UI changes.

### `theme.ts`

This file defines the shared design tokens:

1. colors,
2. spacing,
3. border radius values.

### `app.config.js`

This file injects `apiBaseUrl` into Expo config from environment variables.

Why it exists:

It gives demo-day configurability without editing tracked config files directly.

### `scripts/start-expo.cjs`

This wrapper script improves local development.

### What it does

1. Detects the machine's LAN IP.
2. Forces Expo to use that IP.
3. Sets `EXPO_PUBLIC_API_BASE_URL`.

This solves the common problem where a phone cannot reach `127.0.0.1` on the developer machine.

## 4. Backend Walkthrough

## 4.1 `FitFocus.Api/Program.cs`

This file is the backend composition root.
It wires the entire server together.

### Main responsibilities

1. Register services and repositories in dependency injection.
2. Configure JWT authentication.
3. Configure authorization.
4. Configure CORS.
5. Configure global exception handling.
6. Expose `/health`.
7. Start database bootstrap in the background.

### Dependency injection logic

Infrastructure and services are registered as singletons where appropriate.
Repositories are scoped because they represent request-level data access behavior.

### JWT logic

`JwtOptions` are loaded from configuration.
The signing key is turned into a `SymmetricSecurityKey`.
JWT bearer authentication is configured with:

1. issuer validation,
2. audience validation,
3. signing key validation,
4. expiry validation,
5. zero clock skew.

Zero clock skew makes token-expiry behavior stricter and more deterministic.

### CORS logic

Allowed origins can come from:

1. environment variable `FITFOCUS_ALLOWED_ORIGINS`,
2. configuration section `Cors:AllowedOrigins`,
3. development defaults.

This makes the app more portable without editing tracked settings.

### Exception handling logic

The app uses `UseExceptionHandler`.
Instead of crashing or returning inconsistent server errors, it maps known failures into structured `ProblemDetails`.

Examples:

1. `SqlException` becomes "Database unavailable".
2. `TimeoutException` becomes "Request timed out".
3. Unknown exceptions become a generic server error.

This is strong architecture because controllers stay focused on business logic while the pipeline handles cross-cutting failures centrally.

### Startup resilience logic

The app no longer hard-fails during startup if the database is unavailable.
Instead:

1. the web server starts,
2. bootstrap runs in the background,
3. startup health is tracked in `StartupStatus`,
4. `/health` reports whether the database is ready.

That is a meaningful architecture improvement because the app can enter degraded mode instead of total failure.

## 4.2 Backend Infrastructure

### `SqlConnectionFactory.cs`

This file creates SQL connections.

Important logic:

1. It supports `FITFOCUS_DB_CONNECTION` override.
2. Otherwise it uses the configured connection string.
3. It clamps connect timeout to 8 seconds if needed.

This is a good example of defensive infrastructure code.

### `DatabaseBootstrapper.cs`

This class loads and executes `sql/CreateFitFocusTables.sql`.

Important logic:

1. If the SQL file is missing, it logs a warning and skips bootstrap.
2. If the file is empty, it logs a warning and skips bootstrap.
3. It opens the database connection and executes the schema script.

### `StartupStatus.cs`

This class stores startup health state in memory.

It tracks:

1. when the API started,
2. whether the database is ready,
3. when the database was last checked,
4. a human-readable message.

It exists so `/health` can report runtime status cleanly.

## 4.3 Backend Controllers

### `AuthController.cs`

This controller handles registration and login.

#### Register

1. Checks if email already exists.
2. Normalizes email to lowercase.
3. Hashes password.
4. Creates the user.
5. Reloads the created user.
6. Generates a JWT.
7. Returns `AuthResponse`.

#### Login

1. Looks up the user by normalized email.
2. Verifies the password.
3. Rehashes the password if it is using the old hash format.
4. Generates a JWT.
5. Returns the auth payload.

The automatic rehash is a strong answer if the professor asks how the system migrated security without breaking old users.

### `ProfileController.cs`

This controller returns and updates the currently authenticated user's profile.

It never accepts a user ID from the client.
Instead it derives the user ID from the JWT.

That is an important security decision because it prevents a client from trying to update another user's profile by guessing IDs.

### `DailyLogsController.cs`

This controller handles daily log CRUD.

The key logic is in `POST`:

1. look for an existing log on the same date,
2. update it if it exists,
3. create it otherwise.

This keeps the mobile client simple and enforces the one-log-per-user-per-date rule consistently.

### `DashboardController.cs`

This controller builds a summary for recent days.

It:

1. clamps the requested day range,
2. computes a date window,
3. loads logs,
4. counts meals,
5. passes everything into `RiskScoreService`.

This is good controller design because the controller coordinates data, but the scoring logic itself lives in a service.

### `MealsController.cs`

This controller provides:

1. filtered meal retrieval,
2. meal creation,
3. retrieval by daily log,
4. deletion.

Again, the user ID always comes from the JWT, not from request payload.

### `RemindersController.cs`

This controller manages persistent medication reminders.

It is conventional CRUD and works with `MedicationReminder` objects.

### `NotificationsController.cs`

This controller manages device tokens and test push notifications.

#### Register/unregister

The app can attach or remove Expo push tokens from the current user.

#### Send test push

The backend:

1. loads all device tokens for the user,
2. builds an Expo push payload for each token,
3. sends it via `HttpClient`,
4. counts successful sends,
5. collects failure details.

This endpoint is useful in demos because it proves the backend can initiate outbound push requests.

### `AdminController.cs`

This controller exposes the admin-only user list.

The important point is not just the returned data.
The important point is the role restriction:

`[Authorize(Roles = "Admin")]`

That is the backend enforcement layer for role-based access control.

## 4.4 Backend Services

### `PasswordService.cs`

This is one of the most important security files.

### Current logic

1. New passwords are hashed using PBKDF2 with SHA-256.
2. Hash format stores:
   prefix, iteration count, salt, and derived hash.
3. `VerifyPassword` supports both:
   current PBKDF2 format and legacy SHA-256 format.
4. `NeedsRehash` detects hashes that should be upgraded.

### Why this is strong

The system improves password security without forcing all existing users to reset their passwords immediately.

### `TokenService.cs`

This file generates JWT tokens.

It embeds:

1. user ID,
2. email,
3. full name,
4. role.

The role claim is what allows admin-only endpoints to work.

### `RiskScoreService.cs`

This service converts recent health behavior into a risk summary.

### Logic used

Risk increases when:

1. sleep is too low,
2. mood is low,
3. stress is high,
4. water intake is low,
5. symptoms are reported frequently.

The service then:

1. clamps the score to `0..100`,
2. maps it to a level:
   `Low`, `Medium`, `High`, `Critical`,
3. returns explanation strings in `RiskSignals`.

This is a very good service-layer example because it is pure business logic and independent of HTTP or SQL details.

## 4.5 Backend Repositories

All repositories use ADO.NET directly.
That means the project keeps full control over SQL instead of hiding it behind a heavy ORM.

### `UserRepository.cs`

Responsibilities:

1. get user by email,
2. get user by ID,
3. create user,
4. get all users,
5. update profile,
6. update password hash.

The private `MapUser(...)` method centralizes translation from `SqlDataReader` to the domain model.

### `DailyLogRepository.cs`

Responsibilities:

1. get one log by date,
2. get a date range,
3. create,
4. update,
5. delete.

Key logic:
`DateOnly` values are converted into `DateTime` with `TimeOnly.MinValue` before passing to SQL.

### `MealRepository.cs`

Responsibilities:

1. create meals,
2. get meals by daily log,
3. get meals by filters,
4. count meals in a date range,
5. delete meals.

It dynamically builds the query for filters based on optional parameters.

### `ReminderRepository.cs`

Responsibilities:

1. get reminders,
2. create,
3. update,
4. delete.

It converts SQL `TIME` into `TimeOnly` and vice versa.

### `DeviceTokenRepository.cs`

Responsibilities:

1. upsert push tokens,
2. delete push tokens,
3. fetch all tokens for a user.

The `MERGE` statement allows token upsert behavior without duplicate entries.

## 4.6 Backend Interfaces and Contracts

The project contains interface files for repositories, services, and infrastructure:

1. repository interfaces in `FitFocus.Api/Repositories/Interfaces`
2. service interfaces such as `IPasswordService`, `ITokenService`, `IRiskScoreService`
3. infrastructure interfaces such as `ISqlConnectionFactory` and `IDatabaseBootstrapper`

### Why these interfaces exist

They define contracts between layers.
`Program.cs` depends on abstractions when it wires dependency injection, and controllers/services depend on those abstractions too.

That gives three advantages:

1. the code is easier to reason about by responsibility,
2. implementations can be changed without changing every caller,
3. the architecture is cleaner for testing and explanation.

## 4.7 Backend Models

The project uses a clear separation between:

1. domain models,
2. request models,
3. response models,
4. configuration models.

### Domain models

Found in `FitFocus.Api/Models/Domain`.

These represent core business entities:

1. `User`
2. `DailyLog`
3. `MealEntry`
4. `MedicationReminder`

### Request models

Found in `FitFocus.Api/Models/Requests`.

These define the shape of incoming HTTP payloads, for example:

1. `LoginRequest`
2. `RegisterRequest`
3. `UpdateProfileRequest`
4. `UpsertDailyLogRequest`
5. `CreateMealRequest`
6. `UpsertReminderRequest`
7. notification request DTOs

Separating request models from domain models is good practice because HTTP payload shape and database/domain shape are not always the same concern.

### Response models

Found in `FitFocus.Api/Models/Responses`.

Examples:

1. `AuthResponse`
2. `DashboardSummaryResponse`

### Configuration models

`Configuration/JwtOptions.cs` represents structured JWT settings.

## 4.8 SQL Schema

The schema is defined in `FitFocus.Api/sql/CreateFitFocusTables.sql`.

### Tables

1. `FitFocus_UsersApp`
2. `FitFocus_DailyLogsApp`
3. `FitFocus_MealsApp`
4. `FitFocus_MedicationRemindersApp`
5. `FitFocus_DeviceTokensApp`

### Important schema decisions

1. Users have a unique email.
2. Daily logs have a unique `(UserId, LogDate)` constraint.
3. Meals may optionally point to a daily log.
4. Device tokens are unique per `(UserId, ExpoPushToken)`.

The unique daily-log constraint is especially important.
It enforces at the database level the same business rule that the controller follows.

## 5. Supporting Backend Files

### `ClaimsPrincipalExtensions.cs`

This helper extracts the authenticated user ID from claims.

Why it matters:

Controllers avoid repeating claim parsing logic.
That keeps controller code cleaner and less error-prone.

### `FitFocus.Api.csproj`

This defines the backend project itself and dependency configuration.

### `FitFocus.Api.http`

This is a manual API testing helper for local development.

## 6. Architecture Decisions and Why They Make Sense

## 6.1 Why Repository Pattern?

Because controllers should not know SQL details.

Controller role:
receive requests, apply auth, coordinate actions.

Repository role:
talk to the database.

This separation makes the code easier to reason about and easier to explain in layers.

## 6.2 Why JWT?

Because mobile apps need stateless authentication that works across many requests without storing server-side session objects.

JWT allows:

1. simple authorization headers,
2. role claims,
3. easy horizontal scaling in principle.

## 6.3 Why store session in AsyncStorage?

Because mobile apps need persistence across app restarts.
Without it, users would have to log in every time they reopened the app.

## 6.4 Why ADO.NET instead of Entity Framework?

Because the project wants explicit control over SQL and direct mapping between code and queries.

This is a good oral-exam answer if the professor asks why you did not use an ORM.

## 6.5 Why local reminders and push notifications together?

Because they solve different problems:

1. local reminders work on the device for scheduled daily behavior,
2. push notifications allow server-initiated communication.

Using both demonstrates better coverage of mobile capabilities.

## 6.6 Why the API starts in degraded mode?

Because a total startup failure is a poor operational story.

With degraded mode:

1. the API can still expose `/health`,
2. the frontend can understand what is broken,
3. the server is diagnosable even when SQL is unavailable.

## 7. High-Value Oral Exam Talking Points

If the professor asks "why did you do it this way?", these are strong answers.

### Authentication

The app uses JWT because the mobile client needs stateless authentication.
Passwords are hashed with PBKDF2, and legacy hashes are migrated automatically on successful login.

### Dashboard

The dashboard is week-based and uses local calendar dates, not UTC date strings, to avoid timezone drift.
It computes a stable Sunday-to-Saturday range and maps logs into chart-friendly data structures.

### Data consistency

Daily logs are unique per user per date both in controller logic and in the SQL unique constraint.
That is intentional defense in depth.

### Notifications

Push readiness is not assumed.
The app checks permissions, physical device constraints, Expo token creation, and backend token registration.

### Reliability

The backend no longer fails completely if SQL is unavailable at startup.
That makes the project easier to demo and operationally stronger.

## 8. Likely Professor Questions and Strong Answers

### "What is the role of `App.tsx`?"

It is the application composition root on the mobile side.
It restores the session, wires global auth behavior, sets up notifications, and defines the navigation hierarchy.

### "Why do you use `api.ts` instead of calling Axios directly in every screen?"

Because API concerns like base URL, token injection, and unauthorized handling are cross-cutting concerns.
Centralizing them prevents duplication and inconsistent behavior.

### "Where is the business logic?"

Business logic is mainly in backend services and controllers.
For example, risk scoring is in `RiskScoreService`, and create-or-update daily log logic is in `DailyLogsController`.

### "How do you prevent one user from seeing another user's data?"

The backend derives the user ID from the JWT claims using `ClaimsPrincipalExtensions.GetUserId()`.
Repositories are always called with that authenticated user ID, not with a client-supplied ID.

### "Why are notifications handled in more than one place?"

Because one part is persistence and one part is device behavior.
The backend stores tokens and can send push requests.
The mobile app handles local scheduling and permission flow.

### "Why did you create reusable components like `InputField` and `ActionButton`?"

To keep screens smaller, reduce duplicate styling, and make the UI consistent.

### "How does the app know which API URL to use?"

`api.ts`, `app.config.js`, and `start-expo.cjs` work together.
The project can use an explicit environment override, Expo host detection, emulator fallback, or localhost fallback depending on the environment.

### "What are the strongest architectural improvements in the current version?"

1. resilient backend startup,
2. better password hashing,
3. centralized mobile API configuration,
4. consistent error handling,
5. corrected local-date dashboard logic.

## 9. What To Emphasize During a Demo

If the professor asks you to narrate the architecture while demoing, focus on this order:

1. Login is JWT-based and session is restored from local storage.
2. The app talks only to the backend, never directly to SQL.
3. Daily logs are date-based and saved with create-or-update logic.
4. Meals support images and history filters.
5. Reminders combine server persistence with local device scheduling.
6. The dashboard builds a weekly summary from real saved logs.
7. The backend includes proper auth, repositories, services, health checks, and push token support.

## 10. Final Summary

The FitFocus codebase is structured around separation of concerns.

The mobile app is responsible for presentation, local session state, local device features, and API consumption.
The backend is responsible for security, business rules, database access, and system coordination.

The most important code ideas to understand for questioning are:

1. navigation and session bootstrap in `App.tsx`,
2. centralized networking in `api.ts`,
3. date-driven daily log and dashboard logic,
4. repository-based SQL access,
5. JWT authentication and claim-based authorization,
6. PBKDF2 password hashing with legacy migration,
7. startup resilience with health reporting.

If you can explain those clearly, you will be able to answer most architectural and implementation questions about the project confidently.
