import { shuffle, formatEuro } from "./utils.js";

// Renders the final "wer hat gewonnen" picker and calls finish(winnerKey, note)
// with winnerKey in {'A','B','draw',null}.
function renderWinnerPicker(container, players, suggestion, finish) {
  const box = document.createElement("div");
  box.innerHTML = `
    <p style="margin-top:1.2rem;font-weight:600;">Wer hat diese Runde gewonnen?</p>
    <div class="winner-btns">
      <button data-key="A">${players[0]}</button>
      <button data-key="B">${players[1]}</button>
      <button data-key="draw">Unentschieden</button>
    </div>
    <p class="hint" style="margin-top:0.6rem;"><a href="#" id="skipResult">Später eintragen / überspringen</a></p>
  `;
  container.appendChild(box);
  box.querySelectorAll(".winner-btns button").forEach((btn) => {
    if (suggestion && btn.dataset.key === suggestion) btn.classList.add("chosen");
    btn.addEventListener("click", () => finish(btn.dataset.key, null));
  });
  box.querySelector("#skipResult").addEventListener("click", (e) => {
    e.preventDefault();
    finish(null, null);
  });
}

function progressLabel(i, n, noun) {
  const div = document.createElement("p");
  div.className = "progress-dots";
  div.textContent = `${noun} ${i + 1} von ${n}`;
  return div;
}

// --- Urlaubsbilder-Raten -----------------------------------------------
function playUrlaubsbilder(container, game, players, finish) {
  const items = shuffle(game.config.items || []);
  if (items.length === 0) {
    container.innerHTML = `<p class="hint">Für dieses Spiel wurden noch keine Fotos hinterlegt. Fügt zuerst Fotos über "Spiele verwalten" hinzu.</p>`;
    renderWinnerPicker(container, players, null, finish);
    return;
  }
  let i = 0;
  const tally = { A: 0, B: 0 };

  function renderStep() {
    container.innerHTML = "";
    const item = items[i];
    container.appendChild(progressLabel(i, items.length, "Foto"));
    const img = document.createElement("img");
    img.className = "play-image";
    img.src = item.image;
    container.appendChild(img);
    const p = document.createElement("p");
    p.textContent = "Wo und wann wurde dieses Foto aufgenommen? Sprecht laut eure Vermutung aus.";
    container.appendChild(p);

    const revealBtn = document.createElement("button");
    revealBtn.className = "btn btn-primary";
    revealBtn.textContent = "Auflösen";
    revealBtn.addEventListener("click", () => {
      const reveal = document.createElement("div");
      reveal.className = "reveal-box";
      reveal.innerHTML = `<strong>Ort:</strong> ${item.ort || "–"}<br><strong>Datum:</strong> ${item.datum || "–"}`;
      revealBtn.replaceWith(reveal);

      const choiceBox = document.createElement("div");
      choiceBox.innerHTML = `
        <p style="margin-top:0.8rem;">Wer lag näher dran?</p>
        <div class="winner-btns">
          <button data-k="A">${players[0]}</button>
          <button data-k="B">${players[1]}</button>
          <button data-k="tie">Beide gleich gut</button>
        </div>`;
      container.appendChild(choiceBox);
      choiceBox.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.dataset.k === "A") tally.A++;
          if (btn.dataset.k === "B") tally.B++;
          i++;
          if (i < items.length) renderStep();
          else finishRound();
        });
      });
    });
    container.appendChild(revealBtn);
  }

  function finishRound() {
    container.innerHTML = `<p>Runde beendet! Stand: <strong>${players[0]} ${tally.A}</strong> – <strong>${tally.B} ${players[1]}</strong></p>`;
    const suggestion = tally.A > tally.B ? "A" : tally.B > tally.A ? "B" : "draw";
    renderWinnerPicker(container, players, suggestion, finish);
  }

  renderStep();
}

