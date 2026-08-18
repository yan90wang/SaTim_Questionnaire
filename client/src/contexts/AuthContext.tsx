import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

import { getUserById } from "../services/UserService.tsx";

interface AuthContextType {
    userId: string | null;
    token: string | null;
    isLoggedIn: boolean;
    loading: boolean;

    login: (userId: string, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children,}: { children: ReactNode; }) => {
    const [userId, setUserId] = useState<string | null>(null);

    const [token, setToken] = useState<string | null>(
        localStorage.getItem("token")
    );

    const [loading, setLoading] = useState(true);
    const isLoggedIn = !!token && !!userId;

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedToken = localStorage.getItem("token");
                const storedUserId =
                    localStorage.getItem("userId");

                if (storedToken && storedUserId) {
                    const fetchedUser = await getUserById(
                        storedUserId
                    );
                    setUserId(String(fetchedUser.id));
                    setToken(storedToken);
                }
            } catch (err) {
                console.error("Auth restore failed:", err);
                logout();
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = (userId: string, token: string) => {
        setUserId(userId);
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
    };

    const logout = () => {
        setUserId(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
    };

    return (
        <AuthContext.Provider
            value={{
                userId,
                token,
                isLoggedIn,
                loading,
                login,
                logout,
            }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error(
            "useAuth must be used within AuthProvider"
        );
    }

    return ctx;
};