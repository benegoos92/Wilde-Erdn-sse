// IndexedDB wrapper for local-only persistence.
const DB_NAME = "dncWheelDB";
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("games")) {
        db.createObjectStore("games", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("sessions")) {
        const store = db.createObjectStore("sessions", { keyPath: "id" });
        store.createIndex("gameId", "gameId");
        store.createIndex("date", "date");
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDB().then(
    (db) => db.transaction(storeName, mode).objectStore(storeName)
  );
}

export const db = {
  async getAll(storeName) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async get(storeName, id) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async put(storeName, value) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async delete(storeName, id) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async clearAll() {
    const db_ = await openDB();
    const names = ["games", "sessions", "settings"];
    return Promise.all(
      names.map(
        (name) =>
          new Promise((resolve, reject) => {
            const req = db_.transaction(name, "readwrite").objectStore(name).clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          })
      )
    );
  },
};

export async function seedIfEmpty() {
  const games = await db.getAll("games");
  if (games.length > 0) return;

  const now = Date.now();
  const defaults = [
    {
      id: crypto.randomUUID(),
      title: "Urlaubsbilder-Raten",
      description:
        "Ladet eigene Urlaubsfotos hoch. Die andere Person muss Ort und/oder Zeitpunkt der Aufnahme erraten.",
      type: "urlaubsbilder",
      active: true,
      color: "#ff6f91",
      createdAt: now,
      config: { items: [] },
    },
    {
      id: crypto.randomUUID(),
      title: "Freio-Bilder-Ranking",
      description:
        "Ladet Fotos von Freio hoch und bringt sie unabhängig voneinander in eure Lieblingsreihenfolge.",
      type: "freio",
      active: true,
      color: "#ffb86f",
      createdAt: now,
      config: { items: [] },
    },
    {
      id: crypto.randomUUID(),
      title: "Stuttgart-Quiz",
      description: "Fun Facts über Stuttgart – wer weiß mehr?",
      type: "stuttgart_quiz",
      active: true,
      color: "#7ee0c3",
      createdAt: now,
      config: {
        items: [
          {
            id: crypto.randomUUID(),
            frage: "Wie heißt das Wahrzeichen auf dem Stuttgarter Fernsehturm-Vorbild-Berg?",
            optionen: ["Fernsehturm", "Bismarckturm", "Karlshöhe", "Bohnenviertel"],
            loesungIndex: 0,
          },
          {
            id: crypto.randomUUID(),
            frage: "In welchem Talkessel liegt Stuttgart hauptsächlich?",
            optionen: ["Nesenbachtal", "Neckartal", "Filstal", "Remstal"],
            loesungIndex: 0,
          },
          {
            id: crypto.randomUUID(),
            frage: "Welches Mineralwasser-Vorkommen ist Stuttgart (nach Budapest) bekannt für?",
            optionen: [
              "Größte Mineralwasservorkommen Europas",
              "Größte Süßwasserquelle Europas",
              "Einziges Thermalwasser Deutschlands",
              "Größter Grundwassersee Europas",
            ],
            loesungIndex: 0,
          },
        ],
      },
    },
    {
      id: crypto.randomUUID(),
      title: "Durak-Duell",
      description:
        "Ein Duell im Kartenspiel Durak zu zweit. Nach der Partie den Sieger eintragen.",
      type: "durak",
      active: true,
      color: "#c792ea",
      createdAt: now,
      config: {},
    },
    {
      id: crypto.randomUUID(),
      title: "Was kostet das?",
      description:
        "Schätzt die Preise von Gegenständen oder Dienstleistungen. Wer näher dran ist, gewinnt die Runde.",
      type: "preisschaetzen",
      active: true,
      color: "#ffd166",
      createdAt: now,
      config: { items: [] },
    },
    {
      id: crypto.randomUUID(),
      title: "Fußballergebnisse-Quiz",
      description:
        "Ratet die Ergebnisse vergangener Spiele eurer Fußballmannschaft aus den letzten zwei Saisons.",
      type: "fussball_quiz",
      active: true,
      color: "#6fb1ff",
      createdAt: now,
      config: { items: [] },
    },
  ];

  for (const g of defaults) {
    await db.put("games", g);
  }
}

export async function getPlayers() {
  const rec = await db.get("settings", "players");
  return rec ? rec.names : ["Spieler:in A", "Spieler:in B"];
}

export async function setPlayers(names) {
  await db.put("settings", { key: "players", names });
}
