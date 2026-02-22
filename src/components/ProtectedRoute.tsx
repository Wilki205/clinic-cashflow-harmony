import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Verifica se existe um usuário logado no storage
  // Quando o login com Google funcionar, você salvará os dados lá
  const isAuthenticated = !!localStorage.getItem("@odonto:user");

  if (!isAuthenticated) {
    // Se não estiver logado, manda para a tela de login
    return <Navigate to="/login" replace />;
  }

  return children;
};