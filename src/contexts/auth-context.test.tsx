import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

describe('AuthContext', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    user_metadata: { role: 'user' },
    created_at: '2024-01-01',
    last_sign_in_at: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles successful sign in', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.user_metadata.role,
      created_at: mockUser.created_at,
      last_sign_in_at: mockUser.last_sign_in_at,
    });
    expect(result.current.error).toBeNull();
  });

  it('handles sign in error', async () => {
    const errorMessage = 'Invalid credentials';
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'wrong-password');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles successful sign up', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signUp('test@example.com', 'Password123');
    });

    expect(result.current.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.user_metadata.role,
      created_at: mockUser.created_at,
      last_sign_in_at: mockUser.last_sign_in_at,
    });
    expect(result.current.error).toBeNull();
  });

  it('handles sign up error', async () => {
    const errorMessage = 'Email already registered';
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signUp('test@example.com', 'Password123');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles successful sign out', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles sign out error', async () => {
    const errorMessage = 'Network error';
    (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('handles password reset', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(result.current.error).toBeNull();
  });

  it('handles password reset error', async () => {
    const errorMessage = 'User not found';
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.resetPassword('nonexistent@example.com');
    });

    expect(result.current.error).toBe(errorMessage);
  });
}); 