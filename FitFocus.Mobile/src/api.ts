import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const hostUri = Constants.expoConfig?.hostUri?.split(":")[0];
const configuredBaseUrl = (Constants.expoConfig?.extra ?? {})?.apiBaseUrl;

const getBaseUrl = () => {
  if (hostUri) return `http://${hostUri}:5117/api`;
  if (configuredBaseUrl) return configuredBaseUrl;
  return Platform.OS === "android" ? "http://10.0.2.2:5117/api" : "http://localhost:5117/api";
};

const BASE_URL = getBaseUrl();

export type AuthResponse = {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
};

export type DailyLog = {
  id: number;
  userId: number;
  logDate: string;
  moodScore: number;
  sleepHours: number;
  symptoms?: string;
  notes?: string;
  stressScore: number;
  waterLiters: number;
};

export type Reminder = {
  id: number;
  userId: number;
  medicationName: string;
  dosage: string;
  reminderTime: string;
  isActive: boolean;
};

export type Meal = {
  id: number;
  userId: number;
  dailyLogId?: number;
  logDate: string;
  mealType: string;
  mealName: string;
  calories?: number;
  imageUrl?: string;
};

export type AdminUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

export type DashboardSummary = {
  daysAnalyzed: number;
  avgSleepHours: number;
  avgMoodScore: number;
  avgStressScore: number;
  avgWaterLiters: number;
  totalMealsLogged: number;
  riskScore: number;
  riskLevel: string;
  riskSignals: string[];
};

let authToken = "";
let onUnauthorized: (() => void) | null = null;

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      (onUnauthorized as (() => void) | null)?.();
    }
    return Promise.reject(error);
  }
);

export const api = {
  setToken(token: string) {
    authToken = token;
  },
  clearToken() {
    authToken = "";
  },
  setOnUnauthorized(cb: () => void) {
    onUnauthorized = cb;
  },
  async register(email: string, password: string, fullName: string) {
    const { data } = await http.post<AuthResponse>("/auth/register", {
      email,
      password,
      fullName,
    });
    return data;
  },
  async login(email: string, password: string) {
    const { data } = await http.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },
  async getProfile() {
    const { data } = await http.get("/profile");
    return data;
  },
  async updateProfile(payload: {
    fullName: string;
    dateOfBirth?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    gender?: string | null;
  }) {
    await http.put("/profile", payload);
  },
  async upsertDailyLog(payload: {
    logDate: string;
    moodScore: number;
    sleepHours: number;
    stressScore: number;
    waterLiters: number;
    symptoms?: string;
    notes?: string;
  }) {
    await http.post("/dailylogs", payload);
  },
  async getDailyLog(date: string) {
    const { data } = await http.get<DailyLog>("/dailylogs", { params: { date } });
    return data;
  },
  async getDailyLogRange(from: string, to: string) {
    const { data } = await http.get<DailyLog[]>("/dailylogs/range", { params: { from, to } });
    return data;
  },
  async getDashboard(days = 14) {
    const { data } = await http.get<DashboardSummary>("/dashboard/summary", {
      params: { days },
    });
    return data;
  },
  async createMeal(payload: {
    dailyLogId?: number;
    logDate: string;
    mealType: string;
    mealName: string;
    calories?: number;
    imageUrl?: string;
  }) {
    const { data } = await http.post<{ id: number }>("/meals", payload);
    return data;
  },
  async getMeals(date?: string, mealType?: string) {
    const { data } = await http.get<Meal[]>("/meals", {
      params: { date, mealType },
    });
    return data;
  },
  async getMealsByLog(logId: number) {
    const { data } = await http.get<Meal[]>(`/meals/by-log/${logId}`);
    return data;
  },
  async deleteMeal(mealId: number) {
    await http.delete(`/meals/${mealId}`);
  },
  async getReminders() {
    const { data } = await http.get<Reminder[]>("/reminders");
    return data;
  },
  async createReminder(payload: {
    medicationName: string;
    dosage: string;
    reminderTime: string;
    isActive: boolean;
  }) {
    await http.post("/reminders", payload);
  },
  async registerDeviceToken(expoPushToken: string, deviceName?: string) {
    await http.post("/notifications/register-device", { expoPushToken, deviceName });
  },
  async unregisterDeviceToken(expoPushToken: string) {
    await http.post("/notifications/unregister-device", { expoPushToken });
  },
  async sendTestPush(title: string, body: string) {
    const { data } = await http.post("/notifications/send-test", { title, body });
    return data as { sent: number; total: number };
  },
  async getAdminUsers() {
    const { data } = await http.get<AdminUser[]>("/admin/users");
    return data;
  },
  getBaseUrl() {
    return BASE_URL;
  },
};
