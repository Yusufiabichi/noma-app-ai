import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput,
  Modal, Switch, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  adminListAdmins, adminInviteAdmin, adminUpdateAdmin,
} from "@/src/api/admin.api";
import { useAuth } from "@/src/hooks/useAuth";

const COLORS = {
  primary: "#16A34A", primaryLight: "#f0fdf4", primaryBorder: "#bbf7d0",
  background: "#f8f8f8", white: "#ffffff", textDark: "#1f2937",
  textLight: "#6b7280", border: "#e5e7eb", error: "#dc2626",
  errorLight: "#fef2f2", amber: "#d97706", amberLight: "#fffbeb",
  purple: "#7c3aed", purpleLight: "#f5f3ff",
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  super_admin: { label: "Super Admin", color: COLORS.primary,  bg: COLORS.primaryLight, icon: "shield-checkmark" },
  moderator:   { label: "Moderator",   color: COLORS.amber,    bg: COLORS.amberLight,   icon: "shield-half"      },
  reviewer:    { label: "Reviewer",    color: COLORS.purple,   bg: COLORS.purpleLight,  icon: "eye-outline"      },
};

const ALL_PERMISSIONS = [
  { key: "experts:view",    label: "View Experts"       },
  { key: "experts:review",  label: "Review Documents"   },
  { key: "questions:view",  label: "View Questions"     },
  { key: "questions:manage",label: "Manage Questions"   },
  { key: "cases:view",      label: "View Cases"         },
  { key: "cases:manage",    label: "Manage Cases"       },
  { key: "analytics:view",  label: "View Analytics"     },
];