// --- Freio-Bilder-Ranking ------------------------------------------------
function playFreio(container, game, players, finish) {
  const items = game.config.items || [];
  if (items.length < 2) {
    container.innerHTML = `<p class="hint">Für dieses Spiel werden mindestens zwei Fotos benötigt. Fügt zuerst Fotos über "Spiele verwalten" hinzu.</p>`;
    renderWinnerPicker(container, players, null, finish);
    return;
  }

  function rankingPhase(playerName, onDone) {
    let order = shuffle(items);
    container.innerHTML = "";
    const intro = document.createElement("p");
    intro.innerHTML = `<strong>${playerName}</strong> ist dran: Bringt die Bilder in eure Lieblingsreihenfolge (bestes zuerst).`;
    container.appendChild(intro);

    const list = document.createElement("ul");
    list.className = "rank-list";
    container.appendChild(list);

    function renderList() {
      list.innerHTML = "";
      order.forEach((item, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${idx + 1}.</span><img src="${item.image}"><span>${item.label || ""}</span>`;
        const btns = document.createElement("span");
        btns.className = "rank-btns";
        const up = document.createElement("button");
        up.textContent = "↑";
        up.disabled = idx === 0;
        up.addEventListener("click", () => {
          [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
          renderList();
        });
        const down = document.createElement("button");
        down.textContent = "↓";
        down.disabled = idx === order.length - 1;
        down.addEventListener("click", () => {
          [order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
          renderList();
        });
        btns.appendChild(up);
        btns.appendChild(down);
        li.appendChild(btns);
        list.appendChild(li);
      });
    }
    renderList();

    const doneBtn = document.createElement("button");
    doneBtn.className = "btn btn-primary";
    doneBtn.textContent = "Fertig";
    doneBtn.addEventListener("click", () => onDone(order));
    container.appendChild(doneBtn);
  }

  function handoverGate(nextPlayerName, onReady) {
    container.innerHTML = `
      <p class="hint">Bildschirm bitte an <strong>${nextPlayerName}</strong> übergeben.<br>
      (${players[0] === nextPlayerName ? players[1] : players[0]}, bitte kurz wegschauen 🙈)</p>`;
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = `${nextPlayerName} ist bereit`;
    btn.addEventListener("click", onReady);
    container.appendChild(btn);
  }

  rankingPhase(players[0], (orderA) => {
    handoverGate(players[1], () => {
      rankingPhase(players[1], (orderB) => {
        showComparison(orderA, orderB);
      });
    });
  });

  function showComparison(orderA, orderB) {
    container.innerHTML = `<h3>Eure Reihenfolgen im Vergleich</h3>`;
    const wrap = document.createElement("div");
    wrap.className = "ranking-compare";
    [
      [players[0], orderA],
      [players[1], orderB],
    ].forEach(([name, order]) => {
      const col = document.createElement("div");
      const h = document.createElement("strong");
      h.textContent = name;
      col.appendChild(h);
      const ol = document.createElement("ol");
      order.forEach((item) => {
        const li = document.createElement("li");
        const img = document.createElement("img");
        img.src = item.image;
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "6px";
        img.style.verticalAlign = "middle";
        img.style.marginRight = "0.4rem";
        li.appendChild(img);
        ol.appendChild(li);
      });
      col.appendChild(ol);
      wrap.appendChild(col);
    });
    container.appendChild(wrap);

    const topMatch = orderA[0]?.id === orderB[0]?.id;
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = topMatch
      ? "Ihr seid euch beim Favoriten einig! 🎉"
      : "Eure Favoriten unterscheiden sich – diskutiert, warum!";
    container.appendChild(note);

    renderWinnerPicker(container, players, null, finish);
  }
}

// --- Stuttgart-Quiz --------------------------------------------------------
function playStuttgartQuiz(container, game, players, finish) {
  const pool = shuffle(game.config.items || []);
  const items = pool.slice(0, Math.min(5, pool.length));
  if (items.length === 0) {
    container.innerHTML = `<p class="hint">Für dieses Quiz wurden noch keine Fragen hinterlegt. Fügt zuerst Fragen über "Spiele verwalten" hinzu.</p>`;
    renderWinnerPicker(container, players, null, finish);
    return;
  }
  let i = 0;
  const score = { A: 0, B: 0 };

  function renderStep() {
    container.innerHTML = "";
    const item = items[i];
    container.appendChild(progressLabel(i, items.length, "Frage"));
    const q = document.createElement("p");
    q.innerHTML = `<strong>${item.frage}</strong>`;
    container.appendChild(q);
    const optList = document.createElement("ul");
    optList.style.listStyle = "none";
    optList.style.padding = "0";
    (item.optionen || []).forEach((opt, idx) => {
      const li = document.createElement("li");
      li.textContent = `${String.fromCharCode(65 + idx)}) ${opt}`;
      li.dataset.idx = idx;
      li.style.padding = "0.3rem 0";
      optList.appendChild(li);
    });
    container.appendChild(optList);

    const revealBtn = document.createElement("button");
    revealBtn.className = "btn btn-primary";
    revealBtn.textContent = "Antwort aufdecken";
    revealBtn.addEventListener("click", () => {
      [...optList.children].forEach((li) => {
        if (Number(li.dataset.idx) === item.loesungIndex) {
          li.style.color = "var(--accent-3)";
          li.style.fontWeight = "700";
        }
      });
      revealBtn.remove();

      const choiceBox = document.createElement("div");
      choiceBox.innerHTML = `
        <p style="margin-top:0.8rem;">Wer hat richtig geantwortet?</p>
        <div class="winner-btns">
          <button data-k="A">${players[0]}</button>
          <button data-k="B">${players[1]}</button>
          <button data-k="both">Beide</button>
          <button data-k="none">Keiner</button>
        </div>`;
      container.appendChild(choiceBox);
      choiceBox.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.dataset.k === "A" || btn.dataset.k === "both") score.A++;
          if (btn.dataset.k === "B" || btn.dataset.k === "both") score.B++;
          i++;
          if (i < items.length) renderStep();
          else finishRound();
        });
      });
    });
    container.appendChild(revealBtn);
  }

  function finishRound() {
    container.innerHTML = `<p>Quiz beendet! Punktestand: <strong>${players[0]} ${score.A}</strong> – <strong>${score.B} ${players[1]}</strong></p>`;
    const suggestion = score.A > score.B ? "A" : score.B > score.A ? "B" : "draw";
    renderWinnerPicker(container, players, suggestion, finish);
  }

  renderStep();
}

// --- Durak-Duell -------------------------------------------------------
function playDurak(container, game, players, finish) {
  container.innerHTML = `<p>${game.description || "Spielt eine Partie Durak zu zweit."}</p>
    <p class="hint">Wenn ihr fertig gespielt habt, tragt hier den Sieger ein.</p>`;
  renderWinnerPicker(container, players, null, finish);
}

// --- Was kostet das? -----------------------------------------------------
function playPreisschaetzen(container, game, players, finish) {
  const items = shuffle(game.config.items || []);
  if (items.length === 0) {
    container.innerHTML = `<p class="hint">Für dieses Spiel wurden noch keine Gegenstände hinterlegt. Fügt zuerst Einträge über "Spiele verwalten" hinzu.</p>`;
    renderWinnerPicker(container, players, null, finish);
    return;
  }
  let i = 0;
  const tally = { A: 0, B: 0 };

  function renderStep() {
    container.innerHTML = "";
    const item = items[i];
    container.appendChild(progressLabel(i, items.length, "Gegenstand"));
    if (item.image) {
      const img = document.createElement("img");
      img.className = "play-image";
      img.src = item.image;
      container.appendChild(img);
    }
    const name = document.createElement("p");
    name.innerHTML = `<strong>${item.name}</strong> – was kostet das?`;
    container.appendChild(name);

    const form = document.createElement("div");
    form.className = "item-row";
    form.innerHTML = `
      <label>${players[0]} schätzt (€)<input type="number" step="any" id="guessA"></label>
      <label>${players[1]} schätzt (€)<input type="number" step="any" id="guessB"></label>
    `;
    container.appendChild(form);

    const revealBtn = document.createElement("button");
    revealBtn.className = "btn btn-primary";
    revealBtn.textContent = "Preis aufdecken";
    revealBtn.addEventListener("click", () => {
      const guessA = parseFloat(form.querySelector("#guessA").value);
      const guessB = parseFloat(form.querySelector("#guessB").value);
      const actual = parseFloat(item.preis) || 0;
      const reveal = document.createElement("div");
      reveal.className = "reveal-box";
      reveal.innerHTML = `<strong>Tatsächlicher Preis:</strong> ${formatEuro(actual)}`;
      revealBtn.replaceWith(reveal);

      let winner = "tie";
      if (!isNaN(guessA) && !isNaN(guessB)) {
        const diffA = Math.abs(actual - guessA);
        const diffB = Math.abs(actual - guessB);
        winner = diffA < diffB ? "A" : diffB < diffA ? "B" : "tie";
      } else if (!isNaN(guessA)) winner = "A";
      else if (!isNaN(guessB)) winner = "B";

      const resultP = document.createElement("p");
      resultP.textContent =
        winner === "tie"
          ? "Gleichstand bei dieser Runde!"
          : `${winner === "A" ? players[0] : players[1]} lag näher dran!`;
      container.appendChild(resultP);
      if (winner !== "tie") tally[winner]++;

      const nextBtn = document.createElement("button");
      nextBtn.className = "btn btn-primary";
      nextBtn.textContent = i < items.length - 1 ? "Weiter" : "Runde abschließen";
      nextBtn.addEventListener("click", () => {
        i++;
        if (i < items.length) renderStep();
        else finishRound();
      });
      container.appendChild(nextBtn);
    });
    container.appendChild(revealBtn);
  }

  function finishRound() {
    container.innerHTML = `<p>Runde beendet! Punktestand: <strong>${players[0]} ${tally.A}</strong> – <strong>${tally.B} ${players[1]}</strong></p>`;
    const suggestion = tally.A > tally.B ? "A" : tally.B > tally.A ? "B" : "draw";
    renderWinnerPicker(container, players, suggestion, finish);
  }

  renderStep();
}

// --- Fußballergebnisse-Quiz ----------------------------------------------
function playFussballQuiz(container, game, players, finish) {
  const items = shuffle(game.config.items || []);
  if (items.length === 0) {
    container.innerHTML = `<p class="hint">Für dieses Quiz wurden noch keine Spiele hinterlegt. Fügt zuerst Einträge über "Spiele verwalten" hinzu.</p>`;
    renderWinnerPicker(container, players, null, finish);
    return;
  }
  let i = 0;
  const tally = { A: 0, B: 0 };

  function renderStep() {
    container.innerHTML = "";
    const item = items[i];
    container.appendChild(progressLabel(i, items.length, "Spiel"));
    const info = document.createElement("p");
    info.innerHTML = `<strong>vs. ${item.gegner}</strong>${item.datum ? " – " + item.datum : ""}${item.wettbewerb ? ` (${item.wettbewerb})` : ""}`;
    container.appendChild(info);
    const q = document.createElement("p");
    q.textContent = "Wie ist das Spiel ausgegangen? Ratet das Ergebnis.";
    container.appendChild(q);

    const form = document.createElement("div");
    form.className = "item-row";
    form.innerHTML = `
      <label>${players[0]}: eigenes:gegner<br>
        <input type="number" min="0" step="1" id="hA" style="width:45%;display:inline-block;">
        :
        <input type="number" min="0" step="1" id="gA" style="width:45%;display:inline-block;">
      </label>
      <label>${players[1]}: eigenes:gegner<br>
        <input type="number" min="0" step="1" id="hB" style="width:45%;display:inline-block;">
        :
        <input type="number" min="0" step="1" id="gB" style="width:45%;display:inline-block;">
      </label>
    `;
    container.appendChild(form);

    const revealBtn = document.createElement("button");
    revealBtn.className = "btn btn-primary";
    revealBtn.textContent = "Ergebnis aufdecken";
    revealBtn.addEventListener("click", () => {
      const hA = parseInt(form.querySelector("#hA").value, 10);
      const gA = parseInt(form.querySelector("#gA").value, 10);
      const hB = parseInt(form.querySelector("#hB").value, 10);
      const gB = parseInt(form.querySelector("#gB").value, 10);
      const actualH = parseInt(item.ergebnisHeim, 10) || 0;
      const actualG = parseInt(item.ergebnisGegner, 10) || 0;

      const reveal = document.createElement("div");
      reveal.className = "reveal-box";
      reveal.innerHTML = `<strong>Tatsächliches Ergebnis:</strong> ${actualH}:${actualG}`;
      revealBtn.replaceWith(reveal);

      const diffA = (isNaN(hA) ? 99 : Math.abs(actualH - hA)) + (isNaN(gA) ? 99 : Math.abs(actualG - gA));
      const diffB = (isNaN(hB) ? 99 : Math.abs(actualH - hB)) + (isNaN(gB) ? 99 : Math.abs(actualG - gB));
      const winner = diffA < diffB ? "A" : diffB < diffA ? "B" : "tie";

      const resultP = document.createElement("p");
      resultP.textContent =
        winner === "tie"
          ? "Gleichstand bei dieser Runde!"
          : `${winner === "A" ? players[0] : players[1]} lag näher dran!`;
      container.appendChild(resultP);
      if (winner !== "tie") tally[winner]++;

      const nextBtn = document.createElement("button");
      nextBtn.className = "btn btn-primary";
      nextBtn.textContent = i < items.length - 1 ? "Weiter" : "Runde abschließen";
      nextBtn.addEventListener("click", () => {
        i++;
        if (i < items.length) renderStep();
        else finishRound();
      });
      container.appendChild(nextBtn);
    });
    container.appendChild(revealBtn);
  }

  function finishRound() {
    container.innerHTML = `<p>Runde beendet! Punktestand: <strong>${players[0]} ${tally.A}</strong> – <strong>${tally.B} ${players[1]}</strong></p>`;
    const suggestion = tally.A > tally.B ? "A" : tally.B > tally.A ? "B" : "draw";
    renderWinnerPicker(container, players, suggestion, finish);
  }

  renderStep();
}

// --- Freies Spiel ----------------------------------------------------------
function playFrei(container, game, players, finish) {
  container.innerHTML = `<p>${game.description || "Viel Spaß bei eurer Challenge!"}</p>`;
  renderWinnerPicker(container, players, null, finish);
}

const PLAYERS_BY_TYPE = {
  urlaubsbilder: playUrlaubsbilder,
  freio: playFreio,
  stuttgart_quiz: playStuttgartQuiz,
  durak: playDurak,
  preisschaetzen: playPreisschaetzen,
  fussball_quiz: playFussballQuiz,
  frei: playFrei,
};

// finish(winnerKey, note) — winnerKey in {'A','B','draw',null}
export function renderPlay(container, game, players, finish) {
  const fn = PLAYERS_BY_TYPE[game.type] || playFrei;
  container.classList.add("play-view");
  fn(container, game, players, finish);
}
