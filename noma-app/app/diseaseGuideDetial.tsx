import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';
import DISEASES_DATA from '@/constants/treatments.json';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#f8f8f8', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', error: '#dc2626',
  errorLight: '#fef2f2', amber: '#d97706', amberLight: '#fffbeb',
  amberBorder: '#fde68a', blue: '#2563eb', blueLight: '#eff6ff',
};

const SEVERITY_CONFIG: Record<string, {
  color: string; bg: string; border: string;
  label: string; labelHa: string; icon: string;
}> = {
  high:     { color: COLORS.error,   bg: COLORS.errorLight,   border: '#fecaca', icon: 'warning',                label: 'High Severity',     labelHa: 'Mai Tsanani'    },
  moderate: { color: COLORS.amber,   bg: COLORS.amberLight,   border: '#fde68a', icon: 'alert-circle',           label: 'Moderate Severity', labelHa: 'Matsakaici'     },
  low:      { color: COLORS.primary, bg: COLORS.primaryLight, border: '#bbf7d0', icon: 'checkmark-circle',       label: 'Low Severity',      labelHa: 'Ƙarami'         },
};

// ─── Section component ─────────────────────────────────────────────────────────

const Section = ({
  icon, title, children, color = COLORS.primary, bg = COLORS.primaryLight,
}: {
  icon: string; title: string; children: React.ReactNode; color?: string; bg?: string;
}) => (
  <View style={styles.section}>
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
    {children}
  </View>
);

// ─── Numbered list item ────────────────────────────────────────────────────────

const NumberedItem = ({ index, text, color = COLORS.primary }: {
  index: number; text: string; color?: string;
}) => (
  <View style={styles.numberedRow}>
    <View style={[styles.numberedBadge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.numberedBadgeText, { color }]}>{index + 1}</Text>
    </View>
    <Text style={styles.numberedText}>{text}</Text>
  </View>
);

// ─── Bullet item ───────────────────────────────────────────────────────────────

