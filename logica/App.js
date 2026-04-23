// ========= core/theme =========

const htmlTag = document.documentElement;
const themeToggleBtn = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light" || savedTheme === "dark") {
  htmlTag.setAttribute("data-theme", savedTheme);
}

function updateToggleIcon() {
  const current = htmlTag.getAttribute("data-theme") || "light";
  themeToggleBtn.textContent = current === "dark" ? "🌙" : "☀️";
}

updateToggleIcon();

themeToggleBtn.addEventListener("click", () => {
  const current =
    htmlTag.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  htmlTag.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateToggleIcon();
});

const recurrenceSelect = document.getElementById("recurrence");
const recurrenceCustom = document.getElementById("recurrence-custom");

if (recurrenceSelect && recurrenceCustom) {
  recurrenceSelect.addEventListener("change", () => {
    recurrenceCustom.style.display =
      recurrenceSelect.value === "custom" ? "block" : "none";
  });
}

// ========= core/state & elements =========

// Transações e metas
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let goals = JSON.parse(localStorage.getItem("goals") || "[]");
let editingId = null; // id da transação em edição

const categorySelect = document.getElementById("category-select");
const categoryOtherInput = document.getElementById("category-other");
const summaryTextMain = document.getElementById("summary-text-main");

const elTotalIncome = document.getElementById("total-income");
const elTotalFixed = document.getElementById("total-fixed");
const elTotalVariable = document.getElementById("total-variable");
const elTotalExtra = document.getElementById("total-extra");
const elBalance = document.getElementById("balance");

const form = document.getElementById("transaction-form");
const tbodyIncome = document.getElementById("transactions-income");
const tbodyFixed = document.getElementById("transactions-fixed");
const tbodyVariable = document.getElementById("transactions-variable");

const monthFilterInput = document.getElementById("month-filter");
const clearMonthBtn = document.getElementById("clear-month");
const paginationIncome = document.getElementById("pagination-income");
const paginationFixed = document.getElementById("pagination-fixed");
const paginationVariable = document.getElementById("pagination-variable");
const monthChartTitle = document.getElementById("month-chart-title");

// elementos de metas
const goalForm = document.getElementById("goal-form");
const goalsListEl = document.getElementById("goals-list");

let categoryChart;
let monthChart;

const PAGE_SIZE = 10;
let currentPageIncome = 1;
let currentPageFixed = 1;
let currentPageVariable = 1;

// mês atual filtrado: "YYYY-MM" ou "" (sem filtro)
let currentMonthFilter = "";

// configuração de ordenação
let sortConfig = {
  column: "date",
  direction: "desc",
};

// registra plugin de datalabels
if (typeof Chart !== "undefined" && Chart.hasOwnProperty("register")) {
  Chart.register(ChartDataLabels);
}

// ========= core/messages & helpers =========

const messages = {
  errors: {
    fillAllFields: "Preencha todos os campos.",
    fillValidValue: "Informe um valor válido.",
    metaRequired: "Informe pelo menos o nome e o valor alvo da meta.",
    noPrevRecurring:
      "Não encontrei despesas fixas recorrentes no mês anterior.",
    selectTargetMonth:
      "Selecione um mês no filtro para onde você quer gerar as despesas.",
    invalidTargetMonth: "Mês destino inválido.",
  },
  confirm: {
    removeGoal: "Remover esta meta? Os dados serão perdidos.",
    duplicateMonthExists:
      "Já existem despesas fixas neste mês. Deseja mesmo duplicar do mês anterior?",
  },
  info: {
    noGoals: "Nenhuma meta cadastrada ainda.",
    startSummary:
      "Comece adicionando suas receitas e despesas para ver um resumo do mês.",
    duplicateMonthDone: (qtd) =>
      `${qtd} despesa(s) fixa(s) recorrente(s) foram adicionadas para o mês selecionado.`,
  },
};

function showAlert(key) {
  alert(messages.errors[key] || messages.info[key] || "Algo deu errado.");
}

