import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  adminListQuestions,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
} from "@/src/api/admin.api";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
  blue: "#2563eb", blueLight: "#eff6ff",
};

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string }> = {
  easy:   { color: COLORS.primary, bg: COLORS.primaryLight },
  medium: { color: COLORS.amber,   bg: COLORS.amberLight   },
  hard:   { color: COLORS.error,   bg: COLORS.errorLight   },
};

const CROP_CATEGORIES = [
  "general", "maize", "rice", "tomato", "cassava",
  "yam", "sorghum", "cowpea", "soybean", "pests", "nutrients",
];

const DIFFICULTIES = ["easy", "medium", "hard"];

const FILTER_TABS = [
  { label: "All",    value: ""       },
  { label: "Easy",   value: "easy"   },
  { label: "Medium", value: "medium" },
  { label: "Hard",   value: "hard"   },
];

// ─── Empty Form State ─────────────────────────────────────────────────────────
const emptyForm = () => ({
  question: "",
  type: "mcq" as "mcq" | "image",
  options: [
    { label: "A", value: "" },
    { label: "B", value: "" },
    { label: "C", value: "" },
    { label: "D", value: "" },
  ],
  correctAnswer: "A",
  cropCategory: "general",
  difficulty: "medium",
  explanation: "",
});

// ─── Question Form Modal ──────────────────────────────────────────────────────
const QuestionFormModal = ({
  visible, onClose, onSave, editData,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any, id?: string) => Promise<void>;
  editData?: any;
}) => {
  const [form, setForm]       = useState(emptyForm());
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    if (editData) {
      setForm({
        question:      editData.question || "",
        type:          editData.type || "mcq",
        options:       editData.options?.length === 4
                         ? editData.options
                         : emptyForm().options,
        correctAnswer: editData.correctAnswer || "A",
        cropCategory:  editData.cropCategory || "general",
        difficulty:    editData.difficulty || "medium",
        explanation:   editData.explanation || "",
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
  }, [editData, visible]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.question.trim()) e.question = "Question text is required";
    if (form.options.some(o => !o.value.trim())) e.options = "All 4 options are required";
    if (!form.correctAnswer) e.correctAnswer = "Select the correct answer";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("question",      form.question);
      formData.append("type",          form.type);
      formData.append("options",       JSON.stringify(form.options));
      formData.append("correctAnswer", form.correctAnswer);
      formData.append("cropCategory",  form.cropCategory);
      formData.append("difficulty",    form.difficulty);
      formData.append("explanation",   form.explanation);
      await onSave(formData, editData?._id);
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error?.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...form.options];
    updated[index] = { ...updated[index], value };
    setForm(f => ({ ...f, options: updated }));
    setErrors(e => ({ ...e, options: "" }));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={modal.container}>
          {/* Header */}
          <View style={modal.header}>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={modal.headerTitle}>
              {editData ? "Edit Question" : "New Question"}
            </Text>
            <TouchableOpacity
              style={[modal.saveBtn, saving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={modal.saveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modal.content} keyboardShouldPersistTaps="handled">
            {/* Question text */}
            <Text style={modal.label}>Question <Text style={modal.required}>*</Text></Text>
            <TextInput
              style={[modal.textArea, errors.question && modal.inputError]}
              placeholder="e.g. Which symptom indicates maize streak virus?"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              value={form.question}
              onChangeText={v => {
                setForm(f => ({ ...f, question: v }));
                setErrors(e => ({ ...e, question: "" }));
              }}
            />
            {errors.question ? <Text style={modal.errorText}>{errors.question}</Text> : null}

            {/* Options */}
            <Text style={[modal.label, { marginTop: 16 }]}>
              Options <Text style={modal.required}>*</Text>
            </Text>
            {form.options.map((opt, i) => (
              <View key={opt.label} style={modal.optionRow}>
                <TouchableOpacity
                  style={[
                    modal.optionLabel,
                    form.correctAnswer === opt.label && modal.optionLabelCorrect,
                  ]}
                  onPress={() => setForm(f => ({ ...f, correctAnswer: opt.label }))}
                >
                  <Text style={[
                    modal.optionLabelText,
                    form.correctAnswer === opt.label && { color: COLORS.white },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[modal.optionInput, errors.options && modal.inputError]}
                  placeholder={`Option ${opt.label}`}
                  placeholderTextColor={COLORS.textLight}
                  value={opt.value}
                  onChangeText={v => updateOption(i, v)}
                />
              </View>
            ))}
            <Text style={modal.hint}>Tap a letter to mark it as the correct answer</Text>
            {errors.options ? <Text style={modal.errorText}>{errors.options}</Text> : null}

            {/* Difficulty */}
            <Text style={[modal.label, { marginTop: 16 }]}>Difficulty</Text>
            <View style={modal.chipRow}>
              {DIFFICULTIES.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[modal.chip, form.difficulty === d && modal.chipActive]}
                  onPress={() => setForm(f => ({ ...f, difficulty: d }))}
                >
                  <Text style={[modal.chipText, form.difficulty === d && modal.chipTextActive]}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Crop Category */}
            <Text style={[modal.label, { marginTop: 16 }]}>Crop Category</Text>
            <View style={modal.chipRow}>
              {CROP_CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[modal.chip, form.cropCategory === c && modal.chipActive]}
                  onPress={() => setForm(f => ({ ...f, cropCategory: c }))}
                >
                  <Text style={[modal.chipText, form.cropCategory === c && modal.chipTextActive]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Explanation */}
            <Text style={[modal.label, { marginTop: 16 }]}>
              Explanation <Text style={modal.optional}>(shown after test)</Text>
            </Text>
            <TextInput
              style={modal.textArea}
              placeholder="Why is this the correct answer?"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              value={form.explanation}
              onChangeText={v => setForm(f => ({ ...f, explanation: v }))}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AdminQuestionsScreen = () => {
  const router = useRouter();
  const [questions, setQuestions]   = useState<any[]>([]);
  const [breakdown, setBreakdown]   = useState<Record<string, number>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData]     = useState<any>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await adminListQuestions({
        difficulty: activeTab || undefined,
        isActive: true,
      });
      setQuestions(res.data.questions);
      setBreakdown(res.data.breakdown || {});
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchQuestions();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  const handleSave = async (formData: FormData, id?: string) => {
    if (id) {
      await adminUpdateQuestion(id, formData);
    } else {
      await adminCreateQuestion(formData);
    }
    fetchQuestions();
  };

  const handleDelete = (id: string, question: string) => {
    Alert.alert(
      "Deactivate Question",
      `Deactivate: "${question.slice(0, 60)}..."?\n\nIt will no longer appear in assessments.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate", style: "destructive",
          onPress: async () => {
            try {
              await adminDeleteQuestion(id);
              fetchQuestions();
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.error?.message || "Failed to deactivate");
            }
          },
        },
      ]
    );
  };

  const openEdit = (q: any) => {
    setEditData(q);
    setModalVisible(true);
  };

  const openCreate = () => {
    setEditData(null);
    setModalVisible(true);
  };

  const totalActive = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Question Bank</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Summary banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalActive}</Text>
          <Text style={styles.summaryLabel}>Total Active</Text>
        </View>
        {Object.entries(breakdown).map(([diff, count]) => {
          const cfg = DIFFICULTY_CONFIG[diff];
          return (
            <View key={diff} style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: cfg?.color }]}>{count}</Text>
              <Text style={styles.summaryLabel}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</Text>
            </View>
          );
        })}
        <View style={[styles.summaryItem, { borderRightWidth: 0 }]}>
          <Text style={[styles.summaryValue, { color: totalActive >= 25 ? COLORS.primary : COLORS.error }]}>
            {totalActive >= 25 ? "✓" : `${25 - totalActive} more`}
          </Text>
          <Text style={styles.summaryLabel}>Min 25 needed</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {questions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No questions yet</Text>
              <Text style={styles.emptyDesc}>Tap + to add the first question</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openCreate}>
                <Text style={styles.emptyAddBtnText}>Add Question</Text>
              </TouchableOpacity>
            </View>
          ) : (
            questions.map((q, index) => {
              const cfg = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.medium;
              return (
                <View key={q._id} style={styles.questionCard}>
                  <View style={styles.questionCardHeader}>
                    <View style={styles.questionMeta}>
                      <Text style={styles.questionNumber}>#{index + 1}</Text>
                      <View style={[styles.diffBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.diffBadgeText, { color: cfg.color }]}>
                          {q.difficulty}
                        </Text>
                      </View>
                      <View style={styles.cropBadge}>
                        <Text style={styles.cropBadgeText}>{q.cropCategory}</Text>
                      </View>
                      {q.type === "image" && (
                        <Ionicons name="image-outline" size={14} color={COLORS.blue} />
                      )}
                    </View>
                    <View style={styles.questionActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openEdit(q)}
                      >
                        <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { marginLeft: 6 }]}
                        onPress={() => handleDelete(q._id, q.question)}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.questionText} numberOfLines={3}>{q.question}</Text>

                  <View style={styles.optionsList}>
                    {q.options?.map((opt: any) => (
                      <View
                        key={opt.label}
                        style={[
                          styles.optionItem,
                          q.correctAnswer === opt.label && styles.optionItemCorrect,
                        ]}
                      >
                        <Text style={[
                          styles.optionItemLabel,
                          q.correctAnswer === opt.label && styles.optionItemLabelCorrect,
                        ]}>
                          {opt.label}
                        </Text>
                        <Text style={[
                          styles.optionItemValue,
                          q.correctAnswer === opt.label && { color: COLORS.primary, fontWeight: "600" },
                        ]} numberOfLines={1}>
                          {opt.value}
                        </Text>
                        {q.correctAnswer === opt.label && (
                          <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Question Form Modal */}
      <QuestionFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        editData={editData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  navTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },

  summaryBanner: {
    flexDirection: "row", backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  summaryItem: {
    flex: 1, alignItems: "center", paddingVertical: 12,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  summaryValue: { fontSize: 18, fontWeight: "700", color: COLORS.textDark },
  summaryLabel: { fontSize: 10, color: COLORS.textLight, marginTop: 2, textTransform: "capitalize" },

  tabScroll: { flexGrow: 0, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabScrollContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: "center" },
  tab: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 16, backgroundColor: COLORS.white,
    alignSelf: "flex-start",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textDark, fontWeight: "600" },
  tabTextActive: { color: COLORS.white },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 40 },

  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textDark, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  emptyAddBtn: {
    marginTop: 20, backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  emptyAddBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },

  questionCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 12,
  },
  questionCardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  questionMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  questionNumber: { fontSize: 11, color: COLORS.textLight, fontWeight: "700" },
  diffBadge: { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  diffBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  cropBadge: { backgroundColor: COLORS.blueLight, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  cropBadgeText: { fontSize: 10, color: COLORS.blue, fontWeight: "600", textTransform: "capitalize" },
  questionActions: { flexDirection: "row" },
  actionBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  questionText: { fontSize: 14, fontWeight: "600", color: COLORS.textDark, lineHeight: 20, marginBottom: 12 },
  optionsList: { gap: 6 },
  optionItem: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.background, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  optionItemCorrect: { backgroundColor: COLORS.primaryLight },
  optionItemLabel: {
    width: 20, height: 20, borderRadius: 4,
    backgroundColor: COLORS.border, textAlign: "center",
    lineHeight: 20, fontSize: 11, fontWeight: "700", color: COLORS.textDark,
  },
  optionItemLabelCorrect: { backgroundColor: COLORS.primary, color: COLORS.white },
  optionItemValue: { flex: 1, fontSize: 12, color: COLORS.textDark },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 16,
  },
  saveBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textDark, marginBottom: 6 },
  required: { color: COLORS.error },
  optional: { color: COLORS.textLight, fontWeight: "400" },
  hint: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  textArea: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    backgroundColor: COLORS.white, padding: 12,
    fontSize: 14, color: COLORS.textDark, minHeight: 80, textAlignVertical: "top",
  },
  inputError: { borderColor: COLORS.error },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  optionLabel: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  optionLabelCorrect: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionLabelText: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  optionInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, backgroundColor: COLORS.white,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: COLORS.textDark,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14, backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textDark, fontWeight: "500" },
  chipTextActive: { color: COLORS.white },
});

export default AdminQuestionsScreen;