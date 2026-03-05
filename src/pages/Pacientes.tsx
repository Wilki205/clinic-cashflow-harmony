import { useEffect, useRef, useState } from "react";
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
  Search,
  UserCircle,
  Phone,
  Mail,
  Activity,
  UploadCloud,
  FileCheck,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Link as LinkIcon,
  Check,
  Loader2,
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
  attachments: Attachment[];
  lastVisit: string;
}

type YesNo = "sim" | "nao" | "";

type AnamneseData = {
  allergies: string;
  medications: string;
  notes: string;

  hypertension: YesNo;
  diabetes: YesNo;
  heartProblems: YesNo;
  bleeding: YesNo;
  pregnancy: YesNo;
  smoking: YesNo;
  alcohol: YesNo;
  anesthesiaAllergy: YesNo;
  latexAllergy: YesNo;
};

type Anamnese = {
  data: AnamneseData;
  updated_at?: string | null;
};

const emptyAnamneseData: AnamneseData = {
  allergies: "",
  medications: "",
  notes: "",
  hypertension: "",
  diabetes: "",
  heartProblems: "",
  bleeding: "",
  pregnancy: "",
  smoking: "",
  alcohol: "",
  anesthesiaAllergy: "",
  latexAllergy: "",
};

/** Converte UI ("sim"/"nao"/"") -> boolean/null */
const yesNoToBool = (v: YesNo): boolean | null =>
  v === "sim" ? true : v === "nao" ? false : null;

/** Converte boolean/null -> UI ("sim"/"nao"/"") */
const boolToYesNo = (v: any): YesNo =>
  v === true ? "sim" : v === false ? "nao" : "";

/**
 * Mapa UI (ingles) -> DB (PT-BR boolean columns)
 * Ajuste aqui se os nomes no teu banco forem diferentes.
 */
const uiToDbMap: Record<string, string> = {
  hypertension: "hipertensao",
  diabetes: "diabetes",
  heartProblems: "problemas_cardiacos",
  bleeding: "sangramento_facil",
  pregnancy: "gestante",
  smoking: "fumante",
  alcohol: "consome_alcool",
  anesthesiaAllergy: "alergia_anestesia",
  latexAllergy: "alergia_latex",
};

