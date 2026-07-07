import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck, Zap, Star, Wrench, Settings, HardHat, Sparkles } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";

const trustSignals = [
  { icon: ShieldCheck, label: "Verified\nContractors" },
  { icon: Zap,         label: "Fast\nResponse"        },
  { icon: Star,        label: "Rated &\nReviewed"     },
];

const services = [
  { icon: Wrench,   label: "Repairs"       },
  { icon: Settings, label: "Maintenance"   },
  { icon: HardHat,  label: "Renovations"  },
  { icon: Sparkles, label: "Everything"   },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <View style={styles.logoInner}>
              <Text style={styles.logoLetter}>B</Text>
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.appName}>Build.me</Text>
            <Text style={styles.appSub}>Property Services</Text>
          </View>
        </View>

        {/* Hero tagline */}
        <Text style={styles.tagline}>Anything that{"\n"}needs doing,{"\n"}we sort it.</Text>

        {/* Social proof */}
        <Text style={styles.socialProof}>
          Trusted by homeowners across Coventry &amp; Warwickshire.
        </Text>

        {/* Trust signals */}
        <View style={styles.trustRow}>
          {trustSignals.map(({ icon: Icon, label }, i) => (
            <View key={i} style={styles.trustCard}>
              <View style={styles.trustIconBox}>
                <Icon color={colors.amber} size={26} strokeWidth={2} />
              </View>
              <Text style={styles.trustLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* CTA — above the fold */}
        <Button
          label="Start your inquiry"
          onPress={() => router.push("/inquiry/type")}
          style={styles.cta}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Services 2×2 grid */}
        <Text style={styles.sectionLabel}>WE COVER</Text>
        <View style={styles.servicesGrid}>
          {services.map(({ icon: Icon, label }, i) => (
            <View key={i} style={styles.serviceCard}>
              <View style={styles.serviceIconBox}>
                <Icon color={colors.amber} size={24} strokeWidth={2} />
              </View>
              <Text style={styles.serviceLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.navy },
  scroll: { paddingHorizontal: 22, paddingBottom: 48 },

  /* Header */
  header:      { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 20, marginBottom: 28 },
  logoWrap:    {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: colors.amber,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.amber, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoInner:   { alignItems: "center", justifyContent: "center" },
  logoLetter:  { color: colors.navy, fontWeight: "900", fontSize: 32, lineHeight: 36, letterSpacing: -1 },
  headerText:  { gap: 2 },
  appName:     { color: colors.white, fontWeight: "800", fontSize: 22, letterSpacing: -0.5 },
  appSub:      { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "500" },

  /* Hero */
  tagline:     {
    color: colors.white,
    fontSize: 40,
    fontWeight: "800",
    lineHeight: 46,
    letterSpacing: -1.2,
    marginBottom: 14,
  },
  socialProof: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 28,
    letterSpacing: 0.1,
  },

  /* Trust signals */
  trustRow:    { flexDirection: "row", gap: 10, marginBottom: 28 },
  trustCard:   {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  trustIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  trustLabel:  { color: colors.white, fontSize: 11, fontWeight: "700", textAlign: "center", lineHeight: 16, letterSpacing: 0.2 },

  /* CTA */
  cta: { marginBottom: 32 },

  /* Divider */
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginBottom: 24 },

  /* Services grid */
  sectionLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 14,
  },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  serviceCard:  {
    width: "47.5%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 18,
    alignItems: "flex-start",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  serviceIconBox: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: "rgba(245,158,11,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  serviceLabel: { color: colors.white, fontWeight: "700", fontSize: 14, letterSpacing: -0.2 },
});
