import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { globalStyles } from "../styles/globalStyles";

interface InputFieldProps extends TextInputProps {
  label: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  style,
  ...rest
}) => {
  return (
    <View style={globalStyles.inputWrap}>
      <Text style={globalStyles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          globalStyles.input,
          // Support for LTR-only fields in RTL devices (e.g. Password, Email)
          rest.secureTextEntry || rest.keyboardType === "email-address" 
            ? { textAlign: "left" } 
            : null,
          style,
        ]}
        placeholderTextColor="#8a97b6"
        {...rest}
      />
    </View>
  );
};
