import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
  maxWidth?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 16,
  maxWidth = 1400,
}) => {
  const getColumns = () => {
    if (Platform.OS !== 'web') return columns.mobile;
    
    if (screenWidth >= 1024) return columns.desktop;
    if (screenWidth >= 768) return columns.tablet;
    return columns.mobile;
  };

  const currentColumns = getColumns();
  const isWeb = Platform.OS === 'web';

  const gridStyles = isWeb ? {
    display: 'grid',
    gridTemplateColumns: `repeat(${currentColumns}, 1fr)`,
    gap: gap,
    maxWidth: maxWidth,
    width: '100%',
  } : {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: gap,
    maxWidth: maxWidth,
    width: '100%',
  };

  return (
    <View style={[styles.container, gridStyles]}>
      {children}
    </View>
  );
};

interface GridItemProps {
  children: React.ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span = { mobile: 1, tablet: 1, desktop: 1 },
}) => {
  const getSpan = () => {
    if (Platform.OS !== 'web') return span.mobile || 1;
    
    if (screenWidth >= 1024) return span.desktop || 1;
    if (screenWidth >= 768) return span.tablet || 1;
    return span.mobile || 1;
  };

  const currentSpan = getSpan();
  const isWeb = Platform.OS === 'web';

  const itemStyles = isWeb ? {
    gridColumn: `span ${currentSpan}`,
  } : {
    flex: currentSpan,
  };

  return (
    <View style={[styles.gridItem, itemStyles]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  gridItem: {
    minWidth: 0, // Prevents grid items from overflowing
  },
});