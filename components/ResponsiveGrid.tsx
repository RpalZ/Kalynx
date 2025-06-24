import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    largeDesktop?: number;
  };
  gap?: number;
  style?: ViewStyle;
}

export function ResponsiveGrid({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3, largeDesktop: 4 },
  gap = 16,
  style 
}: ResponsiveGridProps) {
  const { getColumns } = useResponsive();

  const numColumns = getColumns(
    columns.mobile || 1,
    columns.tablet,
    columns.desktop,
    columns.largeDesktop
  );

  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.grid, { gap }, style]}>
      {Array.from({ length: Math.ceil(childrenArray.length / numColumns) }).map((_, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { gap }]}>
          {Array.from({ length: numColumns }).map((_, colIndex) => {
            const childIndex = rowIndex * numColumns + colIndex;
            const child = childrenArray[childIndex];
            
            return (
              <View key={colIndex} style={[styles.column, { flex: 1 }]}>
                {child || null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  column: {
    flex: 1,
  },
});