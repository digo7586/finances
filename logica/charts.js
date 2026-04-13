// ========= charts & summary =========

function calcSummary() {
  const filteredList = getFilteredTransactions();

  let incomeMonth = 0, fixedMonth = 0, variableMonth = 0, extraMonth = 0;

  filteredList.forEach(t => {
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

  return { totalReceitas: totalReceitasMes, totalDespesas: totalDespesasMes, balanceTotal };
}

function buildCategoryChart() {
  const canvas = document.getElementById("categoryChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const byCategory = {};
  const list = getFilteredTransactions();

  list.filter(t => t.type === "fixed" || t.type === "variable")
      .forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });

  const labels = Object.keys(byCategory);
  const data = Object.values(byCategory);

  if (categoryChart) categoryChart.destroy();
  if (!labels.length) return;

  const total = data.reduce((a, b) => a + b, 0);

  categoryChart = new Chart(ctx, {
    type: "pie",
    data: { labels, datasets: [{ data, backgroundColor: ["#f97316","#ef4444","#22c55e","#3b82f6","#a855f7","#eab308","#14b8a6"] }] },
    options: {
      plugins: {
        datalabels: {
          color: "#020617",
          font: { weight: "bold", size: 11 },
          formatter: (value) => `${((value / total) * 100).toFixed(1)}%`
        }
      }
    }
  });
}

function getSelectedMonthLabel() {
  if (!currentMonthFilter) return "Todos os meses";
  const [year, month] = currentMonthFilter.split("-");
  return `\( {month}/ \){year}`;
}

function buildMonthChart() {
  const monthLabel = getSelectedMonthLabel();
  const canvas = document.getElementById("monthChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const list = getFilteredTransactions();
  let income = 0, expense = 0;

  list.forEach(t => {
    if (t.type === "income" || t.type === "extra") income += t.amount;
    else expense += t.amount;
  });

  if (monthChart) monthChart.destroy();
  if (!list.length) return;

  monthChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [monthLabel],
      datasets: [
        { label: "Receitas", data: [income], backgroundColor: "#22c55e" },
        { label: "Despesas", data: [expense], backgroundColor: "#ef4444" }
      ]
    },
    options: { responsive: true, plugins: { legend: { labels: { color: "#8ea1f5" } } } }
  });
}

// ========= updateUI =========
function updateUI() {
  const label = getSelectedMonthLabel();
  document.getElementById("month-chart-title").textContent = `Receitas x Despesas (${label})`;

  renderTransactions();
  const summary = calcSummary();
  buildCategoryChart();
  buildMonthChart();
  renderGoals();

  if (summaryTextMain) {
    const { totalReceitas, totalDespesas, balanceTotal } = summary;
    if (!totalReceitas && !totalDespesas) {
      summaryTextMain.textContent = "Comece adicionando suas receitas e despesas para ver um resumo do mês.";
    } else {
      // (resumo textual mantido igual ao seu original)
      const percGasto = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;
      summaryTextMain.textContent = `Você está gastando ${percGasto.toFixed(1)}% da sua renda este mês. Saldo: ${formatMoney(balanceTotal)}`;
    }
  }
}
