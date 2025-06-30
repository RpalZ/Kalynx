import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles } from 'lucide-react-native';

interface BoltBadgeProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
}

export const BoltBadge: React.FC<BoltBadgeProps> = ({
  position = 'bottom-right',
  size = 'medium',
}) => {
  const { theme, isDark } = useTheme();
  
  const handlePress = () => {
    Linking.openURL('https://bolt.new');
  };
  
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 16, left: 16 };
      case 'top-right':
        return { top: 16, right: 16 };
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'bottom-right':
      default:
        return { bottom: 16, right: 16 };
    }
  };
  
  const getSizeStyles = () => {
    switch (size) {
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
        <Image 
          source={require('@/assets/images/black_circle_360x360.svg')} 
          style={[styles.logo, { height: sizeStyles.badgeHeight - 12, width: sizeStyles.badgeHeight - 12 }]}
        />
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
  logo: {
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