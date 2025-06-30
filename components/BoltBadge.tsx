import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Zap } from 'lucide-react-native';

interface BoltBadgeProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768 || Platform.OS !== 'web';
const IS_ANDROID = Platform.OS === 'android';

export const BoltBadge: React.FC<BoltBadgeProps> = ({
  position = 'bottom-right',
  size = 'medium',
}) => {
  const { theme, isDark } = useTheme();
  
  const handlePress = () => {
    Linking.openURL('https://bolt.new');
  };
  
  // Adjust size based on screen width for mobile
  const getResponsiveSize = () => {
    if (IS_MOBILE) {
      // On mobile, we'll use larger sizes for better visibility
      if (size === 'small') return 'medium';
      return 'large';
    }
    return size;
  };
  
  const responsiveSize = getResponsiveSize();
  
  const getPositionStyles = () => {
    // For mobile, adjust position to avoid tab navigation
    if (IS_MOBILE) {
      const tabHeight = 80; // Height of the tab bar
      const mobileOffset = responsiveSize === 'small' ? 12 : 16;
      
      switch (position) {
        case 'top-left':
          return { top: mobileOffset + 40, left: mobileOffset }; // Add extra space for status bar
        case 'top-right':
          return { top: mobileOffset + 40, right: mobileOffset }; // Add extra space for status bar
        case 'bottom-left':
          return { bottom: tabHeight + mobileOffset, left: mobileOffset };
        case 'bottom-right':
        default:
          return { bottom: tabHeight + mobileOffset, right: mobileOffset };
      }
    } else {
      // Desktop positioning
      const desktopOffset = responsiveSize === 'small' ? 16 : 24;
      
      switch (position) {
        case 'top-left':
          return { top: desktopOffset, left: desktopOffset };
        case 'top-right':
          return { top: desktopOffset, right: desktopOffset };
        case 'bottom-left':
          return { bottom: desktopOffset, left: desktopOffset };
        case 'bottom-right':
        default:
          return { bottom: desktopOffset, right: desktopOffset };
      }
    }
  };
  
  const getSizeStyles = () => {
    switch (responsiveSize) {
      case 'small':
        return {
          badgeHeight: IS_MOBILE ? 36 : 32,
          fontSize: IS_MOBILE ? 12 : 11,
          iconSize: IS_MOBILE ? 16 : 14,
          paddingHorizontal: IS_MOBILE ? 10 : 8,
        };
      case 'large':
        return {
          badgeHeight: IS_MOBILE ? 48 : 44,
          fontSize: IS_MOBILE ? 16 : 15,
          iconSize: IS_MOBILE ? 22 : 20,
          paddingHorizontal: IS_MOBILE ? 18 : 16,
        };
      case 'medium':
      default:
        return {
          badgeHeight: IS_MOBILE ? 42 : 38,
          fontSize: IS_MOBILE ? 14 : 13,
          iconSize: IS_MOBILE ? 18 : 16,
          paddingHorizontal: IS_MOBILE ? 14 : 12,
        };
    }
  };
  
  const positionStyles = getPositionStyles();
  const sizeStyles = getSizeStyles();
  
  return (
    <View style={[styles.badgeContainer, positionStyles]}>
      <TouchableOpacity
        style={[
          styles.badge,
          {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: theme.colors.border,
            height: sizeStyles.badgeHeight,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[
          styles.logoContainer, 
          { 
            backgroundColor: theme.colors.primary,
            height: sizeStyles.badgeHeight - 16, 
            width: sizeStyles.badgeHeight - 16 
          }
        ]}>
          <Zap size={sizeStyles.iconSize} color="#FFFFFF" />
        </View>
        <Text
          style={[
            styles.badgeText,
            {
              color: theme.colors.text,
              fontSize: sizeStyles.fontSize,
            },
          ]}
        >
          Built with Bolt
        </Text>
        <Sparkles size={sizeStyles.iconSize} color={theme.colors.accent} style={styles.sparkle} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  logoContainer: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sparkle: {
    marginLeft: 6,
  },
});

export default BoltBadge;