import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { ActionButton } from "../components/ActionButton";
import { InputField } from "../components/InputField";
import { globalStyles } from "../styles/globalStyles";
import { extractErrorMessage } from "../utils/errorUtils";
import { Session } from "../types";

interface AuthScreenProps {
  onAuthenticated: (s: Session) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
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
      Alert.alert(
        "Authentication failed",
        extractErrorMessage(error, "Try again.", {
          apiBaseUrl: api.getBaseUrl(),
          offlineHint:
            "Cannot reach server. Make sure FitFocus.Api is running and phone+computer are on the same network.",
        })
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.authSafeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={globalStyles.authScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={globalStyles.authCard}>
            <Text style={globalStyles.title}>FitFocus</Text>
            <Text style={globalStyles.subtitle}>Personal health and risk tracking</Text>
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
};
