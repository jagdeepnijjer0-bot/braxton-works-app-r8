import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, X } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";
import { Button } from "@/components/ui/Button";

export default function DescriptionScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();

  const canContinue = inquiry.description.trim().length > 0;

  const removePhoto = (index: number) => {
    const photos = inquiry.photos.filter((_, i) => i !== index);
    setInquiry({ ...inquiry, photos });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={2} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.6)" size={20} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Describe the {inquiry.type === "issue" ? "issue" : "project"}</Text>
        <Text style={styles.sub}>The more detail, the better</Text>

        <Text style={styles.fieldLabel}>DESCRIPTION</Text>
        <TextInput
          value={inquiry.description}
          onChangeText={(v) => setInquiry({ ...inquiry, description: v })}
          placeholder={
            inquiry.type === "issue"
              ? "E.g., The kitchen tap has been dripping..."
              : "E.g., Looking to renovate the kitchen..."
          }
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={styles.textarea}
        />

        <Text style={styles.fieldLabel}>PHOTOS (OPTIONAL)</Text>
        <View style={styles.photoGrid}>
          {inquiry.photos.map((uri, i) => (
            <View key={i} style={styles.photoWrap}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(i)}>
                <X color={colors.white} size={12} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addPhoto}
            onPress={() => {
              // Camera/image picker would be wired here in production
            }}
            activeOpacity={0.85}
          >
            <View style={styles.addPhotoIcon}>
              <Camera color={colors.amber} size={22} />
            </View>
            <Text style={styles.addPhotoLabel}>Add photo</Text>
          </TouchableOpacity>
        </View>

        <Button
          label="Continue"
          onPress={() => router.push("/inquiry/urgency")}
          disabled={!canContinue}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.navy },
  back:          { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText:      { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },
  content:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  title:         { color: colors.white, fontSize: 24, fontWeight: "700", marginBottom: 6 },
  sub:           { color: "rgba(255,255,255,0.55)", fontSize: 15, marginBottom: 24 },
  fieldLabel:    { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", letterSpacing: 1.1, marginBottom: 8 },
  textarea: {
    backgroundColor: colors.white,
    borderRadius:    14,
    padding:         14,
    fontSize:        15,
    color:           colors.navy,
    height:          140,
    marginBottom:    24,
  },
  photoGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  photoWrap:     { position: "relative" },
  photo:         { width: 90, height: 90, borderRadius: 12 },
  removeBtn: {
    position:        "absolute",
    top:             6,
    right:           6,
    backgroundColor: "rgba(15,23,42,0.7)",
    borderRadius:    10,
    width:           22,
    height:          22,
    alignItems:      "center",
    justifyContent:  "center",
  },
  addPhoto: {
    width:           90,
    height:          90,
    borderRadius:    12,
    backgroundColor: colors.white,
    alignItems:      "center",
    justifyContent:  "center",
    gap:             6,
    shadowColor:     "#000",
    shadowOpacity:   0.06,
    shadowRadius:    6,
    elevation:       2,
  },
  addPhotoIcon:  { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center" },
  addPhotoLabel: { color: colors.slate, fontSize: 11, fontWeight: "500" },
});
