import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, PieChart, BarChart3, Calculator } from "lucide-react";

export default function Relatorios() {
  const [data, setData] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0
  });

  useEffect(() => {
    // Busca os dados reais do financeiro para alimentar o DRE
    const saved = localStorage.getItem("@odonto:finance");
    if (saved) {
      const transactions = JSON.parse(saved);
      const rec = transactions.filter((t: any) => t.type === "income").reduce((acc: number, t: any) => acc + t.amount, 0);
      const desp = transactions.filter((t: any) => t.type === "expense").reduce((acc: number, t: any) => acc + t.amount, 0);
      
      setData({
        receitas: rec,
        despesas: desp,
        saldo: rec - desp
      });
    }
  }, []);

  const handleExport = () => {
    alert("Gerando PDF do relatório mensal... (Simulação)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight font-heading">Relatórios</h1>
          <p className="text-muted-foreground font-medium">Análises e insights estratégicos da clínica</p>
        </div>
        <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* DRE - Agora com dados Reais */}
        <Card className="shadow-sm border-none bg-white overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Calculator className="h-5 w-5 text-primary" />
              DRE Gerencial (Mês Atual)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Faturamento Bruto</span>
                <span className="font-bold text-emerald-600">R$ {data.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">(-) Custos Operacionais</span>
                <span className="font-bold text-rose-500">R$ {data.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="text-base font-bold text-slate-700">Resultado Líquido</span>
                <div className="text-right">
                  <span className={`text-xl font-black ${data.saldo >= 0 ? 'text-primary' : 'text-rose-600'}`}>
                    R$ {data.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Margem de Lucro: {data.receitas > 0 ? ((data.saldo / data.receitas) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas - Ótimo para mostrar onde o dinheiro está indo */}
        <Card className="shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <PieChart className="h-5 w-5 text-secondary" />
              Distribuição de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { category: "Material Odontológico", amount: 5200, color: "bg-primary" },
              { category: "Recursos Humanos", amount: 8500, color: "bg-secondary" },
              { category: "Infraestrutura", amount: 3500, color: "bg-accent" },
            ].map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500 tracking-wide">
                  <span>{item.category}</span>
                  <span>R$ {item.amount.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.amount / 17200) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rentabilidade - Ajuda o dentista a decidir qual serviço focar */}
        <Card className="shadow-sm border-none bg-white md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <BarChart3 className="h-5 w-5 text-amber-500" />
              Rentabilidade por Procedimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { procedure: "Implantes", profit: 2300, color: "border-primary" },
                { procedure: "Clareamento", profit: 650, color: "border-secondary" },
                { procedure: "Restauração", profit: 370, color: "border-accent" },
                { procedure: "Limpeza", profit: 150, color: "border-slate-200" },
              ].map((item) => (
                <div key={item.procedure} className={`p-4 rounded-xl border-l-4 ${item.color} bg-slate-50/50`}>
                  <p className="text-xs font-bold text-slate-400 uppercase">{item.procedure}</p>
                  <p className="text-lg font-bold text-slate-700">R$ {item.profit.toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Lucro por unidade</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}