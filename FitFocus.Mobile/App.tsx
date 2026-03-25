import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminUser, api, DailyLog, DashboardSummary, Meal, Reminder } from "./src/api";

type Session = {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
};

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const SESSION_KEY = "fitfocus_session";

function extractErrorMessage(error: any, fallback: string) {
  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }
  return error?.response?.data?.title ?? error?.response?.data?.message ?? fallback;
}

function ActionButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.buttonBase,
        variant === "secondary" ? styles.buttonSecondary : styles.buttonPrimary,
        variant === "danger" ? styles.buttonDanger : null,
        pressed || disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" ? styles.buttonTextSecondary : styles.buttonTextPrimary,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function InputField({
  label,
  style,
  ...rest
}: {
  label: string;
} & TextInputProps) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          rest.secureTextEntry ? { textAlign: "left" } : null,
          style,
        ]}
        placeholderTextColor="#8a97b6"
        {...rest}
      />
    </View>
  );
}

function SliderInput({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit = "",
}: {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <View style={styles.inputWrap}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Text style={{ color: "#4c6fff", fontWeight: "700" }}>
          {step < 1 ? value.toFixed(1) : value}
          {unit}
        </Text>
      </View>
      <Slider
        style={{ width: "100%", height: 40 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#4c6fff"
        maximumTrackTintColor="#cbd5e1"
        thumbTintColor="#4c6fff"
      />
    </View>
  );
}

function SegmentedPicker({
  label,
  selected,
  onSelect,
  options,
}: {
  label: string;
  selected: string;
  onSelect: (value: string) => void;
  options: string[];
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.segmentedContainer}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={[styles.segmentedItem, selected === opt ? styles.segmentedItemActive : null]}
          >
            <Text
              style={[styles.segmentedText, selected === opt ? styles.segmentedTextActive : null]}
            >
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (s: Session) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password || (isRegister && !fullName)) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }
    try {
      setBusy(true);
      const data = isRegister
        ? await api.register(email.trim(), password, fullName.trim())
        : await api.login(email.trim(), password);
      onAuthenticated(data);
    } catch (error: any) {
      const networkMessage =
        error?.code === "ERR_NETWORK" || !error?.response
          ? "Cannot reach server. Make sure FitFocus.Api is running and phone+computer are on same Wi-Fi."
          : null;
      Alert.alert("Authentication failed", networkMessage ?? extractErrorMessage(error, "Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.authSafeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authCard}>
            <Text style={styles.title}>FitFocus</Text>
            <Text style={styles.subtitle}>Personal health and risk tracking</Text>
            {isRegister ? (
              <InputField
                label="Full Name"
                placeholder="Your full name"
                value={fullName}
                onChangeText={setFullName}
              />
            ) : null}
            <InputField
              label="Email"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <InputField
              label="Password"
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {busy ? (
              <ActivityIndicator />
            ) : (
              <ActionButton title={isRegister ? "Create account" : "Login"} onPress={submit} />
            )}
            <View style={{ height: 10 }} />
            <ActionButton
              title={isRegister ? "Already have an account? Login" : "Need an account? Register"}
              onPress={() => setIsRegister((x) => !x)}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const miniChartConfig = {
  backgroundColor: "transparent",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#ffffff",
  backgroundGradientToOpacity: 0,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(76, 111, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  propsForDots: { r: "3", strokeWidth: "1", stroke: "#fff" },
  propsForBackgroundLines: { strokeWidth: 0.5, stroke: "#e2e8f0" },
  propsForLabels: { fontSize: 9 },
};

function ChartBox({ title, data, value, unit, color }: any) {
  const [selected, setSelected] = useState<{ val: number | string; day: string } | null>(null);

  const chartConfig = {
    ...miniChartConfig,
    color: (opacity = 1) => `${color}${opacity})`,
  };

  const handlePointClick = (data: any) => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    setSelected({
      val: data.value,
      day: dayNames[data.index],
    });
  };

  return (
    <View style={styles.miniChartCard}>
      <View style={styles.miniChartHeader}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <View style={styles.todayIndicator}>
              <Text style={styles.todayValue}>{value}</Text>
              <Text style={styles.todayUnit}>{unit} (Today)</Text>
            </View>
          </View>
          
          {selected && (
            <View style={{ alignItems: "flex-end", backgroundColor: "#f8fafc", padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0" }}>
              <Text style={{ fontSize: 10, color: "#64748b", fontWeight: "600" }}>{selected.day}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#243b7e" }}>{selected.val}{unit}</Text>
            </View>
          )}
        </View>
      </View>
      {data ? (
        <LineChart
          data={data}
          width={Dimensions.get("window").width - 56}
          height={160}
          chartConfig={chartConfig}
          bezier
          withDots={true}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
          onDataPointClick={handlePointClick}
          style={{ paddingRight: 40, paddingLeft: 0, marginTop: 8, borderRadius: 12 }}
        />
      ) : (
        <View style={{ height: 80, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#94a3b8" }}>No data</Text>
        </View>
      )}
    </View>
  );
}

function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [busy, setBusy] = useState(false);

  const fetchData = async () => {
    try {
      setBusy(true);
      
      // Calculate start of current week (Sunday) and end (Saturday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday
      
      const sun = new Date(now);
      sun.setDate(now.getDate() - currentDay);
      sun.setHours(0, 0, 0, 0);
      
      const sat = new Date(sun);
      sat.setDate(sun.getDate() + 6);
      sat.setHours(23, 59, 59, 999);

      const from = sun.toISOString().slice(0, 10);
      const to = sat.toISOString().slice(0, 10);

      const [summaryData, historyData] = await Promise.all([
        api.getDashboard(14),
        api.getDailyLogRange(from, to),
      ]);

      setSummary(summaryData);
      setHistory((historyData || []).sort((a, b) => a.logDate.localeCompare(b.logDate)));
    } catch (err: any) {
      console.error("Dashboard error:", err);
    } finally {
      setBusy(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const todayData = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return history.find((h) => h.logDate === today);
  }, [history]);

  const getChartData = (key: keyof DailyLog, color: string) => {
    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels = ["S", "M", "T", "W", "T", "F", "S"];
    
    // Map current history into a fixed 7-day array based on the current week
    const now = new Date();
    const sun = new Date(now);
    sun.setDate(now.getDate() - now.getDay());
    sun.setHours(0,0,0,0);

    const weeklyData = daysArr.map((_, i) => {
      const d = new Date(sun);
      d.setDate(sun.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);
      const entry = history.find(h => h.logDate === dStr);
      return entry ? Number(entry[key]) || 0 : 0;
    });

    return {
      labels,
      datasets: [
        {
          data: weeklyData,
          color: (opacity = 1) => `${color}${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView style={styles.screen}>
        <Text style={styles.title}>Dashboard</Text>
        {busy && <ActivityIndicator style={{ marginBottom: 10 }} />}

        <View style={{ gap: 24 }}>
          <View>
            <Text style={styles.chartSectionTitle}>Mood</Text>
            <ChartBox
              value={todayData?.moodScore ?? "-"}
              unit="/10"
              data={getChartData("moodScore", "rgba(76, 111, 255, ")}
              color="rgba(76, 111, 255, "
            />
          </View>

          <View>
            <Text style={styles.chartSectionTitle}>Sleep</Text>
            <ChartBox
              value={todayData?.sleepHours ?? "-"}
              unit="h"
              data={getChartData("sleepHours", "rgba(16, 185, 129, ")}
              color="rgba(16, 185, 129, "
            />
          </View>

          <View>
            <Text style={styles.chartSectionTitle}>Stress</Text>
            <ChartBox
              value={todayData?.stressScore ?? "-"}
              unit="/10"
              data={getChartData("stressScore", "rgba(244, 63, 94, ")}
              color="rgba(244, 63, 94, "
            />
          </View>

          <View>
            <Text style={styles.chartSectionTitle}>Water</Text>
            <ChartBox
              value={todayData?.waterLiters ? Number(todayData.waterLiters).toFixed(1) : "-"}
              unit="L"
              data={getChartData("waterLiters", "rgba(6, 182, 212, ")}
              color="rgba(6, 182, 212, "
            />
          </View>
        </View>

        <ActionButton title="Refresh Data" onPress={fetchData} />
        <View style={{ height: 40 }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DailyLogScreen() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [mood, setMood] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(5);
  const [water, setWater] = useState(2);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const loadToday = async () => {
    try {
      const log = await api.getDailyLog(today);
      setMood(Math.min(10, Math.max(1, Math.round(Number(log.moodScore)))));
      setSleep(Math.min(24, Math.max(0, Math.round(Number(log.sleepHours)))));
      setStress(Math.min(10, Math.max(1, Math.round(Number(log.stressScore)))));
      setWater(Math.min(10, Math.max(0, Math.round(Number(log.waterLiters)))));
      setSymptoms(log.symptoms ?? "");
      setNotes(log.notes ?? "");
    } catch {
      // no existing log is a valid case
    }
  };

  useEffect(() => {
    loadToday();
  }, [today]);

  const submit = async () => {
    try {
      setBusy(true);
      await api.upsertDailyLog({
        logDate: today,
        moodScore: mood,
        sleepHours: sleep,
        stressScore: stress,
        waterLiters: water,
        symptoms,
        notes,
      });
      Alert.alert("Saved", "Daily log was saved (create or update).");
    } catch (error: any) {
      Alert.alert("Could not save", extractErrorMessage(error, "If a log exists, edit support can be added next."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView style={styles.screen}>
        <Text style={styles.title}>Daily Log</Text>
        <Text style={styles.subtitle}>{today}</Text>

        <SliderInput label="Mood Score" value={mood} onValueChange={setMood} min={1} max={10} step={1} unit="/10" />
        <SliderInput label="Sleep Hours" value={sleep} onValueChange={setSleep} min={0} max={24} step={0.5} unit="h" />
        <SliderInput label="Stress Score" value={stress} onValueChange={setStress} min={1} max={10} step={1} unit="/10" />
        <SliderInput label="Water (Liters)" value={water} onValueChange={setWater} min={0} max={10} step={0.2} unit="L" />

        <InputField label="Symptoms" value={symptoms} onChangeText={setSymptoms} placeholder="Optional symptoms" />
        <InputField
          label="Notes"
          style={{ height: 100, textAlignVertical: "top" }}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Daily notes"
        />
        <View style={{ height: 10 }} />
        {busy ? <ActivityIndicator /> : <ActionButton title="Save Daily Log" onPress={submit} />}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MealsScreen() {
  const [mealType, setMealType] = useState("Lunch");
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState(300);
  const [imageUrl, setImageUrl] = useState("");
  const [dailyLogId, setDailyLogId] = useState("");
  const [list, setList] = useState<Meal[]>([]);
  const [busy, setBusy] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const autoFetchLogId = async () => {
    try {
      const log = await api.getDailyLog(today);
      if (log?.id) {
        setDailyLogId(String(log.id));
        const loaded = await api.getMealsByLog(log.id);
        setList(loaded);
      }
    } catch {
      // no log for today is fine
    }
  };

  useEffect(() => {
    autoFetchLogId();
  }, [today]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!mealName.trim()) {
      Alert.alert("Missing", "Please tell us what you ate.");
      return;
    }
    try {
      setBusy(true);
      await api.createMeal({
        mealType,
        mealName,
        calories: Number(calories),
        imageUrl: imageUrl || undefined,
        dailyLogId: dailyLogId ? Number(dailyLogId) : undefined,
      });
      Alert.alert("Saved", "Meal added.");
      setMealName("");
      setCalories(300);
      setImageUrl("");
      if (dailyLogId) {
        const loaded = await api.getMealsByLog(Number(dailyLogId));
        setList(loaded);
      }
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not create meal."));
    } finally {
      setBusy(false);
    }
  };

  const loadByLog = async () => {
    if (!dailyLogId) {
      Alert.alert("Missing", "Enter Daily Log ID first.");
      return;
    }
    try {
      setBusy(true);
      const loaded = await api.getMealsByLog(Number(dailyLogId));
      setList(loaded);
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not load meals."));
    } finally {
      setBusy(false);
    }
  };

  const deleteMeal = (id: number) => {
    Alert.alert("Delete Meal", "Are you sure you want to remove this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteMeal(id);
            setList((prev) => prev.filter((m) => m.id !== id));
          } catch (err) {
            Alert.alert("Error", extractErrorMessage(err, "Could not delete meal."));
          }
        },
      },
    ]);
  };

  const mealOptions = ["Breakfast", "Lunch", "Dinner", "Snack"];

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView style={styles.screen}>
        <Text style={styles.title}>Meals</Text>
        <Text style={styles.subtitle}>Log what you ate today</Text>

        <SegmentedPicker
          label="Meal Type"
          selected={mealType}
          onSelect={setMealType}
          options={mealOptions}
        />

        <InputField
          label="What did you eat?"
          value={mealName}
          onChangeText={setMealName}
          placeholder="e.g. Grilled Chicken Salad"
        />

        <SliderInput
          label="Calories"
          value={calories}
          onValueChange={setCalories}
          min={0}
          max={2000}
          step={10}
          unit=" kcal"
        />

        <InputField
          label="Daily Log ID"
          value={dailyLogId}
          onChangeText={setDailyLogId}
          placeholder="Detected automatically"
          keyboardType="numeric"
        />

        <View style={{ height: 10 }} />
        <ActionButton title="Pick meal image" onPress={pickImage} variant="secondary" />
        {imageUrl ? (
          <View style={[styles.card, { alignItems: "center", marginTop: 10 }]}>
            <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 180, borderRadius: 12 }} resizeMode="cover" />
            <Pressable onPress={() => setImageUrl("")} style={{ marginTop: 8 }}>
              <Text style={{ color: "#cc4a6a", fontWeight: "600" }}>Remove Image</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ height: 10 }} />
        {busy ? <ActivityIndicator /> : <ActionButton title="Save Meal" onPress={submit} />}

        <View style={{ height: 20 }} />
        <Text style={styles.subtitle}>History for Log #{dailyLogId || "?"}</Text>
        <ActionButton title="Refresh List" onPress={loadByLog} variant="secondary" />

        <View style={{ height: 12 }} />
        {list.length === 0 ? (
          <Text style={styles.card}>No meals logged for this ID.</Text>
        ) : (
          list.map((m) => (
            <View key={String(m.id)} style={[styles.card, { flexDirection: "row", alignItems: "center" }]}>
              {m.imageUrl ? (
                <Image
                  source={{ uri: m.imageUrl }}
                  style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
                />
              ) : (
                <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name="fast-food-outline" size={24} color="#94a3b8" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: "#243b7e" }}>{m.mealType}</Text>
                <Text style={{ color: "#444" }}>{m.mealName}</Text>
                {m.calories ? <Text style={{ fontSize: 12, color: "#666" }}>{m.calories} kcal</Text> : null}
              </View>
              <Pressable onPress={() => deleteMeal(m.id)} style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}>
                <Ionicons name="trash-outline" size={20} color="#cc4a6a" />
              </Pressable>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

async function scheduleLocalReminder(title: string, body: string, time: string, enabled: boolean) {
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

function RemindersScreen({ notificationsEnabled }: { notificationsEnabled: boolean }) {
  const [items, setItems] = useState<Reminder[]>([]);
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("08:00");

  const load = async () => {
    try {
      setItems(await api.getReminders());
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not load reminders."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createReminder = async () => {
    if (!medicationName.trim() || !dosage.trim()) {
      Alert.alert("Missing", "Medication and dosage are required.");
      return;
    }
    try {
      await api.createReminder({
        medicationName,
        dosage,
        reminderTime: `${time}:00`,
        isActive: true,
      });
      await scheduleLocalReminder(
        "FitFocus Medication Reminder",
        `${medicationName} - ${dosage}`,
        time,
        notificationsEnabled,
      );
      setMedicationName("");
      setDosage("");
      await load();
    } catch {
      Alert.alert("Error", "Could not save reminder.");
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView style={styles.screen}>
        <Text style={styles.title}>Reminders</Text>
        <InputField label="Medication Name" value={medicationName} onChangeText={setMedicationName} placeholder="e.g. Vitamin D" />
        <InputField label="Dosage" value={dosage} onChangeText={setDosage} placeholder="e.g. 1 pill" />
        <InputField label="Reminder Time" value={time} onChangeText={setTime} placeholder="HH:mm" />
        <ActionButton title="Add Reminder" onPress={createReminder} />
        <View style={{ height: 12 }} />
        {items.map((r) => (
          <Text key={String(r.id)} style={styles.card}>
            {r.reminderTime?.slice(0, 5)} - {r.medicationName} ({r.dosage})
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen({
  onLogout,
  onEnsurePushReady,
  notificationsEnabled,
  onToggleNotifications,
}: {
  onLogout: () => void;
  onEnsurePushReady: () => Promise<{ ok: boolean; message?: string }>;
  notificationsEnabled: boolean;
  onToggleNotifications: (v: boolean) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [gender, setGender] = useState("");

  const load = async () => {
    try {
      const profile = await api.getProfile();
      setFullName(profile.fullName ?? "");
      const dob = profile.dateOfBirth || ""; // yyyy-mm-dd
      if (dob.includes("-")) {
        const [y, m, d] = dob.split("-");
        setDobYear(y);
        setDobMonth(m);
        setDobDay(d);
      }
      setHeightCm(profile.heightCm ? Number(profile.heightCm) : 170);
      setWeightKg(profile.weightKg ? Number(profile.weightKg) : 70);
      setGender(profile.gender ?? "Other");
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not load profile."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      const formattedDob =
        dobYear && dobMonth && dobDay ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}` : null;

      await api.updateProfile({
        fullName,
        dateOfBirth: formattedDob,
        heightCm,
        weightKg,
        gender: gender || null,
      });
      Alert.alert("Saved", "Profile updated.");
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not update profile."));
    }
  };

  const sendPush = async () => {
    try {
      const ready = await onEnsurePushReady();
      if (!ready.ok) {
        Alert.alert("Push setup", ready.message ?? "Push token is not ready on this device.");
        return;
      }
      const res = await api.sendTestPush("FitFocus test push", "Push notifications are wired correctly.");
      const sentText = `Sent ${res.sent}/${res.total}`;
      Alert.alert("Push sent", res.sent > 0 ? sentText : `${sentText}\nNo push accepted by Expo.`);
    } catch (error: any) {
      Alert.alert("Push error", extractErrorMessage(error, "Could not send test push."));
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView style={styles.screen}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your personal information</Text>

        <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your name" />

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: "30%" }}>
              <TextInput
                style={styles.input}
                value={dobDay}
                onChangeText={setDobDay}
                placeholder="Day"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={{ width: "30%" }}>
              <TextInput
                style={styles.input}
                value={dobMonth}
                onChangeText={setDobMonth}
                placeholder="Month"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={{ width: "35%" }}>
              <TextInput
                style={styles.input}
                value={dobYear}
                onChangeText={setDobYear}
                placeholder="Year"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        </View>

        <SliderInput label="Height" value={heightCm} onValueChange={setHeightCm} min={100} max={250} unit=" cm" />

        <SliderInput label="Weight" value={weightKg} onValueChange={setWeightKg} min={30} max={200} step={0.5} unit=" kg" />

        <SegmentedPicker
          label="Gender"
          selected={gender}
          onSelect={setGender}
          options={["Male", "Female", "Other"]}
        />

        <View style={styles.inputWrap}>
          <View style={[styles.labelRow, { marginBottom: 0 }]}>
            <Text style={styles.inputLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ false: "#cbd5e1", true: "#4c6fff" }}
              thumbColor={Platform.OS === "ios" ? undefined : notificationsEnabled ? "#ffffff" : "#f4f3f4"}
            />
          </View>
          <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Reminders and push notifications for your health goals.
          </Text>
        </View>

        <View style={{ height: 10 }} />
        <ActionButton title="Save Profile" onPress={save} />
        <View style={{ height: 10 }} />
        <ActionButton title="Send Test Push" onPress={sendPush} variant="secondary" />
        <View style={{ height: 10 }} />
        <ActionButton title="Logout" onPress={onLogout} variant="danger" />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AdminScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);

  const load = async () => {
    try {
      setUsers(await api.getAdminUsers());
    } catch {
      Alert.alert("Access denied", "Admin users endpoint is available only for Admin role.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView style={styles.screen}>
        <Text style={styles.title}>Admin Users</Text>
        <ActionButton title="Refresh Users" onPress={load} />
        <View style={{ height: 12 }} />
        {users.map((u) => (
          <Text key={String(u.id)} style={styles.card}>
            #{u.id} {u.fullName} ({u.role}) - {u.email}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}



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

  const registerNotifications = async (): Promise<{ token: string; error?: string }> => {
    try {
      if (!notificationsEnabled) {
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
  };

  const ensurePushReady = async () => {
    const { token, error } = await registerNotifications();
    if (!token) {
      if (!notificationsEnabled) {
        // Try to unregister if possible, though we might not have a fresh token
        // Usually we'd store the last known token in AsyncStorage
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
  };

  useEffect(() => {
    const bootstrap = async () => {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Session;
        api.setToken(parsed.token);
        setSession(parsed);
      }
      setLoading(false);
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const syncDeviceToken = async () => {
      if (!session) {
        return;
      }
      await ensurePushReady();
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
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuthenticated={setAuthenticated} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main">
            {(props) => (
              <Tabs.Navigator
                screenOptions={({ route }) => ({
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
                {session.role === "Admin" ? <Tabs.Screen name="Admin" component={AdminScreen} /> : null}
                <Tabs.Screen name="Profile">
                  {(p) => (
                    <ProfileScreen
                      {...p}
                      onLogout={logout}
                      onEnsurePushReady={ensurePushReady}
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

const styles = StyleSheet.create({
  authSafeArea: {
    flex: 1,
    backgroundColor: "#eef3ff",
  },
  authWrapper: {
    flex: 1,
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  authCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbe5ff",
    padding: 18,
    shadowColor: "#2948a5",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: "#eef3ff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    color: "#243b7e",
  },
  subtitle: {
    fontSize: 14,
    color: "#6073a1",
    marginBottom: 12,
  },
  inputWrap: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4d6090",
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccd9ff",
    backgroundColor: "#fdfdff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe8ff",
    padding: 12,
    marginBottom: 8,
    shadowColor: "#3d57a0",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricCard: {
    width: "48.5%",
    minHeight: 108,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dfe8ff",
    padding: 12,
    marginBottom: 10,
    shadowColor: "#3d57a0",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  metricCardActive: {
    borderColor: "#4c6fff",
    backgroundColor: "#f2f6ff",
  },
  metricTitle: {
    fontSize: 13,
    color: "#5f73a5",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#243b7e",
  },
  metricHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#6073a1",
    lineHeight: 17,
  },
  buttonBase: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#203a86",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: "#4c6fff",
  },
  buttonSecondary: {
    backgroundColor: "#e8eeff",
    borderWidth: 1,
    borderColor: "#cdd9ff",
  },
  buttonDanger: {
    backgroundColor: "#cc4a6a",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttonTextPrimary: {
    color: "#ffffff",
  },
  buttonTextSecondary: {
    color: "#334a8a",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tooltip: {
    backgroundColor: "#4c6fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tooltipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    padding: 2,
    marginBottom: 12,
  },
  segmentedItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentedItemActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  segmentedTextActive: {
    color: "#4c6fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 20,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "flex-end",
  },
  grid2x2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  miniChartCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 4,
    shadowColor: "#2948a5",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eef2ff",
  },
  miniChartHeader: {
    marginBottom: 4,
  },
  miniChartTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  todayIndicator: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  todayValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#243b7e",
  },
  todayUnit: {
    fontSize: 10,
    color: "#94a3b8",
    marginLeft: 2,
    fontWeight: "600",
  },
  chartSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#243b7e",
    marginBottom: 10,
    marginLeft: 4,
  },
});
