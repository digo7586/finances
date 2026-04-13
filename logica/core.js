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
