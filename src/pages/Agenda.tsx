import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Plus } from "lucide-react";

export default function Agenda() {
  const appointments = [
    {
      id: 1,
      time: "09:00",
      patient: "Maria Silva",
      procedure: "Limpeza",
      dentist: "Dr. João",
      status: "confirmed",
    },
    {
      id: 2,
      time: "10:30",
      patient: "João Santos",
      procedure: "Restauração",
      dentist: "Dra. Ana",
      status: "confirmed",
    },
    {
      id: 3,
      time: "14:00",
      patient: "Ana Costa",
      procedure: "Consulta",
      dentist: "Dr. João",
      status: "pending",
    },
    {
      id: 4,
      time: "15:30",
      patient: "Pedro Lima",
      procedure: "Clareamento",
      dentist: "Dra. Ana",
      status: "confirmed",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">Gerencie seus agendamentos</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">4</p>
            <p className="text-sm text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-secondary" />
              Próximo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">09:00</p>
            <p className="text-sm text-muted-foreground">Maria Silva</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-accent" />
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">18</p>
            <p className="text-sm text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Agendamentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-bold text-primary">
                      {appointment.time}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{appointment.patient}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.procedure} • {appointment.dentist}
                    </p>
                  </div>
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      appointment.status === "confirmed"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {appointment.status === "confirmed" ? "Confirmado" : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
