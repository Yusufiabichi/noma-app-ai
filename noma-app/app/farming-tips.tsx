import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';
import TIPS_DATA from '@/constants/farmingTips.json';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#f8f8f8', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', error: '#dc2626',
  errorLight: '#fef2f2', amber: '#d97706', amberLight: '#fffbeb',
  amberBorder: '#fde68a', blue: '#2563eb', blueLight: '#eff6ff',
  purple: '#7c3aed', purpleLight: '#f5f3ff',
};

// ─── Category config ───────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    value: '',
    label_en: 'All Tips',
    label_ha: 'Duk Shawarwari',
    icon: 'grid-outline',
    color: COLORS.primary,
    bg: COLORS.primaryLight,
  },
  {
    value: 'soil',
    label_en: 'Soil Prep',
    label_ha: 'Shirya Ƙasa',
    icon: 'layers-outline',
    color: COLORS.amber,
    bg: COLORS.amberLight,
  },
  {
    value: 'planting',
    label_en: 'Planting',
    label_ha: 'Shuka',
    icon: 'leaf-outline',
    color: COLORS.primary,
    bg: COLORS.primaryLight,
  },
  {
    value: 'weed',
    label_en: 'Weed Control',
    label_ha: 'Ciyawa',
    icon: 'cut-outline',
    color: COLORS.error,
    bg: COLORS.errorLight,
  },
  {
    value: 'climate',
    label_en: 'Climate',
    label_ha: 'Yanayi',
    icon: 'cloud-outline',
    color: COLORS.blue,
    bg: COLORS.blueLight,
  },
];

// ─── Unique crops from data ────────────────────────────────────────────────────

const ALL_CROPS = Array.from(
  new Set((TIPS_DATA as any[]).map((t: any) => t.crop))
).sort();

// ─── Tip Card ─────────────────────────────────────────────────────────────────

