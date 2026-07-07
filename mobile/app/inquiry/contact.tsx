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
  { id: "phone",  label: "Phone call",     icon: Phone         },
  { id: "text",   label: "Text message",   icon: MessageSquare },
  { id: "in-app", label: "In-app message", icon: Mail          },
];

export default function ContactScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();

  const canContinue = inquiry.name.trim() && inquiry.address.trim() && inquiry.phone.trim() && inquiry.contactPreference;

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={4} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Your contact{"\n"}details</Text>
        <Text style={styles.sub}>How can we reach you?</Text>

        {[
          { label: "NAME",         key: "name"    as const, placeholder: "Your full name",    kb: "default"   },
          { label: "ADDRESS",      key: "address" as const, placeholder: "Property address",  kb: "default"   },
          { label: "PHONE NUMBER", key: "phone"   as const, placeholder: "Your phone number", kb: "phone-pad" },
        ].map(({ label, key, placeholder, kb }) => (
          <View key={key} style={{ marginBottom: 22 }}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              value={inquiry[key]}
              onChangeText={(v) => setInquiry({ ...inquiry, [key]: v })}
              placeholder={placeholder}
              placeholderTextColor="rgba(15,23,42,0.35)"
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
                activeOpacity={0.82}
              >
                <View style={[styles.prefIconBox, isSelected && styles.prefIconBoxSelected]}>
                  <Icon color={isSelected ? colors.navy : colors.amber} size={18} strokeWidth={2} />
                </View>
                <Text style={[styles.prefLabel, isSelected && styles.prefLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          label="Submit Inquiry"
          onPress={() => router.push("/inquiry/auth-gate")}
          disabled={!canContinue}
          style={{ marginTop: 28 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.navy },
  back:               { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:           { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  content:            { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 40 },
  title:              { color: colors.white, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  sub:                { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "500", marginBottom: 32 },
  fieldLabel:         { color: colors.amber, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  input: {
    backgroundColor:  colors.white,
    borderRadius:     18,
    paddingHorizontal: 18,
    paddingVertical:  16,
    fontSize:         15,
    color:            colors.navy,
    fontWeight:       "500",
    shadowColor:      "#000",
    shadowOpacity:    0.08,
    shadowRadius:     10,
    shadowOffset:     { width: 0, height: 4 },
    elevation:        3,
  },
  prefRow:            { flexDirection: "row", gap: 10, marginBottom: 10 },
  prefCard: {
    flex:             1,
    backgroundColor:  colors.white,
    borderRadius:     16,
    paddingVertical:  16,
    alignItems:       "center",
    gap:              8,
    shadowColor:      "#000",
    shadowOpacity:    0.07,
    shadowRadius:     8,
    shadowOffset:     { width: 0, height: 3 },
    elevation:        2,
  },
  prefCardSelected:   { backgroundColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.3 },
  prefIconBox:        { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center" },
  prefIconBoxSelected:{ backgroundColor: "rgba(15,23,42,0.12)" },
  prefLabel:          { color: colors.slate, fontSize: 11, fontWeight: "700", textAlign: "center" },
  prefLabelSelected:  { color: colors.navy },
});
