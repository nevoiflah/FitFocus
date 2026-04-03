import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Text, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api";
import { SliderInput } from "../components/SliderInput";
import { InputField } from "../components/InputField";
import { ActionButton } from "../components/ActionButton";
import { globalStyles } from "../styles/globalStyles";
import { extractErrorMessage } from "../utils/errorUtils";

export const DailyLogScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
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
      if (log) {
        setMood(Math.min(10, Math.max(1, Math.round(Number(log.moodScore)))));
        setSleep(Math.min(24, Math.max(0, Math.round(Number(log.sleepHours)))));
        setStress(Math.min(10, Math.max(1, Math.round(Number(log.stressScore)))));
        setWater(Math.min(10, Math.max(0, Math.round(Number(log.waterLiters)))));
        setSymptoms(log.symptoms ?? "");
        setNotes(log.notes ?? "");
      }
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
      Alert.alert(
        "Could not save",
        extractErrorMessage(error, "If a log exists, edit support can be added next.")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={[
          globalStyles.screenContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={globalStyles.title}>Daily Log</Text>
        <Text style={globalStyles.subtitle}>{today}</Text>

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
    </View>
  );
};
