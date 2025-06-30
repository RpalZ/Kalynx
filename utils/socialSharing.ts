import { Platform, Share } from 'react-native';

export const SocialSharing = {
  shareProgress: async (stats: {
    mealsLogged: number;
    workoutsCompleted: number;
    co2Saved: number;
    currentStreak: number;
  }) => {
    const message = `🌱 My Kalyx Progress Update!\n\n` +
      `📊 This week:\n` +
      `🍽️ ${stats.mealsLogged} meals logged\n` +
      `💪 ${stats.workoutsCompleted} workouts completed\n` +
      `🌍 ${stats.co2Saved.toFixed(1)}kg CO₂ saved\n` +
      `🔥 ${stats.currentStreak} day streak!\n\n` +
      `Join me in tracking sustainable health! 💚\n` +
      `${Platform.OS === 'web' ? window.location.origin : 'Download Kalyx app'}`;

    try {
      if (Platform.OS === 'web') {
        // Web sharing
        if (navigator.share) {
          await navigator.share({
            title: 'My Kalyx Progress',
            text: message,
            url: window.location.origin,
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(message);
          alert('Progress copied to clipboard!');
        }
      } else {
        // Mobile sharing
        await Share.share({
          message,
          title: 'My Kalyx Progress',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  },

  shareAchievement: async (achievement: string) => {
    const message = `🏆 Achievement Unlocked!\n\n${achievement}\n\nTracking my sustainable health journey with Kalyx! 🌱💪`;
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Kalyx Achievement',
            text: message,
            url: window.location.origin,
          });
        } else {
          await navigator.clipboard.writeText(message);
          alert('Achievement copied to clipboard!');
        }
      } else {
        await Share.share({
          message,
          title: 'Kalyx Achievement',
        });
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
    }
  },
};