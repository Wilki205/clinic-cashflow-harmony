import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const generateRobustPDF = async (userName: string, cro: string) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('pt-BR');
  
  // 1. Cabeçalho Profissional
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text("Relatório Estratégico Mensal", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Dentista: ${userName} | CRO: ${cro || 'Não informado'}`, 14, 30);
  doc.text(`Unidade: Recife - PE | Data de emissão: ${date}`, 14, 35);
  doc.line(14, 38, 196, 38);

  // 2. Captura do Gráfico (Busca o elemento pelo ID no Dashboard)
  const chartElement = document.getElementById('dashboard-chart');
  if (chartElement) {
    const canvas = await html2canvas(chartElement);
    const imgData = canvas.toDataURL('image/png');
    doc.text("Análise de Performance Operacional:", 14, 48);
    doc.addImage(imgData, 'PNG', 14, 52, 180, 60);
  }

  // 3. Resumo Financeiro (DRE)
  const financeData = JSON.parse(localStorage.getItem("@odonto:finance") || "[]");
  const totalIncome = financeData.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + t.amount, 0);
  const totalExpense = financeData.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0);

  autoTable(doc, {
    startY: chartElement ? 120 : 50,
    head: [['Indicador', 'Valor (R$)']],
    body: [
      ['Receita Total', totalIncome.toLocaleString('pt-BR')],
      ['Despesas Operacionais', totalExpense.toLocaleString('pt-BR')],
      ['Lucro Líquido', (totalIncome - totalExpense).toLocaleString('pt-BR')],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });

  // 4. Detalhamento de Custos
  doc.text("Detalhamento de Centros de Custo:", 14, (doc as any).lastAutoTable.finalY + 10);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    head: [['Data', 'Categoria', 'Descrição', 'Valor']],
    body: financeData.map((t: any) => [
      t.date,
      t.category,
      t.description,
      `R$ ${t.amount.toLocaleString('pt-BR')}`
    ]),
  });

  // Download do arquivo
  doc.save(`Relatorio_Odonto_${userName.replace(" ", "_")}.pdf`);
};