import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import SignUpPage from './page';
import { useAuth } from '@/contexts/auth-context';

// Mock the auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SignUpPage', () => {
  const mockSignUp = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      error: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders signup form', () => {
    renderWithProviders(<SignUpPage />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('handles successful signup', async () => {
    renderWithProviders(<SignUpPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'Password123');
    });
  });

  it('validates password requirements', async () => {
    renderWithProviders(<SignUpPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Test weak password
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    // Test password without uppercase
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one uppercase letter/i)).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    // Test password without lowercase
    fireEvent.change(passwordInput, { target: { value: 'PASSWORD123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'PASSWORD123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one lowercase letter/i)).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    // Test password without number
    fireEvent.change(passwordInput, { target: { value: 'Password' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one number/i)).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  it('validates password confirmation', async () => {
    renderWithProviders(<SignUpPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  it('displays error message when signup fails', async () => {
    const errorMessage = 'Email already registered';
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      error: errorMessage,
      isLoading: false,
    });

    renderWithProviders(<SignUpPage />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('disables form during loading state', () => {
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      error: null,
      isLoading: true,
    });

    renderWithProviders(<SignUpPage />);
    
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });
}); 