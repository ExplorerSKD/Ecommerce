import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string; data?: { user: User } }>;
    register: (data: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    }) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing auth on mount
        const storedUser = authApi.getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
            // Verify token is still valid
            authApi.getUser().then((result) => {
                if (result.success && result.data) {
                    setUser(result.data);
                    localStorage.setItem('user', JSON.stringify(result.data));
                } else {
                    // Token invalid, clear auth
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const result = await authApi.login(email, password);
        if (result.success && result.data) {
            setUser(result.data.user);
            return { success: true, data: result.data };
        }
        return { success: false, message: result.message };
    };

    const register = async (data: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    }) => {
        const result = await authApi.register(data);
        if (result.success && result.data) {
            setUser(result.data.user);
            return { success: true };
        }
        return { success: false, message: result.message };
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
