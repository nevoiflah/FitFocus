import React, { useState, useEffect } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

// API & Types
import { api } from "./src/api";
import { Session } from "./src/types";

// Screens
import { AuthScreen } from "./src/screens/AuthScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { DailyLogScreen } from "./src/screens/DailyLogScreen";
import { MealsScreen } from "./src/screens/MealsScreen";
import { RemindersScreen } from "./src/screens/RemindersScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AdminScreen } from "./src/screens/AdminScreen";

// Utilities & Styles
import { setupNotifications, ensurePushReady } from "./src/utils/notificationUtils";
import { globalStyles } from "./src/styles/globalStyles";
import * as Notifications from "expo-notifications";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const SESSION_KEY = "fitfocus_session";

// Initialize notification handler
setupNotifications();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const setAuthenticated = async (newSession: Session) => {
    api.setToken(newSession.token);
    setSession(newSession);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  };

  const logout = async () => {
    api.clearToken();
    setSession(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  useEffect(() => {
    api.setOnUnauthorized(async () => {
      api.clearToken();
      setSession(null);
      await AsyncStorage.removeItem(SESSION_KEY);
    });

    const bootstrap = async () => {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Session;
        api.setToken(parsed.token);
        try {
          await api.getProfile();
          setSession(parsed);
        } catch {
          api.clearToken();
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const syncDeviceToken = async () => {
      if (!session) return;
      await ensurePushReady(notificationsEnabled);
    };

    syncDeviceToken();
  }, [session, notificationsEnabled]);

  useEffect(() => {
    if (!notificationsEnabled) {
      Notifications.cancelAllScheduledNotificationsAsync();
    }
  }, [notificationsEnabled]);

  if (loading) {
    return (
      <View style={globalStyles.centered}>
        <ActivityIndicator size="large" color="#4c6fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuthenticated={setAuthenticated} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main">
            {() => (
              <Tabs.Navigator
                screenOptions={({ route }) => ({
                  headerShown: false,
                  tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;
                    if (route.name === "Dashboard") iconName = focused ? "stats-chart" : "stats-chart-outline";
                    else if (route.name === "Daily Log") iconName = focused ? "calendar" : "calendar-outline";
                    else if (route.name === "Meals") iconName = focused ? "fast-food" : "fast-food-outline";
                    else if (route.name === "Reminders") iconName = focused ? "alarm" : "alarm-outline";
                    else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
                    else if (route.name === "Admin") iconName = focused ? "shield" : "shield-outline";
                    return <Ionicons name={iconName} size={size} color={color} />;
                  },
                  tabBarActiveTintColor: "#4c6fff",
                  tabBarInactiveTintColor: "#8a97b6",
                  tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: "#f1f4ff",
                    height: Platform.OS === "ios" ? 88 : 70,
                    paddingBottom: Platform.OS === "ios" ? 28 : 12,
                    paddingTop: 10,
                  },
                })}
              >
                <Tabs.Screen name="Dashboard" component={DashboardScreen} />
                <Tabs.Screen name="Daily Log" component={DailyLogScreen} />
                <Tabs.Screen name="Meals" component={MealsScreen} />
                <Tabs.Screen name="Reminders">
                  {(p) => <RemindersScreen {...p} notificationsEnabled={notificationsEnabled} />}
                </Tabs.Screen>
                {session.role === "Admin" ? <Tabs.Screen name="Admin" component={AdminScreen} /> : null}
                <Tabs.Screen name="Profile">
                  {(p) => (
                    <ProfileScreen
                      {...p}
                      onLogout={logout}
                      onEnsurePushReady={() => ensurePushReady(notificationsEnabled)}
                      notificationsEnabled={notificationsEnabled}
                      onToggleNotifications={setNotificationsEnabled}
                    />
                  )}
                </Tabs.Screen>
              </Tabs.Navigator>
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
