import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getVerificationStatus } from '@/src/api/expert.api';
import { getExpertAssignedCases } from '@/src/api/expertChat.api';
import { useLanguage } from '@/src/context/LanguageContext';
import WeatherCard from '@/app/components/WeatherCard'
import Data from '@/constants/data.json'

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#F8FFFB', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', error: '#dc2626',
  errorLight: '#fef2f2', amber: '#d97706', amberLight: '#fffbeb',
  amberBorder: '#fde68a', blue: '#2563eb', blueLight: '#eff6ff',
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low:      { color: COLORS.primary, bg: COLORS.primaryLight },
  moderate: { color: COLORS.amber,   bg: COLORS.amberLight   },
  high:     { color: COLORS.error,   bg: COLORS.errorLight   },
  severe:   { color: COLORS.error,   bg: COLORS.errorLight   },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: COLORS.amber,   bg: COLORS.amberLight,   label: 'Awaiting your response' },
  accepted:    { color: COLORS.blue,    bg: COLORS.blueLight,    label: 'Accepted'               },
  in_progress: { color: COLORS.primary, bg: COLORS.primaryLight, label: 'In Progress'            },
  resolved:    { color: COLORS.primary, bg: COLORS.primaryLight, label: 'Resolved'               },
  declined:    { color: COLORS.error,   bg: COLORS.errorLight,   label: 'Declined'               },
};

// ─── Unverified State ─────────────────────────────────────────────────────────

