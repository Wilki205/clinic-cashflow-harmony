import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  UserX, 
  CheckCircle2,
  CalendarClock,
  MessageCircle,
  Zap,
  ArrowUpRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: number;
  date: string;
  time: string;
  patient: string;
  procedure: string;
  status: "confirmed" | "pending" | "absent" | "rescheduled";
}

interface Patient {
  id: number;
  attachments: any[];
}

export default function Dashboard() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [statsData, setStatsData] = useState({
    income: 0,
    expense: 0,
    patientsCount: 0,
    pendingDocs: 0,
    absentRate: 0,
    confirmedToday: 0,
    ticketMedio: 0
  });

  useEffect(() => {
    // 1. Carregar Agendamentos e filtrar para Hoje
    const savedAppo = localStorage.getItem("@odonto:appointments");
    const allAppo: Appointment[] = savedAppo ? JSON.parse(savedAppo) : [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    const forToday = allAppo.filter(a => a.date === todayStr);
    setTodayAppointments(forToday.sort((a, b) => a.time.localeCompare(b.time)));

    // 2. Carregar Pacientes e verificar pendências
    const savedPatients = localStorage.getItem("@odonto:patients");
    const allPatients: Patient[] = savedPatients ? JSON.parse(savedPatients) : [];
    const docsPending = allPatients.filter(p => !p.attachments || p.attachments.length === 0).length;

    // 3. Cálculo de Faltas (Geral)
    const absents = allAppo.filter(a => a.status === 'absent').length;
    const totalAppo = allAppo.length || 1;
    const absentRate = Math.round((absents / totalAppo) * 100);

    // 4. Financeiro Real
    const savedFin = localStorage.getItem("@odonto:finance");
    const transactions = savedFin ? JSON.parse(savedFin) : [];
    const income = transactions.filter((t: any) => t.type === "income").reduce((acc: number, t: any) => acc + t.amount, 0);
    const expense = transactions.filter((t: any) => t.type === "expense").reduce((acc: number, t: any) => acc + t.amount, 0);

    // 5. Ticket Médio (Baseado em atendimentos confirmados)
    const confirmedTotal = allAppo.filter(a => a.status === 'confirmed').length || 1;
    const ticket = income / confirmedTotal;

    setStatsData({
      income,
      expense,
      patientsCount: allPatients.length,
      pendingDocs: docsPending,
      absentRate: absentRate,
      confirmedToday: forToday.filter(a => a.status === 'confirmed').length,
      ticketMedio: ticket
    });
  }, []);

  const handleQuickCheckin = (id: number) => {
    const savedAppo = localStorage.getItem("@odonto:appointments");
    const allAppo: Appointment[] = savedAppo ? JSON.parse(savedAppo) : [];
    const updated = allAppo.map(app => app.id === id ? { ...app, status: 'confirmed' as const } : app);
    localStorage.setItem("@odonto:appointments", JSON.stringify(updated));
    window.location.reload(); 
  };

  const stats = [
    {
      title: "Lucro Líquido",
      value: `R$ ${(statsData.income - statsData.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      desc: "Resultado real acumulado"
    },
    {
      title: "Pacientes Ativos",
      value: statsData.patientsCount.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      desc: `${statsData.pendingDocs} com pendência doc`,
      alert: statsData.pendingDocs > 0
    },
    {
      title: "Taxa de Faltas",
      value: `${statsData.absentRate}%`,
      icon: UserX,
      color: statsData.absentRate > 15 ? "text-rose-600" : "text-amber-600",
      bgColor: statsData.absentRate > 15 ? "bg-rose-50" : "bg-amber-50",
      desc: "Média de ausências geral"
    },
    {
      title: "Ticket Médio",
      value: `R$ ${statsData.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      desc: "Média por atendimento"
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Dashboard <Zap className="h-6 w-6 text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-muted-foreground font-medium italic">
            Olá, Doutor. Aqui está o resumo estratégico da sua clínica.
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Clínica Aberta</span>
        </div>
      </div>

      {/* ALERTAS INTELIGENTES */}
      {(statsData.pendingDocs > 0 || statsData.absentRate > 15) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statsData.pendingDocs > 0 && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-800">Ação Necessária: Documentação</p>
                <p className="text-xs text-rose-600">{statsData.pendingDocs} pacientes com documentos pendentes.</p>
              </div>
            </div>
          )}
          {statsData.absentRate > 15 && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
              <UserX className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Alerta de Evasão</p>
                <p className="text-xs text-amber-600">Taxa de faltas em {statsData.absentRate}%. Reforce as confirmações.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid Superior */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-white group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-800">{stat.value}</div>
              <p className={`text-[11px] mt-1 font-bold ${stat.alert ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        {/* Produtividade da Agenda */}
        <Card className="shadow-sm border-none bg-white lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
               <Zap className="h-5 w-5 text-primary" /> Eficiência Operacional
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col justify-center">
             <div className="space-y-8">
                {['Atendidos Hoje', 'Faltas Geral', 'Metas'].map((label, idx) => {
                  const val = label === 'Atendidos Hoje' 
                    ? (todayAppointments.length > 0 ? (statsData.confirmedToday / todayAppointments.length) * 100 : 0)
                    : idx === 1 ? statsData.absentRate : 85;
                  
                  return (
                    <div key={label} className="space-y-2">
                       <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                          <span>{label}</span>
                          <span>{Math.round(val)}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-rose-500' : 'bg-blue-400'}`} 
                            style={{ width: `${val}%` }} 
                          />
                       </div>
                    </div>
                  )
                })}
             </div>
          </CardContent>
        </Card>

        {/* Agenda de Hoje com Ações Rápidas */}
        <Card className="shadow-sm border-none bg-white lg:col-span-2">
          <CardHeader className="border-b border-slate-50 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-tighter">Próximos de Hoje</CardTitle>
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-10 opacity-40">
                   <p className="text-xs font-bold uppercase italic">Sem agenda para hoje</p>
                </div>
              ) : (
                todayAppointments.slice(0, 5).map((app) => (
                  <div key={app.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-black bg-primary/5 text-primary p-2 rounded-lg leading-none min-w-[45px] text-center">
                        {app.time}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 leading-none">{app.patient}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{app.procedure}</p>
                      </div>
                    </div>

                    {/* BOTÕES DE AÇÃO RÁPIDA (Aparecem no Hover) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-emerald-500 hover:bg-emerald-50"
                        title="WhatsApp"
                        onClick={() => window.open(`https://wa.me/5511999999999?text=Olá ${app.patient}, confirmamos seu horário hoje às ${app.time}`)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      
                      {app.status !== 'confirmed' && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-primary hover:bg-primary/5"
                          title="Finalizar"
                          onClick={() => handleQuickCheckin(app.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
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