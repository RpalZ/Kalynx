import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface LoadingScreenProps {
  type?: 'default' | 'leaderboard' | 'meals' | 'workouts' | 'camera' | 'profile' | 'chart';
  message?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  type = 'default',
  message = 'Loading...',
  showIcon = true,
  icon,
}) => {
  const { theme, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    shimmerAnimation.start();

    return () => {
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, []);

  const renderSkeletonContent = () => {
    switch (type) {
      case 'leaderboard':
        return <LeaderboardSkeleton />;
      case 'meals':
        return <MealsSkeleton />;
      case 'workouts':
        return <WorkoutsSkeleton />;
      case 'camera':
        return <CameraSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'chart':
        return <ChartSkeleton />;
      default:
        return <DefaultSkeleton />;
    }
  };

  const SkeletonBox = ({ 
    width: boxWidth, 
    height, 
    borderRadius = 8,
    style = {} 
  }: { 
    width: number | string; 
    height: number; 
    borderRadius?: number;
    style?: any;
  }) => (
    <Animated.View
      style={[
        {
          width: boxWidth,
          height,
          borderRadius,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
          opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
          }),
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
            transform: [
              {
                translateX: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width, width],
                }),
              },
            ],
          },
        ]}
      />
    </Animated.View>
  );

  const LeaderboardSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonBox width={200} height={32} borderRadius={16} />
        <SkeletonBox width={120} height={24} borderRadius={12} />
      </View>

      {/* Competition arena skeleton */}
      <View style={styles.arenaSkeleton}>
        <SkeletonBox width="100%" height={120} borderRadius={20} />
      </View>

      {/* Leaderboard items skeleton */}
      {[1, 2, 3, 4, 5].map((rank) => (
        <Animated.View
          key={rank}
          style={[
            styles.leaderboardItemSkeleton,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SkeletonBox width={60} height={60} borderRadius={30} />
          <View style={styles.leaderboardTextSkeleton}>
            <SkeletonBox width={150} height={20} borderRadius={10} />
            <SkeletonBox width={100} height={16} borderRadius={8} style={{ marginTop: 8 }} />
          </View>
          <SkeletonBox width={80} height={40} borderRadius={20} />
        </Animated.View>
      ))}
    </View>
  );

  const MealsSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonBox width={180} height={32} borderRadius={16} />
        <SkeletonBox width={48} height={48} borderRadius={24} />
      </View>

      {/* Search bar skeleton */}
      <View style={styles.searchSkeleton}>
        <SkeletonBox width="100%" height={56} borderRadius={16} />
      </View>

      {/* Meal cards skeleton */}
      {[1, 2, 3].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.mealCardSkeleton,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.mealHeaderSkeleton}>
            <SkeletonBox width={40} height={40} borderRadius={12} />
            <View style={styles.mealInfoSkeleton}>
              <SkeletonBox width={120} height={18} borderRadius={9} />
              <SkeletonBox width={80} height={14} borderRadius={7} style={{ marginTop: 6 }} />
            </View>
          </View>
          <View style={styles.mealStatsSkeleton}>
            <SkeletonBox width={80} height={16} borderRadius={8} />
            <SkeletonBox width={100} height={16} borderRadius={8} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const WorkoutsSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonBox width={200} height={32} borderRadius={16} />
        <SkeletonBox width={48} height={48} borderRadius={24} />
      </View>

      {/* Search bar skeleton */}
      <View style={styles.searchSkeleton}>
        <SkeletonBox width="100%" height={56} borderRadius={16} />
      </View>

      {/* Workout cards skeleton */}
      {[1, 2, 3].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.workoutCardSkeleton,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.workoutHeaderSkeleton}>
            <SkeletonBox width={48} height={48} borderRadius={12} />
            <View style={styles.workoutInfoSkeleton}>
              <SkeletonBox width={100} height={18} borderRadius={9} />
              <SkeletonBox width={70} height={14} borderRadius={7} style={{ marginTop: 6 }} />
            </View>
          </View>
          <View style={styles.workoutStatsSkeleton}>
            <SkeletonBox width={70} height={16} borderRadius={8} />
            <SkeletonBox width={90} height={16} borderRadius={8} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const CameraSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonBox width={220} height={32} borderRadius={16} />
      </View>

      {/* Camera preview skeleton */}
      <View style={styles.cameraSkeleton}>
        <SkeletonBox width="100%" height={250} borderRadius={16} />
      </View>

      {/* Tips skeleton */}
      {[1, 2, 3].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.tipSkeleton,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SkeletonBox width={36} height={36} borderRadius={10} />
          <View style={styles.tipTextSkeleton}>
            <SkeletonBox width={140} height={16} borderRadius={8} />
            <SkeletonBox width={200} height={14} borderRadius={7} style={{ marginTop: 6 }} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const ProfileSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Profile header skeleton */}
      <View style={styles.profileHeaderSkeleton}>
        <SkeletonBox width={96} height={96} borderRadius={48} />
        <SkeletonBox width={150} height={24} borderRadius={12} style={{ marginTop: 16 }} />
        <SkeletonBox width={200} height={16} borderRadius={8} style={{ marginTop: 8 }} />
      </View>

      {/* Stats grid skeleton */}
      <View style={styles.statsGridSkeleton}>
        {[1, 2, 3].map((index) => (
          <SkeletonBox key={index} width={100} height={80} borderRadius={16} />
        ))}
      </View>

      {/* Menu items skeleton */}
      {[1, 2, 3, 4].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.menuItemSkeleton,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SkeletonBox width={36} height={36} borderRadius={10} />
          <SkeletonBox width={120} height={16} borderRadius={8} />
        </Animated.View>
      ))}
    </View>
  );

  const ChartSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Chart header skeleton */}
      <View style={styles.chartHeaderSkeleton}>
        <SkeletonBox width={160} height={20} borderRadius={10} />
        <SkeletonBox width={100} height={16} borderRadius={8} style={{ marginTop: 6 }} />
      </View>

      {/* Chart area skeleton */}
      <SkeletonBox width="100%" height={200} borderRadius={16} style={{ marginTop: 16 }} />

      {/* Legend skeleton */}
      <View style={styles.legendSkeleton}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.legendItemSkeleton}>
            <SkeletonBox width={12} height={3} borderRadius={2} />
            <SkeletonBox width={60} height={12} borderRadius={6} />
          </View>
        ))}
      </View>
    </View>
  );

  const DefaultSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <SkeletonBox width={200} height={32} borderRadius={16} />
      <SkeletonBox width="100%" height={200} borderRadius={16} style={{ marginTop: 20 }} />
      <View style={styles.defaultContentSkeleton}>
        <SkeletonBox width="80%" height={16} borderRadius={8} />
        <SkeletonBox width="60%" height={16} borderRadius={8} style={{ marginTop: 12 }} />
        <SkeletonBox width="90%" height={16} borderRadius={8} style={{ marginTop: 12 }} />
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        {showIcon && icon && (
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1.1],
                    }),
                  },
                ],
              },
            ]}
          >
            {icon}
          </Animated.View>
        )}

        {renderSkeletonContent()}

        <Animated.Text
          style={[
            styles.message,
            { color: theme.colors.textSecondary },
            {
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            },
          ]}
        >
          {message}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

// Hook for smooth content entrance
export const useContentEntrance = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return { animateIn, animatedStyle };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  skeletonContainer: {
    width: '100%',
    padding: 20,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  arenaSkeleton: {
    marginBottom: 24,
  },
  leaderboardItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  leaderboardTextSkeleton: {
    flex: 1,
  },
  searchSkeleton: {
    marginBottom: 20,
  },
  mealCardSkeleton: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  mealHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  mealInfoSkeleton: {
    flex: 1,
  },
  mealStatsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutCardSkeleton: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  workoutHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  workoutInfoSkeleton: {
    flex: 1,
  },
  workoutStatsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cameraSkeleton: {
    marginBottom: 24,
  },
  tipSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  tipTextSkeleton: {
    flex: 1,
  },
  profileHeaderSkeleton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statsGridSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  menuItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  chartHeaderSkeleton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  legendSkeleton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  legendItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  defaultContentSkeleton: {
    width: '100%',
    marginTop: 20,
  },
});