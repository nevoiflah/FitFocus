import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, Reminder } from "../api";
import { InputField } from "../components/InputField";
import { ActionButton } from "../components/ActionButton";
import { globalStyles } from "../styles/globalStyles";
import { scheduleLocalReminder } from "../utils/notificationUtils";
import { extractErrorMessage } from "../utils/errorUtils";

interface RemindersScreenProps {
  notificationsEnabled: boolean;
}

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ notificationsEnabled }) => {
  const insets = useSafeAreaInsets();
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
    } catch (error: any) {
      Alert.alert("Error", extractErrorMessage(error, "Could not save reminder."));
    }
  };

  return (
    <View style={globalStyles.screen}>
      <ScrollView 
        style={globalStyles.screen} 
        contentContainerStyle={[globalStyles.screenContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom }]}
      >
        <Text style={globalStyles.title}>Reminders</Text>
        <InputField label="Medication Name" value={medicationName} onChangeText={setMedicationName} placeholder="e.g. Vitamin D" />
        <InputField label="Dosage" value={dosage} onChangeText={setDosage} placeholder="e.g. 1 pill" />
        <InputField label="Reminder Time" value={time} onChangeText={setTime} placeholder="HH:mm" />
        <ActionButton title="Add Reminder" onPress={createReminder} />
        <View style={{ height: 12 }} />
        {items.map((r) => (
          <View key={String(r.id)} style={globalStyles.card}>
            <Text style={{ fontWeight: "600", color: "#243b7e" }}>
              {r.reminderTime?.slice(0, 5)} - {r.medicationName}
            </Text>
            <Text style={{ fontSize: 13, color: "#64748b" }}>{r.dosage}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
