import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Wrench, ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/Button";
import { STATUS_DISPLAY, STATUS_PILL_COLORS, statusTone, ACTIVE_STATUSES, COMPLETE_STATUSES } from "@/lib/status";
import { useState } from "react";

type Tab = "active" | "completed";

export default function JobsScreen() {
  const router = useRouter();
  const { jobs } = useApp();
  const [tab, setTab] = useState<Tab>("active");

  const filtered = jobs.filter((j) =>
    tab === "active" ? ACTIVE_STATUSES.includes(j.status) : COMPLETE_STATUSES.includes(j.status)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["active", "completed"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "active" ? "Active" : "Completed"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Wrench color={colors.amber} size={28} />
            </View>
            <Text style={styles.emptyText}>
              {tab === "active"
                ? "Nothing booked yet — got something that needs fixing?"
                : "No completed jobs yet."}
            </Text>
            <Button
              label="Start an Inquiry"
              onPress={() => router.push("/inquiry/type")}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          filtered.map((job) => {
            const tone   = statusTone(job.status);
            const pill   = STATUS_PILL_COLORS[tone];
            return (
              <TouchableOpacity key={job.id} style={styles.card} activeOpacity={0.85}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardType}>{job.type === "issue" ? "Issue" : "Inquiry"}</Text>
                    <Text style={styles.cardDot}>·</Text>
                    <Text style={styles.cardCat}>{job.category}</Text>
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={2}>{job.description}</Text>
                  <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.pillText, { color: pill.text }]}>
                      {STATUS_DISPLAY[job.status]}
                    </Text>
                  </View>
                </View>
                <ChevronRight color={colors.muted} size={18} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.navy },
  header:         { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  title:          { color: colors.white, fontSize: 24, fontWeight: "700" },
  tabRow:         { flexDirection: "row", marginHorizontal: 20, backgroundColor: colors.white, borderRadius: 14, padding: 4, marginBottom: 16 },
  tab:            { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  tabActive:      { backgroundColor: colors.amber },
  tabText:        { color: colors.slate, fontWeight: "600", fontSize: 13 },
  tabTextActive:  { color: colors.navy },
  scroll:         { paddingHorizontal: 20, paddingBottom: 30 },
  empty: {
    backgroundColor: colors.white,
    borderRadius:    20,
    padding:         28,
    alignItems:      "center",
    marginTop:       10,
  },
  emptyIcon:      { width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyText:      { color: colors.navy, fontWeight: "500", fontSize: 15, textAlign: "center", lineHeight: 22 },
  card: {
    backgroundColor: colors.white,
    borderRadius:    18,
    padding:         18,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             12,
    marginBottom:    12,
    shadowColor:     "#000",
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       2,
  },
  cardMeta:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardType:  { color: colors.slate, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  cardDot:   { color: colors.muted, fontSize: 11 },
  cardCat:   { color: colors.slate, fontSize: 11 },
  cardDesc:  { color: colors.navy, fontWeight: "500", fontSize: 14, marginBottom: 8, lineHeight: 20 },
  pill:      { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillText:  { fontSize: 12, fontWeight: "600" },
});
