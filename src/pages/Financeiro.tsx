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
  ArrowDownCircle, ArrowUpCircle, Plus, Wallet, Receipt, BadgeDollarSign, 
  Search, Trash2, Repeat, Loader2
} from "lucide-react";

// Tipagem corrigida para sincronizar com o banco de dados no Armbian
interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string; 
  category: string;
  tipo: "receita" | "despesa"; // Tipagem unificada
}

export default function Financeiro() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [activeType, setActiveType] = useState<"receita" | "despesa">("receita");
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    months: "2"
  });

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/financeiro');
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((t: any) => ({
          id: t.id,
          description: t.descricao,
          amount: parseFloat(t.valor),
          date: t.data_base.split('T')[0], 
          category: t.categoria,
          tipo: t.tipo // Agora mapeado corretamente
        }));
        setTransactions(formatted);
      }
    } catch (error) {
      console.error("Erro ao carregar financeiro", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSave = async () => {
    if (!formData.description || !formData.amount) return;

    const baseAmount = parseFloat(formData.amount);
    const numMonths = formData.isRecurring ? parseInt(formData.months) : 1;
    
    setLoading(true);
    try {
      const promises = [];
      for (let i = 0; i < numMonths; i++) {
        const futureDate = new Date(formData.date + 'T12:00:00');
        futureDate.setMonth(futureDate.getMonth() + i);
        
        const description = numMonths > 1 
            ? `${formData.description} (${i + 1}/${numMonths})` 
            : formData.description;

        promises.push(
            fetch('http://localhost:3000/api/financeiro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao: description,
                    valor: baseAmount,
                    tipo: activeType,
                    categoria: formData.category || "Geral",
                    data: futureDate.toISOString().split('T')[0]
                })
            })
        );
      }

      await Promise.all(promises);
      await loadTransactions();
      closeModal();
    } catch (error) {
      alert("Erro ao salvar lançamento(s)");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (idToDelete) {
      try {
        await fetch(`http://localhost:3000/api/financeiro/${idToDelete}`, { method: 'DELETE' });
        await loadTransactions();
        setIsDeleteAlertOpen(false);
        setIdToDelete(null);
      } catch (error) {
        alert("Erro ao excluir");
      }
    }
  };

  const totalIncomes = transactions.filter(t => t.tipo === "receita").reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.tipo === "despesa").reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncomes - totalExpenses;

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ 
      description: "", 
      amount: "", 
      category: "", 
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      months: "2"
    });
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Financeiro {loading && <Loader2 className="h-5 w-5 animate-spin text-primary"/>}
          </h1>
          <p className="text-muted-foreground font-medium">Gestão completa e projeção de caixa</p>
        </div>
      </div>

      {/* Resumo Financeiro */}
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

      {/* Busca e Botões */}
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
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => { setActiveType("receita"); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Receita
          </Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-700 gap-2" onClick={() => { setActiveType("despesa"); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Despesa
          </Button>
        </div>
      </div>

      <Tabs defaultValue="receitas" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="receitas" className="px-8 font-bold text-xs uppercase tracking-wider">Receitas</TabsTrigger>
          <TabsTrigger value="despesas" className="px-8 font-bold text-xs uppercase tracking-wider">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="receitas">
          <div className="grid gap-2">
              {filteredTransactions.filter(t => t.tipo === 'receita').map((t) => (
                  <TransactionRow key={t.id} transaction={t} onDelete={() => { setIdToDelete(t.id); setIsDeleteAlertOpen(true); }} />
              ))}
              {filteredTransactions.filter(t => t.tipo === 'receita').length === 0 && <p className="text-center py-10 text-slate-400">Nenhuma receita encontrada.</p>}
          </div>
        </TabsContent>

        <TabsContent value="despesas">
          <div className="grid gap-2">
              {filteredTransactions.filter(t => t.tipo === 'despesa').map((t) => (
                  <TransactionRow key={t.id} transaction={t} onDelete={() => { setIdToDelete(t.id); setIsDeleteAlertOpen(true); }} />
              ))}
              {filteredTransactions.filter(t => t.tipo === 'despesa').length === 0 && <p className="text-center py-10 text-slate-400">Nenhuma despesa encontrada.</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Lançamento */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {`Lançar ${activeType === "receita" ? "Receita" : "Despesa"}`}
              <BadgeDollarSign className={`h-5 w-5 ${activeType === 'receita' ? 'text-emerald-500' : 'text-rose-500'}`} />
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label className="font-bold text-slate-600">Descrição</Label>
              <Input placeholder="Ex: Mensalidade" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-bold text-slate-600">Valor (R$)</Label>
                <Input type="number" placeholder="0,00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-slate-600">Data</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            {/* Recorrência */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className={`h-4 w-4 ${formData.isRecurring ? 'text-primary' : 'text-slate-400'}`} />
                  <Label className="font-bold cursor-pointer" htmlFor="recurring">Repetir lançamento?</Label>
                </div>
                <input 
                  id="recurring" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={formData.isRecurring}
                  onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                />
              </div>

              {formData.isRecurring && (
                <div className="grid gap-2 pt-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Repetir mensalmente por:</Label>
                  <select 
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
                    value={formData.months}
                    onChange={e => setFormData({...formData, months: e.target.value})}
                  >
                    <option value="2">2 Meses</option>
                    <option value="3">3 Meses</option>
                    <option value="6">6 Meses</option>
                    <option value="12">12 Meses (1 Ano)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="font-bold text-slate-600">Categoria</Label>
              <Input placeholder="Ex: Geral" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button 
              className={`font-bold px-8 ${activeType === "receita" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`} 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Salvando..." : formData.isRecurring ? `Gerar ${formData.months} Lançamentos` : "Confirmar"}
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
            <AlertDialogDescription className="text-slate-600 text-base">
              Você tem certeza? Esta ação removerá este registro financeiro permanentemente.
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

// Linha da tabela corrigida para o novo campo "tipo"
function TransactionRow({ transaction, onDelete }: { transaction: Transaction, onDelete: () => void }) {
    const isReceita = transaction.tipo === 'receita';
    return (
        <div className="group flex items-center justify-between p-4 bg-white rounded-xl border border-transparent hover:border-slate-200 hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isReceita ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isReceita ? <Receipt className="h-5 w-5" /> : <BadgeDollarSign className="h-5 w-5" />}
            </div>
            <div>
            <div className="flex items-center gap-2">
                <p className="font-bold text-slate-700">{transaction.description}</p>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {new Date(transaction.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {transaction.category}
            </p>
            </div>
        </div>
        
        <div className="flex items-center gap-6">
            <span className={`text-lg font-black ${isReceita ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isReceita ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:bg-rose-50" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
            </Button>
            </div>
        </div>
        </div>
    );
}