const BulletItem = ({ text, icon = 'checkmark-circle', color = COLORS.primary }: {
  text: string; icon?: string; color?: string;
}) => (
  <View style={styles.bulletRow}>
    <Ionicons name={icon as any} size={16} color={color} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

// ─── Info row ──────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function DiseaseDetailScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { diseaseId } = useLocalSearchParams<{ diseaseId: string }>();
  const isHausa = language === 'hausa';

  const disease = useMemo(() =>
    (DISEASES_DATA as any[]).find(d => d.id === diseaseId),
    [diseaseId]
  );

  const availableSeverities = disease ? Object.keys(disease.severities) : [];
  const defaultSev = availableSeverities.includes('high') ? 'high'
    : availableSeverities.includes('moderate') ? 'moderate' : availableSeverities[0];

  const [activeSev, setActiveSev] = useState(defaultSev);

  if (!disease) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
        <Text style={styles.notFoundText}>
          {isHausa ? 'Ba a sami bayani ba' : 'Disease not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>{isHausa ? 'Koma baya' : 'Go back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sevData   = disease.severities[activeSev];
  const sevConfig = SEVERITY_CONFIG[activeSev];
  const name      = isHausa ? disease.name_ha : disease.name_en;

  const treatments      = isHausa ? sevData.recommended_treatment_ha  : sevData.recommended_treatment_en;
  const appSteps        = isHausa ? sevData.application_steps_ha      : sevData.application_steps_en;
  const dosage          = isHausa ? sevData.dosage_ha                 : sevData.dosage_en;
  const timing          = isHausa ? sevData.timing_ha                 : sevData.timing_en;
  const safetyWarnings  = isHausa ? sevData.safety_warnings_ha        : sevData.safety_warnings_en;
  const expectedOutcome = isHausa ? sevData.expected_outcome_ha       : sevData.expected_outcome_en;
  const followUp        = isHausa ? sevData.follow_up_days_ha         : sevData.follow_up_days_en;
  const inputSourcing   = isHausa ? sevData.input_sourcing_ha         : sevData.input_sourcing_en;
  const prevention      = isHausa ? sevData.future_prevention_ha      : sevData.future_prevention_en;

  // Normalize to array
  const toArray = (val: any): string[] =>
    Array.isArray(val) ? val : (val ? [val] : []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.navHeader, { borderBottomColor: sevConfig.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card */}
        <View style={[styles.identityCard, { borderColor: sevConfig.border, backgroundColor: sevConfig.bg }]}>
          <View style={styles.identityTop}>
            <View style={[styles.diseaseIconCircle, { backgroundColor: sevConfig.color + '20' }]}>
              <Ionicons name="bug-outline" size={26} color={sevConfig.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropTagLarge}>{disease.crop.toUpperCase()}</Text>
              <Text style={styles.diseaseNameLarge}>{name}</Text>
            </View>
          </View>
        </View>

        {/* Severity tabs */}
        <Text style={styles.severityTabLabel}>
          {isHausa ? 'Zaɓi matakin tsanani' : 'Select severity level'}
        </Text>
        <View style={styles.severityTabs}>
          {availableSeverities.map(sev => {
            const cfg = SEVERITY_CONFIG[sev];
            const isActive = activeSev === sev;
            return (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.severityTab,
                  isActive && { backgroundColor: cfg.color, borderColor: cfg.color },
                  !isActive && { borderColor: cfg.color + '50' },
                ]}
                onPress={() => setActiveSev(sev)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cfg.icon as any}
                  size={14}
                  color={isActive ? COLORS.white : cfg.color}
                />
                <Text style={[
                  styles.severityTabText,
                  { color: isActive ? COLORS.white : cfg.color },
                ]}>
                  {isHausa ? cfg.labelHa : cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Treatment */}
        <Section
          icon="medkit-outline"
          title={isHausa ? 'Magani' : 'Recommended Treatment'}
          color={sevConfig.color}
          bg={sevConfig.bg}
        >
          {toArray(treatments).map((t, i) => (
            <NumberedItem key={i} index={i} text={t} color={sevConfig.color} />
          ))}
        </Section>

        {/* Application steps */}
        {toArray(appSteps).length > 0 && (
          <Section
            icon="list-outline"
            title={isHausa ? 'Yadda Ake Amfani' : 'How to Apply'}
            color={COLORS.blue}
            bg={COLORS.blueLight}
          >
            {toArray(appSteps).map((s, i) => (
              <NumberedItem key={i} index={i} text={s} color={COLORS.blue} />
            ))}
          </Section>
        )}

        {/* Dosage + timing */}
        {(dosage || timing) && (
          <Section
            icon="flask-outline"
            title={isHausa ? 'Adadin Magani da Lokaci' : 'Dosage & Timing'}
            color={COLORS.amber}
            bg={COLORS.amberLight}
          >
            {dosage && <InfoRow label={isHausa ? 'Yawa' : 'Dosage'} value={dosage} />}
            {timing && <InfoRow label={isHausa ? 'Lokaci' : 'Timing'} value={timing} />}
          </Section>
        )}

        {/* Safety warnings */}
        {toArray(safetyWarnings).length > 0 && (
          <Section
            icon="shield-outline"
            title={isHausa ? 'Gargaɗi' : 'Safety Warnings'}
            color={COLORS.error}
            bg={COLORS.errorLight}
          >
            {toArray(safetyWarnings).map((w, i) => (
              <BulletItem key={i} text={w} icon="warning-outline" color={COLORS.error} />
            ))}
          </Section>
        )}

        {/* Expected outcome */}
        {expectedOutcome && (
          <Section
            icon="checkmark-done-outline"
            title={isHausa ? 'Abin Da Za a Samu' : 'Expected Outcome'}
            color={COLORS.primary}
            bg={COLORS.primaryLight}
          >
            <Text style={styles.plainText}>{expectedOutcome}</Text>
          </Section>
        )}

        {/* Follow up */}
        {toArray(followUp).length > 0 && (
          <Section
            icon="time-outline"
            title={isHausa ? 'Lokacin Sake Dubawa' : 'Follow-up'}
            color={COLORS.textLight}
            bg={COLORS.background}
          >
            {toArray(followUp).map((f, i) => (
              <BulletItem key={i} text={f} icon="time-outline" color={COLORS.textLight} />
            ))}
          </Section>
        )}

        {/* Input sourcing */}
        {inputSourcing && (
          <Section
            icon="cart-outline"
            title={isHausa ? 'Inda Za Ka Samu Magani' : 'Where to Get Inputs'}
            color={COLORS.blue}
            bg={COLORS.blueLight}
          >
            <Text style={styles.plainText}>{inputSourcing}</Text>
          </Section>
        )}

        {/* Prevention */}
        {toArray(prevention).length > 0 && (
          <Section
            icon="leaf-outline"
            title={isHausa ? 'Yadda Za a Hana' : 'Future Prevention'}
            color={COLORS.primary}
            bg={COLORS.primaryLight}
          >
            {toArray(prevention).map((p, i) => (
              <BulletItem key={i} text={p} icon="checkmark-circle" color={COLORS.primary} />
            ))}
          </Section>
        )}

        {/* Scan CTA */}
        <View style={styles.scanCta}>
          <Ionicons name="scan-outline" size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanCtaTitle}>
              {isHausa ? 'Ganin wannan a gona naka?' : 'Seeing this on your farm?'}
            </Text>
            <Text style={styles.scanCtaDesc}>
              {isHausa
                ? 'Dauki hoto don tabbatar da cutar da AI'
                : 'Take a photo to confirm the disease with AI'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.scanCtaBtn}
            onPress={() => router.push('/cropscan' as any)}
          >
            <Text style={styles.scanCtaBtnText}>
              {isHausa ? 'Duba' : 'Scan'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText:     { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  backLink:         { marginTop: 8 },
  backLinkText:     { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textDark, textAlign: 'center' },
  content:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  identityCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20,
  },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diseaseIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  cropTagLarge:     { fontSize: 10, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.6, marginBottom: 4 },
  diseaseNameLarge: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },

  severityTabLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 8 },
  severityTabs: {
    flexDirection: 'row', gap: 8, marginBottom: 20,
  },
  severityTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
    backgroundColor: COLORS.white,
  },
  severityTabText: { fontSize: 11, fontWeight: '700' },

  // Section
  section:        { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  sectionTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon:    { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:   { fontSize: 13, fontWeight: '700' },

  // Numbered list
  numberedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  numberedBadge: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  numberedBadgeText: { fontSize: 11, fontWeight: '700' },
  numberedText: { flex: 1, fontSize: 13, color: COLORS.textDark, lineHeight: 19 },

  // Bullet list
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bulletText: { flex: 1, fontSize: 13, color: COLORS.textDark, lineHeight: 19 },

  // Info row
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 12,
  },
  infoLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', flexShrink: 0 },
  infoValue: { flex: 1, fontSize: 13, color: COLORS.textDark, textAlign: 'right', lineHeight: 18 },

  plainText: { fontSize: 13, color: COLORS.textDark, lineHeight: 20 },

  // Scan CTA
  scanCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primaryBorder,
    borderRadius: 14, padding: 14, marginTop: 8,
  },
  scanCtaTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  scanCtaDesc:  { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  scanCtaBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  scanCtaBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});