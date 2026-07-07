import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/lib/colors";

interface Props {
  label:    string;
  onPress:  () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  style?:   ViewStyle;
}

export function Button({ label, onPress, variant = "primary", loading, disabled, style }: Props) {
  const isPrimary = variant === "primary";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, disabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.navy : colors.white} />
      ) : (
        <Text style={[styles.label, { color: isPrimary ? colors.navy : colors.white }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height:         56,
    borderRadius:   16,
    alignItems:     "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: colors.amber,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.2)",
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize:   17,
    fontWeight: "600",
  },
});
