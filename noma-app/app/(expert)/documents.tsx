import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { uploadExpertDocuments } from "@/src/api/expert.api";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  amber: "#d97706", amberLight: "#fffbeb",
};

const GOV_ID_TYPES = [
  { label: "National Identification Number (NIN)", value: "NIN"      },
  { label: "National ID Card",                     value: "NationalID"},
  { label: "Driver's License",                     value: "DriversLicense" },
  { label: "International Passport",               value: "Passport"  },
  { label: "Voter's Card",                         value: "VotersCard"},
];

const PROF_DOC_TYPES = [
  { label: "Agricultural Degree Certificate",          value: "Degree"              },
  { label: "Agronomy Certificate",                     value: "AgronomyCert"        },
  { label: "Plant Pathology Certificate",              value: "PlantPathologyCert"  },
  { label: "Extension Officer Appointment Letter",     value: "AppointmentLetter"   },
  { label: "Agricultural Body Membership Certificate", value: "MembershipCert"      },
  { label: "Employment Letter (Farm/University/NGO)",  value: "EmploymentLetter"    },
];

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

const DocumentUploadScreen = () => {
  const router = useRouter();
  const [govIdType,   setGovIdType]   = useState("");
  const [profDocType, setProfDocType] = useState("");
  const [govIdFile,   setGovIdFile]   = useState<PickedFile | null>(null);
  const [profDocFile, setProfDocFile] = useState<PickedFile | null>(null);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showGovDropdown,  setShowGovDropdown]  = useState(false);
  const [showProfDropdown, setShowProfDropdown] = useState(false);

  const pickFile = async (
    setter: (f: PickedFile) => void,
    fieldName: string
  ) => {
    Alert.alert(
      "Select file",
      "Choose how to upload your document",
      [
        {
          text: "Camera",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.85,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setter({
                uri:      asset.uri,
                name:     asset.fileName || "photo.jpg",
                mimeType: asset.mimeType || "image/jpeg",
              });
              setErrors((e) => ({ ...e, [fieldName]: "" }));
            }
          },
        },
        {
          text: "Gallery / Files",
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: ["image/jpeg", "image/png", "application/pdf"],
              copyToCacheDirectory: true,
            });
            if (result.canceled === false && result.assets[0]) {
              const asset = result.assets[0];
              setter({
                uri:      asset.uri,
                name:     asset.name,
                mimeType: asset.mimeType || "application/pdf",
                size:     asset.size,
              });
              setErrors((e) => ({ ...e, [fieldName]: "" }));
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!govIdType)   e.govIdType   = "Select ID type";
    if (!govIdFile)   e.govIdFile   = "Upload your government ID";
    if (!profDocType) e.profDocType = "Select document type";
    if (!profDocFile) e.profDocFile = "Upload your professional document";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("govIdType",        govIdType);
      formData.append("professionalDocType", profDocType);
      formData.append("governmentId", {
        uri:  govIdFile!.uri,
        name: govIdFile!.name,
        type: govIdFile!.mimeType,
      } as any);
      formData.append("professionalDoc", {
        uri:  profDocFile!.uri,
        name: profDocFile!.name,
        type: profDocFile!.mimeType,
      } as any);

      await uploadExpertDocuments(formData);

      Alert.alert(
        "Documents submitted!",
        "Our team will review your documents within 48 hours. You'll be notified when approved.",
        [{ text: "Back to Dashboard", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Upload failed", err.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const FilePreview = ({
    file, label, onRemove
  }: { file: PickedFile; label: string; onRemove: () => void }) => (
    <View style={styles.filePreview}>
      {file.mimeType?.startsWith("image/") ? (
        <Image source={{ uri: file.uri }} style={styles.fileThumb} />
      ) : (
        <View style={styles.pdfThumb}>
          <Ionicons name="document-text" size={24} color={COLORS.error} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
        {file.size && (
          <Text style={styles.fileSize}>
            {(file.size / 1024).toFixed(0)} KB
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onRemove}>
        <Ionicons name="close-circle" size={22} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  const DropdownSelector = ({
    value, options, visible, onToggle, onSelect, placeholder, error
  }: {
    value: string; options: { label: string; value: string }[];
    visible: boolean; onToggle: () => void;
    onSelect: (v: string) => void; placeholder: string; error?: string;
  }) => {
    const selected = options.find((o) => o.value === value)?.label;
    return (
      <View>
        <TouchableOpacity
          style={[styles.inputWrapper, error && styles.inputError,
            { justifyContent: "space-between" }]}
          onPress={onToggle}
        >
          <Text style={[styles.inputText, !value && { color: COLORS.textLight }]}>
            {selected || placeholder}
          </Text>
          <Ionicons name={visible ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textLight} />
        </TouchableOpacity>
        {visible && (
          <View style={styles.dropdown}>
            {options.map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[styles.dropdownItem, value === o.value && styles.dropdownItemSelected]}
                onPress={() => { onSelect(o.value); }}
              >
                <Text style={[styles.dropdownText, value === o.value && styles.dropdownTextSelected]}>
                  {o.label}
                </Text>
                {value === o.value && (
                  <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Stage 2 · Document Verification</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning */}
        <View style={styles.warningBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.amber} />
          <Text style={styles.warningText}>
            Upload clear, legible documents. Blurry or incomplete uploads will be rejected.
            Files must be JPG, PNG, or PDF — max 5MB each.
          </Text>
        </View>

        {/* Section 1: Government ID */}
        <Text style={styles.sectionTitle}>
          1. Government-Issued ID <Text style={styles.required}>*</Text>
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>ID Type</Text>
          <DropdownSelector
            value={govIdType}
            options={GOV_ID_TYPES}
            visible={showGovDropdown}
            onToggle={() => {
              setShowGovDropdown(!showGovDropdown);
              setShowProfDropdown(false);
            }}
            onSelect={(v) => {
              setGovIdType(v);
              setErrors((e) => ({ ...e, govIdType: "" }));
              setShowGovDropdown(false);
            }}
            placeholder="Select ID type"
            error={errors.govIdType}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Upload ID Document</Text>
          {govIdFile ? (
            <FilePreview
              file={govIdFile}
              label="Government ID"
              onRemove={() => setGovIdFile(null)}
            />
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, errors.govIdFile && styles.uploadBoxError]}
              onPress={() => pickFile(setGovIdFile, "govIdFile")}
            >
              <Ionicons name="cloud-upload-outline" size={28} color={COLORS.textLight} />
              <Text style={styles.uploadLabel}>Tap to upload</Text>
              <Text style={styles.uploadHint}>JPG, PNG or PDF · Max 5MB</Text>
            </TouchableOpacity>
          )}
          {errors.govIdFile ? (
            <Text style={styles.errorText}>{errors.govIdFile}</Text>
          ) : null}
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Section 2: Professional Document */}
        <Text style={styles.sectionTitle}>
          2. Professional Credential <Text style={styles.required}>*</Text>
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Document Type</Text>
          <DropdownSelector
            value={profDocType}
            options={PROF_DOC_TYPES}
            visible={showProfDropdown}
            onToggle={() => {
              setShowProfDropdown(!showProfDropdown);
              setShowGovDropdown(false);
            }}
            onSelect={(v) => {
              setProfDocType(v);
              setErrors((e) => ({ ...e, profDocType: "" }));
              setShowProfDropdown(false);
            }}
            placeholder="Select document type"
            error={errors.profDocType}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Upload Professional Document</Text>
          {profDocFile ? (
            <FilePreview
              file={profDocFile}
              label="Professional Doc"
              onRemove={() => setProfDocFile(null)}
            />
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, errors.profDocFile && styles.uploadBoxError]}
              onPress={() => pickFile(setProfDocFile, "profDocFile")}
            >
              <Ionicons name="cloud-upload-outline" size={28} color={COLORS.textLight} />
              <Text style={styles.uploadLabel}>Tap to upload</Text>
              <Text style={styles.uploadHint}>JPG, PNG or PDF · Max 5MB</Text>
            </TouchableOpacity>
          )}
          {errors.profDocFile ? (
            <Text style={styles.errorText}>{errors.profDocFile}</Text>
          ) : null}
        </View>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.privacyText}>
            Your documents are encrypted and only accessible to NomaApp's verification team.
            They will not be shared with third parties.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.65 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit for Review</Text>
              <Ionicons name="send-outline" size={18} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  navHeader:  {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:    {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  navTitle:   { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  content:    { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  warningBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.amberLight, borderWidth: 1,
    borderColor: "#fde68a", borderRadius: 10, padding: 12, marginBottom: 22,
  },
  warningText:    { flex: 1, fontSize: 12, color: COLORS.amber, lineHeight: 18 },
  sectionTitle:   { fontSize: 14, fontWeight: "700", color: COLORS.textDark, marginBottom: 14 },
  required:       { color: COLORS.error },
  sectionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 24 },
  fieldGroup:     { marginBottom: 16 },
  label:          { fontSize: 13, fontWeight: "600", color: COLORS.textDark, marginBottom: 7 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, backgroundColor: COLORS.white,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  inputText:  { flex: 1, fontSize: 14, color: COLORS.textDark },
  inputError: { borderColor: COLORS.error },
  dropdown: {
    backgroundColor: COLORS.white, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 10,
    marginTop: 4, overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: { backgroundColor: COLORS.primaryLight },
  dropdownText:         { fontSize: 13, color: COLORS.textDark, flex: 1 },
  dropdownTextSelected: { color: COLORS.primary, fontWeight: "600" },
  uploadBox: {
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: "dashed",
    borderRadius: 12, padding: 28,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  uploadBoxError: { borderColor: COLORS.error },
  uploadLabel:    { fontSize: 14, fontWeight: "600", color: COLORS.textDark, marginTop: 8 },
  uploadHint:     { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
  filePreview: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 10, padding: 12,
  },
  fileThumb:  { width: 44, height: 44, borderRadius: 8 },
  pdfThumb: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center",
  },
  fileName:   { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  fileSize:   { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  privacyNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.background, borderRadius: 8,
    padding: 12, marginBottom: 20,
  },
  privacyText: { flex: 1, fontSize: 11, color: COLORS.textLight, lineHeight: 17 },
  errorText:   { fontSize: 12, color: COLORS.error, marginTop: 4, fontWeight: "500" },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 15, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,
    shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
});

export default DocumentUploadScreen;