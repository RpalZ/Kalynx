import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Notification } from '../components/Notification';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const { theme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }
    return { isValid: true, message: '' };
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const handleAuth = async () => {
    setNotification(null);

    if (isSignUp) {
      if (!name.trim()) {
        showNotification('Please enter your name', 'error');
        return;
      }
      if (!validateName(name)) {
        showNotification('Name must be at least 2 characters long', 'error');
        return;
      }
      if (!email.trim()) {
        showNotification('Please enter your email', 'error');
        return;
      }
      if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
      }
      if (!password) {
        showNotification('Please enter a password', 'error');
        return;
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        showNotification(passwordValidation.message, 'error');
        return;
      }
    } else {
      if (!email.trim()) {
        showNotification('Please enter your email', 'error');
        return;
      }
      if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
      }
      if (!password) {
        showNotification('Please enter your password', 'error');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });

        if (error) {
          console.error('Supabase signUp error details:', error);
          let errorMessage = 'An error occurred during sign up.';
          
          if (error.message.includes('already registered')) {
            errorMessage = 'This email is already registered. Please try logging in instead.';
          } else if (error.message.includes('password')) {
            errorMessage = 'Password must be at least 6 characters long and include a mix of letters, numbers, and special characters.';
          } else if (error.message.includes('email')) {
            errorMessage = 'Please enter a valid email address.';
          }
          
          showNotification(errorMessage, 'error');
        } else if (data.user) {
          showNotification('Your account has been created! Please check your email for verification.', 'success');
          
          const { error: profileError } = await supabase.functions.invoke('create-user-profile', {
            body: { 
              name, 
              userId: data.user.id, 
              email: data.user.email
            },
          });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            showNotification('Your account was created, but there was an error setting up your profile. Please try logging in.', 'error');
          } else {
            router.replace('/(tabs)');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Supabase signIn error details:', error);
          let errorMessage = 'An error occurred during sign in.';
          
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please verify your email address before logging in.';
          } else if (error.message.includes('User not found')) {
            errorMessage = 'No account found with this email. Please sign up first.';
          }
          
          showNotification(errorMessage, 'error');
        } else if (data.user) {
          showNotification(`Welcome back, ${data.user.user_metadata.name || email}!`, 'success');
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Unexpected error during auth:', error);
      showNotification('An unexpected error occurred. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with Hero Image */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]]}
            style={styles.headerGradient}
          >
            <View style={styles.heroImageContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' }}
                style={styles.heroImage}
              />
              <View style={styles.heroOverlay} />
            </View>
            
            <View style={styles.brandContainer}>
              <View style={styles.logoContainer}>
                <Leaf size={40} color="#FFFFFF" />
                <Sparkles size={20} color="#FFFFFF" style={styles.sparkleIcon} />
              </View>
              <Text style={styles.appName}>Kalyx</Text>
              <Text style={styles.tagline}>Sustainable Health & Fitness</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Form Container */}
        <View style={[styles.formContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.colors.textSecondary }]}>
                {isSignUp 
                  ? 'Start your sustainable health journey today' 
                  : 'Sign in to continue your wellness journey'
                }
              </Text>
            </View>

            <View style={styles.formFields}>
              {isSignUp && (
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={[styles.inputIcon, { backgroundColor: `${theme.colors.accent}20` }]}>
                    <User size={20} color={theme.colors.accent} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Full Name"
                    placeholderTextColor={theme.colors.placeholder}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.inputIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <Mail size={20} color={theme.colors.secondary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Email Address"
                  placeholderTextColor={theme.colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.inputIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                  <Lock size={20} color={theme.colors.success} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.authButton, isLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[theme.colors.gradient.success[0], theme.colors.gradient.success[1]]}
                style={styles.authButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.authButtonContent}>
                    <Text style={styles.authButtonText}>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setName('');
                setEmail('');
                setPassword('');
                setNotification(null);
              }}
            >
              <Text style={[styles.switchButtonText, { color: theme.colors.textSecondary }]}>
                {isSignUp 
                  ? 'Already have an account? ' 
                  : "Don't have an account? "
                }
                <Text style={[styles.switchButtonLink, { color: theme.colors.success }]}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.placeholder }]}>
            Track your nutrition, fitness, and environmental impact
          </Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Leaf size={16} color={theme.colors.success} />
              <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Eco-friendly</Text>
            </View>
            <View style={styles.featureItem}>
              <Sparkles size={16} color={theme.colors.accent} />
              <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>AI-powered</Text>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    height: height * 0.4,
  },
  headerGradient: {
    flex: 1,
    position: 'relative',
  },
  heroImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#E9D5FF',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formCard: {
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  formHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  formFields: {
    gap: 20,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 56,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  passwordToggle: {
    padding: 8,
  },
  authButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  authButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchButtonLink: {
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});