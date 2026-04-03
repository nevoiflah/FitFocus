import React from "react";
import { View, Text, Pressable } from "react-native";
import { globalStyles } from "../styles/globalStyles";

interface SegmentedPickerProps {
  label: string;
  selected: string;
  onSelect: (value: string) => void;
  options: string[];
}

export const SegmentedPicker: React.FC<SegmentedPickerProps> = ({
  label,
  selected,
  onSelect,
  options,
}) => {
  return (
    <View style={globalStyles.inputWrap}>
      <Text style={globalStyles.inputLabel}>{label}</Text>
      <View style={globalStyles.segmentedContainer}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              globalStyles.segmentedItem, 
              selected === opt ? globalStyles.segmentedItemActive : null
            ]}
          >
            <Text
              style={[
                globalStyles.segmentedText, 
                selected === opt ? globalStyles.segmentedTextActive : null
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
