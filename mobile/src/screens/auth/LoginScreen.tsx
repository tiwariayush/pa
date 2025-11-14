/**
 * Login Screen - Simple authentication interface
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../stores/AuthStore';
import { colors, spacing, typography, shadows, theme } from '../../theme/theme';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';

const LoginScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLoginMode && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      if (isLoginMode) {
        await login(email.trim(), password);
      } else {
        await register({
          name: name.trim(),
          email: email.trim(),
          password: password,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="assistant" size={40} color={theme.colors.primary} />
            </View>

            <Text style={styles.title}>Personal Assistant</Text>
            <Text style={styles.subtitle}>
              A calmer, more intentional way to manage your life.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isLoginMode ? 'Welcome back' : 'Create your account'}
            </Text>

            {!isLoginMode && (
              <TextInput
                style={styles.input}
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={22}
                color={colors.gray[500]}
                style={styles.passwordIcon}
                onPress={() => setShowPassword((prev) => !prev)}
              />
            </View>

            <PrimaryButton
              label={isLoginMode ? 'Sign in' : 'Create account'}
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.switchButton}>
              <Text style={styles.switchLabel}>
                {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <Text
                style={styles.switchLink}
                onPress={() => !isLoading && setIsLoginMode(!isLoginMode)}
              >
                {isLoginMode ? 'Sign up' : 'Sign in'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    padding: spacing.xl,
    borderRadius: theme.roundness * 1.5,
    ...shadows.md,
  },
  formTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: theme.roundness,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.sizes.md,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  passwordIcon: {
    position: 'absolute',
    right: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  switchButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginRight: spacing.xs,
  },
  switchLink: {
    fontSize: typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: typography.weights.medium,
  },
});

export default LoginScreen;