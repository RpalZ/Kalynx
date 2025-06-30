import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface BoltBadgeProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  
  const getPositionStyles = () => {
    if (IS_MOBILE) {
      const tabHeight = 80; // Height of the tab bar
      const safeAreaOffset = Platform.OS === 'ios' ? 50 : 30;
      const mobileOffset = 16;
      
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
      // Desktop positioning - much bigger
      const desktopOffset = 32;
      
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
    if (IS_MOBILE) {
      // Minimalist mobile design - just the logo
      return {
        badgeHeight: 56,
        badgeWidth: 56,
        logoSize: 40,
        isMinimalist: true,
      };
    } else {
      // Much bigger desktop design
      return {
        badgeHeight: 80,
        fontSize: 22,
        iconSize: 28,
        paddingHorizontal: 24,
        borderRadius: 40,
        logoSize: 56,
        isMinimalist: false,
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
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            height: sizeStyles.badgeHeight,
            width: sizeStyles.isMinimalist ? sizeStyles.badgeWidth : undefined,
            paddingHorizontal: sizeStyles.isMinimalist ? 0 : sizeStyles.paddingHorizontal,
            borderRadius: sizeStyles.isMinimalist ? 28 : sizeStyles.borderRadius,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {sizeStyles.isMinimalist ? (
          // Mobile: Just the logo
          <View style={[
            styles.logoContainer, 
            { 
              height: sizeStyles.logoSize, 
              width: sizeStyles.logoSize,
            }
          ]}>
            <Svg width={sizeStyles.logoSize} height={sizeStyles.logoSize} viewBox="0 0 360 360">
              <Path
                fill="#000000"
                d="M185.47 0.00Q186.22 0.33 186.77 0.00Q186.85 0.01 186.93 0.00Q254.56 3.48 302.60 48.15Q347.77 90.14 357.94 152.33Q358.56 156.13 359.08 161.91Q359.51 166.72 360.00 171.51L360.00 171.88Q359.68 173.21 360.00 174.49L360.00 185.40Q358.14 236.68 331.13 277.88Q307.38 314.11 271.23 335.24Q239.27 353.92 202.45 358.47Q195.38 359.34 188.25 360.00Q188.18 359.99 188.12 360.00Q186.79 359.68 185.52 360.00L174.53 360.00Q173.82 359.70 173.28 360.00L172.86 360.00Q161.01 359.10 157.75 358.68Q107.13 352.11 67.79 320.70C29.54 290.16 5.96 246.46 0.84 197.92C0.56 195.26 0.47 191.33 0.00 188.06Q0.00 187.97 0.00 187.88Q0.33 186.65 0.00 185.51L0.00 174.57Q0.32 173.74 0.00 172.99L0.00 172.62Q0.23 172.50 0.15 172.25Q2.47 122.74 28.97 81.98C61.07 32.62 114.97 2.17 174.43 0.00L185.47 0.00Z"
              />
              <Path
                fill="#FFFFFF"
                d="M178.82 145.25L189.9 94.83A0.38 0.38 0.0 0 0 189.53 94.37L150.65 94.37A0.77 0.77 0.0 0 0 149.9 94.98L112.47 265.35A0.22 0.22 0.0 0 0 112.79 265.6L157.03 242.13A1.14 1.14 0.0 0 0 157.6 241.37L159.75 231.6A0.39 0.39 0.0 0 1 160.45 231.45C165.92 239.02 176.27 243.45 185.26 244.3C220.79 247.65 242.73 218.35 246.7 186.27C250.13 158.6 238.83 132.23 206.93 132.39C195.65 132.44 186.68 137.35 179.25 145.47A0.25 0.25 0.0 0 1 178.82 145.25Z"
              />
            </Svg>
          </View>
        ) : (
          // Desktop: Full badge with text and sparkle
          <>
            <View style={[
              styles.logoContainer, 
              { 
                height: sizeStyles.logoSize, 
                width: sizeStyles.logoSize,
              }
            ]}>
              <Svg width={sizeStyles.logoSize} height={sizeStyles.logoSize} viewBox="0 0 360 360">
                <Path
                  fill="#000000"
                  d="M185.47 0.00Q186.22 0.33 186.77 0.00Q186.85 0.01 186.93 0.00Q254.56 3.48 302.60 48.15Q347.77 90.14 357.94 152.33Q358.56 156.13 359.08 161.91Q359.51 166.72 360.00 171.51L360.00 171.88Q359.68 173.21 360.00 174.49L360.00 185.40Q358.14 236.68 331.13 277.88Q307.38 314.11 271.23 335.24Q239.27 353.92 202.45 358.47Q195.38 359.34 188.25 360.00Q188.18 359.99 188.12 360.00Q186.79 359.68 185.52 360.00L174.53 360.00Q173.82 359.70 173.28 360.00L172.86 360.00Q161.01 359.10 157.75 358.68Q107.13 352.11 67.79 320.70C29.54 290.16 5.96 246.46 0.84 197.92C0.56 195.26 0.47 191.33 0.00 188.06Q0.00 187.97 0.00 187.88Q0.33 186.65 0.00 185.51L0.00 174.57Q0.32 173.74 0.00 172.99L0.00 172.62Q0.23 172.50 0.15 172.25Q2.47 122.74 28.97 81.98C61.07 32.62 114.97 2.17 174.43 0.00L185.47 0.00Z"
                />
                <Path
                  fill="#FFFFFF"
                  d="M178.82 145.25L189.9 94.83A0.38 0.38 0.0 0 0 189.53 94.37L150.65 94.37A0.77 0.77 0.0 0 0 149.9 94.98L112.47 265.35A0.22 0.22 0.0 0 0 112.79 265.6L157.03 242.13A1.14 1.14 0.0 0 0 157.6 241.37L159.75 231.6A0.39 0.39 0.0 0 1 160.45 231.45C165.92 239.02 176.27 243.45 185.26 244.3C220.79 247.65 242.73 218.35 246.7 186.27C250.13 158.6 238.83 132.23 206.93 132.39C195.65 132.44 186.68 137.35 179.25 145.47A0.25 0.25 0.0 0 1 178.82 145.25Z"
                />
              </Svg>
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
          </>
        )}
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