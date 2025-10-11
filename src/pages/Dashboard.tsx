import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Receita do Mês",
      value: "R$ 45.230",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Despesas do Mês",
      value: "R$ 18.940",
      change: "-3.2%",
      trend: "down",
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Lucro Líquido",
      value: "R$ 26.290",
      change: "+18.7%",
      trend: "up",
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Pacientes Ativos",
      value: "156",
      change: "+8",
      trend: "up",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua clínica odontológica
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-card hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className={`text-xs ${stat.trend === 'up' ? 'text-secondary' : 'text-destructive'}`}>
                  {stat.change} em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Janeiro</span>
                <div className="flex gap-2">
                  <div className="bg-primary h-8 rounded" style={{ width: '120px' }} />
                  <div className="bg-destructive/50 h-8 rounded" style={{ width: '60px' }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fevereiro</span>
                <div className="flex gap-2">
                  <div className="bg-primary h-8 rounded" style={{ width: '140px' }} />
                  <div className="bg-destructive/50 h-8 rounded" style={{ width: '55px' }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Março</span>
                <div className="flex gap-2">
                  <div className="bg-primary h-8 rounded" style={{ width: '150px' }} />
                  <div className="bg-destructive/50 h-8 rounded" style={{ width: '63px' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { patient: "Maria Silva", time: "09:00", procedure: "Limpeza" },
                { patient: "João Santos", time: "10:30", procedure: "Restauração" },
                { patient: "Ana Costa", time: "14:00", procedure: "Consulta" },
                { patient: "Pedro Lima", time: "15:30", procedure: "Clareamento" },
              ].map((appointment, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{appointment.patient}</p>
                    <p className="text-sm text-muted-foreground">{appointment.procedure}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">{appointment.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
