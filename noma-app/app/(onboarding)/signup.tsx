import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { register } from "@/src/api/auth.api";
import { setAuthToken } from "@/src/api/client";
import { setUserData } from "@/src/hooks/useAuth";

const COLORS = {
  primary: "#16A34A",
  primaryLight: "#f0fdf4",
  primaryBorder: "#bbf7d0",
  background: "#f8f8f8",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  error: "#dc2626",
};

const ROLES = [
  { id: 1, label: "Farmer", value: "farmer", icon: "leaf-outline" },
  { id: 2, label: "Expert", value: "expert", icon: "school-outline" },
  { id: 3, label: "Supplier", value: "supplier", icon: "storefront-outline" },
];

const SignupScreen = () => {
  const router = useRouter();
  const { completeOnboarding } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    lga: "",
    phone: "",
    password: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    state?: string;
    lga?: string;
    phone?: string;
    password?: string;
    role?: string;
  }>({});
  const [showRoleModal, setShowRoleModal] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.state.trim()) {
        newErrors.state = "State is Required";
    } else if (formData.state.trim().length < 3){
        newErrors.state = "state must be at least 3 characters"
    }
    if (!formData.lga.trim()) {
        newErrors.lga = "LGA is Required";
    } else if (formData.lga.trim().length < 3){
        newErrors.lga = "LGA must be at least 3 characters"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.role) {
      newErrors.role = "Please select a role";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await register({
        name: formData.name,
        state: formData.state,
        lga: formData.lga,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });
      if (response.token) {
        await setAuthToken(response.token);
        if (response.user) {
          await setUserData(response.user);
        }
        await completeOnboarding();
        // Trial starts automatically — go straight to app
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage =
        error.response?.data?.message || "Signup failed. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  };

  const handleRoleSelect = (role: string) => {
    setFormData({ ...formData, role });
    setErrors({ ...errors, role: undefined });
    setShowRoleModal(false);
  };

  const selectedRoleLabel =
    ROLES.find((r) => r.value === formData.role)?.label || "Select your role";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/nomaapplogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Start your free trial</Text>
          <Text style={styles.subtitle}>
            Join thousands of farmers improving their harvest
          </Text>
        </View>

        {/* Trial Badge */}
        <View style={styles.trialBadge}>
          <View style={styles.trialIconWrap}>
            <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.trialTextWrap}>
            <Text style={styles.trialTitle}>7-day free trial</Text>
            <Text style={styles.trialSub}>
              Full access — unlimited scans, expert chat, all features. No card needed.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={COLORS.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="words"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                editable={!loading}
              />
            </View>
            {/* Fixed: was inside Modal before */}
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={COLORS.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange("phone", text)}
                  editable={!loading}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

          {/* State of residence */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>State</Text>
            <View style={[styles.inputWrapper, errors.state && styles.inputError]}>
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Enter your State of residence"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="words"
                value={formData.state}
                onChangeText={(text) => handleInputChange("state", text)}
                editable={!loading}
              />
            </View>
            {/* Fixed: was inside Modal before */}
            {errors.state && (
              <Text style={styles.errorText}>{errors.state}</Text>
            )}
          </View>

          {/* LGA of residence */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>LGA:</Text>
            <View style={[styles.inputWrapper, errors.lga && styles.inputError]}>
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Enter your LGA of residence"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="words"
                value={formData.lga}
                onChangeText={(text) => handleInputChange("lga", text)}
                editable={!loading}
              />
            </View>
            {/* Fixed: was inside Modal before */}
            {errors.state && (
              <Text style={styles.errorText}>{errors.lga}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password && styles.inputError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={COLORS.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textLight}
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Role Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>I am a...</Text>
            <TouchableOpacity
              style={[
                styles.inputWrapper,
                errors.role && styles.inputError,
                { justifyContent: "space-between" },
              ]}
              onPress={() => setShowRoleModal(true)}
              disabled={loading}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={COLORS.textLight}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.inputField,
                    !formData.role && { color: COLORS.textLight },
                  ]}
                >
                  {selectedRoleLabel}
                </Text>
              </View>
              <Ionicons
                name="chevron-down-outline"
                size={18}
                color={COLORS.textLight}
                style={{ marginRight: 4 }}
              />
            </TouchableOpacity>
            {errors.role && (
              <Text style={styles.errorText}>{errors.role}</Text>
            )}
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Google */}
          <TouchableOpacity style={styles.socialButton} disabled={loading}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()} disabled={loading}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Role Modal — outside ScrollView so it overlays properly */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select your role</Text>
            <FlatList
              data={ROLES}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === item.value && styles.roleOptionSelected,
                  ]}
                  onPress={() => handleRoleSelect(item.value)}
                >
                  <View style={styles.roleOptionLeft}>
                    <View
                      style={[
                        styles.roleIconWrap,
                        formData.role === item.value &&
                          styles.roleIconWrapSelected,
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={
                          formData.role === item.value
                            ? COLORS.primary
                            : COLORS.textLight
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === item.value &&
                          styles.roleOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {formData.role === item.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: "left",
    marginBottom: 24,
  },
  logo: {
    width: 180,
    height: 56,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  trialBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  trialIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    flexShrink: 0,
  },
  trialTextWrap: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 3,
  },
  trialSub: {
    fontSize: 12,
    color: "#15803d",
    lineHeight: 17,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.textDark,
  },
  eyeIcon: {
    paddingLeft: 8,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: COLORS.textLight,
    fontSize: 13,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 13,
    backgroundColor: COLORS.white,
  },
  socialButtonText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },
  roleOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconWrapSelected: {
    backgroundColor: "#dcfce7",
  },
  roleOptionText: {
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  roleOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 6,
  },
  modalCloseButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignupScreen;