import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  Wallet, 
  Receipt, 
  BadgeDollarSign,
  Search,
  Trash2,
  Edit3,
  Repeat
} from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
  isRecurring?: boolean; // Identificador de recorrência
}

export default function Financeiro() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [activeType, setActiveType] = useState<"income" | "expense">("income");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    months: "1"
  });

  useEffect(() => {
    const saved = localStorage.getItem("@odonto:finance");
    if (saved) setTransactions(JSON.parse(saved));
  }, []);

  const totalIncomes = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncomes - totalExpenses;

  const saveAndRefresh = (list: Transaction[]) => {
    // Ordena por data (mais recente primeiro) para a exibição
    const sorted = [...list].sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
      return dateB - dateA;
    });
    setTransactions(sorted);
    localStorage.setItem("@odonto:finance", JSON.stringify(sorted));
  };

  const handleSave = () => {
    if (!formData.description || !formData.amount) return;

    let updated = [...transactions];
    const baseAmount = parseFloat(formData.amount);
    const numMonths = formData.isRecurring ? parseInt(formData.months) : 1;

    if (editingId) {
      // Modo Edição: Apenas o registro selecionado
      updated = transactions.map(t => t.id === editingId ? {
        ...t,
        description: formData.description,
        amount: baseAmount,
        date: new Date(formData.date + 'T00:00:00').toLocaleDateString('pt-BR'),
        category: formData.category || "Geral",
        type: activeType
      } : t);
    } else {
      // Modo Novo Lançamento: Pode gerar múltiplas parcelas
      for (let i = 0; i < numMonths; i++) {
        const futureDate = new Date(formData.date + 'T00:00:00');
        futureDate.setMonth(futureDate.getMonth() + i);

        const newTransaction: Transaction = {
          id: Date.now() + i,
          description: numMonths > 1 ? `${formData.description} (${i + 1}/${numMonths})` : formData.description,
          amount: baseAmount,
          date: futureDate.toLocaleDateString('pt-BR'),
          category: formData.category || "Geral",
          type: activeType,
          isRecurring: formData.isRecurring
        };
        updated.push(newTransaction);
      }
    }

    saveAndRefresh(updated);
    closeModal();
  };

  const handleDelete = () => {
    if (idToDelete) {
      const updated = transactions.filter(t => t.id !== idToDelete);
      saveAndRefresh(updated);
      setIsDeleteAlertOpen(false);
      setIdToDelete(null);
    }
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setActiveType(t.type);
    const [day, month, year] = t.date.split('/');
    setFormData({
      description: t.description,
      amount: t.amount.toString(),
      category: t.category,
      date: `${year}-${month}-${day}`,
      isRecurring: !!t.isRecurring,
      months: "1"
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      description: "", 
      amount: "", 
      category: "", 
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      months: "1"
    });
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground font-medium">Gestão completa e projeção de caixa</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black text-slate-400 uppercase">Receitas</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-600">R$ {totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black text-slate-400 uppercase">Despesas</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-rose-600">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-sm text-white transition-colors ${balance >= 0 ? 'bg-slate-800' : 'bg-rose-700'}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black opacity-70 uppercase tracking-widest">Saldo Atual</CardTitle>
            <Wallet className="h-5 w-5 opacity-70" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Buscar lançamentos..." 
            className="pl-10 bg-slate-50 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => { setActiveType("income"); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Receita
          </Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-700 gap-2" onClick={() => { setActiveType("expense"); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Despesa
          </Button>
        </div>
      </div>

      <Tabs defaultValue="receitas" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="receitas" className="px-8 font-bold text-xs uppercase tracking-wider">Receitas</TabsTrigger>
          <TabsTrigger value="despesas" className="px-8 font-bold text-xs uppercase tracking-wider">Despesas</TabsTrigger>
        </TabsList>

        {["income", "expense"].map((type) => (
          <TabsContent key={type} value={type === "income" ? "receitas" : "despesas"}>
            <div className="grid gap-2">
              {filteredTransactions.filter(t => t.type === type).length === 0 ? (
                <p className="text-center py-20 text-slate-300 font-medium italic">Nenhum lançamento encontrado.</p>
              ) : (
                filteredTransactions.filter(t => t.type === type).map((t) => (
                  <div key={t.id} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-transparent hover:border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {type === 'income' ? <Receipt className="h-5 w-5" /> : <BadgeDollarSign className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-700">{t.description}</p>
                          {t.isRecurring && <Repeat className="h-3 w-3 text-slate-300" title="Lançamento Recorrente" />}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.date} • {t.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <span className={`text-lg font-black ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => openEdit(t)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:bg-rose-50" onClick={() => { setIdToDelete(t.id); setIsDeleteAlertOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal de Lançamento Turbinado */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {editingId ? "Editar Registro" : `Lançar ${activeType === "income" ? "Receita" : "Despesa"}`}
              {!editingId && <BadgeDollarSign className={`h-5 w-5 ${activeType === 'income' ? 'text-emerald-500' : 'text-rose-500'}`} />}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="font-bold text-slate-600">Descrição do Lançamento</Label>
              <Input placeholder="Ex: Mensalidade Ortodontia" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-bold text-slate-600">Valor (R$)</Label>
                <Input type="number" placeholder="0,00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-slate-600">Data Base</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            {/* SEÇÃO DE RECORRÊNCIA */}
            {!editingId && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className={`h-4 w-4 ${formData.isRecurring ? 'text-primary' : 'text-slate-400'}`} />
                    <Label className="font-bold cursor-pointer" htmlFor="recurring">Este lançamento se repete?</Label>
                  </div>
                  <input 
                    id="recurring"
                    type="checkbox" 
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    checked={formData.isRecurring}
                    onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                  />
                </div>

                {formData.isRecurring && (
                  <div className="grid gap-2 pt-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">Repetir mensalmente por:</Label>
                    <select 
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
                      value={formData.months}
                      onChange={e => setFormData({...formData, months: e.target.value})}
                    >
                      <option value="2">2 Meses</option>
                      <option value="3">3 Meses</option>
                      <option value="6">6 Meses</option>
                      <option value="12">12 Meses (1 Ano)</option>
                      <option value="24">24 Meses (2 Anos)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label className="font-bold text-slate-600">Categoria</Label>
              <Input placeholder="Ex: Manutenção, Aluguel, Prolabore" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeModal} className="text-slate-500 font-bold">Cancelar</Button>
            <Button 
              className={`font-bold px-8 ${activeType === "income" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-rose-600 hover:bg-rose-700 shadow-rose-100"} shadow-lg`} 
              onClick={handleSave}
            >
              {editingId ? "Salvar Alterações" : formData.isRecurring ? `Gerar ${formData.months} Lançamentos` : "Confirmar Lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Exclusão */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="border-none shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <div className="p-2 bg-rose-50 rounded-full"><Trash2 className="h-6 w-6" /></div>
              <AlertDialogTitle className="text-xl font-bold text-slate-800">Remover Lançamento?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 text-base leading-relaxed">
              Você tem certeza? Se este item fizer parte de uma série recorrente, **apenas este registro específico** será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-none bg-slate-100 text-slate-500">Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">Sim, Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}