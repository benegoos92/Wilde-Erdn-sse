import {
  db,
  seedIfEmpty,
  seedFussballMatchesIfEmpty,
  seedAchtungKurveIfMissing,
  upgradeDefaultDescriptions,
  getPlayers,
  setPlayers,
} from "./db.js";
import { uid, pickWeighted, formatDate } from "./utils.js";
import { Wheel } from "./wheel.js";
import { renderItemEditor, renderQuizEditor, ITEM_SCHEMAS } from "./itemEditor.js";
import { renderPlay } from "./play.js";

const GAME_TYPES = [
  { key: "urlaubsbilder", label: "Urlaubsbilder-Raten" },
  { key: "freio", label: "Freio-Bilder-Ranking" },
  { key: "stuttgart_quiz", label: "Stuttgart-Quiz" },
  { key: "durak", label: "Durak-Duell" },
  { key: "preisschaetzen", label: "Was kostet das?" },
  { key: "fussball_quiz", label: "Fußballergebnisse-Quiz" },
  { key: "achtung_kurve", label: "Achtung die Kurve" },
  { key: "frei", label: "Freies Spiel (nur Text)" },
];
const TYPE_LABEL = Object.fromEntries(GAME_TYPES.map((t) => [t.key, t.label]));

let games = [];
let sessions = [];
let players = ["Spieler:in A", "Spieler:in B"];
let wheel;

// ---------------------------------------------------------------- helpers
async function refreshData() {
  games = await db.getAll("games");
  sessions = await db.getAll("sessions");
  players = await getPlayers();
}

function activeGames() {
  return games.filter((g) => g.active);
}

function recentGameIdsDesc() {
  const sorted = sessions.slice().sort((a, b) => b.date - a.date);
  const out = [];
  for (const s of sorted) {
    if (!out.includes(s.gameId)) out.push(s.gameId);
    if (out.length >= 3) break;
  }
  return out;
}

function winnerLabel(winner) {
  if (winner === "A") return players[0];
  if (winner === "B") return players[1];
  if (winner === "draw") return "Unentschieden";
  return "–";
}

// ---------------------------------------------------------------- tabs
function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
      if (btn.dataset.tab === "history") renderHistoryTab();
      if (btn.dataset.tab === "settings") renderSettingsTab();
      if (btn.dataset.tab === "games") renderGamesTab();
    });
  });
}

// ---------------------------------------------------------------- wheel tab
function renderWheelTab() {
  wheel.setGames(activeGames());
  const hint = document.getElementById("wheelHint");
  hint.textContent =
    activeGames().length === 0
      ? "Aktiviert mindestens ein Spiel unter „Spiele verwalten“, um zu drehen."
      : "";
  document.getElementById("spinBtn").disabled = activeGames().length === 0;
}

async function handleSpin() {
  const spinBtn = document.getElementById("spinBtn");
  const active = activeGames();
  if (active.length === 0) return;
  spinBtn.disabled = true;
  const target = pickWeighted(active, recentGameIdsDesc());
  await wheel.spin(target);
  spinBtn.disabled = false;
  openResultModal(target);
}

function openResultModal(game) {
  const modal = document.getElementById("resultModal");
  const body = document.getElementById("resultModalBody");
  body.innerHTML = `
    <h2>${game.title}</h2>
    <p class="type-tag">${TYPE_LABEL[game.type] || ""}</p>
    <p>${game.description || ""}</p>
    <div class="winner-btns">
      <button class="btn btn-primary" id="startPlayBtn">Jetzt spielen</button>
      <button class="btn btn-secondary" id="skipPlayBtn">Schließen</button>
    </div>
    <div id="playContainer"></div>
  `;
  modal.classList.remove("hidden");

  body.querySelector("#skipPlayBtn").addEventListener("click", closeResultModal);
  body.querySelector("#startPlayBtn").addEventListener("click", () => {
    body.querySelector(".winner-btns").remove();
    const playContainer = body.querySelector("#playContainer");
    renderPlay(playContainer, game, players, async (winnerKey) => {
      const session = {
        id: uid(),
        gameId: game.id,
        date: Date.now(),
        winner: winnerKey,
      };
      await db.put("sessions", session);
      await refreshData();
      closeResultModal();
    });
  });
}

function closeResultModal() {
  document.getElementById("resultModal").classList.add("hidden");
  document.getElementById("resultModalBody").innerHTML = "";
}

