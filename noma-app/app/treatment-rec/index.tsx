import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useLanguage } from '@/src/context/LanguageContext';
import { SafeAreaView } from "react-native-safe-area-context";
import logger from '@/src/utils/logger';
import IssueCard from '@/app/components/IssueCard';
import UnconfirmedDiagnosis from '@/app/components/UnconfirmedDiagnosis';
import { DEFAULT_CONFIDENCE_THRESHOLD, isLowConfidenceDiagnosis } from '@/src/utils/scanResult';
import { describeRejection } from '@/src/services/scanSubmission';
import { SCAN_COLORS as C } from '@/src/theme/scan';

interface ScanResult {
  status?: 'diagnosed' | 'rejected';
  rejection?: { code?: string; reason?: string; message?: string } | null;
  disease?: string;
  name?: string;
  cropType?: string;
  confidence?: number;
  cropConfidence?: number;
  severity?: string;
  severityAssumed?: boolean;
  recommendations?: string[];
  futurePrevention?: string[];
  applicationSteps?: string[];
  dosage?: string[];
  timing?: string[];
  safetyWarnings?: string[];
  expectedOutcome?: string[];
  followUpDays?: string[];
  inputSourcing?: string[];
  language?: string;
  isFallback?: boolean;
  scanId?: string;
  _id?: string;
  // Low-confidence fields (server decides; see isLowConfidenceDiagnosis)
  lowConfidence?: boolean;
  confidenceThreshold?: number;
  safetyNotice?: { title?: string; message?: string } | null;
}

