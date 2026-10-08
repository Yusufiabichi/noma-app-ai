/**
 * Voice Assistant API
 * Hausa voice questions answered by the AI assistant
 *
 * Endpoints:
 * - POST /assistant/voice (multipart: audio, language, [cropType])
 */

import client from './client';

// Single place to change if the backend route differs
export const VOICE_ENDPOINT = '/voice/ask';

// Speech recognition + answer generation can take longer than the default 30s
const VOICE_TIMEOUT_MS = 60000;

const AUDIO_MIME_TYPES: Record<string, string> = {
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  webm: 'audio/webm',
  '3gp': 'audio/3gpp',
  caf: 'audio/x-caf',
};

export interface VoiceAnswer {
  /** What the backend heard the farmer say, if it returns it */
  transcript: string | null;
  /** The Hausa answer to show in the chat */
  response: string;
}

/**
 * Send a recorded voice question and get the assistant's Hausa answer
 * @param params.audioUri - Local URI of the recording
 * @param params.language - Language code for the answer (default 'ha')
 * @param params.cropType - Optional crop context
 */
export const askByVoice = async ({
  audioUri,
  language = 'ha',
  cropType,
}: {
  audioUri: string;
  language?: string;
  cropType?: string | null;
}): Promise<VoiceAnswer> => {
  const fileName = audioUri.split('/').pop() || 'voice.m4a';
  const extension = fileName.split('.').pop()?.toLowerCase() || 'm4a';

  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: fileName,
    type: AUDIO_MIME_TYPES[extension] || 'audio/mp4',
  } as any);
  formData.append('language', language);
  if (cropType) formData.append('cropType', cropType);

  const response: any = await client.post(VOICE_ENDPOINT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: VOICE_TIMEOUT_MS,
  });

  // Accept both { data: {...} } and flat response shapes, like the scans API
  const payload = response?.data ?? response ?? {};
  const answer =
    payload.response ?? payload.answer ?? payload.reply ?? payload.text ?? payload.message;
  const transcript = payload.transcript ?? payload.transcription ?? payload.question ?? null;

  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error('Received empty response from voice assistant');
  }

  return {
    transcript: typeof transcript === 'string' && transcript.trim() ? transcript.trim() : null,
    response: answer.trim(),
  };
};

export default {
  askByVoice,
};
