// ========= ui/transactions (tabelas) =========

function renderTransactions() {
  tbodyIncome.innerHTML = "";
  tbodyFixed.innerHTML = "";
  tbodyVariable.innerHTML = "";

  const list = sortTransactions(getFilteredTransactions());

  const incomes = list.filter(t => t.type === "income" || t.type === "extra");
  const fixeds = list.filter(t => t.type === "fixed");
  const variables = list.filter(t => t.type === "variable");

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
    amountTd.style.color = (t.type === "income" || t.type === "extra") ? "#18bb54" : "#f97316";

    const actionTd = document.createElement("td");

    // Botão Editar
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
          const options = Array.from(categorySelect.options).map(o => o.value);
          if (options.includes(t.category)) {
            categorySelect.value = t.category;
            categoryOtherInput.style.display = "none";
          } else {
            categorySelect.value = "Outro";
            categoryOtherInput.style.display = "block";
            categoryOtherInput.value = t.category;
          }
        }

        const submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.textContent = "Salvar edição";

        const formSection = document.querySelector(".goals-section:last-of-type");
        if (formSection) {
          formSection.classList.add("editing");
          formSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    });

    // Botão Replicar (novo)
    const replicateBtn = createButton({
      text: "📅",
      className: "btn-replicate",
      onClick: () => replicateTransaction(t)
    });

    // Botão Remover com opção de excluir todas recorrentes
    const removeBtn = createButton({
      text: "✕",
      className: "btn-remove",
      onClick: () => {
        const recurringGroup = findRecurringGroup(t);
        let removeAll = false;

        if (recurringGroup.length > 0) {
          removeAll = confirm(
            `Esta transação faz parte de uma série recorrente (${recurringGroup.length} outras encontradas).\n\n` +
            `Deseja excluir TODAS as transações com esta descrição, valor e tipo?\n\n` +
            `• OK = Excluir esta + todas as recorrentes\n` +
            `• Cancelar = Excluir apenas esta`
          );
        }

        if (removeAll) {
          const idsToRemove = [t.id, ...recurringGroup.map(x => x.id)];
          transactions = transactions.filter(x => !idsToRemove.includes(x.id));
          alert(`✅ ${idsToRemove.length} transações recorrentes foram excluídas.`);
        } else {
          transactions = transactions.filter(x => x.id !== t.id);
        }

        saveToStorage();
        currentPageIncome = currentPageFixed = currentPageVariable = 1;
        updateUI();

        if (editingId === t.id) {
          editingId = null;
          form.reset();
          const submitBtn = form.querySelector("button[type='submit']");
          if (submitBtn) submitBtn.textContent = "Adicionar";
        }
      }
    });

    actionTd.appendChild(editBtn);
    actionTd.appendChild(replicateBtn);
    actionTd.appendChild(removeBtn);

    tr.appendChild(dateTd);
    tr.appendChild(descTd);
    tr.appendChild(typeTd);
    tr.appendChild(catTd);
    tr.appendChild(amountTd);
    tr.appendChild(actionTd);

    return tr;
  }

  incomePage.pageItems.forEach(t => tbodyIncome.appendChild(createRow(t)));
  fixedPage.pageItems.forEach(t => tbodyFixed.appendChild(createRow(t)));
  variablePage.pageItems.forEach(t => tbodyVariable.appendChild(createRow(t)));

  // Atualiza paginação (código original mantido)
  updatePagination("income", incomePage);
  updatePagination("fixed", fixedPage);
  updatePagination("variable", variablePage);

  updateTableTotals();
}

function updatePagination(type, pageData) {
  const pagination = document.getElementById(`pagination-${type}`);
  if (!pagination) return;

  const prev = pagination.querySelector('button[data-role="prev"]');
  const next = pagination.querySelector('button[data-role="next"]');
  const info = pagination.querySelector('span[data-role="info"]');

  prev.disabled = pageData.page <= 1;
  next.disabled = pageData.page >= pageData.totalPages;
  info.textContent = `${pageData.page} / ${pageData.totalPages}`;
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
    tbody.querySelectorAll('tr').forEach(row => {
      const amountCell = row.querySelector('td:nth-child(5)');
      if (amountCell) {
        const text = amountCell.textContent || "";
        const value = parseFloat(text.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) || 0;
        total += value;
      }
    });

    totalElement.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  });
                   }
