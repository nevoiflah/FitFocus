import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Alert, TextInput, Switch, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api";
import { InputField } from "../components/InputField";
import { SliderInput } from "../components/SliderInput";
import { SegmentedPicker } from "../components/SegmentedPicker";
import { ActionButton } from "../components/ActionButton";
import { globalStyles } from "../styles/globalStyles";
import { extractErrorMessage } from "../utils/errorUtils";
import { COLORS } from "../styles/theme";

interface ProfileScreenProps {
  onLogout: () => void;
  onEnsurePushReady: () => Promise<{ ok: boolean; message?: string }>;
  notificationsEnabled: boolean;
  onToggleNotifications: (v: boolean) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onEnsurePushReady,
  notificationsEnabled,
  onToggleNotifications,
}) => {
  const insets = useSafeAreaInsets();
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
      const dob = profile.dateOfBirth || "";
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
        dobYear && dobMonth && dobDay 
          ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}` 
          : null;

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
    <View style={globalStyles.screen}>
      <ScrollView 
        style={globalStyles.screen} 
        contentContainerStyle={[globalStyles.screenContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom }]}
      >
        <Text style={globalStyles.title}>Profile</Text>
        <Text style={globalStyles.subtitle}>Your personal information</Text>

        <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your name" />

        <View style={globalStyles.inputWrap}>
          <Text style={globalStyles.inputLabel}>Date of Birth</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: "30%" }}>
              <TextInput
                style={globalStyles.input}
                value={dobDay}
                onChangeText={setDobDay}
                placeholder="Day"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={{ width: "30%" }}>
              <TextInput
                style={globalStyles.input}
                value={dobMonth}
                onChangeText={setDobMonth}
                placeholder="Month"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={{ width: "35%" }}>
              <TextInput
                style={globalStyles.input}
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

        <View style={globalStyles.inputWrap}>
          <View style={[globalStyles.labelRow, { marginBottom: 0 }]}>
            <Text style={globalStyles.inputLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ false: "#cbd5e1", true: COLORS.primary }}
              thumbColor={Platform.OS === "ios" ? undefined : notificationsEnabled ? COLORS.white : "#f4f3f4"}
            />
          </View>
          <Text style={{ fontSize: 12, color: COLORS.textSub, marginTop: 4 }}>
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
    </View>
  );
};
