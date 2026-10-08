import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  RecordingOptions,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { askByVoice } from '@/src/api/voice.api';
import { isOnline } from '@/src/utils/network';
import logger from '@/src/utils/logger';

// Mono 16kHz AAC: enough for speech recognition, small enough for slow rural networks
const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
};

const MAX_RECORDING_MS = 60000;
const MIN_RECORDING_MS = 700;

type Phase = 'idle' | 'recording' | 'sending';

type ChatMessage =
  | { id: string; role: 'user'; text: string | null; durationMs: number }
  | { id: string; role: 'assistant'; text: string }
  | { id: string; role: 'error'; text: string; retryUri?: string; retryDurationMs?: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  language: string;
  cropType?: string | null;
};

let messageCounter = 0;
const nextId = () => `${Date.now()}-${messageCounter++}`;

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

export default function VoiceAssistantSheet({ visible, onClose, language, cropType }: Props) {
  const isHausa = language === 'hausa';
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 250);
  const scrollRef = useRef<ScrollView>(null);
  const stoppingRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [permissionBlocked, setPermissionBlocked] = useState<null | { canAskAgain: boolean }>(null);
  const [hint, setHint] = useState<string | null>(null);

  const t = (ha: string, en: string) => (isHausa ? ha : en);

  // Stop and discard an in-progress recording when the sheet closes
  useEffect(() => {
    if (!visible && phase === 'recording') {
      stopRecording(true);
    }
  }, [visible]);

  // Auto-stop long recordings
  useEffect(() => {
    if (phase === 'recording' && recorderState.durationMillis >= MAX_RECORDING_MS) {
      stopRecording();
    }
  }, [recorderState.durationMillis, phase]);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [messages, phase]);

  function errorText(error: any) {
    switch (error?.code) {
      case 'NETWORK_ERROR':
      case 'NO_INTERNET':
        return t(
          'Babu intanet. Ka duba hanyar sadarwarka ka sake gwadawa.',
          'No internet connection. Check your network and try again.'
        );
      case 'TIMEOUT_ERROR':
        return t(
          'Amsar ta dauki lokaci mai tsawo. Ka sake gwadawa.',
          'The answer took too long. Try again.'
        );
      case 'UNAUTHORIZED':
      case 'TOKEN_EXPIRED':
        return t('Zamanka ya kare. Ka sake shiga.', 'Your session has expired. Log in again.');
      default:
        return t('An kasa samun amsa. Ka sake gwadawa.', 'Could not get an answer. Try again.');
    }
  }

  async function startRecording() {
    if (phase !== 'idle') return;
    setHint(null);

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setPermissionBlocked({ canAskAgain: permission.canAskAgain });
        return;
      }
      setPermissionBlocked(null);

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
    } catch (error) {
      logger.error('Voice recording failed to start', error);
      setPhase('idle');
      setHint(t('An kasa fara rikodi. Ka sake gwadawa.', 'Could not start recording. Try again.'));
    }
  }

  async function stopRecording(discard = false) {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    const durationMs = recorderState.durationMillis;
    try {
      await recorder.stop();
    } catch (error) {
      logger.error('Voice recording failed to stop', error);
    }
    try {
      await setAudioModeAsync({ allowsRecording: false });
    } catch {}

    const uri = recorder.uri;
    setPhase('idle');
    stoppingRef.current = false;

    if (discard) return;

    if (!uri || durationMs < MIN_RECORDING_MS) {
      setHint(
        t('Rikodin ya yi gajere sosai. Ka dan kara magana.', 'Recording too short. Speak a little longer.')
      );
      return;
    }

    await sendRecording(uri, durationMs);
  }

  async function sendRecording(uri: string, durationMs: number, retryOfId?: string) {
    const userMessageId = nextId();
    setMessages(prev => [
      ...prev.filter(m => m.id !== retryOfId),
      { id: userMessageId, role: 'user', text: null, durationMs },
    ]);
    setPhase('sending');

    try {
      const online = await isOnline();
      if (!online) {
        throw { code: 'NO_INTERNET' };
      }

      const answer = await askByVoice({ audioUri: uri, language: 'ha', cropType });

      setMessages(prev => [
        ...prev.map(m => (m.id === userMessageId && m.role === 'user' ? { ...m, text: answer.transcript } : m)),
        { id: nextId(), role: 'assistant', text: answer.response },
      ]);
    } catch (error: any) {
      logger.error('Voice question failed', error);
      setMessages(prev => [
        ...prev.filter(m => m.id !== userMessageId),
        { id: nextId(), role: 'error', text: errorText(error), retryUri: uri, retryDurationMs: durationMs },
      ]);
    } finally {
      setPhase('idle');
    }
  }

  function onMicPress() {
    if (phase === 'recording') stopRecording();
    else startRecording();
  }

  function onPermissionAction() {
    if (permissionBlocked?.canAskAgain) startRecording();
    else Linking.openSettings();
  }

  const isRecording = phase === 'recording';
  const isSending = phase === 'sending';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="mic-outline" size={20} color="#16A34A" />
              <Text style={styles.headerTitle}>{t('Mataimakin murya', 'Voice assistant')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('Rufe', 'Close')}
            >
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          {/* Conversation */}
          <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
            {messages.length === 0 && !isSending && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={36} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  {t(
                    'Danna makirufo, ka yi tambayarka game da amfanin gona da Hausa.',
                    'Tap the mic and ask your crop question in Hausa.'
                  )}
                </Text>
              </View>
            )}

            {messages.map(message => {
              if (message.role === 'user') {
                return (
                  <View key={message.id} style={[styles.bubble, styles.userBubble]}>
                    {message.text ? (
                      <Text style={styles.userText}>{message.text}</Text>
                    ) : (
                      <View style={styles.voiceNoteRow}>
                        <Ionicons name="mic" size={16} color="#fff" />
                        <Text style={styles.userText}>
                          {t('Sakon murya', 'Voice message')} · {formatDuration(message.durationMs)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }

              if (message.role === 'assistant') {
                return (
                  <View key={message.id} style={[styles.bubble, styles.assistantBubble]}>
                    <Text style={styles.assistantText}>{message.text}</Text>
                  </View>
                );
              }

              return (
                <View key={message.id} style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                  <Text style={styles.errorText}>{message.text}</Text>
                  {message.retryUri && (
                    <TouchableOpacity
                      onPress={() => sendRecording(message.retryUri!, message.retryDurationMs || 0, message.id)}
                      disabled={phase !== 'idle'}
                      style={[styles.retryButton, phase !== 'idle' && { opacity: 0.5 }]}
                    >
                      <Text style={styles.retryText}>{t('Sake gwadawa', 'Try again')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {isSending && (
              <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.loadingText}>{t('Ana samun amsa...', 'Getting an answer...')}</Text>
              </View>
            )}
          </ScrollView>

          {/* Permission notice */}
          {permissionBlocked && (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionText}>
                {t(
                  'Ba da izinin makirufo don yin tambaya da murya.',
                  'Allow microphone access to ask by voice.'
                )}
              </Text>
              <TouchableOpacity onPress={onPermissionAction} style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>
                  {permissionBlocked.canAskAgain ? t('Ba da izini', 'Allow') : t('Bude saituna', 'Open settings')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Recorder */}
          <View style={styles.footer}>
            <Text style={[styles.statusText, isRecording && { color: '#DC2626' }]}>
              {isRecording
                ? `${formatDuration(recorderState.durationMillis)}  ${t('Ina saurare... danna don tsayawa', 'Listening... tap to stop')}`
                : isSending
                ? t('Ana aikawa...', 'Sending...')
                : hint || t('Danna don magana', 'Tap to speak')}
            </Text>
            <TouchableOpacity
              onPress={onMicPress}
              disabled={isSending}
              style={[styles.micButton, isRecording && styles.micButtonRecording, isSending && { opacity: 0.5 }]}
              accessibilityRole="button"
              accessibilityLabel={isRecording ? t('Tsaya', 'Stop recording') : t('Fara magana', 'Start recording')}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={30} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    height: '72%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  closeButton: { padding: 4 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  bubble: { maxWidth: '85%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#16A34A', borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#F0FDF4', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#DCFCE7' },
  userText: { color: '#fff', fontSize: 15 },
  assistantText: { color: '#111', fontSize: 15, lineHeight: 22 },
  voiceNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 10,
  },
  errorText: { flex: 1, color: '#991B1B', fontSize: 14 },
  retryButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FECACA' },
  retryText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  permissionBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  permissionText: { color: '#92400E', fontSize: 14 },
  permissionButton: { alignSelf: 'flex-start', backgroundColor: '#16A34A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  permissionButtonText: { color: '#fff', fontWeight: '700' },
  footer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  statusText: { fontSize: 13, color: '#6B7280', textAlign: 'center', paddingHorizontal: 16 },
  micButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  micButtonRecording: { backgroundColor: '#DC2626' },
});
