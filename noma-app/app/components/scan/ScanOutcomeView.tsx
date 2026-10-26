import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SCAN_COLORS as C } from '@/src/theme/scan';
import { CAPTURE_TIPS, describeQualityRejection, ScanOutcome } from '@/src/services/scanSubmission';

// Outcomes that end the scan without a result screen: an unusable photo,
// the AI being busy, the daily limit, a bad request, or saved for later (offline)

export type ScanEndState = Exclude<ScanOutcome, { kind: 'diagnosed' } | { kind: 'rejected' }> | { kind: 'queued' };

const TIP_ICONS = ['leaf-outline', 'scan-outline', 'sunny-outline', 'hand-left-outline'];

export default function ScanOutcomeView({
  state,
  photoUri,
  isHausa,
  onRetake,
  onTryAgain,
  onPlans,
  onDone,
}: {
  state: ScanEndState;
  photoUri: string | null;
  isHausa: boolean;
  onRetake: () => void;
  onTryAgain: () => void;
  onPlans: () => void;
  onDone: () => void;
}) {
  const t = (ha: string, en: string) => (isHausa ? ha : en);

  type Action = { label: string; onPress: () => void };
  let icon: string;
  let tone: 'alert' | 'caution' | 'calm';
  let title: string;
  let body: string;
  let tip: string | null = null;
  let showTips = false;
  let primary: Action;
  let secondary: Action | null = null;

  const retake = { label: t('Sake ɗaukar hoto', 'Retake photo'), onPress: onRetake };

  switch (state.kind) {
    case 'quality': {
      const described = describeQualityRejection(state, isHausa);
      icon = 'eye-off-outline';
      tone = 'caution';
      title = t('Ba a iya amfani da hoton ba', "This photo can't be used");
      body = described.problem;
      tip = described.tip;
      showTips = true;
      primary = retake;
      break;
    }
    case 'unavailable':
      icon = 'cloud-offline-outline';
      tone = 'caution';
      title = t('Ba a iya bincike a yanzu', 'Diagnosis is temporarily unavailable');
      body = t(
        'Ba a adana komai ba. Ka sake gwadawa nan da ɗan lokaci, da hoto ɗaya.',
        'Nothing was saved. Try again in a moment with the same photo.'
      );
      primary = { label: t('Sake gwadawa', 'Try again'), onPress: onTryAgain };
      secondary = retake;
      break;
    case 'limit':
      icon = 'lock-closed-outline';
      tone = 'calm';
      title = t('Ka yi amfani da duk binciken yau', "You've used today's diagnoses");
      body = isHausa
        ? 'Tsarinka yana ba da adadin bincike a rana. Ka zaɓi babban tsari don ci gaba yau.'
        : state.message || 'Your plan includes a set number of diagnoses a day. Choose a bigger plan to keep diagnosing today.';
      primary = { label: t('Duba tsare-tsare', 'See plans'), onPress: onPlans };
      secondary = { label: t('Koma gida', 'Back home'), onPress: onDone };
      break;
    case 'invalid':
      icon = 'alert-circle-outline';
      tone = 'alert';
      title = t('Ba a iya aika wannan hoton ba', "This photo couldn't be sent");
      body = isHausa ? 'Ka sake ɗaukar hoto ka gwada kuma.' : state.message || 'Take the photo again and retry.';
      primary = retake;
      break;
    case 'queued':
    default:
      icon = 'cloud-upload-outline';
      tone = 'calm';
      title = t('Za a bincika idan intanet ya dawo', "Will diagnose when you're online");
      body = t(
        'An adana hotonka a wayarka. Za mu aika shi kai tsaye, mu sanar da kai sakamakon.',
        "Your photo is saved on this phone. We'll send it automatically and notify you with the result."
      );
      primary = { label: t('Na gama', 'Done'), onPress: onDone };
      secondary = { label: t('Bincika wani hoto', 'Scan another photo'), onPress: onRetake };
  }

  const badge =
    tone === 'alert'
      ? { bg: C.alertBg, fg: C.alertText }
      : tone === 'caution'
      ? { bg: C.cautionBg, fg: C.cautionText }
      : { bg: C.primarySoft, fg: C.primary };

  // Quality rejections and AI outages never count against the daily limit
  const notCounted = state.kind === 'quality' || state.kind === 'unavailable';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.photoWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} accessibilityIgnoresInvertColors />
          ) : (
            <View style={[styles.photo, { backgroundColor: C.line }]} />
          )}
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Ionicons name={icon as any} size={20} color={badge.fg} />
          </View>
        </View>

        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        <Text style={styles.text}>{body}</Text>
        {tip && <Text style={styles.tip}>{tip}</Text>}

        {showTips && (
          <View style={styles.tips}>
            <Text style={styles.tipsHeading}>{t('Don hoto mai kyau', 'For a clear photo')}</Text>
            <View style={styles.tipGrid}>
              {CAPTURE_TIPS.map((item, i) => (
                <View key={item.en} style={styles.tipCell}>
                  <Ionicons name={TIP_ICONS[i] as any} size={18} color={C.primary} />
                  <Text style={styles.tipCellText}>{isHausa ? item.ha : item.en}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {notCounted && (
          <Text style={styles.note}>
            {t('Wannan bai rage maka binciken yau ba.', "This didn't use up one of today's diagnoses.")}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={primary.onPress} accessibilityRole="button">
          <Text style={styles.primaryBtnText}>{primary.label}</Text>
        </TouchableOpacity>
        {secondary && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={secondary.onPress} accessibilityRole="button">
            <Text style={styles.secondaryBtnText}>{secondary.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  body: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16 },
  photoWrap: { width: 112, height: 112, marginBottom: 24 },
  photo: { width: 112, height: 112, borderRadius: 18 },
  badge: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: C.ink, marginBottom: 10 },
  text: { fontSize: 16, lineHeight: 23, color: C.ink },
  tip: { fontSize: 16, lineHeight: 23, color: C.ink, fontWeight: '600', marginTop: 10 },
  tips: { marginTop: 24, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 16 },
  tipsHeading: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 12 },
  tipGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  tipCell: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  tipCellText: { flex: 1, fontSize: 15, color: C.ink },
  note: { fontSize: 14, color: C.muted, marginTop: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 8 },
  primaryBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: C.white, fontSize: 17, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: C.ink, fontSize: 16, fontWeight: '600' },
});
