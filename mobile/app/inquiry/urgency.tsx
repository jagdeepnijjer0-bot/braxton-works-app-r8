import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Zap, Clock, Calendar } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp, type TimingOption } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";

const options: { id: TimingOption; label: string; desc: string; icon: typeof Zap }[] = [
  { id: "asap",        label: "ASAP / Urgent", desc: "As soon as possible",     icon: Zap      },
  { id: "this-week",   label: "This Week",     desc: "Within the coming days",  icon: Clock    },
  { id: "choose-date", label: "Choose a Date", desc: "Schedule for later",      icon: Calendar },
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
        <ArrowLeft color="rgba(255,255,255,0.6)" size={20} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>When do you need this?</Text>
        <Text style={styles.sub}>Select your preferred timing</Text>

        <View style={styles.options}>
          {options.map(({ id, label, desc, icon: Icon }) => {
            const isSelected = inquiry.timing === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(id)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Icon color={isSelected ? colors.navy : colors.amber} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{label}</Text>
                  <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>{desc}</Text>
                </View>
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
  back:              { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText:          { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },
  content:           { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title:             { color: colors.white, fontSize: 24, fontWeight: "700", marginBottom: 6 },
  sub:               { color: "rgba(255,255,255,0.55)", fontSize: 15, marginBottom: 28 },
  options:           { gap: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius:    18,
    padding:         18,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             16,
    shadowColor:     "#000",
    shadowOpacity:   0.07,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       3,
  },
  cardSelected:      { backgroundColor: colors.amber },
  iconBox:           { width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center" },
  iconBoxSelected:   { backgroundColor: "rgba(15,23,42,0.12)" },
  cardLabel:         { color: colors.navy, fontWeight: "700", fontSize: 16, marginBottom: 3 },
  cardLabelSelected: { color: colors.navy },
  cardDesc:          { color: colors.slate, fontSize: 13 },
  cardDescSelected:  { color: "rgba(15,23,42,0.6)" },
});
