import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MessageSquare, Send, ArrowLeft } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

interface Message {
  id:         string;
  body:       string;
  sender:     "user" | "contractor";
  created_at: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatThread({ jobId, category }: { jobId: string; category: string }) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [draft,    setDraft]      = useState("");
  const [loading,  setLoading]    = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, sender, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
      setLoading(false);
    };

    load();

    channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${jobId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [jobId]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");

    const optimistic: Message = {
      id:         `opt-${Date.now()}`,
      body,
      sender:     "user",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    await supabase.from("messages").insert({ job_id: jobId, body, sender: "user" });
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
      keyboardVerticalOffset={90}
    >
      <View style={thread.header}>
        <View style={thread.dot} />
        <Text style={thread.headerText}>{category} · Job #{jobId.slice(-6)}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={thread.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={thread.emptyBubble}>
            <Text style={thread.emptyBubbleText}>
              Your inquiry has been submitted. A contractor will respond shortly.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUser = item.sender === "user";
          return (
            <View style={[thread.row, isUser ? thread.rowUser : thread.rowOther]}>
              {!isUser && <View style={thread.avatar}><Text style={thread.avatarText}>B</Text></View>}
              <View style={[thread.bubble, isUser ? thread.bubbleUser : thread.bubbleOther]}>
                <Text style={[thread.bubbleText, isUser ? thread.bubbleTextUser : thread.bubbleTextOther]}>
                  {item.body}
                </Text>
                <Text style={[thread.time, isUser ? thread.timeUser : thread.timeOther]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={thread.input}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={thread.textInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[thread.sendBtn, !draft.trim() && thread.sendBtnDisabled]}
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

export default function MessagesScreen() {
  const router = useRouter();
  const { jobs } = useApp();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  if (selectedJobId) {
    const job = jobs.find((j) => j.id === selectedJobId);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.threadNav}>
          <TouchableOpacity style={styles.back} onPress={() => setSelectedJobId(null)}>
            <ArrowLeft color="rgba(255,255,255,0.7)" size={18} />
            <Text style={styles.backText}>Messages</Text>
          </TouchableOpacity>
        </View>
        {job && <ChatThread jobId={job.id} category={job.category} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sub}>Stay in touch with your contractor</Text>
      </View>

      {jobs.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <MessageSquare color={colors.amber} size={32} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyBody}>
            Once a contractor is assigned to your job, your conversation will appear here.
          </Text>
          <Button
            label="Start an Inquiry"
            onPress={() => router.push("/inquiry/type")}
            style={{ marginTop: 24, width: "100%" }}
          />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.threadCard}
              onPress={() => setSelectedJobId(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.threadAvatar}>
                <Text style={styles.threadAvatarText}>B</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.threadCategory}>{item.category}</Text>
                <Text style={styles.threadPreview} numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
              <View style={styles.threadMeta}>
                <Text style={styles.threadTime}>{new Date(item.date).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.navy },
  header:        { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 20 },
  title:         { color: colors.white, fontSize: 32, fontWeight: "800", letterSpacing: -0.6, lineHeight: 38 },
  sub:           { color: colors.muted, fontSize: 14, fontWeight: "400", marginTop: 4 },
  center: {
    flex:             1,
    marginHorizontal: 22,
    marginBottom:     100,
    backgroundColor:  "rgba(255,255,255,0.05)",
    borderRadius:     24,
    padding:          32,
    alignItems:       "center",
    justifyContent:   "center",
    borderWidth:      1,
    borderColor:      "rgba(255,255,255,0.08)",
  },
  iconWrap:      { width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle:    { color: colors.white, fontWeight: "800", fontSize: 20, marginBottom: 10, lineHeight: 26 },
  emptyBody:     { color: colors.muted, fontSize: 15, fontWeight: "400", textAlign: "center", lineHeight: 22 },
  threadNav:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  back:          { flexDirection: "row", alignItems: "center", gap: 6 },
  backText:      { color: colors.white, fontWeight: "700", fontSize: 15 },
  threadCard: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  threadAvatar:     { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" },
  threadAvatarText: { color: colors.navy, fontWeight: "900", fontSize: 18 },
  threadCategory:   { color: colors.white, fontWeight: "800", fontSize: 15, marginBottom: 3 },
  threadPreview:    { color: colors.muted, fontSize: 13, fontWeight: "400" },
  threadMeta:       { alignItems: "flex-end" },
  threadTime:       { color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: "600" },
});

const thread = StyleSheet.create({
  header:          { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  headerText:      { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "700" },
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
    flexDirection:    "row",
    alignItems:       "flex-end",
    gap:              10,
    paddingHorizontal: 16,
    paddingVertical:  12,
    borderTopWidth:   1,
    borderTopColor:   "rgba(255,255,255,0.07)",
  },
  textInput: {
    flex:              1,
    backgroundColor:  "rgba(255,255,255,0.08)",
    borderRadius:     20,
    paddingHorizontal: 16,
    paddingVertical:   10,
    fontSize:          15,
    color:             colors.white,
    maxHeight:         100,
  },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.08)" },
});
