export interface User {
  id: number | string;
  email_address: string;
  name?: string;
}

export interface AuthSession {
  token: string;
  session_id?: number | string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isDemoUser: boolean;
}
