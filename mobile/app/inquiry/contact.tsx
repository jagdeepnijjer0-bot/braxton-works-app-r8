import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Phone, MessageSquare, Mail } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp, type ContactPreference } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";
import { Button } from "@/components/ui/Button";

const contactOpts: { id: ContactPreference; label: string; icon: typeof Phone }[] = [
  { id: "phone",  label: "Phone call",      icon: Phone         },
  { id: "text",   label: "Text message",    icon: MessageSquare },
  { id: "in-app", label: "In-app message",  icon: Mail          },
];

export default function ContactScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();

  const canContinue = inquiry.name.trim() && inquiry.address.trim() && inquiry.phone.trim() && inquiry.contactPreference;

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={4} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.6)" size={20} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Your contact details</Text>
        <Text style={styles.sub}>How can we reach you?</Text>

        {[
          { label: "NAME",         key: "name" as const,    placeholder: "Your full name",    kb: "default"  },
          { label: "ADDRESS",      key: "address" as const, placeholder: "Property address",  kb: "default"  },
          { label: "PHONE NUMBER", key: "phone" as const,   placeholder: "Your phone number", kb: "phone-pad"},
        ].map(({ label, key, placeholder, kb }) => (
          <View key={key} style={{ marginBottom: 20 }}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              value={inquiry[key]}
              onChangeText={(v) => setInquiry({ ...inquiry, [key]: v })}
              placeholder={placeholder}
              placeholderTextColor={colors.muted}
              keyboardType={kb as any}
              style={styles.input}
            />
          </View>
        ))}

        <Text style={styles.fieldLabel}>CONTACT PREFERENCE</Text>
        <View style={styles.prefRow}>
          {contactOpts.map(({ id, label, icon: Icon }) => {
            const isSelected = inquiry.contactPreference === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.prefCard, isSelected && styles.prefCardSelected]}
                onPress={() => setInquiry({ ...inquiry, contactPreference: id })}
                activeOpacity={0.85}
              >
                <Icon color={isSelected ? colors.navy : colors.slate} size={18} />
                <Text style={[styles.prefLabel, isSelected && styles.prefLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          label="Submit Inquiry"
          onPress={() => router.push("/inquiry/confirmation")}
          disabled={!canContinue}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: colors.navy },
  back:              { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText:          { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },
  content:           { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  title:             { color: colors.white, fontSize: 24, fontWeight: "700", marginBottom: 6 },
  sub:               { color: "rgba(255,255,255,0.55)", fontSize: 15, marginBottom: 24 },
  fieldLabel:        { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", letterSpacing: 1.1, marginBottom: 8 },
  input: {
    backgroundColor: colors.white,
    borderRadius:    14,
    padding:         14,
    fontSize:        15,
    color:           colors.navy,
  },
  prefRow:           { flexDirection: "row", gap: 10, marginBottom: 10 },
  prefCard: {
    flex:            1,
    backgroundColor: colors.white,
    borderRadius:    14,
    paddingVertical: 14,
    alignItems:      "center",
    gap:             6,
    shadowColor:     "#000",
    shadowOpacity:   0.05,
    shadowRadius:    6,
    elevation:       2,
  },
  prefCardSelected:  { backgroundColor: colors.amber },
  prefLabel:         { color: colors.slate, fontSize: 11, fontWeight: "600", textAlign: "center" },
  prefLabelSelected: { color: colors.navy },
});
