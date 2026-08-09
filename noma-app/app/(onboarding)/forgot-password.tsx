// app/(onboarding)/forgot-password.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import client from '@/src/api/client';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#f8f8f8', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', error: '#dc2626',
};

type Step = 'phone' | 'otp' | 'password';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep]         = useState<Step>('phone');
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef<TextInput[]>([]);

  // ── Resend countdown timer ─────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: Request OTP ────────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      Alert.alert('Enter your phone number');
      return;
    }
    setLoading(true);
    try {
      await client.post('/password/request-otp', { phone });
      setStep('otp');
      startResendTimer();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      Alert.alert('Enter the 6-digit code sent to your phone');
      return;
    }
    setLoading(true);
    try {
      await client.post('/password/verify-otp', { phone, otp: otpString });
      setStep('password');
    } catch (err: any) {
      Alert.alert('Invalid code', err.response?.data?.error?.message || 'Wrong or expired OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await client.post('/password/reset-password', {
        phone,
        otp: otp.join(''),
        newPassword,
      });
      Alert.alert(
        'Password reset!',
        'Your password has been updated. Please log in.',
        [{ text: 'Log in', onPress: () => router.replace('/(onboarding)/login') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handler ──────────────────────────────────────────────────────
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-advance to next box
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 filled
    if (newOtp.every(d => d !== '') && index === 5) {
      handleVerifyOtp();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => step === 'phone' ? router.back() : setStep(step === 'password' ? 'otp' : 'phone')}
          >
            <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Forgot Password</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {(['phone', 'otp', 'password'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <View style={[
                styles.stepDot,
                step === s && styles.stepDotActive,
                (step === 'otp' && i === 0) ||
                (step === 'password' && i <= 1) ? styles.stepDotDone : null,
              ]}>
                {((step === 'otp' && i === 0) || (step === 'password' && i <= 1)) ? (
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                ) : (
                  <Text style={[styles.stepDotText, step === s && { color: COLORS.white }]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < 2 && <View style={[styles.stepLine, i < ['phone', 'otp', 'password'].indexOf(step) && styles.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* ── STEP 1: Phone ──────────────────────────────────────────────── */}
          {step === 'phone' && (
            <>
              <Text style={styles.stepTitle}>Enter your phone number</Text>
              <Text style={styles.stepDesc}>
                We'll send a 6-digit verification code to this number.
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. 08012345678"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.65 }]}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.primaryBtnText}>Send OTP</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 2: OTP ────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <Text style={styles.stepTitle}>Enter verification code</Text>
              <Text style={styles.stepDesc}>
                A 6-digit code was sent to {phone}
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { if (ref) otpRefs.current[i] = ref; }}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={v => handleOtpChange(v.slice(-1), i)}
                    onKeyPress={e => handleOtpKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={i === 0}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.65 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.primaryBtnText}>Verify Code</Text>
                }
              </TouchableOpacity>

              {/* Resend */}
              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Didn't receive it? </Text>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={() => { handleRequestOtp(); }}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* ── STEP 3: New Password ────────────────────────────────────────── */}
          {step === 'password' && (
            <>
              <Text style={styles.stepTitle}>Create new password</Text>
              <Text style={styles.stepDesc}>
                Choose a strong password you haven't used before.
              </Text>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputField, { flex: 1 }]}
                  placeholder="New password (min 6 characters)"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.65 }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.primaryBtnText}>Reset Password</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },

  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, paddingHorizontal: 40,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: COLORS.border, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  stepDotDone:   { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  stepDotText:   { fontSize: 12, fontWeight: '700', color: COLORS.textLight },
  stepLine:      { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 6 },
  stepLineDone:  { backgroundColor: COLORS.primary },

  content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },

  stepTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  stepDesc:  { fontSize: 14, color: COLORS.textLight, lineHeight: 20, marginBottom: 28 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.white, paddingHorizontal: 14, marginBottom: 20,
  },
  inputIcon:  { marginRight: 8 },
  inputField: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.textDark },

  otpRow:     { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 24 },
  otpBox: {
    width: 48, height: 56, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white, fontSize: 22, fontWeight: '700', color: COLORS.textDark,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },

  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  resendRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendLabel: { fontSize: 13, color: COLORS.textLight },
  resendTimer: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  resendLink:  { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
});