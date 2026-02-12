import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
// import { useToast } from '@/components/ui/use-toast';
// import { symptômes } from "@/lib/symptômes";
import { useNotifications } from '@/contexts/NotificationContext';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // const { toast } = useToast();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN') {
          addNotification("User has been signed in.", "log", "Auth Event: SIGNED_IN");
        }
        if (event === 'SIGNED_OUT') {
          addNotification("User has been signed out.", "log", "Auth Event: SIGNED_OUT");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [addNotification]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // toast({
        //   title: "Error signing in",
        //   description: error.message,
        //   variant: "destructive",
        // });
        // console.error("Error signing in:", error.message);
        addNotification("Error signing in.", "error", error.message);
        return;
      }
      // toast({
      //   title: "Signed In",
      //   description: "You are now signed in.",
      // });
      // console.log("Signed In: You are now signed in.");
      addNotification("You are now signed in.", "success");
    } catch (error: any) {
      // toast({
      //   title: "Error signing in",
      //   description: error.message,
      //   variant: "destructive",
      // });
      // console.error("Error signing in:", error.message);
      addNotification("Error signing in.", "error", error.message);
    }
  }, [addNotification]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // toast({
        //   title: "Error signing out",
        //   description: error.message,
        //   variant: "destructive",
        // });
        // console.error("Error signing out:", error.message);
        addNotification("Error signing out.", "error", error.message);
        return;
      }
      // toast({
      //   title: "Signed Out",
      //   description: "You have been signed out.",
      // });
      // console.log("Signed Out: You have been signed out.");
      addNotification("You have been signed out.", "success");
    } catch (error: any) {
      // toast({
      //   title: "Error signing out",
      //   description: error.message,
      //   variant: "destructive",
      // });
      // console.error("Error signing out:", error.message);
      addNotification("Error signing out.", "error", error.message);
    }
  }, [addNotification]);

  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signOut,
  }), [session, user, loading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