function showConfirm(key) {
  return confirm(messages.confirm[key] || "Tem certeza?");
}

function createButton({ text, className, onClick }) {
  const btn = document.createElement("button");
  btn.textContent = text;
  if (className) btn.className = className;
  if (onClick) btn.onclick = onClick;
  return btn;
}

// ========= core/util =========

if (categorySelect && categoryOtherInput) {
  categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "Outro") {
      categoryOtherInput.style.display = "block";
      categoryOtherInput.focus();
    } else {
      categoryOtherInput.style.display = "none";
      categoryOtherInput.value = "";
    }
  });
}

function formatMoney(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// para usar depois com máscara de moeda, se quiser
function parseBRLMoney(input) {
  if (!input) return 0;
  const cleaned = input
    .toString()
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Number(cleaned) || 0;
}

function saveToStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveGoalsToStorage() {
  localStorage.setItem("goals", JSON.stringify(goals));
}

function getFilteredTransactions() {
  if (!currentMonthFilter) return transactions;
  return transactions.filter((t) => {
    if (!t.date) return false;
    const [year, month] = t.date.split("-");
    if (!year || !month) return false;
    const key = `${year}-${month}`;
    return key === currentMonthFilter;
  });
}

function getAllTransactions() {
  return transactions;
}

function sortTransactions(list) {
  const { column, direction } = sortConfig;
  const sorted = [...list];

  sorted.sort((a, b) => {
    let va, vb;

    switch (column) {
      case "description":
        va = a.description.toLowerCase();
        vb = b.description.toLowerCase();
        break;
      case "type":
        va = a.type.toLowerCase();
        vb = b.type.toLowerCase();
        break;
      case "category":
        va = a.category.toLowerCase();
        vb = b.category.toLowerCase();
        break;
      case "amount":
        va = a.amount;
        vb = b.amount;
        break;
      case "date":
      default:
        if (a.date === b.date) {
          va = a.id;
          vb = b.id;
        } else {
          va = a.date;
          vb = b.date;
        }
        break;
    }

    if (va < vb) return direction === "asc" ? -1 : 1;
    if (va > vb) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

function paginate(array, page, pageSize) {
  const total = array.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    pageItems: array.slice(start, end),
    total,
    totalPages,
    page: safePage,
  };
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generateRecurrenceGroupId() {
  return "rec_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}



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
  
  const totalDespesas = fixedMonth + variableMonth;

// atualiza o novo card
const elTotalExpenses = document.getElementById("total-expenses");
if (elTotalExpenses) {
  elTotalExpenses.textContent = formatMoney(totalDespesas);
}
  
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
          labels: { color: "#8ea1f5" },
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
        x: { ticks: { color: "#8ea1f5" } },
        y: { ticks: { color: "#8ea1f5" } },
      },
      plugins: {
        legend: {
          labels: { color: "#8ea1f5" },
          padding: 20,
        },
        datalabels: {
          anchor: "end",
          align: "start",
          offset: -10,
          color: "#8ea1f5",
          font: { size: 10, weight: "boldered"},
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


// ========= events/forms =========

// transações
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const description = document
    .getElementById("description")
    .value.trim();
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  let category = "";
  if (categorySelect.value === "Outro") {
    category = (categoryOtherInput.value || "").trim();
  } else {
    category = categorySelect.value;
  }

  if (!date || !description || !amount || !type || !category) {
    showAlert("fillAllFields");
    return;
  }

  const typeLabels = {
    income: "Receita",
    fixed: "Despesa fixa",
    variable: "Despesa variável",
    extra: "Renda extra",
  };

  if (editingId !== null) {
    // EDITAR
    transactions = transactions.map((t) =>
      t.id === editingId
        ? {
            ...t,
            date,
            description,
            amount,
            type,
            typeLabel: typeLabels[type] || type,
            category,
          }
        : t
    );
  } else {

  const recurrence = recurrenceSelect ? recurrenceSelect.value : "none";
  let months = 1;

  if (recurrence === "6") months = 6;
  else if (recurrence === "12") months = 12;
  else if (recurrence === "custom") {
    months = Number(recurrenceCustom.value) || 1;
  }

  const groupId = months > 1 ? generateRecurrenceGroupId() : null;

  for (let i = 0; i < months; i++) {

    const newTransaction = {
      id: Date.now() + i,
      date: addMonths(date, i),
      description,
      amount,
      type,
      typeLabel: typeLabels[type] || type,
      category,
      recurrenceId: groupId,
      recurrenceIndex: i
    };

    transactions.push(newTransaction);

  }

}

  saveToStorage();
  currentPageIncome = currentPageFixed = currentPageVariable = 1;
  updateUI();

  // volta para modo "novo"
  editingId = null;
  form.reset();
  const submitBtn = form.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.textContent = "Adicionar";

  const formSection = document.querySelector(".form-section");
  if (formSection) {
    formSection.classList.remove("editing");
  }
});

// metas
const goalNameInput = document.getElementById("goal-name");
const goalTargetInput = document.getElementById("goal-target");
const goalInitialInput = document.getElementById("goal-initial");

// metas
if (goalForm && goalNameInput && goalTargetInput && goalInitialInput) {
  goalForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = goalNameInput.value.trim();
    const target = Number((goalTargetInput.value || "0").replace(",", "."));
    const initial = Number((goalInitialInput.value || "0").replace(",", "."));

    if (!name || !target || target <= 0) {
      showAlert("metaRequired");
      return;
    }

    const newGoal = {
      id: Date.now(),
      name,
      target,
      current: initial || 0,
    };

    goals.push(newGoal);
    saveGoalsToStorage();
    renderGoals();
    goalForm.reset();
  });
}


// filtro de mês
monthFilterInput.addEventListener("change", () => {
  currentMonthFilter = monthFilterInput.value;
  currentPageIncome = currentPageFixed = currentPageVariable = 1;
  updateUI();
});

clearMonthBtn.addEventListener("click", () => {
  currentMonthFilter = "";
  monthFilterInput.value = "";
  currentPageIncome = currentPageFixed = currentPageVariable = 1;
  updateUI();
});

// paginação
paginationIncome
  .querySelector('button[data-role="prev"]')
  .addEventListener("click", () => {
    currentPageIncome = Math.max(1, currentPageIncome - 1);
    renderTransactions();
  });

paginationIncome
  .querySelector('button[data-role="next"]')
  .addEventListener("click", () => {
    currentPageIncome += 1;
    renderTransactions();
  });

paginationFixed
  .querySelector('button[data-role="prev"]')
  .addEventListener("click", () => {
    currentPageFixed = Math.max(1, currentPageFixed - 1);
    renderTransactions();
  });

paginationFixed
  .querySelector('button[data-role="next"]')
  .addEventListener("click", () => {
    currentPageFixed += 1;
    renderTransactions();
  });

paginationVariable
  .querySelector('button[data-role="prev"]')
  .addEventListener("click", () => {
    currentPageVariable = Math.max(1, currentPageVariable - 1);
    renderTransactions();
  });

paginationVariable
  .querySelector('button[data-role="next"]')
  .addEventListener("click", () => {
    currentPageVariable += 1;
    renderTransactions();
  });

// ordenação
function setupSortHeaders() {
  const headers = document.querySelectorAll(
    ".transactions-section th[data-sort]"
  );

  headers.forEach((th) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      const col = th.getAttribute("data-sort");
      if (sortConfig.column === col) {
        sortConfig.direction =
          sortConfig.direction === "asc" ? "desc" : "asc";
      } else {
        sortConfig.column = col;
        sortConfig.direction = "desc";
      }

      currentPageIncome = currentPageFixed = currentPageVariable = 1;
      renderTransactions();
    });
  });
}

