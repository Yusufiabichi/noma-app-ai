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
} from "react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "@/src/context/LanguageContext";
import { register } from "@/src/api/auth.api";

const COLORS = {
  primary: "#16A34A",
  background: "#f8f8f8",
  white: "#ffffff",
  textDark: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  error: "#dc2626",
};

const ROLES = [
  { id: 1, label: "Farmer", value: "farmer" },
  { id: 2, label: "Expert", value: "expert" },
  { id: 3, label: "Supplier", value: "supplier" },
];

const SignupScreen = () => {
  const router = useRouter();
  const { completeOnboarding } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
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
      // const response = await register({
      //   name: formData.name,
      //   phone: formData.phone,
      //   password: formData.password,
      //   role: formData.role,
      // });

      // if (response.token) {
        Alert.alert("Success", "Account created successfully!");
        await completeOnboarding();
        router.replace("/(tabs)");
      // }
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      Alert.alert("Error", errorMessage);
      setErrors({ phone: errorMessage });
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

  const selectedRoleLabel = ROLES.find(r => r.value === formData.role)?.label || "Select Role";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join thousands of farmers improving their harvest
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                errors.name && styles.inputError,
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="words"
              value={formData.name}
              onChangeText={(text) => handleInputChange("name", text)}
              editable={!loading}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[
                styles.input,
                errors.phone && styles.inputError,
              ]}
              placeholder="Enter your phone number"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              editable={!loading}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                errors.password && styles.inputError,
              ]}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => handleInputChange("password", text)}
              editable={!loading}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Role Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Role</Text>
            <TouchableOpacity
              style={[
                styles.input,
                errors.role && styles.inputError,
                { justifyContent: "center" },
              ]}
              onPress={() => setShowRoleModal(true)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.roleText,
                  !formData.role && { color: COLORS.textLight },
                ]}
              >
                {selectedRoleLabel}
              </Text>
            </TouchableOpacity>
            {errors.role && (
              <Text style={styles.errorText}>{errors.role}</Text>
            )}
          </View>

          {/* Role Modal */}
          <Modal
            visible={showRoleModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRoleModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Role</Text>
                <FlatList
                  data={ROLES}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.roleOption}
                      onPress={() => handleRoleSelect(item.value)}
                    >
                      <Text style={styles.roleOptionText}>{item.label}</Text>
                      {formData.role === item.value && (
                        <Text style={styles.checkmark}>✓</Text>
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

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Signup - Placeholder */}
          <TouchableOpacity
            style={styles.socialButton}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.signinContainer}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.signinLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
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
  roleText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roleOptionText: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  checkmark: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  socialButtonText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: "600",
  },
  signinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signinText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  signinLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default SignupScreen;
