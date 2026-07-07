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
    borderRadius:    22,
    padding:         22,
    shadowColor:     "#000",
    shadowOpacity:   0.1,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 6 },
    elevation:       4,
  },
});
