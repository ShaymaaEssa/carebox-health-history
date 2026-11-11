import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  passwordRecovery: false,
  clearPasswordRecovery: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    passwordRecovery: false,
    clearPasswordRecovery: () => {},
  });
  const clearPasswordRecovery = useCallback(() => {
    setState((current) => ({ ...current, passwordRecovery: false }));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState((current) => ({
        user: session?.user ?? null,
        session,
        loading: false,
        passwordRecovery:
          event === "PASSWORD_RECOVERY" ||
          (event !== "SIGNED_OUT" && current.passwordRecovery),
      }));
    });
    supabase.auth.getSession().then(({ data }) => {
      setState((current) => ({
        user: data.session?.user ?? null,
        session: data.session,
        loading: false,
        passwordRecovery: current.passwordRecovery,
      }));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, clearPasswordRecovery }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
