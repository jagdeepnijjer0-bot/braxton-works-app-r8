import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Phone, MessageSquare, Mail, Check } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp, type ContactPreference } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";
import { Button } from "@/components/ui/Button";
import { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REMEMBER_KEY  = "remembered_contact";
const REMEMBER_FLAG = "remember_me";

const contactOpts: { id: ContactPreference; label: string; icon: typeof Phone }[] = [
  { id: "phone",  label: "Phone call",     icon: Phone         },
  { id: "text",   label: "Text message",   icon: MessageSquare },
  { id: "in-app", label: "In-app message", icon: Mail          },
];

export default function ContactScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();
  const [rememberMe, setRememberMe] = useState(false);

  const addressRef = useRef<TextInput>(null);
  const phoneRef   = useRef<TextInput>(null);

  // Pre-fill from remembered contact if available
  useEffect(() => {
    AsyncStorage.multiGet([REMEMBER_KEY, REMEMBER_FLAG]).then(([[, saved], [, flag]]) => {
      if (flag === "true" && saved) {
        const { name, address, phone } = JSON.parse(saved);
        setInquiry((prev: any) => ({
          ...prev,
          name:    name    ?? prev.name,
          address: address ?? prev.address,
          phone:   phone   ?? prev.phone,
        }));
        setRememberMe(true);
      }
    }).catch(() => {});
  }, []);

  const canContinue = inquiry.name.trim() && inquiry.address.trim() && inquiry.phone.trim() && inquiry.contactPreference;

  const handleSubmit = async () => {
    if (!canContinue) return;
    Keyboard.dismiss();

    if (rememberMe) {
      await AsyncStorage.multiSet([
        [REMEMBER_KEY,  JSON.stringify({ name: inquiry.name, address: inquiry.address, phone: inquiry.phone })],
        [REMEMBER_FLAG, "true"],
      ]).catch(() => {});
    } else {
      await AsyncStorage.multiRemove([REMEMBER_KEY, REMEMBER_FLAG]).catch(() => {});
    }

    router.push("/inquiry/auth-gate");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={4} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Your contact{"\n"}details</Text>
        <Text style={styles.sub}>How can we reach you?</Text>

        {/* NAME */}
        <View style={{ marginBottom: 22 }}>
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            value={inquiry.name}
            onChangeText={(v) => setInquiry({ ...inquiry, name: v })}
            placeholder="Your full name"
            placeholderTextColor="rgba(15,23,42,0.35)"
            keyboardType="default"
            textContentType="name"
            autoComplete="name"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => addressRef.current?.focus()}
            style={styles.input}
          />
        </View>

        {/* ADDRESS */}
        <View style={{ marginBottom: 22 }}>
          <Text style={styles.fieldLabel}>ADDRESS</Text>
          <TextInput
            ref={addressRef}
            value={inquiry.address}
            onChangeText={(v) => setInquiry({ ...inquiry, address: v })}
            placeholder="Property address"
            placeholderTextColor="rgba(15,23,42,0.35)"
            keyboardType="default"
            textContentType="fullStreetAddress"
            autoComplete="street-address"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            style={styles.input}
          />
        </View>

        {/* PHONE */}
        <View style={{ marginBottom: 22 }}>
          <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
          <TextInput
            ref={phoneRef}
            value={inquiry.phone}
            onChangeText={(v) => setInquiry({ ...inquiry, phone: v })}
            placeholder="Your phone number"
            placeholderTextColor="rgba(15,23,42,0.35)"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            style={styles.input}
          />
        </View>

        {/* CONTACT PREFERENCE */}
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

        {/* REMEMBER ME */}
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberMe((v) => !v)}
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
          accessibilityLabel="Remember my contact details for future enquiries"
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxTicked]}>
            {rememberMe && <Check color={colors.navy} size={13} strokeWidth={3} />}
          </View>
          <Text style={styles.rememberText}>
            Remember my details for future enquiries
          </Text>
        </TouchableOpacity>

        <Button
          label="Submit Enquiry"
          onPress={handleSubmit}
          disabled={!canContinue}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.navy },
  back:               { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:           { color: colors.muted, fontSize: 14, fontWeight: "600" },
  content:            { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 48 },
  title:              { color: colors.white, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  sub:                { color: colors.muted, fontSize: 15, fontWeight: "400", lineHeight: 22, marginBottom: 24 },
  fieldLabel:         { color: colors.amber, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  input: {
    backgroundColor:   colors.white,
    borderRadius:      18,
    paddingHorizontal: 18,
    paddingVertical:   16,
    fontSize:          15,
    color:             colors.navy,
    fontWeight:        "500",
    shadowColor:       "#000",
    shadowOpacity:     0.08,
    shadowRadius:      10,
    shadowOffset:      { width: 0, height: 4 },
    elevation:         3,
  },
  prefRow:             { flexDirection: "row", gap: 10, marginBottom: 10 },
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
  prefCardSelected:    { backgroundColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.3 },
  prefIconBox:         { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center" },
  prefIconBoxSelected: { backgroundColor: "rgba(15,23,42,0.12)" },
  prefLabel:           { color: colors.slate, fontSize: 11, fontWeight: "600", textAlign: "center" },
  prefLabelSelected:   { color: colors.navy },

  rememberRow: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            12,
    marginTop:      20,
    paddingVertical: 4,
  },
  checkbox: {
    width:           22,
    height:          22,
    borderRadius:    6,
    borderWidth:     2,
    borderColor:     "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  checkboxTicked: {
    backgroundColor: colors.amber,
    borderColor:     colors.amber,
  },
  rememberText: {
    color:      "rgba(255,255,255,0.45)",
    fontSize:   13,
    fontWeight: "400",
    lineHeight: 19,
    flex:       1,
  },
});