const TreatmentRecommendationScreen = () => {
  // photoUri is set right after a scan, so "Change severity" can resend the same photo
  const params = useLocalSearchParams<{ scanResult?: string; photoUri?: string }>();
  const { language } = useLanguage();
  const isHausa = language === 'hausa';
  const t = (ha: string, en: string) => (isHausa ? ha : en);

  const scanResult = useMemo<ScanResult | null>(() => {
    if (!params.scanResult) return null;
    try {
      return JSON.parse(params.scanResult);
    } catch {
      logger.error('Failed to parse scanResult', { value: params.scanResult });
      return null;
    }
  }, [params.scanResult]);

  const scanId = scanResult?._id || scanResult?.scanId;
  const consultExpert = (isLowConfidence: boolean) =>
    router.push({
      pathname: '../(tabs)/expertChat',
      params: { scanId, isLowConfidence: isLowConfidence ? 'true' : 'false' },
    });
  const retake = () => router.replace('/cropscan');
  const goHome = () => router.replace('/(tabs)');

  if (!scanResult || (scanResult.status !== 'rejected' && !scanResult.disease)) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>{t('Babu sakamako', 'No result')}</Text>
          <Text style={styles.bodyText}>{t('Babu sakamakon bincike a nan.', 'There is no diagnosis to show.')}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={goHome}>
            <Text style={styles.primaryButtonText}>{t('Koma gida', 'Back home')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // The photo was fine but the AI couldn't diagnose it (not a plant, unsupported crop, unsure)
  if (scanResult.status === 'rejected') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          {params.photoUri && (
            <Image source={{ uri: params.photoUri }} style={styles.rejectedPhoto} accessibilityIgnoresInvertColors />
          )}
          <Text style={styles.header} accessibilityRole="header">
            {t('Ba a iya gane matsalar ba', "Couldn't diagnose this photo")}
          </Text>
          <Text style={styles.bodyText}>{describeRejection(scanResult.rejection, isHausa)}</Text>
          <Text style={styles.mutedNote}>
            {t(
              'An adana shi a tarihinka, kuma bai rage maka binciken yau ba.',
              "It's saved in your history and didn't use up one of today's diagnoses."
            )}
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={retake}>
            <Ionicons name="camera-outline" size={18} color={C.white} />
            <Text style={styles.primaryButtonText}>{t('Sake ɗaukar hoto', 'Retake photo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => consultExpert(false)}>
            <Ionicons name="chatbubbles-outline" size={18} color={C.ink} />
            <Text style={styles.secondaryButtonText}>{t('Tambayi kwararre', 'Ask an expert')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Checked first: no treatment, dosage, timing or where-to-buy for unconfirmed results
  if (isLowConfidenceDiagnosis(scanResult)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <UnconfirmedDiagnosis
            name={scanResult.name || scanResult.disease}
            cropType={scanResult.cropType}
            confidence={scanResult.confidence}
            threshold={scanResult.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD}
            safetyNotice={scanResult.safetyNotice}
            isHausa={isHausa}
            onConsultExpert={() => consultExpert(true)}
            onRetake={retake}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderSection = (icon: string, title: string, items: string[] | undefined, numbered = true) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon as any} size={20} color={C.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            {numbered && (
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>{index + 1}</Text>
              </View>
            )}
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const changeSeverity = () =>
    router.replace({ pathname: '/cropscan', params: params.photoUri ? { photoUri: params.photoUri } : {} });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>{t('Sakamakon bincike', 'Diagnosis')}</Text>

        <IssueCard
          diseaseName={scanResult.name || scanResult.disease || t('Matsala da ba a sani ba', 'Unknown issue')}
          cropType={scanResult.cropType || t('Amfanin gona da ba a sani ba', 'Unknown crop')}
          confidence={scanResult.confidence || 0}
          severity={scanResult.severity}
        />

        {scanResult.severityAssumed && (
          <View style={styles.assumedBanner}>
            <Text style={styles.assumedText}>
              {t('An nuna magani don tsanani matsakaici.', 'Treatment shown for moderate severity.')}
            </Text>
            <TouchableOpacity onPress={changeSeverity} hitSlop={8} accessibilityRole="button">
              <Text style={styles.assumedLink}>{t('Canja tsanani', 'Change severity')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Always visible when present, even without treatment data */}
        {!!scanResult.safetyWarnings?.length && (
          <View style={styles.warningBox}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={20} color={C.cautionText} />
              <Text style={[styles.sectionTitle, { color: C.cautionText }]}>{t('Gargadin lafiya', 'Safety warnings')}</Text>
            </View>
            {scanResult.safetyWarnings.map((warning, i) => (
              <Text key={i} style={styles.warningText}>{warning}</Text>
            ))}
          </View>
        )}

        {scanResult.isFallback ? (
          // No treatment data for this disease: an expert instead of an empty section
          <View style={styles.expertCard}>
            <Text style={styles.expertTitle}>
              {t('Babu shawarar magani ga wannan cuta tukuna', "We don't have treatment advice for this disease yet")}
            </Text>
            <Text style={styles.bodyText}>
              {t('Kwararre zai iya gaya maka abin da za ka yi.', 'An expert can tell you what to do.')}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => consultExpert(false)}>
              <Ionicons name="chatbubbles-outline" size={18} color={C.white} />
              <Text style={styles.primaryButtonText}>{t('Tuntubi kwararre', 'Consult an expert')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderSection('medkit-outline', t('Yi wannan yanzu', 'Recommended treatment'), scanResult.recommendations)}
            {renderSection('list-outline', t('Yadda ake aiwatarwa', 'Application steps'), scanResult.applicationSteps)}
            {renderSection('flask-outline', t('Adadin da za a yi amfani da shi', 'Dosage'), scanResult.dosage, false)}
            {renderSection('time-outline', t('Lokacin da za a yi', 'Timing'), scanResult.timing, false)}
            {renderSection('trending-up-outline', t('Sakamakon da za a yi tsammani', 'Expected outcome'), scanResult.expectedOutcome, false)}
            {renderSection('calendar-outline', t('Kwanakin bibiya', 'Follow-up days'), scanResult.followUpDays, false)}
            {renderSection('storefront-outline', t('Inda za a sayi magunguna', 'Where to buy inputs'), scanResult.inputSourcing, false)}
            {renderSection('shield-checkmark-outline', t('Hanyoyin rigakafi', 'Future prevention'), scanResult.futurePrevention)}

            <TouchableOpacity style={styles.primaryButton} onPress={goHome}>
              <Text style={styles.primaryButtonText}>{t('Zan yi wannan', 'I will do this')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => consultExpert(false)}>
              <Ionicons name="chatbubbles-outline" size={18} color={C.ink} />
              <Text style={styles.secondaryButtonText}>{t('Tambayi kwararre', 'Ask an expert')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },
  container: { padding: 20, flexGrow: 1 },
  header: { fontSize: 24, lineHeight: 30, fontWeight: "700", marginBottom: 14, color: C.ink },
  bodyText: { fontSize: 16, lineHeight: 23, color: C.ink },
  mutedNote: { fontSize: 14, lineHeight: 20, color: C.muted, marginTop: 12, marginBottom: 24 },
  rejectedPhoto: { width: 112, height: 112, borderRadius: 18, marginBottom: 20, backgroundColor: C.line },
  assumedBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 10,
    rowGap: 4,
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  assumedText: { fontSize: 15, color: C.ink },
  assumedLink: { fontSize: 15, color: C.primary, fontWeight: '700', textDecorationLine: 'underline' },
  warningBox: {
    backgroundColor: C.cautionBg,
    borderWidth: 1,
    borderColor: C.cautionBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
  },
  warningText: { fontSize: 15, lineHeight: 22, color: C.cautionText, marginBottom: 4 },
  expertCard: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  expertTitle: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: C.ink, marginBottom: 6 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: C.ink },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.paper,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  itemNumber: {
    backgroundColor: C.primarySoft,
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  itemNumberText: { fontWeight: "700", color: C.primary },
  itemText: { flex: 1, fontSize: 15, lineHeight: 22, color: C.ink },
  primaryButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonText: { color: C.white, fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryButtonText: { color: C.ink, fontSize: 16, fontWeight: "600" },
});

export default TreatmentRecommendationScreen;
