import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Dimensions, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles } from 'lucide-react-native';
import Svg, { Path, G } from 'react-native-svg';

interface BoltBadgeProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768 || Platform.OS !== 'web';
const IS_ANDROID = Platform.OS === 'android';

export const BoltBadge: React.FC<BoltBadgeProps> = ({
  position = 'bottom-left',
  size = 'large',
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
      if (size === 'medium') return 'large';
      return 'large';
    }
    return size;
  };
  
  const responsiveSize = getResponsiveSize();
  
  const getPositionStyles = () => {
    // For mobile, adjust position to avoid tab navigation
    if (IS_MOBILE) {
      const tabHeight = 80; // Height of the tab bar
      const safeAreaOffset = Platform.OS === 'ios' ? 50 : 30; // Extra space for status bar
      const mobileOffset = responsiveSize === 'small' ? 16 : 20;
      
      switch (position) {
        case 'top-left':
          return { top: mobileOffset + safeAreaOffset, left: mobileOffset };
        case 'top-right':
          return { top: mobileOffset + safeAreaOffset, right: mobileOffset };
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
    // Larger sizes for mobile
    const mobileFactor = IS_MOBILE ? 1.5 : 1;
    
    switch (responsiveSize) {
      case 'small':
        return {
          badgeHeight: Math.round(36 * mobileFactor),
          fontSize: Math.round(12 * mobileFactor),
          iconSize: Math.round(16 * mobileFactor),
          paddingHorizontal: Math.round(10 * mobileFactor),
          borderRadius: Math.round(18 * mobileFactor),
          logoSize: Math.round(24 * mobileFactor),
        };
      case 'large':
        return {
          badgeHeight: Math.round(52 * mobileFactor),
          fontSize: Math.round(16 * mobileFactor),
          iconSize: Math.round(24 * mobileFactor),
          paddingHorizontal: Math.round(18 * mobileFactor),
          borderRadius: Math.round(26 * mobileFactor),
          logoSize: Math.round(36 * mobileFactor),
        };
      case 'medium':
      default:
        return {
          badgeHeight: Math.round(44 * mobileFactor),
          fontSize: Math.round(14 * mobileFactor),
          iconSize: Math.round(20 * mobileFactor),
          paddingHorizontal: Math.round(14 * mobileFactor),
          borderRadius: Math.round(22 * mobileFactor),
          logoSize: Math.round(30 * mobileFactor),
        };
    }
  };
  
  const positionStyles = getPositionStyles();
  const sizeStyles = getSizeStyles();
  
  // Render the Bolt SVG logo
  const renderBoltLogo = () => {
    const logoSize = sizeStyles.logoSize;
    
    return (
      <View style={[
        styles.logoContainer, 
        { 
          height: logoSize, 
          width: logoSize,
          backgroundColor: theme.colors.primary,
        }
      ]}>
        <Svg width={logoSize * 0.6} height={logoSize * 0.6} viewBox="0 0 360 360">
          <Path
            fill="#FFFFFF"
            d="M178.82 145.25L189.9 94.83a.38.38 0 00-.37-.46h-38.88a.77.77 0 00-.75.61l-37.43 170.37a.22.22 0 00.32.25l44.24-23.47a1.14 1.14 0 00.57-.76l2.15-9.77a.39.39 0 01.7-.15c5.47 7.57 15.82 12 24.81 12.85 35.53 3.35 57.47-25.95 61.44-58.03 3.43-27.67-7.87-54.04-39.77-53.88-11.28.05-20.25 4.96-27.68 13.08a.25.25 0 01-.43-.22z"
          />
        </Svg>
      </View>
    );
  };
  
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
            borderRadius: sizeStyles.borderRadius,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {renderBoltLogo()}
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
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoContainer: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sparkle: {
    marginLeft: 6,
  },
});

export default BoltBadge;