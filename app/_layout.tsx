import * as React from 'react';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import BoltBadge from '@/components/BoltBadge';
import { Platform } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  // SEO optimization for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Update document title
      document.title = 'Kalyx - Sustainable Health & Fitness Tracking';
      
      // Add meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Track your health and environmental impact with Kalyx. AI-powered recipe generation, fitness tracking, and sustainability scoring in one app.');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = 'Track your health and environmental impact with Kalyx. AI-powered recipe generation, fitness tracking, and sustainability scoring in one app.';
        document.head.appendChild(meta);
      }

      // Add keywords
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        const meta = document.createElement('meta');
        meta.name = 'keywords';
        meta.content = 'health tracking, fitness app, sustainability, environmental impact, AI recipes, nutrition tracking, workout logging';
        document.head.appendChild(meta);
      }

      // Add Open Graph tags for social sharing
      const ogTags = [
        { property: 'og:title', content: 'Kalyx - Sustainable Health & Fitness' },
        { property: 'og:description', content: 'Track your health and environmental impact with AI-powered insights' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: window.location.origin },
        { property: 'og:image', content: `${window.location.origin}/assets/images/icon.png` },
      ];

      ogTags.forEach(tag => {
        const existing = document.querySelector(`meta[property="${tag.property}"]`);
        if (!existing) {
          const meta = document.createElement('meta');
          meta.setAttribute('property', tag.property);
          meta.content = tag.content;
          document.head.appendChild(meta);
        }
      });

      // Add error handling for unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 Unhandled promise rejection:', event.reason);
        // Prevent the default behavior that would cause the app to crash
        event.preventDefault();
      });

      // Add error handling for general errors
      window.addEventListener('error', (event) => {
        console.error('🚨 Global error:', event.error);
      });
    }
  }, []);

  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <BoltBadge position="bottom-left" size="large" />
      </SubscriptionProvider>
    </ThemeProvider>
  );
}