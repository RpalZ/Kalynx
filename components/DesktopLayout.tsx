import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome as Home, Utensils, Dumbbell, Leaf, Trophy, Camera, User, Settings, Bell, Menu, Sparkles, LogOut } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface DesktopLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
}

const DESKTOP_BREAKPOINT = 1024;
const TABLET_BREAKPOINT = 768;

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  activeTab = 'index',
  onTabChange,
  showSidebar = true,
  onToggleSidebar,
}) => {
  const { theme, isDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const isDesktop = Platform.OS === 'web' && screenWidth >= DESKTOP_BREAKPOINT;
  const isTablet = Platform.OS === 'web' && screenWidth >= TABLET_BREAKPOINT && screenWidth < DESKTOP_BREAKPOINT;

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { id: 'index', label: 'Dashboard', icon: Home, color: theme.colors.primary, route: '/(tabs)/' },
    { id: 'meals', label: 'Meals', icon: Utensils, color: theme.colors.success, route: '/(tabs)/meals' },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell, color: theme.colors.secondary, route: '/(tabs)/workouts' },
    { id: 'camera', label: 'AI Scanner', icon: Camera, color: theme.colors.accent, route: '/(tabs)/camera' },
    { id: 'eco', label: 'KaliAI', icon: Leaf, color: theme.colors.success, route: '/(tabs)/eco' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: theme.colors.warning, route: '/(tabs)/leaderboard' },
    { id: 'profile', label: 'Profile', icon: User, color: theme.colors.info, route: '/(tabs)/profile' },
  ];

  const sidebarWidth = isDesktop ? 280 : isTablet ? 240 : 200;
  const headerHeight = 80;
  const contentPadding = isDesktop ? 32 : isTablet ? 24 : 16;

  // Get current active tab from pathname
  const getCurrentActiveTab = () => {
    if (pathname === '/(tabs)' || pathname === '/(tabs)/') return 'index';
    const pathParts = pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart || 'index';
  };

  const currentActiveTab = getCurrentActiveTab();

  const handleNavigation = (item: any) => {
    console.log('🚀 Desktop navigation clicked:', item.label, 'Route:', item.route);
    
    try {
      // Update active tab for visual feedback
      onTabChange?.(item.id);
      
      // Navigate using router.push
      if (item.id === 'index') {
        router.push('/(tabs)/');
      } else {
        router.push(item.route);
      }
      
      console.log('✅ Navigation completed for:', item.label);
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => (
    <TouchableOpacity
      style={[
        styles.navItem,
        {
          backgroundColor: isActive ? `${item.color}15` : 'transparent',
          borderColor: isActive ? item.color : 'transparent',
        }
      ]}
      onPress={() => handleNavigation(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.navIconContainer,
        { backgroundColor: isActive ? `${item.color}20` : 'transparent' }
      ]}>
        <item.icon 
          size={isDesktop ? 20 : 18} 
          color={isActive ? item.color : theme.colors.textSecondary} 
        />
      </View>
      <Text style={[
        styles.navLabel,
        {
          color: isActive ? item.color : theme.colors.textSecondary,
          fontWeight: isActive ? '600' : '500',
        }
      ]}>
        {item.label}
      </Text>
      {isActive && (
        <View style={[styles.activeIndicator, { backgroundColor: item.color }]} />
      )}
    </TouchableOpacity>
  );

  const Sidebar = () => (
    <View style={[
      styles.sidebar,
      {
        width: sidebarWidth,
        backgroundColor: theme.colors.card,
        borderRightColor: theme.colors.border,
      }
    ]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.sidebarGradient}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: `${theme.colors.success}20` }]}>
            <Leaf size={24} color={theme.colors.success} />
            <Sparkles size={12} color={theme.colors.success} style={styles.logoSparkle} />
          </View>
          <Text style={[styles.logoText, { color: theme.colors.text }]}>Kalyx</Text>
          <Text style={[styles.logoSubtext, { color: theme.colors.textSecondary }]}>
            Sustainable Health
          </Text>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <Text style={[styles.navSection, { color: theme.colors.textSecondary }]}>
            MAIN MENU
          </Text>
          {navigationItems.slice(0, 4).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentActiveTab === item.id}
            />
          ))}
          
          <Text style={[styles.navSection, { color: theme.colors.textSecondary }]}>
            INSIGHTS
          </Text>
          {navigationItems.slice(4, 6).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentActiveTab === item.id}
            />
          ))}
          
          <Text style={[styles.navSection, { color: theme.colors.textSecondary }]}>
            ACCOUNT
          </Text>
          {navigationItems.slice(6).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentActiveTab === item.id}
            />
          ))}
        </View>

        {/* Bottom Section */}
        <View style={styles.sidebarBottom}>
          <TouchableOpacity 
            style={[styles.settingsButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Settings size={18} color={theme.colors.textSecondary} />
            <Text style={[styles.settingsText, { color: theme.colors.textSecondary }]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const Header = () => (
    <View style={[
      styles.header,
      {
        height: headerHeight,
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.border,
        paddingLeft: showSidebar ? 0 : contentPadding,
      }
    ]}>
      <View style={styles.headerContent}>
        {/* Left Section */}
        <View style={styles.headerLeft}>
          {!showSidebar && (
            <TouchableOpacity
              style={[styles.menuButton, { backgroundColor: theme.colors.surface }]}
              onPress={onToggleSidebar}
              activeOpacity={0.7}
            >
              <Menu size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          
          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
              Welcome back, {user?.user_metadata?.name || 'there'}!
            </Text>
            <Text style={[styles.welcomeSubtext, { color: theme.colors.textSecondary }]}>
              Here's your sustainability dashboard
            </Text>
          </View>
        </View>

        {/* Right Section */}
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
          >
            <Bell size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={[styles.userProfile, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowProfileMenu(!showProfileMenu)}
              activeOpacity={0.7}
            >
              <View style={[styles.userAvatar, { backgroundColor: theme.colors.primary }]}>
                <User size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user?.user_metadata?.name || 'User'}
              </Text>
            </TouchableOpacity>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <View style={[styles.profileMenu, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={styles.profileMenuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push('/(tabs)/profile');
                  }}
                  activeOpacity={0.7}
                >
                  <User size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.profileMenuText, { color: theme.colors.text }]}>Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.profileMenuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push('/(tabs)/profile');
                  }}
                  activeOpacity={0.7}
                >
                  <Settings size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.profileMenuText, { color: theme.colors.text }]}>Settings</Text>
                </TouchableOpacity>
                
                <View style={[styles.profileMenuDivider, { backgroundColor: theme.colors.border }]} />
                
                <TouchableOpacity 
                  style={styles.profileMenuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    handleSignOut();
                  }}
                  activeOpacity={0.7}
                >
                  <LogOut size={16} color={theme.colors.error} />
                  <Text style={[styles.profileMenuText, { color: theme.colors.error }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const MainContent = () => (
    <View style={[
      styles.mainContent,
      {
        marginLeft: showSidebar ? sidebarWidth : 0,
        marginTop: headerHeight,
      }
    ]}>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { padding: contentPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );

  if (!isDesktop && !isTablet) {
    // Return mobile layout (existing tab layout)
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {showSidebar && <Sidebar />}
      <Header />
      <MainContent />
      
      {/* Overlay to close profile menu */}
      {showProfileMenu && (
        <TouchableOpacity 
          style={styles.overlay}
          onPress={() => setShowProfileMenu(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  
  // Sidebar Styles
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarGradient: {
    flex: 1,
    paddingVertical: 24,
  },
  logoSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  logoSparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Navigation Styles
  navigation: {
    flex: 1,
    paddingHorizontal: 16,
  },
  navSection: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    position: 'relative',
  },
  navIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navLabel: {
    fontSize: 14,
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    right: 8,
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  
  // Sidebar Bottom
  sidebarBottom: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Header Styles
  header: {
    position: 'fixed',
    top: 0,
    right: 0,
    left: 0,
    borderBottomWidth: 1,
    zIndex: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  welcomeSubtext: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    position: 'relative',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  profileMenuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileMenuDivider: {
    height: 1,
    marginVertical: 4,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  
  // Main Content Styles
  mainContent: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
});

export default DesktopLayout;