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
      activeOpacity={0.82}
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
    height:            60,
    borderRadius:      18,
    alignItems:        "center",
    justifyContent:    "center",
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.amber,
    shadowColor:     colors.amber,
    shadowOpacity:   0.35,
    shadowRadius:    14,
    shadowOffset:    { width: 0, height: 5 },
    elevation:       6,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth:     1.5,
    borderColor:     "rgba(255,255,255,0.18)",
  },
  disabled: {
    opacity:     0.4,
    shadowOpacity: 0,
  },
  label: {
    fontSize:      17,
    fontWeight:    "800",
    letterSpacing: -0.2,
  },
});
