import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Leaf, 
  Droplet, 
  Target,
  TrendingUp,
  Trophy,
  Utensils,
  Dumbbell,
  Calendar,
  X,
  ChevronRight,
  Zap
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  component?: React.ReactNode;
  actions?: MessageAction[];
}

interface MessageAction {
  id: string;
  label: string;
  type: 'navigate' | 'modal' | 'action';
  target?: string;
  data?: any;
}

interface UserStats {
  totalMeals: number;
  totalWorkouts: number;
  totalCO2e: number;
  totalWater: number;
  avgEcoScore: number;
  currentStreak: number;
}

interface QuickStatsProps {
  stats: UserStats;
}

const QuickStatsCard: React.FC<QuickStatsProps> = ({ stats }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.statsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Your Weekly Impact</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Leaf size={16} color={theme.colors.success} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.totalCO2e.toFixed(1)}kg</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>CO₂</Text>
        </View>
        <View style={styles.statItem}>
          <Droplet size={16} color={theme.colors.info} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.totalWater.toFixed(0)}L</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Water</Text>
        </View>
        <View style={styles.statItem}>
          <Utensils size={16} color={theme.colors.warning} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.totalMeals}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Meals</Text>
        </View>
        <View style={styles.statItem}>
          <Dumbbell size={16} color={theme.colors.secondary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Workouts</Text>
        </View>
      </View>
    </View>
  );
};

