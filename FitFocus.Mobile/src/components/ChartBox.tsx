import React, { useState } from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { globalStyles } from "../styles/globalStyles";
import { COLORS, SPACING } from "../styles/theme";

const miniChartConfig = {
  backgroundColor: "transparent",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#ffffff",
  backgroundGradientToOpacity: 0,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(76, 111, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  propsForDots: { r: "3", strokeWidth: "1", stroke: "#fff" },
  propsForBackgroundLines: { strokeWidth: 0.5, stroke: "#e2e8f0" },
  propsForLabels: { fontSize: 9 },
};

interface ChartBoxProps {
  title?: string;
  data: any;
  value: string | number;
  unit: string;
  color: string;
  chartWidth?: number;
  chartHeight?: number;
  compact?: boolean;
  todayDayLabel?: string;
}

export const ChartBox: React.FC<ChartBoxProps> = ({
  title,
  data,
  value,
  unit,
  color,
  chartWidth,
  chartHeight = 160,
  compact = false,
  todayDayLabel,
}) => {
  const [selected, setSelected] = useState<{ val: number | string; day: string } | null>(null);

  const chartConfig = {
    ...miniChartConfig,
    color: (opacity = 1) => `${color}${opacity})`,
    propsForDots: compact ? { ...miniChartConfig.propsForDots, r: "2.5" } : miniChartConfig.propsForDots,
    propsForLabels: compact ? { fontSize: 8 } : miniChartConfig.propsForLabels,
  };

  const resolvedChartWidth = Math.max(chartWidth ?? Dimensions.get("window").width - 56, compact ? 132 : 180);

  const handlePointClick = (pointData: any) => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    setSelected({
      val: pointData.value,
      day: dayNames[pointData.index],
    });
  };

  return (
    <View style={[globalStyles.miniChartCard, compact && { padding: SPACING.md, marginBottom: 0 }]}>
      <View style={[globalStyles.miniChartHeader, compact && { marginBottom: SPACING.xs }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: SPACING.sm, flexWrap: "wrap" }}>
          <View>
            <View style={{ gap: SPACING.xs }}>
              <View style={globalStyles.todayIndicator}>
                <Text style={globalStyles.todayValue}>{value}</Text>
                <Text style={globalStyles.todayUnit}>{unit} (Today)</Text>
              </View>
              {todayDayLabel && (
                <View style={{ alignSelf: "flex-start", backgroundColor: "#e0e7ff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: COLORS.primary }}>Today: {todayDayLabel}</Text>
                </View>
              )}
            </View>
          </View>

          {selected && (
            <View
              style={{
                alignItems: compact ? "flex-start" : "flex-end",
                backgroundColor: "#f8fafc",
                padding: compact ? 6 : 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Text style={{ fontSize: 10, color: COLORS.textSub, fontWeight: "600" }}>{selected.day}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.textHeader }}>{selected.val}{unit}</Text>
            </View>
          )}
        </View>
      </View>
      {data ? (
        <LineChart
          data={data}
          width={resolvedChartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          withDots={true}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
          onDataPointClick={handlePointClick}
          style={{ paddingRight: compact ? 18 : 40, paddingLeft: 0, marginTop: compact ? 4 : 8, borderRadius: 12 }}
        />
      ) : (
        <View style={{ height: 80, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: COLORS.textMuted }}>No data</Text>
        </View>
      )}
    </View>
  );
};
