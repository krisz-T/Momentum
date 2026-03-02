import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const fetchProfile = useCallback(async (session) => {
    if (!session) {
      setUserProfile(null);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const profileData = await response.json();
      if (profileData && profileData.is_banned) {
        alert('Your account has been suspended.');
        await supabase.auth.signOut();
        return;
      }
      setUserProfile(profileData);
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await fetchProfile(session);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      await fetchProfile(session);
      setLoading(false);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Expose a function to allow child components to reset the recovery state
  const onPasswordUpdated = () => setIsPasswordRecovery(false);

  const value = { session, userProfile, loading, fetchProfile, isPasswordRecovery, onPasswordUpdated };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);