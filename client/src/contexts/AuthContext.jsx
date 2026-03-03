import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle password recovery UI state. This event fires when the user lands on the page from a reset link.
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setSession(session);
        setLoading(false);
        return;
      }

      // On any other event, we assume it's not a password recovery flow.
      setIsPasswordRecovery(false);

      // If there's no session, we are logged out. This is a stable state.
      if (!session) {
        setSession(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // If a session exists (from SIGNED_IN or INITIAL_SESSION), we must verify it.
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (!response.ok) {
          await supabase.auth.signOut();
          return; // Wait for the 'SIGNED_OUT' event to set loading=false.
        }

        const profileData = await response.json();

        if (!profileData || !profileData.id || profileData.is_banned) {
          if (profileData.is_banned) alert('Your account has been suspended.');
          await supabase.auth.signOut();
          return; // Wait for the 'SIGNED_OUT' event.
        }

        // Session and profile are valid. This is a stable, logged-in state.
        setSession(session);
        setUserProfile(profileData);
        setLoading(false);
      } catch (e) {
        console.error("Error during profile fetch, signing out:", e);
        await supabase.auth.signOut();
        // Wait for the 'SIGNED_OUT' event.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        await supabase.auth.signOut();
        return;
      }

      const profileData = await response.json();

      if (!profileData || !profileData.id || profileData.is_banned) {
        if (profileData.is_banned) alert('Your account has been suspended.');
        await supabase.auth.signOut();
        return;
      }

      setUserProfile(profileData);
    } catch (e) {
      console.error("Error during profile fetch, signing out:", e);
      await supabase.auth.signOut();
    }
  }, [session]);

  // Expose a function to allow child components to reset the recovery state
  const onPasswordUpdated = () => setIsPasswordRecovery(false);

  const value = { session, userProfile, loading, isPasswordRecovery, onPasswordUpdated, fetchProfile };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);