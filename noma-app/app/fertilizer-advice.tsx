import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';
import FERTILIZERS from '@/constants/fertilizers.json';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#f8f8f8', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', amber: '#d97706',
  amberLight: '#fffbeb', blue: '#2563eb', blueLight: '#eff6ff',
};

// Icon map per crop id
const CROP_ICONS: Record<string, string> = {
  maize:          'nutrition-outline',
  millet:         'leaf-outline',
  sorghum:        'leaf-outline',
  groundnut:      'ellipse-outline',
  onion:          'radio-button-on-outline',
  tomato:         'stop-circle-outline',
  yam:            'remove-outline',
  cassava:        'git-branch-outline',
  soybean:        'flower-outline',
  rice:           'apps-outline',
  bean:           'bonfire-outline',
  ginger:         'flame-outline',
  cucumber:       'bar-chart-outline',
  cocoa:          'cafe-outline',
  plantain_banana:'albums-outline',
  oil_palm:       'umbrella-outline',
  okra:           'arrow-up-outline',
  pepper:         'alert-circle-outline',
};

const CROP_COLORS = [
  { bg: '#f0fdf4', icon: '#16A34A' },
  { bg: '#eff6ff', icon: '#2563eb' },
  { bg: '#fffbeb', icon: '#d97706' },
  { bg: '#fef2f2', icon: '#dc2626' },
  { bg: '#f5f3ff', icon: '#7c3aed' },
  { bg: '#ecfeff', icon: '#0891b2' },
];

export default function FertilizerAdviceScreen() {
  const router    = useRouter();
  const { language } = useLanguage();
  const isHausa   = language === 'hausa';
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (FERTILIZERS as any[]).filter(c =>
      !q ||
      c.name_en.toLowerCase().includes(q) ||
      c.name_ha.toLowerCase().includes(q)
    );
  }, [search]);

  const renderCrop = ({ item, index }: { item: any; index: number }) => {
    const color   = CROP_COLORS[index % CROP_COLORS.length];
    const icon    = CROP_ICONS[item.id] || 'leaf-outline';
    const stageCount = item.stages?.length || 0;

    return (
      <TouchableOpacity
        style={styles.cropCard}
        onPress={() => router.push({
          pathname: '/fertilizerAdviceDetail',
          params: { cropId: item.id },
        } as any)}
        activeOpacity={0.75}
      >
        <View style={[styles.cropIcon, { backgroundColor: color.bg }]}>
          <Ionicons name={icon as any} size={24} color={color.icon} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cropName}>
            {isHausa ? item.name_ha : item.name_en}
          </Text>
          <Text style={styles.cropMeta}>
            {stageCount} {isHausa
              ? `matakin girma`
              : `growth stage${stageCount !== 1 ? 's' : ''}`}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {isHausa ? 'Shawara kan Taki' : 'Fertilizer Advice'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Info banner */}
      <View style={styles.banner}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.bannerText}>
          {isHausa
            ? 'Zaɓi amfanin gonarka don ganin shawarwari na taki bisa matakin girma'
            : 'Select your crop to see fertilizer recommendations by growth stage'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder={isHausa ? 'Nema amfanin gona...' : 'Search crop...'}
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

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} {isHausa ? 'amfanin gona' : `crop${filtered.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Crop list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderCrop}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyTitle}>
              {isHausa ? 'Ba a sami amfanin gona ba' : 'No crops found'}
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

  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.primaryLight, borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder, padding: 14,
  },
  bannerText: { flex: 1, fontSize: 13, color: '#15803d', lineHeight: 18 },

  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark },

  countRow: { paddingHorizontal: 20, paddingVertical: 8 },
  countText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  cropCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  cropIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cropName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  cropMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle:     { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginTop: 12 },
});