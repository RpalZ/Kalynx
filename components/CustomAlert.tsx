import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, CheckCircle, Info, X, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
  onClose?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK' }],
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle, color: theme.colors.success };
      case 'error':
        return { icon: AlertCircle, color: theme.colors.error };
      case 'warning':
        return { icon: AlertTriangle, color: theme.colors.warning };
      default:
        return { icon: Info, color: theme.colors.info };
    }
  };

  const { icon: IconComponent, color } = getIconAndColor();

  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onClose?.();
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return { backgroundColor: theme.colors.error };
      case 'cancel':
        return { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border };
      default:
        return { backgroundColor: theme.colors.primary };
    }
  };

  const getButtonTextColor = (buttonStyle?: string) => {
    return buttonStyle === 'cancel' ? theme.colors.text : '#FFFFFF';
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay, 
          { 
            backgroundColor: theme.colors.overlay,
            opacity: fadeAnim 
          }
        ]}
      >
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={[styles.alertCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <LinearGradient
              colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
              style={styles.alertGradient}
            >
              {/* Header */}
              <View style={styles.alertHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                  <IconComponent size={24} color={color} />
                </View>
                {title && (
                  <Text style={[styles.alertTitle, { color: theme.colors.text }]}>
                    {title}
                  </Text>
                )}
              </View>

              {/* Message */}
              <Text style={[styles.alertMessage, { color: theme.colors.textSecondary }]}>
                {message}
              </Text>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.alertButton,
                      getButtonStyle(button.style),
                      buttons.length === 1 && styles.singleButton,
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text style={[
                      styles.alertButtonText,
                      { color: getButtonTextColor(button.style) }
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Hook for easier usage
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<CustomAlertProps | null>(null);

  const showAlert = (config: Omit<CustomAlertProps, 'visible' | 'onClose'>) => {
    setAlertConfig({
      ...config,
      visible: true,
      onClose: () => setAlertConfig(null),
    });
  };

  const hideAlert = () => {
    setAlertConfig(null);
  };

  const AlertComponent = alertConfig ? (
    <CustomAlert {...alertConfig} />
  ) : null;

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 400,
  },
  alertCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  alertGradient: {
    padding: 24,
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleButton: {
    flex: 1,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});