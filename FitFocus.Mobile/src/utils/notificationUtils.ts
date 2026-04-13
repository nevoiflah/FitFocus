import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api";

const REMINDER_NOTIFICATION_MAP_KEY = "fitfocus_local_reminder_map";

type ReminderNotificationMap = Record<string, string>;

type ReminderNotificationHint = {
  title?: string;
  body?: string;
  time?: string;
};

async function readReminderNotificationMap(): Promise<ReminderNotificationMap> {
  const raw = await AsyncStorage.getItem(REMINDER_NOTIFICATION_MAP_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as ReminderNotificationMap;
  } catch {
    return {};
  }
}

async function writeReminderNotificationMap(map: ReminderNotificationMap) {
  if (Object.keys(map).length === 0) {
    await AsyncStorage.removeItem(REMINDER_NOTIFICATION_MAP_KEY);
    return;
  }

  await AsyncStorage.setItem(REMINDER_NOTIFICATION_MAP_KEY, JSON.stringify(map));
}

const normalizeReminderTime = (value?: string) => {
  if (!value) {
    return null;
  }

  const [hourString = "", minuteString = ""] = value.split(":");
  if (!hourString || !minuteString) {
    return null;
  }

  return `${hourString.padStart(2, "0")}:${minuteString.padStart(2, "0")}`;
};

const getTriggerTime = (trigger: unknown) => {
  if (!trigger || typeof trigger !== "object") {
    return null;
  }

  const maybeTrigger = trigger as { hour?: number; minute?: number };
  if (typeof maybeTrigger.hour !== "number" || typeof maybeTrigger.minute !== "number") {
    return null;
  }

  return `${String(maybeTrigger.hour).padStart(2, "0")}:${String(maybeTrigger.minute).padStart(2, "0")}`;
};

const matchesReminderNotification = (
  request: Notifications.NotificationRequest,
  reminderId: number,
  hint?: ReminderNotificationHint,
) => {
  const data = request.content.data as { reminderId?: number | string } | undefined;
  if (data?.reminderId != null && Number(data.reminderId) === reminderId) {
    return true;
  }

  if (!hint) {
    return false;
  }

  const titleMatches = !hint.title || request.content.title === hint.title;
  const bodyMatches = !hint.body || request.content.body === hint.body;
  const expectedTime = normalizeReminderTime(hint.time);
  const triggerTime = getTriggerTime(request.trigger);
  const timeMatches = !expectedTime || (triggerTime !== null && triggerTime === expectedTime);

  return titleMatches && bodyMatches && timeMatches;
};

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

export async function cancelLocalReminder(reminderId: number, hint?: ReminderNotificationHint) {
  const map = await readReminderNotificationMap();
  const reminderKey = String(reminderId);
  const notificationId = map[reminderKey];

  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore stale notification IDs that no longer exist on the device.
    }

    delete map[reminderKey];
    await writeReminderNotificationMap(map);
  }

  if (!hint) {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matches = scheduled.filter((request) => {
    if (notificationId && request.identifier === notificationId) {
      return false;
    }

    return matchesReminderNotification(request, reminderId, hint);
  });

  for (const request of matches) {
    try {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    } catch {
      // Ignore requests that were already removed.
    }
  }
}

export async function clearStoredReminderNotifications() {
  const map = await readReminderNotificationMap();

  for (const notificationId of Object.values(map)) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore stale notification IDs that were already removed.
    }
  }

  await AsyncStorage.removeItem(REMINDER_NOTIFICATION_MAP_KEY);
}

export async function scheduleLocalReminder(
  reminderId: number,
  title: string,
  body: string,
  time: string,
  enabled: boolean,
) {
  if (!enabled) return;

  const [hourString, minuteString] = time.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return;
  }

  await cancelLocalReminder(reminderId, { title, body, time });

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { reminderId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  const map = await readReminderNotificationMap();
  map[String(reminderId)] = notificationId;
  await writeReminderNotificationMap(map);
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
