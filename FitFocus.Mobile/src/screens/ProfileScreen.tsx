import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Alert, TextInput, Switch, Platform, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, Profile } from "../api";
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
  showAdminEntry?: boolean;
  onOpenAdmin?: () => void;
  onProfileSaved?: (fullName: string) => void;
}

interface ProfileDraft {
  fullName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  heightCm: number;
  weightKg: number;
  gender: string;
}

const buildDraft = (profile: Profile): ProfileDraft => {
  const draft: ProfileDraft = {
    fullName: profile.fullName ?? "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    heightCm: profile.heightCm != null ? Number(profile.heightCm) : 170,
    weightKg: profile.weightKg != null ? Number(profile.weightKg) : 70,
    gender: profile.gender ?? "Other",
  };

  if (profile.dateOfBirth?.includes("-")) {
    const [year, month, day] = profile.dateOfBirth.split("-");
    draft.dobYear = year;
    draft.dobMonth = month;
    draft.dobDay = day;
  }

  return draft;
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) {
    return "Not set";
  }

  const [year, month, day] = value.split("-");
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }

  return value;
};

const formatMetric = (value: number | null | undefined, unit: string) => {
  if (value == null) {
    return "Not set";
  }

  return `${value}${unit}`;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onEnsurePushReady,
  notificationsEnabled,
  onToggleNotifications,
  showAdminEntry = false,
  onOpenAdmin,
  onProfileSaved,
}) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({
    fullName: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    heightCm: 170,
    weightKg: 70,
    gender: "Other",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const nextProfile = await api.getProfile();
      setProfile(nextProfile);
      setDraft(buildDraft(nextProfile));
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not load profile.", { apiBaseUrl: api.getBaseUrl() }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startEditing = () => {
    if (!profile) {
      return;
    }

    setDraft(buildDraft(profile));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (profile) {
      setDraft(buildDraft(profile));
    }
    setIsEditing(false);
  };

  const save = async () => {
    if (!draft.fullName.trim()) {
      Alert.alert("Missing name", "Full name is required.");
      return;
    }

    const hasAnyDobValue = Boolean(draft.dobDay || draft.dobMonth || draft.dobYear);
    const hasFullDobValue = Boolean(draft.dobDay && draft.dobMonth && draft.dobYear);

    if (hasAnyDobValue && !hasFullDobValue) {
      Alert.alert("Incomplete date", "Fill day, month, and year together or leave the date of birth empty.");
      return;
    }

    try {
      setSaving(true);
      const formattedDob = hasFullDobValue
        ? `${draft.dobYear}-${draft.dobMonth.padStart(2, "0")}-${draft.dobDay.padStart(2, "0")}`
        : null;

      await api.updateProfile({
        fullName: draft.fullName.trim(),
        dateOfBirth: formattedDob,
        heightCm: draft.heightCm,
        weightKg: draft.weightKg,
        gender: draft.gender || null,
      });

      if (profile) {
        const updatedProfile: Profile = {
          ...profile,
          fullName: draft.fullName.trim(),
          dateOfBirth: formattedDob,
          heightCm: draft.heightCm,
          weightKg: draft.weightKg,
          gender: draft.gender || null,
        };
        setProfile(updatedProfile);
        setDraft(buildDraft(updatedProfile));
        onProfileSaved?.(updatedProfile.fullName);
      }

      setIsEditing(false);
      Alert.alert("Saved", "Profile updated.");
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not update profile.", { apiBaseUrl: api.getBaseUrl() }));
    } finally {
      setSaving(false);
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
      Alert.alert("Push error", extractErrorMessage(error, "Could not send test push.", { apiBaseUrl: api.getBaseUrl() }));
    }
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
        <Text style={globalStyles.title}>Profile</Text>
        <View style={{ height: 12 }} />
        {loading || !profile ? (
          <View style={globalStyles.sectionCard}>
            <ActivityIndicator size="small" color="#4c6fff" />
            <Text style={globalStyles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            <View style={globalStyles.profileHeroCard}>
              <View style={globalStyles.profileHeroTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={globalStyles.profileName}>{profile.fullName}</Text>
                  <Text style={globalStyles.profileEmail}>{profile.email}</Text>
                </View>
                <View
                  style={[
                    globalStyles.roleBadge,
                    profile.role === "Admin" ? globalStyles.roleBadgeAdmin : globalStyles.roleBadgeUser,
                  ]}
                >
                  <Text
                    style={[
                      globalStyles.roleBadgeText,
                      profile.role === "Admin" ? globalStyles.roleBadgeTextAdmin : null,
                    ]}
                  >
                    {profile.role}
                  </Text>
                </View>
              </View>
              {showAdminEntry && onOpenAdmin ? (
                <ActionButton
                  title="Admin Panel"
                  onPress={onOpenAdmin}
                  variant="secondary"
                  style={{ width: "100%", marginTop: 2 }}
                />
              ) : null}
            </View>

            <View style={globalStyles.sectionCard}>
              <View style={globalStyles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={globalStyles.sectionTitle}>Personal Details</Text>
                </View>
                {!isEditing ? (
                  <Pressable onPress={startEditing} style={globalStyles.inlinePillAction}>
                    <Text style={globalStyles.inlinePillActionText}>Edit Profile</Text>
                  </Pressable>
                ) : null}
              </View>

              {isEditing ? (
                <>
                  <InputField
                    label="Full Name"
                    value={draft.fullName}
                    onChangeText={(value) => setDraft((current) => ({ ...current, fullName: value }))}
                    placeholder="Your name"
                  />

                  <View style={globalStyles.inputWrap}>
                    <Text style={globalStyles.inputLabel}>Date of Birth</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <View style={{ width: "30%" }}>
                        <TextInput
                          style={globalStyles.input}
                          value={draft.dobDay}
                          onChangeText={(value) => setDraft((current) => ({ ...current, dobDay: value }))}
                          placeholder="Day"
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={{ width: "30%" }}>
                        <TextInput
                          style={globalStyles.input}
                          value={draft.dobMonth}
                          onChangeText={(value) => setDraft((current) => ({ ...current, dobMonth: value }))}
                          placeholder="Month"
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={{ width: "35%" }}>
                        <TextInput
                          style={globalStyles.input}
                          value={draft.dobYear}
                          onChangeText={(value) => setDraft((current) => ({ ...current, dobYear: value }))}
                          placeholder="Year"
                          keyboardType="numeric"
                          maxLength={4}
                        />
                      </View>
                    </View>
                  </View>

                  <SliderInput
                    label="Height"
                    value={draft.heightCm}
                    onValueChange={(value) => setDraft((current) => ({ ...current, heightCm: value }))}
                    min={100}
                    max={250}
                    unit=" cm"
                  />
                  <SliderInput
                    label="Weight"
                    value={draft.weightKg}
                    onValueChange={(value) => setDraft((current) => ({ ...current, weightKg: value }))}
                    min={30}
                    max={200}
                    step={0.5}
                    unit=" kg"
                  />
                  <SegmentedPicker
                    label="Gender"
                    selected={draft.gender}
                    onSelect={(value) => setDraft((current) => ({ ...current, gender: value }))}
                    options={["Male", "Female", "Other"]}
                  />

                  <View style={globalStyles.buttonRow}>
                    <ActionButton
                      title={saving ? "Saving..." : "Save Changes"}
                      onPress={save}
                      disabled={saving}
                      style={globalStyles.halfButton}
                    />
                    <ActionButton title="Cancel" onPress={cancelEditing} variant="secondary" style={globalStyles.halfButton} />
                  </View>
                </>
              ) : (
                <>
                  <View style={globalStyles.detailRow}>
                    <Text style={globalStyles.detailLabel}>Full name</Text>
                    <Text style={globalStyles.detailValue}>{profile.fullName}</Text>
                  </View>
                  <View style={globalStyles.detailRow}>
                    <Text style={globalStyles.detailLabel}>Date of birth</Text>
                    <Text style={globalStyles.detailValue}>{formatDisplayDate(profile.dateOfBirth)}</Text>
                  </View>
                  <View style={globalStyles.detailRow}>
                    <Text style={globalStyles.detailLabel}>Height</Text>
                    <Text style={globalStyles.detailValue}>{formatMetric(profile.heightCm, " cm")}</Text>
                  </View>
                  <View style={globalStyles.detailRow}>
                    <Text style={globalStyles.detailLabel}>Weight</Text>
                    <Text style={globalStyles.detailValue}>{formatMetric(profile.weightKg, " kg")}</Text>
                  </View>
                  <View style={globalStyles.detailRow}>
                    <Text style={globalStyles.detailLabel}>Gender</Text>
                    <Text style={globalStyles.detailValue}>{profile.gender || "Not set"}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={globalStyles.sectionCard}>
              <Text style={globalStyles.sectionTitle}>Preferences</Text>

              <View style={globalStyles.preferenceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={globalStyles.inputLabel}>Enable Notifications</Text>
                  <Text style={globalStyles.preferenceHint}>Medication reminders and push tests depend on this switch.</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={onToggleNotifications}
                  trackColor={{ false: "#cbd5e1", true: COLORS.primary }}
                  thumbColor={Platform.OS === "ios" ? undefined : notificationsEnabled ? COLORS.white : "#f4f3f4"}
                />
              </View>

              <View style={{ height: 12 }} />
              <ActionButton title="Send Test Push" onPress={sendPush} variant="secondary" />
              <View style={{ height: 10 }} />
              <ActionButton title="Logout" onPress={onLogout} variant="danger" />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};
