import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, PanResponder,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";

const SLIDES = [
  "Anything that\nneeds doing,\nwe sort it.",
  "Verified contractors.\nFast response.",
  "Track every step\nof your job.",
] as const;

export default function OnboardingScreen() {
  const router  = useRouter();
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await AsyncStorage.setItem("onboarding_done", "1");
    router.replace("/(tabs)/");
  };

  const next = () => {
    if (!isLast) setIndex((i) => i + 1);
    else finish();
  };

  const prev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) next();
        else if (g.dx > 40) prev();
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.safe} {...pan.panHandlers}>
      <View style={styles.slide}>
        <Text style={styles.heading}>{SLIDES[index]}</Text>
      </View>

      <View style={styles.footer}>
        {isLast ? (
          <TouchableOpacity style={styles.btnStart} onPress={finish} activeOpacity={0.85}>
            <Text style={styles.btnStartText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnNext} onPress={next} activeOpacity={0.85}>
            <ArrowRight color={colors.navy} size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.navy },
  slide: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: 36,
  },
  heading: {
    color:       colors.white,
    fontSize:    40,
    fontWeight:  "800",
    textAlign:   "center",
    lineHeight:  50,
    letterSpacing: -1,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom:     44,
    alignItems:        "center",
  },
  btnNext: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: colors.amber,
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     colors.amber,
    shadowOpacity:   0.45,
    shadowRadius:    18,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
  },
  btnStart: {
    width:           "100%",
    height:          60,
    borderRadius:    18,
    backgroundColor: colors.amber,
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     colors.amber,
    shadowOpacity:   0.45,
    shadowRadius:    18,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
  },
  btnStartText: { color: colors.navy, fontWeight: "800", fontSize: 17, letterSpacing: -0.2 },
});
