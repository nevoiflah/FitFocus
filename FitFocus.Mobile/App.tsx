import React, { useState, useEffect } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";

import { api } from "./src/api";
import { Session } from "./src/types";
import { AuthScreen } from "./src/screens/AuthScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { DailyLogScreen } from "./src/screens/DailyLogScreen";
import { MealsScreen } from "./src/screens/MealsScreen";
import { RemindersScreen } from "./src/screens/RemindersScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import {
  setupNotifications,
  ensurePushReady,
  clearStoredReminderNotifications,
} from "./src/utils/notificationUtils";
import { globalStyles } from "./src/styles/globalStyles";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const SESSION_KEY = "fitfocus_session";

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

  const syncSessionFullName = (fullName: string) => {
    setSession((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, fullName };
      void AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
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
          const profile = await api.getProfile();
          const refreshedSession: Session = {
            ...parsed,
            userId: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            role: profile.role,
          };
          setSession(refreshedSession);
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(refreshedSession));
        } catch {
          api.clearToken();
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    const syncDeviceToken = async () => {
      if (!session) return;
      await ensurePushReady(notificationsEnabled);
    };

    void syncDeviceToken();
  }, [session, notificationsEnabled]);

  useEffect(() => {
    if (!notificationsEnabled) {
      void Notifications.cancelAllScheduledNotificationsAsync();
      void clearStoredReminderNotifications();
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
          <>
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
                  <Tabs.Screen name="Profile">
                    {(p) => (
                      <ProfileScreen
                        {...p}
                        onLogout={logout}
                        onEnsurePushReady={() => ensurePushReady(notificationsEnabled)}
                        notificationsEnabled={notificationsEnabled}
                        onToggleNotifications={setNotificationsEnabled}
                        showAdminEntry={session.role === "Admin"}
                        onOpenAdmin={session.role === "Admin" ? () => p.navigation.getParent()?.navigate("Admin") : undefined}
                        onProfileSaved={syncSessionFullName}
                      />
                    )}
                  </Tabs.Screen>
                </Tabs.Navigator>
              )}
            </Stack.Screen>
            {session.role === "Admin" ? <Stack.Screen name="Admin" component={AdminScreen} /> : null}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
