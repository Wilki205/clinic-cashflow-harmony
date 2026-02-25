import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, PieChart as PieIcon, BarChart3, Calculator, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";

type Transaction = {
  id?: number;
  descricao?: string;
  valor: string | number;
  tipo: "receita" | "despesa";
  categoria?: string;
  data_base?: string;
};

type Appointment = {
  id?: number;
  paciente_nome?: string;
  procedimento: string;
  status: "pending" | "confirmed" | "absent" | string;
  data_agendamento?: string;
  horario_agendamento?: string;
  valor?: string | number;
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Relatorios() {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const reportRef = useRef<HTMLDivElement | null>(null);

  const loadReportData = async () => {
    try {
      setLoading(true);

      const [finRes, appoRes] = await Promise.all([fetch("/api/financeiro"), fetch("/api/agendamentos")]);

      const tx = finRes.ok ? await finRes.json() : [];
      const ap = appoRes.ok ? await appoRes.json() : [];

      setTransactions(tx);
      setAppointments(ap);
    } catch (e) {
      console.error("Erro ao consolidar relatórios:", e);
      setTransactions([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // ===== KPIs =====
  const kpis = useMemo(() => {
    const rec = transactions
      .filter((t) => t.tipo === "receita")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const desp = transactions
      .filter((t) => t.tipo === "despesa")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const saldo = rec - desp;
    const margem = rec > 0 ? (saldo / rec) * 100 : 0;

    const confirmados = appointments.filter((a) => a.status === "confirmed").length;
    const faltas = appointments.filter((a) => a.status === "absent").length;
    const totalAg = appointments.length;

    const taxaFaltas = totalAg > 0 ? (faltas / totalAg) * 100 : 0;
    const ticketMedio = confirmados > 0 ? rec / confirmados : 0;

    return { rec, desp, saldo, margem, confirmados, faltas, totalAg, taxaFaltas, ticketMedio };
  }, [transactions, appointments]);

  // ===== Centros de custo (donut) =====
  const costCenters = useMemo(() => {
    const map = transactions
      .filter((t) => t.tipo === "despesa")
      .reduce<Record<string, number>>((acc, t) => {
        const key = (t.categoria || "Sem categoria").trim();
        acc[key] = (acc[key] || 0) + Number(t.valor);
        return acc;
      }, {});

    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const topCostCenters = useMemo(() => costCenters.slice(0, 6), [costCenters]);

  // ===== Procedimentos (barras) =====
  const procedureRank = useMemo(() => {
    const map = appointments
      .filter((a) => a.status === "confirmed")
      .reduce<Record<string, number>>((acc, a) => {
        const key = (a.procedimento || "Sem procedimento").trim();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(map)
      .map(([procedure, count]) => ({ procedure, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [appointments]);

  // ===== “Insights” simples =====
  const insights = useMemo(() => {
    const arr: string[] = [];

    if (kpis.margem < 0) arr.push("Saldo negativo no período: revisar custos e preços.");
    if (kpis.taxaFaltas >= 15) arr.push("Taxa de faltas elevada: considere confirmação automática e lembretes.");
    if (kpis.ticketMedio > 0) arr.push(`Ticket médio estimado: ${money(kpis.ticketMedio)} (receitas/confirmados).`);

    const biggest = topCostCenters[0];
    if (biggest && kpis.desp > 0) {
      const pct = (biggest.amount / kpis.desp) * 100;
      arr.push(`Maior centro de custo: "${biggest.category}" (${pct.toFixed(1)}% dos custos).`);
    }

    if (arr.length === 0) arr.push("Sem alertas no período: indicadores estáveis.");
    return arr;
  }, [kpis, topCostCenters]);

  const handleExport = async () => {
    const dateStr = new Date().toLocaleDateString("pt-BR");
    const periodLabel = "Mês atual"; // se quiser, depois colocamos filtro por período

    const doc = new jsPDF("p", "mm", "a4");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // 1) Captura do relatório bonito
    const node = reportRef.current;
    if (!node) return;

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: node.scrollWidth,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let y = 0;
    doc.addImage(imgData, "PNG", 0, y, imgW, imgH);

    let remaining = imgH - pageH;
    while (remaining > 0) {
      doc.addPage();
      y = -(imgH - remaining);
      doc.addImage(imgData, "PNG", 0, y, imgW, imgH);
      remaining -= pageH;
    }

    // 2) Tabelas (nítidas)
    doc.addPage();
    doc.setFontSize(14);
    doc.text(`Detalhamento Financeiro — ${periodLabel}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
      body: transactions.map((t) => [
        t.data_base || "-",
        t.descricao || "-",
        t.categoria || "-",
        t.tipo,
        money(Number(t.valor)),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20] },
      columnStyles: { 4: { halign: "right" } },
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text(`Agendamentos — ${periodLabel}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [["Data", "Hora", "Paciente", "Procedimento", "Status", "Valor"]],
      body: appointments.map((a) => [
        a.data_agendamento || "-",
        a.horario_agendamento || "-",
        a.paciente_nome || "-",
        a.procedimento || "-",
        a.status,
        money(Number(a.valor || 0)),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20] },
      columnStyles: { 5: { halign: "right" } },
    });

    doc.save(`Relatorio_Clinica_${dateStr.replace(/\//g, "-")}.pdf`);
  };

  // ====== UI ======
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
          <p className="text-muted-foreground font-medium italic">
            Relatório executivo — unidade Recife - PE
          </p>
        </div>

        <Button className="gap-2 bg-slate-800 hover:bg-slate-900 shadow-lg" onClick={handleExport}>
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      {/* ====== ÁREA DO PDF (capturada pelo html2canvas) ====== */}
      <div ref={reportRef} className="bg-white rounded-2xl p-6 shadow-sm border">
        {/* Cabeçalho do relatório */}
        <div className="flex items-start justify-between gap-6 border-b pb-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-black">Relatório de Performance</div>
            <div className="text-2xl font-black text-slate-900">DentalCare — Unidade Recife</div>
            <div className="text-sm text-slate-500">
              Dentista: <span className="font-semibold">{user?.name || "Wilkison Souza"}</span> • CRO:{" "}
              <span className="font-semibold">{user?.cro || "12356-PE"}</span>
            </div>
          </div>

          <div className="text-right text-sm text-slate-500">
            <div>
              Emitido em:{" "}
              <span className="font-semibold">{new Date().toLocaleDateString("pt-BR")}</span>
            </div>
            <div>
              Período: <span className="font-semibold">Mês atual</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600">{money(kpis.rec)}</div>
              <div className="text-xs text-slate-500 mt-1">Receitas registradas</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                Custos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-600">{money(kpis.desp)}</div>
              <div className="text-xs text-slate-500 mt-1">Despesas registradas</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-black ${kpis.saldo >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                {money(kpis.saldo)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Resultado do período</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                Margem / Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900">{kpis.margem.toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-1">Ticket médio: {money(kpis.ticketMedio)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Operação */}
        <div className="grid gap-4 mt-4 md:grid-cols-3">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-sm text-slate-600">
                Confirmados: <span className="font-bold text-slate-900">{kpis.confirmados}</span>
              </div>
              <div className="text-sm text-slate-600">
                Faltas: <span className="font-bold text-slate-900">{kpis.faltas}</span>
              </div>
              <div className="text-sm text-slate-600">
                Taxa de falta: <span className="font-bold text-slate-900">{kpis.taxaFaltas.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <Calculator className="h-4 w-4 text-primary" /> Insights automáticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {insights.map((it, i) => (
                <div key={i} className="text-sm text-slate-700">
                  • {it}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 mt-6 lg:grid-cols-2">
          {/* Donut custos */}
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="border-b border-slate-50 pb-2">
              <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <PieIcon className="h-4 w-4 text-rose-500" /> Centros de custo (Top 6)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCostCenters}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {topCostCenters.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"][idx % 6]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => money(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 space-y-2">
                {topCostCenters.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">{c.category}</span>
                    <span>{money(c.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Barras procedimentos */}
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="border-b border-slate-50 pb-2">
              <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <BarChart3 className="h-4 w-4 text-slate-700" /> Top procedimentos (confirmados)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={procedureRank}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="procedure" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {procedureRank.map((p) => (
                  <div key={p.procedure} className="text-xs text-slate-600 flex justify-between">
                    <span className="font-semibold truncate">{p.procedure}</span>
                    <span className="ml-2">{p.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rodapé */}
        <div className="mt-6 border-t pt-3 text-xs text-slate-400 flex justify-between">
          <span>Gerado automaticamente pelo sistema</span>
          <span>DentalCare • Relatórios</span>
        </div>
      </div>
    </div>
  );
}