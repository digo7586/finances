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
    // NOVO
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