// ---------------------------------------------------------------- games tab
function renderGamesTab() {
  const list = document.getElementById("gamesList");
  list.innerHTML = "";
  if (games.length === 0) {
    list.innerHTML = `<p class="empty-state">Noch keine Spiele angelegt.</p>`;
    return;
  }
  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "game-card" + (game.active ? "" : " inactive");
    card.innerHTML = `
      <span class="swatch" style="background:${game.color || "#888"}"></span>
      <span class="type-tag">${TYPE_LABEL[game.type] || game.type}</span>
      <h3>${game.title}</h3>
      <p>${game.description || ""}</p>
      <div class="card-actions">
        <button data-action="toggle">${game.active ? "Deaktivieren" : "Aktivieren"}</button>
        <button data-action="edit">Bearbeiten</button>
        <button data-action="delete">Löschen</button>
      </div>
    `;
    card.querySelector('[data-action="toggle"]').addEventListener("click", async () => {
      game.active = !game.active;
      await db.put("games", game);
      await refreshData();
      renderGamesTab();
      renderWheelTab();
    });
    card.querySelector('[data-action="edit"]').addEventListener("click", () => openGameForm(game));
    card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
      if (!confirm(`„${game.title}“ wirklich löschen? Zugehörige Fotos gehen verloren.`)) return;
      await db.delete("games", game.id);
      await refreshData();
      renderGamesTab();
      renderWheelTab();
    });
    list.appendChild(card);
  });
}

function openGameForm(existingGame) {
  const isNew = !existingGame;
  const draft = existingGame
    ? JSON.parse(JSON.stringify(existingGame))
    : {
        id: uid(),
        title: "",
        description: "",
        type: "frei",
        active: true,
        color: "#ff6f91",
        createdAt: Date.now(),
        config: {},
      };
  if (!draft.config) draft.config = {};
  if (ITEM_SCHEMAS[draft.type] && !draft.config.items) draft.config.items = [];
  if (draft.type === "stuttgart_quiz" && !draft.config.items) draft.config.items = [];

  const modal = document.getElementById("gameFormModal");
  const body = document.getElementById("gameFormModalBody");
  body.innerHTML = `
    <h2>${isNew ? "Neues Spiel" : "Spiel bearbeiten"}</h2>
    <form id="gameForm">
      <label>Titel
        <input type="text" id="f-title" required maxlength="60" value="${escapeAttr(draft.title)}">
      </label>
      <label>Beschreibung / Anleitung
        <textarea id="f-desc" maxlength="400">${escapeHtml(draft.description || "")}</textarea>
      </label>
      <label>Spieltyp
        <select id="f-type" ${isNew ? "" : "disabled"}>
          ${GAME_TYPES.map(
            (t) => `<option value="${t.key}" ${t.key === draft.type ? "selected" : ""}>${t.label}</option>`
          ).join("")}
        </select>
      </label>
      ${!isNew ? '<p class="hint">Der Spieltyp kann nach dem Anlegen nicht mehr geändert werden.</p>' : ""}
      <label>Farbe im Rad
        <input type="color" id="f-color" value="${draft.color || "#ff6f91"}">
      </label>
      <label><input type="checkbox" id="f-active" ${draft.active ? "checked" : ""} style="width:auto;display:inline-block;margin-right:0.4rem;">Aktiv (nimmt am Rad teil)</label>
      <div id="itemEditorArea"></div>
      <div class="winner-btns" style="justify-content:flex-start;margin-top:1rem;">
        <button type="submit" class="btn btn-primary">Speichern</button>
      </div>
    </form>
  `;
  modal.classList.remove("hidden");

  const itemEditorArea = body.querySelector("#itemEditorArea");
  function renderItemArea(type) {
    itemEditorArea.innerHTML = "";
    if (type === "stuttgart_quiz") {
      if (!draft.config.items) draft.config.items = [];
      const h = document.createElement("h3");
      h.textContent = "Fragen";
      itemEditorArea.appendChild(h);
      renderQuizEditor(itemEditorArea, draft.config.items);
    } else if (ITEM_SCHEMAS[type]) {
      if (!draft.config.items) draft.config.items = [];
      const h = document.createElement("h3");
      h.textContent = "Einträge";
      itemEditorArea.appendChild(h);
      renderItemEditor(itemEditorArea, type, draft.config.items);
    }
  }
  renderItemArea(draft.type);

  body.querySelector("#f-type").addEventListener("change", (e) => {
    draft.type = e.target.value;
    draft.config = {};
    renderItemArea(draft.type);
  });

  body.querySelector("#gameForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    draft.title = body.querySelector("#f-title").value.trim();
    draft.description = body.querySelector("#f-desc").value.trim();
    draft.color = body.querySelector("#f-color").value;
    draft.active = body.querySelector("#f-active").checked;
    if (!draft.title) return;
    await db.put("games", draft);
    await refreshData();
    closeGameForm();
    renderGamesTab();
    renderWheelTab();
  });
}

