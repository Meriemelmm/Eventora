'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {User,AuthContextType} from '@/types';



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in on load
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (credentials: any) => {
        setLoading(true);
        setError(null);
        try {
            console.log(" data login",credentials);
            const response = await api.post('/auth/login', credentials);
            const { data } = response.data; 

            const userData = data.user || data; 
            const token = data.token;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log("token",token);

            setUser(userData);
            router.push('/test');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (RegisterData: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/register', RegisterData);
             const { data } = response.data; 
             const userData = data.user || data; 
            const token = data.token;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log("token",token);
            
            setUser(userData);

           
            router.push('/test');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                error,
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
