import React from "react";
import { Pressable, Text } from "react-native";
import { globalStyles } from "../styles/globalStyles";

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
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
