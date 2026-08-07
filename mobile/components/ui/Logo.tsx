import { Image, StyleSheet } from "react-native";

interface Props {
  size?: number;
  style?: object;
}

// Renders the actual TradeNest logo asset — amber nest/chevron mark on navy.
// The asset at assets/icon.png is the canonical source used everywhere:
// home header, onboarding, auth gate, confirmation.
export function Logo({ size = 48, style }: Props) {
  return (
    <Image
      source={require("../../assets/icon.png")}
      style={[{ width: size, height: size, borderRadius: size * 0.22 }, style]}
      resizeMode="cover"
    />
  );
}
