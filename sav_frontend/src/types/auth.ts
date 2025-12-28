// src/types/auth.ts
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  phoneNumber?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  fullName?: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  username: string;
  userId: string;
  firstName: string;
  lastName: string;
  roles: string[];
  tokenExpiration: string;
  refreshTokenExpiration: string;
  message: string;
  fullName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  acceptTerms: boolean;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginAudit {
  id: number;
  userId: string;
  username: string;
  email: string;
  loginTime: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
}

export interface UserStats {
  totalLogins: number;
  failedLogins: number;
  recentLogins: number;
  lastLogin?: string;
  accountAge: number;
  passwordAge: number;
  isLocked: boolean;
}