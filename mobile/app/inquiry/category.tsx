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
        <ArrowLeft color="rgba(255,255,255,0.6)" size={20} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What type of {inquiry.type === "issue" ? "issue" : "project"}?</Text>
        <Text style={styles.sub}>Select a category</Text>

        <View style={styles.grid}>
          {categories.map(({ id, label, icon: Icon }) => {
            const isSelected = selected === label;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(label)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Icon color={isSelected ? colors.navy : colors.amber} size={22} />
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
  safe:             { flex: 1, backgroundColor: colors.navy },
  back:             { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText:         { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },
  content:          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  title:            { color: colors.white, fontSize: 24, fontWeight: "700", marginBottom: 6 },
  sub:              { color: "rgba(255,255,255,0.55)", fontSize: 15, marginBottom: 24 },
  grid:             { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width:           "47%",
    backgroundColor: colors.white,
    borderRadius:    18,
    padding:         18,
    alignItems:      "center",
    gap:             12,
    shadowColor:     "#000",
    shadowOpacity:   0.07,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       2,
  },
  cardSelected:     { backgroundColor: colors.amber },
  iconBox:          { width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center" },
  iconBoxSelected:  { backgroundColor: "rgba(15,23,42,0.12)" },
  cardLabel:        { color: colors.navy, fontWeight: "600", fontSize: 14, textAlign: "center" },
  cardLabelSelected:{ color: colors.navy },
});
