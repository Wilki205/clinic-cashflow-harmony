import { GoogleLogin } from '@react-oauth/google';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

export default function Login() {
  const onSuccess = (response: any) => {
    // Salvamos a sessão para que o ProtectedRoute permita a entrada
    localStorage.setItem("@odonto:user", JSON.stringify(response));
    
    // Agora o redirecionamento vai funcionar pois a barreira de segurança será aberta
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-none">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-slate-800">DentalCare Management</CardTitle>
          <CardDescription className="font-medium">
            Acesse o painel administrativo da clínica
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 py-8">
          {/* Botão oficial do Google configurado com o seu Client ID */}
          <GoogleLogin 
            onSuccess={onSuccess} 
            onError={() => console.log('Erro na autenticação com o Google')}
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="pill"
          />
         <p className="text-[10px] text-slate-400 uppercase tracking-widest pt-2">
  Sistema Restrito • Recife - PE
</p>
        </CardContent>
      </Card>
    </div>
  );
}