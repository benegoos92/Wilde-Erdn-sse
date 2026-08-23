// IndexedDB wrapper for local-only persistence.
const DB_NAME = "dncWheelDB";
const DB_VERSION = 1;

// Reale Ergebnisse SportVg Feuerbach W1 (vom Nutzer bereitgestellt, aus
// https://www.fupa.net/team/sportvg-feuerbach-w1-2024-25 und -2025-26).
const FUSSBALL_MATCHES = [
  { datum: "10.11.2024", gegner: "VfB Obertürkheim", ergebnisHeim: 1, ergebnisGegner: 0, wettbewerb: "Saison 24/25" },
  { datum: "24.11.2024", gegner: "FSV 08 Bietigheim-Bissingen", ergebnisHeim: 3, ergebnisGegner: 3, wettbewerb: "Saison 24/25" },
  { datum: "06.04.2025", gegner: "TV Aldingen (Auswärts)", ergebnisHeim: 6, ergebnisGegner: 1, wettbewerb: "Saison 24/25" },
  { datum: "25.05.2025", gegner: "TSV Nellmersbach", ergebnisHeim: 1, ergebnisGegner: 4, wettbewerb: "Saison 24/25" },
  { datum: "21.09.2025", gegner: "TSV Deizisau", ergebnisHeim: 6, ergebnisGegner: 2, wettbewerb: "Saison 25/26" },
  { datum: "22.03.2026", gegner: "TSV Heumaden", ergebnisHeim: 6, ergebnisGegner: 0, wettbewerb: "Saison 25/26" },
  { datum: "29.03.2026", gegner: "SV Horrheim", ergebnisHeim: 3, ergebnisGegner: 2, wettbewerb: "Saison 25/26" },
];

