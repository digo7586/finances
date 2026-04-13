// ========= ui/goals =========

function renderGoals() {
  if (!goalsListEl) return;
  goalsListEl.innerHTML = "";

  if (!goals.length) {
    const p = document.createElement("p");
    p.style.fontSize = "0.85rem";
    p.style.color = "#9ca3af";
    p.textContent = "Nenhuma meta cadastrada ainda.";
    goalsListEl.appendChild(p);
    return;
  }

  goals.forEach((goal) => {
    const card = document.createElement("div");
    card.className = "goal-card";

    const header = document.createElement("div");
    header.className = "goal-header";
    header.innerHTML = `
      <div class="goal-name">${goal.name}</div>
      <div class="goal-values">Alvo: ${formatMoney(goal.target)} | Atual: ${formatMoney(goal.current || 0)}</div>
    `;

    const barContainer = document.createElement("div");
    barContainer.className = "goal-progress-bar";
    const fill = document.createElement("div");
    fill.className = "goal-progress-fill";
    const perc = goal.target > 0 ? Math.min((goal.current || 0) / goal.target, 1) * 100 : 0;
    fill.style.width = `${perc.toFixed(2)}%`;
    barContainer.appendChild(fill);

    const footer = document.createElement("div");
    footer.className = "goal-footer";
    footer.innerHTML = `
      <span>${perc.toFixed(1)}%</span>
      <div class="goal-actions"></div>
    `;

    const actions = footer.querySelector(".goal-actions");

    const addBtn = createButton({ text: "Aportar", onClick: () => {
      const valueStr = prompt("Valor do aporte (R$):");
      if (!valueStr) return;
      const value = Number(valueStr.replace(",", "."));
      if (value > 0) {
        goals = goals.map(g => g.id === goal.id ? { ...g, current: (g.current || 0) + value } : g);
        saveGoalsToStorage();
        renderGoals();
      }
    }});

    const removeValueBtn = createButton({ text: "Retirar", onClick: () => {
      const valueStr = prompt("Valor a retirar (R$):");
      if (!valueStr) return;
      const value = Number(valueStr.replace(",", "."));
      if (value > 0) {
        goals = goals.map(g => {
          if (g.id !== goal.id) return g;
          return { ...g, current: Math.max((g.current || 0) - value, 0) };
        });
        saveGoalsToStorage();
        renderGoals();
      }
    }});

    const removeBtn = createButton({ text: "Remover", onClick: () => {
      if (confirm("Remover esta meta?")) {
        goals = goals.filter(g => g.id !== goal.id);
        saveGoalsToStorage();
        renderGoals();
      }
    }});

    actions.append(addBtn, removeValueBtn, removeBtn);

    card.append(header, barContainer, footer);
    goalsListEl.appendChild(card);
  });
          }
