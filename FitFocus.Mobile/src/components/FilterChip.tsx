import React from "react";
import { Pressable, Text } from "react-native";
import { globalStyles } from "../styles/globalStyles";

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[globalStyles.chip, active ? globalStyles.chipActive : null]}
    >
      <Text style={[globalStyles.chipText, active ? globalStyles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
};
