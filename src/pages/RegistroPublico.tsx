import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Stethoscope, Loader2 } from "lucide-react";

export default function RegistroPublico() {
  const { id } = useParams(); // ID da clínica vindo da URL
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado dos campos do formulário
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    alergias: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Envia os dados para o seu servidor Node.js
      const response = await fetch('http://localhost:3000/api/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Mapeamos os campos do formulário para o que o seu server.js espera
        body: JSON.stringify({
          name: formData.nome,
          cpf: formData.cpf,
          phone: formData.telefone,
          email: "", // Paciente não preenche no formulário público
          attachments: [] // Começa sem documentos, gerando alerta no Dashboard
        }),
      });

      if (response.ok) {
        setEnviado(true);
      } else {
        alert("Erro ao enviar cadastro. Tente novamente mais tarde.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Não foi possível conectar ao servidor da clínica.");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <Card className="max-w-md w-full text-center py-10 border-none shadow-xl">
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                <CheckCircle2 className="h-12 w-12" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Tudo pronto!</h2>
            <p className="text-slate-500">
              Seus dados foram enviados para a clínica. Agora é só aguardar ser chamado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex items-center justify-center font-sans">
      <Card className="max-w-lg w-full shadow-2xl border-none">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-slate-800">Cadastro de Paciente</CardTitle>
          <CardDescription className="font-medium">
            Agilize seu atendimento na unidade: <span className="text-blue-600 font-bold uppercase">{id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input 
                placeholder="Digite seu nome" 
                required 
                className="h-12 border-slate-200 focus:border-blue-500" 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input 
                  placeholder="000.000.000-00" 
                  required 
                  className="h-12 border-slate-200" 
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input 
                  placeholder="(00) 00000-0000" 
                  required 
                  className="h-12 border-slate-200" 
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-rose-500 font-bold">Alergias ou Observações</Label>
              <Textarea 
                placeholder="Informe se tem alergias ou alguma condição médica relevante." 
                className="min-h-[100px] border-slate-200" 
                value={formData.alergias}
                onChange={(e) => setFormData({...formData, alergias: e.target.value})}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Enviar Registro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}