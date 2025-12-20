import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useEffect, useState } from "react";

// Tipos para garantir consistência
interface Appointment {
  id: number;
  time: string;
  patient: string;
  procedure: string;
  status: string;
}

interface Transaction {
  amount: number;
  type: "income" | "expense";
}

export default function Dashboard() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [financials, setFinancials] = useState({
    income: 0,
    expense: 0,
    patientsCount: 0
  });
  
  useEffect(() => {
    // 1. Busca Agendamentos
    const savedAppo = localStorage.getItem("@odonto:appointments");
    if (savedAppo) {
      const all = JSON.parse(savedAppo);
      setTodayAppointments(all.slice(0, 4));
    }

    // 2. Busca Financeiro Real
    const savedFin = localStorage.getItem("@odonto:finance");
    const transactions: Transaction[] = savedFin ? JSON.parse(savedFin) : [];
    
    // 3. Busca Pacientes Reais
    const savedPatients = localStorage.getItem("@odonto:patients");
    const patients = savedPatients ? JSON.parse(savedPatients) : [];

    const income = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);

    setFinancials({
      income,
      expense,
      patientsCount: patients.length || 156 // Fallback para o mockup se estiver vazio
    });
  }, []);

  const stats = [
    {
      title: "Receita do Mês",
      value: `R$ ${financials.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Despesas do Mês",
      value: `R$ ${financials.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "-3.2%",
      trend: "down",
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Lucro Líquido",
      value: `R$ ${(financials.income - financials.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "+18.7%",
      trend: "up",
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Pacientes Ativos",
      value: financials.patientsCount.toString(),
      change: "+8",
      trend: "up",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground font-medium">
          Visão geral estratégica da DentalCare
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm hover:shadow-md transition-all border-none bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                <p className={`text-[11px] mt-1 font-bold flex items-center gap-1 ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {stat.change} <span className="text-slate-400 font-normal">vs mês anterior</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Gráfico Visual de Fluxo de Caixa */}
        <Card className="shadow-sm border-none bg-white lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-700">Fluxo de Caixa Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { month: "Jan", rec: 120, desp: 60 },
                { month: "Fev", rec: 140, desp: 55 },
                { month: "Mar", rec: 150, desp: 63 },
              ].map((data) => (
                <div key={data.month} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>{data.month}</span>
                    <span className="text-slate-400">Desempenho: {Math.round((data.desp/data.rec)*100)}% de gastos</span>
                  </div>
                  <div className="flex gap-1 h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="bg-primary" style={{ width: `${(data.rec / 210) * 100}%` }} />
                    <div className="bg-rose-400" style={{ width: `${(data.desp / 210) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-6 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <div className="h-3 w-3 rounded-full bg-primary" /> Receitas
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <div className="h-3 w-3 rounded-full bg-rose-400" /> Despesas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista Dinâmica de Agendamentos */}
        <Card className="shadow-sm border-none bg-white lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-700">Próximos Horários</CardTitle>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black tracking-widest uppercase">Hoje</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-12">
                   <p className="text-sm text-slate-400 italic font-medium">Nenhum agendamento ativo.</p>
                </div>
              ) : (
                todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between group cursor-default">
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-1 bg-slate-100 rounded-full group-hover:bg-primary transition-colors" />
                      <div>
                        <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                          {appointment.patient}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {appointment.procedure}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 px-2 py-1 rounded text-xs font-black text-primary">
                      {appointment.time}
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