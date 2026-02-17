"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!supabase) {
            // If supabase is not configured (e.g. missing env vars), just finish loading
            setLoading(false);
            return;
        }

        const setData = async () => {
            const {
                data: { session },
                error,
            } = await supabase!.auth.getSession();
            if (error) throw error;
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        };

        const { data: listener } = supabase!.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        setData();

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    // Protect routes
    useEffect(() => {
        if (!loading && !user && pathname !== "/login" && supabase) {
            router.push("/login");
        }
        // Redirect to home if logged in and on login page
        if (!loading && user && pathname === "/login") {
            router.push("/");
        }
    }, [user, loading, pathname, router]);

    const signOut = async () => {
        if (supabase) {
            await supabase!.auth.signOut();
            router.push("/login");
        }
    };

    const value = {
        session,
        user,
        loading,
        signOut,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
