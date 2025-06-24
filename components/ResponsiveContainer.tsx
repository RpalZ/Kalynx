import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number | string;
  padding?: number;
  centered?: boolean;
}

export function ResponsiveContainer({ 
  children, 
  style, 
  maxWidth, 
  padding,
  centered = true 
}: ResponsiveContainerProps) {
  const { getMaxWidth, getSpacing, isDesktop } = useResponsive();

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: maxWidth || getMaxWidth(),
    paddingHorizontal: padding || getSpacing(16, 24, 32),
    ...(centered && isDesktop && { alignSelf: 'center' }),
    ...style,
  };

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});