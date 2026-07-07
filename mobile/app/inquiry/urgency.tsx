import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Zap, Clock, Calendar } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp, type TimingOption } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";

const options: { id: TimingOption; label: string; desc: string; icon: typeof Zap }[] = [
  { id: "asap",        label: "ASAP",         desc: "I need this as soon as possible", icon: Zap      },
  { id: "this-week",   label: "This Week",    desc: "Within the next few days",        icon: Clock    },
  { id: "choose-date", label: "Choose Date",  desc: "I'll pick a specific date",       icon: Calendar },
];

export default function UrgencyScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();

  const handleSelect = (timing: TimingOption) => {
    setInquiry({ ...inquiry, timing });
    router.push("/inquiry/contact");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={3} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>When do you{"\n"}need this done?</Text>
        <Text style={styles.sub}>Select your preferred timing</Text>

        <View style={styles.options}>
          {options.map(({ id, label, desc, icon: Icon }) => {
            const isSelected = inquiry.timing === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(id)}
                activeOpacity={0.82}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Icon color={isSelected ? colors.navy : colors.amber} size={24} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{label}</Text>
                  <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>{desc}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: colors.navy },
  back:              { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:          { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  content:           { flex: 1, paddingHorizontal: 22, paddingTop: 20 },
  title:             { color: colors.white, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  sub:               { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "500", marginBottom: 32 },
  options:           { gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius:    22,
    padding:         20,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             16,
    shadowColor:     "#000",
    shadowOpacity:   0.1,
    shadowRadius:    14,
    shadowOffset:    { width: 0, height: 5 },
    elevation:       4,
  },
  cardSelected:      { backgroundColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.35 },
  iconBox:           { width: 54, height: 54, borderRadius: 15, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center" },
  iconBoxSelected:   { backgroundColor: "rgba(15,23,42,0.12)" },
  cardLabel:         { color: colors.navy, fontWeight: "800", fontSize: 17, marginBottom: 3, letterSpacing: -0.3 },
  cardLabelSelected: { color: colors.navy },
  cardDesc:          { color: colors.slate, fontSize: 13, lineHeight: 18 },
  cardDescSelected:  { color: "rgba(15,23,42,0.55)" },
  checkDot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy },
});
