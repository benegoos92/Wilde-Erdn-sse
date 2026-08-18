export class Wheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.games = [];
    this.rotation = 0; // radians
    this.spinning = false;
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.max(rect.width, 200);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.size = size;
    this.draw();
  }

  setGames(games) {
    this.games = games;
    this.draw();
  }

  draw() {
    const { ctx, size } = this;
    if (!size) return;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;
    ctx.clearRect(0, 0, size, size);

    if (this.games.length === 0) {
      ctx.fillStyle = "#33263e";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c3b3d0";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Keine aktiven Spiele", cx, cy);
      return;
    }

    const n = this.games.length;
    const seg = (Math.PI * 2) / n;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    this.games.forEach((game, i) => {
      const start = i * seg;
      const end = start + seg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();
      ctx.fillStyle = game.color || "#7ee0c3";
      ctx.fill();
      ctx.strokeStyle = "#1a1420";
      ctx.lineWidth = 2;
      ctx.stroke();

      // label
      ctx.save();
      ctx.rotate(start + seg / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#1a1420";
      ctx.font = "bold 13px sans-serif";
      const label = game.title.length > 22 ? game.title.slice(0, 20) + "…" : game.title;
      ctx.fillText(label, r - 14, 4);
      ctx.restore();
    });

    ctx.restore();

    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1420";
    ctx.fill();
  }

  // Spins the wheel so that `targetGame` ends up under the top pointer,
  // then resolves.
  spin(targetGame) {
    return new Promise((resolve) => {
      if (this.spinning || this.games.length === 0) {
        resolve();
        return;
      }
      const n = this.games.length;
      const idx = this.games.findIndex((g) => g.id === targetGame.id);
      const seg = (Math.PI * 2) / n;
      // Pointer is at top (angle = -PI/2 in standard canvas coords, but our
      // segments start at 0 = 3 o'clock). We want the middle of the target
      // segment to land at -PI/2 (top) after rotation.
      const segMid = idx * seg + seg / 2;
      const targetPointerAngle = -Math.PI / 2;
      // final rotation such that (segMid + rotation) mod 2PI == targetPointerAngle
      let finalRotation = targetPointerAngle - segMid;
      const extraSpins = 5 + Math.floor(Math.random() * 3);
      finalRotation += Math.PI * 2 * extraSpins;

      const startRotation = this.rotation;
      const delta = finalRotation - (startRotation % (Math.PI * 2));
      const duration = 4200;
      const startTime = performance.now();
      this.spinning = true;

      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = easeOutCubic(t);
        this.rotation = startRotation + delta * eased;
        this.draw();
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          this.spinning = false;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }
}
