import { create } from "zustand";

const LS_NAME_KEY = "postify_admin_name";
const LS_EMAIL_KEY = "postify_admin_email";

const DEFAULT_NAME = "Super Admin";
const DEFAULT_EMAIL = "admin@postify.academy";

function loadFromStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

interface AuthState {
  isLoggedIn: boolean;
  adminName: string;
  adminEmail: string;
  setLoggedIn: (name?: string) => void;
  setLoggedOut: () => void;
  setAdminIdentity: (name: string, email: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  adminName: loadFromStorage(LS_NAME_KEY, DEFAULT_NAME),
  adminEmail: loadFromStorage(LS_EMAIL_KEY, DEFAULT_EMAIL),

  setLoggedIn: (name?: string) => {
    const storedName = loadFromStorage(LS_NAME_KEY, DEFAULT_NAME);
    const resolvedName = name ?? storedName;
    const resolvedEmail = loadFromStorage(LS_EMAIL_KEY, DEFAULT_EMAIL);
    saveToStorage(LS_NAME_KEY, resolvedName);
    set({
      isLoggedIn: true,
      adminName: resolvedName,
      adminEmail: resolvedEmail,
    });
  },

  setLoggedOut: () => {
    set({ isLoggedIn: false });
  },

  setAdminIdentity: (name: string, email: string) => {
    saveToStorage(LS_NAME_KEY, name);
    saveToStorage(LS_EMAIL_KEY, email);
    set({ adminName: name, adminEmail: email });
  },
}));
