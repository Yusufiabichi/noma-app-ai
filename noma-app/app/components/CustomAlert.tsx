import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useLanguage } from '@/src/context/LanguageContext';

const { width, height } = Dimensions.get('window');

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
  onDismiss?: () => void;
};

interface CustomAlertProps {
  visible: boolean;
  options: AlertOptions | null;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, options, onClose }) => {
  const { language } = useLanguage();
  const isHausa = language === 'ha';

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when hidden
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!visible || !options) return null;

  const { title, message, buttons, cancelable = true, onDismiss } = options;

  const handleBackdropPress = () => {
    if (cancelable) {
      onClose();
      onDismiss?.();
    }
  };

  const getButtonStyle = (style: AlertButton['style'] = 'default') => {
    switch (style) {
      case 'cancel':
        return styles.cancelButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (style: AlertButton['style'] = 'default') => {
    switch (style) {
      case 'cancel':
        return styles.cancelButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleBackdropPress}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />

          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.alertContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons && buttons.length > 0 ? (
                  buttons.map((btn, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        getButtonStyle(btn.style),
                        index < buttons.length - 1 && styles.buttonMargin,
                      ]}
                      onPress={() => {
                        btn.onPress?.();
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={getButtonTextStyle(btn.style)}>{btn.text}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.defaultButton]}
                    onPress={() => {
                      onClose();
                      onDismiss?.();
                    }}
                  >
                    <Text style={styles.defaultButtonText}>
                      {isHausa ? 'Ok' : 'OK'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMargin: {
    marginBottom: 0,
  },
  defaultButton: {
    backgroundColor: '#16A34A',
  },
  defaultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#dc2626',
  },
  destructiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;