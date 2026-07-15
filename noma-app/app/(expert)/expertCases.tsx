import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCaseDetail } from '@/src/api/expertChat.api';
import client from '@/src/api/client';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#f8f8f8', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', error: '#dc2626',
  errorLight: '#fef2f2', amber: '#d97706', amberLight: '#fffbeb',
  amberBorder: '#fde68a',
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low:      { color: COLORS.primary, bg: COLORS.primaryLight },
  moderate: { color: COLORS.amber,   bg: COLORS.amberLight   },
  high:     { color: COLORS.error,   bg: COLORS.errorLight   },
  severe:   { color: COLORS.error,   bg: COLORS.errorLight   },
};

const ExpertCaseDetailScreen = () => {
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();

  const [caseData, setCaseData]     = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [response, setResponse]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    if (!caseId) return;
    getCaseDetail(caseId)
      .then(res => {
        setCaseData(res.data.case);
        // Pre-fill if already responded
        if (res.data.case?.expertResponse?.message) {
          setResponse(res.data.case.expertResponse.message);
          setSubmitted(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      Alert.alert('Response required', 'Please write your expert response before submitting.');
      return;
    }
    Alert.alert(
      'Submit Response',
      'Once submitted, the farmer will be notified. Are you ready?',
      [
        { text: 'Review', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await client.patch(`/experts/cases/${caseId}/respond`, {
                message: response.trim(),
              });
              setSubmitted(true);
              Alert.alert(
                'Response sent!',
                'The farmer has been notified of your expert advice.',
                [{ text: 'Back', onPress: () => router.back() }]
              );
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.response?.data?.error?.message || 'Failed to submit response. Please try again.'
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
        <Text style={styles.errorText}>Case not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const snap     = caseData.diagnosisSnapshot || {};
  const sevCfg   = SEVERITY_CONFIG[snap.severity] || SEVERITY_CONFIG.moderate;
  const isPending = caseData.status === 'pending';
  const isResolved = caseData.status === 'resolved';
  const confidence = snap.confidence
    ? `${Math.round(snap.confidence * 100)}%`
    : '—';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Consultation Case</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status banner */}
          {isPending && (
            <View style={styles.pendingBanner}>
              <Ionicons name="alert-circle" size={16} color={COLORS.amber} />
              <Text style={styles.pendingBannerText}>
                This farmer is waiting for your expert response
              </Text>
            </View>
          )}

          {isResolved && (
            <View style={styles.resolvedBanner}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.resolvedBannerText}>This case has been resolved</Text>
            </View>
          )}

          {/* Diagnosis snapshot */}
          <Text style={styles.sectionTitle}>Diagnosis Report</Text>
          <View style={styles.diagnosisCard}>
            <View style={styles.diagnosisHeader}>
              <View style={styles.bugIcon}>
                <Ionicons name="bug-outline" size={18} color={COLORS.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.diseaseName}>
                  {snap.disease?.replace(/_/g, ' ') || 'Unknown disease'}
                </Text>
                <Text style={styles.cropName}>
                  {snap.cropType || '—'}
                </Text>
              </View>
            </View>

            <View style={styles.diagnosisMeta}>
              <View style={[styles.severityPill, { backgroundColor: sevCfg.bg }]}>
                <Ionicons name="warning-outline" size={12} color={sevCfg.color} />
                <Text style={[styles.severityText, { color: sevCfg.color }]}>
                  {snap.severity || '—'} severity
                </Text>
              </View>
              <View style={styles.confidencePill}>
                <Text style={styles.confidenceText}>{confidence} confidence</Text>
              </View>
            </View>
          </View>

          {/* Farmer info */}
          <Text style={styles.sectionTitle}>Farmer</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{caseData.farmer?.name || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{caseData.farmer?.phone || '—'}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Case submitted</Text>
              <Text style={styles.infoValue}>
                {new Date(caseData.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Farmer note */}
          {caseData.farmerNote && (
            <>
              <Text style={styles.sectionTitle}>Farmer's Note</Text>
              <View style={styles.farmerNoteCard}>
                <Ionicons name="chatbubble-outline" size={16} color={COLORS.textLight} style={{ marginRight: 8 }} />
                <Text style={styles.farmerNoteText}>{caseData.farmerNote}</Text>
              </View>
            </>
          )}

          {/* AI Recommendations (so expert can see what the farmer was already given) */}
          {caseData.scan?.diagnosis?.recommendations?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>AI Recommendations Given to Farmer</Text>
              <View style={styles.aiRecsCard}>
                <View style={styles.aiRecsHeader}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
                  <Text style={styles.aiRecsHint}>
                    These are the recommendations the AI already provided. Your response should complement or correct these.
                  </Text>
                </View>
                {caseData.scan.diagnosis.recommendations.map((rec: string, i: number) => (
                  <View key={i} style={styles.aiRecRow}>
                    <View style={styles.aiRecNum}>
                      <Text style={styles.aiRecNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.aiRecText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Expert response */}
          <Text style={styles.sectionTitle}>
            {submitted ? 'Your Response' : 'Write Your Response'}
          </Text>

          {submitted && caseData.expertResponse?.respondedAt && (
            <Text style={styles.respondedAt}>
              Responded on {new Date(caseData.expertResponse.respondedAt).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </Text>
          )}

          <TextInput
            style={[
              styles.responseInput,
              submitted && styles.responseInputSubmitted,
            ]}
            placeholder={
              'Write your expert diagnosis, treatment recommendations, and advice here...\n\nBe specific — mention:\n• What you think the disease is\n• Recommended treatment and dosage\n• Safety precautions\n• Follow-up actions'
            }
            placeholderTextColor={COLORS.textLight}
            multiline
            value={response}
            onChangeText={setResponse}
            editable={!submitted && !submitting}
            textAlignVertical="top"
            onFocus={() => {}}
          />
          <Text style={styles.charCount}>{response.length} characters</Text>

          {/* Submit button */}
          {!submitted && (
            <TouchableOpacity
              style={[styles.submitBtn, (submitting || !response.trim()) && { opacity: 0.6 }]}
              onPress={handleSubmitResponse}
              disabled={submitting || !response.trim()}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>Send Expert Response</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {submitted && (
            <View style={styles.submittedNote}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.submittedNoteText}>
                Response sent. The farmer has been notified.
              </Text>
            </View>
          )}

          {/* Rating — if farmer rated */}
          {caseData.rating && (
            <View style={styles.ratingCard}>
              <Text style={styles.sectionTitle}>Farmer Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons
                    key={s}
                    name={s <= caseData.rating.stars ? 'star' : 'star-outline'}
                    size={20}
                    color={COLORS.amber}
                  />
                ))}
                <Text style={styles.ratingHelpful}>
                  {caseData.rating.helpful ? '· Helpful' : '· Not helpful'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText:        { fontSize: 15, color: COLORS.textDark, fontWeight: '600' },
  backLinkBtn:      { marginTop: 8 },
  backLinkText:     { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

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
  content:  { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.amberLight, borderWidth: 1, borderColor: COLORS.amberBorder,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  pendingBannerText: { fontSize: 13, color: COLORS.amber, fontWeight: '600', flex: 1 },
  resolvedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primaryBorder,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  resolvedBannerText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 10, marginTop: 4 },

  // Diagnosis card
  diagnosisCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 16,
  },
  diagnosisHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  bugIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.errorLight,
    alignItems: 'center', justifyContent: 'center',
  },
  diseaseName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, textTransform: 'capitalize' },
  cropName:    { fontSize: 12, color: COLORS.textLight, marginTop: 2, textTransform: 'capitalize' },
  diagnosisMeta: { flexDirection: 'row', gap: 8 },
  severityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
  },
  severityText: { fontSize: 11, fontWeight: '600' },
  confidencePill: {
    backgroundColor: COLORS.background, borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  confidenceText: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },

  // Info card
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 12, color: COLORS.textLight },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },

  // Farmer note
  farmerNoteCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 16,
  },
  farmerNoteText: { flex: 1, fontSize: 13, color: COLORS.textDark, lineHeight: 19 },

  // AI recs
  aiRecsCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 16,
  },
  aiRecsHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.background, borderRadius: 8, padding: 8, marginBottom: 12,
  },
  aiRecsHint: { flex: 1, fontSize: 11, color: COLORS.textLight, lineHeight: 16 },
  aiRecRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  aiRecNum: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  aiRecNumText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  aiRecText:    { flex: 1, fontSize: 13, color: COLORS.textDark, lineHeight: 19 },

  // Response input
  respondedAt: { fontSize: 11, color: COLORS.textLight, marginBottom: 8, marginTop: -6 },
  responseInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.white, padding: 14,
    fontSize: 14, color: COLORS.textDark, minHeight: 180, lineHeight: 21,
  },
  responseInputSubmitted: {
    backgroundColor: COLORS.background, borderColor: COLORS.border, color: COLORS.textDark,
  },
  charCount: { fontSize: 11, color: COLORS.textLight, textAlign: 'right', marginTop: 4, marginBottom: 16 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginBottom: 12,
  },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  submittedNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16,
  },
  submittedNoteText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Rating
  ratingCard:  { marginTop: 8 },
  starsRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingHelpful: { fontSize: 13, color: COLORS.textLight, marginLeft: 6 },
});

export default ExpertCaseDetailScreen;