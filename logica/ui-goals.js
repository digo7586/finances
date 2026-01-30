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
      text: "Remover",
      onClick: () => {
        if (!showConfirm("removeGoal")) return;
        goals = goals.filter((g) => g.id !== goal.id);
        saveGoalsToStorage();
        renderGoals();
      },
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