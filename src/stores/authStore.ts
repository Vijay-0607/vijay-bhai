import { create } from 'zustand';
import { UserProfile, UserRole, Language } from '../types';
import { SEED_USERS } from '../data/seedData';

interface AuthState {
  currentUser: UserProfile | null;
  users: UserProfile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, passwordMock: string, rememberMe?: boolean) => { success: boolean; message?: string };
  loginVerified: (user: UserProfile) => void;
  loginAsDemo: (role: UserRole) => void;
  switchDemoAccount: (userId: string) => void;
  signup: (userData: {
    name: string;
    emailOrPhone: string;
    passwordMock: string;
    role: UserRole;
    district: string;
    language: Language;
  }) => { success: boolean; message?: string };
  logout: () => void;
  updateProfile: (updatedData: Partial<UserProfile>) => void;
}

const STORAGE_KEY_SESSION = 'mandimatch_session';
const STORAGE_KEY_USERS = 'mandimatch_users';

function getInitialUsers(): UserProfile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading users from localStorage:', e);
  }
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_USERS));
  } catch {}
  return SEED_USERS;
}

function getInitialSession(users: UserProfile[]): UserProfile | null {
  try {
    const sessionUserId = localStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionUserId) {
      const found = users.find((u) => u.id === sessionUserId);
      if (found) return found;
    }
  } catch (e) {
    console.error('Error loading session from localStorage:', e);
  }
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUsers = getInitialUsers();
  const initialUser = getInitialSession(initialUsers);

  return {
    currentUser: initialUser,
    users: initialUsers,
    isAuthenticated: initialUser !== null,
    isLoading: false,

    login: (emailOrPhone: string, _passwordMock: string, _rememberMe = true) => {
      const { users } = get();
      const query = emailOrPhone.trim().toLowerCase();

      const matched = users.find(
        (u) =>
          u.emailOrPhone.toLowerCase() === query ||
          (u.phone && u.phone.replace(/[\s\-]/g, '') === query.replace(/[\s\-]/g, ''))
      );

      if (!matched) {
        return {
          success: false,
          message: 'No demo account found with this email or phone. Try demo login or sign up!',
        };
      }

      try {
        localStorage.setItem(STORAGE_KEY_SESSION, matched.id);
      } catch (e) {
        console.warn('Failed to persist session to localStorage', e);
      }

      set({
        currentUser: matched,
        isAuthenticated: true,
      });

      return { success: true };
    },

    loginVerified: (user: UserProfile) => {
      const users = get().users;
      const updatedUsers = users.some((item) => item.id === user.id)
        ? users.map((item) => item.id === user.id ? { ...item, ...user } : item)
        : [...users, user];
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
        localStorage.setItem(STORAGE_KEY_SESSION, user.id);
      } catch (e) {
        console.warn('Failed to persist verified session to localStorage', e);
      }
      set({ users: updatedUsers, currentUser: user, isAuthenticated: true });
    },

    loginAsDemo: (role: UserRole) => {
      const { users } = get();
      let targetUser = users.find((u) => u.role === role);

      if (!targetUser) {
        targetUser = SEED_USERS.find((u) => u.role === role);
      }

      if (targetUser) {
        try {
          localStorage.setItem(STORAGE_KEY_SESSION, targetUser.id);
        } catch {}
        set({
          currentUser: targetUser,
          isAuthenticated: true,
        });
      }
    },

    switchDemoAccount: (userId: string) => {
      const targetUser = get().users.find((user) => user.id === userId);
      if (!targetUser) return;
      try { localStorage.setItem(STORAGE_KEY_SESSION, targetUser.id); } catch {}
      set({ currentUser: targetUser, isAuthenticated: true });
    },

    signup: (data) => {
      const { users } = get();
      const existing = users.find(
        (u) => u.emailOrPhone.toLowerCase() === data.emailOrPhone.trim().toLowerCase()
      );

      if (existing) {
        return {
          success: false,
          message: 'An account with this email or phone number already exists.',
        };
      }

      const newProfile: UserProfile = {
        id: `user-${data.role}-${Date.now()}`,
        name: data.name.trim(),
        emailOrPhone: data.emailOrPhone.trim(),
        role: data.role,
        district: data.district,
        language: data.language,
        bio: `Registered ${data.role} on MandiMatch platform in ${data.district}.`,
        rating: 5.0,
        completedDealsCount: 0,
        isDemoVerified: true,
        fpoMemberCount: data.role === 'fpo' ? 12 : undefined,
      };

      const updatedUsers = [...users, newProfile];

      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
        localStorage.setItem(STORAGE_KEY_SESSION, newProfile.id);
      } catch (e) {
        console.error('Failed to save demo user:', e);
      }

      set({
        users: updatedUsers,
        currentUser: newProfile,
        isAuthenticated: true,
      });

      return { success: true };
    },

    logout: () => {
      try {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      } catch {}
      set({
        currentUser: null,
        isAuthenticated: false,
      });
    },

    updateProfile: (updatedData) => {
      const { currentUser, users } = get();
      if (!currentUser) return;

      const updatedUser = { ...currentUser, ...updatedData };
      const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));

      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      } catch {}

      set({
        currentUser: updatedUser,
        users: updatedUsers,
      });
    },
  };
});
