import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText,
  Menu,
  X,
  LogOut,
  UserCircle // Ícone de fallback caso não tenha foto
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useUser } from "../contexts/UserContext"; // Importando o hook do contexto

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Pacientes", href: "/pacientes", icon: Users },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Pegamos o usuário e a função de logout do contexto
  const { user } = useUser();

  const handleLogout = () => {
    localStorage.removeItem("@odonto:user");
    localStorage.removeItem("@odonto:user-data");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">DentalCare</h1>
            <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Seção de Perfil Editável */}
          {user && (
            <Link 
              to="/perfil" 
              className="p-6 border-b border-sidebar-border flex items-center gap-3 hover:bg-sidebar-accent/50 transition-colors group"
            >
              <div className="relative">
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="h-10 w-10 rounded-full border-2 border-primary/20 object-cover"
                    onError={(e) => {
                      // Caso a imagem do Google falhe, usamos um fallback
                      (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + user.name;
                    }}
                  />
                ) : (
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-sidebar rounded-full" />
              </div>
              
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate text-sidebar-foreground group-hover:text-primary transition-colors">
                  {user.name}
                </span>
                {/* Exibe o CRO se estiver cadastrado, senão mostra o email */}
                {user.cro ? (
                  <span className="text-[10px] font-bold text-blue-500 uppercase">CRO: {user.cro}</span>
                ) : (
                  <span className="text-[10px] text-sidebar-foreground/60 truncate">{user.email}</span>
                )}
              </div>
            </Link>
          )}

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              Sair do Sistema
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 shadow-sm lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground hidden md:block italic">
              Recife - PE
            </p>
            {user && (
              <Link to="/perfil">
                <img src={user.picture} className="h-8 w-8 rounded-full border shadow-sm hover:ring-2 ring-primary/20 transition-all" alt="Perfil" />
              </Link>
            )}
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}