// ─── Invite Modal ─────────────────────────────────────────────────────────────
const InviteModal = ({
  visible, onClose, onSave,
}: {
  visible: boolean; onClose: () => void; onSave: () => void;
}) => {
  const [form, setForm] = useState({
    name: "", phone: "", password: "",
    adminRole: "moderator" as "super_admin" | "moderator" | "reviewer",
    permissions: [] as string[],
  });
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({ name: "", phone: "", password: "", adminRole: "moderator", permissions: [] });
      setErrors({});
    }
  }, [visible]);

  const togglePermission = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.phone.trim())    e.phone    = "Phone is required";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await adminInviteAdmin(form);
      onSave();
      onClose();
      Alert.alert("Admin created", `${form.name} can now log in as a ${ROLE_CONFIG[form.adminRole].label}.`);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error?.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  const roleLabels = Object.entries(ROLE_CONFIG).filter(([k]) => k !== "super_admin");

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={modal.container}>
          <View style={modal.header}>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={modal.headerTitle}>Invite Admin</Text>
            <TouchableOpacity
              style={[modal.saveBtn, saving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={modal.saveBtnText}>Create</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modal.content} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <Text style={modal.label}>Full Name <Text style={modal.required}>*</Text></Text>
            <View style={[modal.inputWrapper, errors.name && modal.inputError]}>
              <Ionicons name="person-outline" size={16} color={COLORS.textLight} style={modal.inputIcon} />
              <TextInput
                style={modal.inputField}
                placeholder="e.g. Amina Yusuf"
                placeholderTextColor={COLORS.textLight}
                value={form.name}
                onChangeText={v => { setForm(f => ({ ...f, name: v })); setErrors(e => ({ ...e, name: "" })); }}
              />
            </View>
            {errors.name ? <Text style={modal.errorText}>{errors.name}</Text> : null}

            {/* Phone */}
            <Text style={[modal.label, { marginTop: 14 }]}>Phone Number <Text style={modal.required}>*</Text></Text>
            <View style={[modal.inputWrapper, errors.phone && modal.inputError]}>
              <Ionicons name="call-outline" size={16} color={COLORS.textLight} style={modal.inputIcon} />
              <TextInput
                style={modal.inputField}
                placeholder="e.g. 08011223344"
                placeholderTextColor={COLORS.textLight}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={v => { setForm(f => ({ ...f, phone: v })); setErrors(e => ({ ...e, phone: "" })); }}
              />
            </View>
            {errors.phone ? <Text style={modal.errorText}>{errors.phone}</Text> : null}

            {/* Password */}
            <Text style={[modal.label, { marginTop: 14 }]}>Password <Text style={modal.required}>*</Text></Text>
            <View style={[modal.inputWrapper, errors.password && modal.inputError]}>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.textLight} style={modal.inputIcon} />
              <TextInput
                style={[modal.inputField, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textLight}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={v => { setForm(f => ({ ...f, password: v })); setErrors(e => ({ ...e, password: "" })); }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={modal.errorText}>{errors.password}</Text> : null}

            {/* Role */}
            <Text style={[modal.label, { marginTop: 14 }]}>Admin Role</Text>
            <View style={modal.roleRow}>
              {roleLabels.map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[modal.roleChip, form.adminRole === key && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                  onPress={() => setForm(f => ({ ...f, adminRole: key as any }))}
                >
                  <Ionicons name={cfg.icon as any} size={14} color={form.adminRole === key ? cfg.color : COLORS.textLight} />
                  <Text style={[modal.roleChipText, form.adminRole === key && { color: cfg.color, fontWeight: "700" }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Permissions */}
            <Text style={[modal.label, { marginTop: 16 }]}>
              Permissions <Text style={modal.optional}>(customize access)</Text>
            </Text>
            {ALL_PERMISSIONS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={modal.permRow}
                onPress={() => togglePermission(p.key)}
              >
                <View style={[
                  modal.permCheck,
                  form.permissions.includes(p.key) && modal.permCheckActive,
                ]}>
                  {form.permissions.includes(p.key) && (
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  )}
                </View>
                <Text style={modal.permLabel}>{p.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={modal.infoBox}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
              <Text style={modal.infoText}>
                If no permissions are selected, the role's default permissions apply.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Admin Card ───────────────────────────────────────────────────────────────
const AdminCard = ({
  admin, currentUserId, onToggleActive,
}: {
  admin: any; currentUserId: string; onToggleActive: (id: string, active: boolean) => void;
}) => {
  const isCurrentUser = admin._id === currentUserId;
  const cfg = ROLE_CONFIG[admin.adminRole] || ROLE_CONFIG.moderator;

  const getInitials = (name: string) =>
    (name || "A").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={[styles.adminCard, !admin.isActive && styles.adminCardInactive]}>
      <View style={styles.adminCardLeft}>
        <View style={[styles.adminAvatar, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.adminAvatarText, { color: cfg.color }]}>{getInitials(admin.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.adminNameRow}>
            <Text style={styles.adminName}>{admin.name}</Text>
            {isCurrentUser && (
              <View style={styles.youBadge}><Text style={styles.youBadgeText}>You</Text></View>
            )}
          </View>
          <Text style={styles.adminPhone}>{admin.phone}</Text>
          <View style={styles.adminRoleBadge}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[styles.adminRoleText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {admin.invitedBy && (
            <Text style={styles.invitedBy}>Invited by {admin.invitedBy?.name}</Text>
          )}
        </View>
      </View>

      {!isCurrentUser && (
        <Switch
          value={admin.isActive}
          onValueChange={(val) => onToggleActive(admin._id, val)}
          trackColor={{ false: COLORS.border, true: COLORS.primaryBorder }}
          thumbColor={admin.isActive ? COLORS.primary : COLORS.textLight}
        />
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AdminTeamScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [admins, setAdmins]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await adminListAdmins();
      setAdmins(res.data.admins);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdmins();
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    Alert.alert(
      isActive ? "Activate Admin" : "Deactivate Admin",
      isActive
        ? "This admin will regain access to the dashboard."
        : "This admin will lose access immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isActive ? "Activate" : "Deactivate",
          style: isActive ? "default" : "destructive",
          onPress: async () => {
            try {
              await adminUpdateAdmin(id, { isActive });
              fetchAdmins();
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.error?.message || "Failed to update admin");
            }
          },
        },
      ]
    );
  };

  const activeCount   = admins.filter(a => a.isActive).length;
  const inactiveCount = admins.filter(a => !a.isActive).length;

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Admin Team</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setInviteVisible(true)}>
          <Ionicons name="person-add-outline" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{admins.length}</Text>
          <Text style={styles.summaryLabel}>Total Admins</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={[styles.summaryItem, { borderRightWidth: 0 }]}>
          <Text style={[styles.summaryValue, { color: COLORS.textLight }]}>{inactiveCount}</Text>
          <Text style={styles.summaryLabel}>Inactive</Text>
        </View>
      </View>

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
          {admins.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No admin team yet</Text>
              <Text style={styles.emptyDesc}>Tap the icon above to invite your first admin</Text>
            </View>
          ) : (
            admins.map(admin => (
              <AdminCard
                key={admin._id}
                admin={admin}
                currentUserId={user?._id || ""}
                onToggleActive={handleToggleActive}
              />
            ))
          )}
        </ScrollView>
      )}

      <InviteModal
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        onSave={fetchAdmins}
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
  summaryLabel: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 40 },

  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textDark, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 4, textAlign: "center" },

  adminCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  adminCardInactive: { opacity: 0.55 },
  adminCardLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  adminAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  adminAvatarText: { fontSize: 15, fontWeight: "700" },
  adminNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  adminName: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  youBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingVertical: 1, paddingHorizontal: 6,
  },
  youBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  adminPhone: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  adminRoleBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  adminRoleText: { fontSize: 11, fontWeight: "600" },
  invitedBy: { fontSize: 10, color: COLORS.textLight, marginTop: 3 },
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
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, backgroundColor: COLORS.white, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, paddingVertical: 13, fontSize: 14, color: COLORS.textDark },
  inputError: { borderColor: COLORS.error },
  roleRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  roleChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  roleChipText: { fontSize: 13, color: COLORS.textDark, fontWeight: "500" },
  permRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  permCheck: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  permCheckActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  permLabel: { fontSize: 13, color: COLORS.textDark },
  infoBox: {
    flexDirection: "row", gap: 6, alignItems: "flex-start",
    backgroundColor: COLORS.background, borderRadius: 8,
    padding: 10, marginTop: 14,
  },
  infoText: { flex: 1, fontSize: 11, color: COLORS.textLight, lineHeight: 16 },
});

export default AdminTeamScreen;