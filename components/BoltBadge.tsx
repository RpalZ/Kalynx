import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Zap } from 'lucide-react-native';

interface BoltBadgeProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768 || Platform.OS !== 'web';

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
      return size === 'large' ? 'medium' : 'small';
    }
    return size;
  };
  
  const responsiveSize = getResponsiveSize();
  
  const getPositionStyles = () => {
    // Adjust position values for mobile
    const mobileOffset = responsiveSize === 'small' ? 8 : 12;
    const desktopOffset = responsiveSize === 'small' ? 12 : 16;
    const offset = IS_MOBILE ? mobileOffset : desktopOffset;
    
    switch (position) {
      case 'top-left':
        return { top: offset, left: offset };
      case 'top-right':
        return { top: offset, right: offset };
      case 'bottom-left':
        return { bottom: offset, left: offset };
      case 'bottom-right':
      default:
        return { bottom: offset, right: offset };
    }
  };
  
  const getSizeStyles = () => {
    switch (responsiveSize) {
      case 'small':
        return {
          badgeHeight: 28,
          fontSize: 10,
          iconSize: 12,
          paddingHorizontal: 8,
        };
      case 'large':
        return {
          badgeHeight: 40,
          fontSize: 14,
          iconSize: 18,
          paddingHorizontal: 16,
        };
      case 'medium':
      default:
        return {
          badgeHeight: 32,
          fontSize: 12,
          iconSize: 14,
          paddingHorizontal: 12,
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
            height: sizeStyles.badgeHeight - 12, 
            width: sizeStyles.badgeHeight - 12 
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
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  badgeText: {
    fontWeight: '600',
  },
  sparkle: {
    marginLeft: 4,
  },
});

export default BoltBadge;