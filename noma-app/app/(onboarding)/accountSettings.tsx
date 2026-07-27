import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { useLanguage } from '@/src/context/LanguageContext';
import { updateProfile, changePassword, deleteAccount } from '@/src/api/auth.api';
import { CustomAlert } from '@/app/components/CustomAlert';
import { useAlert } from '@/src/context/AlertContext';

export default function AccountSettings() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const { language } = useLanguage();
  const isHausa = language === 'ha';

  // ─── State ──────────────────────────────────────────────────────
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { showAlert, AlertComponent } = useAlert();

  // ─── Save Profile ──────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: isHausa ? 'Da fatan a shigar da suna' : 'Please enter your name',
        type: 'error',
      });
      return;
    }
    if (!phone.trim()) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: isHausa ? 'Da fatan a shigar da lambar waya' : 'Please enter your phone number',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const updated = await updateProfile({ name: name.trim(), phone: phone.trim() });
      updateUser(updated);
      showAlert({
        title: isHausa ? 'An ɗora' : 'Updated',
        message: isHausa ? 'An canza bayanan ku' : 'Your profile has been updated',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: err.message || (isHausa ? 'An samu matsala' : 'Something went wrong'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Change Password ────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: isHausa ? 'Shigar da kalmar sirri na yanzu' : 'Enter current password',
        type: 'error',
      });
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: isHausa ? 'Sabuwar kalmar sirri dole ta fi haruffa 6' : 'New password must be at least 6 characters',
        type: 'error',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: isHausa ? 'Kalmar sirri ba ta daidaita ba' : 'Passwords do not match',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      showAlert({
        title: isHausa ? 'An canza' : 'Changed',
        message: isHausa ? 'An canza kalmar sirri cikin nasara' : 'Password changed successfully',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: err.message || (isHausa ? 'Kalmar sirri ba daidai ba' : 'Current password is incorrect'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete Account ─────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      await logout();
      router.replace('/login');
    } catch (err: any) {
      showAlert({
        title: isHausa ? 'Kuskure' : 'Error',
        message: err.message || (isHausa ? 'An samu matsala wajen cire asusun' : 'Failed to delete account'),
        type: 'error',
      });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isHausa ? 'Saitunan Asusun' : 'Account Settings'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ─── Profile Section ────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isHausa ? 'Bayanin Mai Amfani' : 'Profile Information'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{isHausa ? 'Suna' : 'Full Name'}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={isHausa ? 'Sunan ku' : 'Your name'}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{isHausa ? 'Lambar Waya' : 'Phone Number'}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={isHausa ? 'Lambar waya' : 'Phone number'}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.disabledBtn]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isHausa ? 'Ajiye Canje-canje' : 'Save Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── Security Section ────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isHausa ? 'Tsaro' : 'Security'}
          </Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#6B7280" />
              <Text style={styles.menuText}>
                {isHausa ? 'Canja Kalmar Sirri' : 'Change Password'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* ─── Danger Section ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>
            {isHausa ? 'Tsananin Gargaɗi' : 'Danger Zone'}
          </Text>

          <TouchableOpacity
            style={[styles.menuItem, styles.dangerItem]}
            onPress={() => setShowDeleteModal(true)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="trash-outline" size={22} color="#DC2626" />
              <Text style={[styles.menuText, { color: '#DC2626' }]}>
                {isHausa ? 'Cire Asusun' : 'Delete Account'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* ─── Modals ────────────────────────────────────── */}
      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isHausa ? 'Canja Kalmar Sirri' : 'Change Password'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isHausa ? 'Kalmar sirri na yanzu' : 'Current Password'}</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={isHausa ? 'Kalmar sirri na yanzu' : 'Current password'}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isHausa ? 'Sabuwar kalmar sirri' : 'New Password'}</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={isHausa ? 'Sabuwar kalmar sirri' : 'New password'}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isHausa ? 'Tabbatar da sabuwar kalmar' : 'Confirm New Password'}</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={isHausa ? 'Tabbatar da sabuwar kalmar' : 'Confirm new password'}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalCancelText}>
                  {isHausa ? 'Soke' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {isHausa ? 'Canja' : 'Change'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { borderTopColor: '#DC2626', borderTopWidth: 4 }]}>
            <Ionicons name="warning-outline" size={48} color="#DC2626" style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: '#DC2626' }]}>
              {isHausa ? 'Cire Asusun' : 'Delete Account'}
            </Text>
            <Text style={styles.modalDesc}>
              {isHausa
                ? 'Wannan zai cire duk bayanan ku gaba ɗaya. Ba za a iya dawo da su ba.'
                : 'This will permanently delete all your data. This action cannot be undone.'}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>
                  {isHausa ? 'Soke' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDanger]}
                onPress={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {isHausa ? 'Cire' : 'Delete'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {AlertComponent}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  footerSpace: {
    height: 20,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
  modalConfirm: {
    backgroundColor: '#16A34A',
  },
  modalDanger: {
    backgroundColor: '#DC2626',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});