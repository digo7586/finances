// events.js
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const description = document.getElementById("description").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  let category = categorySelect.value === "Outro" 
    ? (categoryOtherInput.value || "").trim() 
    : categorySelect.value;

  const recurringValue = document.getElementById("recurring").value;
  let monthsToRepeat = 0;
  if (recurringValue === "custom") {
    monthsToRepeat = parseInt(document.getElementById("recurring-count").value) || 0;
  } else if (recurringValue !== "none") {
    monthsToRepeat = parseInt(recurringValue);
  }

  if (!date || !description || !amount || !type || !category) {
    alert("Preencha todos os campos.");
    return;
  }

  const typeLabels = { income: "Receita", fixed: "Despesa fixa", variable: "Despesa variável", extra: "Renda extra" };

  const baseTransaction = {
    id: Date.now(),
    date,
    description,
    amount,
    type,
    typeLabel: typeLabels[type] || type,
    category,
  };

  if (editingId !== null) {
    transactions = transactions.map(t => t.id === editingId ? { ...baseTransaction, id: editingId } : t);
  } else {
    transactions.push(baseTransaction);
    if (monthsToRepeat > 0) {
      addRecurringTransactions(baseTransaction, monthsToRepeat);  // função do core.js
    }
  }

  saveToStorage();
  currentPageIncome = currentPageFixed = currentPageVariable = 1;
  updateUI();

  editingId = null;
  form.reset();
  document.getElementById("recurring-count").style.display = "none";

  const submitBtn = form.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.textContent = "Adicionar";
});

// Filtro de mês, paginação, ordenação (mantidos do original)
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

// ... (mantenha o resto do seu events.js original: paginação, setupSortHeaders, etc.)
setupSortHeaders();
updateUI();
