import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Dimensions, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface BoltBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768 || Platform.OS !== 'web';
const IS_ANDROID = Platform.OS === 'android';

const boltLogo = require('../assets/images/black_circle_360x360.png');

const getSizeStyles = (size: BoltBadgeProps['size']) => {
  if (IS_MOBILE) {
    // Bigger mobile badge
    return {
      badgeHeight: 80,
      badgeWidth: 80,
      logoSize: 64,
      isMinimalist: true,
    };
  } else {
    // Bigger desktop badge
    return {
      badgeHeight: 120,
      fontSize: 22,
      iconSize: 24,
      paddingHorizontal: 24,
      borderRadius: 60,
      logoSize: 96,
      isMinimalist: false,
    };
  }
};

export const BoltBadge: React.FC<Omit<BoltBadgeProps, 'position'>> = ({
  size = 'large',
}) => {
  const { theme } = useTheme();
  // Always use bottom-right position
  const positionStyles = IS_MOBILE
    ? { bottom: 24, right: 16 } // mobile: 16px from right, 24px from bottom
    : { bottom: 40, right: 40 }; // desktop: 40px from right and bottom
  const sizeStyles = getSizeStyles(size);

  const handlePress = () => {
    Linking.openURL('https://bolt.new');
  };
  
  return (
    <View style={[styles.badgeContainer, positionStyles]}>
      <TouchableOpacity
        style={[
          styles.badge,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            height: sizeStyles.logoSize,
            width: sizeStyles.logoSize,
            borderRadius: sizeStyles.logoSize / 2,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 0,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          source={boltLogo}
          style={{ width: sizeStyles.logoSize, height: sizeStyles.logoSize, resizeMode: 'contain' }}
        />
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  sparkle: {
    marginLeft: 12,
  },
});

export default BoltBadge;