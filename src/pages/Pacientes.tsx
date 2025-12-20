import { useState, useEffect, useRef } from "react"; // Adicionado useRef
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
  Plus, 
  Search, 
  UserCircle, 
  Phone, 
  Mail, 
  FileText, 
  Activity, 
  UploadCloud, 
  FileCheck, 
  X 
} from "lucide-react";

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
  
  // Referência para o input de arquivo escondido
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
    const newPatient: Patient = {
      id: Date.now(),
      ...formData,
      lastVisit: new Date().toLocaleDateString('pt-BR')
    };
    const updated = [newPatient, ...patients];
    setPatients(updated);
    localStorage.setItem("@odonto:patients", JSON.stringify(updated));
    setIsModalOpen(false);
    setFormData({ name: "", phone: "", email: "", cpf: "", allergies: "", attachments: [] });
  };

  // Função disparada quando o usuário seleciona um arquivo no Windows/Mac
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        attachments: [
          ...formData.attachments, 
          { name: file.name, date: new Date().toLocaleDateString('pt-BR') }
        ]
      });
    }
    // Limpa o input para poder selecionar o mesmo arquivo novamente se quiser
    if (event.target) event.target.value = "";
  };

  const filteredPatients = (patients || []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Pacientes</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Paciente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Ficha Clínica e Documentos</DialogTitle></DialogHeader>
            <Tabs defaultValue="pessoal">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                <TabsTrigger value="clinico">Saúde</TabsTrigger>
                <TabsTrigger value="docs">Anexos</TabsTrigger>
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

              <TabsContent value="clinico" className="py-4">
                <div className="grid gap-2">
                  <Label className="text-rose-600 flex items-center gap-2"><Activity className="h-4 w-4"/> Alergias</Label>
                  <Input placeholder="Ex: Penicilina..." value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
                </div>
              </TabsContent>

              <TabsContent value="docs" className="py-4 space-y-4">
                <div className="border-2 border-dashed rounded-xl p-8 text-center bg-slate-50/50">
                  <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-600 mb-4">Escolha os termos assinados (PDF ou Imagem)</p>
                  
                  {/* Input real escondido */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />

                  {/* Botão que "clica" no input escondido */}
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Selecionar Arquivo
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm transition-all animate-in fade-in slide-in-from-bottom-1">
                      <div className="flex items-center gap-3 text-slate-700">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-bold leading-none">{file.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Selecionado em {file.date}</p>
                        </div>
                      </div>
                      <X 
                        className="h-4 w-4 text-slate-400 cursor-pointer hover:text-rose-500 transition-colors" 
                        onClick={() => setFormData({...formData, attachments: formData.attachments.filter((_, idx) => idx !== i)})} 
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="border-t pt-4">
              <Button onClick={handleSave} className="w-full">Salvar Paciente com Documentos</Button>
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
        <CardContent className="space-y-3">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-all group">
              <div className="flex items-center gap-4">
                <UserCircle className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
                <div>
                  <p className="font-bold text-slate-800">{patient.name}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3"/> {patient.email}</span>
                    <span className="flex items-center gap-1.5"><FileText className="h-3 w-3"/> {patient.cpf}</span>
                    {patient.attachments?.length > 0 && (
                      <span className="text-primary font-bold flex items-center gap-1">
                        <FileCheck className="h-3 w-3"/> {patient.attachments.length} documento(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}