setupSortHeaders();
updateUI();


// ====================== EXPORTAR E IMPORTAR DADOS ======================

// Exportar dados
const exportBtn = document.getElementById("export-data");
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const dataToExport = {
      transactions: transactions,
      goals: goals,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `minhas-financas-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
      title: "Backup criado com sucesso!",
      text: "O arquivo foi baixado.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false
    });
  });
}

// Importar dados
const importBtn = document.getElementById("import-data");
const importFileInput = document.getElementById("import-file");

if (importBtn && importFileInput) {
  importBtn.addEventListener("click", () => {
    importFileInput.click();
  });

  importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const importedData = JSON.parse(event.target.result);

        if (!importedData.transactions || !importedData.goals) {
          throw new Error("Arquivo inválido");
        }

        Swal.fire({
          title: "Importar dados?",
          html: "Isso vai <strong>sobrescrever</strong> todas as transações e metas atuais.<br><br>Deseja continuar?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sim, importar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#ef4444"
        }).then((result) => {
          if (result.isConfirmed) {
            transactions = importedData.transactions || [];
            goals = importedData.goals || [];

            saveToStorage();
            saveGoalsToStorage();

            currentPageIncome = currentPageFixed = currentPageVariable = 1;
            updateUI();

            Swal.fire({
              title: "Importação concluída!",
              text: "Seus dados foram carregados com sucesso.",
              icon: "success"
            });
          }
        });

      } catch (error) {
        Swal.fire({
          title: "Erro",
          text: "O arquivo selecionado não é válido.",
          icon: "error"
        });
      }
    };

    reader.readAsText(file);
    importFileInput.value = ""; // permite importar o mesmo arquivo novamente
  });
}

// ========= ui/goals =========

function renderGoals() {
  if (!goalsListEl) return;
  goalsListEl.innerHTML = "";

  if (!goals.length) {
    const p = document.createElement("p");
    p.style.fontSize = "0.85rem";
    p.style.color = "#9ca3af";
    p.textContent = messages.info.noGoals;
    goalsListEl.appendChild(p);
    return;
  }

  goals.forEach((goal) => {
    const card = document.createElement("div");
    card.className = "goal-card";

    const header = document.createElement("div");
    header.className = "goal-header";

    const nameEl = document.createElement("div");
    nameEl.className = "goal-name";
    nameEl.textContent = goal.name;

    const valuesEl = document.createElement("div");
    valuesEl.className = "goal-values";
    valuesEl.textContent = `Alvo: ${formatMoney(
      goal.target
    )} | Atual: ${formatMoney(goal.current || 0)}`;

    header.appendChild(nameEl);
    header.appendChild(valuesEl);

    const barContainer = document.createElement("div");
    barContainer.className = "goal-progress-bar";

    const fill = document.createElement("div");
    fill.className = "goal-progress-fill";

    const perc =
      goal.target > 0 ? Math.min((goal.current || 0) / goal.target, 1) * 100 : 0;
    fill.style.width = `${perc.toFixed(2)}%`;

    barContainer.appendChild(fill);

    const footer = document.createElement("div");
    footer.className = "goal-footer";

    const percText = document.createElement("span");
    percText.textContent = `${perc.toFixed(1)}%`;

    const actions = document.createElement("div");
    actions.className = "goal-actions";

    const addBtn = createButton({
      text: "Aportar",
      onClick: () => {
        const valueStr = prompt("Valor do aporte nesta meta (R$):");
        if (!valueStr) return;
        const value = Number(valueStr.replace(",", "."));
        if (!value || value <= 0) {
          showAlert("fillValidValue");
          return;
        }
        goals = goals.map((g) =>
          g.id === goal.id ? { ...g, current: (g.current || 0) + value } : g
        );
        saveGoalsToStorage();
        renderGoals();
      },
    });

    const removeValueBtn = createButton({
      text: "Retirar",
      onClick: () => {
        const valueStr = prompt("Valor a retirar desta meta (R$):");
        if (!valueStr) return;
        const value = Number(valueStr.replace(",", "."));
        if (!value || value <= 0) {
          showAlert("fillValidValue");
          return;
        }
        goals = goals.map((g) => {
          if (g.id !== goal.id) return g;
          const atual = g.current || 0;
          const novo = Math.max(atual - value, 0);
          return { ...g, current: novo };
        });
        saveGoalsToStorage();
        renderGoals();
      },
    });

    const removeBtn = createButton({
  text: "✕",
  className: "btn-remove",
  onClick: () => {

    if (t.recurrenceId) {

      const removeAll = confirm(
        "Excluir TODAS as parcelas desta recorrência?\nCancelar = excluir apenas esta."
      );

      if (removeAll) {
        transactions = transactions.filter(
          x => x.recurrenceId !== t.recurrenceId
        );
      } else {
        transactions = transactions.filter(
          x => x.id !== t.id
        );
      }

    } else {

      transactions = transactions.filter(x => x.id !== t.id);

    }

    saveToStorage();
    updateUI();
  }
});

    actions.appendChild(addBtn);
    actions.appendChild(removeValueBtn);
    actions.appendChild(removeBtn);

    footer.appendChild(percText);
    footer.appendChild(actions);

    card.appendChild(header);
    card.appendChild(barContainer);
    card.appendChild(footer);

    goalsListEl.appendChild(card);
  });
}


// ========= ui/transactions (tabelas) =========

function renderTransactions() {
  tbodyIncome.innerHTML = "";
  tbodyFixed.innerHTML = "";
  tbodyVariable.innerHTML = "";

  const list = sortTransactions(getFilteredTransactions());

  const incomes = list.filter(
    (t) => t.type === "income" || t.type === "extra"
  );
  const fixeds = list.filter((t) => t.type === "fixed");
  const variables = list.filter((t) => t.type === "variable");

  const incomePage = paginate(incomes, currentPageIncome, PAGE_SIZE);
  currentPageIncome = incomePage.page;

  const fixedPage = paginate(fixeds, currentPageFixed, PAGE_SIZE);
  currentPageFixed = fixedPage.page;

  const variablePage = paginate(variables, currentPageVariable, PAGE_SIZE);
  currentPageVariable = variablePage.page;

  function createRow(t) {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = t.date;

    const descTd = document.createElement("td");
    descTd.textContent = t.description;

if (t.recurrenceId) {
  const icon = document.createElement("span");
  icon.textContent = " 🔁";
  descTd.appendChild(icon);
}

tr.addEventListener("dblclick", () => {

  if (!t.recurrenceId) return;

  const months = Number(prompt("Adicionar quantos meses?"));
  if (!months) return;

  const group = transactions.filter(x => x.recurrenceId === t.recurrenceId);
  const last = group[group.length - 1];

  for (let i = 1; i <= months; i++) {

    const newT = {
      ...last,
      id: Date.now() + i,
      date: addMonths(last.date, i),
      recurrenceIndex: last.recurrenceIndex + i
    };

    transactions.push(newT);
  }

  saveToStorage();
  updateUI();

});

    const typeTd = document.createElement("td");
    const span = document.createElement("span");
    span.textContent = t.typeLabel;
    span.classList.add("badge", `badge-${t.type}`);
    typeTd.appendChild(span);

    const catTd = document.createElement("td");
    catTd.textContent = t.category;

    const normalizedCategory = t.category
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    catTd.classList.add(`categoria-${normalizedCategory}`);

    const amountTd = document.createElement("td");
    amountTd.textContent = formatMoney(t.amount);
    amountTd.style.color =
      t.type === "income" || t.type === "extra" ? "#18bb54" : "#f97316";

    const actionTd = document.createElement("td");

    const editBtn = createButton({
      text: "✎",
      className: "btn-edit",
      onClick: () => {
        editingId = t.id;
        document.getElementById("date").value = t.date;
        document.getElementById("description").value = t.description;
        document.getElementById("amount").value = t.amount;
        document.getElementById("type").value = t.type;

        if (categorySelect && categoryOtherInput) {
          const optionsValues = Array.from(categorySelect.options).map(
            (o) => o.value
          );
          if (optionsValues.includes(t.category)) {
            categorySelect.value = t.category;
            categoryOtherInput.style.display = "none";
            categoryOtherInput.value = "";
          } else {
            categorySelect.value = "Outro";
            categoryOtherInput.style.display = "block";
            categoryOtherInput.value = t.category;
          }
        }

        const submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.textContent = "Salvar edição";

        const formSection = document.querySelector(".form-section");
        if (formSection) {
          formSection.classList.add("editing");
          formSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      },
    });

    const removeBtn = createButton({
      text: "✕",
      className: "btn-remove",
      onClick: () => {
        transactions = transactions.filter((x) => x.id !== t.id);
        saveToStorage();
        currentPageIncome = currentPageFixed = currentPageVariable = 1;
        updateUI();

        if (editingId === t.id) {
          editingId = null;
          form.reset();
          const submitBtn = form.querySelector("button[type='submit']");
          if (submitBtn) submitBtn.textContent = "Adicionar";
          const formSection = document.querySelector(".form-section");
          if (formSection) {
            formSection.classList.remove("editing");
          }
        }
      },
    });

    actionTd.appendChild(editBtn);
    actionTd.appendChild(removeBtn);

    tr.appendChild(dateTd);
    tr.appendChild(descTd);
    tr.appendChild(typeTd);
    tr.appendChild(catTd);
    tr.appendChild(amountTd);
    tr.appendChild(actionTd);

    return tr;
  }

  incomePage.pageItems.forEach((t) => tbodyIncome.appendChild(createRow(t)));
  fixedPage.pageItems.forEach((t) => tbodyFixed.appendChild(createRow(t)));
  variablePage.pageItems.forEach((t) =>
    tbodyVariable.appendChild(createRow(t))
  );

  // paginação entradas
  const incomePrev = paginationIncome.querySelector(
    'button[data-role="prev"]'
  );
  const incomeNext = paginationIncome.querySelector(
    'button[data-role="next"]'
  );
  const incomeInfo = paginationIncome.querySelector(
    'span[data-role="info"]'
  );

  incomePrev.disabled = incomePage.page <= 1;
  incomeNext.disabled = incomePage.page >= incomePage.totalPages;
  incomeInfo.textContent = `${incomePage.page} / ${incomePage.totalPages}`;

  // paginação fixas
  const fixedPrev = paginationFixed.querySelector('button[data-role="prev"]');
  const fixedNext = paginationFixed.querySelector('button[data-role="next"]');
  const fixedInfo = paginationFixed.querySelector('span[data-role="info"]');

  fixedPrev.disabled = fixedPage.page <= 1;
  fixedNext.disabled = fixedPage.page >= fixedPage.totalPages;
  fixedInfo.textContent = `${fixedPage.page} / ${fixedPage.totalPages}`;

  // paginação variáveis
  const varPrev = paginationVariable.querySelector(
    'button[data-role="prev"]'
  );
  const varNext = paginationVariable.querySelector(
    'button[data-role="next"]'
  );
  const varInfo = paginationVariable.querySelector(
    'span[data-role="info"]'
  );

  varPrev.disabled = variablePage.page <= 1;
  varNext.disabled = variablePage.page >= variablePage.totalPages;
  varInfo.textContent = `${variablePage.page} / ${variablePage.totalPages}`;
   updateTableTotals();

}


function updateTableTotals() {
  const tables = {
    income: 'transactions-income',
    fixed: 'transactions-fixed',
    variable: 'transactions-variable'
  };

  Object.entries(tables).forEach(([key, tbodyId]) => {
    const tbody = document.getElementById(tbodyId);
    const totalElement = document.getElementById(`total-${key}-table`);
    if (!tbody || !totalElement) return;

    let total = 0;
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
      const amountCell = row.querySelector('td:nth-child(5)');
      if (amountCell) {
        const amountText = amountCell.textContent || amountCell.innerText;
        const amount = parseFloat(
          amountText.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')
        ) || 0;
        total += amount;
      }
    });

    totalElement.textContent = `R$ ${total.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  });
    }
