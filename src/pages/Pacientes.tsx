import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus, Search, UserCircle, Phone, Mail, FileText, 
  Activity, UploadCloud, FileCheck, X, Edit2, Trash2, AlertTriangle 
} from "lucide-react";

// 1. DEFINIÇÃO DOS TIPOS (Isso resolve os erros da sua imagem de 'Problems')
interface Attachment {
  name: string;
  date: string;
}

interface Patient {
  id: number;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  allergies: string;
  attachments: Attachment[];
  lastVisit: string;
}

export default function Pacientes() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados para o Alerta de Exclusão Profissional
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    allergies: "",
    attachments: [] as Attachment[]
  });

  useEffect(() => {
    const saved = localStorage.getItem("@odonto:patients");
    if (saved) setPatients(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    if (!formData.name) return;

    let updated: Patient[];

    if (editingId) {
      updated = patients.map(p => 
        p.id === editingId ? { ...p, ...formData } : p
      );
    } else {
      const newPatient: Patient = {
        id: Date.now(),
        ...formData,
        lastVisit: new Date().toLocaleDateString('pt-BR')
      };
      updated = [newPatient, ...patients];
    }

    setPatients(updated);
    localStorage.setItem("@odonto:patients", JSON.stringify(updated));
    closeModal();
  };

  // Abre o modal de confirmação em vez do prompt do navegador
  const openDeleteConfirmation = (id: number) => {
    setIdToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (idToDelete) {
      const updated = patients.filter(p => p.id !== idToDelete);
      setPatients(updated);
      localStorage.setItem("@odonto:patients", JSON.stringify(updated));
      setIsDeleteAlertOpen(false);
      setIdToDelete(null);
    }
  };

  const openEditModal = (patient: Patient) => {
    setEditingId(patient.id);
    setFormData({
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      cpf: patient.cpf,
      allergies: patient.allergies,
      attachments: patient.attachments || []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", email: "", cpf: "", allergies: "", attachments: [] });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, { name: file.name, date: new Date().toLocaleDateString('pt-BR') }]
      }));
    }
    if (event.target) event.target.value = "";
  };

  const filteredPatients = (patients || []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-muted-foreground font-medium">Gestão de prontuários</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Paciente
        </Button>

        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Ficha Clínica" : "Nova Ficha Clínica"}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="pessoal">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                <TabsTrigger value="clinico">Saúde</TabsTrigger>
                <TabsTrigger value="docs">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pessoal" className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome Completo</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>E-mail</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Telefone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                </div>
                <div className="grid gap-2"><Label>CPF</Label><Input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} /></div>
              </TabsContent>

              <TabsContent value="clinico" className="py-4 space-y-4">
                <div className="grid gap-2">
                  <Label className="text-rose-600 flex items-center gap-2 font-bold"><Activity className="h-4 w-4"/> Alergias</Label>
                  <Input value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} placeholder="Ex: Penicilina, Látex..." />
                </div>
              </TabsContent>

              <TabsContent value="docs" className="py-4 space-y-4">
                <div className="border-2 border-dashed rounded-xl p-8 text-center bg-slate-50/50">
                  <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Escolher Arquivo</Button>
                </div>
                <div className="space-y-2">
                  {formData.attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <X className="h-4 w-4 text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => setFormData({...formData, attachments: formData.attachments.filter((_, idx) => idx !== i)})} />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
              <Button onClick={handleSave}>{editingId ? "Atualizar Dados" : "Salvar Registro"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar por nome ou CPF..." className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3">
            {filteredPatients.map(patient => {
              const hasPendingDocs = !patient.attachments || patient.attachments.length === 0;
              
              return (
                <div key={patient.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <UserCircle className="h-10 w-10 text-slate-300" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{patient.name}</p>
                        {hasPendingDocs && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-amber-100">
                            <AlertTriangle className="h-3 w-3" /> Pendência Doc
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-300"/> {patient.email}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-300"/> {patient.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(patient)}>
                      <Edit2 className="h-4 w-4 text-slate-400 hover:text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteConfirmation(patient.id)}>
                      <Trash2 className="h-4 w-4 text-rose-400 hover:text-rose-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE EXCLUSÃO PROFISSIONAL (Substitui o prompt da imagem) */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <div className="p-2 bg-rose-50 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <AlertDialogTitle className="text-xl">Confirmar Exclusão</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 text-base">
              Você tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita e todos os anexos e registros clínicos serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 text-slate-500">Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-rose-600 hover:bg-rose-700 text-white px-6"
            >
              Sim, Excluir Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}