import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, AdminUser } from "../api";
import { ActionButton } from "../components/ActionButton";
import { globalStyles } from "../styles/globalStyles";
import { extractErrorMessage } from "../utils/errorUtils";

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

const isProfileComplete = (user: AdminUser) => {
  return Boolean(user.dateOfBirth && user.heightCm != null && user.weightKg != null && user.gender);
};

export const AdminScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setUsers(await api.getAdminUsers());
    } catch (error) {
      Alert.alert("Admin error", extractErrorMessage(error, "Could not load admin data.", { apiBaseUrl: api.getBaseUrl() }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const adminCount = users.filter((user) => user.role === "Admin").length;
  const regularUserCount = users.length - adminCount;
  const completedProfiles = users.filter(isProfileComplete).length;

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={[
          globalStyles.screenContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={globalStyles.title}>Admin Panel</Text>
        <Text style={globalStyles.subtitle}>Review users, role distribution, and profile completion from a single admin-only screen.</Text>

        <View style={globalStyles.statsGrid}>
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statValue}>{users.length}</Text>
            <Text style={globalStyles.statLabel}>Total users</Text>
          </View>
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statValue}>{adminCount}</Text>
            <Text style={globalStyles.statLabel}>Admin accounts</Text>
          </View>
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statValue}>{regularUserCount}</Text>
            <Text style={globalStyles.statLabel}>Regular users</Text>
          </View>
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statValue}>{completedProfiles}</Text>
            <Text style={globalStyles.statLabel}>Profiles completed</Text>
          </View>
        </View>

        <ActionButton title={loading ? "Refreshing..." : "Refresh Users"} onPress={load} disabled={loading} />
        <View style={{ height: 16 }} />
        <Text style={globalStyles.sectionLabel}>User directory</Text>

        {loading ? (
          <View style={globalStyles.sectionCard}>
            <ActivityIndicator size="small" color="#4c6fff" />
            <Text style={globalStyles.loadingText}>Loading admin data...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={globalStyles.sectionCard}>
            <Text style={globalStyles.emptyStateText}>No users were returned from the admin endpoint.</Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={String(user.id)} style={globalStyles.sectionCard}>
              <View style={globalStyles.listItemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={globalStyles.cardTitle}>{user.fullName}</Text>
                  <Text style={globalStyles.cardMeta}>{user.email}</Text>
                  <Text style={globalStyles.cardMeta}>
                    Profile status: {isProfileComplete(user) ? "Complete" : "Partial"}
                  </Text>
                </View>
                <View
                  style={[
                    globalStyles.roleBadge,
                    user.role === "Admin" ? globalStyles.roleBadgeAdmin : globalStyles.roleBadgeUser,
                  ]}
                >
                  <Text
                    style={[
                      globalStyles.roleBadgeText,
                      user.role === "Admin" ? globalStyles.roleBadgeTextAdmin : null,
                    ]}
                  >
                    {user.role}
                  </Text>
                </View>
              </View>

              <View style={globalStyles.detailRow}>
                <Text style={globalStyles.detailLabel}>Date of birth</Text>
                <Text style={globalStyles.detailValue}>{formatDisplayDate(user.dateOfBirth)}</Text>
              </View>
              <View style={globalStyles.detailRow}>
                <Text style={globalStyles.detailLabel}>Height</Text>
                <Text style={globalStyles.detailValue}>{formatMetric(user.heightCm, " cm")}</Text>
              </View>
              <View style={globalStyles.detailRow}>
                <Text style={globalStyles.detailLabel}>Weight</Text>
                <Text style={globalStyles.detailValue}>{formatMetric(user.weightKg, " kg")}</Text>
              </View>
              <View style={globalStyles.detailRow}>
                <Text style={globalStyles.detailLabel}>Gender</Text>
                <Text style={globalStyles.detailValue}>{user.gender || "Not set"}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};
