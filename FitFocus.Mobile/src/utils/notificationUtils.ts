import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api";

export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function scheduleLocalReminder(title: string, body: string, time: string, enabled: boolean) {
  if (!enabled) return;

  const [hourString, minuteString] = time.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function registerNotifications(enabled: boolean): Promise<{ token: string; error?: string }> {
  try {
    if (!enabled) {
      return { token: "", error: "Notifications are disabled in the app." };
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    if (!Device.isDevice) {
      return { token: "", error: "Push token requires a physical device." };
    }

    const permission = await Notifications.getPermissionsAsync();
    let finalStatus = permission.status;
    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
      return {
        token: "",
        error: "Notification permission is denied. Enable notifications for Expo Go in iPhone Settings.",
      };
    }

    const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId ?? (Constants.expoConfig as any)?.projectId ?? "3d058b67-8939-431f-97be-63304c2624ac";
    const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: expoToken.data };
  } catch (error: any) {
    const message = String(error?.message ?? error ?? "");
    if (Constants.appOwnership === "expo") {
      return {
        token: "",
        error:
          `Expo Go limitation while creating push token. ${message || ""} `.trim() +
          "For reliable remote push testing, use a development build.",
      };
    }
    return { token: "", error: `Push token error: ${message || "unknown error"}` };
  }
}

export async function ensurePushReady(notificationsEnabled: boolean): Promise<{ ok: boolean; message?: string }> {
  const { token, error } = await registerNotifications(notificationsEnabled);
  if (!token) {
    if (!notificationsEnabled) {
      const lastToken = await AsyncStorage.getItem("last_expo_token");
      if (lastToken) {
        await api.unregisterDeviceToken(lastToken);
      }
    }
    return {
      ok: false,
      message: error ?? "Could not obtain an Expo push token.",
    };
  }

  try {
    await api.registerDeviceToken(token, Device.deviceName ?? undefined);
    await AsyncStorage.setItem("last_expo_token", token);
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not register device token on server." };
  }
}
