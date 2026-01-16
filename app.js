// Armazena as transações em memória
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

const elTotalIncome = document.getElementById("total-income");
const elTotalFixed = document.getElementById("total-fixed");
const elTotalVariable = document.getElementById("total-variable");
const elTotalExtra = document.getElementById("total-extra");
const elBalance = document.getElementById("balance");

const form = document.getElementById("transaction-form");
const tbodyIncome   = document.getElementById("transactions-income");
const tbodyFixed    = document.getElementById("transactions-fixed");
const tbodyVariable = document.getElementById("transactions-variable");

const monthFilterInput = document.getElementById("month-filter");
const clearMonthBtn = document.getElementById("clear-month");

const paginationIncome   = document.getElementById("pagination-income");
const paginationFixed    = document.getElementById("pagination-fixed");
const paginationVariable = document.getElementById("pagination-variable");
const monthChartTitle = document.getElementById("month-chart-title");

let categoryChart;
let monthChart;

const PAGE_SIZE = 10;
let currentPageIncome   = 1;
let currentPageFixed    = 1;
let currentPageVariable = 1;

// mês atual filtrado: "YYYY-MM" ou "" (sem filtro)
let currentMonthFilter = "";

// configuração de ordenação (para todas as tabelas)
let sortConfig = {
  column: "date",    // date | description | type | category | amount
  direction: "desc", // "asc" ou "desc"
};

// registra plugin de datalabels
if (typeof Chart !== "undefined" && Chart.hasOwnProperty("register")) {
  Chart.register(ChartDataLabels);
}

