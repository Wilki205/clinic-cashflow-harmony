import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background text-center px-4">
      {/* Ícone ilustrativo com as cores do sistema */}
      <div className="mb-6 rounded-full bg-primary/10 p-6 text-primary">
        <FileQuestion className="h-16 w-16" />
      </div>

      <h1 className="mb-2 text-6xl font-black text-slate-800 tracking-tighter">404</h1>
      <h2 className="mb-4 text-2xl font-bold text-slate-700">Página não encontrada</h2>
      
      <p className="mb-8 max-w-md text-muted-foreground">
        Desculpe, a página que você está procurando não existe ou foi movida. 
        Verifique o endereço ou retorne ao painel principal.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="default" className="gap-2 shadow-md">
          <Link to="/">
            <Home className="h-4 w-4" />
            Ir para o Dashboard
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="gap-2">
          <button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </Button>
      </div>

      <div className="mt-12 text-xs text-slate-400 font-medium uppercase tracking-widest">
        DentalCare Management System
      </div>
    </div>
  );
};

export default NotFound;