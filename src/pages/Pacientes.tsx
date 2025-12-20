import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Certifique-se de ter o componente Label
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Plus, Search, UserCircle, Phone } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  phone: string;
  lastVisit: string;
}

export default function Pacientes() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para o formulário
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("@odonto:patients");
    if (saved) setPatients(JSON.parse(saved));
  }, []);

  const handleSavePatient = () => {
    if (!newName || !newPhone) return;

    const newPatient: Patient = {
      id: Date.now(),
      name: newName,
      phone: newPhone,
      lastVisit: "Pendente"
    };

    const updated = [newPatient, ...patients];
    setPatients(updated);
    localStorage.setItem("@odonto:patients", JSON.stringify(updated));
    
    // Limpa e fecha
    setNewName("");
    setNewPhone("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-muted-foreground">Base de dados clínica</p>
        </div>

        {/* --- NOVO MODAL AQUI --- */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Ex: Maria Oliveira" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input 
                  id="phone" 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  placeholder="(11) 99999-9999" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSavePatient}>Salvar Paciente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ... Restante do código da lista (Busca e Map) ... */}
      <Card className="shadow-sm border-none bg-white">
        <CardHeader className="border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-4">
                  <UserCircle className="h-10 w-10 text-slate-300" />
                  <div>
                    <p className="font-bold text-slate-700">{patient.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {patient.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Última visita</p>
                  <p className="text-sm font-semibold text-slate-600">{patient.lastVisit}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}