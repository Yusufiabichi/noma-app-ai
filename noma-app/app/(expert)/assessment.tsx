import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Image, BackHandler,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAssessmentQuestions, submitAssessment } from "@/src/api/expert.api";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
  amberBorder: "#fde68a",
};

const TOTAL_SECONDS = 30 * 60; // 30 minutes

type Option  = { label: string; value: string };
type Question = {
  _id: string;
  question: string;
  type: "mcq" | "image";
  imageUrl?: string;
  options: Option[];
  cropCategory: string;
  difficulty: "easy" | "medium" | "hard";
};

const DifficultyBadge = ({ level }: { level: string }) => {
  const config = {
    easy:   { color: COLORS.primary, bg: COLORS.primaryLight },
    medium: { color: COLORS.amber,   bg: COLORS.amberLight   },
    hard:   { color: COLORS.error,   bg: COLORS.errorLight   },
  }[level] || { color: COLORS.textLight, bg: COLORS.background };

  return (
    <View style={[styles.diffBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.diffText, { color: config.color }]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Text>
    </View>
  );
};

const AssessmentScreen = () => {
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase]         = useState<"intro" | "quiz" | "result">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [timeLeft,  setTimeLeft]  = useState(TOTAL_SECONDS);
  const [loading,   setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result,    setResult]    = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Block hardware back during quiz
  useEffect(() => {
    if (phase !== "quiz") return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert(
        "Leave assessment?",
        "Your progress will be lost and this will count as an attempt.",
        [
          { text: "Stay", style: "cancel" },
          { text: "Leave", style: "destructive", onPress: () => {
            clearInterval(timerRef.current!);
            router.back();
          }},
        ]
      );
      return true;
    });
    return () => handler.remove();
  }, [phase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isTimeCritical = timeLeft < 5 * 60; // less than 5 min remaining

  // ── Fetch Questions ───────────────────────────────────────────────────────
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await getAssessmentQuestions();
      setQuestions(res.data.questions);
      setPhase("quiz");
      startTimer();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to load questions. Try again.",
        [{ text: "Back", onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const buildPayload = () =>
    Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer,
    }));

  const handleAutoSubmit = async () => {
    // Time's up — submit whatever was answered
    try {
      const payload = buildPayload();
      const res = await submitAssessment({ answers: payload });
      setResult(res.data);
      setPhase("result");
    } catch (_) {}
  };

  const handleSubmit = async () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      Alert.alert(
        `${unanswered} unanswered question${unanswered > 1 ? "s" : ""}`,
        "Do you still want to submit? Unanswered questions count as wrong.",
        [
          { text: "Review", style: "cancel" },
          { text: "Submit anyway", style: "destructive", onPress: doSubmit },
        ]
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    clearInterval(timerRef.current!);
    setSubmitting(true);
    try {
      const res = await submitAssessment({ answers: buildPayload() });
      setResult(res.data);
      setPhase("result");
    } catch (err: any) {
      Alert.alert("Submission failed", err.response?.data?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // ── PHASE: Intro ──────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <View style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Stage 3 · Competency Assessment</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.introContent}>
          <View style={styles.introIcon}>
            <Ionicons name="school" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.introTitle}>Crop Diagnosis Assessment</Text>
          <Text style={styles.introSub}>
            Demonstrate your agricultural expertise to become a verified NomaApp expert.
          </Text>

          {[
            { icon: "help-circle-outline",  label: "25 questions",            desc: "Mix of MCQ and image-based questions" },
            { icon: "time-outline",         label: "30-minute time limit",    desc: "Timer starts when you begin" },
            { icon: "ribbon-outline",       label: "70% required to pass",    desc: "You have 3 attempts if needed" },
            { icon: "leaf-outline",         label: "Crop disease topics",     desc: "Maize, rice, tomato, general pests, nutrients" },
          ].map((item, i) => (
            <View key={i} style={styles.introRule}>
              <View style={styles.introRuleIcon}>
                <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.introRuleLabel}>{item.label}</Text>
                <Text style={styles.introRuleDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}

          <View style={styles.introWarning}>
            <Ionicons name="warning-outline" size={16} color={COLORS.amber} />
            <Text style={styles.introWarningText}>
              Do not leave the app during the test. Leaving will count as an attempt used.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.65 }]}
            onPress={fetchQuestions}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Begin Assessment</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── PHASE: Result ─────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const passed = result.passed;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <View style={[styles.resultIcon, passed ? styles.resultIconPass : styles.resultIconFail]}>
            <Ionicons
              name={passed ? "checkmark-circle" : "close-circle"}
              size={56}
              color={passed ? COLORS.primary : COLORS.error}
            />
          </View>

          <Text style={styles.resultTitle}>
            {passed ? "You passed! 🎉" : "Not quite there"}
          </Text>
          <Text style={styles.resultSub}>
            {passed
              ? "You are now a verified NomaApp Expert. Welcome to the network!"
              : `You scored ${result.score}%. You need at least 70% to pass.`}
          </Text>

          {/* Score Ring */}
          <View style={[styles.scoreCard, passed ? styles.scoreCardPass : styles.scoreCardFail]}>
            <Text style={[styles.scoreNum, { color: passed ? COLORS.primary : COLORS.error }]}>
              {result.score}%
            </Text>
            <Text style={styles.scoreLabel}>
              {result.correct}/{result.total} correct
            </Text>
          </View>

          {!passed && result.attemptsLeft > 0 && (
            <View style={styles.retryInfo}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.amber} />
              <Text style={styles.retryText}>
                {result.attemptsLeft} attempt{result.attemptsLeft > 1 ? "s" : ""} remaining.
                Review crop diagnosis materials before retrying.
              </Text>
            </View>
          )}

          {!passed && result.attemptsLeft === 0 && (
            <View style={[styles.retryInfo, { borderColor: "#fecaca", backgroundColor: COLORS.errorLight }]}>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
              <Text style={[styles.retryText, { color: COLORS.error }]}>
                No attempts remaining. Please contact NomaApp support.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => router.replace("/(expert)/dashboard" as any)}
          >
            <Text style={styles.submitBtnText}>
              {passed ? "Go to Dashboard" : "Back to Dashboard"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── PHASE: Quiz ───────────────────────────────────────────────────────────
  const q         = questions[current];
  const answered  = Object.keys(answers).length;
  const progress  = (current + 1) / questions.length;

  return (
    <View style={styles.container}>
      {/* Timer bar */}
      <View style={[styles.timerBar, isTimeCritical && styles.timerBarCritical]}>
        <Ionicons
          name="time-outline"
          size={16}
          color={isTimeCritical ? COLORS.error : COLORS.primary}
        />
        <Text style={[styles.timerText, isTimeCritical && { color: COLORS.error }]}>
          {formatTime(timeLeft)}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.timerProgress}>
          {current + 1} / {questions.length}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.quizContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question header */}
        <View style={styles.qHeader}>
          <Text style={styles.qNumber}>Question {current + 1}</Text>
          <DifficultyBadge level={q.difficulty} />
        </View>

        <Text style={styles.qText}>{q.question}</Text>

        {/* Image if image-type */}
        {q.type === "image" && q.imageUrl && (
          <View style={styles.qImageWrap}>
            <Image
              source={{ uri: q.imageUrl }}
              style={styles.qImage}
              resizeMode="cover"
            />
            <Text style={styles.qImageHint}>
              Examine this image carefully before answering
            </Text>
          </View>
        )}

        {/* Options */}
        <View style={styles.optionsContainer}>
          {q.options.map((opt) => {
            const isSelected = answers[q._id] === opt.label;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                onPress={() => selectAnswer(q._id, opt.label)}
                activeOpacity={0.75}
              >
                <View style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  <Text style={[styles.optionLabelText, isSelected && { color: COLORS.white }]}>
                    {opt.label}
                  </Text>
                </View>
                <Text style={[styles.optionValue, isSelected && styles.optionValueSelected]}>
                  {opt.value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, current === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            <Ionicons name="arrow-back" size={18} color={current === 0 ? COLORS.border : COLORS.textDark} />
            <Text style={[styles.navBtnText, current === 0 && { color: COLORS.border }]}>Prev</Text>
          </TouchableOpacity>

          {current < questions.length - 1 ? (
            <TouchableOpacity
              style={styles.navBtnPrimary}
              onPress={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            >
              <Text style={styles.navBtnPrimaryText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtnPrimary, submitting && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Text style={styles.navBtnPrimaryText}>Submit</Text>
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Question dots (scroll indicator) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dotsScroll}>
          {questions.map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.dot,
                i === current && styles.dotCurrent,
                answers[questions[i]._id] && styles.dotAnswered,
              ]}
              onPress={() => setCurrent(i)}
            />
          ))}
        </ScrollView>
        <Text style={styles.answeredCount}>
          {answered}/{questions.length} answered
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  navHeader:  {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:    {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  navTitle:   { fontSize: 13, fontWeight: "700", color: COLORS.textDark },

  // Timer
  timerBar:   {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  timerBarCritical: { backgroundColor: COLORS.errorLight },
  timerText:  { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  timerProgress: { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  progressTrack: { height: 4, backgroundColor: COLORS.border },
  progressFill:  { height: "100%", backgroundColor: COLORS.primary },

  // Intro
  introContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  introIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight, alignItems: "center",
    justifyContent: "center", alignSelf: "center", marginBottom: 20,
  },
  introTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textDark, textAlign: "center", marginBottom: 8 },
  introSub:   { fontSize: 14, color: COLORS.textLight, textAlign: "center", lineHeight: 20, marginBottom: 28 },
  introRule: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  introRuleIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  introRuleLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  introRuleDesc:  { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  introWarning: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.amberLight, borderWidth: 1,
    borderColor: "#fde68a", borderRadius: 10, padding: 12, marginVertical: 20,
  },
  introWarningText: { flex: 1, fontSize: 12, color: COLORS.amber, lineHeight: 17 },

  // Quiz
  quizContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  qHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  qNumber:    { fontSize: 12, fontWeight: "600", color: COLORS.textLight },
  diffBadge:  { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 10 },
  diffText:   { fontSize: 11, fontWeight: "700" },
  qText:      { fontSize: 16, fontWeight: "600", color: COLORS.textDark, lineHeight: 24, marginBottom: 16 },
  qImageWrap: { borderRadius: 12, overflow: "hidden", marginBottom: 16 },
  qImage:     { width: "100%", height: 200 },
  qImageHint: { fontSize: 11, color: COLORS.textLight, textAlign: "center", marginTop: 6 },

  optionsContainer: { gap: 10, marginBottom: 24 },
  optionBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.white, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 12, padding: 14,
  },
  optionBtnSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionLabel: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: COLORS.background, borderWidth: 1,
    borderColor: COLORS.border, alignItems: "center", justifyContent: "center",
  },
  optionLabelSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionLabelText:     { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  optionValue:         { flex: 1, fontSize: 14, color: COLORS.textDark, fontWeight: "500" },
  optionValueSelected: { color: COLORS.primary, fontWeight: "600" },

  navRow:         { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  navBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText:     { fontSize: 14, fontWeight: "600", color: COLORS.textDark },
  navBtnPrimary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12,
  },
  navBtnPrimaryText: { fontSize: 14, fontWeight: "600", color: COLORS.white },

  dotsScroll:    { marginTop: 20, marginBottom: 4 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.border, marginHorizontal: 3,
  },
  dotCurrent:  { backgroundColor: COLORS.primary,  width: 20 },
  dotAnswered: { backgroundColor: "#86efac" },
  answeredCount: { fontSize: 11, color: COLORS.textLight, textAlign: "center", marginTop: 6 },

  // Result
  resultContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: "center" },
  resultIcon:    {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  resultIconPass: { backgroundColor: COLORS.primaryLight },
  resultIconFail: { backgroundColor: COLORS.errorLight },
  resultTitle:   { fontSize: 24, fontWeight: "700", color: COLORS.textDark, marginBottom: 8 },
  resultSub:     { fontSize: 14, color: COLORS.textLight, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  scoreCard: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 4,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  scoreCardPass: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  scoreCardFail: { borderColor: COLORS.error,   backgroundColor: COLORS.errorLight   },
  scoreNum:      { fontSize: 32, fontWeight: "700" },
  scoreLabel:    { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  retryInfo: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.amberLight, borderWidth: 1,
    borderColor: COLORS.amberBorder, borderRadius: 10,
    padding: 12, marginBottom: 24, width: "100%",
  },
  retryText: { flex: 1, fontSize: 12, color: COLORS.amber, lineHeight: 17 },

  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 15, width: "100%",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
});

export default AssessmentScreen;