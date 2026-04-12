import React from "react";
import { Pressable, Text, StyleProp, ViewStyle } from "react-native";
import { globalStyles } from "../styles/globalStyles";

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        globalStyles.buttonBase,
        variant === "secondary" ? globalStyles.buttonSecondary : globalStyles.buttonPrimary,
        variant === "danger" ? globalStyles.buttonDanger : null,
        pressed || disabled ? globalStyles.buttonPressed : null,
        style,
      ]}
    >
      <Text
        style={[
          globalStyles.buttonText,
          variant === "secondary" ? globalStyles.buttonTextSecondary : globalStyles.buttonTextPrimary,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};