export default function KaliAIScreen() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [conversationContext, setConversationContext] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
    initializeChat();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserStats();
    }, [])
  );

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
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      // Get last 7 days of data
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const [mealsResponse, workoutsResponse, scoresResponse] = await Promise.all([
        supabase.from('meals').select('*').eq('user_id', session.session.user.id).gte('created_at', weekAgoStr),
        supabase.from('workouts').select('*').eq('user_id', session.session.user.id).gte('created_at', weekAgoStr),
        supabase.from('daily_scores').select('*').eq('user_id', session.session.user.id).gte('date', weekAgoStr)
      ]);

      const meals = mealsResponse.data || [];
      const workouts = workoutsResponse.data || [];
      const scores = scoresResponse.data || [];

      const stats: UserStats = {
        totalMeals: meals.length,
        totalWorkouts: workouts.length,
        totalCO2e: meals.reduce((sum, meal) => sum + (meal.carbon_impact || 0), 0),
        totalWater: meals.reduce((sum, meal) => sum + (meal.water_impact || 0), 0),
        avgEcoScore: scores.length ? scores.reduce((sum, score) => sum + (score.eco_score || 0), 0) / scores.length : 0,
        currentStreak: 7, // Mock streak data
      };

      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'bot',
      content: "Hi there! I'm KaliAI, your personal sustainability and fitness assistant. I'm here to help you make eco-friendly choices and reach your health goals. How can I assist you today?",
      timestamp: new Date(),
      actions: [
        { id: 'tips', label: 'Get Daily Tips', type: 'action', data: 'daily_tips' },
        { id: 'stats', label: 'Show My Stats', type: 'action', data: 'show_stats' },
        { id: 'challenges', label: 'View Challenges', type: 'navigate', target: '/leaderboard' },
      ]
    };
    setMessages([welcomeMessage]);
  };

  const generateAIResponse = async (userMessage: string, context: string[]): Promise<string> => {
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    
    if (!DEEPSEEK_API_KEY) {
      return "I'm having trouble connecting to my knowledge base right now. Please try again later!";
    }

    try {
      const systemPrompt = `You are KaliAI, a friendly and knowledgeable AI assistant for Kalyx, a sustainable health and fitness app. 

Your personality:
- Supportive and encouraging
- Knowledgeable about sustainability, eco-friendly habits, and fitness
- Conversational and friendly, not robotic
- Proactive in offering tips and suggestions

User context:
${userStats ? `
- Total meals logged this week: ${userStats.totalMeals}
- Total workouts this week: ${userStats.totalWorkouts}
- Carbon footprint this week: ${userStats.totalCO2e.toFixed(1)}kg CO₂
- Water usage this week: ${userStats.totalWater.toFixed(0)}L
- Average eco score: ${userStats.avgEcoScore.toFixed(0)}
- Current streak: ${userStats.currentStreak} days
` : 'User stats not available'}

Recent conversation context: ${context.join(' ')}

Guidelines:
- Keep responses conversational and under 150 words
- Offer specific, actionable advice
- Reference user's data when relevant
- Suggest system commands when appropriate using this format: [SYSTEM:command_name]
- Available system commands: show_stats, navigate_meals, navigate_workouts, navigate_leaderboard, navigate_camera, daily_tips

Respond to the user's message naturally and helpfully.`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble processing that right now. Could you try rephrasing your question?";
    }
  };

  const processSystemCommands = (content: string): { content: string; actions: MessageAction[]; component?: React.ReactNode } => {
    const actions: MessageAction[] = [];
    let component: React.ReactNode = null;
    let processedContent = content;

    // Extract system commands
    const systemCommandRegex = /\[SYSTEM:(\w+)\]/g;
    const commands = [...content.matchAll(systemCommandRegex)];

    commands.forEach(([fullMatch, command]) => {
      processedContent = processedContent.replace(fullMatch, '');
      
      switch (command) {
        case 'show_stats':
          if (userStats) {
            component = <QuickStatsCard stats={userStats} />;
          }
          break;
        case 'navigate_meals':
          actions.push({ id: 'meals', label: 'Log Meals', type: 'navigate', target: '/(tabs)/meals' });
          break;
        case 'navigate_workouts':
          actions.push({ id: 'workouts', label: 'Log Workouts', type: 'navigate', target: '/(tabs)/workouts' });
          break;
        case 'navigate_leaderboard':
          actions.push({ id: 'leaderboard', label: 'View Leaderboard', type: 'navigate', target: '/(tabs)/leaderboard' });
          break;
        case 'navigate_camera':
          actions.push({ id: 'camera', label: 'Scan Fridge', type: 'navigate', target: '/(tabs)/camera' });
          break;
        case 'daily_tips':
          actions.push({ id: 'tips', label: 'More Tips', type: 'action', data: 'daily_tips' });
          break;
      }
    });

    return { content: processedContent.trim(), actions, component };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setShowQuickActions(false);

    // Update conversation context
    const newContext = [...conversationContext, inputText.trim()].slice(-5); // Keep last 5 messages
    setConversationContext(newContext);

    try {
      const aiResponse = await generateAIResponse(inputText.trim(), newContext);
      const { content, actions, component } = processSystemCommands(aiResponse);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
        component,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm having trouble right now. Please try again in a moment!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (actionData: string) => {
    if (actionData === 'daily_tips') {
      const tips = [
        "💡 Try replacing one meat meal with a plant-based option today to reduce your carbon footprint by up to 2kg CO₂!",
        "🚰 Use a reusable water bottle instead of single-use plastic to save approximately 167 plastic bottles per year.",
        "🚶‍♀️ Walk or bike for short trips under 2 miles - it's great exercise and eliminates car emissions!",
        "🥗 Plan your meals for the week to reduce food waste by up to 40% and save money.",
        "💪 Try a 10-minute bodyweight workout - no equipment needed and it burns calories efficiently!"
      ];
      
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      
      const tipMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `Here's a sustainable tip for you:\n\n${randomTip}`,
        timestamp: new Date(),
        actions: [
          { id: 'more_tips', label: 'Another Tip', type: 'action', data: 'daily_tips' },
          { id: 'log_meal', label: 'Log a Meal', type: 'navigate', target: '/(tabs)/meals' },
        ]
      };
      
      setMessages(prev => [...prev, tipMessage]);
    } else if (actionData === 'show_stats' && userStats) {
      const statsMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: "Here's your weekly sustainability and fitness summary:",
        timestamp: new Date(),
        component: <QuickStatsCard stats={userStats} />,
        actions: [
          { id: 'improve', label: 'How to Improve', type: 'action', data: 'improvement_tips' },
          { id: 'leaderboard', label: 'Compare with Others', type: 'navigate', target: '/(tabs)/leaderboard' },
        ]
      };
      
      setMessages(prev => [...prev, statsMessage]);
    }
    
    setShowQuickActions(false);
  };

  const handleActionPress = (action: MessageAction) => {
    if (action.type === 'navigate' && action.target) {
      router.push(action.target as any);
    } else if (action.type === 'action' && action.data) {
      handleQuickAction(action.data);
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.type === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.botMessageContainer]}>
        <View style={styles.messageHeader}>
          <View style={[styles.avatar, { backgroundColor: isUser ? theme.colors.secondary : theme.colors.success }]}>
            {isUser ? <User size={16} color="#FFFFFF" /> : <Bot size={16} color="#FFFFFF" />}
          </View>
          <Text style={[styles.messageSender, { color: theme.colors.textSecondary }]}>
            {isUser ? 'You' : 'KaliAI'}
          </Text>
          <Text style={[styles.messageTime, { color: theme.colors.placeholder }]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        <View style={[
          styles.messageBubble,
          { backgroundColor: isUser ? theme.colors.secondary : theme.colors.card },
          { borderColor: theme.colors.border }
        ]}>
          <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : theme.colors.text }]}>
            {message.content}
          </Text>
        </View>

        {message.component && (
          <View style={styles.componentContainer}>
            {message.component}
          </View>
        )}

        {message.actions && message.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {message.actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => handleActionPress(action)}
              >
                <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{action.label}</Text>
                <ChevronRight size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const QuickActionButton = ({ icon: Icon, label, onPress, color }: any) => (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={onPress}
    >
      <Icon size={20} color={color} />
      <Text style={[styles.quickActionText, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.gradient.success[0], theme.colors.gradient.success[1]]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={[styles.kaliAvatar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Sparkles size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>KaliAI</Text>
              <Text style={styles.headerSubtitle}>Your Sustainability Assistant</Text>
            </View>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: '#4ADE80' }]}>
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
          
          {isTyping && (
            <View style={[styles.messageContainer, styles.botMessageContainer]}>
              <View style={styles.messageHeader}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.success }]}>
                  <Bot size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.messageSender, { color: theme.colors.textSecondary }]}>KaliAI</Text>
              </View>
              <View style={[styles.messageBubble, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                  <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>Thinking...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {showQuickActions && (
          <View style={styles.quickActionsContainer}>
            <Text style={[styles.quickActionsTitle, { color: theme.colors.text }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton
                icon={Target}
                label="Daily Tips"
                color={theme.colors.warning}
                onPress={() => handleQuickAction('daily_tips')}
              />
              <QuickActionButton
                icon={TrendingUp}
                label="My Stats"
                color={theme.colors.info}
                onPress={() => handleQuickAction('show_stats')}
              />
              <QuickActionButton
                icon={Trophy}
                label="Leaderboard"
                color={theme.colors.accent}
                onPress={() => router.push('/(tabs)/leaderboard')}
              />
              <QuickActionButton
                icon={Zap}
                label="Scan Fridge"
                color={theme.colors.secondary}
                onPress={() => router.push('/(tabs)/camera')}
              />
            </View>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
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
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.colors.success : theme.colors.disabled }]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kaliAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 11,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  componentContainer: {
    marginTop: 8,
    maxWidth: '90%',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 200,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: '45%',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
});