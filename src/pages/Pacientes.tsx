import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function Pacientes() {
  const patients = [
    { id: 1, name: "Maria Silva", phone: "(11) 98765-4321", lastVisit: "15/03/2024" },
    { id: 2, name: "João Santos", phone: "(11) 97654-3210", lastVisit: "12/03/2024" },
    { id: 3, name: "Ana Costa", phone: "(11) 96543-2109", lastVisit: "10/03/2024" },
    { id: 4, name: "Pedro Lima", phone: "(11) 95432-1098", lastVisit: "08/03/2024" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie seus pacientes</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">{patient.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">Última consulta</p>
                  <p className="text-sm text-muted-foreground">{patient.lastVisit}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
