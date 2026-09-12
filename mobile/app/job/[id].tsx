import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated,
  FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, Send } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { JOURNEY_STEPS, stepIndex, type JobStatus } from "@/lib/status";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import type { JobUpdate } from "@/lib/context";

const EMERALD = "#10B981";

// Module-level counters ensure every channel() call gets a unique topic name,
// preventing the "cannot add callbacks after subscribe()" crash when React
// re-mounts (or the effect re-runs) while a previous channel is still active.
let _jobDetailSeq  = 0;
let _chatTabSeq    = 0;

function formatStamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    ", " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

// ─── Chat tab ────────────────────────────────────────────────────────────────

interface Message {
  id:         string;
  body:       string;
  sender:     "user" | "contractor";
  created_at: string;
}

function ChatTab({ jobId, bottomOffset }: { jobId: string; bottomOffset: number }) {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [draft,     setDraft]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      try {
        const { data } = await supabase
          .from("messages")
          .select("id, body, sender, created_at")
          .eq("job_id", jobId)
          .order("created_at", { ascending: true });
        if (data) setMessages(data as Message[]);
      } catch { /* non-fatal */ }
      setLoading(false);
    };

    load();

    _chatTabSeq += 1;
    channel = supabase
      .channel(`messages:${jobId}-${_chatTabSeq}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${jobId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [jobId]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setSendError(null);

    const optimistic: Message = {
      id: `opt-${Date.now()}`, body, sender: "user", created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const { error } = await supabase.from("messages").insert({ job_id: jobId, body, sender: "user" });
      if (error) {
        console.warn("[messages] send error:", error.code, error.message, JSON.stringify(error.details));
        setSendError("Message couldn't be sent — check your connection.");
      }
    } catch {
      setSendError("Message couldn't be sent — check your connection.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={bottomOffset}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        style={{ flex: 1 }}
        contentContainerStyle={chat.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={chat.emptyBubble}>
            <Text style={chat.emptyBubbleText}>
              Your enquiry has been submitted. A contractor will respond shortly.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUser = item.sender === "user";
          return (
            <View style={[chat.row, isUser ? chat.rowUser : chat.rowOther]}>
              {!isUser && <View style={chat.avatar}><Text style={chat.avatarText}>T</Text></View>}
              <View style={[chat.bubble, isUser ? chat.bubbleUser : chat.bubbleOther]}>
                <Text style={[chat.bubbleText, isUser ? chat.bubbleTextUser : chat.bubbleTextOther]}>
                  {item.body}
                </Text>
                <Text style={[chat.time, isUser ? chat.timeUser : chat.timeOther]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {sendError && <Text style={chat.sendError}>{sendError}</Text>}

      <View style={chat.input}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={chat.textInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[chat.sendBtn, !draft.trim() && chat.sendBtnDisabled]}
          onPress={send}
          disabled={!draft.trim()}
          activeOpacity={0.85}
        >
          <Send color={draft.trim() ? colors.navy : "rgba(255,255,255,0.3)"} size={18} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const chat = StyleSheet.create({
  list:            { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  row:             { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rowUser:         { justifyContent: "flex-end" },
  rowOther:        { justifyContent: "flex-start" },
  avatar:          { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText:      { color: colors.navy, fontWeight: "900", fontSize: 13 },
  bubble:          { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser:      { backgroundColor: colors.amber, borderBottomRightRadius: 4 },
  bubbleOther:     { backgroundColor: "rgba(255,255,255,0.09)", borderBottomLeftRadius: 4 },
  bubbleText:      { fontSize: 15, lineHeight: 21 },
  bubbleTextUser:  { color: colors.navy, fontWeight: "600" },
  bubbleTextOther: { color: colors.white },
  time:            { fontSize: 10, fontWeight: "600", marginTop: 4 },
  timeUser:        { color: "rgba(15,23,42,0.5)", textAlign: "right" },
  timeOther:       { color: "rgba(255,255,255,0.3)" },
  emptyBubble:     { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, marginHorizontal: 4 },
  emptyBubbleText: { color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 21, textAlign: "center" },
  input: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)",
    backgroundColor: colors.navy,
  },
  textInput: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.white, maxHeight: 100,
  },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.08)" },
  sendError:       { color: "#EF4444", fontSize: 12, fontWeight: "600", paddingHorizontal: 16, paddingBottom: 6 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function JobDetailScreen() {
  const { id, tab: tabParam } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { jobs, updateJobStatus } = useApp();
  const job      = jobs.find((j) => j.id === id);

  // Active tab: default to "details", switch to "messages" when tab param says so
  const [activeTab, setActiveTab] = useState<"details" | "messages">(
    tabParam === "messages" ? "messages" : "details"
  );

  const [updates, setUpdates] = useState<JobUpdate[]>(job?.updates ?? []);
  const currentIdx = job ? stepIndex(job.status) : -1;

  // Realtime: subscribe to both jobs UPDATE and job_updates INSERT
  useEffect(() => {
    if (!id) return;

    _jobDetailSeq += 1;
    const channel = supabase
      .channel(`job-detail:${id}-${_jobDetailSeq}`)
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

  const stampFor = (step: JobStatus): string | null => {
    const u = updates.find(
      (u) => u.type === "status_change" && u.message.includes(step)
    );
    return u ? formatStamp(u.created_at) : null;
  };

  // bottomOffset for ChatTab KAV: back button area + tab bar height + safe area
  const bottomOffset = insets.bottom + 49;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "details" && styles.tabActive]}
          onPress={() => setActiveTab("details")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "details" && styles.tabTextActive]}>
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "messages" && styles.tabActive]}
          onPress={() => setActiveTab("messages")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "messages" && styles.tabTextActive]}>
            Messages
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "details" ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.category}>{job.category}</Text>
            <Text style={styles.type}>{job.type === "issue" ? "ISSUE" : "ENQUIRY"}</Text>
          </View>
          <Text style={styles.desc}>{job.description}</Text>
          <Text style={styles.date}>
            Submitted {formatStamp(job.date)}
          </Text>

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
                    <View style={styles.track}>
                      {isCurrent ? (
                        <PulsingDot />
                      ) : (
                        <View style={[styles.circle, { backgroundColor: circleColor }]}>
                          {isDone && (
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

                    <View style={styles.stepContent}>
                      <Text style={[
                        styles.stepLabel,
                        isFuture   && styles.stepLabelFuture,
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
      ) : (
        <View style={{ flex: 1, paddingBottom: bottomOffset }}>
          <ChatTab jobId={job.id} bottomOffset={bottomOffset} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.navy },
  back:        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4 },
  backText:    { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 22,
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.amber,
  },
  tabText: {
    fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.4)",
  },
  tabTextActive: {
    color: colors.navy,
  },

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
