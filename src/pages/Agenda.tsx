import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, CheckCircle2, CircleDashed, UserX, RefreshCcw, MoreVertical, Trash2, CalendarDays, Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interfaces
interface Appointment {
  id: number;
  paciente_id: number;
  patient_name: string; // Nome vindo do JOIN
  date: string;
  time: string;
  procedure: string;
  status: "confirmed" | "pending" | "absent" | "rescheduled";
  valor?: number;
}

interface PatientSimple {
  id: number;
  nome: string;
}

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientsList, setPatientsList] = useState<PatientSimple[]>([]); // Lista para o Select
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date().toISOString().split('T')[0],
    time: "",
    procedure: "",
    valor: ""
  });

  // --- FUNÇÕES DE API ---

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agendamentos');
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((item: any) => ({
          id: item.id,
          paciente_id: item.paciente_id,
          patient_name: item.paciente_nome || "Paciente Removido",
          date: item.data_agendamento.split('T')[0],
          time: item.horario_agendamento.slice(0, 5),
          procedure: item.procedimento,
          status: item.status,
          valor: item.valor
        }));
        setAppointments(formatted);
      }
    } catch (error) {
      console.error("Erro ao carregar agenda", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsList = async () => {
    try {
      const res = await fetch('/api/pacientes');
      if (res.ok) {
        const data = await res.json();
        setPatientsList(data);
      }
    } catch (error) {
      console.error("Erro ao carregar lista de pacientes", error);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadPatientsList();
  }, []);

  const handleSave = async () => {
    if (!formData.patientId || !formData.date || !formData.time) return;

    try {
      setLoading(true);
      await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: parseInt(formData.patientId),
          data: formData.date,
          horario: formData.time,
          procedimento: formData.procedure,
          valor: parseFloat(formData.valor) || 0
        })
      });
      await loadAppointments();
      closeMainModal();
    } catch (error) {
      alert("Erro ao agendar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedApp) return;
    try {
      await fetch(`/api/agendamentos/${selectedApp.id}`, { method: 'DELETE' });
      await loadAppointments();
      setIsDeleteAlertOpen(false);
      setSelectedApp(null);
    } catch (error) {
      alert("Erro ao excluir");
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
        await fetch(`/api/agendamentos/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        loadAppointments();
    } catch (error) {
        alert("Erro ao atualizar status");
    }
  };

  // --- UI HELPERS ---

  const closeMainModal = () => {
    setIsModalOpen(false);
    setFormData({ patientId: "", date: new Date().toISOString().split('T')[0], time: "", procedure: "", valor: "" });
  };

  const openDeleteAlert = (app: Appointment) => {
    setSelectedApp(app);
    setIsDeleteAlertOpen(true);
  };

  const getStatusConfig = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return { color: 'bg-emerald-500', text: 'Atendido', icon: <CheckCircle2 className="h-3.5 w-3.5" />, style: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'absent': return { color: 'bg-rose-500', text: 'Faltou', icon: <UserX className="h-3.5 w-3.5" />, style: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'rescheduled': return { color: 'bg-blue-500', text: 'Remarcado', icon: <RefreshCcw className="h-3.5 w-3.5" />, style: 'bg-blue-50 text-blue-700 border-blue-100' };
      default: return { color: 'bg-amber-400', text: 'Pendente', icon: <CircleDashed className="h-3.5 w-3.5 animate-pulse" />, style: 'bg-amber-50 text-amber-700 border-amber-100' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Agenda Clínica {loading && <Loader2 className="h-5 w-5 animate-spin text-primary"/>}
          </h1>
          <p className="text-muted-foreground font-medium">Gestão de horários e compromissos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> Novo Agendamento
        </Button>
      </div>

      <div className="grid gap-3">
        {appointments.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50/50 p-10 text-center">
            <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 font-medium">{loading ? "Carregando agenda..." : "Nenhum agendamento para mostrar."}</p>
          </Card>
        ) : (
          appointments.map(app => {
            const config = getStatusConfig(app.status);
            return (
              <Card key={app.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
                <div className="flex">
                  <div className={`w-1.5 ${config.color}`} />
                  <CardContent className="flex-1 p-5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center justify-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 min-w-[110px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {new Date(app.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-lg font-black text-slate-700 leading-none mt-1">{app.time}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">{app.patient_name}</p>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase tracking-wider">{app.procedure}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${config.style}`}>{config.icon} {config.text}</div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => updateStatus(app.id, 'confirmed')} className="text-emerald-600 cursor-pointer font-medium">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar Atendimento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(app.id, 'absent')} className="text-rose-600 cursor-pointer font-medium">
                            <UserX className="mr-2 h-4 w-4" /> Registrar Falta
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteAlert(app)} className="text-rose-600 cursor-pointer border-t mt-1 font-bold">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Horário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL PRINCIPAL: NOVO AGENDAMENTO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle className="text-xl font-bold">Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid gap-2">
              <Label>Paciente</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.patientId}
                onChange={e => setFormData({...formData, patientId: e.target.value})}
              >
                <option value="">Selecione um paciente...</option>
                {patientsList.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Horário</Label>
                <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Procedimento</Label>
              <Input placeholder="Ex: Avaliação, Limpeza..." value={formData.procedure} onChange={e => setFormData({...formData, procedure: e.target.value})} />
            </div>

             <div className="grid gap-2">
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" placeholder="0,00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
            </div>

          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Salvando..." : "Agendar Paciente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: EXCLUSÃO */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <div className="p-3 bg-rose-50 rounded-full"><Trash2 className="h-6 w-6" /></div>
              <AlertDialogTitle className="text-xl font-bold text-slate-800">Apagar Agendamento?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 text-base">
              Tem certeza que deseja remover o horário de <strong>{selectedApp?.patient_name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="border-slate-200 text-slate-500 hover:bg-slate-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white px-8">Sim, Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}