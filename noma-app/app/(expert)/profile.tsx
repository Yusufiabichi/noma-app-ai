import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveExpertProfile } from "@/src/api/expert.api";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
};

const SPECIALIZATIONS = [
  { label: "Maize",      value: "maize"      },
  { label: "Rice",       value: "rice"       },
  { label: "Tomato",     value: "tomato"     },
  { label: "Cassava",    value: "cassava"    },
  { label: "Yam",        value: "yam"        },
  { label: "Sorghum",    value: "sorghum"    },
  { label: "Cowpea",     value: "cowpea"     },
  { label: "Soybean",    value: "soybean"    },
  { label: "Vegetables", value: "vegetables" },
  { label: "Fruits",     value: "fruits"     },
  { label: "General",    value: "general"    },
];

const ROLES = [
  { label: "Extension Officer",         value: "extension_officer"       },
  { label: "Agronomist",                value: "agronomist"              },
  { label: "Plant Pathologist",         value: "plant_pathologist"       },
  { label: "Researcher",                value: "researcher"              },
  { label: "University Lecturer",       value: "university_lecturer"     },
  { label: "NGO Worker",                value: "ngo_worker"              },
  { label: "Agribusiness Professional", value: "agribusiness_professional"},
  { label: "Other",                     value: "other"                   },
];

