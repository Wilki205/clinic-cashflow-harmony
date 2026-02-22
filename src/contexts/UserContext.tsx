import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from "jwt-decode";

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  cro?: string;
}

interface UserContextType {
  user: GoogleUser | null;
  loading: boolean; // Adicionado para evitar a tela branca
  updateUser: (data: Partial<GoogleUser>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true); // Começa carregando

  useEffect(() => {
    const storageData = localStorage.getItem("@odonto:user-data");
    const loginData = localStorage.getItem("@odonto:user");

    if (storageData) {
      setUser(JSON.parse(storageData));
    } else if (loginData) {
      try {
        const authData = JSON.parse(loginData);
        const decoded: any = jwtDecode(authData.credential);
        const initialUser = { 
          name: decoded.name, 
          email: decoded.email, 
          picture: decoded.picture 
        };
        setUser(initialUser);
        localStorage.setItem("@odonto:user-data", JSON.stringify(initialUser));
      } catch (error) {
        console.error("Erro ao decodificar token do Google:", error);
      }
    }
    
    // Finaliza o carregamento independente de ter achado o user ou não
    setLoading(false); 
  }, []);

  const updateUser = (data: Partial<GoogleUser>) => {
    setUser((prevUser) => {
      const newUser = prevUser ? { ...prevUser, ...data } : (data as GoogleUser);
      localStorage.setItem("@odonto:user-data", JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser }}>
      {/* Se estiver carregando, mostramos um fundo neutro em vez de renderizar os filhos.
          Isso evita que o 'ProtectedRoute' expulse o usuário antes da hora.
      */}
      {!loading ? (
        children
      ) : (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve ser usado dentro de um UserProvider");
  }
  return context;
};