const UnverifiedView = ({ overallStatus }: { overallStatus: string }) => {
  const isPending = overallStatus === 'pending_review';
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.unverifiedContainer}>
      <View style={[styles.unverifiedIcon, isPending && { backgroundColor: COLORS.amberLight }]}>
        <Ionicons
          name={isPending ? 'time-outline' : 'shield-outline'}
          size={36}
          color={isPending ? COLORS.amber : COLORS.textLight}
        />
      </View>

      <WeatherCard />

      <Text style={styles.unverifiedTitle}>
        {isPending ? 'Verification Under Review' : 'Account Not Verified'}
      </Text>

      <Text style={styles.unverifiedDesc}>
        {isPending
          ? 'Your documents are being reviewed by the NomaApp team. You\'ll be notified within 48 hours once approved.'
          : 'Complete your expert verification to start receiving farmer consultation cases and showcase your agricultural expertise.'}
      </Text>

      {!isPending && (
        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={() => router.push('./dashboard' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="ribbon-outline" size={18} color={COLORS.white} />
          <Text style={styles.verifyBtnText}>Complete Verification</Text>
        </TouchableOpacity>
      )}

      {isPending && (
        <View style={styles.pendingNote}>
          <Ionicons name="notifications-outline" size={14} color={COLORS.amber} />
          <Text style={styles.pendingNoteText}>
            We'll send you a push notification when the review is complete.
          </Text>
        </View>
      )}

      {/* What you unlock */}
      <View style={styles.unlockBox}>
        <Text style={styles.unlockTitle}>What you unlock after verification</Text>
        {[
          { icon: 'briefcase-outline',        label: 'Receive farmer consultation cases' },
          { icon: 'star-outline',             label: 'Build your expert rating & reputation' },
          { icon: 'shield-checkmark-outline', label: 'Get verified badges on your profile'  },
          { icon: 'cash-outline',             label: 'Earn from paid consultation sessions'  },
        ].map((item, i) => (
          <View key={i} style={styles.unlockRow}>
            <Ionicons name={item.icon as any} size={16} color={COLORS.primary} />
            <Text style={styles.unlockText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Case Card ────────────────────────────────────────────────────────────────

const CaseCard = ({ caseItem, onPress }: { caseItem: any; onPress: () => void }) => {
  const statusCfg   = STATUS_CONFIG[caseItem.status]   || STATUS_CONFIG.pending;
  const severityCfg = SEVERITY_CONFIG[caseItem.diagnosisSnapshot?.severity] || SEVERITY_CONFIG.moderate;
  const isPending   = caseItem.status === 'pending';

  return (
    <TouchableOpacity
      style={[styles.caseCard, isPending && styles.caseCardUrgent]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Urgency strip */}
      {isPending && <View style={styles.urgencyStrip} />}

      <View style={styles.caseCardInner}>
        {/* Header row */}
        <View style={styles.caseHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.caseCrop}>
              {caseItem.diagnosisSnapshot?.cropType || 'Unknown crop'}
            </Text>
            <Text style={styles.caseDisease} numberOfLines={1}>
              {caseItem.diagnosisSnapshot?.disease?.replace(/_/g, ' ') || 'Unknown disease'}
            </Text>
          </View>
          <View style={[styles.caseStatusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.caseStatusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Severity + confidence */}
        <View style={styles.caseMeta}>
          <View style={[styles.severityPill, { backgroundColor: severityCfg.bg }]}>
            <Ionicons name="warning-outline" size={11} color={severityCfg.color} />
            <Text style={[styles.severityText, { color: severityCfg.color }]}>
              {caseItem.diagnosisSnapshot?.severity || '—'} severity
            </Text>
          </View>
          {caseItem.diagnosisSnapshot?.confidence && (
            <Text style={styles.caseConfidence}>
              {Math.round(caseItem.diagnosisSnapshot.confidence * 100)}% confidence
            </Text>
          )}
        </View>

        {/* Farmer note preview */}
        {caseItem.farmerNote && (
          <View style={styles.farmerNoteBox}>
            <Ionicons name="chatbubble-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.farmerNoteText} numberOfLines={2}>
              {caseItem.farmerNote}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.caseFooter}>
          <Text style={styles.caseDate}>
            {new Date(caseItem.createdAt).toLocaleDateString('en-NG', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
          {isPending && (
            <View style={styles.respondNudge}>
              <Text style={styles.respondNudgeText}>Tap to respond</Text>
              <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Verified Expert View ─────────────────────────────────────────────────────

const VerifiedView = ({
  profile, userName, refreshing, onRefresh,
}: {
  profile: any; userName: string; refreshing: boolean; onRefresh: () => void;
}) => {
  const [cases, setCases]               = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const { language, setLanguage } = useLanguage();

  const fetchCases = useCallback(async () => {
    try {
      const res = await getExpertAssignedCases();
      // getMyCases returns farmer's cases; for expert we need expert's cases
      // Adjust based on your API — see note in integration guide
      setCases(res.data?.cases || []);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setCasesLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, []);

  const pendingCases  = cases.filter(c => c.status === 'pending');
  const activeCases   = cases.filter(c => ['accepted', 'in_progress'].includes(c.status));
  const resolvedCount = cases.filter(c => c.status === 'resolved').length;

  const perf = profile?.performance || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.verifiedContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >

    <WeatherCard />

    {/* Scan Button */}
          <TouchableOpacity style={styles.scanButton}
            onPress={()=> router.push("/cropscan")}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.scanText}>
                {language==="english" ? Data.en.home.scan_text : Data.ha.home.scan_text}
            </Text>
          </TouchableOpacity>

      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingTitle}>Hello, {userName.split(' ')[0]} 👋</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
            <Text style={styles.verifiedBadgeText}>Verified Expert</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.profileIconBtn}
          onPress={() => router.push('/(tabs)/profile' as any)}
        >
          <Ionicons name="person-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Performance metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsTitle}>Your Performance</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{perf.casesHandled ?? 0}</Text>
            <Text style={styles.metricLabel}>Total Cases</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {perf.averageRating ? perf.averageRating.toFixed(1) : '—'}
            </Text>
            <Text style={styles.metricLabel}>Avg Rating</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{resolvedCount}</Text>
            <Text style={styles.metricLabel}>Resolved</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: COLORS.amber }]}>
              {perf.trialCasesRemaining ?? 20}
            </Text>
            <Text style={styles.metricLabel}>Trial Left</Text>
          </View>
        </View>
      </View>

      {/* Pending cases — action required */}
      {pendingCases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Action Required</Text>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>{pendingCases.length} pending</Text>
            </View>
          </View>
          {pendingCases.map(c => (
            <CaseCard
              key={c._id}
              caseItem={c}
              onPress={() => router.push({
                pathname: './caseDetail',
                params: { caseId: c._id },
              } as any)}
            />
          ))}
        </View>
      )}

      {/* Active cases */}
      {activeCases.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Cases</Text>
          {activeCases.map(c => (
            <CaseCard
              key={c._id}
              caseItem={c}
              onPress={() => router.push({
                pathname: './caseDetail',
                params: { caseId: c._id },
              } as any)}
            />
          ))}
        </View>
      )}

      {/* Empty state */}
      {!casesLoading && pendingCases.length === 0 && activeCases.length === 0 && (
        <View style={styles.emptyCases}>
          <Ionicons name="briefcase-outline" size={40} color={COLORS.border} />
          <Text style={styles.emptyCasesTitle}>No active cases</Text>
          <Text style={styles.emptyCasesDesc}>
            Farmer consultation cases assigned to you will appear here.
          </Text>
        </View>
      )}

      {casesLoading && (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      )}
    </ScrollView>
  );
};

// ─── Main Export — ExpertHomeView ─────────────────────────────────────────────

const ExpertHomeView = ({ userName }: { userName: string }) => {
  const [profile, setProfile]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await getVerificationStatus();
      setProfile(res.data.profile);
    } catch (err) {
      console.error('Failed to fetch expert profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isVerified = profile?.overallStatus === 'approved' && profile?.stage === 'complete';

  if (!isVerified) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <UnverifiedView overallStatus={profile?.overallStatus || 'incomplete'} />
      </ScrollView>
    );
  }

  return (
    <VerifiedView
      profile={profile}
      userName={userName}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

export default ExpertHomeView;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  verifiedContent:  { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  // Unverified
  unverifiedContainer: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  unverifiedIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  unverifiedTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textDark, textAlign: 'center', marginBottom: 10 },
  unverifiedDesc: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 28, marginBottom: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  verifyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  pendingNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.amberLight, borderWidth: 1, borderColor: COLORS.amberBorder,
    borderRadius: 10, padding: 12, marginBottom: 20,
  },
  pendingNoteText: { fontSize: 12, color: COLORS.amber, flex: 1, lineHeight: 17 },
  unlockBox: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, width: '100%', marginTop: 8,
  },
  unlockTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 12 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  unlockText: { fontSize: 13, color: COLORS.textDark },

  // Verified greeting
  greetingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  greetingTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryLight, borderRadius: 20,
    paddingVertical: 3, paddingHorizontal: 10, marginTop: 5,
    alignSelf: 'flex-start',
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  profileIconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.primaryLight, borderWidth: 1,
    borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center',
  },

  // Performance metrics
  metricsCard: {
    backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 24,
  },
  metricsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 14 },
  metricsRow:   { flexDirection: 'row', alignItems: 'center' },
  metricItem:   { flex: 1, alignItems: 'center' },
  metricValue:  { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  metricLabel:  { fontSize: 10, color: COLORS.textLight, marginTop: 3 },
  metricDivider:{ width: 1, height: 36, backgroundColor: COLORS.border },

  // Section
  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  urgentBadge: {
    backgroundColor: COLORS.amberLight, borderRadius: 20,
    paddingVertical: 3, paddingHorizontal: 10,
  },
  urgentBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.amber },

  // Case card
  caseCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: 10, overflow: 'hidden',
    flexDirection: 'row',
  },
  caseCardUrgent: { borderColor: COLORS.amber },
  urgencyStrip:   { width: 4, backgroundColor: COLORS.amber },
  caseCardInner:  { flex: 1, padding: 14 },
  caseHeaderRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  caseCrop: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', textTransform: 'capitalize', marginBottom: 2 },
  caseDisease: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, textTransform: 'capitalize' },
  caseStatusBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, marginLeft: 8 },
  caseStatusText:  { fontSize: 10, fontWeight: '700' },
  caseMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  severityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8,
  },
  severityText:    { fontSize: 10, fontWeight: '600' },
  caseConfidence:  { fontSize: 11, color: COLORS.textLight },
  farmerNoteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.background, borderRadius: 8, padding: 8, marginBottom: 8,
  },
  farmerNoteText: { flex: 1, fontSize: 12, color: COLORS.textLight, lineHeight: 17 },
  caseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseDate:   { fontSize: 11, color: COLORS.textLight },
  respondNudge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  respondNudgeText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  // Empty
  emptyCases: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyCasesTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginTop: 12 },
  emptyCasesDesc:  { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },
});