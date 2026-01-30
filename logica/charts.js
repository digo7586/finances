// ========= charts & summary =========

function calcSummary() {
  const filteredList = getFilteredTransactions();

  let incomeMonth = 0,
    fixedMonth = 0,
    variableMonth = 0,
    extraMonth = 0;

  filteredList.forEach((t) => {
    if (t.type === "income") incomeMonth += t.amount;
    if (t.type === "fixed") fixedMonth += t.amount;
    if (t.type === "variable") variableMonth += t.amount;
    if (t.type === "extra") extraMonth += t.amount;
  });

  const totalReceitasMes = incomeMonth + extraMonth;
  const totalDespesasMes = fixedMonth + variableMonth;
  const balanceTotal = totalReceitasMes - totalDespesasMes;

  elTotalIncome.textContent = formatMoney(totalReceitasMes);
  elTotalFixed.textContent = formatMoney(fixedMonth);
  elTotalVariable.textContent = formatMoney(variableMonth);
  elTotalExtra.textContent = formatMoney(extraMonth);
  elBalance.textContent = formatMoney(balanceTotal);

  const saldoCard = elBalance.parentElement;
  saldoCard.style.borderColor = balanceTotal < 0 ? "#ef4444" : "#22c55e";

  return {
    totalReceitas: totalReceitasMes,
    totalDespesas: totalDespesasMes,
    balanceTotal,
  };
}

function buildCategoryChart() {
  const canvas = document.getElementById("categoryChart");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  const byCategory = {};
  const list = getFilteredTransactions();

  list
    .filter((t) => t.type === "fixed" || t.type === "variable")
    .forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

  const labels = Object.keys(byCategory);
  const data = Object.values(byCategory);

  if (categoryChart) categoryChart.destroy();
  if (!labels.length) return;

  const total = data.reduce((acc, v) => acc + v, 0);

  const COLORS = [
    "#f97316",
    "#ef4444",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#eab308",
    "#14b8a6",
    "#ec4899",
    "#0ea5e9",
    "#facc15",
    "#6366f1",
    "#10b981",
    "#fb7185",
    "#f97373",
    "#8b5cf6",
  ];

  const colors = labels.map((_, i) => COLORS[i % COLORS.length]);

  categoryChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: { color: "#e5e7eb" },
        },
        datalabels: {
          color: "#020617",
          font: { weight: "bold", size: 11 },
          formatter: (value) => {
            const perc = (value / total) * 100;
            return `${perc.toFixed(1)}%`;
          },
        },
      },
    },
  });
}

function getSelectedMonthLabel() {
  if (!currentMonthFilter) return "Todos os meses";
  const [year, month] = currentMonthFilter.split("-");
  return `${month}/${year}`;
}

function buildMonthChart() {
  const monthLabel = getSelectedMonthLabel();
  const canvas = document.getElementById("monthChart");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  const list = getFilteredTransactions();
  let income = 0;
  let expense = 0;

  list.forEach((t) => {
    if (t.type === "income" || t.type === "extra") {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });

  if (monthChart) monthChart.destroy();
  if (!list.length) return;

  const totalMes = income + expense;

  monthChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [monthLabel],
      datasets: [
        { label: "Receitas", data: [income], backgroundColor: "#22c55e" },
        { label: "Despesas", data: [expense], backgroundColor: "#ef4444" },
      ],
    },
    options: {
      responsive: true,
      layout: { padding: { top: 20 } },
      scales: {
        x: { ticks: { color: "#e5e7eb" } },
        y: { ticks: { color: "#e5e7eb" } },
      },
      plugins: {
        legend: {
          labels: { color: "#e5e7eb" },
          padding: 20,
        },
        datalabels: {
          anchor: "end",
          align: "start",
          offset: -10,
          color: "#e5e7eb",
          font: { size: 10, weight: "bold" },
          formatter: (value) => {
            if (!totalMes) return "";
            const perc = (value / totalMes) * 100;
            return `${perc.toFixed(1)}%`;
          },
        },
      },
    },
  });
}

// ========= ui/update =========

function updateUI() {
  const label = getSelectedMonthLabel();
  if (monthChartTitle) {
    monthChartTitle.textContent = `Receitas x Despesas (${label})`;
  }

  renderTransactions();
  const summary = calcSummary();
  buildCategoryChart();
  buildMonthChart();
  renderGoals();

  if (summaryTextMain) {
    const { totalReceitas, totalDespesas, balanceTotal } = summary;

    if (!totalReceitas && !totalDespesas) {
      summaryTextMain.textContent = messages.info.startSummary;
    } else {
      const percGasto =
        totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;
      const percText = percGasto.toFixed(1).replace(".", ",");

      if (balanceTotal < 0) {
        summaryTextMain.textContent =
          `Você está gastando ${percText}% da sua renda este mês ` +
          `e fechando o período no vermelho (${formatMoney(balanceTotal)}).`;
      } else if (percGasto > 80) {
        summaryTextMain.textContent =
          `Você está gastando ${percText}% da sua renda este mês. ` +
          `O saldo ainda é positivo (${formatMoney(balanceTotal)}), ` +
          `mas as despesas estão bem altas.`;
      } else if (percGasto < 50) {
        summaryTextMain.textContent =
          `Você está gastando apenas ${percText}% da sua renda este mês ` +
          `e mantendo um bom controle das despesas.`;
      } else {
        summaryTextMain.textContent =
          `Você está gastando ${percText}% da sua renda este mês ` +
          `com saldo atual de ${formatMoney(balanceTotal)}.`;
      }
    }
  }
}