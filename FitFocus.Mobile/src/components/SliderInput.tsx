import React from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";

interface SliderInputProps {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit = "",
}) => {
  return (
    <View style={globalStyles.inputWrap}>
      <View style={globalStyles.labelRow}>
        <Text style={globalStyles.inputLabel}>{label}</Text>
        <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
          {step < 1 ? value.toFixed(1) : value}
          {unit}
        </Text>
      </View>
      <Slider
        style={{ width: "100%", height: 40 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor="#cbd5e1"
        thumbTintColor={COLORS.primary}
      />
    </View>
  );
};
