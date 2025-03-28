export type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
} 