function closeGameForm() {
  document.getElementById("gameFormModal").classList.add("hidden");
  document.getElementById("gameFormModalBody").innerHTML = "";
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str || "");
}

// ---------------------------------------------------------------- history tab
function renderHistoryTab() {
  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]));
  const leaderboard = document.getElementById("leaderboard");
  const wins = { A: 0, B: 0, draw: 0 };
  sessions.forEach((s) => {
    if (s.winner === "A") wins.A++;
    else if (s.winner === "B") wins.B++;
    else if (s.winner === "draw") wins.draw++;
  });
  leaderboard.innerHTML = `
    <div class="score-card"><div class="score">${wins.A}</div><div>${players[0]}</div></div>
    <div class="score-card"><div class="score">${wins.B}</div><div>${players[1]}</div></div>
    <div class="score-card"><div class="score">${wins.draw}</div><div>Unentschieden</div></div>
  `;

  const historyList = document.getElementById("historyList");
  if (sessions.length === 0) {
    historyList.innerHTML = `<p class="empty-state">Noch keine Runden gespielt.</p>`;
    return;
  }
  const sorted = sessions.slice().sort((a, b) => b.date - a.date);
  const rows = sorted
    .map((s) => {
      const game = gameMap[s.gameId];
      const winCls = s.winner === "A" ? "win-a" : s.winner === "B" ? "win-b" : "";
      return `<tr>
        <td>${formatDate(s.date)}</td>
        <td>${game ? game.title : "(gelöschtes Spiel)"}</td>
        <td class="${winCls}">${winnerLabel(s.winner)}</td>
        <td><button data-id="${s.id}" class="del-session">×</button></td>
      </tr>`;
    })
    .join("");
  historyList.innerHTML = `<table>
    <thead><tr><th>Datum</th><th>Spiel</th><th>Sieger</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
  historyList.querySelectorAll(".del-session").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await db.delete("sessions", btn.dataset.id);
      await refreshData();
      renderHistoryTab();
    });
  });
}

// ---------------------------------------------------------------- settings tab
function renderSettingsTab() {
  document.getElementById("playerAName").value = players[0];
  document.getElementById("playerBName").value = players[1];
}

function setupSettingsForm() {
  document.getElementById("playerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const a = document.getElementById("playerAName").value.trim() || "Spieler:in A";
    const b = document.getElementById("playerBName").value.trim() || "Spieler:in B";
    await setPlayers([a, b]);
    await refreshData();
    document.getElementById("playerSaveHint").textContent = "Gespeichert ✓";
    setTimeout(() => (document.getElementById("playerSaveHint").textContent = ""), 2000);
    renderHistoryTab();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const data = { games, sessions, players, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "date-night-wheel-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  document.getElementById("resetBtn").addEventListener("click", async () => {
    if (!confirm("Wirklich ALLE Daten (Spiele, Fotos, Verlauf) unwiderruflich löschen?")) return;
    await db.clearAll();
    await seedIfEmpty();
    await refreshData();
    renderWheelTab();
    renderGamesTab();
    renderHistoryTab();
    renderSettingsTab();
  });
}

// ---------------------------------------------------------------- init
async function init() {
  await seedIfEmpty();
  await seedFussballMatchesIfEmpty();
  await seedAchtungKurveIfMissing();
  await upgradeDefaultDescriptions();
  await refreshData();

  wheel = new Wheel(document.getElementById("wheelCanvas"));
  renderWheelTab();
  renderGamesTab();

  setupTabs();
  setupSettingsForm();

  document.getElementById("spinBtn").addEventListener("click", handleSpin);
  document.getElementById("newGameBtn").addEventListener("click", () => openGameForm(null));
  document.getElementById("resultModalClose").addEventListener("click", closeResultModal);
  document.getElementById("gameFormModalClose").addEventListener("click", closeGameForm);
}

init();
