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
      t.type === "income" || t.type === "extra" ? "#4ade80" : "#f97316";

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
}