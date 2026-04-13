import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, Text, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, DailyLog, Meal, Profile, DashboardSummary } from "../api";
import { ChartBox } from "../components/ChartBox";
import { globalStyles } from "../styles/globalStyles";
import { SPACING } from "../styles/theme";
import { addDays, formatLocalDate, getTodayLocalDate, startOfLocalWeek } from "../utils/dateUtils";
import { estimateDailyBurn } from "../utils/calorieUtils";

const CALORIE_INTAKE_COLOR = "rgba(245, 158, 11, ";
const CALORIE_BURN_COLOR = "rgba(15, 118, 110, ";

const getRiskTone = (level?: string) => {
  switch (level) {
    case "Critical":
      return {
        backgroundColor: "#fff1f2",
        borderColor: "#fecdd3",
        textColor: "#be123c",
        accentColor: "#e11d48",
      };
    case "High":
      return {
        backgroundColor: "#fff7ed",
        borderColor: "#fdba74",
        textColor: "#c2410c",
        accentColor: "#ea580c",
      };
    case "Medium":
      return {
        backgroundColor: "#fefce8",
        borderColor: "#fde68a",
        textColor: "#a16207",
        accentColor: "#ca8a04",
      };
    default:
      return {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
        textColor: "#047857",
        accentColor: "#059669",
      };
  }
};

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [weekMeals, setWeekMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [riskSummary, setRiskSummary] = useState<DashboardSummary | null>(null);
  const [riskSummaryMessage, setRiskSummaryMessage] = useState<string | null>(null);
  const [dashboardMessage, setDashboardMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchData = async () => {
    try {
      setBusy(true);
      setDashboardMessage(null);
      setRiskSummaryMessage(null);

      const sun = startOfLocalWeek(new Date());
      const sat = addDays(sun, 6);
      const from = formatLocalDate(sun);
      const to = formatLocalDate(sat);

      const [historyData, profileData] = await Promise.all([
        api.getDailyLogRange(from, to),
        api.getProfile(),
      ]);

      setHistory((historyData ?? []).sort((a, b) => a.logDate.localeCompare(b.logDate)));
      setProfile(profileData);

      try {
        const summaryData = await api.getDashboardSummary(7);
        setRiskSummary(summaryData);
      } catch {
        setRiskSummary(null);
        setRiskSummaryMessage("Risk summary is temporarily unavailable.");
      }

      try {
        const mealsData = await api.getMealsRange(from, to);
        setWeekMeals((mealsData ?? []).sort((a, b) => a.logDate.localeCompare(b.logDate)));
      } catch (err: any) {
        const status = err?.response?.status;

        if (status === 404 || status === 405) {
          const fallbackMeals = await api.getMeals();
          const filteredMeals = (fallbackMeals ?? []).filter((meal) => meal.logDate >= from && meal.logDate <= to);
          setWeekMeals(filteredMeals.sort((a, b) => a.logDate.localeCompare(b.logDate)));
        } else {
          setWeekMeals([]);
          setDashboardMessage((current) => current ?? "Meal data is temporarily unavailable.");
        }
      }
    } catch {
      setHistory([]);
      setWeekMeals([]);
      setProfile(null);
      setRiskSummary(null);
      setRiskSummaryMessage(null);
      setDashboardMessage("Dashboard data is temporarily unavailable. Reopen the page to try again.");
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
  const todayData = useMemo(() => history.find((h) => h.logDate === today), [history, today]);
  const gridContentWidth = useMemo(() => Math.min(width - SPACING.lg * 2, 760), [width]);
  const chartColumnWidth = useMemo(() => Math.min(gridContentWidth, 620), [gridContentWidth]);
  const chartWidth = Math.max(260, chartColumnWidth - SPACING.lg * 2 - 18);
  const weekDays = useMemo(() => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], []);
  const todayDayLabel = useMemo(() => weekDays[new Date().getDay()], [weekDays]);
  const riskTone = useMemo(() => getRiskTone(riskSummary?.riskLevel), [riskSummary?.riskLevel]);

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

  const calorieSummary = useMemo(() => {
    const sun = startOfLocalWeek(new Date());
    const labels = ["S", "M", "T", "W", "T", "F", "S"];
    const intakeData = labels.map((_, index) => {
      const logDate = formatLocalDate(addDays(sun, index));
      return weekMeals
        .filter((meal) => meal.logDate === logDate)
        .reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
    });

    const estimatedBurn = estimateDailyBurn(profile);
    const todayIndex = labels.findIndex((_, index) => formatLocalDate(addDays(sun, index)) === today);
    const todayIntake = todayIndex >= 0 ? intakeData[todayIndex] : 0;

    return {
      intakeData,
      estimatedBurn,
      todayIntake,
      data: {
        labels,
        datasets: [
          {
            data: intakeData,
            color: (opacity = 1) => `${CALORIE_INTAKE_COLOR}${opacity})`,
            strokeWidth: 2,
          },
          ...(estimatedBurn != null
            ? [
                {
                  data: labels.map(() => estimatedBurn),
                  color: (opacity = 1) => `${CALORIE_BURN_COLOR}${opacity})`,
                  strokeWidth: 2,
                },
              ]
            : []),
        ],
      },
    };
  }, [profile, today, weekMeals]);

  const chartCards = [
    {
      key: "calories",
      title: "Calories",
      value: calorieSummary.todayIntake,
      unit: "kcal",
      data: calorieSummary.data,
      color: CALORIE_INTAKE_COLOR,
      legendItems: [
        { label: "Intake", color: "#f59e0b" },
        ...(calorieSummary.estimatedBurn != null ? [{ label: "Estimated burn", color: "#0f766e" }] : []),
      ],
      bezier: false,
    },
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
      value: todayData?.waterLiters != null ? Number(todayData.waterLiters).toFixed(1) : "-",
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
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + SPACING.xl },
        ]}
      >
        <View style={{ width: "100%", maxWidth: gridContentWidth, alignSelf: "center" }}>
          <Text style={[globalStyles.title, { marginBottom: 0 }]}>Dashboard</Text>
          <Text style={[globalStyles.subtitle, { marginBottom: 0 }]}>Your week at a glance</Text>
          {busy && <ActivityIndicator style={{ marginTop: 12, marginBottom: 4 }} />}

          {dashboardMessage ? (
            <View style={[globalStyles.sectionCard, { marginTop: 18, marginBottom: 0 }]}>
              <Text style={globalStyles.sectionTitle}>Dashboard Notice</Text>
              <Text style={globalStyles.sectionDescription}>{dashboardMessage}</Text>
            </View>
          ) : null}

          {riskSummary ? (
            <View style={[globalStyles.sectionCard, { marginTop: 18, marginBottom: 0 }]}> 
              <View style={globalStyles.riskSummaryHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={globalStyles.sectionTitle}>Risk Summary</Text>
                  <Text style={globalStyles.sectionDescription}>
                    Based on sleep, mood, stress, hydration, and symptoms from the last {riskSummary.daysAnalyzed} days.
                  </Text>
                </View>
                <View
                  style={[
                    globalStyles.riskLevelBadge,
                    { backgroundColor: riskTone.backgroundColor, borderColor: riskTone.borderColor },
                  ]}
                >
                  <Text style={[globalStyles.riskLevelText, { color: riskTone.textColor }]}>{riskSummary.riskLevel}</Text>
                </View>
              </View>

              <View style={globalStyles.riskScoreRow}>
                <Text style={[globalStyles.riskScoreValue, { color: riskTone.accentColor }]}>
                  {Math.round(Number(riskSummary.riskScore) || 0)}
                </Text>
                <Text style={globalStyles.riskScoreUnit}>/100</Text>
              </View>

              <View style={globalStyles.riskSignalsList}>
                {riskSummary.riskSignals.length > 0 ? (
                  riskSummary.riskSignals.map((signal) => (
                    <View key={signal} style={globalStyles.riskSignalRow}>
                      <Text style={[globalStyles.riskSignalBullet, { color: riskTone.accentColor }]}>•</Text>
                      <Text style={globalStyles.riskSignalText}>{signal}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={globalStyles.riskSignalEmpty}>No major warning signals detected in the selected period.</Text>
                )}
              </View>
            </View>
          ) : riskSummaryMessage ? (
            <View style={[globalStyles.sectionCard, { marginTop: 18, marginBottom: 0 }]}> 
              <Text style={globalStyles.sectionTitle}>Risk Summary</Text>
              <Text style={globalStyles.sectionDescription}>{riskSummaryMessage}</Text>
            </View>
          ) : null}

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
                  legendItems={chart.legendItems}
                  bezier={chart.bezier}
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
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};
