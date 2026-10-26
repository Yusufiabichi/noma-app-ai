import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';
import { getScans } from '@/src/api/scans.api';
import { format } from 'date-fns';
import RequireAccess from '@/app/components/RequireAccess';
import { useAlert } from '@/src/context/AlertContext';
import { getQueue, onQueueChange, QueuedScan } from '@/src/services/offlineScanQueue';
import { describeQualityRejection, describeRejection, retryOldScan } from '@/src/services/scanSubmission';
import { buildScanResult, isLowConfidenceDiagnosis } from '@/src/utils/scanResult';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Diagnosis {
  _id: string;
  /** Older scans carry the farmer's pick here; new ones only have diagnosis.cropType */
  cropType?: string | null;
  /** diagnosed | rejected; pending/failed only on scans from before diagnosis happened in the request */
  status: string;
  diagnosis?: {
    disease?: string;
    name?: string;
    cropType?: string;
    confidence?: number;
    severity?: string;
    recommendations?: string[];
    futurePrevention?: string[];
    language?: string;
    lowConfidence?: boolean;
    confidenceThreshold?: number;
  };
  rejection?: { code?: string; reason?: string; message?: string } | null;
  createdAt: string;
  /** Set for photos still on this phone (offline queue), not yet on the server */
  localQueueId?: string;
}

// Photos still on the phone. Once sent they have a serverScanId and the
// server's copy is listed instead, so nothing shows twice.
const toLocalDiagnosis = (item: QueuedScan): Diagnosis => ({
  _id: item.id,
  localQueueId: item.id,
  status: item.status === 'failed' ? 'failed' : 'pending',
  createdAt: new Date(item.createdAt).toISOString(),
});

// ─── Constants ────────────────────────────────────────────────────────────
const CROP_FILTERS = [
  { label: 'All', labelHa: 'Duka', value: '' },
  { label: 'Maize', labelHa: 'Masara', value: 'maize' },
  { label: 'Rice', labelHa: 'Shinkafa', value: 'rice' },
  { label: 'Tomato', labelHa: 'Tumatur', value: 'tomato' },
  { label: 'Cassava', labelHa: 'Rogo', value: 'cassava' },
  { label: 'Yam', labelHa: 'Doya', value: 'yam' },
  { label: 'Sorghum', labelHa: 'Dawa', value: 'sorghum' },
  { label: 'Cowpea', labelHa: 'Wake', value: 'cowpea' },
  { label: 'Soybean', labelHa: 'Waken suya', value: 'soybean' },
  { label: 'Vegetables', labelHa: 'Kayan lambu', value: 'vegetables' },
  { label: 'Fruits', labelHa: "'Ya'yan itace", value: 'fruits' },
];

const STATUS_FILTERS = [
  { label: 'All', labelHa: 'Duka', value: '' },
  { label: 'Diagnosed', labelHa: 'An kammala', value: 'diagnosed' },
  { label: "Couldn't diagnose", labelHa: 'Ba a gane ba', value: 'rejected' },
  { label: 'Pending', labelHa: 'Ana jira', value: 'pending' },
  { label: 'Failed', labelHa: 'Ya gaza', value: 'failed' },
];

const PAGE_SIZE = 3; // Load 3 items per request

