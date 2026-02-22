import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function Perfil() {
  const { user, updateUser } = useUser();
  const [cro, setCro] = useState(user?.cro || ""); // Estado local para o campo CRO

  if (!user) return null;

  const handleSave = () => {
    if (cro.trim() === "") {
      toast.error("Por favor, insira o seu CRO.");
      return;
    }
    updateUser({ cro }); // Chama a função do contexto para atualizar
    toast.success("Perfil atualizado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as suas informações pessoais e profissionais.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Estes dados são fornecidos pela sua conta Google.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6 pb-8">
          <Avatar className="h-20 w-20 border-4 border-primary/10">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-medium">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados Profissionais</CardTitle>
          <CardDescription>Adicione informações que aparecerão no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-2">
            <Label htmlFor="cro">Número do CRO</Label>
            <Input
              type="text"
              id="cro"
              placeholder="Ex: PE-12345"
              value={cro}
              onChange={(e) => setCro(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Este número aparecerá na barra lateral do sistema.
            </p>
          </div>
          <Button onClick={handleSave} disabled={cro === user.cro}>
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}