import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  large: 1440,
  xlarge: 1920,
} as const;

// Current screen type
export const getScreenType = () => {
  if (Platform.OS !== 'web') return 'mobile';
  
  if (screenWidth >= BREAKPOINTS.xlarge) return 'xlarge';
  if (screenWidth >= BREAKPOINTS.large) return 'large';
  if (screenWidth >= BREAKPOINTS.desktop) return 'desktop';
  if (screenWidth >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

// Responsive values
export const responsive = {
  // Spacing
  spacing: {
    xs: getScreenType() === 'mobile' ? 4 : 6,
    sm: getScreenType() === 'mobile' ? 8 : 12,
    md: getScreenType() === 'mobile' ? 16 : 20,
    lg: getScreenType() === 'mobile' ? 24 : 32,
    xl: getScreenType() === 'mobile' ? 32 : 48,
    xxl: getScreenType() === 'mobile' ? 48 : 64,
  },
  
  // Typography
  typography: {
    h1: getScreenType() === 'mobile' ? 24 : getScreenType() === 'tablet' ? 28 : 32,
    h2: getScreenType() === 'mobile' ? 20 : getScreenType() === 'tablet' ? 24 : 28,
    h3: getScreenType() === 'mobile' ? 18 : getScreenType() === 'tablet' ? 20 : 24,
    body: getScreenType() === 'mobile' ? 14 : 16,
    caption: getScreenType() === 'mobile' ? 12 : 14,
  },
  
  // Layout
  layout: {
    maxWidth: getScreenType() === 'desktop' ? 1400 : '100%',
    sidebarWidth: getScreenType() === 'desktop' ? 280 : getScreenType() === 'tablet' ? 240 : 0,
    headerHeight: getScreenType() === 'mobile' ? 60 : 80,
    contentPadding: getScreenType() === 'mobile' ? 16 : getScreenType() === 'tablet' ? 24 : 32,
  },
  
  // Grid
  grid: {
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      large: 4,
    },
    gap: getScreenType() === 'mobile' ? 12 : 16,
  },
  
  // Cards
  card: {
    minWidth: getScreenType() === 'mobile' ? 150 : getScreenType() === 'tablet' ? 200 : 250,
    padding: getScreenType() === 'mobile' ? 16 : 20,
    borderRadius: getScreenType() === 'mobile' ? 12 : 16,
  },
};

// Utility functions
export const isDesktop = () => getScreenType() === 'desktop' || getScreenType() === 'large' || getScreenType() === 'xlarge';
export const isTablet = () => getScreenType() === 'tablet';
export const isMobile = () => getScreenType() === 'mobile';

// Responsive value selector
export const selectResponsiveValue = <T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  large?: T;
  xlarge?: T;
}): T => {
  const screenType = getScreenType();
  
  return values[screenType] || 
         values.desktop || 
         values.tablet || 
         values.mobile || 
         Object.values(values)[0];
};

// Media query helper for web
export const mediaQuery = {
  mobile: `@media (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop}px)`,
  large: `@media (min-width: ${BREAKPOINTS.large}px)`,
  xlarge: `@media (min-width: ${BREAKPOINTS.xlarge}px)`,
};