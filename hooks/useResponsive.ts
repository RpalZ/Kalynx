import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export interface BreakpointValues {
  mobile: number;
  tablet: number;
  desktop: number;
  largeDesktop: number;
}

const breakpoints: BreakpointValues = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'largeDesktop';

export function useResponsive() {
  const [screenData, setScreenData] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const getScreenSize = (): ScreenSize => {
    const { width } = screenData;
    if (width >= breakpoints.largeDesktop) return 'largeDesktop';
    if (width >= breakpoints.desktop) return 'desktop';
    if (width >= breakpoints.tablet) return 'tablet';
    return 'mobile';
  };

  const isMobile = getScreenSize() === 'mobile';
  const isTablet = getScreenSize() === 'tablet';
  const isDesktop = getScreenSize() === 'desktop' || getScreenSize() === 'largeDesktop';
  const isLargeDesktop = getScreenSize() === 'largeDesktop';

  const getColumns = (mobile: number, tablet?: number, desktop?: number, largeDesktop?: number) => {
    const screenSize = getScreenSize();
    switch (screenSize) {
      case 'largeDesktop':
        return largeDesktop || desktop || tablet || mobile;
      case 'desktop':
        return desktop || tablet || mobile;
      case 'tablet':
        return tablet || mobile;
      default:
        return mobile;
    }
  };

  const getSpacing = (mobile: number, tablet?: number, desktop?: number) => {
    const screenSize = getScreenSize();
    switch (screenSize) {
      case 'largeDesktop':
      case 'desktop':
        return desktop || tablet || mobile;
      case 'tablet':
        return tablet || mobile;
      default:
        return mobile;
    }
  };

  const getMaxWidth = () => {
    const screenSize = getScreenSize();
    switch (screenSize) {
      case 'largeDesktop':
        return 1400;
      case 'desktop':
        return 1200;
      case 'tablet':
        return 768;
      default:
        return '100%';
    }
  };

  return {
    ...screenData,
    screenSize: getScreenSize(),
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    getColumns,
    getSpacing,
    getMaxWidth,
    breakpoints,
  };
}