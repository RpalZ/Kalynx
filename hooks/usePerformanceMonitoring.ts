import { useEffect } from 'react';
import { Platform } from 'react-native';

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Page Load Time:', navEntry.loadEventEnd - navEntry.fetchStart);
          }
          
          if (entry.entryType === 'paint') {
            console.log(`${entry.name}:`, entry.startTime);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint'] });

      // Monitor largest contentful paint
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      return () => {
        observer.disconnect();
      };
    }
  }, []);
};

export default usePerformanceMonitoring;