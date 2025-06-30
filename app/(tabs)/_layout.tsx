import { Tabs } from 'expo-router';
import { Chrome as Home, Utensils, Dumbbell, Leaf, User, Trophy, Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform, Dimensions } from 'react-native';
import { DesktopLayout } from '@/components/DesktopLayout';
import { useState, useEffect } from 'react';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const { theme } = useTheme();
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('index');
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    // Only check desktop status once to prevent re-renders
    const checkDesktop = () => {
      const desktop = Platform.OS === 'web' && width >= 1024;
      setIsDesktop(desktop);
    };
    
    checkDesktop();
  }, []); // Empty dependency array to run only once
  
  if (isDesktop) {
    return (
      <DesktopLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
      >
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hide mobile tabs on desktop
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ size, color }) => (
                <Home size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="meals"
            options={{
              title: 'Meals',
              tabBarIcon: ({ size, color }) => (
                <Utensils size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="workouts"
            options={{
              title: 'Workouts',
              tabBarIcon: ({ size, color }) => (
                <Dumbbell size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="eco"
            options={{
              title: 'KaliAI',
              tabBarIcon: ({ size, color }) => (
                <Leaf size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: 'Leaderboard',
              tabBarIcon: ({ size, color }) => (
                <Trophy size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="camera"
            options={{
              title: 'Camera',
              tabBarIcon: ({ size, color }) => (
                <Camera size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ size, color }) => (
                <User size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </DesktopLayout>
    );
  }
  
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
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Meals',
          tabBarIcon: ({ size, color }) => (
            <Utensils size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ size, color }) => (
            <Dumbbell size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="eco"
        options={{
          title: 'KaliAI',
          tabBarIcon: ({ size, color }) => (
            <Leaf size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ size, color }) => (
            <Camera size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}