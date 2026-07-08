import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, Wrench, Users, Bell } from "lucide-react-native";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";

const SLIDES = [
  {
    key:     "1",
    heading: "Get anything\nfixed",
    sub:     "Submit a job in under 2 minutes",
    Icon:    Wrench,
  },
  {
    key:     "2",
    heading: "We find the\nright person",
    sub:     "Verified contractors matched to your job",
    Icon:    Users,
  },
  {
    key:     "3",
    heading: "Track every\nstep",
    sub:     "Real-time updates from submission to completion",
    Icon:    Bell,
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem("onboarding_done", "1");
    router.replace("/(tabs)/");
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1);
    } else {
      finish();
    }
  };

  const slide   = SLIDES[index];
  const isLast  = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.logoRow}>
        <Logo size={40} />
        <Text style={styles.brand}>Build.me</Text>
      </View>

      {/* Slide content */}
      <View style={styles.slide}>
        <View style={styles.iconRing}>
          <View style={styles.iconInner}>
            <slide.Icon color={colors.amber} size={44} strokeWidth={1.8} />
          </View>
        </View>
        <Text style={styles.heading}>{slide.heading}</Text>
        <Text style={styles.sub}>{slide.sub}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        {isLast ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={finish} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnNext} onPress={next} activeOpacity={0.85}>
            <ArrowRight color={colors.navy} size={22} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={finish} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.navy },
  logoRow:    { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  brand:      { color: colors.white, fontWeight: "800", fontSize: 20, letterSpacing: -0.4 },
  slide: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: 32,
    paddingBottom:   40,
  },
  iconRing: {
    width:           180,
    height:          180,
    borderRadius:    90,
    backgroundColor: "rgba(245,158,11,0.07)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    44,
    shadowColor:     colors.amber,
    shadowOpacity:   0.18,
    shadowRadius:    40,
    shadowOffset:    { width: 0, height: 0 },
  },
  iconInner: {
    width:           110,
    height:          110,
    borderRadius:    55,
    backgroundColor: "rgba(245,158,11,0.13)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  heading:    { color: colors.white, fontSize: 44, fontWeight: "800", letterSpacing: -1.2, lineHeight: 50, textAlign: "center", marginBottom: 16 },
  sub:        { color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: "500", textAlign: "center", lineHeight: 24 },
  dots:       { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 36 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  dotActive:  { width: 20, backgroundColor: colors.amber },
  footer:     { paddingHorizontal: 24, paddingBottom: 20, alignItems: "center", gap: 16 },
  btnNext: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: colors.amber,
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     colors.amber,
    shadowOpacity:   0.4,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
  },
  btnPrimary: {
    width:           "100%",
    height:          60,
    borderRadius:    18,
    backgroundColor: colors.amber,
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     colors.amber,
    shadowOpacity:   0.4,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
  },
  btnPrimaryText: { color: colors.navy, fontWeight: "800", fontSize: 17, letterSpacing: -0.2 },
  skip:           { paddingVertical: 4 },
  skipText:       { color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "600" },
});