export default function Pacientes() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    attachments: [] as Attachment[],
    anamnese: {
      data: { ...emptyAnamneseData },
      updated_at: null,
    } as Anamnese,
  });

  // =========================
  // LOAD LISTA PACIENTES
  // =========================
  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pacientes");
      if (!res.ok) return;

      const data = await res.json();

      const adaptedPatients: Patient[] = data.map((p: any) => ({
        id: p.id,
        name: p.nome,
        phone: p.telefone,
        email: p.email,
        cpf: p.cpf,
        attachments:
          p.status_doc === "ok"
            ? [{ name: "Documento Armazenado", date: "---" }]
            : [],
        lastVisit: new Date().toLocaleDateString("pt-BR"),
      }));

      setPatients(adaptedPatients);
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // =========================
  // LINK CADASTRO
  // =========================
  const handleCopyLink = () => {
    const clinicId = "clinica-dra-cliente";
    const url = `${window.location.origin}/registrar/${clinicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // =========================
  // ANAMNESE (GET/PUT)
  // =========================

  /**
   * Normaliza a resposta do backend, aceitando:
   * 1) { data: {...}, updated_at }  (jsonb)
   * 2) { allergies, medications, notes, hipertensao, fumante, ... , updated_at } (colunas)
   */
  const normalizeAnamneseFromApi = (a: any): Anamnese => {
    const fromJsonb = (a?.data ?? {}) as Partial<AnamneseData>;

    // Se veio no formato jsonb, prioriza.
    const hasJsonb =
      a &&
      typeof a === "object" &&
      a.data &&
      typeof a.data === "object" &&
      (Object.keys(a.data).length > 0 ||
        "allergies" in a.data ||
        "hypertension" in a.data);

    if (hasJsonb) {
      return {
        data: {
          ...emptyAnamneseData,
          ...fromJsonb,
        },
        updated_at: a?.updated_at ?? null,
      };
    }

    // Senão, tenta montar a partir das colunas
    const next: AnamneseData = {
      ...emptyAnamneseData,
      allergies: a?.allergies ?? "",
      medications: a?.medications ?? "",
      notes: a?.notes ?? "",

      hypertension: boolToYesNo(a?.hipertensao),
      diabetes: boolToYesNo(a?.diabetes),
      heartProblems: boolToYesNo(a?.problemas_cardiacos),
      bleeding: boolToYesNo(a?.sangramento_facil),
      pregnancy: boolToYesNo(a?.gestante),
      smoking: boolToYesNo(a?.fumante),
      alcohol: boolToYesNo(a?.consome_alcool),
      anesthesiaAllergy: boolToYesNo(a?.alergia_anestesia),
      latexAllergy: boolToYesNo(a?.alergia_latex),
    };

    return {
      data: next,
      updated_at: a?.updated_at ?? null,
    };
  };

  const loadAnamnese = async (patientId: number) => {
    try {
      const res = await fetch(`/api/pacientes/${patientId}/anamnese`);
      if (!res.ok) return;

      const a = await res.json();
      const normalized = normalizeAnamneseFromApi(a);

      setFormData((prev) => ({
        ...prev,
        anamnese: {
          data: normalized.data,
          updated_at: normalized.updated_at ?? null,
        },
      }));
    } catch (err) {
      console.error("Erro ao buscar anamnese:", err);
      // mantém empty
    }
  };

  /**
   * Salva em 2 formatos ao mesmo tempo para compatibilidade:
   * - jsonb: { data: {...} }
   * - colunas: { hipertensao: true/false/null, fumante: ..., allergies, medications, notes }
   */
  const saveAnamnese = async (patientId: number) => {
    const d = formData.anamnese.data;

    // payload base (textos)
    const payload: any = {
      // formato jsonb (se teu server usa flags/data)
      data: d,

      // formato colunas (se teu server usa booleans)
      allergies: d.allergies ?? "",
      medications: d.medications ?? "",
      notes: d.notes ?? "",
    };

    // converte e adiciona as colunas PT-BR
    for (const [uiKey, dbKey] of Object.entries(uiToDbMap)) {
      payload[dbKey] = yesNoToBool(d[uiKey as keyof AnamneseData] as YesNo);
    }

    const res = await fetch(`/api/pacientes/${patientId}/anamnese`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Falha ao salvar anamnese");
  };

  // =========================
  // SAVE PACIENTE + ANAMNESE
  // =========================
  const handleSave = async () => {
    if (!formData.name?.trim()) return;

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/pacientes/${editingId}` : "/api/pacientes";

    try {
      setLoading(true);

      // 1) Salvar paciente
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          cpf: formData.cpf,
          attachments: formData.attachments,
        }),
      });

      // tenta ler corpo pra mostrar mensagem melhor se der erro
      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const msg =
          errJson?.error ||
          "Erro ao salvar paciente. Verifique CPF duplicado e o servidor.";
        alert(msg);
        return;
      }

      // 2) Pegar ID (POST/PUT podem retornar {id})
      const json = await response.json().catch(() => null);
      const patientId: number | undefined = editingId ?? json?.id;

      if (!patientId) {
        alert("Paciente salvo, mas não consegui obter o ID para salvar a anamnese.");
        return;
      }

      // 3) Salvar anamnese (agora persiste os marcados)
      await saveAnamnese(patientId);

      // 4) Recarregar e fechar
      await loadPatients();
      closeModal();
    } catch (err) {
      console.error("Erro de conexão:", err);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE
  // =========================
  const openDeleteConfirmation = (id: number) => {
    setIdToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;

    try {
      await fetch(`/api/pacientes/${idToDelete}`, { method: "DELETE" });
      await loadPatients();
    } catch (err) {
      alert("Erro ao excluir registro.");
    } finally {
      setIsDeleteAlertOpen(false);
      setIdToDelete(null);
    }
  };

  // =========================
  // EDIT / CLOSE
  // =========================
  const openEditModal = async (patient: Patient) => {
    setEditingId(patient.id);

    setFormData({
      name: patient.name || "",
      phone: patient.phone || "",
      email: patient.email || "",
      cpf: patient.cpf || "",
      attachments: patient.attachments || [],
      anamnese: {
        data: { ...emptyAnamneseData },
        updated_at: null,
      },
    });

    setIsModalOpen(true);

    // carrega anamnese após abrir
    await loadAnamnese(patient.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      cpf: "",
      attachments: [],
      anamnese: {
        data: { ...emptyAnamneseData },
        updated_at: null,
      },
    });
  };

  // =========================
  // FILES (VISUAL)
  // =========================
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          { name: file.name, date: new Date().toLocaleDateString("pt-BR") },
        ],
      }));
    }
    if (event.target) event.target.value = "";
  };

  // =========================
  // FILTER
  // =========================
  const filteredPatients = patients.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.cpf && p.cpf.includes(searchTerm))
  );

  // =========================
  // UI HELPERS
  // =========================
  const setYesNo = (key: keyof AnamneseData, value: YesNo) => {
    setFormData((prev) => ({
      ...prev,
      anamnese: {
        ...prev.anamnese,
        data: {
          ...prev.anamnese.data,
          [key]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            Pacientes
            {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </h1>
          <p className="text-muted-foreground font-medium">Gestão de prontuários</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className={`gap-2 transition-all w-full sm:w-auto ${
              copied ? "text-emerald-600 border-emerald-200 bg-emerald-50" : ""
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copiado!
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4" /> Link Cadastro
              </>
            )}
          </Button>

          <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Novo Paciente
          </Button>
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Ficha Clínica" : "Nova Ficha Clínica"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="pessoal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
              <TabsTrigger value="clinico">Saúde</TabsTrigger>
              <TabsTrigger value="docs">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="pessoal" className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do paciente"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>
            </TabsContent>

            {/* SAÚDE (RÁPIDO) */}
            <TabsContent value="clinico" className="py-4 space-y-4">
              <Label className="text-rose-600 flex items-center gap-2 font-bold">
                <Activity className="h-4 w-4" /> Anamnese (marcação rápida)
              </Label>

              <div className="space-y-3">
                {[
                  { key: "hypertension", label: "Hipertensão" },
                  { key: "diabetes", label: "Diabetes" },
                  { key: "heartProblems", label: "Problemas cardíacos" },
                  { key: "bleeding", label: "Sangramento fácil" },
                  { key: "pregnancy", label: "Gestante" },
                  { key: "smoking", label: "Fumante" },
                  { key: "alcohol", label: "Consome álcool" },
                  { key: "anesthesiaAllergy", label: "Alergia à anestesia" },
                  { key: "latexAllergy", label: "Alergia ao látex" },
                ].map((item) => {
                  const key = item.key as keyof AnamneseData;
                  const value = formData.anamnese.data[key] as YesNo;

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-white"
                    >
                      <div className="text-sm font-semibold text-slate-700">
                        {item.label}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={value === "sim" ? "default" : "outline"}
                          onClick={() => setYesNo(key, "sim")}
                        >
                          Sim
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={value === "nao" ? "destructive" : "outline"}
                          onClick={() => setYesNo(key, "nao")}
                        >
                          Não
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={value === "" ? "secondary" : "outline"}
                          onClick={() => setYesNo(key, "")}
                          title="Limpar"
                        >
                          —
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-2">
                <Label>Alergias (descrever)</Label>
                <Input
                  value={formData.anamnese.data.allergies}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      anamnese: {
                        ...prev.anamnese,
                        data: { ...prev.anamnese.data, allergies: e.target.value },
                      },
                    }))
                  }
                  placeholder="Ex: Penicilina, dipirona..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Medicamentos em uso</Label>
                <Input
                  value={formData.anamnese.data.medications}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      anamnese: {
                        ...prev.anamnese,
                        data: { ...prev.anamnese.data, medications: e.target.value },
                      },
                    }))
                  }
                  placeholder="Ex: Losartana, Metformina..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Observações</Label>
                <Input
                  value={formData.anamnese.data.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      anamnese: {
                        ...prev.anamnese,
                        data: { ...prev.anamnese.data, notes: e.target.value },
                      },
                    }))
                  }
                  placeholder="Ex: usa anticoagulante / pressão controlada..."
                />
              </div>

              {editingId && formData.anamnese.updated_at && (
                <p className="text-xs text-slate-400">
                  Última atualização:{" "}
                  {new Date(formData.anamnese.updated_at).toLocaleString("pt-BR")}
                </p>
              )}
            </TabsContent>

            {/* DOCS */}
            <TabsContent value="docs" className="py-4 space-y-4">
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500 font-medium">
                  Clique para adicionar arquivos
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {formData.attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileCheck className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          attachments: prev.attachments.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      <X className="h-4 w-4 text-slate-400 hover:text-rose-500" />
                    </Button>
                  </div>
                ))}

                {formData.attachments.length === 0 && (
                  <p className="text-xs text-center text-slate-400 py-2">
                    Nenhum documento anexado.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : editingId ? "Atualizar Dados" : "Salvar Registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LISTA */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="grid gap-3">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>{loading ? "Carregando..." : "Nenhum paciente encontrado."}</p>
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const hasPendingDocs = !patient.attachments || patient.attachments.length === 0;

                return (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group bg-white shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <UserCircle className="h-6 w-6 text-slate-400" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-800">{patient.name}</p>

                          {hasPendingDocs && (
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-amber-100">
                              <AlertTriangle className="h-3 w-3" /> Pendência Doc
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs text-slate-500 font-medium mt-0.5">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 text-slate-300" />{" "}
                            {patient.email || "Sem e-mail"}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <Phone className="h-3 w-3 text-slate-300" />{" "}
                            {patient.phone || "Sem telefone"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(patient)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-slate-400 hover:text-primary" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteConfirmation(patient.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-rose-400 hover:text-rose-600" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* ALERT DELETE */}
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
              Você tem certeza que deseja excluir o cadastro deste paciente? <br />
              <span className="font-bold">
                Todos os dados e histórico serão perdidos permanentemente.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}