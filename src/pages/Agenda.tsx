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
  Plus, 
  CheckCircle2, 
  CircleDashed, 
  UserX, 
  RefreshCcw,
  MoreVertical,
  Trash2,
  CalendarDays
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Appointment {
  id: number;
  patient: string;
  date: string;
  time: string;
  procedure: string;
  status: "confirmed" | "pending" | "absent" | "rescheduled";
}

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  
  const [formData, setFormData] = useState({
    patient: "",
    date: new Date().toISOString().split('T')[0],
    time: "",
    procedure: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("@odonto:appointments");
    if (saved) setAppointments(JSON.parse(saved));
  }, []);

  const saveAndRefresh = (list: Appointment[]) => {
    setAppointments(list);
    localStorage.setItem("@odonto:appointments", JSON.stringify(list));
  };

  const handleSave = () => {
    if (!formData.patient || !formData.date || !formData.time) return;
    const newAppointment: Appointment = { id: Date.now(), ...formData, status: "pending" };
    const updated = [...appointments, newAppointment].sort((a, b) => 
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
    saveAndRefresh(updated);
    closeMainModal();
  };

  const handleReschedule = () => {
    if (!selectedApp) return;
    const updated = appointments.map(app => 
      app.id === selectedApp.id ? { ...app, date: formData.date, time: formData.time, status: "rescheduled" as const } : app
    ).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    saveAndRefresh(updated);
    setIsRescheduleModalOpen(false);
    setSelectedApp(null);
  };

  const handleDelete = () => {
    if (!selectedApp) return;
    const updated = appointments.filter(app => app.id !== selectedApp.id);
    saveAndRefresh(updated);
    setIsDeleteAlertOpen(false);
    setSelectedApp(null);
  };

  const updateStatus = (id: number, newStatus: Appointment['status']) => {
    const updated = appointments.map(app => app.id === id ? { ...app, status: newStatus } : app);
    saveAndRefresh(updated);
  };

  const openReschedule = (app: Appointment) => {
    setSelectedApp(app);
    setFormData({ patient: app.patient, date: app.date, time: app.time, procedure: app.procedure });
    setIsRescheduleModalOpen(true);
  };

  const openDeleteAlert = (app: Appointment) => {
    setSelectedApp(app);
    setIsDeleteAlertOpen(true);
  };

  const closeMainModal = () => {
    setIsModalOpen(false);
    setFormData({ patient: "", date: new Date().toISOString().split('T')[0], time: "", procedure: "" });
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
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Agenda Clínica</h1>
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
            <p className="text-slate-400 font-medium">Nenhum agendamento para mostrar.</p>
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
                            {new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-lg font-black text-slate-700 leading-none mt-1">{app.time}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">{app.patient}</p>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase tracking-wider">{app.procedure}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${config.style}`}>{config.icon} {config.text}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => updateStatus(app.id, 'confirmed')} className="text-emerald-600 cursor-pointer font-medium"><CheckCircle2 className="mr-2 h-4 w-4" /> Marcar Atendimento</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openReschedule(app)} className="text-blue-600 cursor-pointer font-bold"><RefreshCcw className="mr-2 h-4 w-4" /> Remarcar / Alterar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(app.id, 'absent')} className="text-rose-600 cursor-pointer font-medium"><UserX className="mr-2 h-4 w-4" /> Registrar Falta</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteAlert(app)} className="text-rose-600 cursor-pointer border-t mt-1 font-bold"><Trash2 className="mr-2 h-4 w-4" /> Excluir Horário</DropdownMenuItem>
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
              <Label>Nome do Paciente</Label>
              <Input placeholder="Nome completo" value={formData.patient} onChange={e => setFormData({...formData, patient: e.target.value})} />
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
              <Input placeholder="Ex: Canal, Extração..." value={formData.procedure} onChange={e => setFormData({...formData, procedure: e.target.value})} />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">Agendar Paciente</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REMARCAÇÃO */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-blue-100 shadow-2xl">
          <DialogHeader className="flex flex-row items-center gap-3 space-y-0 text-blue-600">
            <RefreshCcw className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold">Remarcar Paciente</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Paciente</p>
              <p className="text-lg font-bold text-slate-700">{selectedApp?.patient}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-bold">Nova Data</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold">Novo Horário</Label>
                <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRescheduleModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleReschedule} className="bg-blue-600 hover:bg-blue-700">Confirmar Alteração</Button>
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
              Tem certeza que deseja remover o horário de <strong>{selectedApp?.patient}</strong>? Esta ação não pode ser desfeita.
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