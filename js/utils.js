export function uid() {
  return crypto.randomUUID();
}

// Reads an image file, downsizes it (max dimension) and returns a JPEG data URL.
// Keeps IndexedDB records reasonably small even with many photos.
export function fileToResizedDataUrl(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatEuro(n) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

// Weighted random selection. `recentGameIdsDesc` is an array of the most
// recently played game IDs, most recent first. Games played recently get a
// reduced chance of being picked again so the wheel favors variety.
export function pickWeighted(games, recentGameIdsDesc) {
  const recencyPenalty = [0.15, 0.35, 0.6]; // most recent .. 3rd most recent
  const weights = games.map((g) => {
    const idx = recentGameIdsDesc.indexOf(g.id);
    const w = idx >= 0 && idx < recencyPenalty.length ? recencyPenalty[idx] : 1;
    return Math.max(w, 0.05);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < games.length; i++) {
    r -= weights[i];
    if (r <= 0) return games[i];
  }
  return games[games.length - 1];
}
