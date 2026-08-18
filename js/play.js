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

// --- Achtung die Kurve -------------------------------------------------
function playAchtungKurve(container, game, players, finish) {
  const ROUNDS = 3;
  const W = 480;
  const H = 320;
  const SPEED = 1.7;
  const TURN = 0.032;
  const COUNTDOWN_MS = 1200;
  const tally = { A: 0, B: 0 };
  let round = 0;

  function renderRoundIntro() {
    container.innerHTML = `
      <p class="progress-dots">Runde ${round + 1} von ${ROUNDS} &nbsp;·&nbsp; Stand: ${players[0]} ${tally.A} : ${tally.B} ${players[1]}</p>
      <canvas id="kurveCanvas" width="${W}" height="${H}" style="background:#120d16;border-radius:10px;max-width:100%;touch-action:none;"></canvas>
      <p id="kurveStatus" class="hint" style="font-size:1.3rem;font-weight:700;min-height:1.6em;"></p>
      <div class="kurve-controls">
        <div class="side">
          <strong style="color:#ff6f91;">${players[0]}</strong>
          <div class="pad">
            <button type="button" class="btn btn-secondary kurve-btn" data-p="A" data-dir="-1">◀</button>
            <button type="button" class="btn btn-secondary kurve-btn" data-p="A" data-dir="1">▶</button>
          </div>
          <p class="hint">oder ← / →</p>
        </div>
        <div class="side">
          <strong style="color:#6fb1ff;">${players[1]}</strong>
          <div class="pad">
            <button type="button" class="btn btn-secondary kurve-btn" data-p="B" data-dir="-1">◀</button>
            <button type="button" class="btn btn-secondary kurve-btn" data-p="B" data-dir="1">▶</button>
          </div>
          <p class="hint">oder A / D</p>
        </div>
      </div>
    `;
    const canvas = container.querySelector("#kurveCanvas");
    const statusEl = container.querySelector("#kurveStatus");
    runRound(canvas, statusEl);
  }

  function runRound(canvas, statusEl) {
    const ctx = canvas.getContext("2d");
    // Canvas pixels stay transparent (only the CSS background looks dark) so
    // collision checks can tell "empty" (alpha 0) from "trail drawn" apart.
    ctx.clearRect(0, 0, W, H);

    // Collision is checked against a separate, off-screen canvas that a
    // player's own fresh trail only joins after a short lag (LAG_FRAMES).
    // Without that lag, the very next step after the head always overlaps
    // the segment just drawn (travel per frame < line width), causing an
    // instant, unavoidable "self-crash" the moment the trail starts.
    const collCanvas = document.createElement("canvas");
    collCanvas.width = W;
    collCanvas.height = H;
    const cctx = collCanvas.getContext("2d", { willReadFrequently: true });
    const LAG_FRAMES = 16;

    const pA = { x: W * 0.25, y: H * 0.5, angle: 0, color: "#ff6f91", turn: 0, gap: 0, pending: [] };
    const pB = { x: W * 0.75, y: H * 0.5, angle: Math.PI, color: "#6fb1ff", turn: 0, gap: 0, pending: [] };

    let leftDown = false;
    let rightDown = false;
    let aDown = false;
    let dDown = false;

    function applyTurn() {
      pA.turn = (rightDown ? 1 : 0) - (leftDown ? 1 : 0);
      pB.turn = (dDown ? 1 : 0) - (aDown ? 1 : 0);
    }
    function keydown(e) {
      if (e.key === "ArrowLeft") { leftDown = true; e.preventDefault(); }
      else if (e.key === "ArrowRight") { rightDown = true; e.preventDefault(); }
      else if (e.key === "a" || e.key === "A") aDown = true;
      else if (e.key === "d" || e.key === "D") dDown = true;
      else return;
      applyTurn();
    }
    function keyup(e) {
      if (e.key === "ArrowLeft") leftDown = false;
      else if (e.key === "ArrowRight") rightDown = false;
      else if (e.key === "a" || e.key === "A") aDown = false;
      else if (e.key === "d" || e.key === "D") dDown = false;
      else return;
      applyTurn();
    }
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    const padBtns = container.querySelectorAll(".kurve-btn");
    const padHandlers = [];
    padBtns.forEach((btn) => {
      const p = btn.dataset.p === "A" ? pA : pB;
      const dir = Number(btn.dataset.dir);
      const start = (e) => { e.preventDefault(); p.turn = dir; };
      const stop = () => { if (p.turn === dir) p.turn = 0; };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", stop);
      btn.addEventListener("pointerleave", stop);
      btn.addEventListener("pointercancel", stop);
      padHandlers.push([btn, start, stop]);
    });

    let cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      padHandlers.forEach(([btn, start, stop]) => {
        btn.removeEventListener("pointerdown", start);
        btn.removeEventListener("pointerup", stop);
        btn.removeEventListener("pointerleave", stop);
        btn.removeEventListener("pointercancel", stop);
      });
    }

    function stepPlayer(p, dt) {
      p.angle += p.turn * TURN * dt;
      const nx = p.x + Math.cos(p.angle) * SPEED * dt;
      const ny = p.y + Math.sin(p.angle) * SPEED * dt;
      let crashed = nx < 3 || nx > W - 3 || ny < 3 || ny > H - 3;
      if (!crashed) {
        const px = cctx.getImageData(nx | 0, ny | 0, 1, 1).data;
        if (px[3] > 10) crashed = true;
      }
      return { nx, ny, crashed };
    }

    let phase = "countdown";
    let countdownStart = null;
    let last = null;

    function frame(ts) {
      if (!canvas.isConnected) { cleanup(); return; }

      if (phase === "countdown") {
        if (countdownStart === null) countdownStart = ts;
        const remaining = COUNTDOWN_MS - (ts - countdownStart);
        if (remaining > 800) statusEl.textContent = "3";
        else if (remaining > 400) statusEl.textContent = "2";
        else if (remaining > 0) statusEl.textContent = "1";
        else if (remaining > -400) statusEl.textContent = "Los!";
        else {
          phase = "running";
          statusEl.textContent = "";
        }
        requestAnimationFrame(frame);
        return;
      }

      if (last === null) last = ts;
      const dt = Math.min(ts - last, 40) / 16.7;
      last = ts;

      const resA = stepPlayer(pA, dt);
      const resB = stepPlayer(pB, dt);
      const crashedNow = [];
      if (resA.crashed) crashedNow.push("A");
      if (resB.crashed) crashedNow.push("B");

      [[pA, resA], [pB, resB]].forEach(([p, res]) => {
        if (res.crashed) return;
        if (p.gap > 0) {
          p.gap -= dt;
        } else if (Math.random() < 0.0025 * dt) {
          p.gap = 8 + Math.random() * 6;
        } else {
          const seg = { x1: p.x, y1: p.y, x2: res.nx, y2: res.ny, color: p.color };
          ctx.strokeStyle = seg.color;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();

          p.pending.push(seg);
          if (p.pending.length > LAG_FRAMES) {
            const old = p.pending.shift();
            cctx.strokeStyle = old.color;
            cctx.lineWidth = 3;
            cctx.lineCap = "round";
            cctx.beginPath();
            cctx.moveTo(old.x1, old.y1);
            cctx.lineTo(old.x2, old.y2);
            cctx.stroke();
          }
        }
        p.x = res.nx;
        p.y = res.ny;
      });

      [pA, pB].forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      if (crashedNow.length > 0) {
        cleanup();
        finishRound(crashedNow);
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function finishRound(crashedNow) {
    round++;
    let roundWinner;
    if (crashedNow.length === 2) roundWinner = "tie";
    else roundWinner = crashedNow[0] === "A" ? "B" : "A";
    if (roundWinner !== "tie") tally[roundWinner]++;

    const status = document.createElement("p");
    status.innerHTML =
      roundWinner === "tie"
        ? "<strong>Unentschieden!</strong> Beide gleichzeitig gecrasht."
        : `<strong>${roundWinner === "A" ? players[0] : players[1]}</strong> gewinnt diese Runde!`;
    container.appendChild(status);

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.textContent = round < ROUNDS ? "Nächste Runde" : "Ergebnis anzeigen";
    nextBtn.addEventListener("click", () => {
      if (round < ROUNDS) renderRoundIntro();
      else finishGame();
    });
    container.appendChild(nextBtn);
  }

  function finishGame() {
    container.innerHTML = `<p>Spiel beendet! Rundenstand: <strong>${players[0]} ${tally.A}</strong> – <strong>${tally.B} ${players[1]}</strong></p>`;
    const suggestion = tally.A > tally.B ? "A" : tally.B > tally.A ? "B" : "draw";
    renderWinnerPicker(container, players, suggestion, finish);
  }

  renderRoundIntro();
}

// --- Externes Spiel (Link) --------------------------------------------
function escapeAttr(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function playExternalLink(container, game, players, finish) {
  const url = game.config?.url || "";
  const rounds = game.config?.rounds;
  container.innerHTML = `
    <p>${game.description || ""}</p>
    ${rounds ? `<p class="hint">Rundenanzahl: ${rounds}</p>` : ""}
    ${
      url
        ? `<p><a class="btn btn-primary" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Spiel öffnen ↗</a></p>`
        : `<p class="hint">Für dieses Spiel wurde noch kein Link hinterlegt. Bitte über "Spiele verwalten" ergänzen.</p>`
    }
    <p class="hint">Wenn ihr fertig gespielt habt, tragt hier den Sieger ein.</p>
  `;
  renderWinnerPicker(container, players, null, finish);
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
  achtung_kurve: playAchtungKurve,
  external_link: playExternalLink,
  frei: playFrei,
};

// finish(winnerKey, note) — winnerKey in {'A','B','draw',null}
export function renderPlay(container, game, players, finish) {
  const fn = PLAYERS_BY_TYPE[game.type] || playFrei;
  container.classList.add("play-view");
  fn(container, game, players, finish);
}
