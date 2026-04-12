import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Alert, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api, Reminder } from "../api";
import { InputField } from "../components/InputField";
import { ActionButton } from "../components/ActionButton";
import { globalStyles } from "../styles/globalStyles";
import { scheduleLocalReminder, cancelLocalReminder } from "../utils/notificationUtils";
import { extractErrorMessage } from "../utils/errorUtils";

interface RemindersScreenProps {
  notificationsEnabled: boolean;
}

const isValidTime = (value: string) => {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return false;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ notificationsEnabled }) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("08:00");

  const load = async () => {
    try {
      setLoading(true);
      setItems(await api.getReminders());
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not load reminders.", { apiBaseUrl: api.getBaseUrl() }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createReminder = async () => {
    if (!medicationName.trim() || !dosage.trim()) {
      Alert.alert("Missing", "Medication and dosage are required.");
      return;
    }

    if (!isValidTime(time)) {
      Alert.alert("Invalid time", "Use the 24-hour format HH:mm, for example 08:30.");
      return;
    }

    try {
      setSubmitting(true);
      const created = await api.createReminder({
        medicationName: medicationName.trim(),
        dosage: dosage.trim(),
        reminderTime: `${time}:00`,
        isActive: true,
      });

      await scheduleLocalReminder(
        created.id,
        "FitFocus Medication Reminder",
        `${medicationName.trim()} - ${dosage.trim()}`,
        time,
        notificationsEnabled,
      );

      setMedicationName("");
      setDosage("");
      await load();
    } catch (error: any) {
      Alert.alert("Error", extractErrorMessage(error, "Could not save reminder.", { apiBaseUrl: api.getBaseUrl() }));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (reminder: Reminder) => {
    try {
      setDeletingId(reminder.id);
      await api.deleteReminder(reminder.id);
      await cancelLocalReminder(reminder.id);
      setItems((current) => current.filter((item) => item.id !== reminder.id));
    } catch (error: any) {
      Alert.alert("Error", extractErrorMessage(error, "Could not delete reminder.", { apiBaseUrl: api.getBaseUrl() }));
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (reminder: Reminder) => {
    Alert.alert(
      "Delete reminder",
      `Delete the ${reminder.medicationName} reminder at ${reminder.reminderTime.slice(0, 5)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteReminder(reminder);
          },
        },
      ],
    );
  };

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={[
          globalStyles.screenContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={globalStyles.title}>Reminders</Text>
        <View style={[globalStyles.sectionCard, { marginTop: 12 }]}>
          <Text style={globalStyles.sectionTitle}>Add a reminder</Text>
          <InputField label="Medication Name" value={medicationName} onChangeText={setMedicationName} placeholder="e.g. Vitamin D" />
          <InputField label="Dosage" value={dosage} onChangeText={setDosage} placeholder="e.g. 1 pill" />
          <InputField label="Reminder Time" value={time} onChangeText={setTime} placeholder="HH:mm" />
          <ActionButton title={submitting ? "Adding..." : "Add Reminder"} onPress={createReminder} disabled={submitting} />
        </View>

        <Text style={globalStyles.sectionLabel}>Saved reminders</Text>
        {loading ? (
          <View style={globalStyles.sectionCard}>
            <ActivityIndicator size="small" color="#4c6fff" />
            <Text style={globalStyles.loadingText}>Loading reminders...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={globalStyles.sectionCard}>
            <Text style={globalStyles.emptyStateText}>No reminders yet. Add one above to start receiving daily medication prompts.</Text>
          </View>
        ) : (
          items.map((reminder) => (
            <View key={String(reminder.id)} style={globalStyles.sectionCard}>
              <View style={globalStyles.listItemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={globalStyles.cardTitle}>{reminder.medicationName}</Text>
                  <Text style={globalStyles.cardMeta}>{reminder.dosage}</Text>
                </View>
                <View style={globalStyles.reminderActionColumn}>
                  <View style={globalStyles.reminderTimeBadge}>
                    <Text style={globalStyles.reminderTimeText}>{reminder.reminderTime.slice(0, 5)}</Text>
                  </View>
                  <Pressable
                    onPress={() => confirmDelete(reminder)}
                    disabled={deletingId === reminder.id}
                    style={globalStyles.reminderDeleteIconAction}
                  >
                    {deletingId === reminder.id ? (
                      <ActivityIndicator size="small" color="#cc4a6a" />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color="#cc4a6a" />
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};
