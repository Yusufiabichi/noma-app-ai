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
import { useAuth } from '@/src/hooks/useAuth';
import { getScans } from '@/src/api/scans.api';
import { format } from 'date-fns';
import apiClient from '@/src/api/client';
import RequireAccess from '@/app/components/RequireAccess';
import { getQueue, onQueueChange, QueuedScan } from '@/src/services/offlineScanQueue';
import { buildScanResult, isLowConfidenceDiagnosis } from '@/src/utils/scanResult';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Diagnosis {
  _id: string;
  cropType: string;
  status: string;
  diagnosis?: {
    disease?: string;
    name?: string;
    confidence?: number;
    severity?: string;
    recommendations?: string[];
    futurePrevention?: string[];
    language?: string;
    lowConfidence?: boolean;
    confidenceThreshold?: number;
  };
  createdAt: string;
  /** Set for scans still on this phone (offline queue), not yet on the server */
  localQueueId?: string;
}

// Scans still on the phone. Once uploaded they have a serverScanId and the
// server's copy is listed instead, so nothing shows twice.
const toLocalDiagnosis = (item: QueuedScan): Diagnosis => ({
  _id: item.id,
  localQueueId: item.id,
  cropType: item.cropType,
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
  { label: 'Pending', labelHa: 'Ana jira', value: 'pending' },
  { label: 'Processing', labelHa: 'Ana dubawa', value: 'processing' },
  { label: 'Failed', labelHa: 'Ya gaza', value: 'failed' },
];

const PAGE_SIZE = 3; // Load 3 items per request

// ─── Main Component ──────────────────────────────────────────────────────
function DiagnosisHistoryScreen() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  // The language context stores 'hausa' (not 'ha')
  const isHausa = language === 'hausa';

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
      const unsent = queue.filter((item) => !item.serverScanId);
      // A scan just reached the server: reload so its server entry appears
      if (unsentCount !== -1 && unsent.length < unsentCount) fetchDiagnoses(1, true);
      unsentCount = unsent.length;
      setLocalScans(unsent.sort((a, b) => b.createdAt - a.createdAt).map(toLocalDiagnosis));
    };
    getQueue().then(apply);
    return onQueueChange(apply);
  }, [fetchDiagnoses]);

  const visibleLocalScans = localScans.filter(
    (item) =>
      (!selectedCrop || item.cropType === selectedCrop) &&
      (!selectedStatus || item.status === selectedStatus)
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

  // ─── Render item ──────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Diagnosis }) => {
    const statusText = isHausa
      ? item.status === 'diagnosed'
        ? 'An kammala'
        : item.status === 'pending'
        ? 'Ana jira'
        : item.status === 'processing'
        ? 'Ana dubawa'
        : item.status === 'failed'
        ? 'Ya gaza'
        : item.status
      : item.status === 'diagnosed'
      ? 'Completed'
      : item.status.charAt(0).toUpperCase() + item.status.slice(1);

    const isLocal = !!item.localQueueId;
    // Diagnosed but below the confidence threshold: no treatment, expert review only
    const notConfirmed = item.status === 'diagnosed' && isLowConfidenceDiagnosis(item.diagnosis);

    const statusColor =
      notConfirmed
        ? '#B45309'
        : item.status === 'diagnosed'
        ? '#16A34A'
        : item.status === 'pending' || item.status === 'processing'
        ? '#D97706'
        : '#DC2626';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (isLocal && item.status === 'pending') {
            // Same pending screen as right after an offline scan
            router.push({
              pathname: '/treatment-rec',
              params: {
                scanResult: JSON.stringify({
                  status: 'pending',
                  cropType: item.cropType,
                  isOnline: false,
                  queueId: item.localQueueId,
                  isFallback: false,
                }),
              },
            });
          } else if (isLocal) {
            router.push('/cropscan');
          } else if (item.status === 'diagnosed') {
            // Full result, including dosage, steps and timing
            router.push({
              pathname: '/treatment-rec',
              params: {
                scanResult: JSON.stringify(
                  buildScanResult(item, item.diagnosis?.language || (isHausa ? 'ha' : 'en'))
                ),
              },
            });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cropType}>{item.cropType.toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {notConfirmed ? (isHausa ? 'Ba a tabbatar ba' : 'Not confirmed') : statusText}
            </Text>
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
                ? (isHausa
                    ? 'Ba a iya aika wannan hoton ba. Danna don sake daukar hoto.'
                    : "This photo couldn't be sent. Tap to take a new one.")
                : (isHausa
                    ? 'An adana a wayarka. Za a aika idan intanet ya dawo.'
                    : "Saved on this phone. It will be sent when you're online.")}
            </Text>
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
    textTransform: 'uppercase',
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
