import { Tabs } from 'expo-router';
import { Chrome as Home, Utensils, Dumbbell, Leaf, User, Trophy, Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { theme } = useTheme();
  const { isDesktop, isMobile } = useResponsive();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: isDesktop ? 12 : 8,
          paddingTop: isDesktop ? 12 : 8,
          height: isDesktop ? 90 : isMobile ? 80 : 85,
          ...(isDesktop && {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            marginHorizontal: 20,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }),
        },
        tabBarLabelStyle: {
          fontSize: isDesktop ? 14 : 12,
          fontWeight: '600',
          marginTop: isDesktop ? 4 : 2,
        },
        tabBarIconStyle: {
          marginBottom: isDesktop ? 4 : 2,
        },
        ...(isDesktop && {
          tabBarItemStyle: {
            paddingVertical: 8,
            borderRadius: 12,
            marginHorizontal: 4,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={isDesktop ? size + 2 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Meals',
          tabBarIcon: ({ size, color }) => (
            <Utensils size={isDesktop ? size + 2 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ size, color }) => (
            <Dumbbell size={isDesktop ? size + 2 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'AI Recipes',
          tabBarIcon: ({ size, color }) => (
            <Camera size={isDesktop ? size + 2 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="eco"
        options={{
          title: 'KaliAI',
          tabBarIcon: ({ size, color }) => (
            <Leaf size={isDesktop ? size + 2 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={isDesktop ? size + 2 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={isDesktop ? size + 2 : size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}