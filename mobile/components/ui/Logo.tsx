import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/lib/colors";

interface Props {
  size?: number;
}

export function Logo({ size = 48 }: Props) {
  const radius = size * 0.22;
  const accentSize = size * 0.38;
  const accentRadius = accentSize * 0.36;
  const fontSize = size * 0.62;

  return (
    <View
      style={[
        styles.wrap,
        {
          width:         size,
          height:        size,
          borderRadius:  radius,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize }]}>B</Text>
      <View
        style={[
          styles.accent,
          {
            width:        accentSize,
            height:       accentSize,
            borderRadius: accentRadius,
            bottom:       size * 0.07,
            right:        size * 0.04,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.navy,
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     1.5,
    borderColor:     "rgba(255,255,255,0.1)",
    overflow:        "hidden",
    shadowColor:     colors.amber,
    shadowOpacity:   0.25,
    shadowRadius:    10,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       4,
  },
  letter: {
    color:      colors.white,
    fontWeight: "900",
    lineHeight: undefined,
    includeFontPadding: false,
  },
  accent: {
    position:        "absolute",
    backgroundColor: colors.amber,
  },
});
