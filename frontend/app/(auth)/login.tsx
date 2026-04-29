import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/constants/theme';
import { type } from '../../src/constants/typography';

function SparkIcon() {
  return (
    <Svg width={42} height={49} viewBox="0 0 23 27" fill="none">
      <Path
        d="M0.37418 -1.85373e-06L13.7567 4.28575C17.8679 5.60236 20.1368 10.0092 18.8202 14.1204L5.43768 9.83462C1.32648 8.51801 -0.942431 4.1112 0.37418 -1.85373e-06Z"
        fill="#2B2923"
      />
      <Path
        d="M5.53739 11.2516L19.5599 15.7423C21.5955 16.3942 22.7194 18.5771 22.0675 20.6127L21.6583 21.8905L8.91356 17.809C6.17127 16.9308 4.65917 13.9939 5.53739 11.2516Z"
        fill="#2B2923"
      />
      <Path
        d="M14.3157 20.8547L21.4211 23.1037L20.8564 24.8878C20.4935 26.0344 19.2697 26.6698 18.1231 26.3068L16.9542 25.9369C14.8222 25.262 13.6409 22.9867 14.3157 20.8547Z"
        fill="#2B2923"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and title */}
          <View style={styles.header}>
            <SparkIcon />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue monitoring your horses</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Error message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textQuaternary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textQuaternary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password link */}
            <TouchableOpacity style={styles.forgotPasswordBtn}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFDF0" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    ...type.largeTitle,
    color: Colors.textPrimary,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  errorContainer: {
    backgroundColor: Colors.critical.bg,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    ...type.callout,
    color: Colors.critical.text,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...type.body,
    color: Colors.textPrimary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...type.body,
    color: Colors.textPrimary,
  },
  showPasswordBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  showPasswordText: {
    ...type.callout,
    color: Colors.accent,
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    ...type.callout,
    color: Colors.accent,
  },
  loginBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    ...type.headline,
    color: '#FFFDF0',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    ...type.callout,
    color: Colors.textTertiary,
  },
  signUpLink: {
    ...type.callout,
    color: Colors.accent,
    fontWeight: '600',
  },
});