// Simple flat-icon "photo" for a Was-kostet-das-Gegenstand: a colored square
// with a big emoji, used since no real product photo is available. Renders
// fine as a normal <img src="data:image/svg+xml,..."> anywhere in the app.
function svgIcon(bg, emoji) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">` +
    `<rect width="400" height="400" rx="32" fill="${bg}"/>` +
    `<text x="200" y="230" font-size="200" text-anchor="middle" dominant-baseline="middle">${emoji}</text>` +
    `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// Preisschätzen-Gegenstände/Dienstleistungen mit Stuttgart-Bezug (Preise
// recherchiert, Stand 2026). Reine Icon-Grafiken statt Fotos, da keine
// echten Produktbilder verfügbar sind.
const PREISSCHAETZEN_ITEMS = [
  { name: "Fernsehturm Stuttgart – Eintritt (Erwachsene)", preis: 12.5, bg: "#4a90d9", emoji: "📡" },
  { name: "Mercedes-Benz Museum – Eintritt (Erwachsene)", preis: 10, bg: "#2b2b2b", emoji: "🚗" },
  { name: "SSB KurzstreckenTicket (Stadtbahn/Bus)", preis: 2.1, bg: "#d94f2b", emoji: "🚊" },
  { name: "VfB Stuttgart Heimtrikot 25/26 (Erwachsene)", preis: 84.99, bg: "#e2231a", emoji: "👕" },
  { name: "Trollinger „Cannstatter Zuckerle“ (0,75 l)", preis: 11.5, bg: "#722f37", emoji: "🍷" },
  { name: "Stuttgarter Brezel (frisch, Bäckerei)", preis: 1.2, bg: "#c68958", emoji: "🥨" },
  { name: "Bürger Maultaschen „Unsere Besten“ (400 g)", preis: 4.29, bg: "#d9a566", emoji: "🥟" },
  { name: "Stuttgarter Zeitung (Einzelausgabe Mo–Do)", preis: 1.4, bg: "#4a5a6a", emoji: "📰" },
  { name: "Cannstatter Wasen – 1 Maß Bier (Festzelt)", preis: 14.4, bg: "#f1a208", emoji: "🍺" },
  { name: "Ritter Sport Schokolade (100 g Tafel)", preis: 1.79, bg: "#f2b705", emoji: "🍫" },
];

const STUTTGART_QUIZ_BASE_QUESTIONS = [
  {
    frage: "Wie heißt das Wahrzeichen auf dem Stuttgarter Fernsehturm-Vorbild-Berg?",
    optionen: ["Fernsehturm", "Bismarckturm", "Karlshöhe", "Bohnenviertel"],
    loesungIndex: 0,
  },
  {
    frage: "In welchem Talkessel liegt Stuttgart hauptsächlich?",
    optionen: ["Nesenbachtal", "Neckartal", "Filstal", "Remstal"],
    loesungIndex: 0,
  },
  {
    frage: "Welches Mineralwasser-Vorkommen ist Stuttgart (nach Budapest) bekannt für?",
    optionen: [
      "Größte Mineralwasservorkommen Europas",
      "Größte Süßwasserquelle Europas",
      "Einziges Thermalwasser Deutschlands",
      "Größter Grundwassersee Europas",
    ],
    loesungIndex: 0,
  },
];

// Zusätzliche Stuttgart-Quiz-Fragen: echte Fun Facts über Stuttgart plus ein
// paar witzige Golden-Retriever-Fragen (auf Wunsch des Nutzers).
const STUTTGART_QUIZ_EXTRA_QUESTIONS = [
  {
    frage: "Woher stammt der Name Stuttgart ursprünglich?",
    optionen: [
      "Von Stutengarten (Gestüt zur Pferdezucht)",
      "Von Steingarten (steinige Weinberglagen)",
      "Von einem Stauwehr am Neckar",
      "Von einem römischen Feldherrn namens Stutgardus",
    ],
    loesungIndex: 0,
  },
  {
    frage: "Was zeigt das Stuttgarter Stadtwappen?",
    optionen: [
      "Ein schwarzes, aufbäumendes Ross",
      "Einen Fernsehturm",
      "Zwei gekreuzte Weinreben",
      "Einen Löwen mit Krone",
    ],
    loesungIndex: 0,
  },
  {
    frage: "Wofür ist das Bohnenviertel in Stuttgart bekannt?",
    optionen: [
      "Eines der ältesten erhaltenen Wohnviertel der Stadt",
      "Der größte Weinberg Stuttgarts",
      "Der Standort des Fernsehturms",
      "Ein moderner Businessdistrikt",
    ],
    loesungIndex: 0,
  },
  {
    frage: "Welche Bahn bringt Stuttgarter:innen seit über 100 Jahren hinauf nach Degerloch?",
    optionen: ["Die Zahnradbahn (Zacke)", "Ein Skilift", "Eine Seilbahn über den Neckar", "Ein Rolltreppen-Tunnel"],
    loesungIndex: 0,
  },
  {
    frage: "Was ist an Stuttgart im Vergleich zu anderen deutschen Großstädten ungewöhnlich?",
    optionen: [
      "Es gibt Weinberge mitten in der Stadt",
      "Es hat keinen Hauptbahnhof",
      "Es liegt komplett eben ohne Hügel",
      "Es hat keine einzige Ampel",
    ],
    loesungIndex: 0,
  },
  {
    frage: "Der Cannstatter Wasen ist nach dem Münchner Oktoberfest…",
    optionen: [
      "das zweitgrößte Volksfest Deutschlands",
      "das älteste Volksfest der Welt",
      "ein reines Weinfest ohne Bier",
      "nur alle zwei Jahre geöffnet",
    ],
    loesungIndex: 0,
  },
  {
    frage: "Golden Retriever wurden ursprünglich für welchen Zweck gezüchtet?",
    optionen: [
      "Zum Apportieren von Wasserwild bei der Jagd",
      "Als reine Wohnzimmer-Kuscheltiere",
      "Zum Hüten von Schafherden",
      "Als Wachhunde für Burgen",
    ],
    loesungIndex: 0,
  },
  {
    frage: "Was lieben die meisten Golden Retriever über fast alles?",
    optionen: ["Wasser – sie schwimmen für ihr Leben gern", "Katzen zu ignorieren", "Alleine zu sein", "Stille und Ruhe"],
    loesungIndex: 0,
  },
  {
    frage: "Welches Klischee trifft auf Golden Retriever besonders zu?",
    optionen: ["Sie tragen ständig irgendetwas im Maul herum", "Sie bellen nie", "Sie hassen jeden Ballwurf", "Sie werden nie nass"],
    loesungIndex: 0,
  },
  {
    frage: "Was gilt unter Hundebesitzer:innen als Meisterdisziplin eines Golden Retrievers?",
    optionen: [
      "Gleichzeitig jeden Menschen im Raum anzubetteln und zu lieben",
      "Niemals Fell zu verlieren",
      "Perfekt still zu sitzen",
      "Wasser komplett zu meiden",
    ],
    loesungIndex: 0,
  },
  {
    frage: "Wie lang ist die Königstraße, Stuttgarts zentrale Einkaufsstraße, ungefähr?",
    optionen: ["Rund 1,2 km", "Rund 500 m", "Rund 2,5 km", "Rund 300 m"],
    loesungIndex: 0,
  },
  {
    frage: "Welcher Stadtteil Stuttgarts hat die meisten Einwohner:innen?",
    optionen: ["Weilimdorf", "Bad Cannstatt", "Feuerbach", "Zuffenhausen"],
    loesungIndex: 0,
  },
  {
    frage: "Wie viele Restaurants in Stuttgart tragen aktuell einen Michelin-Stern?",
    optionen: ["8", "3", "15", "1"],
    loesungIndex: 0,
  },
];

// Default game descriptions, keyed by type. `old` holds every previous
// wording so upgradeDefaultDescriptions() can recognize an unedited default
// and refresh it — but leaves the text alone if the user customized it.
const DEFAULT_DESCRIPTIONS = {
  urlaubsbilder: {
    old: ["Ladet eigene Urlaubsfotos hoch. Die andere Person muss Ort und/oder Zeitpunkt der Aufnahme erraten."],
    new: "Ladet eure schönsten Urlaubsfotos hoch – wer errät, wann und wo sie entstanden sind?",
  },
  freio: {
    old: [
      "Ladet Fotos von Freio hoch und bringt sie unabhängig voneinander in eure Lieblingsreihenfolge.",
      "Fotos von Freio hochladen und unabhängig voneinander in eure Lieblingsreihenfolge bringen – seid ihr euch einig, welches Bild das beste ist?",
    ],
    new: "Fotos von Freio hochladen und gemeinsam in eure Wunschreihenfolge bringen – kein Duell, sondern eine gemeinsame Rangliste. Welches Bild ist euer Favorit?",
  },
  stuttgart_quiz: {
    old: ["Fun Facts über Stuttgart – wer weiß mehr?"],
    new: "Kurioses und Wissenswertes über Stuttgart – beantwortet die Fragen und sammelt Punkte. Wer kennt eure Stadt besser?",
  },
  durak: {
    old: ["Ein Duell im Kartenspiel Durak zu zweit. Nach der Partie den Sieger eintragen."],
    new: "Klassisches Kartenduell zu zweit: Spielt eine Partie Durak und tragt danach den Sieger ein.",
  },
  preisschaetzen: {
    old: ["Schätzt die Preise von Gegenständen oder Dienstleistungen. Wer näher dran ist, gewinnt die Runde."],
    new: "Alltägliches, Kurioses oder Luxus – schätzt die Preise verschiedener Dinge. Wer am nächsten dran ist, gewinnt die Runde.",
  },
  fussball_quiz: {
    old: ["Ratet die Ergebnisse vergangener Spiele eurer Fußballmannschaft aus den letzten zwei Saisons."],
    new: "Erinnert ihr euch noch? Ratet die Ergebnisse vergangener Spiele eurer Fußballmannschaft aus den letzten beiden Saisons.",
  },
  achtung_kurve: {
    old: [],
    new: "Lichtschweif-Duell in Echtzeit: Weicht eurer eigenen und der gegnerischen Spur aus. Wer zuerst crasht, verliert die Runde – beste aus 3 Runden gewinnt.",
  },
  external_link: {
    old: [],
    new: "Schätzt gemeinsam Entfernungen auf der Karte. Wer nach allen Runden die meisten Punkte hat, gewinnt.",
  },
};

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
      description: DEFAULT_DESCRIPTIONS.urlaubsbilder.new,
      type: "urlaubsbilder",
      active: true,
      color: "#ff6f91",
      createdAt: now,
      config: { items: [] },
    },
    {
      id: crypto.randomUUID(),
      title: "Freio-Bilder-Ranking",
      description: DEFAULT_DESCRIPTIONS.freio.new,
      type: "freio",
      active: true,
      color: "#ffb86f",
      createdAt: now,
      config: { items: [] },
    },
    {
      id: crypto.randomUUID(),
      title: "Stuttgart-Quiz",
      description: DEFAULT_DESCRIPTIONS.stuttgart_quiz.new,
      type: "stuttgart_quiz",
      active: true,
      color: "#7ee0c3",
      createdAt: now,
      config: {
        items: [...STUTTGART_QUIZ_BASE_QUESTIONS, ...STUTTGART_QUIZ_EXTRA_QUESTIONS].map((q) => ({
          id: crypto.randomUUID(),
          ...q,
        })),
      },
    },
    {
      id: crypto.randomUUID(),
      title: "Durak-Duell",
      description: DEFAULT_DESCRIPTIONS.durak.new,
      type: "durak",
      active: true,
      color: "#c792ea",
      createdAt: now,
      config: {},
    },
    {
      id: crypto.randomUUID(),
      title: "Was kostet das?",
      description: DEFAULT_DESCRIPTIONS.preisschaetzen.new,
      type: "preisschaetzen",
      active: true,
      color: "#ffd166",
      createdAt: now,
      config: {
        items: PREISSCHAETZEN_ITEMS.map(({ name, preis, bg, emoji }) => ({
          id: crypto.randomUUID(),
          name,
          preis,
          image: svgIcon(bg, emoji),
        })),
      },
    },
    {
      id: crypto.randomUUID(),
      title: "Fußballergebnisse-Quiz",
      description: DEFAULT_DESCRIPTIONS.fussball_quiz.new,
      type: "fussball_quiz",
      active: true,
      color: "#6fb1ff",
      createdAt: now,
      config: {
        items: FUSSBALL_MATCHES.map((m) => ({ id: crypto.randomUUID(), ...m })),
      },
    },
    {
      id: crypto.randomUUID(),
      title: "Achtung die Kurve",
      description: DEFAULT_DESCRIPTIONS.achtung_kurve.new,
      type: "achtung_kurve",
      active: true,
      color: "#4dd0e1",
      createdAt: now,
      config: {},
    },
    {
      id: crypto.randomUUID(),
      title: "Entfernung raten",
      description: DEFAULT_DESCRIPTIONS.external_link.new,
      type: "external_link",
      active: true,
      color: "#a0e426",
      createdAt: now,
      config: { url: "https://witc.theoi.de/?utm_source=chatgpt.com#r=1BHAD2", rounds: 11 },
    },
  ];

  for (const g of defaults) {
    await db.put("games", g);
  }
}

// Backfills the real match results into the Fußballergebnisse-Quiz game for
// browsers that already created it (as an empty list) before the results
// were available. No-op once the game has items.
export async function seedFussballMatchesIfEmpty() {
  const games = await db.getAll("games");
  const game = games.find((g) => g.type === "fussball_quiz");
  if (!game || (game.config.items && game.config.items.length > 0)) return;
  game.config.items = FUSSBALL_MATCHES.map((m) => ({ id: crypto.randomUUID(), ...m }));
  await db.put("games", game);
}

// Adds the Stuttgart-themed items to the Was-kostet-das-Spiel for browsers
// that already created it, appending only the ones still missing (matched
// by name) so any item the user added themselves is kept untouched.
export async function seedPreisschaetzenItemsIfEmpty() {
  const games = await db.getAll("games");
  const game = games.find((g) => g.type === "preisschaetzen");
  if (!game) return;
  if (!game.config.items) game.config.items = [];
  const existingNames = new Set(game.config.items.map((i) => i.name));
  const missing = PREISSCHAETZEN_ITEMS.filter(({ name }) => !existingNames.has(name));
  if (missing.length === 0) return;
  game.config.items.push(
    ...missing.map(({ name, preis, bg, emoji }) => ({
      id: crypto.randomUUID(),
      name,
      preis,
      image: svgIcon(bg, emoji),
    }))
  );
  await db.put("games", game);
}

// Adds the extra Stuttgart-Quiz questions (Stuttgart-Facts + Golden-Retriever
// fun questions) to browsers that already created the quiz, appending only
// questions still missing (matched by `frage` text) so questions the user
// added themselves are kept untouched.
export async function seedStuttgartQuizQuestionsIfMissing() {
  const games = await db.getAll("games");
  const game = games.find((g) => g.type === "stuttgart_quiz");
  if (!game) return;
  if (!game.config.items) game.config.items = [];
  const existingFragen = new Set(game.config.items.map((i) => i.frage));
  const missing = STUTTGART_QUIZ_EXTRA_QUESTIONS.filter((q) => !existingFragen.has(q.frage));
  if (missing.length === 0) return;
  game.config.items.push(...missing.map((q) => ({ id: crypto.randomUUID(), ...q })));
  await db.put("games", game);
}

// Adds the "Achtung die Kurve" default game for browsers that already
// created their game list before it existed. No-op once present.
export async function seedAchtungKurveIfMissing() {
  const games = await db.getAll("games");
  if (games.some((g) => g.type === "achtung_kurve")) return;
  await db.put("games", {
    id: crypto.randomUUID(),
    title: "Achtung die Kurve",
    description: DEFAULT_DESCRIPTIONS.achtung_kurve.new,
    type: "achtung_kurve",
    active: true,
    color: "#4dd0e1",
    createdAt: Date.now(),
    config: {},
  });
}

// Adds the "Entfernung raten" default game for browsers that already
// created their game list before it existed. No-op once present.
export async function seedExternalLinkGameIfMissing() {
  const games = await db.getAll("games");
  if (games.some((g) => g.type === "external_link")) return;
  await db.put("games", {
    id: crypto.randomUUID(),
    title: "Entfernung raten",
    description: DEFAULT_DESCRIPTIONS.external_link.new,
    type: "external_link",
    active: true,
    color: "#a0e426",
    createdAt: Date.now(),
    config: { url: "https://witc.theoi.de/?utm_source=chatgpt.com#r=1BHAD2", rounds: 11 },
  });
}

// Refreshes the wording of default game descriptions for browsers that
// already created them. Only touches a game if its description still
// matches a known previous default wording — custom edits are left as-is.
export async function upgradeDefaultDescriptions() {
  const games = await db.getAll("games");
  for (const game of games) {
    const entry = DEFAULT_DESCRIPTIONS[game.type];
    if (!entry) continue;
    if (entry.old.includes(game.description) && game.description !== entry.new) {
      game.description = entry.new;
      await db.put("games", game);
    }
  }
}

export async function getPlayers() {
  const rec = await db.get("settings", "players");
  return rec ? rec.names : ["Spieler:in A", "Spieler:in B"];
}

export async function setPlayers(names) {
  await db.put("settings", { key: "players", names });
}
