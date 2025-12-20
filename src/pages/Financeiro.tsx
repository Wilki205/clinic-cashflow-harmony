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
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  Wallet, 
  Receipt, 
  BadgeDollarSign 
} from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
}

export default function Financeiro() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Estados para o novo Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeType, setActiveType] = useState<"income" | "expense">("income");
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("@odonto:finance");
    if (saved) {
      setTransactions(JSON.parse(saved));
    } else {
      const initial: Transaction[] = [
        { id: 1, description: "Consulta - Maria Silva", amount: 250, date: "15/03/2024", category: "Serviço", type: "income" },
        { id: 2, description: "Limpeza - João Santos", amount: 180, date: "14/03/2024", category: "Serviço", type: "income" },
        { id: 3, description: "Material Odontológico", amount: 850, date: "10/03/2024", category: "Insumos", type: "expense" },
      ];
      setTransactions(initial);
      localStorage.setItem("@odonto:finance", JSON.stringify(initial));
    }
  }, []);

  const totalIncomes = transactions
    .filter(t => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncomes - totalExpenses;

  // Função para abrir modal configurado
  const openModal = (type: "income" | "expense") => {
    setActiveType(type);
    setFormData({ description: "", amount: "", category: "" });
    setIsModalOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!formData.description || !formData.amount) return;

    const newTransaction: Transaction = {
      id: Date.now(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: new Date().toLocaleDateString('pt-BR'),
      category: formData.category || (activeType === "income" ? "Geral" : "Operacional"),
      type: activeType
    };
    
    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    localStorage.setItem("@odonto:finance", JSON.stringify(updated));
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading">Financeiro</h1>
          <p className="text-muted-foreground">Monitore o fluxo de caixa da clínica</p>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500 uppercase">
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-800">R$ {totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500 uppercase">
              <ArrowDownCircle className="h-4 w-4 text-rose-500" /> Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-800">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-sm ${balance >= 0 ? 'bg-primary' : 'bg-rose-600'} text-white`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium opacity-90 uppercase">
              <Wallet className="h-4 w-4" /> Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Listagem e Ações */}
      <Tabs defaultValue="receitas" className="space-y-4">
        <div className="flex items-center justify-between bg-slate-100/50 p-1 rounded-lg">
          <TabsList className="bg-transparent">
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openModal("income")}>
              <Plus className="h-4 w-4 mr-1" /> Receita
            </Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => openModal("expense")}>
              <Plus className="h-4 w-4 mr-1" /> Despesa
            </Button>
          </div>
        </div>

        {["income", "expense"].map((type) => (
          <TabsContent key={type} value={type === "income" ? "receitas" : "despesas"}>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6 space-y-3">
                {transactions.filter(t => t.type === type).length === 0 && (
                  <p className="text-center py-10 text-slate-400">Nenhum registro.</p>
                )}
                {transactions.filter(t => t.type === type).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50/50">
                    <div className="flex gap-4 items-center">
                      <div className={`p-2 rounded-full ${type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        {type === 'income' ? <Receipt className="h-4 w-4 text-emerald-600" /> : <BadgeDollarSign className="h-4 w-4 text-rose-600" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{t.description}</p>
                        <p className="text-xs text-slate-400 uppercase">{t.date} • {t.category}</p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* --- MODAL DE LANÇAMENTO --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Lançamento: {activeType === "income" ? "Receita" : "Despesa"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="desc">Descrição</Label>
              <Input 
                id="desc" 
                placeholder="Ex: Pagamento Canal" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="val">Valor (R$)</Label>
                <Input 
                  id="val" 
                  type="number" 
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat">Categoria</Label>
                <Input 
                  id="cat" 
                  placeholder="Ex: Serviço" 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button 
              className={activeType === "income" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
              onClick={handleSaveTransaction}
            >
              Salvar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}