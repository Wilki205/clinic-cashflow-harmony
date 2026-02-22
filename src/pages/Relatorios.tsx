import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, PieChart, BarChart3, Calculator, Loader2 } from "lucide-react";

// Bibliotecas para o Relatório Real
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useUser } from "@/contexts/UserContext"; 

export default function Relatorios() {
  const { user } = useUser(); 
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    categories: [] as { category: string; amount: number }[],
    procedures: [] as { procedure: string; count: number }[]
  });

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Busca dados sincronizados do seu servidor no Parrot OS
      const [finRes, appoRes] = await Promise.all([
        fetch('http://localhost:3000/api/financeiro'),
        fetch('http://localhost:3000/api/agendamentos')
      ]);

      // CORREÇÃO DO ERRO 2339: Aguardando o processamento do JSON antes do filter
      const transactions = finRes.ok ? await finRes.json() : [];
      const appointments = appoRes.ok ? await appoRes.json() : [];

      // Processamento Financeiro usando os termos do banco (receita/despesa)
      const rec = transactions
        .filter((t: any) => t.tipo === "receita")
        .reduce((acc: number, t: any) => acc + parseFloat(t.valor), 0);
        
      const desp = transactions
        .filter((t: any) => t.tipo === "despesa")
        .reduce((acc: number, t: any) => acc + parseFloat(t.valor), 0);

      const categoryMap = transactions
        .filter((t: any) => t.tipo === "despesa")
        .reduce((acc: any, t: any) => {
          acc[t.categoria] = (acc[t.categoria] || 0) + parseFloat(t.valor);
          return acc;
        }, {});

      const sortedCategories = Object.keys(categoryMap)
        .map(cat => ({ category: cat, amount: categoryMap[cat] }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      // Ranking de Procedimentos (Baseado na Agenda real)
      const procedureMap = appointments
        .filter((a: any) => a.status === "confirmed")
        .reduce((acc: any, a: any) => {
          acc[a.procedimento] = (acc[a.procedimento] || 0) + 1;
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
    } catch (error) {
      console.error("Erro ao consolidar relatórios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const handleExport = async () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('pt-BR');

    // Timbre com dados dinâmicos do perfil
    doc.setFillColor(30, 41, 59); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Relatório de Performance Clínica", 14, 20);
    doc.setFontSize(10);
    doc.text(`Dentista: ${user?.name || 'Wilkison Souza'} | CRO: ${user?.cro || '12356-PE'}`, 14, 30);
    doc.text(`Unidade: Recife - PE | Emissão: ${dateStr}`, 14, 35);

    // Tabela DRE Gerencial
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.text("Demonstrativo de Resultados (DRE)", 14, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Indicador Financeiro', 'Valor']],
      body: [
        ['Faturamento Bruto', `R$ ${data.receitas.toLocaleString('pt-BR')}`],
        ['Custos Totais', `R$ ${data.despesas.toLocaleString('pt-BR')}`],
        ['Saldo Líquido', `R$ ${data.saldo.toLocaleString('pt-BR')}`],
        ['Margem Operacional', `${data.receitas > 0 ? ((data.saldo / data.receitas) * 100).toFixed(1) : 0}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Performance_Clinica_${dateStr.replace(/\//g, '-')}.pdf`);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold animate-pulse uppercase tracking-widest text-xs">Acessando banco de dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground font-medium italic">Análise de performance para a unidade Recife - PE</p>
        </div>
        <Button className="gap-2 bg-slate-800 hover:bg-slate-900 shadow-lg" onClick={handleExport}>
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* DRE GERENCIAL */}
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="border-b border-slate-50 pb-2">
            <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Calculator className="h-4 w-4 text-primary" /> DRE Gerencial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl">
                <span className="text-xs font-bold text-emerald-700 uppercase">Faturamento</span>
                <span className="font-black text-emerald-600">R$ {data.receitas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center bg-rose-50 p-3 rounded-xl">
                <span className="text-xs font-bold text-rose-700 uppercase">Custos</span>
                <span className="font-black text-rose-500">R$ {data.despesas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="text-center pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Líquido</p>
                <h2 className={`text-3xl font-black ${data.saldo >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                  R$ {data.saldo.toLocaleString('pt-BR')}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DISTRIBUIÇÃO DE GASTOS */}
        <Card className="shadow-sm border-none bg-white lg:col-span-2">
          <CardHeader className="border-b border-slate-50 pb-2">
            <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <PieChart className="h-4 w-4 text-rose-500" /> Centros de Custo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {data.categories.map((item, idx) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                  <span>{item.category}</span>
                  <span>R$ {item.amount.toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${idx === 0 ? 'bg-rose-500' : 'bg-slate-400'}`} 
                    style={{ width: `${(item.amount / data.despesas) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}