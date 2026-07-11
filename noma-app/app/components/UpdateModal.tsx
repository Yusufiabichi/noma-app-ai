import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { UpdateCheckResponse } from '../services/update.service';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateCheckResponse | null;
  onClose: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, updateInfo, onClose }) => {
  const { language } = useLanguage(); // 'en' or 'ha'

  if (!updateInfo) return null;

  // Get message in user's language, fallback to English
  const message = updateInfo.message?.[language as keyof typeof updateInfo.message] || updateInfo.message?.en || 'Please update the app.';

  const handleUpdate = () => {
    // Build store URL
    let storeUrl: string;
    if (Platform.OS === 'ios') {
      // Replace with your actual App Store ID
      storeUrl = `https://apps.apple.com/app/idYOUR_APP_ID`;
    } else {
      // Replace with your package name
      storeUrl = `https://play.google.com/store/apps/details?id=com.your.package`;
    }
    Linking.openURL(storeUrl).catch(err => console.error('Failed to open store:', err));
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>
            {language === 'ha' ? 'Sabunta App' : 'Update Available'}
          </Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
              <Text style={styles.buttonText}>
                {language === 'ha' ? 'Sabunta Yanzu' : 'Update Now'}
              </Text>
            </TouchableOpacity>

            {!updateInfo.isRequired && (
              <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
                <Text style={styles.laterButtonText}>
                  {language === 'ha' ? 'Daga baya' : 'Later'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111',
  },
  message: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  updateButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default UpdateModal;