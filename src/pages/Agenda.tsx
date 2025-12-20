import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle2, CircleDashed } from "lucide-react";

interface Appointment {
  id: number;
  patient: string;
  time: string;
  procedure: string;
  status: "confirmed" | "pending";
}

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    patient: "",
    time: "",
    procedure: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("@odonto:appointments");
    if (saved) {
      setAppointments(JSON.parse(saved));
    } else {
      const initial: Appointment[] = [
        { id: 1, time: "09:00", patient: "Maria Silva", procedure: "Limpeza", status: "confirmed" },
        { id: 2, time: "10:30", patient: "João Santos", procedure: "Restauração", status: "confirmed" },
      ];
      setAppointments(initial);
      localStorage.setItem("@odonto:appointments", JSON.stringify(initial));
    }
  }, []);

  const handleSave = () => {
    if (!formData.patient || !formData.time) return;

    const newAppointment: Appointment = {
      id: Date.now(),
      patient: formData.patient,
      time: formData.time,
      procedure: formData.procedure || "Consulta",
      status: "pending"
    };

    const updated = [...appointments, newAppointment].sort((a, b) => a.time.localeCompare(b.time));
    setAppointments(updated);
    localStorage.setItem("@odonto:appointments", JSON.stringify(updated));
    
    setFormData({ patient: "", time: "", procedure: "" });
    setIsModalOpen(false);
  };

  const toggleStatus = (id: number) => {
    const updated = appointments.map(app => 
      app.id === id ? { ...app, status: app.status === "confirmed" ? "pending" : "confirmed" } : app
    );
    setAppointments(updated as Appointment[]);
    localStorage.setItem("@odonto:appointments", JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Agenda de Hoje</h1>
          <p className="text-muted-foreground font-medium">Controle de horários e procedimentos</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="patient">Nome do Paciente</Label>
                <Input 
                  id="patient"
                  placeholder="Ex: Roberto Carlos" 
                  value={formData.patient}
                  onChange={e => setFormData({...formData, patient: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input 
                    id="time"
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="proc">Procedimento</Label>
                  <Input 
                    id="proc"
                    placeholder="Ex: Avaliação" 
                    value={formData.procedure}
                    onChange={e => setFormData({...formData, procedure: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo Rápidos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg text-primary"><CalendarIcon className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{appointments.length}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{appointments.filter(a => a.status === 'confirmed').length}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Confirmados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {appointments.find(a => a.status === 'pending')?.time || "--:--"}
              </p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Próxima Pendência</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Agendamentos */}
      <div className="grid gap-3">
        {appointments.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-medium italic">Nenhum agendamento para exibir.</p>
          </div>
        )}
        {appointments.map(app => (
          <Card key={app.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="flex">
              <div className={`w-1.5 ${app.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <CardContent className="flex-1 p-5 flex items-center justify-between bg-white">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                    <span className="text-lg font-black text-slate-700 leading-none">{app.time}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">{app.patient}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">
                        {app.procedure}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleStatus(app.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    app.status === 'confirmed' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {app.status === 'confirmed' ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Confirmado</>
                  ) : (
                    <><CircleDashed className="h-3.5 w-3.5 animate-pulse" /> Pendente</>
                  )}
                </button>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}