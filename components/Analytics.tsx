import React, { useEffect } from 'react';
import { Platform } from 'react-native';

// Google Analytics 4 for web
const GA_MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID;

export const Analytics = {
  // Track page views
  trackPageView: (pageName: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', GA_MEASUREMENT_ID, {
        page_title: pageName,
        page_location: window.location.href,
      });
    }
  },

  // Track custom events
  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }
  },

  // Track user actions
  trackUserAction: (action: string, category: string = 'user_interaction') => {
    Analytics.trackEvent(action, {
      event_category: category,
      event_label: action,
    });
  },
};

// Hook to track page views automatically
export const usePageTracking = (pageName: string) => {
  useEffect(() => {
    Analytics.trackPageView(pageName);
  }, [pageName]);
};

export default Analytics;