// ─── Main Component ──────────────────────────────────────────────────────
function DiagnosisHistoryScreen() {
  const { language } = useLanguage();
  const { showAlert } = useAlert();
  const router = useRouter();

  // The language context stores 'hausa' (not 'ha')
  const isHausa = language === 'hausa';
  const t = (ha: string, en: string) => (isHausa ? ha : en);

  // Old pending/failed scan being diagnosed again
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // State
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Offline scans waiting to be sent (or that couldn't be sent)
  const [localScans, setLocalScans] = useState<Diagnosis[]>([]);

  // ─── Fetch function ───────────────────────────────────────────────────
  const fetchDiagnoses = useCallback(
    async (pageNum = 1, refresh = false) => {
      try {
        const response = await getScans({
          page: pageNum,
          limit: PAGE_SIZE,
          cropType: selectedCrop || undefined,
          status: selectedStatus || undefined,
        });
        console.log('Full response from getScans:', response);

        const { scans, pagination } = response;
        const newData = scans || [];
        const totalItems = pagination?.total || 0;

        if (refresh) {
          setDiagnoses(newData);
        } else {
          setDiagnoses((prev) => [...prev, ...newData]);
        }

        setTotal(totalItems);
        setHasMore(pageNum * PAGE_SIZE < totalItems);
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to fetch diagnoses:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [selectedCrop, selectedStatus]
  );

  // ─── Load initial data ────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setDiagnoses([]);
    setPage(1);
    setHasMore(true);
    fetchDiagnoses(1, true);
  }, [selectedCrop, selectedStatus]);

  // ─── Offline scans: shown on top, updated live as the queue changes ──────
  useEffect(() => {
    let unsentCount = -1;
    const apply = (queue: QueuedScan[]) => {
      // Unusable photos were never saved by the server, so they stay out of history too
      const unsent = queue.filter((item) => !item.serverScanId && !item.qualityRejected);
      // A scan just reached the server: reload so its server entry appears
      if (unsentCount !== -1 && unsent.length < unsentCount) fetchDiagnoses(1, true);
      unsentCount = unsent.length;
      setLocalScans(unsent.sort((a, b) => b.createdAt - a.createdAt).map(toLocalDiagnosis));
    };
    getQueue().then(apply);
    return onQueueChange(apply);
  }, [fetchDiagnoses]);

  // Photos on the phone have no crop until the AI sees them
  const visibleLocalScans = localScans.filter(
    (item) => !selectedCrop && (!selectedStatus || item.status === selectedStatus)
  );
  const listData = [...visibleLocalScans, ...diagnoses];

  // ─── Refresh ──────────────────────────────────────────────────────────
  const onRefresh = () => {
    setRefreshing(true);
    fetchDiagnoses(1, true);
  };

  // ─── Load more ────────────────────────────────────────────────────────
  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    fetchDiagnoses(page + 1, false);
  };

  const openResult = (scan: any) =>
    router.push({
      pathname: '/treatment-rec',
      params: {
        scanResult: JSON.stringify(buildScanResult(scan, scan?.diagnosis?.language || (isHausa ? 'ha' : 'en'))),
      },
    });

  // Scans from before diagnosis happened in the request: diagnose them now
  const retry = async (item: Diagnosis) => {
    if (retryingId) return;
    setRetryingId(item._id);
    try {
      const outcome = await retryOldScan(item._id, { language: isHausa ? 'ha' : 'en' });
      if (outcome.kind === 'diagnosed' || outcome.kind === 'rejected') {
        fetchDiagnoses(1, true);
        openResult(outcome.scan);
        return;
      }
      if (outcome.kind === 'limit') {
        showAlert({
          title: t('Ka yi amfani da duk binciken yau', "You've used today's diagnoses"),
          message: t('Ka zaɓi babban tsari don ci gaba yau.', 'Choose a bigger plan to keep diagnosing today.'),
          buttons: [
            { text: t('Soke', 'Cancel'), style: 'cancel' },
            { text: t('Duba tsare-tsare', 'See plans'), onPress: () => router.push('/(onboarding)/plans') },
          ],
        });
        return;
      }
      let message: string;
      if (outcome.kind === 'quality') {
        const described = describeQualityRejection(outcome, isHausa);
        message = [described.problem, described.tip, t('Ka ɗauki sabon hoto.', 'Take a new photo.')]
          .filter(Boolean)
          .join(' ');
      } else if (outcome.kind === 'unavailable') {
        message = t('Ba a iya bincike a yanzu. Ka sake gwadawa nan da ɗan lokaci.', 'Diagnosis is temporarily unavailable. Try again in a moment.');
      } else {
        message = isHausa ? 'An kasa sake binciken wannan hoton.' : outcome.message || "This scan couldn't be diagnosed.";
      }
      showAlert({ title: t('Ba a gane ba', "Couldn't diagnose"), message, buttons: [{ text: t('Yarda', 'OK') }] });
    } finally {
      setRetryingId(null);
    }
  };

  // ─── Render item ──────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Diagnosis }) => {
    const isLocal = !!item.localQueueId;
    const isRejected = item.status === 'rejected';
    // Old scans the server never finished: offer Try again
    const isUnfinished = !isLocal && (item.status === 'pending' || item.status === 'failed');
    // Diagnosed but below the confidence threshold: no treatment, expert review only
    const notConfirmed = item.status === 'diagnosed' && isLowConfidenceDiagnosis(item.diagnosis);

    const statusText = notConfirmed
      ? t('Ba a tabbatar ba', 'Not confirmed')
      : isRejected
      ? t('Ba a gane ba', "Couldn't diagnose")
      : item.status === 'diagnosed'
      ? t('An kammala', 'Completed')
      : item.status === 'pending'
      ? t('Ana jira', 'Pending')
      : t('Ya gaza', 'Failed');

    const statusColor =
      notConfirmed || isRejected
        ? '#B45309'
        : item.status === 'diagnosed'
        ? '#16A34A'
        : item.status === 'pending'
        ? '#D97706'
        : '#DC2626';

    const cropType = item.diagnosis?.cropType || item.cropType;
    const cropLabel = isLocal ? t('Hoto a wayarka', 'Photo on this phone') : cropType || t('Amfanin gona', 'Crop');

    return (
      <TouchableOpacity
        style={styles.card}
        disabled={isLocal && item.status === 'pending'}
        onPress={() => {
          if (isLocal) {
            router.push('/cropscan');
          } else if (item.status === 'diagnosed' || isRejected) {
            // Full result, including dosage, steps and timing
            openResult(item);
          } else if (isUnfinished) {
            retry(item);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cropType}>{cropLabel}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {isLocal ? (
          <View style={styles.localRow}>
            <Ionicons
              name={item.status === 'failed' ? 'alert-circle-outline' : 'cloud-offline-outline'}
              size={16}
              color={statusColor}
            />
            <Text style={styles.localText}>
              {item.status === 'failed'
                ? t('Ba a iya binciken wannan hoton ba. Danna don ɗaukar sabo.', "This photo couldn't be diagnosed. Tap to take a new one.")
                : t('Za a bincika idan intanet ya dawo.', "Will diagnose when you're online.")}
            </Text>
          </View>
        ) : isRejected ? (
          <Text style={styles.rejectionText}>{describeRejection(item.rejection, isHausa)}</Text>
        ) : isUnfinished ? (
          <View style={styles.retryRow}>
            <Text style={styles.localText}>
              {t('Ba a kammala binciken wannan hoton ba.', "This photo's diagnosis wasn't finished.")}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => retry(item)}
              disabled={!!retryingId}
              accessibilityRole="button"
            >
              {retryingId === item._id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.retryButtonText}>{t('Sake gwadawa', 'Try again')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.diseaseName}>
            {notConfirmed
              ? `${isHausa ? 'Wataƙila' : 'Possible'}: ${item.diagnosis?.name || item.diagnosis?.disease || (isHausa ? 'ba a sani ba' : 'unknown')}`
              : item.diagnosis?.name || item.diagnosis?.disease || (isHausa ? 'Ba a sani ba' : 'Unknown')}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.date}>
            {format(new Date(item.createdAt), 'MMM d, yyyy')}
          </Text>
          {!notConfirmed && item.diagnosis?.confidence && (
            <Text style={styles.confidence}>
              {Math.round(item.diagnosis.confidence * 100)}% {isHausa ? 'tabbaci' : 'confidence'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Empty state ──────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>
        {isHausa ? 'Babu tarihin bincike' : 'No diagnosis history'}
      </Text>
      <Text style={styles.emptySub}>
        {isHausa
          ? 'Ba ka yi binciken shuka ba tukuna. Yi bincike don ganin sakamako.'
          : 'You haven’t scanned any crops yet. Start scanning to see results here.'}
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/cropscan')}
      >
        <Text style={styles.scanButtonText}>
          {isHausa ? 'Yi Bincike Yanzu' : 'Scan Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Footer loader ────────────────────────────────────────────────────
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#16A34A" />
        <Text style={styles.footerText}>
          {isHausa ? 'Ana loda...' : 'Loading more...'}
        </Text>
      </View>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isHausa ? 'Tarihin Bincike' : 'Diagnosis History'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {CROP_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, selectedCrop === f.value && styles.filterChipActive]}
              onPress={() => setSelectedCrop(f.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCrop === f.value && styles.filterChipTextActive,
                ]}
              >
                {isHausa ? f.labelHa : f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, selectedStatus === f.value && styles.filterChipActive]}
              onPress={() => setSelectedStatus(f.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === f.value && styles.filterChipTextActive,
                ]}
              >
                {isHausa ? f.labelHa : f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Count */}
      {!loading && (
        <Text style={styles.countText}>
          {total + visibleLocalScans.length} {isHausa ? 'sakamako' : 'results'}
        </Text>
      )}

      {/* List */}
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  localRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginVertical: 6 },
  localText: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  rejectionText: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 8 },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
  retryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 96,
    alignItems: 'center',
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  countText: {
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8FFFB',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  confidence: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  initialLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default function DiagnosisHistoryScreenWithAccess() {
  return (
    <RequireAccess feature="scanHistory">
      <DiagnosisHistoryScreen />
    </RequireAccess>
  );
}
