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
  const current = htmlTag.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  htmlTag.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateToggleIcon();
});

// ========= core/state =========
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let goals = JSON.parse(localStorage.getItem("goals") || "[]");
let editingId = null;

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

const PAGE_SIZE = 10;
let currentPageIncome = 1, currentPageFixed = 1, currentPageVariable = 1;
let currentMonthFilter = "";
let sortConfig = { column: "date", direction: "desc" };

if (typeof Chart !== "undefined") Chart.register(ChartDataLabels);

// ========= messages =========
const messages = {
  errors: { fillAllFields: "Preencha todos os campos.", fillValidValue: "Informe um valor válido." },
  confirm: { removeGoal: "Remover esta meta?", duplicateMonthExists: "Já existem despesas fixas neste mês. Deseja duplicar?" }
};

function showAlert(msg) { alert(msg); }
function showConfirm(msg) { return confirm(msg); }

function formatMoney(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function saveToStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveGoalsToStorage() {
  localStorage.setItem("goals", JSON.stringify(goals));
}

function getFilteredTransactions() {
  if (!currentMonthFilter) return transactions;
  return transactions.filter(t => {
    if (!t.date) return false;
    const key = t.date.substring(0, 7);
    return key === currentMonthFilter;
  });
}

// ========= RECORRÊNCIA =========
function addRecurringTransactions(baseTransaction, monthsToRepeat) {
  if (!monthsToRepeat || monthsToRepeat < 1) return;
  const maxMonths = Math.min(monthsToRepeat, 36);
  let currentDate = new Date(baseTransaction.date);
  for (let i = 1; i <= maxMonths; i++) {
    currentDate.setMonth(currentDate.getMonth() + 1);
    const newTrans = {
      ...baseTransaction,
      id: Date.now() + i + Math.floor(Math.random() * 9000),
      date: currentDate.toISOString().slice(0, 10)
    };
    transactions.push(newTrans);
  }
}

function findRecurringGroup(transaction) {
  const day = parseInt(transaction.date.split("-")[2]);
  return transactions.filter(t => {
    if (t.id === transaction.id) return false;
    if (t.description !== transaction.description) return false;
    if (t.type !== transaction.type) return false;
    if (t.category !== transaction.category) return false;
    if (Math.abs(t.amount - transaction.amount) > 0.01) return false;
    const tDay = parseInt(t.date.split("-")[2]);
    return Math.abs(tDay - day) <= 5;
  });
}

function replicateTransaction(transaction) {
  const targetMonth = prompt("Para qual mês replicar?\nFormato: YYYY-MM\nEx: 2026-06");
  if (!targetMonth) return;
  const match = targetMonth.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    alert("Formato inválido! Use YYYY-MM");
    return;
  }
  const [year, month] = match.slice(1);
  const day = transaction.date.split("-")[2] || "01";
  const newDate = `\( {year}- \){month}-${day}`;

  const copy = { ...transaction, id: Date.now(), date: newDate };
  transactions.push(copy);
  saveToStorage();
  updateUI();
  alert(`✅ Replicada para ${targetMonth}`);
}

// ========= Outras funções existentes (getAllTransactions, sortTransactions, paginate, etc.) =========
// (mantive as funções originais do seu código para não quebrar nada)
function getAllTransactions() { return transactions; }

function sortTransactions(list) {
  const { column, direction } = sortConfig;
  const sorted = [...list];
  sorted.sort((a, b) => {
    let va, vb;
    switch (column) {
      case "description": va = a.description.toLowerCase(); vb = b.description.toLowerCase(); break;
      case "type": va = a.type.toLowerCase(); vb = b.type.toLowerCase(); break;
      case "category": va = a.category.toLowerCase(); vb = b.category.toLowerCase(); break;
      case "amount": va = a.amount; vb = b.amount; break;
      case "date":
      default:
        va = a.date; vb = b.date; break;
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
  return { pageItems: array.slice(start, start + pageSize), total, totalPages, page: safePage };
}

// Mostrar/esconder campo personalizado
const recurringSelect = document.getElementById("recurring");
const recurringCountInput = document.getElementById("recurring-count");
if (recurringSelect && recurringCountInput) {
  recurringSelect.addEventListener("change", () => {
    recurringCountInput.style.display = recurringSelect.value === "custom" ? "block" : "none";
  });
}

// Category other
if (categorySelect && categoryOtherInput) {
  categorySelect.addEventListener("change", () => {
    categoryOtherInput.style.display = categorySelect.value === "Outro" ? "block" : "none";
  });
}