// Formatação de dinheiro
function formatMoney(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Salva transações
function saveToStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// retorna lista filtrada pelo mês
function getFilteredTransactions() {
  if (!currentMonthFilter) return transactions;

  return transactions.filter((t) => {
    if (!t.date) return false;
    const [year, month] = t.date.split("-");
    if (!year || !month) return false;
    const key = `${year}-${month}`; // "YYYY-MM"
    return key === currentMonthFilter;
  });
}

// ordena lista de acordo com sortConfig
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

// paginação genérica
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

// Renderiza tabelas (entradas, fixas, variáveis, com paginação)
function renderTransactions() {
  tbodyIncome.innerHTML = "";
  tbodyFixed.innerHTML = "";
  tbodyVariable.innerHTML = "";

  const list = sortTransactions(getFilteredTransactions());

  const incomes   = list.filter((t) => t.type === "income" || t.type === "extra");
  const fixeds    = list.filter((t) => t.type === "fixed");
  const variables = list.filter((t) => t.type === "variable");

  const incomePage   = paginate(incomes,   currentPageIncome,   PAGE_SIZE);
  currentPageIncome  = incomePage.page;

  const fixedPage    = paginate(fixeds,    currentPageFixed,    PAGE_SIZE);
  currentPageFixed   = fixedPage.page;

  const variablePage = paginate(variables, currentPageVariable, PAGE_SIZE);
  currentPageVariable = variablePage.page;

  function createRow(t) {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = t.date;

    const descTd = document.createElement("td");
    descTd.textContent = t.description;

    const typeTd = document.createElement("td");
    const span = document.createElement("span");
    span.textContent = t.typeLabel;
    span.classList.add("badge", `badge-${t.type}`);
    typeTd.appendChild(span);

    const catTd = document.createElement("td");
    catTd.textContent = t.category;
    const normalizedCategory = t.category
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    catTd.classList.add(`categoria-${normalizedCategory}`);

    const amountTd = document.createElement("td");
    amountTd.textContent = formatMoney(t.amount);
    amountTd.style.color =
      t.type === "income" || t.type === "extra" ? "#4ade80" : "#f97316";

    const actionTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.className = "btn-remove";
    btn.onclick = () => {
      transactions = transactions.filter((x) => x.id !== t.id);
      saveToStorage();
      currentPageIncome = currentPageFixed = currentPageVariable = 1;
      updateUI();
    };
    actionTd.appendChild(btn);

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
  variablePage.pageItems.forEach((t) => tbodyVariable.appendChild(createRow(t)));

  // paginação entradas
  const incomePrev = paginationIncome.querySelector('button[data-role="prev"]');
  const incomeNext = paginationIncome.querySelector('button[data-role="next"]');
  const incomeInfo = paginationIncome.querySelector('span[data-role="info"]');
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
  const varPrev = paginationVariable.querySelector('button[data-role="prev"]');
  const varNext = paginationVariable.querySelector('button[data-role="next"]');
  const varInfo = paginationVariable.querySelector('span[data-role="info"]');
  varPrev.disabled = variablePage.page <= 1;
  varNext.disabled = variablePage.page >= variablePage.totalPages;
  varInfo.textContent = `${variablePage.page} / ${variablePage.totalPages}`;
}

// Calcula totais
function calcSummary() {
  let income = 0;
  let fixed = 0;
  let variable = 0;
  let extra = 0;

  const list = getFilteredTransactions();

  list.forEach((t) => {
    if (t.type === "income") income += t.amount;
    if (t.type === "fixed") fixed += t.amount;
    if (t.type === "variable") variable += t.amount;
    if (t.type === "extra") extra += t.amount;
  });

  const totalReceitas = income + extra;
  const totalDespesas = fixed + variable;
  const balance = totalReceitas - totalDespesas;

  elTotalIncome.textContent = formatMoney(totalReceitas);
  elTotalFixed.textContent = formatMoney(fixed);
  elTotalVariable.textContent = formatMoney(variable);
  elTotalExtra.textContent = formatMoney(extra);
  elBalance.textContent = formatMoney(balance);

  const saldoCard = elBalance.parentElement;
  saldoCard.style.borderColor = balance < 0 ? "#ef4444" : "#22c55e";

  return { totalReceitas, totalDespesas };
}


// Gráfico de despesas por categoria (%)
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
    "#f97316","#ef4444","#22c55e","#3b82f6",
    "#a855f7","#eab308","#14b8a6","#ec4899",
    "#0ea5e9","#facc15","#6366f1","#10b981",
    "#fb7185","#f97373","#8b5cf6",
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


function getSelectedMonthLabel() {
  if (!currentMonthFilter) return "Todos os meses";
  const [year, month] = currentMonthFilter.split("-");
  return `${month}/${year}`;
}


// Gráfico Receita x Despesa do mês selecionado
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
        { label: "Receitas", data: [income],  backgroundColor: "#22c55e" },
        { label: "Despesas", data: [expense], backgroundColor: "#ef4444" },
      ],
    },
    options: {
      responsive: true,
      layout: {
        padding: {
          top: 20,   // espaço extra entre legenda e barras
        },
      },
      scales: {
        x: { ticks: { color: "#e5e7eb" } },
        y: { ticks: { color: "#e5e7eb" } },
      },
      plugins: {
        legend: {
          labels: { color: "#e5e7eb" },
          padding: 20,        // espaçamento interno da legenda
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


// Atualiza tudo
function updateUI() {
  const label = getSelectedMonthLabel();
  if (monthChartTitle) {
    monthChartTitle.textContent = `Receitas x Despesas (${label})`;
  }

  renderTransactions();
  calcSummary();
  buildCategoryChart();
  buildMonthChart();
}


// Submit do formulário
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const description = document.getElementById("description").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value.trim();

  if (!date || !description || !amount || !type || !category) {
    alert("Preencha todos os campos.");
    return;
  }

  const typeLabels = {
    income: "Receita",
    fixed: "Despesa fixa",
    variable: "Despesa variável",
    extra: "Renda extra",
  };

  const newTransaction = {
    id: Date.now(),
    date,
    description,
    amount,
    type,
    typeLabel: typeLabels[type] || type,
    category,
  };

  transactions.push(newTransaction);
  saveToStorage();
  currentPageIncome = currentPageFixed = currentPageVariable = 1;
  updateUI();
  form.reset();
});

// Filtro de mês
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

// Paginação entradas
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

// Paginação despesas fixas
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

// Paginação despesas variáveis
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

// Ordenação pelos cabeçalhos
function setupSortHeaders() {
  const headers = document.querySelectorAll(
    ".transactions-section th[data-sort]"
  );

  headers.forEach((th) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      const col = th.getAttribute("data-sort");

      if (sortConfig.column === col) {
        sortConfig.direction = sortConfig.direction === "asc" ? "desc" : "asc";
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
