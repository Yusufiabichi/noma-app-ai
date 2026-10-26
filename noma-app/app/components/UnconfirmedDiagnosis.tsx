import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Result screen for a diagnosis below the confidence threshold. The server sends
// no treatment for these, so this screen never shows one: it names the suspected
// disease as "possible", warns, and sends the farmer to an expert.

const COLORS = {
  ink: '#0E3B2C',
  primary: '#16A34A',
  textLight: '#5F6B63',
  border: '#D9E0D6',
  cautionBg: '#FFF4E0',
  cautionBorder: '#EBC27A',
  cautionText: '#7A4300',
  white: '#ffffff',
};

export default function UnconfirmedDiagnosis({
  name,
  cropType,
  confidence,
  threshold,
  safetyNotice,
  isHausa,
  onConsultExpert,
  onRetake,
}: {
  name?: string;
  cropType?: string;
  confidence?: number;
  threshold: number;
  safetyNotice?: { title?: string; message?: string } | null;
  isHausa: boolean;
  onConsultExpert: () => void;
  onRetake: () => void;
}) {
  const t = (ha: string, en: string) => (isHausa ? ha : en);
  const suspected = name || t('cuta da ba a sani ba', 'an unknown problem');
  const crop = cropType ? cropType.charAt(0).toUpperCase() + cropType.slice(1) : null;
  const hasConfidence = typeof confidence === 'number' && Number.isFinite(confidence);
  const pct = hasConfidence ? Math.round((confidence as number) * 100) : null;
  const thresholdPct = Math.round(threshold * 100);

  // safetyNotice comes from the server in the scan's language; these are the fallbacks
  const noticeTitle = safetyNotice?.title || t('Ba a tabbatar da sakamakon ba', 'Diagnosis not confirmed');
  const noticeMessage =
    safetyNotice?.message ||
    t(
      'NomaApp ba ta da tabbaci game da wannan sakamakon, don haka ba a ba da shawarar magani ba. Da fatan ka tuntubi kwararre kafin ka saya ko ka yi amfani da wani sinadari.',
      'NomaApp is not confident about this result, so no treatment is recommended. Please consult an expert before buying or applying any chemical.'
    );

  return (
    <View>
      <Text style={styles.title} accessibilityRole="header">
        {t(`Wataƙila: ${suspected}`, `Possible: ${suspected}`)}
      </Text>
      {crop && <Text style={styles.crop}>{crop}</Text>}

      {/* Not dismissible: there is no close control */}
      <View style={styles.notice} accessibilityRole="alert">
        <View style={styles.noticeHeader}>
          <Ionicons name="warning" size={20} color={COLORS.cautionText} />
          <Text style={styles.noticeTitle}>{noticeTitle}</Text>
        </View>
        <Text style={styles.noticeText}>{noticeMessage}</Text>
        <Text style={styles.noticeConfidence}>
          {pct !== null
            ? t(
                `NomaApp tana da tabbacin kashi ${pct} cikin 100. Ana bukatar kashi ${thresholdPct} kafin a tabbatar da sakamako.`,
                `NomaApp is ${pct}% sure. A result needs ${thresholdPct}% to be confirmed.`
              )
            : t('Ba a sami matakin tabbaci na wannan sakamakon ba.', "This result has no confidence score, so it can't be confirmed.")}
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onConsultExpert} accessibilityRole="button">
        <Ionicons name="chatbubbles-outline" size={20} color={COLORS.white} />
        <Text style={styles.primaryBtnText}>{t('Tuntubi kwararre', 'Consult an expert')}</Text>
      </TouchableOpacity>
      <Text style={styles.primaryNote}>
        {t(
          'Kyauta ne a kowane tsari, kuma ba ya rage zaman kwararru na wata.',
          "Free on every plan. It doesn't use one of your monthly expert sessions."
        )}
      </Text>

      <TouchableOpacity style={styles.secondaryBtn} onPress={onRetake} accessibilityRole="button">
        <Ionicons name="camera-outline" size={20} color={COLORS.ink} />
        <Text style={styles.secondaryBtnText}>{t('Sake daukar hoto', 'Retake photo')}</Text>
      </TouchableOpacity>
      <Text style={styles.tip}>
        {t(
          'Hoton ganye guda a fili, cikin hasken rana, zai iya ba da tabbataccen sakamako.',
          'A clear photo of one leaf in daylight can give a confirmed result.'
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  crop: { fontSize: 15, color: COLORS.textLight, marginTop: 4 },
  notice: {
    marginTop: 18,
    backgroundColor: COLORS.cautionBg,
    borderWidth: 1,
    borderColor: COLORS.cautionBorder,
    borderLeftWidth: 5,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.cautionText },
  noticeText: { fontSize: 15, lineHeight: 22, color: COLORS.cautionText },
  noticeConfidence: { fontSize: 13, lineHeight: 19, color: COLORS.cautionText, fontWeight: '600' },
  primaryBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  primaryNote: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
  secondaryBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  secondaryBtnText: { color: COLORS.ink, fontSize: 15, fontWeight: '600' },
  tip: { fontSize: 13, lineHeight: 19, color: COLORS.textLight, textAlign: 'center', marginTop: 8, paddingHorizontal: 12 },
});
