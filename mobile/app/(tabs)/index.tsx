import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck, Zap, Star, Wrench, Settings, HardHat, Sparkles, ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const trustSignals = [
  { icon: ShieldCheck, label: "Verified\nContractors" },
  { icon: Zap,         label: "Fast\nResponse"       },
  { icon: Star,        label: "Rated &\nReviewed"    },
];

const services = [
  { icon: Wrench,   label: "Repairs"               },
  { icon: Settings, label: "Maintenance"            },
  { icon: HardHat,  label: "Builds & Renovations"  },
  { icon: Sparkles, label: "Everything else"        },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Branding */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>B</Text>
          </View>
          <View>
            <Text style={styles.appName}>Build.me</Text>
            <Text style={styles.appSub}>Property Services</Text>
          </View>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Anything that needs doing, we sort it.</Text>

        {/* Social proof */}
        <Text style={styles.socialProof}>
          Trusted by homeowners across Coventry &amp; Warwickshire.
        </Text>

        {/* Trust signals */}
        <View style={styles.trustRow}>
          {trustSignals.map(({ icon: Icon, label }, i) => (
            <Card key={i} style={styles.trustCard}>
              <Icon color={colors.amber} size={22} />
              <Text style={styles.trustLabel}>{label}</Text>
            </Card>
          ))}
        </View>

        {/* Services */}
        <Card style={styles.servicesCard}>
          <Text style={styles.sectionLabel}>WE COVER</Text>
          {services.map(({ icon: Icon, label }, i) => (
            <View key={i} style={styles.serviceRow}>
              <View style={styles.serviceIcon}>
                <Icon color={colors.amber} size={20} />
              </View>
              <Text style={styles.serviceLabel}>{label}</Text>
            </View>
          ))}
        </Card>

        {/* CTA */}
        <Button
          label="Start your inquiry"
          onPress={() => router.push("/inquiry/type")}
          style={styles.cta}
        />

        {/* About */}
        <Card style={styles.about}>
          <Text style={styles.aboutTitle}>About Us</Text>
          <Text style={styles.aboutBody}>
            Build.me is your single point of contact for all property maintenance and improvement
            needs. We handle everything from emergency repairs to full renovations, connecting you
            with trusted, vetted professionals while managing the entire process.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.navy },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header:     { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 24, marginBottom: 20 },
  logoBox:    { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" },
  logoText:   { color: colors.navy, fontWeight: "800", fontSize: 26 },
  appName:    { color: colors.white, fontWeight: "700", fontSize: 20 },
  appSub:     { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 2 },

  tagline:    { color: "rgba(255,255,255,0.8)", fontSize: 17, lineHeight: 26, marginBottom: 6 },
  socialProof:{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 20 },

  trustRow:   { flexDirection: "row", gap: 10, marginBottom: 22 },
  trustCard:  { flex: 1, alignItems: "center", gap: 8, paddingVertical: 16, paddingHorizontal: 8 },
  trustLabel: { color: colors.navy, fontSize: 11, fontWeight: "600", textAlign: "center", lineHeight: 15 },

  servicesCard: { marginBottom: 20 },
  sectionLabel: { color: colors.slate, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 18 },
  serviceRow:   { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  serviceIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center" },
  serviceLabel: { color: colors.navy, fontWeight: "500", fontSize: 15 },

  cta:   { marginBottom: 20 },

  about:      { marginBottom: 10 },
  aboutTitle: { color: colors.navy, fontWeight: "700", fontSize: 16, marginBottom: 10 },
  aboutBody:  { color: colors.slate, lineHeight: 22, fontSize: 14 },
});
