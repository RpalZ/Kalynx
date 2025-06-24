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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, Mail, Lock, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Notification } from '../components/Notification';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthScreen() {
  const { theme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    // Clear any existing notifications
    setNotification(null);

    // Validate inputs
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
        // console.log('Attempting sign up with:', { email, name, passwordLength: password.length });
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
          // console.log('Supabase signUp data:', data);
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
            // Redirect after successful signup and profile creation
            router.replace('/(tabs)');
          }
        }
      } else {
        // console.log('Attempting sign in with:', { email });
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
          // console.log('Supabase signIn data:', data);
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
        <LinearGradient
          colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]] as const}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <Leaf size={48} color="#FFFFFF" />
            <Text style={styles.appName}>Kalyx</Text>
            <Text style={styles.tagline}>Sustainable Health & Fitness</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={[styles.formSubtitle, { color: theme.colors.textSecondary }]}>
            {isSignUp 
              ? 'Start your sustainable health journey' 
              : 'Sign in to continue tracking your progress'
            }
          </Text>

          {isSignUp && (
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <User size={20} color={theme.colors.textSecondary} />
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

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Mail size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Email"
              placeholderTextColor={theme.colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Lock size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Password"
              placeholderTextColor={theme.colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: theme.colors.success }, isLoading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.authButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setName('');
              setEmail('');
              setPassword('');
            }}
          >
            <Text style={[styles.switchButtonText, { color: theme.colors.success }]}>
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.placeholder }]}>
            Track your nutrition, fitness, and environmental impact
          </Text>
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
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#D1FAE5',
    textAlign: 'center',
  },
  formContainer: {
    flex: 2,
    padding: 32,
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  authButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});