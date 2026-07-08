import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, PanResponder,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";

const SLIDES = [
  "Anything that\nneeds doing,\nwe sort it.",
  "Verified contractors.\nFast response.",
  "Track every step\nof your job.",
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
  };

  const finish = async () => {
    await AsyncStorage.setItem("onboarding_done", "1");
    router.replace("/(tabs)/");
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dy) < 40,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) go(1);
        else if (g.dx > 40) go(-1);
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <Logo size={36} />
      </View>

      {/* Slide area */}
      <View style={styles.slideWrap} {...pan.panHandlers}>
        {/* Left arrow */}
        <TouchableOpacity style={styles.arrow} onPress={() => go(-1)} activeOpacity={0.6}>
          <ChevronLeft color="rgba(255,255,255,0.35)" size={28} strokeWidth={2} />
        </TouchableOpacity>

        {/* Heading */}
        <View style={styles.textWrap}>
          <Text style={styles.heading}>{SLIDES[index]}</Text>
        </View>

        {/* Right arrow */}
        <TouchableOpacity style={styles.arrow} onPress={() => go(1)} activeOpacity={0.6}>
          <ChevronRight color="rgba(255,255,255,0.35)" size={28} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={finish} activeOpacity={0.85}>
          <Text style={styles.btnText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.navy },

  logoRow: {
    alignItems:    "center",
    paddingTop:    28,
    paddingBottom: 8,
  },

  slideWrap: {
    flex:           1,
    flexDirection:  "row",
    alignItems:     "center",
    paddingHorizontal: 12,
  },

  arrow: {
    width:          44,
    height:         44,
    alignItems:     "center",
    justifyContent: "center",
  },

  textWrap: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  heading: {
    color:         colors.white,
    fontSize:      40,
    fontWeight:    "800",
    textAlign:     "center",
    lineHeight:    50,
    letterSpacing: -1,
  },

  dots: {
    flexDirection:  "row",
    gap:            8,
    justifyContent: "center",
    paddingBottom:  32,
  },
  dot:       { width: 6,  height: 6,  borderRadius: 3,  backgroundColor: "rgba(255,255,255,0.2)" },
  dotActive: { width: 22, height: 6,  borderRadius: 3,  backgroundColor: colors.amber },

  footer: {
    paddingHorizontal: 24,
    paddingBottom:     36,
  },
  btn: {
    height:          60,
    borderRadius:    18,
    backgroundColor: colors.amber,
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     colors.amber,
    shadowOpacity:   0.4,
    shadowRadius:    18,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
  },
  btnText: {
    color:         colors.navy,
    fontWeight:    "800",
    fontSize:      17,
    letterSpacing: -0.2,
  },
});
