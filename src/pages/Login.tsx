import { GoogleLogin } from "@react-oauth/google";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

export default function Login() {
  const onSuccess = async (response: any) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Falha na autenticação");
      }

      localStorage.setItem("@odonto:token", data.token);
      localStorage.setItem("@odonto:user", JSON.stringify(data.user));

      window.location.href = "/";
    } catch (err: any) {
      console.error("Erro no login:", err);
      alert(err.message || "Erro ao fazer login.");
    }
  };

  const onError = () => {
    console.error("Erro na autenticação com o Google");
    alert("Erro na autenticação com o Google.");
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

          <CardTitle className="text-2xl font-black text-slate-800">
            DentalCare Management
          </CardTitle>

          <CardDescription className="font-medium">
            Acesse o painel administrativo da clínica
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6 py-8">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
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