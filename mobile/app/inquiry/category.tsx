import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Droplets, Zap, DoorOpen, Microwave, Hammer, Wrench } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";
import { useState } from "react";

const categories = [
  { id: "plumbing",   label: "Plumbing",   icon: Droplets  },
  { id: "electrical", label: "Electrical", icon: Zap       },
  { id: "locks",      label: "Locks",      icon: DoorOpen  },
  { id: "appliances", label: "Appliances", icon: Microwave },
  { id: "roofing",    label: "Roofing",    icon: Hammer    },
  { id: "general",    label: "General",    icon: Wrench    },
];

export default function CategoryScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (label: string) => {
    setSelected(label);
    setInquiry({ ...inquiry, category: label });
    setTimeout(() => router.push("/inquiry/description"), 150);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={1} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          {inquiry.type === "issue" ? "What type of\nissue?" : "What are you\nlooking for?"}
        </Text>
        <Text style={styles.sub}>Select a category</Text>

        <View style={styles.grid}>
          {categories.map(({ id, label, icon: Icon }) => {
            const isSelected = selected === label;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(label)}
                activeOpacity={0.82}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Icon color={isSelected ? colors.navy : colors.amber} size={24} strokeWidth={2} />
                </View>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: colors.navy },
  back:              { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  content:           { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 40 },
  title:             { color: colors.white, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  sub: { color: colors.muted, fontSize: 15, fontWeight: "400", lineHeight: 22 },
  grid:              { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width:           "47.5%",
    backgroundColor: colors.white,
    borderRadius:    20,
    padding:         20,
    alignItems:      "flex-start",
    gap:             14,
    shadowColor:     "#000",
    shadowOpacity:   0.09,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       3,
  },
  cardSelected:      { backgroundColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.35 },
  iconBox:           { width: 50, height: 50, borderRadius: 14, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center" },
  iconBoxSelected:   { backgroundColor: "rgba(15,23,42,0.12)" },
  cardLabel:         { color: colors.navy, fontWeight: "800", fontSize: 15, letterSpacing: -0.3 },
  cardLabelSelected: { color: colors.navy },
});
