// Replace your existing diagnosis card block with this full snippet.
// Works in both ExpertCaseDetailScreen and FarmerCaseDetailScreen.
// Requires: import { Modal, Image, Dimensions } from 'react-native';

import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Image,
  Dimensions, StyleSheet, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Image Viewer Modal ───────────────────────────────────────────────────────

const ImageViewerModal = ({
  visible, imageUrl, onClose,
}: {
  visible: boolean; imageUrl: string; onClose: () => void;
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={imageModal.overlay}>
        <TouchableWithoutFeedback>
          <View style={imageModal.container}>
            <Image
              source={{ uri: imageUrl }}
              style={imageModal.image}
              resizeMode="contain"
            />
            <TouchableOpacity style={imageModal.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

// ─── Usage inside your screen component ──────────────────────────────────────
// Add this state to the top of ExpertCaseDetailScreen / FarmerCaseDetailScreen:
//   const [imageViewerVisible, setImageViewerVisible] = useState(false);
//
// Replace the diagnosisCard block with:

const DiagnosisCard = ({ snap, sevCfg, confidence }: {
  snap: any; sevCfg: any; confidence: string;
}) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const hasImage = !!snap.imageUrl;

  return (
    <>
      <View style={cardStyles.diagnosisCard}>
        <View style={cardStyles.diagnosisHeader}>
          <View style={cardStyles.bugIcon}>
            <Ionicons name="bug-outline" size={18} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cardStyles.diseaseName}>
              {snap.disease?.replace(/_/g, ' ') || 'Unknown disease'}
            </Text>
            <Text style={cardStyles.cropName}>
              {snap.cropType || '—'}
            </Text>
          </View>

          {/* View Picture button — only shown if image exists */}
          {hasImage && (
            <TouchableOpacity
              style={cardStyles.viewImageBtn}
              onPress={() => setImageViewerVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="image-outline" size={15} color="#16A34A" />
              <Text style={cardStyles.viewImageText}>View photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={cardStyles.diagnosisMeta}>
          <View style={[cardStyles.severityPill, { backgroundColor: sevCfg.bg }]}>
            <Ionicons name="warning-outline" size={12} color={sevCfg.color} />
            <Text style={[cardStyles.severityText, { color: sevCfg.color }]}>
              {snap.severity || '—'} severity
            </Text>
          </View>
          <View style={cardStyles.confidencePill}>
            <Text style={cardStyles.confidenceText}>{confidence} confidence</Text>
          </View>
        </View>

        {/* Thumbnail — tappable shortcut to full viewer */}
        {hasImage && (
          <TouchableOpacity
            style={cardStyles.thumbnailWrap}
            onPress={() => setImageViewerVisible(true)}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: snap.imageUrl }}
              style={cardStyles.thumbnail}
              resizeMode="cover"
            />
            <View style={cardStyles.thumbnailOverlay}>
              <Ionicons name="expand-outline" size={16} color="#fff" />
              <Text style={cardStyles.thumbnailOverlayText}>Tap to enlarge</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Full-screen image viewer */}
      {hasImage && (
        <ImageViewerModal
          visible={imageViewerVisible}
          imageUrl={snap.imageUrl}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  diagnosisCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 16,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  bugIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
  },
  diseaseName: {
    fontSize: 16, fontWeight: '700', color: '#1f2937', textTransform: 'capitalize',
  },
  cropName: { fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },

  // View image button — top right of header
  viewImageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  viewImageText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  diagnosisMeta: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  severityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
  },
  severityText:   { fontSize: 11, fontWeight: '600' },
  confidencePill: { backgroundColor: '#f3f4f6', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  confidenceText: { fontSize: 11, color: '#6b7280', fontWeight: '500' },

  // Thumbnail
  thumbnailWrap: {
    borderRadius: 10, overflow: 'hidden', position: 'relative', height: 160,
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  thumbnailOverlayText: { fontSize: 12, color: '#fff', fontWeight: '600' },
});

const imageModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { DiagnosisCard, ImageViewerModal };
export default DiagnosisCard;