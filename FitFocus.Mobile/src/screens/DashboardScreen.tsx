import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, Text, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, DailyLog } from "../api";
import { ChartBox } from "../components/ChartBox";
import { globalStyles } from "../styles/globalStyles";
import { SPACING } from "../styles/theme";
import { addDays, formatLocalDate, getTodayLocalDate, startOfLocalWeek } from "../utils/dateUtils";

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [busy, setBusy] = useState(false);

  const fetchData = async () => {
    try {
      setBusy(true);
      const sun = startOfLocalWeek(new Date());
      const sat = addDays(sun, 6);
      const from = formatLocalDate(sun);
      const to = formatLocalDate(sat);

      const historyData = await api.getDailyLogRange(from, to);

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

  const today = useMemo(() => getTodayLocalDate(), []);
  const todayData = useMemo(() => {
    return history.find((h) => h.logDate === today);
  }, [history, today]);
  const gridContentWidth = useMemo(() => Math.min(width - SPACING.lg * 2, 760), [width]);
  const chartColumnWidth = useMemo(() => Math.min(gridContentWidth, 620), [gridContentWidth]);
  const chartWidth = Math.max(260, chartColumnWidth - SPACING.lg * 2 - 18);
  const contentMinHeight = Math.max(0, height - insets.top - insets.bottom - SPACING.lg * 2);
  const weekDays = useMemo(() => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], []);
  const todayDayLabel = useMemo(() => weekDays[new Date().getDay()], [weekDays]);
  const weekEntries = useMemo(() => {
    const sun = startOfLocalWeek(new Date());

    return weekDays.map((dayLabel, index) => {
      const logDate = formatLocalDate(addDays(sun, index));
      const entry = history.find((item) => item.logDate === logDate);
      return {
        dayLabel,
        logDate,
        symptoms: entry?.symptoms?.trim() ?? "",
        notes: entry?.notes?.trim() ?? "",
        hasLog: Boolean(entry),
        isToday: logDate === today,
      };
    });
  }, [history, today, weekDays]);

  const getChartData = (key: keyof DailyLog, color: string) => {
    const labels = ["S", "M", "T", "W", "T", "F", "S"];
    const sun = startOfLocalWeek(new Date());

    const weeklyData = labels.map((_, i) => {
      const dStr = formatLocalDate(addDays(sun, i));
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

  const chartCards = [
    {
      key: "mood",
      title: "Mood",
      value: todayData?.moodScore ?? "-",
      unit: "/10",
      data: getChartData("moodScore", "rgba(76, 111, 255, "),
      color: "rgba(76, 111, 255, ",
    },
    {
      key: "sleep",
      title: "Sleep",
      value: todayData?.sleepHours ?? "-",
      unit: "h",
      data: getChartData("sleepHours", "rgba(16, 185, 129, "),
      color: "rgba(16, 185, 129, ",
    },
    {
      key: "stress",
      title: "Stress",
      value: todayData?.stressScore ?? "-",
      unit: "/10",
      data: getChartData("stressScore", "rgba(244, 63, 94, "),
      color: "rgba(244, 63, 94, ",
    },
    {
      key: "water",
      title: "Water",
      value: todayData?.waterLiters ? Number(todayData.waterLiters).toFixed(1) : "-",
      unit: "L",
      data: getChartData("waterLiters", "rgba(6, 182, 212, "),
      color: "rgba(6, 182, 212, ",
    },
  ];
  const textCards = [
    {
      key: "symptoms",
      title: "Symptoms This Week",
      emptyLabel: "No symptoms added",
      getValue: (entry: (typeof weekEntries)[number]) => entry.symptoms,
    },
    {
      key: "notes",
      title: "Notes This Week",
      emptyLabel: "No notes added",
      getValue: (entry: (typeof weekEntries)[number]) => entry.notes,
    },
  ];

  return (
    <View style={globalStyles.screen}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={[
          globalStyles.screenContent,
          { flexGrow: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + SPACING.xl },
        ]}
      >
        <View
          style={{
            minHeight: contentMinHeight,
            justifyContent: "center",
          }}
        >
          <View style={{ width: "100%", maxWidth: gridContentWidth, alignSelf: "center" }}>
            <Text style={[globalStyles.title, { marginBottom: 0 }]}>Dashboard</Text>
            {busy && <ActivityIndicator style={{ marginTop: 12, marginBottom: 4 }} />}

            <View
              style={{
                marginTop: 22,
                width: chartColumnWidth,
                alignSelf: "center",
                gap: 18,
              }}
            >
              {chartCards.map((chart) => (
                <View key={chart.key} style={{ width: "100%" }}>
                  <Text style={[globalStyles.chartSectionTitle, { fontSize: 16, marginBottom: 6, marginLeft: 2 }]}>
                    {chart.title}
                  </Text>
                  <ChartBox
                    value={chart.value}
                    unit={chart.unit}
                    data={chart.data}
                    color={chart.color}
                    chartWidth={chartWidth}
                    chartHeight={170}
                    todayDayLabel={todayDayLabel}
                  />
                </View>
              ))}
            </View>

            <View style={{ marginTop: 28, gap: 16 }}>
              {textCards.map((card) => (
                <View key={card.key}>
                  <Text style={[globalStyles.chartSectionTitle, { fontSize: 17, marginBottom: 8, marginLeft: 2 }]}>
                    {card.title}
                  </Text>
                  <View style={globalStyles.weeklyTextCard}>
                    {weekEntries.map((entry, index) => {
                      const value = card.getValue(entry);
                      const displayText = value || (entry.hasLog ? card.emptyLabel : "No daily log");

                      return (
                        <View
                          key={`${card.key}-${entry.logDate}`}
                          style={[
                            globalStyles.weeklyTextRow,
                            index === weekEntries.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 },
                            index === 0 && { paddingTop: 0 },
                          ]}
                        >
                          <View style={globalStyles.weeklyTextDayRow}>
                            <Text style={globalStyles.weeklyTextDay}>{entry.dayLabel}</Text>
                            {entry.isToday && <Text style={globalStyles.weeklyTextTodayBadge}>Today</Text>}
                          </View>
                          <Text style={[globalStyles.weeklyTextBody, !value && globalStyles.weeklyTextMuted]}>
                            {displayText}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};
