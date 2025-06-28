import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/components/CustomAlert';
import { useToast } from '@/components/Toast';

const { width, height } = Dimensions.get('window');

// Utility for scaling sizes based on device width
const scale = (size: number) => {
  if (Platform.OS === 'web') {
    // Use a fixed scaling for web to avoid huge UI on large screens
    return size * 1.1;
  }
  return (width / 375) * size;
};

export default function AuthScreen() {
  const { theme } = useTheme();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { showToast, ToastComponent } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    if (isSignUp) {
      if (!name.trim()) {
        showAlert({
          type: 'warning',
          title: 'Missing Information',
          message: 'Please enter your name',
        });
        return;
      }
      if (!validateName(name)) {
        showAlert({
          type: 'warning',
          title: 'Invalid Name',
          message: 'Name must be at least 2 characters long',
        });
        return;
      }
      if (!email.trim()) {
        showAlert({
          type: 'warning',
          title: 'Missing Information',
          message: 'Please enter your email',
        });
        return;
      }
      if (!validateEmail(email)) {
        showAlert({
          type: 'warning',
          title: 'Invalid Email',
          message: 'Please enter a valid email address',
        });
        return;
      }
      if (!password) {
        showAlert({
          type: 'warning',
          title: 'Missing Information',
          message: 'Please enter a password',
        });
        return;
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        showAlert({
          type: 'warning',
          title: 'Weak Password',
          message: passwordValidation.message,
        });
        return;
      }
    } else {
      if (!email.trim()) {
        showAlert({
          type: 'warning',
          title: 'Missing Information',
          message: 'Please enter your email',
        });
        return;
      }
      if (!validateEmail(email)) {
        showAlert({
          type: 'warning',
          title: 'Invalid Email',
          message: 'Please enter a valid email address',
        });
        return;
      }
      if (!password) {
        showAlert({
          type: 'warning',
          title: 'Missing Information',
          message: 'Please enter your password',
        });
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
          
          showAlert({
            type: 'error',
            title: 'Sign Up Failed',
            message: errorMessage,
          });
        } else if (data.user) {
          showToast({
            type: 'success',
            message: 'Account created! Please check your email for verification.',
            duration: 4000,
          });
          
          const { error: profileError } = await supabase.functions.invoke('create-user-profile', {
            body: { 
              name, 
              userId: data.user.id, 
              email: data.user.email
            },
          });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            showAlert({
              type: 'warning',
              title: 'Profile Setup Issue',
              message: 'Your account was created, but there was an error setting up your profile. Please try logging in.',
            });
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
          
          showAlert({
            type: 'error',
            title: 'Sign In Failed',
            message: errorMessage,
          });
        } else if (data.user) {
          showToast({
            type: 'success',
            message: `Welcome back, ${data.user.user_metadata.name || email}!`,
          });
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Unexpected error during auth:', error);
      showAlert({
        type: 'error',
        title: 'Connection Error',
        message: 'An unexpected error occurred. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                  <Leaf size={scale(40)} color="#FFFFFF" />
                  <Sparkles size={scale(20)} color="#FFFFFF" style={styles.sparkleIcon} />
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
                      <User size={scale(20)} color={theme.colors.accent} />
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
                    <Mail size={scale(20)} color={theme.colors.secondary} />
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
                    <Lock size={scale(20)} color={theme.colors.success} />
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
                      <EyeOff size={scale(20)} color={theme.colors.textSecondary} />
                    ) : (
                      <Eye size={scale(20)} color={theme.colors.textSecondary} />
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
                      <ArrowRight size={scale(20)} color="#FFFFFF" />
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

          {/* Footer section for Sign Up link and eco/AI badges */}
          {!isSignUp && (
            <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
              <View style={styles.footer}>
                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Leaf size={scale(16)} color={theme.colors.success} />
                    <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Eco-friendly</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Sparkles size={scale(16)} color={theme.colors.accent} />
                    <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>AI-powered</Text>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alert and Toast Components */}
      {AlertComponent}
      {ToastComponent}
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
    paddingHorizontal: scale(24),
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: scale(12),
  },
  sparkleIcon: {
    position: 'absolute',
    top: -scale(8),
    right: -scale(8),
  },
  appName: {
    fontSize: scale(32),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: scale(6),
    letterSpacing: 1,
  },
  tagline: {
    fontSize: scale(14),
    color: '#E9D5FF',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    alignItems: Platform.OS === 'web' ? 'center' : undefined,
  },
  formCard: {
    borderRadius: scale(18),
    padding: scale(20),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(6) },
    shadowOpacity: 0.1,
    shadowRadius: scale(18),
    elevation: 8,
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
    width: Platform.OS === 'web' ? '100%' : undefined,
  },
  formHeader: {
    marginBottom: scale(24),
    alignItems: 'center',
  },
  formTitle: {
    fontSize: scale(22),
    fontWeight: '700',
    marginBottom: scale(6),
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: scale(14),
    textAlign: 'center',
    lineHeight: scale(20),
  },
  formFields: {
    gap: scale(14),
    marginBottom: scale(24),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(2),
    minHeight: scale(44),
  },
  inputIcon: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  input: {
    flex: 1,
    fontSize: scale(14),
    fontWeight: '500',
  },
  passwordToggle: {
    padding: scale(6),
  },
  authButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
    marginBottom: scale(28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.2,
    shadowRadius: scale(8),
    elevation: 4,
  },
  authButtonGradient: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  authButtonText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: scale(8),
  },
  switchButtonText: {
    fontSize: scale(12),
    fontWeight: '500',
  },
  switchButtonLink: {
    fontWeight: '700',
  },
  footer: {
    padding: scale(16),
    paddingBottom: scale(32),
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  footerSafeArea: {
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: scale(12),
    textAlign: 'center',
    marginBottom: scale(10),
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: scale(16),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  featureText: {
    fontSize: scale(10),
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});