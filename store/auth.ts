import { create } from "zustand";
import type { Session } from "@/lib/types";
type AuthState = {
  session: Session | null;
  ready: boolean;
  setSession: (session: Session | null) => void;
};
// Deliberately no persist middleware: access tokens live only in memory.
export const useAuth = create<AuthState>((set) => ({
  session: null,
  ready: false,
  setSession: (session) => set({ session, ready: true }),
}));
