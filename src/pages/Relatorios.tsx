import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, PieChart, BarChart3, Calculator, Info } from "lucide-react";

interface Transaction {
  amount: number;
  type: "income" | "expense";
  category: string;
}

interface Appointment {
  procedure: string;
  status: string;
}

export default function Relatorios() {
  const [data, setData] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    categories: [] as { category: string; amount: number }[],
    procedures: [] as { procedure: string; count: number }[]
  });

  useEffect(() => {
    // 1. Carrega dados Financeiros
    const savedFin = localStorage.getItem("@odonto:finance");
    const transactions: Transaction[] = savedFin ? JSON.parse(savedFin) : [];
    
    // 2. Carrega dados da Agenda para Rentabilidade
    const savedAppo = localStorage.getItem("@odonto:appointments");
    const appointments: Appointment[] = savedAppo ? JSON.parse(savedAppo) : [];

    // Cálculo DRE
    const rec = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const desp = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);

    // Agrupamento de Despesas por Categoria (Dinâmico)
    const categoryMap = transactions
      .filter(t => t.type === "expense")
      .reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const sortedCategories = Object.keys(categoryMap)
      .map(cat => ({ category: cat, amount: categoryMap[cat] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3); // Top 3 despesas

    // Frequência de Procedimentos (Agenda)
    const procedureMap = appointments
      .filter(a => a.status === "confirmed")
      .reduce((acc: any, a) => {
        acc[a.procedure] = (acc[a.procedure] || 0) + 1;
        return acc;
      }, {});

    const sortedProcedures = Object.keys(procedureMap)
      .map(proc => ({ procedure: proc, count: procedureMap[proc] }))
      .sort((a, b) => b.count - a.count);

    setData({
      receitas: rec,
      despesas: desp,
      saldo: rec - desp,
      categories: sortedCategories,
      procedures: sortedProcedures
    });
  }, []);

  const handleExport = () => {
    alert("Gerando PDF com DRE, Top Gastos e Frequência de Procedimentos...");
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground font-medium">Análise de performance e saúde financeira</p>
        </div>
        <Button className="gap-2 bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-200" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exportar PDF Mensal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* DRE GERENCIAL - O Coração do Relatório */}
        <Card className="shadow-sm border-none bg-white lg:col-span-1">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
              <Calculator className="h-4 w-4 text-primary" />
              DRE Gerencial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                <span className="text-xs font-bold text-emerald-700 uppercase">Faturamento</span>
                <span className="font-black text-emerald-600">R$ {data.receitas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center bg-rose-50/50 p-3 rounded-xl border border-rose-100/50">
                <span className="text-xs font-bold text-rose-700 uppercase">Custos</span>
                <span className="font-black text-rose-500">R$ {data.despesas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="pt-2 text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Resultado Líquido</p>
                <h2 className={`text-4xl font-black ${data.saldo >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                  R$ {data.saldo.toLocaleString('pt-BR')}
                </h2>
                <div className="mt-2 inline-block bg-slate-100 px-3 py-1 rounded-full">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Margem: {data.receitas > 0 ? ((data.saldo / data.receitas) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DISTRIBUIÇÃO DE GASTOS DINÂMICA */}
        <Card className="shadow-sm border-none bg-white lg:col-span-2">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
              <PieChart className="h-4 w-4 text-rose-500" />
              Principais Centros de Custo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {data.categories.length === 0 ? (
              <p className="text-center py-10 text-slate-300 italic">Nenhuma despesa registrada.</p>
            ) : (
              data.categories.map((item, idx) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <span className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      {item.category}
                    </span>
                    <span>R$ {item.amount.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-500' : 'bg-slate-400'}`}
                      style={{ width: `${(item.amount / data.despesas) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* FREQUÊNCIA E RENTABILIDADE (DADOS DA AGENDA) */}
        <Card className="shadow-sm border-none bg-white md:col-span-2 lg:col-span-3">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              Procedimentos Realizados (Confirmações)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.procedures.length === 0 ? (
                <p className="col-span-4 text-center py-6 text-slate-300">Nenhum atendimento confirmado na agenda.</p>
              ) : (
                data.procedures.slice(0, 4).map((item) => (
                  <div key={item.procedure} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-primary/5 hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{item.procedure}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-slate-800">{item.count}</span>
                      <span className="text-[10px] font-bold text-slate-400 pb-1">vezes</span>
                    </div>
                    <div className="mt-3 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(item.count / 10) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}