import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Bot, User, Sparkles, TrendingUp, Trophy, Camera, Leaf, Droplet, Target, Zap, ExternalLink, ChartBar as BarChart3, Utensils, Dumbbell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Markdown from 'react-native-markdown-display';
import { DesktopLayout } from '@/components/DesktopLayout';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1024;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  systemActions?: Array<{
    label: string;
    action: string;
    icon?: string;
    description?: string;
  }>;
}

interface UserStats {
  totalCO2e: number;
  totalWater: number;
  mealsCount: number;
  workoutsCount: number;
  caloriesBurned: number;
}

export default function KaliAIScreen() {
  const { theme, isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserStats();
    }, [])
  );

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hi there! I'm KaliAI, your personal sustainability and fitness assistant! 🌱✨\n\nI'm here to help you make eco-friendly choices, track your environmental impact, and support your fitness journey. What would you like to know about today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    fetchUserStats();
  };

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.replace('/auth');
        return;
      }
      // Calculate date range for the past 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Fetch meals for the week
      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('calories, carbon_impact, water_impact, created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .eq('user_id', session.session.user.id);

      // Fetch workouts for the week
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('calories_burned, created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .eq('user_id', session.session.user.id);

      // Aggregate stats
      const totalCO2e = (meals || []).reduce((sum, m) => sum + (m.carbon_impact || 0), 0);
      const totalWater = (meals || []).reduce((sum, m) => sum + (m.water_impact || 0), 0);
      const mealsCount = (meals || []).length;
      const workoutsCount = (workouts || []).length;
      const caloriesBurned = (workouts || []).reduce((sum, w) => sum + (w.calories_burned || 0), 0);

      setUserStats({
        totalCO2e,
        totalWater,
        mealsCount,
        workoutsCount,
        caloriesBurned,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      // Only include user and assistant messages in context (no system prompts or stats)
      const context = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-5)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const { data, error } = await supabase.functions.invoke('kali-ai-chat', {
        body: {
          userMessage: inputText.trim(),
          context: context,
          // Always send the latest userStats from state
          userStats: userStats
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse = data.response;
      const { cleanResponse, systemActions } = processSystemCommands(aiResponse);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanResponse,
        timestamp: new Date(),
        systemActions: systemActions.length > 0 ? systemActions : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🤖",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const processSystemCommands = (response: string) => {
    const systemCommandRegex = /\[SYSTEM:([^\]]+)\]/g;
    const systemActions: Array<{
      label: string;
      action: string;
      icon?: string;
      description?: string;
    }> = [];
    let cleanResponse = response;

    let match;
    while ((match = systemCommandRegex.exec(response)) !== null) {
      const command = match[1];
      cleanResponse = cleanResponse.replace(match[0], '');
      
      if (command.startsWith('navigate:')) {
        const route = command.replace('navigate:', '');
        let label = '';
        let icon = '';
        let description = '';
        
        switch (route) {
          case '/(tabs)/leaderboard':
            label = 'View Leaderboard';
            icon = 'trophy';
            description = 'See how you rank against other users';
            break;
          case '/(tabs)/meals':
            label = 'Log Meal';
            icon = 'utensils';
            description = 'Track your nutrition and environmental impact';
            break;
          case '/(tabs)/workouts':
            label = 'Log Workout';
            icon = 'dumbbell';
            description = 'Record your fitness activities';
            break;
          case '/(tabs)/camera':
            label = 'Scan Fridge';
            icon = 'camera';
            description = 'Generate recipes from your ingredients';
            break;
          default:
            label = 'Go to ' + route.split('/').pop();
            icon = 'external-link';
        }
        
        systemActions.push({ label, action: route, icon, description });
      } else if (command.startsWith('component:')) {
        const component = command.replace('component:', '');
        let label = '';
        let icon = '';
        let description = '';
        
        switch (component) {
          case 'stats':
            label = 'Show My Stats';
            icon = 'bar-chart';
            description = 'View your weekly progress summary';
            break;
          case 'tips':
            label = 'Get Daily Tips';
            icon = 'leaf';
            description = 'Discover new sustainability practices';
            break;
          default:
            label = 'Show ' + component;
            icon = 'external-link';
        }
        
        systemActions.push({ label, action: component, icon, description });
      }
    }

    const finalResponse = cleanResponse.trim();
    return { 
      cleanResponse: finalResponse || "I'm here to help! What would you like to know?", 
      systemActions 
    };
  };

  const handleSystemAction = (action: string) => {
    const tabRoutes = ['/leaderboard', '/meals', '/workouts', '/camera'];
    let route = action;
    if (tabRoutes.includes(action)) {
      route = '/(tabs)' + action;
    }
    if (route.startsWith('/(tabs)/')) {
      router.push(route as any);
    } else {
      switch (action) {
        case 'stats':
          if (userStats) {
            const statsMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Here's your weekly impact summary:\n\n📊 **Your Stats This Week**\n🍽️ Meals logged: ${userStats.mealsCount}\n🏃‍♀️ Workouts: ${userStats.workoutsCount}\n🔥 Calories burned: ${userStats.caloriesBurned}\n🌍 Carbon footprint: ${userStats.totalCO2e.toFixed(2)} kg CO₂\n💧 Water usage: ${userStats.totalWater.toFixed(1)} liters\n\n${userStats.mealsCount > 5 ? "Great job staying consistent with meal logging! 🎉" : "Try to log more meals to get better insights! 💪"}`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, statsMessage]);
          }
          break;
        case 'tips':
          const tipsMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "Here are some daily sustainability tips:\n\n🌱 Choose plant-based meals to reduce your carbon footprint\n💧 Use a reusable water bottle\n🚶‍♀️ Walk or bike for short trips\n♻️ Reduce food waste by meal planning\n🌿 Buy local and seasonal produce\n\nWould you like specific advice based on your current habits?",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, tipsMessage]);
          break;
      }
    }
  };

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy size={16} color={theme.colors.warning} />;
      case 'utensils':
        return <Utensils size={16} color={theme.colors.success} />;
      case 'dumbbell':
        return <Dumbbell size={16} color={theme.colors.secondary} />;
      case 'camera':
        return <Camera size={16} color={theme.colors.accent} />;
      case 'bar-chart':
        return <BarChart3 size={16} color={theme.colors.info} />;
      case 'leaf':
        return <Leaf size={16} color={theme.colors.success} />;
      default:
        return <ExternalLink size={16} color={theme.colors.textSecondary} />;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'tips':
        const tipsMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Here are some daily sustainability tips:\n\n🌱 Choose plant-based meals to reduce your carbon footprint\n💧 Use a reusable water bottle\n🚶‍♀️ Walk or bike for short trips\n♻️ Reduce food waste by meal planning\n🌿 Buy local and seasonal produce",
          timestamp: new Date(),
          systemActions: [
            { label: "Log Meal", action: "/(tabs)/meals", icon: "utensils", description: "Track your nutrition" },
            { label: "Scan Fridge", action: "/(tabs)/camera", icon: "camera", description: "Generate recipes" }
          ]
        };
        setMessages(prev => [...prev, tipsMessage]);
        break;
      case 'stats':
        if (userStats) {
          const statsMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Here's your weekly impact summary:\n\n📊 **Your Stats This Week**\n🍽️ Meals logged: ${userStats.mealsCount}\n🏃‍♀️ Workouts: ${userStats.workoutsCount}\n🔥 Calories burned: ${userStats.caloriesBurned}\n🌍 Carbon footprint: ${userStats.totalCO2e.toFixed(2)} kg CO₂\n💧 Water usage: ${userStats.totalWater.toFixed(1)} liters\n\n${userStats.mealsCount > 5 ? "Great job staying consistent with meal logging! 🎉" : "Try to log more meals to get better insights! 💪"}`,
            timestamp: new Date(),
            systemActions: [
              { label: "View Leaderboard", action: "/(tabs)/leaderboard", icon: "trophy", description: "See your ranking" },
              { label: "Log Meal", action: "/(tabs)/meals", icon: "utensils", description: "Add a new meal" }
            ]
          };
          setMessages(prev => [...prev, statsMessage]);
        }
        break;
      case 'leaderboard':
        router.push('/(tabs)/leaderboard');
        break;
      case 'meals':
        router.push('/(tabs)/meals');
        break;
      case 'workouts':
        router.push('/(tabs)/workouts');
        break;
      case 'camera':
        router.push('/(tabs)/camera');
        break;
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <View style={[
      styles.messageBubble,
      message.role === 'user' ? styles.userBubble : styles.assistantBubble,
    ]}>
      {message.role === 'user' ? (
        <LinearGradient
          colors={[theme.colors.gradient.secondary[0], theme.colors.gradient.secondary[1]]}
          style={styles.userMessageGradient}
        >
          <View style={styles.messageHeader}>
            <User size={16} color="#FFFFFF" />
            <Text style={styles.userMessageRole}>You</Text>
          </View>
          <Text style={styles.userMessageText}>{message.content}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.assistantMessageContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.messageHeader}>
            <View style={[styles.botIcon, { backgroundColor: `${theme.colors.success}20` }]}>
              <Bot size={16} color={theme.colors.success} />
            </View>
            <Text style={[styles.assistantMessageRole, { color: theme.colors.textSecondary }]}>KaliAI</Text>
          </View>
          <Markdown style={{ body: { ...styles.assistantMessageText, color: theme.colors.text } }}>
            {message.content}
          </Markdown>
          {message.systemActions && (
            <View style={styles.systemActions}>
              <Text style={[styles.systemActionsTitle, { color: theme.colors.textSecondary }]}>Quick Actions:</Text>
              {message.systemActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.systemActionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleSystemAction(action.action)}
                >
                  <View style={styles.systemActionContent}>
                    <View style={styles.systemActionHeader}>
                      {action.icon && getActionIcon(action.icon)}
                      <Text style={[styles.systemActionLabel, { color: theme.colors.text }]}>
                        {action.label}
                      </Text>
                    </View>
                    {action.description && (
                      <Text style={[styles.systemActionDescription, { color: theme.colors.textSecondary }]}>{action.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const TypingIndicator = () => (
    <View style={[styles.messageBubble, styles.assistantBubble]}>
      <View style={[styles.assistantMessageContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.messageHeader}>
          <View style={[styles.botIcon, { backgroundColor: `${theme.colors.success}20` }]}>
            <Bot size={16} color={theme.colors.success} />
          </View>
          <Text style={[styles.assistantMessageRole, { color: theme.colors.textSecondary }]}>KaliAI</Text>
        </View>
        <View style={styles.typingIndicator}>
          <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
          <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
          <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.card }]}>
            <Sparkles size={48} color={theme.colors.success} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading KaliAI...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const content = (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.gradient.success[0], theme.colors.gradient.success[1]]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <View style={styles.avatarContainer}>
              <Sparkles size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>KaliAI</Text>
              <Text style={styles.headerSubtitle}>Your Sustainability Assistant</Text>
            </View>
          </View>
          <View style={styles.statusIndicator}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleQuickAction('tips')}
        >
          <Leaf size={16} color={theme.colors.success} />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">Daily Tips</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleQuickAction('stats')}
        >
          <TrendingUp size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">My Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleQuickAction('leaderboard')}
        >
          <Trophy size={16} color={theme.colors.warning} />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleQuickAction('camera')}
        >
          <Camera size={16} color={theme.colors.accent} />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">Scan Fridge</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Container */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Input Container */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Ask KaliAI anything about sustainability or fitness..."
            placeholderTextColor={theme.colors.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.colors.success }]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return isDesktop ? <DesktopLayout>{content}</DesktopLayout> : content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 12,
    color: '#D1FAE5',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  userMessageGradient: {
    padding: 16,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  assistantMessageContainer: {
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  botIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMessageRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assistantMessageRole: {
    fontSize: 12,
    fontWeight: '600',
  },
  userMessageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  assistantMessageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  systemActions: {
    marginTop: 12,
    gap: 8,
  },
  systemActionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  systemActionButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  systemActionContent: {
    gap: 4,
  },
  systemActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  systemActionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  systemActionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});