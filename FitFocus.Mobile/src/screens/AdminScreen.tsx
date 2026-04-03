import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, AdminUser } from "../api";
import { ActionButton } from "../components/ActionButton";
import { globalStyles } from "../styles/globalStyles";

export const AdminScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
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
    <View style={globalStyles.screen}>
      <ScrollView 
        style={globalStyles.screen} 
        contentContainerStyle={[globalStyles.screenContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom }]}
      >
        <Text style={globalStyles.title}>Admin Users</Text>
        <ActionButton title="Refresh Users" onPress={load} />
        <View style={{ height: 12 }} />
        {users.map((u) => (
          <View key={String(u.id)} style={globalStyles.card}>
            <Text style={{ fontWeight: "700", color: "#243b7e" }}>#{u.id} {u.fullName}</Text>
            <Text style={{ color: "#64748b" }}>{u.role} - {u.email}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
