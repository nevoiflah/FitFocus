# FitFocus Project Documentation

FitFocus is a comprehensive health and lifestyle tracking system consisting of a robust ASP.NET Core Web API backend and a cross-platform React Native mobile application. The system is designed to provide users with a centralized platform for managing daily health metrics, dietary habits, and medication schedules.

## Project Structure

The repository is organized into two primary components:

*   **FitFocus.Api**: A RESTful Web API built with .NET 8, utilizing SQL Server for persistent data storage. It handles authentication, data aggregation, and notification scheduling.
*   **FitFocus.Mobile**: A mobile application built with React Native and Expo. It provides the user interface for data entry, progress visualization via dynamic charts, and push notification management.

---

## Technical Features

### Authentication and Security
*   **JSON Web Token (JWT) Implementation**: Secure, stateless authentication for all API endpoints.
*   **Role-Based Access Control**: Support for User and Admin roles to manage system permissions.
*   **Password Hashing**: Secure storage of user credentials using industry-standard hashing algorithms.

### Dashboard and Data Visualization
*   **Dynamic Health Metrics**: Visualization of Mood, Sleep, Stress, and Water intake using `react-native-chart-kit`.
*   **Fixed Weekly View**: All charts display data from Sunday to Saturday for consistent trend analysis.
*   **Interactive Analytics**: Touch-enabled data points providing detailed daily values and timestamps directly within the UI.
*   **Automated Risk Scoring**: Backend service that calculates health risks based on historical data patterns.

### Health Logging
*   **Daily Activity Tracking**: Unified interface for logging daily health metrics like mood, sleep, and water.
*   **Nutritional Management**: Meal logging system with photo support, calorie tracking via interactive sliders, and deletion capability.
*   **Meal Image Previews**: Real-time image preview during selection and persistent image display in meal cards.
*   **Medication Reminders**: Local and remote notification system for medication adherence, including a persistent schedule.

### Push Notifications
*   **Expo Push Service Integration**: Backend support for sending push notifications to physical devices.
*   **Device Token Management**: Secure registration and tracking of physical device tokens.

---

## Infrastructure and Technology Stack

*   **Backend**: C#, ASP.NET Core, ADO.NET, SQL Server.
*   **Mobile**: TypeScript, React Native, Expo.
*   **Networking**: Axios for API communication.
*   **Charts**: React Native Chart Kit for data visualization.

---

## Getting Started

### Backend Setup (FitFocus.Api)

1.  **Configuration**: Ensure SQL Server is accessible. Update the connection string in `appsettings.json` under the `myProjDB` key.
2.  **Restore Dependencies**:
    ```bash
    cd FitFocus.Api
    dotnet restore
    ```
3.  **Launch API**:
    ```bash
    dotnet run
    ```
    *The API now starts even if the SQL server is temporarily unavailable. Database bootstrap runs in the background, and runtime status is exposed at `GET /health`.*

4.  **Optional environment overrides**:
    ```bash
    export FITFOCUS_DB_CONNECTION="Server=...;Database=...;User Id=...;Password=...;"
    export FITFOCUS_ALLOWED_ORIGINS="http://localhost:8081,http://127.0.0.1:8081"
    ```
    *These overrides let you keep `appsettings.json` untouched while changing demo-day configuration.*

### Mobile Setup (FitFocus.Mobile)

1.  **Installation**:
    ```bash
    cd FitFocus.Mobile
    npm install
    ```
2.  **Environment Configuration**:
    ```bash
    export EXPO_PUBLIC_API_BASE_URL="http://YOUR-LAN-IP:5117/api"
    ```
    *If you skip this, `npm start` automatically injects a LAN URL based on your current machine IP.*
3.  **Start Development Server**:
    ```bash
    npm start
    ```
    *The Expo wrapper prints the exact API base URL it is using and feeds that value into Expo config at startup.*

---

## Troubleshooting (Common Issues)

### 1. Networking (Android Phone vs PC)
*   **Physical Device**: Ensure the Android phone and PC are on the **same Wi-Fi**.
*   **API URL**: In `src/api.ts`, ensure `apiBaseUrl` points to your computer's LAN IP (e.g., `192.168.1.XX`) if using a real phone. Expo usually handles this automatically.
*   **Android Cleartext**: Android blocks `http` by default. Our `app.json` is configured to allow it for development, but ensure you use a modern Expo Go app.

### 2. Windows Firewall
Windows usually blocks incoming connections to port **5117**. 
*   **Fix**: Grant `dotnet run` access to "Private Networks" when prompted, or manually open the port in Windows Firewall settings.

### 3. Database Access
The database is hosted on a remote server. If you are off-campus or not using a VPN, the connection might be blocked by the server's firewall.

### 4. Health Endpoint
Use the API health endpoint to verify the backend before opening the mobile app:
```bash
curl http://localhost:5117/health
```
If `status` is `degraded`, the API is up but the database is currently unavailable.

### 5. Demo Checklist
1. Start the API and verify `GET /health`.
2. Start the mobile app with `npm start`.
3. Confirm the login screen shows a healthy API connection and the expected API URL.
4. Demo the main flow: login, daily log, meal photo, reminder, dashboard, profile.

---

## Development Standards

### Git Configuration
The project uses a comprehensive `.gitignore` strategy to exclude:
*   Standard .NET build directories (`bin/`, `obj/`).
*   Node.js dependencies (`node_modules/`).
*   Local environment settings and secret files (`appsettings.json`, `.env`).
*   IDE-specific configuration folders (`.vscode/`, `.idea/`).

---

## Project Context
This project was developed as part of the Mobile Application Development course at Ruppin Academic Center.
