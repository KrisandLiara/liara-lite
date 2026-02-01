
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCheckComplete, setAdminCheckComplete] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Query the user_profiles table to check if the user has admin role
          const { data, error } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data?.role === 'admin');
          }
        } catch (error) {
          console.error('Error in admin check:', error);
          setIsAdmin(false);
        }
        setAdminCheckComplete(true);
      }
    };

    if (user) {
      checkAdminStatus();
    } else {
      setAdminCheckComplete(true);
    }
  }, [user]);

  if (loading || (user && requireAdmin && !adminCheckComplete)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Not logged in - redirect to guest page
  if (!user) {
    return <Navigate to="/guest" replace />;
  }

  // Check for admin access if required
  if (requireAdmin && !isAdmin) {
    // User is logged in but not an admin - redirect to chat page
    return <Navigate to="/chat" replace />;
  }

  // User is logged in and has required permissions
  return <>{children}</>;
};
