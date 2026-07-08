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
        <Text style={styles.sub}>{jobs.length > 0 ? `${jobs.length} total` : "Track your requests"}</Text>
      </View>

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
              <Wrench color={colors.amber} size={28} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === "active" ? "Nothing active yet" : "No completed jobs"}
            </Text>
            <Text style={styles.emptyBody}>
              {tab === "active"
                ? "Got something that needs fixing? Start an inquiry."
                : "Completed jobs will appear here."}
            </Text>
            {tab === "active" && (
              <Button
                label="Start an Inquiry"
                onPress={() => router.push("/inquiry/type")}
                style={{ marginTop: 20, width: "100%" }}
              />
            )}
          </View>
        ) : (
          filtered.map((job) => {
            const tone = statusTone(job.status);
            const pill = STATUS_PILL_COLORS[tone];
            return (
              <TouchableOpacity key={job.id} style={styles.card} activeOpacity={0.85}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardType}>{job.type === "issue" ? "ISSUE" : "INQUIRY"}</Text>
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
                <View style={styles.chevronWrap}>
                  <ChevronRight color={colors.muted} size={18} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.navy },
  header:        { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 16 },
  title:         { color: colors.white, fontSize: 32, fontWeight: "800", letterSpacing: -0.6, lineHeight: 38 },
  sub:           { color: colors.muted, fontSize: 14, fontWeight: "400", marginTop: 4 },
  tabRow: {
    flexDirection:   "row",
    marginHorizontal: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius:    16,
    padding:         4,
    marginBottom:    18,
  },
  tab:           { flex: 1, paddingVertical: 11, borderRadius: 13, alignItems: "center" },
  tabActive:     { backgroundColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  tabText:       { color: "rgba(255,255,255,0.5)", fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: colors.navy },
  scroll:        { paddingHorizontal: 22, paddingBottom: 110 },
  empty: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius:    22,
    padding:         32,
    alignItems:      "center",
    marginTop:       10,
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.08)",
  },
  emptyIcon:     { width: 60, height: 60, borderRadius: 18, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle:    { color: colors.white, fontWeight: "800", fontSize: 20, marginBottom: 8, lineHeight: 26 },
  emptyBody:     { color: colors.muted, fontSize: 15, fontWeight: "400", textAlign: "center", lineHeight: 22 },
  card: {
    backgroundColor: colors.white,
    borderRadius:    20,
    padding:         20,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             12,
    marginBottom:    12,
    shadowColor:     "#000",
    shadowOpacity:   0.09,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       3,
  },
  cardMeta:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  cardType:      { color: colors.amber, fontSize: 11, fontWeight: "600", letterSpacing: 1 },
  cardDot:       { color: colors.muted, fontSize: 10 },
  cardCat:       { color: colors.slate, fontSize: 12, fontWeight: "400" },
  cardDesc:      { color: colors.navy, fontWeight: "800", fontSize: 15, marginBottom: 10, lineHeight: 22 },
  pill:          { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:      { fontSize: 11, fontWeight: "600" },
  chevronWrap:   { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(15,23,42,0.05)", alignItems: "center", justifyContent: "center" },
});
