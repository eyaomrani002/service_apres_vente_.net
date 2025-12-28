export interface AppUser {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isActive: boolean;
  lastLoginAt?: string | null;
  phoneNumber?: string | null;
}