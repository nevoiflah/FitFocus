import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, Text, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, DashboardSummary, DailyLog } from "../api";
import { ChartBox } from "../components/ChartBox";
import { ActionButton } from "../components/ActionButton";
import { globalStyles } from "../styles/globalStyles";

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [busy, setBusy] = useState(false);

  const fetchData = async () => {
    try {
      setBusy(true);
      const now = new Date();
      const currentDay = now.getDay();
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
      setHistory((historyData ?? []).sort((a, b) => a.logDate.localeCompare(b.logDate)));
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

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayData = useMemo(() => {
    return history.find((h) => h.logDate === today);
  }, [history, today]);

  const getChartData = (key: keyof DailyLog, color: string) => {
    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels = ["S", "M", "T", "W", "T", "F", "S"];
    const now = new Date();
    const sun = new Date(now);
    sun.setDate(now.getDate() - now.getDay());
    sun.setHours(0, 0, 0, 0);

    const weeklyData = daysArr.map((_, i) => {
      const d = new Date(sun);
      d.setDate(sun.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);
      const entry = history.find((h) => h.logDate === dStr);
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
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={[
          globalStyles.screenContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={globalStyles.title}>Dashboard</Text>
        {busy && <ActivityIndicator style={{ marginBottom: 10 }} />}

        <View style={{ gap: 24 }}>
          <View>
            <Text style={globalStyles.chartSectionTitle}>Mood</Text>
            <ChartBox
              value={todayData?.moodScore ?? "-"}
              unit="/10"
              data={getChartData("moodScore", "rgba(76, 111, 255, ")}
              color="rgba(76, 111, 255, "
            />
          </View>
          <View>
            <Text style={globalStyles.chartSectionTitle}>Sleep</Text>
            <ChartBox
              value={todayData?.sleepHours ?? "-"}
              unit="h"
              data={getChartData("sleepHours", "rgba(16, 185, 129, ")}
              color="rgba(16, 185, 129, "
            />
          </View>
          <View>
            <Text style={globalStyles.chartSectionTitle}>Stress</Text>
            <ChartBox
              value={todayData?.stressScore ?? "-"}
              unit="/10"
              data={getChartData("stressScore", "rgba(244, 63, 94, ")}
              color="rgba(244, 63, 94, "
            />
          </View>
          <View>
            <Text style={globalStyles.chartSectionTitle}>Water</Text>
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
      </ScrollView>
    </View>
  );
};
