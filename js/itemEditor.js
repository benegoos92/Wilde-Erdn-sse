import { uid, fileToResizedDataUrl } from "./utils.js";

// Schema describing which fields each item-based game type needs in its
// "Spiel bearbeiten" form. Types not listed here (durak, frei) have no items.
export const ITEM_SCHEMAS = {
  urlaubsbilder: {
    image: true,
    imageOptional: false,
    addLabel: "+ Foto hinzufügen",
    fields: [
      { key: "ort", label: "Ort", type: "text" },
      { key: "datum", label: "Datum (z. B. Aug 2022)", type: "text" },
    ],
  },
  freio: {
    image: true,
    imageOptional: false,
    addLabel: "+ Foto hinzufügen",
    fields: [{ key: "label", label: "Notiz (optional)", type: "text", optional: true }],
  },
  preisschaetzen: {
    image: true,
    imageOptional: true,
    addLabel: "+ Gegenstand/Dienstleistung hinzufügen",
    fields: [
      { key: "name", label: "Gegenstand / Dienstleistung", type: "text" },
      { key: "preis", label: "Preis (€)", type: "number" },
    ],
  },
  fussball_quiz: {
    image: false,
    addLabel: "+ Spiel hinzufügen",
    fields: [
      { key: "gegner", label: "Gegner", type: "text" },
      { key: "datum", label: "Datum", type: "date" },
      { key: "ergebnisHeim", label: "Tore eigenes Team", type: "number" },
      { key: "ergebnisGegner", label: "Tore Gegner", type: "number" },
      { key: "wettbewerb", label: "Wettbewerb (optional)", type: "text", optional: true },
    ],
  },
};

function fieldInput(field, item) {
  const wrap = document.createElement("label");
  wrap.textContent = field.label;
  const input = document.createElement("input");
  input.type = field.type;
  if (field.type === "number") input.step = "any";
  input.value = item[field.key] ?? "";
  input.required = !field.optional;
  input.addEventListener("input", () => {
    item[field.key] = field.type === "number" ? input.value : input.value;
  });
  wrap.appendChild(input);
  return wrap;
}

function imageField(item, onThumbUpdate) {
  const wrap = document.createElement("div");
  const img = document.createElement("img");
  img.className = "item-thumb";
  img.src = item.image || "";
  img.style.display = item.image ? "block" : "none";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    item.image = await fileToResizedDataUrl(file);
    img.src = item.image;
    img.style.display = "block";
    if (onThumbUpdate) onThumbUpdate();
  });
  wrap.appendChild(img);
  wrap.appendChild(input);
  return wrap;
}

// Renders a repeatable item editor into `container` for a schema-based type.
// `items` is mutated in place (the array reference belongs to the caller's
// game.config.items).
export function renderItemEditor(container, type, items) {
  const schema = ITEM_SCHEMAS[type];
  container.innerHTML = "";
  if (!schema) return;

  const list = document.createElement("div");
  container.appendChild(list);

  function renderList() {
    list.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Noch keine Einträge.";
      list.appendChild(empty);
    }
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "item-card";
      const row = document.createElement("div");
      row.className = "item-row";

      if (schema.image) {
        row.appendChild(imageField(item));
      }
      schema.fields.forEach((f) => row.appendChild(fieldInput(f, item)));
      card.appendChild(row);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "item-remove-btn";
      removeBtn.textContent = "Eintrag löschen";
      removeBtn.addEventListener("click", () => {
        const idx = items.findIndex((i) => i.id === item.id);
        if (idx >= 0) items.splice(idx, 1);
        renderList();
      });
      card.appendChild(removeBtn);
      list.appendChild(card);
    });
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn btn-secondary";
  addBtn.textContent = schema.addLabel;
  addBtn.addEventListener("click", () => {
    items.push({ id: uid() });
    renderList();
  });

  renderList();
  container.appendChild(addBtn);
}

// Editor for the "external_link" type: a single URL plus optional round count.
// Mutates `config` in place ({ url, rounds }).
export function renderExternalLinkEditor(container, config) {
  container.innerHTML = "";

  const urlLabel = document.createElement("label");
  urlLabel.textContent = "Link zum Spiel";
  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.required = true;
  urlInput.placeholder = "https://…";
  urlInput.value = config.url || "";
  urlInput.addEventListener("input", () => (config.url = urlInput.value));
  urlLabel.appendChild(urlInput);
  container.appendChild(urlLabel);

  const roundsLabel = document.createElement("label");
  roundsLabel.textContent = "Anzahl Runden (optional)";
  const roundsInput = document.createElement("input");
  roundsInput.type = "number";
  roundsInput.min = "1";
  roundsInput.step = "1";
  roundsInput.value = config.rounds ?? "";
  roundsInput.addEventListener("input", () => {
    config.rounds = roundsInput.value ? Number(roundsInput.value) : undefined;
  });
  roundsLabel.appendChild(roundsInput);
  container.appendChild(roundsLabel);
}

// Special editor for Stuttgart-quiz-style question items: {frage, optionen[4], loesungIndex}
export function renderQuizEditor(container, items) {
  container.innerHTML = "";
  const list = document.createElement("div");
  container.appendChild(list);

  function renderList() {
    list.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Noch keine Fragen.";
      list.appendChild(empty);
    }
    items.forEach((item) => {
      if (!item.optionen) item.optionen = ["", "", "", ""];
      if (item.loesungIndex === undefined) item.loesungIndex = 0;

      const card = document.createElement("div");
      card.className = "item-card";

      const frageLabel = document.createElement("label");
      frageLabel.textContent = "Frage";
      const frageInput = document.createElement("input");
      frageInput.type = "text";
      frageInput.value = item.frage || "";
      frageInput.required = true;
      frageInput.addEventListener("input", () => (item.frage = frageInput.value));
      frageLabel.appendChild(frageInput);
      card.appendChild(frageLabel);

      item.optionen.forEach((opt, i) => {
        const row = document.createElement("div");
        row.className = "quiz-option-row";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `correct-${item.id}`;
        radio.checked = item.loesungIndex === i;
        radio.addEventListener("change", () => (item.loesungIndex = i));
        const optInput = document.createElement("input");
        optInput.type = "text";
        optInput.placeholder = `Antwort ${i + 1}`;
        optInput.value = opt;
        optInput.required = true;
        optInput.addEventListener("input", () => (item.optionen[i] = optInput.value));
        row.appendChild(radio);
        row.appendChild(optInput);
        card.appendChild(row);
      });
      const optHint = document.createElement("p");
      optHint.className = "hint";
      optHint.textContent = "Radiobutton = richtige Antwort";
      card.appendChild(optHint);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "item-remove-btn";
      removeBtn.textContent = "Frage löschen";
      removeBtn.addEventListener("click", () => {
        const idx = items.findIndex((i) => i.id === item.id);
        if (idx >= 0) items.splice(idx, 1);
        renderList();
      });
      card.appendChild(removeBtn);
      list.appendChild(card);
    });
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn btn-secondary";
  addBtn.textContent = "+ Frage hinzufügen";
  addBtn.addEventListener("click", () => {
    items.push({ id: uid(), frage: "", optionen: ["", "", "", ""], loesungIndex: 0 });
    renderList();
  });

  renderList();
  container.appendChild(addBtn);
}
