import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, Info, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const [translateY] = useState(new Animated.Value(-100));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return { 
          icon: CheckCircle, 
          color: theme.colors.success,
          gradient: ['#10B981', '#059669']
        };
      case 'error':
        return { 
          icon: AlertCircle, 
          color: theme.colors.error,
          gradient: ['#EF4444', '#DC2626']
        };
      case 'warning':
        return { 
          icon: AlertTriangle, 
          color: theme.colors.warning,
          gradient: ['#F59E0B', '#D97706']
        };
      default:
        return { 
          icon: Info, 
          color: theme.colors.info,
          gradient: ['#3B82F6', '#2563EB']
        };
    }
  };

  const { icon: IconComponent, color, gradient } = getIconAndColors();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toastCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <LinearGradient
          colors={gradient}
          style={styles.toastGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.toastContent}>
            <IconComponent size={20} color="#FFFFFF" />
            <Text style={styles.toastMessage}>{message}</Text>
            <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// Hook for easier usage
export const useToast = () => {
  const [toastConfig, setToastConfig] = useState<ToastProps | null>(null);

  const showToast = (config: Omit<ToastProps, 'visible' | 'onClose'>) => {
    setToastConfig({
      ...config,
      visible: true,
      onClose: () => setToastConfig(null),
    });
  };

  const hideToast = () => {
    setToastConfig(null);
  };

  const ToastComponent = toastConfig ? (
    <Toast {...toastConfig} />
  ) : null;

  return {
    showToast,
    hideToast,
    ToastComponent,
  };
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
});