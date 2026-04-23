import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// API base URL - change to your production URL
const API_BASE_URL = __DEV__
  ? Platform.select({
      ios: 'http://localhost:3001',
      android: 'http://10.0.2.2:3001', // Android emulator localhost
      web: 'http://localhost:3001',
    })
  : 'https://your-production-api.com';

// Secure storage keys
const ACCESS_TOKEN_KEY = 'valkyrie_access_token';
const REFRESH_TOKEN_KEY = 'valkyrie_refresh_token';
const USER_KEY = 'valkyrie_user';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Web fallback for SecureStore (uses localStorage)
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Token storage functions
export async function getAccessToken(): Promise<string | null> {
  return secureStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return secureStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const userJson = await secureStorage.getItem(USER_KEY);
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
  return null;
}

export async function storeAuthData(data: AuthResponse): Promise<void> {
  await Promise.all([
    secureStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken),
    secureStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken),
    secureStorage.setItem(USER_KEY, JSON.stringify(data.user)),
  ]);
}

export async function clearAuthData(): Promise<void> {
  await Promise.all([
    secureStorage.removeItem(ACCESS_TOKEN_KEY),
    secureStorage.removeItem(REFRESH_TOKEN_KEY),
    secureStorage.removeItem(USER_KEY),
  ]);
}

// API request helper with token refresh
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const accessToken = await getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle token expiration
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const newTokens = await refreshAccessToken();
      if (newTokens) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        const retryData = await retryResponse.json();

        if (!retryResponse.ok) {
          throw new Error(retryData.error || 'Request failed');
        }
        return retryData;
      }
    }
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API functions
export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  await storeAuthData(response);
  return response;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  await storeAuthData(response);
  return response;
}

export async function refreshAccessToken(): Promise<AuthResponse | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const url = `${API_BASE_URL}/api/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearAuthData();
      return null;
    }

    const data: AuthResponse = await response.json();
    await storeAuthData(data);
    return data;
  } catch {
    await clearAuthData();
    return null;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();

  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Ignore logout errors
  }

  await clearAuthData();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiRequest<{ user: User }>('/api/auth/me');
    return response.user;
  } catch {
    return null;
  }
}

export async function updateProfile(data: {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<User> {
  const response = await apiRequest<{ user: User }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  // Update stored user
  const storedUser = await getStoredUser();
  if (storedUser) {
    await secureStorage.setItem(
      USER_KEY,
      JSON.stringify({ ...storedUser, ...response.user })
    );
  }

  return response.user;
}

// Check if user is authenticated (has valid tokens)
export async function isAuthenticated(): Promise<boolean> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  return !!(accessToken || refreshToken);
}
