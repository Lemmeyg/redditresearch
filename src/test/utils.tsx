import { render } from '@testing-library/react';
import { AuthProvider } from '@/contexts/auth-context';

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
} 