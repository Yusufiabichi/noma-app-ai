import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';
import TIPS_DATA from '@/constants/farmingTips.json';

const COLORS = {
  primary: '#16A34A', primaryLight: '#f0fdf4', primaryBorder: '#bbf7d0',
  background: '#f8f8f8', white: '#ffffff', textDark: '#1f2937',
  textLight: '#6b7280', border: '#e5e7eb', error: '#dc2626',
  errorLight: '#fef2f2', amber: '#d97706', amberLight: '#fffbeb',
  amberBorder: '#fde68a', blue: '#2563eb', blueLight: '#eff6ff',
};

const CATEGORY_CONFIG: Record<string, {
  color: string; bg: string; border: string; icon: string;
}> = {
  soil:    { color: COLORS.amber,   bg: COLORS.amberLight,   border: COLORS.amberBorder, icon: 'layers-outline'  },
  planting:{ color: COLORS.primary, bg: COLORS.primaryLight, border: COLORS.primaryBorder, icon: 'leaf-outline'  },
  weed:    { color: COLORS.error,   bg: COLORS.errorLight,   border: '#fecaca',          icon: 'cut-outline'     },
  climate: { color: COLORS.blue,    bg: COLORS.blueLight,    border: '#bfdbfe',          icon: 'cloud-outline'   },
};

export default function FarmingTipDetailScreen() {
  const router  = useRouter();
  const { language } = useLanguage();
  const { tipId } = useLocalSearchParams<{ tipId: string }>();
  const isHausa  = language === 'hausa';

  const tip = useMemo(() =>
    (TIPS_DATA as any[]).find(t => t.id === tipId),
    [tipId]
  );

  if (!tip) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
        <Text style={styles.errorText}>
          {isHausa ? 'Ba a sami shawarwari ba' : 'Tip not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>
            {isHausa ? 'Koma baya' : 'Go back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catCfg = CATEGORY_CONFIG[tip.category] || CATEGORY_CONFIG.planting;
  const title  = isHausa ? tip.title_ha : tip.title_en;
  const body   = isHausa ? tip.tip_ha   : tip.tip_en;
  const cat    = isHausa ? tip.category_ha : tip.category_en;
  const crop   = isHausa ? tip.crop_ha     : tip.crop_en;

  // Find related tips — same crop, different category
  const related = (TIPS_DATA as any[])
    .filter(t => t.crop === tip.crop && t.id !== tip.id)
    .slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.navHeader, { borderBottomColor: catCfg.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card */}
        <View style={[styles.identityCard, {
          backgroundColor: catCfg.bg, borderColor: catCfg.border,
        }]}>
          <View style={styles.identityTop}>
            <View style={[styles.catIcon, { backgroundColor: catCfg.color + '20' }]}>
              <Ionicons name={catCfg.icon as any} size={22} color={catCfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.catBadge, { backgroundColor: catCfg.color }]}>
                  <Text style={styles.catBadgeText}>{cat}</Text>
                </View>
                <View style={styles.cropBadge}>
                  <Ionicons name="leaf-outline" size={11} color={COLORS.primary} />
                  <Text style={styles.cropBadgeText}>{crop}</Text>
                </View>
              </View>
              <Text style={[styles.tipTitle, { color: catCfg.color }]}>{title}</Text>
            </View>
          </View>
        </View>

        {/* Full tip body */}
        <View style={styles.tipBodyCard}>
          <View style={styles.tipBodyHeader}>
            <Ionicons name="bulb-outline" size={18} color={COLORS.amber} />
            <Text style={styles.tipBodyHeaderText}>
              {isHausa ? 'Shawarwari' : 'The Tip'}
            </Text>
          </View>
          <Text style={styles.tipBodyText}>{body}</Text>
        </View>

        {/* Related tips from same crop */}
        {related.length > 0 && (
          <>
            <Text style={styles.relatedTitle}>
              {isHausa
                ? `Ƙari game da ${crop}`
                : `More tips for ${crop}`}
            </Text>
            {related.map(r => {
              const rCat = CATEGORY_CONFIG[r.category] || CATEGORY_CONFIG.planting;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.relatedCard}
                  onPress={() => router.replace({
                    pathname: '/farmingTipsDetail',
                    params: { tipId: r.id },
                  } as any)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.relatedStrip, { backgroundColor: rCat.color }]} />
                  <View style={styles.relatedBody}>
                    <View style={[styles.relatedCatBadge, { backgroundColor: rCat.bg }]}>
                      <Ionicons name={rCat.icon as any} size={10} color={rCat.color} />
                      <Text style={[styles.relatedCatText, { color: rCat.color }]}>
                        {isHausa ? r.category_ha : r.category_en}
                      </Text>
                    </View>
                    <Text style={styles.relatedTipTitle}>
                      {isHausa ? r.title_ha : r.title_en}
                    </Text>
                    <Text style={styles.relatedTipPreview} numberOfLines={1}>
                      {isHausa ? r.tip_ha : r.tip_en}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Scan CTA */}
        <View style={styles.scanCta}>
          <Ionicons name="scan-outline" size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanCtaTitle}>
              {isHausa
                ? 'Ganin cutar a gonarka?'
                : 'Seeing disease on your crop?'}
            </Text>
            <Text style={styles.scanCtaDesc}>
              {isHausa
                ? 'Dauki hoto don gano cutar da AI nan da nan'
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
    backgroundColor: COLORS.white, borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  navTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.textDark,
    flex: 1, textAlign: 'center',
  },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  // Identity card
  identityCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
  },
  identityTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  badgeRow:     { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  catBadge:     { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  catBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  cropBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingVertical: 3, paddingHorizontal: 8,
  },
  cropBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  tipTitle:      { fontSize: 16, fontWeight: '700', lineHeight: 22 },

  // Tip body
  tipBodyCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 20,
  },
  tipBodyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 12,
  },
  tipBodyHeaderText: { fontSize: 13, fontWeight: '700', color: COLORS.amber },
  tipBodyText:       { fontSize: 14, color: COLORS.textDark, lineHeight: 22 },

  // Related tips
  relatedTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textDark,
    marginBottom: 10,
  },
  relatedCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: 8, overflow: 'hidden',
  },
  relatedStrip:    { width: 4, alignSelf: 'stretch' },
  relatedBody:     { flex: 1, padding: 12 },
  relatedCatBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6,
    alignSelf: 'flex-start', marginBottom: 4,
  },
  relatedCatText:    { fontSize: 9, fontWeight: '700' },
  relatedTipTitle:   { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 2 },
  relatedTipPreview: { fontSize: 11, color: COLORS.textLight },

  // Scan CTA
  scanCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.primaryLight, borderWidth: 1,
    borderColor: COLORS.primaryBorder, borderRadius: 14,
    padding: 14, marginTop: 8,
  },
  scanCtaTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  scanCtaDesc:  { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  scanCtaBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  scanCtaBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});