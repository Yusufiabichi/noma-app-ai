import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    location: "",
    password: "",
  });

  const router = useRouter();

  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.phone || !formData.password) {
      setError("Phone number and password are required");
      return false;
    }

    if (!isLogin) {
      if (!formData.fullName || !formData.location) {
        setError("Please fill in all required fields");
        return false;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      // Simulated API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (isLogin) {
        console.log("Login successful:", formData.phone);
        Alert.alert("Success", "Logged in successfully");
        router.push("/(tabs)");  
      } else {
        console.log("Account created:", formData);
        Alert.alert("Success", "Account created successfully");
        router.push("/(tabs)");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/nomaapplogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* <Text style={styles.appTitle}>NomaApp AI</Text> */}
        </View>

        {/* Auth Title */}
        <Text style={styles.title}>
          {isLogin ? "Sign in to your account" : "Create your account"}
        </Text>

        <Text style={styles.subtitle}>
          {isLogin ? "Don’t have an account? " : "Already have an account? "}
          <Text
            style={styles.linkText}
            onPress={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </Text>
        </Text>

        {/* Error Message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Form Inputs */}
        {!isLogin && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.fullName}
              onChangeText={(text) => handleChange("fullName", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Location"
              value={formData.location}
              onChangeText={(text) => handleChange("location", text)}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={formData.phone}
          onChangeText={(text) => handleChange("phone", text)}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => handleChange("password", text)}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && { opacity: 0.7 }]}
          disabled={isLoading}
          onPress={handleSubmit}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? "Sign In" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>

        {isLogin && (
          <Text
            style={[styles.linkText, { marginTop: 16 }]}
            onPress={() => Alert.alert("Forgot Password", "Reset feature coming soon.")}
          >
            Forgot your password?
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: "#f3fdf6",
  },
  logoContainer: {
    alignItems: "center",
    // marginBottom: 5,
  },
  logo: {
    width: 350,
    height: 300,
  },
  // appTitle: {
  //   fontSize: 20,
  //   fontWeight: "700",
  //   color: "#16A34A",
  //   marginTop: 0,
  // },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#4b5563",
    marginBottom: 5,
  },
  linkText: {
    color: "#16a34a",
    fontWeight: "600",
  },
  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
