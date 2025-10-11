import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, PieChart, BarChart3 } from "lucide-react";

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análises e insights da sua clínica</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatórios
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              DRE Gerencial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Receitas</span>
                <span className="font-bold text-secondary">R$ 45.230,00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">(-) Custos Variáveis</span>
                <span className="font-bold text-destructive">R$ 8.940,00</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Margem de Contribuição</span>
                <span className="font-bold">R$ 36.290,00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">(-) Custos Fixos</span>
                <span className="font-bold text-destructive">R$ 10.000,00</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-base font-bold">Lucro Líquido</span>
                <span className="text-lg font-bold text-primary">R$ 26.290,00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-secondary" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { category: "Material Odontológico", amount: 5200, percentage: 27 },
              { category: "Salários", amount: 8500, percentage: 45 },
              { category: "Aluguel", amount: 3500, percentage: 18 },
              { category: "Outros", amount: 1740, percentage: 10 },
            ].map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.category}</span>
                  <span className="text-muted-foreground">R$ {item.amount.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Rentabilidade por Procedimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { procedure: "Implante", revenue: 3500, cost: 1200, profit: 2300 },
              { procedure: "Clareamento", revenue: 800, cost: 150, profit: 650 },
              { procedure: "Restauração", revenue: 450, cost: 80, profit: 370 },
              { procedure: "Limpeza", revenue: 180, cost: 30, profit: 150 },
            ].map((item) => (
              <div key={item.procedure} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{item.procedure}</span>
                  <span className="text-sm font-bold text-secondary">
                    Lucro: R$ {item.profit.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Receita: R$ {item.revenue}</span>
                  <span>•</span>
                  <span>Custo: R$ {item.cost}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: "Janeiro", revenue: 38500, expenses: 16200 },
                { month: "Fevereiro", revenue: 42100, expenses: 17800 },
                { month: "Março", revenue: 45230, expenses: 18940 },
              ].map((item) => (
                <div key={item.month} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">{item.month}</span>
                    <span className="text-sm font-bold text-secondary">
                      Lucro: R$ {(item.revenue - item.expenses).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="h-8 rounded bg-primary/20 flex items-center px-2">
                        <span className="text-xs font-medium text-primary">
                          R$ {item.revenue}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="h-8 rounded bg-destructive/20 flex items-center px-2">
                        <span className="text-xs font-medium text-destructive">
                          R$ {item.expenses}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
