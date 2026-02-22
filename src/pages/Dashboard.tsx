import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, TrendingUp, Users, AlertCircle, UserX, 
  CheckCircle2, CalendarClock, MessageCircle, Zap, UserCog 
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// Interfaces de Tipagem
interface Appointment {
  id: number;
  time: string;
  patient: string;
  procedure: string;
  status: "confirmed" | "pending" | "absent" | "rescheduled";
}

export default function Dashboard() {
  const { user } = useUser();
  // Estado de Loading para não mostrar tela branca enquanto carrega
  const [loading, setLoading] = useState(true);
  
  // Estado inicial zerado
  const [statsData, setStatsData] = useState({
    income: 0,
    expense: 0,
    patientsCount: 0,
    pendingDocs: 0,
    absentRate: 0,
    confirmedToday: 0,
    ticketMedio: 0
  });

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  const firstName = user?.name ? user.name.split(' ')[0] : "Doutor";

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Busca Estatísticas (Com Proteção)
      const resStats = await fetch('http://localhost:3000/api/dashboard-stats');
      if (resStats.ok) {
        const data = await resStats.json();
        // Garante que os números são números (evita crash)
        setStatsData({
            income: Number(data.income) || 0,
            expense: Number(data.expense) || 0,
            patientsCount: Number(data.patientsCount) || 0,
            pendingDocs: Number(data.pendingDocs) || 0,
            absentRate: Number(data.absentRate) || 0,
            confirmedToday: Number(data.confirmedToday) || 0,
            ticketMedio: Number(data.ticketMedio) || 0
        });
      } else {
        console.error("Erro API Stats:", resStats.status);
      }

      // 2. Busca Agenda (Com Proteção)
      const resAgenda = await fetch('http://localhost:3000/api/agendamentos/hoje');
      if (resAgenda.ok) {
        const data = await resAgenda.json();
        if (Array.isArray(data)) {
            const formatted = data.map((item: any) => ({
                ...item,
                time: item.time ? item.time.toString().slice(0, 5) : "--:--"
            }));
            setTodayAppointments(formatted);
        }
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      // Libera a tela mesmo se der erro
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickCheckin = async (id: number) => {
    try {
        await fetch(`http://localhost:3000/api/agendamentos/${id}/confirmar`, { method: 'PATCH' });
        fetchData(); 
    } catch (error) {
        console.error("Erro checkin", error);
    }
  };

  // TELA DE CARREGAMENTO (Evita o erro de "undefined")
  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-slate-400 gap-4">
            <Zap className="h-10 w-10 animate-bounce text-amber-400" /> 
            <p className="animate-pulse font-medium">Conectando ao Servidor...</p>
        </div>
    );
  }

  // --- DAQUI PRA BAIXO É O SEU LAYOUT ORIGINAL ---
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
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Dashboard <Zap className="h-6 w-6 text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-muted-foreground font-medium italic">
            Olá, {firstName}. Aqui está o resumo estratégico da sua clínica.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Clínica Aberta</span>
          </div>
          <Link to="/perfil">
            <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-slate-400 hover:text-primary gap-2">
              <UserCog className="h-3 w-3" />
              Editar CRO e Perfil
            </Button>
          </Link>
        </div>
      </div>

      {/* ALERTAS */}
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

      {/* CARDS PRINCIPAIS */}
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

      {/* ÁREA INFERIOR */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        
        {/* Gráficos de Barra */}
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

        {/* Lista de Próximos */}
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

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button 
                        size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 hover:bg-emerald-50"
                        onClick={() => window.open(`https://wa.me/5582999999999?text=Olá ${app.patient}, confirmamos seu horário`)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      
                      {app.status !== 'confirmed' && (
                        <Button 
                          size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/5"
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