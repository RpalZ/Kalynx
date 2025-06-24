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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  Trophy, 
  Camera,
  Leaf,
  Droplet,
  Target,
  Zap
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: string;
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
  const { theme } = useTheme();
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
    // Initial greeting when component mounts
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hi there! I'm KaliAI, your personal sustainability and fitness assistant! 🌱✨\n\nI'm here to help you make eco-friendly choices, track your environmental impact, and support your fitness journey. What would you like to know about today?",
        timestamp: new Date(),
        actions: [
          { label: "Daily Tips", action: "tips" },
          { label: "My Stats", action: "stats" },
          { label: "Leaderboard", action: "leaderboard" },
          { label: "Scan Fridge", action: "camera" }
        ]
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
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.replace('/auth');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-daily-summary?date=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserStats({
          totalCO2e: data.totalCO2e,
          totalWater: data.totalWater,
          mealsCount: data.mealsCount,
          workoutsCount: data.workoutsCount,
          caloriesBurned: data.caloriesBurned,
        });
      }
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

      // Prepare conversation context (last 5 messages for context)
      const context = messages.slice(-5).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('kali-ai-chat', {
        body: {
          userMessage: inputText.trim(),
          context: context,
          userStats: userStats
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse = data.response;
      
      // Process system commands
      const { cleanResponse, systemCommands } = processSystemCommands(aiResponse);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanResponse,
        timestamp: new Date(),
      };

      // Execute system commands
      systemCommands.forEach(command => executeSystemCommand(command));

      // Add action buttons based on response content
      if (cleanResponse.toLowerCase().includes('stats') || cleanResponse.toLowerCase().includes('progress')) {
        assistantMessage.actions = [
          { label: "Show Stats", action: "stats" },
          { label: "View Leaderboard", action: "leaderboard" }
        ];
      } else if (cleanResponse.toLowerCase().includes('meal') || cleanResponse.toLowerCase().includes('food')) {
        assistantMessage.actions = [
          { label: "Log Meal", action: "meals" },
          { label: "Scan Fridge", action: "camera" }
        ];
      } else if (cleanResponse.toLowerCase().includes('workout') || cleanResponse.toLowerCase().includes('exercise')) {
        assistantMessage.actions = [
          { label: "Log Workout", action: "workouts" }
        ];
      }

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
    const systemCommands: string[] = [];
    let cleanResponse = response;

    let match;
    while ((match = systemCommandRegex.exec(response)) !== null) {
      systemCommands.push(match[1]);
      cleanResponse = cleanResponse.replace(match[0], '');
    }

    return { cleanResponse: cleanResponse.trim(), systemCommands };
  };

  const executeSystemCommand = (command: string) => {
    if (command.startsWith('navigate:')) {
      const route = command.replace('navigate:', '');
      router.push(route as any);
    } else if (command.startsWith('component:')) {
      const component = command.replace('component:', '');
      if (component === 'stats') {
        handleQuickAction('stats');
      } else if (component === 'tips') {
        handleQuickAction('tips');
      }
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
          actions: [
            { label: "Log Meal", action: "meals" },
            { label: "Scan Fridge", action: "camera" }
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
            actions: [
              { label: "View Leaderboard", action: "leaderboard" },
              { label: "Log Meal", action: "meals" }
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
      { backgroundColor: message.role === 'user' ? theme.colors.secondary : theme.colors.card }
    ]}>
      <View style={styles.messageHeader}>
        {message.role === 'assistant' ? (
          <Bot size={16} color={theme.colors.success} />
        ) : (
          <User size={16} color="#FFFFFF" />
        )}
        <Text style={[
          styles.messageRole,
          { color: message.role === 'user' ? '#FFFFFF' : theme.colors.textSecondary }
        ]}>
          {message.role === 'assistant' ? 'KaliAI' : 'You'}
        </Text>
      </View>
      <Text style={[
        styles.messageText,
        { color: message.role === 'user' ? '#FFFFFF' : theme.colors.text }
      ]}>
        {message.content}
      </Text>
      {message.actions && (
        <View style={styles.messageActions}>
          {message.actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleQuickAction(action.action)}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const TypingIndicator = () => (
    <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: theme.colors.card }]}>
      <View style={styles.messageHeader}>
        <Bot size={16} color={theme.colors.success} />
        <Text style={[styles.messageRole, { color: theme.colors.textSecondary }]}>KaliAI</Text>
      </View>
      <View style={styles.typingIndicator}>
        <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
        <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
        <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading KaliAI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleQuickAction('tips')}
        >
          <Leaf size={16} color={theme.colors.success} />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Daily Tips</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleQuickAction('stats')}
        >
          <TrendingUp size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]}>My Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleQuickAction('leaderboard')}
        >
          <Trophy size={16} color={theme.colors.warning} />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleQuickAction('camera')}
        >
          <Camera size={16} color={theme.colors.accent} />
          <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Scan Fridge</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </ScrollView>

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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
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
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
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