const ProfileFormScreen = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    specializations:     [] as string[],
    yearsOfExperience:   "",
    currentOrganization: "",
    currentRole:         "",
    bio:                 "",
    linkedIn:            "",
  });
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showRoleList, setShowRoleList] = useState(false);

  const toggleSpecialization = (value: string) => {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter((s) => s !== value)
        : [...prev.specializations, value],
    }));
    setErrors((e) => ({ ...e, specializations: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.specializations.length)   e.specializations   = "Select at least one crop";
    if (!form.yearsOfExperience)        e.yearsOfExperience = "Required";
    if (!form.currentOrganization.trim()) e.currentOrganization = "Required";
    if (!form.currentRole)              e.currentRole       = "Select a role";
    if (!form.bio.trim())               e.bio               = "Please write a short bio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await saveExpertProfile({
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience),
      });
      Alert.alert(
        "Profile saved!",
        "Move on to Stage 2 — document upload.",
        [{ text: "Next", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleLabel =
    ROLES.find((r) => r.value === form.currentRole)?.label || "Select your role";

  return (
    <View style={styles.container}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Stage 1 · Professional Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            This helps farmers know who they are consulting. Be detailed and accurate.
          </Text>
        </View>

        {/* Specializations */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Crop Specializations <Text style={styles.required}>*</Text></Text>
          <Text style={styles.hint}>Select all crops you can diagnose confidently</Text>
          <View style={styles.chipGrid}>
            {SPECIALIZATIONS.map((s) => {
              const selected = form.specializations.includes(s.value);
              return (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.specChip, selected && styles.specChipSelected]}
                  onPress={() => toggleSpecialization(s.value)}
                >
                  <Text style={[styles.specChipText, selected && styles.specChipTextSelected]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.specializations ? (
            <Text style={styles.errorText}>{errors.specializations}</Text>
          ) : null}
        </View>

        {/* Role */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Current Role <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.currentRole && styles.inputError,
              { justifyContent: "space-between" }]}
            onPress={() => setShowRoleList(!showRoleList)}
          >
            <Text style={[styles.inputText, !form.currentRole && { color: COLORS.textLight }]}>
              {selectedRoleLabel}
            </Text>
            <Ionicons
              name={showRoleList ? "chevron-up" : "chevron-down"}
              size={16}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
          {showRoleList && (
            <View style={styles.dropdown}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.dropdownItem,
                    form.currentRole === r.value && styles.dropdownItemSelected]}
                  onPress={() => {
                    setForm((f) => ({ ...f, currentRole: r.value }));
                    setErrors((e) => ({ ...e, currentRole: "" }));
                    setShowRoleList(false);
                  }}
                >
                  <Text style={[styles.dropdownText,
                    form.currentRole === r.value && styles.dropdownTextSelected]}>
                    {r.label}
                  </Text>
                  {form.currentRole === r.value && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.currentRole ? (
            <Text style={styles.errorText}>{errors.currentRole}</Text>
          ) : null}
        </View>

        {/* Organization */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Current Organization <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, errors.currentOrganization && styles.inputError]}>
            <Ionicons name="business-outline" size={16} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Institute for Agricultural Research"
              placeholderTextColor={COLORS.textLight}
              value={form.currentOrganization}
              onChangeText={(v) => {
                setForm((f) => ({ ...f, currentOrganization: v }));
                setErrors((e) => ({ ...e, currentOrganization: "" }));
              }}
            />
          </View>
          {errors.currentOrganization ? (
            <Text style={styles.errorText}>{errors.currentOrganization}</Text>
          ) : null}
        </View>

        {/* Years of Experience */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Years of Experience <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, errors.yearsOfExperience && styles.inputError]}>
            <Ionicons name="time-outline" size={16} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 7"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
              value={form.yearsOfExperience}
              onChangeText={(v) => {
                setForm((f) => ({ ...f, yearsOfExperience: v }));
                setErrors((e) => ({ ...e, yearsOfExperience: "" }));
              }}
            />
          </View>
          {errors.yearsOfExperience ? (
            <Text style={styles.errorText}>{errors.yearsOfExperience}</Text>
          ) : null}
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Bio <Text style={styles.required}>*</Text></Text>
          <Text style={styles.hint}>Max 500 characters. Describe your expertise.</Text>
          <TextInput
            style={[styles.textArea, errors.bio && styles.inputError]}
            placeholder="e.g. 7 years diagnosing maize and rice diseases across Northern Nigeria as an extension officer with NAERLS..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            maxLength={500}
            value={form.bio}
            onChangeText={(v) => {
              setForm((f) => ({ ...f, bio: v }));
              setErrors((e) => ({ ...e, bio: "" }));
            }}
          />
          <Text style={styles.charCount}>{form.bio.length}/500</Text>
          {errors.bio ? <Text style={styles.errorText}>{errors.bio}</Text> : null}
        </View>

        {/* LinkedIn (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>LinkedIn Profile <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="logo-linkedin" size={16} color="#0077B5" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="https://linkedin.com/in/yourname"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="none"
              keyboardType="url"
              value={form.linkedIn}
              onChangeText={(v) => setForm((f) => ({ ...f, linkedIn: v }))}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.65 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Save & Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
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
  backBtn:   {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  navTitle:  { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  content:   { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  infoBanner:{
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.primaryLight, borderWidth: 1,
    borderColor: COLORS.primaryBorder, borderRadius: 10, padding: 12, marginBottom: 20,
  },
  infoText:  { flex: 1, fontSize: 12, color: "#15803d", lineHeight: 17 },
  fieldGroup:{ marginBottom: 20 },
  label:     { fontSize: 13, fontWeight: "600", color: COLORS.textDark, marginBottom: 5 },
  required:  { color: COLORS.error },
  optional:  { color: COLORS.textLight, fontWeight: "400" },
  hint:      { fontSize: 11, color: COLORS.textLight, marginBottom: 8 },
  chipGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specChip:  {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14, backgroundColor: COLORS.white,
  },
  specChipSelected:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  specChipText:         { fontSize: 13, color: COLORS.textDark, fontWeight: "500" },
  specChipTextSelected: { color: COLORS.white },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, backgroundColor: COLORS.white, paddingHorizontal: 12,
  },
  inputIcon:   { marginRight: 8 },
  inputField:  { flex: 1, paddingVertical: 13, fontSize: 14, color: COLORS.textDark },
  inputText:   { flex: 1, paddingVertical: 13, fontSize: 14, color: COLORS.textDark },
  inputError:  { borderColor: COLORS.error },
  dropdown: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, marginTop: 4, overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: { backgroundColor: COLORS.primaryLight },
  dropdownText:         { fontSize: 14, color: COLORS.textDark },
  dropdownTextSelected: { color: COLORS.primary, fontWeight: "600" },
  textArea: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    backgroundColor: COLORS.white, padding: 12,
    fontSize: 14, color: COLORS.textDark, minHeight: 110, textAlignVertical: "top",
  },
  charCount:  { fontSize: 11, color: COLORS.textLight, textAlign: "right", marginTop: 4 },
  errorText:  { fontSize: 12, color: COLORS.error, marginTop: 4, fontWeight: "500" },
  submitBtn:  {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 15, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
});

export default ProfileFormScreen;