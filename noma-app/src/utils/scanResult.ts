// src/utils/scanResult.ts
// Maps a finished server scan (diagnosed or rejected) to the payload the
// treatment-rec screen expects

// Server default (LOW_CONFIDENCE_THRESHOLD); the server sends the real value per diagnosis
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

/**
 * A diagnosis is "not confirmed" when the server says so, or (for responses
 * from before the server sent the flag) when confidence is missing, invalid
 * or below the threshold. Same rule as the backend.
 */
export function isLowConfidenceDiagnosis(diagnosis: any): boolean {
  if (typeof diagnosis?.lowConfidence === 'boolean') return diagnosis.lowConfidence;
  const confidence = diagnosis?.confidence;
  const threshold =
    typeof diagnosis?.confidenceThreshold === 'number' ? diagnosis.confidenceThreshold : DEFAULT_CONFIDENCE_THRESHOLD;
  return typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < threshold;
}

export function buildScanResult(diagnosedScan: any, languageCode: string) {
  const diagnosis = diagnosedScan?.diagnosis || {};
  // Older responses put the diagnosis fields on the scan itself
  const source = { ...diagnosedScan, ...diagnosis };
  const lowConfidence = isLowConfidenceDiagnosis(source);

  return {
    status:           diagnosedScan?.status === 'rejected' ? 'rejected' : 'diagnosed',
    rejection:        diagnosedScan?.rejection || null,
    disease:          diagnosis.disease || diagnosedScan.disease,
    name:             diagnosis.name || diagnosedScan.name,
    // The AI detects the crop; older scans carry the farmer's pick on the scan
    cropType:         diagnosis.cropType || diagnosedScan.cropType,
    confidence:       diagnosis.confidence ?? diagnosedScan.confidence,
    cropConfidence:   diagnosis.cropConfidence,
    severity:         diagnosis.severity || diagnosedScan.severity,
    severityAssumed:  diagnosis.severityAssumed === true,
    recommendations:  diagnosis.recommendations || diagnosedScan.recommendations || [],
    futurePrevention: diagnosis.futurePrevention || diagnosedScan.futurePrevention || [],
    applicationSteps: diagnosis.applicationSteps || diagnosedScan.applicationSteps || [],
    dosage:           diagnosis.dosage || diagnosedScan.dosage || [],
    timing:           diagnosis.timing || diagnosedScan.timing || [],
    safetyWarnings:   diagnosis.safetyWarnings || diagnosedScan.safetyWarnings || [],
    expectedOutcome:  diagnosis.expectedOutcome || diagnosedScan.expectedOutcome || [],
    followUpDays:     diagnosis.followUpDays || diagnosedScan.followUpDays || [],
    inputSourcing:    diagnosis.inputSourcing || diagnosedScan.inputSourcing || [],
    isFallback:       diagnosis.isFallback ?? false,
    lowConfidence,
    requiresExpertReview: source.requiresExpertReview ?? lowConfidence,
    confidenceThreshold:  typeof source.confidenceThreshold === 'number' ? source.confidenceThreshold : DEFAULT_CONFIDENCE_THRESHOLD,
    safetyNotice:     source.safetyNotice || null,
    language:         diagnosis.language || diagnosedScan.language || languageCode,
    isOnline:         true,
    scanId:           diagnosedScan._id,
  };
}
