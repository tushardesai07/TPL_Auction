import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole, Team } from '../types';
import { INITIAL_TEAMS } from '../lib/mockData';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  managedTeam: Team | null;
  role: UserRole;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signUp: (email: string, pass: string, fullName: string, role?: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole, teamId?: string) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>({
    id: 'demo-admin-id',
    full_name: 'Tournament Director (Chief Auctioneer)',
    phone: '+91 98765 43210',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [managedTeam, setManagedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  const getFallbackProfile = (targetRole: UserRole = 'admin'): Profile => {
    let name = 'Tournament Director (Chief Admin)';
    let avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80';
    if (targetRole === 'auctioneer') {
      name = 'Official Auctioneer';
      avatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80';
    } else if (targetRole === 'viewer') {
      name = 'Spectator (Guest)';
      avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
    }
    return {
      id: `demo-${targetRole}-id`,
      full_name: name,
      phone: '+91 98765 43210',
      avatar_url: avatar,
      role: targetRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  useEffect(() => {
    const savedRole = (localStorage.getItem('tpl_active_role') as UserRole) || 'admin';

    if (!isSupabaseConfigured) {
      setProfile(getFallbackProfile(savedRole));
      setIsLoading(false);
      return;
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setProfile(getFallbackProfile(savedRole));
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        const currentRole = (localStorage.getItem('tpl_active_role') as UserRole) || 'admin';
        setUser(null);
        setProfile(getFallbackProfile(currentRole));
        setManagedTeam(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
        if (data.role === 'manager') {
          fetchManagedTeam(userId);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagedTeam = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_user_id', userId)
        .maybeSingle();

      if (data) {
        setManagedTeam(data as Team);
      }
    } catch {}
  };

  const signIn = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase credentials not configured yet. Using Demo Personas.' };
    }
    const res = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error: res.error };
  };

  const signUp = async (email: string, pass: string, fullName: string, role: UserRole = 'viewer') => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase credentials not configured yet.' };
    }
    const res = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: fullName, role },
      },
    });
    return { error: res.error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setManagedTeam(null);
  };

  const switchDemoRole = (newRole: UserRole, teamId?: string) => {
    localStorage.setItem('tpl_active_role', newRole);
    setIsDemoMode(true);
    let name = 'Public Spectator';
    let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
    let team: Team | null = null;

    if (newRole === 'admin') {
      name = 'Tournament Director (Chief Admin)';
      avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80';
      team = null;
    } else if (newRole === 'auctioneer') {
      name = 'Official Auctioneer';
      avatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80';
      team = null;
    } else if (newRole === 'manager') {
      const selected = INITIAL_TEAMS.find(t => t.id === teamId) || INITIAL_TEAMS[0];
      name = selected ? `${selected.owner_name} (${selected.short_name} Manager)` : 'Franchise Team Manager';
      avatar = selected?.logo_url || avatar;
      team = selected || null;
    }

    setProfile({
      id: `demo-${newRole}-${teamId || 'user'}`,
      full_name: name,
      phone: '+91 99999 00000',
      avatar_url: avatar,
      role: newRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    setManagedTeam(team);
    setUser({ id: `demo-${newRole}` });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        managedTeam,
        role: profile?.role || 'viewer',
        isLoading,
        signIn,
        signUp,
        signOut,
        switchDemoRole,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
