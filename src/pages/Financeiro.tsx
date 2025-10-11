import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownCircle, ArrowUpCircle, Plus } from "lucide-react";

export default function Financeiro() {
  const transactions = {
    receitas: [
      { id: 1, description: "Consulta - Maria Silva", amount: 250, date: "15/03/2024" },
      { id: 2, description: "Limpeza - João Santos", amount: 180, date: "14/03/2024" },
      { id: 3, description: "Restauração - Ana Costa", amount: 450, date: "12/03/2024" },
    ],
    despesas: [
      { id: 1, description: "Material Odontológico", amount: 850, date: "10/03/2024", category: "Variável" },
      { id: 2, description: "Aluguel", amount: 3500, date: "05/03/2024", category: "Fixo" },
      { id: 3, description: "Energia Elétrica", amount: 320, date: "03/03/2024", category: "Variável" },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle suas receitas e despesas</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpCircle className="h-5 w-5 text-secondary" />
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">R$ 45.230</p>
            <p className="text-sm text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowDownCircle className="h-5 w-5 text-destructive" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">R$ 18.940</p>
            <p className="text-sm text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-gradient-primary">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">R$ 26.290</p>
            <p className="text-sm text-white/80">Lucro líquido</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="receitas" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>

        <TabsContent value="receitas" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Últimas Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.receitas.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                    <span className="text-lg font-bold text-secondary">
                      + R$ {transaction.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Últimas Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.despesas.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.date} • {transaction.category}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-destructive">
                      - R$ {transaction.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
