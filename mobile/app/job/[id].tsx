import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { JOURNEY_STEPS, stepIndex, type JobStatus } from "@/lib/status";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import type { JobUpdate } from "@/lib/context";

const EMERALD = "#10B981";

function formatStamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    ", " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function PulsingDot() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.35, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[dot.ring, { transform: [{ scale: anim }] }]}>
      <View style={dot.core} />
    </Animated.View>
  );
}

const dot = StyleSheet.create({
  ring: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  core: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.amber },
});

export default function JobDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const { jobs, updateJobStatus } = useApp();
  const job      = jobs.find((j) => j.id === id);

  const [updates, setUpdates] = useState<JobUpdate[]>(job?.updates ?? []);
  const currentIdx = job ? stepIndex(job.status) : -1;

  // Realtime: subscribe to both jobs UPDATE and job_updates INSERT
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`job-detail:${id}`)
      // Primary signal: jobs row UPDATE → status changed directly from DB value
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${id}` },
        (payload) => {
          const newStatus = (payload.new as { status: JobStatus }).status;
          if (newStatus && newStatus !== job?.status) {
            const syntheticUpdate: JobUpdate = {
              id:         `rt-${Date.now()}`,
              message:    `Status changed to ${newStatus}`,
              type:       "status_change",
              created_at: new Date().toISOString(),
            };
            updateJobStatus(id, newStatus, syntheticUpdate);
          }
        }
      )
      // Secondary: job_updates INSERT → append timeline entry
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "job_updates", filter: `job_id=eq.${id}` },
        (payload) => {
          const u = payload.new as JobUpdate;
          setUpdates((prev) =>
            prev.some((x) => x.id === u.id) ? prev : [...prev, u]
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.muted} size={18} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Enquiry not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCancelled = job.status === "Cancelled";

  // Find timestamp for each step from updates
  const stampFor = (step: JobStatus): string | null => {
    const u = updates.find(
      (u) => u.type === "status_change" && u.message.includes(step)
    );
    return u ? formatStamp(u.created_at) : null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.category}>{job.category}</Text>
          <Text style={styles.type}>{job.type === "issue" ? "ISSUE" : "ENQUIRY"}</Text>
        </View>
        <Text style={styles.desc}>{job.description}</Text>
        <Text style={styles.date}>
          Submitted {formatStamp(job.date)}
        </Text>

        {/* Status journey */}
        <Text style={styles.sectionLabel}>YOUR JOURNEY</Text>

        {isCancelled ? (
          <View style={styles.cancelBadge}>
            <Text style={styles.cancelText}>This enquiry was cancelled.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {JOURNEY_STEPS.map((step, i) => {
              const isDone    = i < currentIdx;
              const isCurrent = i === currentIdx;
              const isFuture  = i > currentIdx;
              const isLast    = i === JOURNEY_STEPS.length - 1;
              const stamp     = isDone || isCurrent ? (stampFor(step) ?? (i === 0 ? formatStamp(job.date) : null)) : null;
              const isComplete = step === "Job Completed";

              const circleColor = isDone
                ? isComplete ? EMERALD : colors.amber
                : isCurrent
                  ? colors.amber
                  : "rgba(255,255,255,0.12)";

              return (
                <View key={step} style={styles.row}>
                  {/* Left: circle + line */}
                  <View style={styles.track}>
                    {isCurrent ? (
                      <PulsingDot />
                    ) : (
                      <View style={[styles.circle, { backgroundColor: circleColor }]}>
                        {(isDone) && (
                          <Check
                            color={isComplete ? "#fff" : colors.navy}
                            size={13}
                            strokeWidth={3}
                          />
                        )}
                      </View>
                    )}
                    {!isLast && (
                      <View style={[
                        styles.line,
                        { backgroundColor: isDone ? colors.amber : "rgba(255,255,255,0.1)" }
                      ]} />
                    )}
                  </View>

                  {/* Right: label + timestamp */}
                  <View style={styles.stepContent}>
                    <Text style={[
                      styles.stepLabel,
                      isFuture  && styles.stepLabelFuture,
                      isComplete && isDone && styles.stepLabelComplete,
                    ]}>
                      {step}
                    </Text>
                    {stamp && <Text style={styles.stepStamp}>{stamp}</Text>}
                    {isCurrent && step === "Assigning Contractor" && (
                      <Text style={styles.stepHint}>Finding the best contractor for you…</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.navy },
  back:        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4 },
  backText:    { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  content:     { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 60 },

  headerRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  category:    { color: colors.white, fontWeight: "800", fontSize: 22, letterSpacing: -0.4 },
  type:        { color: colors.amber, fontSize: 11, fontWeight: "600", letterSpacing: 1 },
  desc:        { color: colors.muted, fontSize: 15, fontWeight: "400", lineHeight: 22, marginBottom: 6 },
  date:        { color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: "400", marginBottom: 32 },

  sectionLabel:{ color: colors.amber, fontSize: 11, fontWeight: "600", letterSpacing: 1.5, marginBottom: 24 },

  cancelBadge: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  cancelText:  { color: "#EF4444", fontWeight: "600", fontSize: 15 },

  timeline:    { gap: 0 },
  row:         { flexDirection: "row", gap: 16 },
  track:       { alignItems: "center", width: 28 },
  circle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  line:        { width: 2, flex: 1, minHeight: 36, marginVertical: 4 },
  stepContent: { flex: 1, paddingBottom: 28, paddingTop: 2 },
  stepLabel:       { color: colors.white, fontWeight: "700", fontSize: 16, lineHeight: 22 },
  stepLabelFuture: { color: "rgba(255,255,255,0.3)", fontWeight: "500" },
  stepLabelComplete:{ color: EMERALD },
  stepStamp:   { color: colors.muted, fontSize: 12, fontWeight: "400", marginTop: 4 },
  stepHint:    { color: colors.amber, fontSize: 12, fontWeight: "500", marginTop: 4 },
});
