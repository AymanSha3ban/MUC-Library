import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type UserRole = 'student' | 'admin' | null;

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    profilePath: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [profilePath, setProfilePath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.email);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.email);
            } else {
                setRole(null);
                setProfilePath(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (email: string | undefined) => {
        if (!email) {
            setRole(null);
            setProfilePath(null);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('role, profile_path')
                .ilike('email', email)
                .maybeSingle();

            if (error || !data) {
                console.error('Error fetching user profile:', error);
                setRole('student'); // Default fallback
                setProfilePath(null);
            } else {
                setRole(data.role as UserRole);
                setProfilePath(data.profile_path);
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setRole('student');
            setProfilePath(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user?.email) {
            await fetchUserProfile(user.email);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setProfilePath(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, role, profilePath, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
