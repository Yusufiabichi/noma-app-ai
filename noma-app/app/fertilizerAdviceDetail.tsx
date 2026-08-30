import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';
import FERTILIZERS from '@/constants/fertilizers.json';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#f8f8f8', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', error: '#dc2626',
  errorLight: '#fef2f2', amber: '#d97706', amberLight: '#fffbeb',
  blue: '#2563eb', blueLight: '#eff6ff',
};

// ─── Info Row ──────────────────────────────────────────────────────────────────

const InfoRow = ({
  icon, label, value, iconColor = COLORS.primary, iconBg = COLORS.primaryLight,
}: {
  icon: string; label: string; value: string;
  iconColor?: string; iconBg?: string;
}) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon as any} size={15} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// ─── Section ──────────────────────────────────────────────────────────────────

const Section = ({
  icon, title, children, iconColor = COLORS.primary, iconBg = COLORS.primaryLight,
}: {
  icon: string; title: string; children: React.ReactNode;
  iconColor?: string; iconBg?: string;
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={15} color={iconColor} />
      </View>
      <Text style={[styles.sectionTitle, { color: iconColor }]}>{title}</Text>
    </View>
    {children}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FertilizerDetailScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { cropId } = useLocalSearchParams<{ cropId: string }>();
  const isHausa = language === 'hausa';

  const crop = useMemo(() =>
    (FERTILIZERS as any[]).find(c => c.id === cropId),
    [cropId]
  );

  const [activeStage, setActiveStage] = useState(0);

  if (!crop) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
        <Text style={styles.errorText}>
          {isHausa ? 'Ba a sami bayani ba' : 'Crop not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>
            {isHausa ? 'Koma baya' : 'Go back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stage    = crop.stages[activeStage];
  const cropName = isHausa ? crop.name_ha : crop.name_en;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{cropName}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Crop identity */}
        <View style={styles.identityCard}>
          <Ionicons name="leaf" size={22} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.identityName}>{cropName}</Text>
            <Text style={styles.identityMeta}>
              {crop.stages.length} {isHausa
                ? 'matakai na girma'
                : `growth stage${crop.stages.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* Stage selector */}
        <Text style={styles.stageSelectorLabel}>
          {isHausa ? 'Zaɓi matakin girma' : 'Select growth stage'}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabs}
        >
          {crop.stages.map((s: any, i: number) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.stageTab, activeStage === i && styles.stageTabActive]}
              onPress={() => setActiveStage(i)}
            >
              <Text style={[styles.stageTabText, activeStage === i && styles.stageTabTextActive]}>
                {isHausa ? s.stage_ha : s.stage_en}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stage content */}
        <View style={styles.stageCard}>
          {/* Fertilizer name */}
          <View style={styles.fertilizerBadge}>
            <Ionicons name="flask" size={16} color={COLORS.primary} />
            <Text style={styles.fertilizerName}>
              {isHausa ? stage.fertilizer_ha : stage.fertilizer_en}
            </Text>
          </View>

          {/* Quantity, Method, Timing */}
          <Section
            icon="scale-outline"
            title={isHausa ? 'Adadin Taki' : 'Quantity'}
            iconColor={COLORS.blue}
            iconBg={COLORS.blueLight}
          >
            <Text style={styles.plainText}>
              {isHausa ? stage.quantity_ha : stage.quantity_en}
            </Text>
          </Section>

          <Section
            icon="hand-left-outline"
            title={isHausa ? 'Yadda Ake Amfani' : 'Application Method'}
            iconColor={COLORS.amber}
            iconBg={COLORS.amberLight}
          >
            <Text style={styles.plainText}>
              {isHausa ? stage.method_ha : stage.method_en}
            </Text>
          </Section>

          <Section
            icon="time-outline"
            title={isHausa ? 'Lokaci' : 'When to Apply'}
            iconColor="#7c3aed"
            iconBg="#f5f3ff"
          >
            <Text style={styles.plainText}>
              {isHausa ? stage.timing_ha : stage.timing_en}
            </Text>
          </Section>

          {/* Pro tip */}
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>
                {isHausa ? 'Shawarwari' : 'Pro Tip'}
              </Text>
              <Text style={styles.tipText}>
                {isHausa ? stage.tip_ha : stage.tip_en}
              </Text>
            </View>
          </View>
        </View>

        {/* General note */}
        <View style={styles.generalNote}>
          <View style={styles.generalNoteHeader}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
            <Text style={styles.generalNoteTitle}>
              {isHausa ? 'Bayani Gaba Ɗaya' : 'General Notes'}
            </Text>
          </View>
          <Text style={styles.generalNoteText}>
            {isHausa ? crop.general_note_ha : crop.general_note_en}
          </Text>
        </View>

        {/* Where to buy */}
        <View style={styles.sourcingCard}>
          <View style={styles.sourcingHeader}>
            <Ionicons name="cart-outline" size={16} color={COLORS.blue} />
            <Text style={styles.sourcingTitle}>
              {isHausa ? 'Inda Za Ka Samu Taki' : 'Where to Buy'}
            </Text>
          </View>
          <Text style={styles.sourcingText}>
            {isHausa ? crop.sourcing_ha : crop.sourcing_en}
          </Text>
        </View>

        {/* Scan CTA */}
        <View style={styles.scanCta}>
          <Ionicons name="scan-outline" size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanCtaTitle}>
              {isHausa
                ? 'Ganin cutar a gonarka?'
                : 'Seeing disease symptoms on your crop?'}
            </Text>
            <Text style={styles.scanCtaDesc}>
              {isHausa
                ? 'Dauki hoto don gano cutar da AI'
                : 'Scan your crop for an instant AI diagnosis'}
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
  container:      { flex: 1, backgroundColor: COLORS.background },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText:      { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  backLink:       { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex: 1, textAlign: 'center' },
  content:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  identityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.primaryLight, borderWidth: 1,
    borderColor: COLORS.primaryBorder, borderRadius: 14, padding: 14, marginBottom: 20,
  },
  identityName: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  identityMeta: { fontSize: 12, color: COLORS.primary, marginTop: 2 },

  stageSelectorLabel: {
    fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 10,
  },
  stageTabs: { gap: 8, paddingBottom: 4, marginBottom: 16 },
  stageTab: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: COLORS.white, flexShrink: 0,
  },
  stageTabActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stageTabText:       { fontSize: 12, color: COLORS.textDark, fontWeight: '600' },
  stageTabTextActive: { color: COLORS.white },

  stageCard: {
    backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 16,
  },
  fertilizerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16,
  },
  fertilizerName: { fontSize: 14, fontWeight: '700', color: COLORS.primary, flex: 1 },

  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionIcon:   { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 12, fontWeight: '700' },
  plainText:     { fontSize: 13, color: COLORS.textDark, lineHeight: 20, paddingLeft: 34 },

  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.amberLight, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.amberBorder,
    padding: 12, marginTop: 6,
  },
  tipTitle: { fontSize: 11, fontWeight: '700', color: COLORS.amber, marginBottom: 3 },
  tipText:  { fontSize: 12, color: '#92400e', lineHeight: 17 },

  generalNote: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 12,
  },
  generalNoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  generalNoteTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  generalNoteText:   { fontSize: 13, color: COLORS.textDark, lineHeight: 20 },

  sourcingCard: {
    backgroundColor: COLORS.blueLight, borderRadius: 14, borderWidth: 1,
    borderColor: '#bfdbfe', padding: 14, marginBottom: 16,
  },
  sourcingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sourcingTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.blue },
  sourcingText:   { fontSize: 13, color: '#1e40af', lineHeight: 19 },

  scanCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.primaryLight, borderWidth: 1,
    borderColor: COLORS.primaryBorder, borderRadius: 14, padding: 14,
  },
  scanCtaTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  scanCtaDesc:  { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  scanCtaBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  scanCtaBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});