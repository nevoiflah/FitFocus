import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, Text, Alert, ActivityIndicator, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api, Meal } from "../api";
import { FilterChip } from "../components/FilterChip";
import { SegmentedPicker } from "../components/SegmentedPicker";
import { InputField } from "../components/InputField";
import { SliderInput } from "../components/SliderInput";
import { ActionButton } from "../components/ActionButton";
import { globalStyles } from "../styles/globalStyles";
import { extractErrorMessage } from "../utils/errorUtils";

export const MealsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [mealType, setMealType] = useState("Lunch");
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState(300);
  const [imageUrl, setImageUrl] = useState("");
  const [dailyLogId, setDailyLogId] = useState("");
  const [list, setList] = useState<Meal[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("Any");
  const [showDatePanel, setShowDatePanel] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadHistory = async () => {
    try {
      setBusy(true);
      const meals = await api.getMeals(
        filterDate || undefined,
        filterType === "Any" ? undefined : filterType
      );
      setList(meals);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const refreshAvailableDates = async () => {
    try {
      const all = await api.getMeals();
      const dates = [...new Set(all.map((m) => m.logDate))]
        .filter(Boolean)
        .sort()
        .reverse();
      setAvailableDates(dates);
    } catch (err) {
      console.log("Could not refresh dates", err);
    }
  };

  const autoFetchLogId = async () => {
    try {
      const log = await api.getDailyLog(today);
      if (log?.id) {
        setDailyLogId(String(log.id));
      }
    } catch {
      setDailyLogId("");
    }
  };

  useFocusEffect(
    useCallback(() => {
      autoFetchLogId();
      loadHistory();
      refreshAvailableDates();
    }, [today, filterDate, filterType])
  );

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "We need camera access to take meal photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].uri) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "We need gallery access to pick meal photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].uri) {
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
      let targetLogId = dailyLogId;
      if (!targetLogId) {
        try {
          const log = await api.getDailyLog(today);
          if (log?.id) {
            targetLogId = String(log.id);
            setDailyLogId(targetLogId);
          }
        } catch { }
      }

      await api.createMeal({
        mealType,
        mealName,
        calories: Number(calories),
        imageUrl: imageUrl || undefined,
        dailyLogId: targetLogId ? Number(targetLogId) : undefined,
        logDate: today,
      });
      Alert.alert("Saved", "Meal added.");
      setMealName("");
      setCalories(300);
      setImageUrl("");
      loadHistory();
      refreshAvailableDates();
    } catch (err) {
      Alert.alert("Error", extractErrorMessage(err, "Could not create meal."));
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
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={[
          globalStyles.screenContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={globalStyles.title}>Meals</Text>
        <Text style={globalStyles.subtitle}>Log what you ate today</Text>
        <View style={{ height: 16 }} />
        <SegmentedPicker
          label="Meal Type"
          selected={mealType}
          onSelect={setMealType}
          options={mealOptions}
        />
        <View style={{ height: 16 }} />
        <InputField
          label="What did you eat?"
          value={mealName}
          onChangeText={setMealName}
          placeholder="e.g. Grilled Chicken Salad"
        />
        <View style={{ height: 16 }} />
        <SliderInput
          label="Calories"
          value={calories}
          onValueChange={setCalories}
          min={0}
          max={2000}
          step={10}
          unit=" kcal"
        />
        <View style={{ height: 16 }} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ActionButton title="Take Photo" onPress={takePhoto} variant="secondary" />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton title="Gallery" onPress={pickFromGallery} variant="secondary" />
          </View>
        </View>
        {imageUrl ? (
          <View style={[globalStyles.card, { alignItems: "center", marginTop: 10 }]}>
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: 180, borderRadius: 12 }}
              resizeMode="cover"
            />
            <Pressable onPress={() => setImageUrl("")} style={{ marginTop: 8 }}>
              <Text style={{ color: "#cc4a6a", fontWeight: "600" }}>Remove Image</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={{ height: 16 }} />
        {busy ? <ActivityIndicator /> : <ActionButton title="Save Meal" onPress={submit} />}

        <View style={{ height: 48 }} />
        <Text style={globalStyles.title}>History Log</Text>
        <Text style={globalStyles.subtitle}>Filter and review your past meal entries</Text>
        <View style={{ height: 16 }} />

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#4d6090", marginBottom: 8, marginLeft: 2 }}>
            Filter by Date
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <FilterChip label="Any Date" active={!filterDate} onPress={() => setFilterDate("")} />
            <FilterChip label="Today" active={filterDate === today} onPress={() => setFilterDate(today)} />
            <Pressable
              style={[globalStyles.chip, showDatePanel ? globalStyles.chipActive : null]}
              onPress={() => setShowDatePanel((v) => !v)}
            >
              <Ionicons name="calendar-outline" size={16} color={showDatePanel ? "#fff" : "#64748b"} />
            </Pressable>
          </View>
          {showDatePanel && (
            <View style={{ marginTop: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
                {availableDates.length === 0 ? (
                  <Text style={{ fontSize: 13, color: "#94a3b8", paddingVertical: 8 }}>No entries found.</Text>
                ) : (
                  availableDates.map((d) => (
                    <FilterChip key={d} label={d} active={filterDate === d} onPress={() => setFilterDate(d)} />
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <SegmentedPicker
            label="Filter by Type"
            selected={filterType}
            onSelect={setFilterType}
            options={["Any", ...mealOptions]}
          />
        </View>

        {list.length === 0 ? (
          <View style={[globalStyles.card, { alignItems: "center", paddingVertical: 32 }]}>
            <Ionicons name="search-outline" size={32} color="#cbd5e1" />
            <Text style={{ marginTop: 8, color: "#94a3b8" }}>No meals found.</Text>
          </View>
        ) : (
          list.map((m) => (
            <View key={String(m.id)} style={[globalStyles.card, { flexDirection: "row", alignItems: "center" }]}>
              {m.imageUrl ? (
                <Image source={{ uri: m.imageUrl }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }} />
              ) : (
                <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name="fast-food-outline" size={24} color="#94a3b8" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontWeight: "700", color: "#243b7e" }}>{m.mealType}</Text>
                  <Text style={{ fontSize: 11, color: "#94a3b8" }}>{m.logDate}</Text>
                </View>
                <Text style={{ color: "#444" }}>{m.mealName}</Text>
                {m.calories ? <Text style={{ fontSize: 12, color: "#666" }}>{m.calories} kcal</Text> : null}
              </View>
              <Pressable onPress={() => deleteMeal(m.id)}>
                <Ionicons name="trash-outline" size={18} color="#cc4a6a" />
              </Pressable>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};
