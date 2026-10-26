import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SCAN_COLORS as C } from '@/src/theme/scan';
import type { Severity } from '@/src/services/scanSubmission';
import SeverityIllustration from './SeverityIllustration';

// "unsure" sends no severity; the server then assumes moderate
export type SeverityChoice = Severity | 'unsure';

const OPTIONS: { value: Severity; title: [string, string]; detail: [string, string] }[] = [
  {
    value: 'low',
    title: ['Kadan', 'Low'],
    detail: ["'Yan tabo a kan 'yan ganye", 'A few spots on a few leaves'],
  },
  {
    value: 'moderate',
    title: ['Matsakaici', 'Moderate'],
    detail: ['Tabo a kan ganye da yawa', 'Spots on many leaves'],
  },
  {
    value: 'high',
    title: ['Mai yawa', 'High'],
    detail: ['Yawancin ganyen sun kamu, ko ganyen suna mutuwa', 'Most leaves affected, or leaves dying'],
  },
];

export default function SeverityStep({
  photoUri,
  choice,
  isHausa,
  onChoose,
  onDiagnose,
  onRetake,
}: {
  photoUri: string;
  choice: SeverityChoice | null;
  isHausa: boolean;
  onChoose: (choice: SeverityChoice) => void;
  onDiagnose: () => void;
  onRetake: () => void;
}) {
  const t = (ha: string, en: string) => (isHausa ? ha : en);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.photoRow}>
        <Image source={{ uri: photoUri }} style={styles.thumb} accessibilityIgnoresInvertColors />
        <Text style={styles.photoNote}>{t('An ɗauki hoto', 'Photo taken')}</Text>
        <TouchableOpacity onPress={onRetake} hitSlop={10} accessibilityRole="button">
          <Text style={styles.retake}>{t('Sake ɗauka', 'Retake')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.question} accessibilityRole="header">
          {t('Yaya yawan shukar da ta kamu?', 'How much of the plant is affected?')}
        </Text>
        <Text style={styles.hint}>
          {t('Wannan yana taimaka mana mu ba da adadin magani daidai.', 'This sets the right treatment amount.')}
        </Text>

        {OPTIONS.map(option => {
          const selected = choice === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onChoose(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t(...option.title)}. ${t(...option.detail)}`}
            >
              <View style={styles.art}>
                <SeverityIllustration severity={option.value} size={84} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, selected && { color: C.primary }]}>{t(...option.title)}</Text>
                <Text style={styles.optionDetail}>{t(...option.detail)}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <Ionicons name="checkmark" size={14} color={C.white} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.unsure, choice === 'unsure' && styles.unsureSelected]}
          onPress={() => onChoose('unsure')}
          accessibilityRole="radio"
          accessibilityState={{ selected: choice === 'unsure' }}
        >
          <Ionicons
            name={choice === 'unsure' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={choice === 'unsure' ? C.primary : C.muted}
          />
          <Text style={styles.unsureText}>{t('Ban tabbata ba', 'Not sure')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, !choice && styles.primaryBtnDisabled]}
          onPress={onDiagnose}
          disabled={!choice}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>{t('Bincika hoton', 'Diagnose photo')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  thumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: C.line },
  photoNote: { flex: 1, fontSize: 15, color: C.ink, fontWeight: '600' },
  retake: { fontSize: 15, color: C.primary, fontWeight: '600' },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  question: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: C.ink, marginBottom: 6 },
  hint: { fontSize: 15, lineHeight: 21, color: C.muted, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.line,
    padding: 10,
    paddingRight: 16,
    marginBottom: 12,
  },
  optionSelected: { borderColor: C.primary, backgroundColor: C.primarySoft },
  art: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 4 },
  optionDetail: { fontSize: 15, lineHeight: 20, color: C.muted },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: C.primary, backgroundColor: C.primary },
  unsure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 4,
    borderRadius: 12,
  },
  unsureSelected: { backgroundColor: C.primarySoft },
  unsureText: { fontSize: 16, color: C.ink, fontWeight: '600' },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  primaryBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: C.white, fontSize: 17, fontWeight: '700' },
});
