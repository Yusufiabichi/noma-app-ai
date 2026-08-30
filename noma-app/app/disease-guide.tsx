import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';
import DISEASES_DATA from '../constants/treatments.json';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#f8f8f8', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', error: '#dc2626',
  errorLight: '#fef2f2', amber: '#d97706', amberLight: '#fffbeb',
  amberBorder: '#fde68a',
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string; labelHa: string }> = {
  high:     { color: COLORS.error,   bg: COLORS.errorLight,   label: 'High',     labelHa: 'Mai tsanani'  },
  moderate: { color: COLORS.amber,   bg: COLORS.amberLight,   label: 'Moderate', labelHa: 'Matsakaici'   },
  low:      { color: COLORS.primary, bg: COLORS.primaryLight, label: 'Low',      labelHa: 'Ƙarami'       },
};

// ─── Derive unique crops from the data ───────────────────────────────────────
const ALL_CROPS: string[] = ['All', ...Array.from(
  new Set((DISEASES_DATA as any[]).map((d: any) => d.crop))
).sort()];

// ─── Derive worst severity per disease for the list card ─────────────────────
const getWorstSeverity = (severities: any): string => {
  if (severities.high)     return 'high';
  if (severities.moderate) return 'moderate';
  return 'low';
};

// ─── Disease Card ──────────────────────────────────────────────────────────────

const DiseaseCard = ({
  disease, language, onPress,
}: { disease: any; language: string; onPress: () => void }) => {
  const isHausa   = language === 'hausa';
  const name      = isHausa ? disease.name_ha : disease.name_en;
  const severity  = getWorstSeverity(disease.severities);
  const sevCfg    = SEVERITY_CONFIG[severity];
  const treatments = disease.severities[severity]?.recommended_treatment_en || [];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Color strip on left by severity */}
      <View style={[styles.cardStrip, { backgroundColor: sevCfg.color }]} />

      <View style={styles.cardBody}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cropTag}>{disease.crop.toUpperCase()}</Text>
            <Text style={styles.diseaseName} numberOfLines={2}>{name}</Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: sevCfg.bg }]}>
            <Text style={[styles.severityText, { color: sevCfg.color }]}>
              {isHausa ? sevCfg.labelHa : sevCfg.label}
            </Text>
          </View>
        </View>

        {/* First treatment preview */}
        {treatments[0] && (
          <View style={styles.previewRow}>
            <Ionicons name="medkit-outline" size={13} color={COLORS.textLight} />
            <Text style={styles.previewText} numberOfLines={1}>
              {isHausa
                ? disease.severities[severity]?.recommended_treatment_ha?.[0]
                : treatments[0]}
            </Text>
          </View>
        )}

        {/* Severity count chips */}
        <View style={styles.cardFooter}>
          {Object.keys(disease.severities).map(sev => (
            <View
              key={sev}
              style={[styles.sevChip, { backgroundColor: SEVERITY_CONFIG[sev]?.bg }]}
            >
              <Text style={[styles.sevChipText, { color: SEVERITY_CONFIG[sev]?.color }]}>
                {isHausa ? SEVERITY_CONFIG[sev]?.labelHa : SEVERITY_CONFIG[sev]?.label}
              </Text>
            </View>
          ))}
          <View style={styles.viewMore}>
            <Text style={styles.viewMoreText}>
              {isHausa ? 'Duba' : 'View'}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function DiseaseGuideScreen() {
  const router   = useRouter();
  const { language } = useLanguage();
  const isHausa  = language === 'hausa';

  const [search, setSearch]           = useState('');
  const [activeCrop, setActiveCrop]   = useState('All');

  const filtered = useMemo(() => {
    return (DISEASES_DATA as any[]).filter((d: any) => {
      const matchesCrop = activeCrop === 'All' || d.crop === activeCrop;
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        d.name_en.toLowerCase().includes(q) ||
        d.name_ha.toLowerCase().includes(q) ||
        d.crop.toLowerCase().includes(q);
      return matchesCrop && matchesSearch;
    });
  }, [search, activeCrop]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {isHausa ? 'Cututtukan Amfanin Gona' : 'Pest & Disease Guide'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder={isHausa ? 'Neman cuta...' : 'Search diseases...'}
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Crop filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cropScroll}
        contentContainerStyle={styles.cropScrollContent}
      >
        {ALL_CROPS.map(crop => (
          <TouchableOpacity
            key={crop}
            style={[styles.cropChip, activeCrop === crop && styles.cropChipActive]}
            onPress={() => setActiveCrop(crop)}
          >
            <Text style={[styles.cropChipText, activeCrop === crop && styles.cropChipTextActive]}>
              {crop === 'All' ? (isHausa ? 'Duka' : 'All') : crop}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result count */}
      <View style={styles.resultBar}>
        <Text style={styles.resultText}>
          {filtered.length} {isHausa ? 'cuta' : `disease${filtered.length !== 1 ? 's' : ''}`}
          {activeCrop !== 'All' && ` · ${activeCrop}`}
        </Text>
      </View>

      {/* Disease list */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={40} color={COLORS.border} />
          <Text style={styles.emptyTitle}>
            {isHausa ? 'Ba a sami cuta ba' : 'No diseases found'}
          </Text>
          <Text style={styles.emptyDesc}>
            {isHausa
              ? 'Gwada wata kalmar bincike'
              : 'Try a different search or crop filter'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DiseaseCard
              disease={item}
              language={language}
              onPress={() => router.push({
                pathname: '/diseaseGuideDetail',
                params: { diseaseId: item.id },
              } as any)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },

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

  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark },

cropScroll: {
  flexGrow: 0,
  marginTop: 12,
  minHeight: 40, // ensures it's visible even if content is small
},
cropScrollContent: {
  paddingHorizontal: 16,
  alignItems: 'center',
  // remove 'gap' – we'll use margin on each chip
},
cropChip: {
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 20,
  paddingVertical: 6,
  paddingHorizontal: 14,
  backgroundColor: COLORS.white,
  alignSelf: 'flex-start',
  // remove flexShrink:0 – let it size naturally
  marginRight: 8, // instead of gap
},
cropChipActive: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
},
cropChipText: {
  fontSize: 12,
  color: COLORS.textDark,
  fontWeight: '600',
  // remove flexShrink:0
  // do NOT set numberOfLines – let the text be fully visible
},
cropChipTextActive: {
  color: COLORS.white,
},
  resultBar: { paddingHorizontal: 20, paddingVertical: 10 },
  resultText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Disease card
  card: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: 'hidden',
  },
  cardStrip: { width: 5 },
  cardBody:  { flex: 1, padding: 14 },
  cardHeader:{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cropTag:   { fontSize: 10, color: COLORS.textLight, fontWeight: '700', letterSpacing: 0.4, marginBottom: 3 },
  diseaseName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  severityBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, marginLeft: 8, alignSelf: 'flex-start' },
  severityText:  { fontSize: 10, fontWeight: '700' },

  previewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 10 },
  previewText: { flex: 1, fontSize: 12, color: COLORS.textLight, lineHeight: 16 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sevChip: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 },
  sevChipText: { fontSize: 10, fontWeight: '600' },
  viewMore: { marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewMoreText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginTop: 16 },
  emptyDesc:  { fontSize: 13, color: COLORS.textLight, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
});