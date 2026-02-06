export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
}

 export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    error: string | null;
}