const TipCard = ({
  tip, language, onPress,
}: { tip: any; language: string; onPress: () => void }) => {
  const isHausa = language === 'hausa';
  const cat     = CATEGORIES.find(c => c.value === tip.category) || CATEGORIES[0];

  return (
    <TouchableOpacity
      style={styles.tipCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Category color strip */}
      <View style={[styles.tipStrip, { backgroundColor: cat.color }]} />

      <View style={styles.tipBody}>
        {/* Top row */}
        <View style={styles.tipTopRow}>
          <View style={[styles.tipCategoryBadge, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon as any} size={11} color={cat.color} />
            <Text style={[styles.tipCategoryText, { color: cat.color }]}>
              {isHausa ? tip.category_ha : tip.category_en}
            </Text>
          </View>
          <View style={styles.cropTag}>
            <Text style={styles.cropTagText}>
              {isHausa ? tip.crop_ha : tip.crop_en}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.tipTitle}>
          {isHausa ? tip.title_ha : tip.title_en}
        </Text>

        {/* Tip preview */}
        <Text style={styles.tipPreview} numberOfLines={2}>
          {isHausa ? tip.tip_ha : tip.tip_en}
        </Text>

        {/* Read more */}
        <View style={styles.readMoreRow}>
          <Text style={[styles.readMoreText, { color: cat.color }]}>
            {isHausa ? 'Karanta ƙari' : 'Read more'}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={cat.color} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FarmingTipsScreen() {
  const router   = useRouter();
  const { language } = useLanguage();
  const isHausa  = language === 'hausa';

  const [search, setSearch]           = useState('');
  const [activeCategory, setCategory] = useState('');
  const [activeCrop, setCrop]         = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (TIPS_DATA as any[]).filter((t: any) => {
      const matchCat  = !activeCategory || t.category === activeCategory;
      const matchCrop = !activeCrop     || t.crop === activeCrop;
      const matchQ    = !q ||
        t.title_en.toLowerCase().includes(q) ||
        t.title_ha.toLowerCase().includes(q) ||
        t.tip_en.toLowerCase().includes(q)   ||
        t.crop_en.toLowerCase().includes(q)  ||
        t.crop_ha.toLowerCase().includes(q);
      return matchCat && matchCrop && matchQ;
    });
  }, [search, activeCategory, activeCrop]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {isHausa ? 'Shawarwarin Noma' : 'Farming Tips'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder={isHausa ? 'Nema shawarwari...' : 'Search tips...'}
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                isActive && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => setCategory(cat.value)}
            >
              <Ionicons
                name={cat.icon as any}
                size={13}
                color={isActive ? COLORS.white : cat.color}
              />
              <Text style={[
                styles.categoryChipText,
                { color: isActive ? COLORS.white : cat.color },
              ]}>
                {isHausa ? cat.label_ha : cat.label_en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Crop filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cropScroll}
        contentContainerStyle={styles.cropScrollContent}
      >
        <TouchableOpacity
          style={[styles.cropChip, !activeCrop && styles.cropChipActive]}
          onPress={() => setCrop('')}
        >
          <Text style={[styles.cropChipText, !activeCrop && styles.cropChipTextActive]}>
            {isHausa ? 'Duka' : 'All Crops'}
          </Text>
        </TouchableOpacity>
        {ALL_CROPS.map(crop => {
          const tip    = (TIPS_DATA as any[]).find(t => t.crop === crop);
          const label  = isHausa ? tip?.crop_ha : tip?.crop_en;
          const active = activeCrop === crop;
          return (
            <TouchableOpacity
              key={crop}
              style={[styles.cropChip, active && styles.cropChipActive]}
              onPress={() => setCrop(active ? '' : crop)}
            >
              <Text style={[styles.cropChipText, active && styles.cropChipTextActive]}>
                {label || crop}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Result count */}
      <View style={styles.resultRow}>
        <Text style={styles.resultText}>
          {filtered.length} {isHausa
            ? `shawarwari${filtered.length !== 1 ? '' : ''}`
            : `tip${filtered.length !== 1 ? 's' : ''}`}
        </Text>
        {(activeCategory || activeCrop) && (
          <TouchableOpacity
            onPress={() => { setCategory(''); setCrop(''); }}
          >
            <Text style={styles.clearText}>
              {isHausa ? 'Share tace' : 'Clear filters'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tips list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TipCard
            tip={item}
            language={language}
            onPress={() => router.push({
              pathname: '/farmingTipsDetail',
              params: { tipId: item.id },
            } as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyTitle}>
              {isHausa ? 'Ba a sami shawarwari ba' : 'No tips found'}
            </Text>
            <Text style={styles.emptyDesc}>
              {isHausa
                ? 'Gwada wata kalmar bincike ko cire tace'
                : 'Try a different search term or clear filters'}
            </Text>
          </View>
        }
      />
    </View>
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

  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark },

  // Category filter
  filterScroll:  { flexGrow: 0, marginTop: 12, minHeight: 35 },
  filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 12,
    backgroundColor: COLORS.white, flexShrink: 0,
    borderColor: COLORS.border,
  },
  categoryChipText: { fontSize: 12, fontWeight: '700', flexShrink: 0 },

  // Crop filter
  cropScroll:        { flexGrow: 0, marginTop: 8, minHeight: 30},
  cropScrollContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  cropChip: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
    backgroundColor: COLORS.white, flexShrink: 0,
  },
  cropChipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cropChipText:       { fontSize: 11, color: COLORS.textDark, fontWeight: '600', flexShrink: 0 },
  cropChipTextActive: { color: COLORS.white },

  // Result bar
  resultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  resultText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  clearText:  { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Tip card
  tipCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: 'hidden',
  },
  tipStrip: { width: 5 },
  tipBody:  { flex: 1, padding: 14 },
  tipTopRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 8, flexWrap: 'wrap',
  },
  tipCategoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8,
  },
  tipCategoryText: { fontSize: 10, fontWeight: '700' },
  cropTag: {
    backgroundColor: COLORS.background, borderRadius: 6,
    paddingVertical: 3, paddingHorizontal: 7,
  },
  cropTagText:  { fontSize: 10, color: COLORS.textLight, fontWeight: '600' },
  tipTitle:     { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  tipPreview:   { fontSize: 12, color: COLORS.textLight, lineHeight: 17, marginBottom: 8 },
  readMoreRow:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  readMoreText: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:     { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginTop: 16 },
  emptyDesc:      { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 6 },
});