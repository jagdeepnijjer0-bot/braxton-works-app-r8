import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/lib/colors";

interface Props {
  children: React.ReactNode;
  style?:   ViewStyle;
}

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius:    20,
    padding:         20,
    shadowColor:     "#000",
    shadowOpacity:   0.08,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       3,
  },
});
