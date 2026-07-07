import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Image, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, X, Image as ImageIcon } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";
import { Button } from "@/components/ui/Button";
import * as ImagePicker from "expo-image-picker";

export default function DescriptionScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();

  const canContinue = inquiry.description.trim().length > 0;

  const removePhoto = (index: number) => {
    const photos = inquiry.photos.filter((_, i) => i !== index);
    setInquiry({ ...inquiry, photos });
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to add photos to your inquiry.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setInquiry({ ...inquiry, photos: [...inquiry.photos, result.assets[0].uri] });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take a photo for your inquiry.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setInquiry({ ...inquiry, photos: [...inquiry.photos, result.assets[0].uri] });
    }
  };

  const addPhoto = () => {
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Camera Roll", onPress: pickPhoto },
      { text: "Take Photo",  onPress: takePhoto },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={2} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {inquiry.type === "issue" ? "Describe the\nissue" : "Describe the\nproject"}
        </Text>
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
          placeholderTextColor="rgba(15,23,42,0.35)"
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
          {inquiry.photos.length < 5 && (
            <TouchableOpacity style={styles.addPhoto} onPress={addPhoto} activeOpacity={0.85}>
              <View style={styles.addPhotoIcon}>
                <Camera color={colors.amber} size={22} />
              </View>
              <Text style={styles.addPhotoLabel}>Add photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {inquiry.photos.length > 0 && (
          <Text style={styles.photoCount}>{inquiry.photos.length} photo{inquiry.photos.length !== 1 ? "s" : ""} added</Text>
        )}

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
  back:          { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:      { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  content:       { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 40 },
  title:         { color: colors.white, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  sub:           { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "500", marginBottom: 32 },
  fieldLabel:    { color: colors.amber, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  textarea: {
    backgroundColor: colors.white,
    borderRadius:    18,
    padding:         18,
    fontSize:        15,
    color:           colors.navy,
    height:          148,
    marginBottom:    28,
    fontWeight:      "500",
    shadowColor:     "#000",
    shadowOpacity:   0.08,
    shadowRadius:    10,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       3,
  },
  photoGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  photoWrap:     { position: "relative" },
  photo:         { width: 90, height: 90, borderRadius: 14 },
  removeBtn: {
    position:        "absolute",
    top:             6,
    right:           6,
    backgroundColor: "rgba(15,23,42,0.75)",
    borderRadius:    10,
    width:           22,
    height:          22,
    alignItems:      "center",
    justifyContent:  "center",
  },
  addPhoto: {
    width:           90,
    height:          90,
    borderRadius:    14,
    backgroundColor: colors.white,
    alignItems:      "center",
    justifyContent:  "center",
    gap:             6,
    shadowColor:     "#000",
    shadowOpacity:   0.08,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       2,
  },
  addPhotoIcon:  { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center" },
  addPhotoLabel: { color: colors.slate, fontSize: 11, fontWeight: "700" },
  photoCount:    { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600", marginBottom: 20 },
});
