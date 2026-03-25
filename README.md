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
    *The database tables will be automatically initialized on the first startup. Data is persistent and will not be reset on consecutive restarts.*

### Mobile Setup (FitFocus.Mobile)

1.  **Installation**:
    ```bash
    cd FitFocus.Mobile
    npm install
    ```
2.  **Environment Configuration**: Update `app.json` with the correct `apiBaseUrl`. If testing on a physical device, use your machine's local IP address instead of `localhost`.
3.  **Start Development Server**:
    ```bash
    npx expo start
    ```

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
