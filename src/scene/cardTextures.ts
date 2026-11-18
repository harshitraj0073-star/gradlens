import * as THREE from 'three';

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(canvas: HTMLCanvasElement, maxAnisotropy: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function drawCardHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  title: string,
  metric: string,
  accentColor: string,
) {
  // Subtle top hairline inner highlight
  const topGrad = ctx.createLinearGradient(0, 0, width, 0);
  topGrad.addColorStop(0, 'rgba(34, 211, 238, 0.0)');
  topGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.14)');
  topGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(48, 24, width - 96, 2);

  // Clean Linear/Vercel header typography
  ctx.fillStyle = 'rgba(226, 232, 240, 0.92)';
  ctx.font = '500 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(title, 56, 84);

  // Clean tabular metric on right
  ctx.fillStyle = accentColor;
  ctx.font = '600 34px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(metric, width - 56, 84);

  // Subtle 1px divider
  ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.fillRect(56, 128, width - 112, 2);
}

export function createGitHubCardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const [canvas, ctx] = makeCanvas(w, h);

  ctx.clearRect(0, 0, w, h);
  drawCardHeader(ctx, w, 'GitHub Commits', '1,420', '#22d3ee');

  // Subtle recessed grid cells under the 3D commit cubes
  const cols = 14;
  const rows = 5;
  const startX = 64;
  const startY = 180;
  const stepX = 66;
  const stepY = 66;
  const cellSize = 48;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(startX + c * stepX, startY + r * stepY, cellSize, cellSize, 8);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Subtle bottom cadence rule
  ctx.fillStyle = 'rgba(148, 163, 184, 0.48)';
  ctx.font = '500 22px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('52W ACTIVITY', 64, 566);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
  ctx.fillText('+28.4%', w - 64, 566);

  return finalizeTexture(canvas, maxAnisotropy);
}

export function createCodeforcesCardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const [canvas, ctx] = makeCanvas(w, h);

  ctx.clearRect(0, 0, w, h);
  drawCardHeader(ctx, w, 'Codeforces Rating', '1,842', '#10b981');

  // Horizontal rating tier hairlines
  for (let i = 0; i < 4; i++) {
    const y = 200 + i * 95;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(64, y);
    ctx.lineTo(w - 64, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Bottom baseline
  ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.fillRect(64, 515, w - 128, 2);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.48)';
  ctx.font = '500 22px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('CONTEST DELTA', 64, 566);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(34, 211, 238, 0.88)';
  ctx.fillText('TOP 6.2%', w - 64, 566);

  return finalizeTexture(canvas, maxAnisotropy);
}

export function createAcademicCardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const [canvas, ctx] = makeCanvas(w, h);

  ctx.clearRect(0, 0, w, h);
  drawCardHeader(ctx, w, 'Academic Trend', '4 Semesters', '#22d3ee');

  // Subtle vertical semester columns
  const semLabels = ['SEM 01', 'SEM 02', 'SEM 03', 'SEM 04'];
  const xs = [165, 395, 625, 855];

  xs.forEach((x, idx) => {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 185);
    ctx.lineTo(x, 495);
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.56)';
    ctx.font = '500 22px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(semLabels[idx], x, 548);
  });

  // Horizontal subtle grid lines
  for (let i = 0; i < 3; i++) {
    const y = 225 + i * 110;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.beginPath();
    ctx.moveTo(72, y);
    ctx.lineTo(w - 72, y);
    ctx.stroke();
  }

  return finalizeTexture(canvas, maxAnisotropy);
}

export function createInternshipMatchTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 1280;
  const [canvas, ctx] = makeCanvas(w, h);

  ctx.clearRect(0, 0, w, h);
  drawCardHeader(ctx, w, 'Internship Match', 'READY', '#10b981');

  // Center readiness ring core typography (3D emerald ring wraps around this center)
  const cx = w / 2;
  const cy = 435;

  // Soft radial backing glow behind readiness percentage
  const radial = ctx.createRadialGradient(cx, cy, 20, cx, cy, 210);
  radial.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
  radial.addColorStop(0.65, 'rgba(34, 211, 238, 0.05)');
  radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(cx, cy, 210, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.96)';
  ctx.font = '700 108px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('94%', cx, cy - 12);

  ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
  ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('Readiness Index', cx, cy + 68);

  // Subtle divider above match tracks
  ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.fillRect(64, 725, w - 128, 2);

  const roles = [
    { label: 'Systems Engineering', pct: '94%' },
    { label: 'ML Infrastructure', pct: '91%' },
    { label: 'Distributed Cloud', pct: '89%' },
  ];

  roles.forEach((role, idx) => {
    const baseY = 815 + idx * 145;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
    ctx.font = '500 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(role.label, 68, baseY);

    ctx.fillStyle = idx === 0 ? '#10b981' : '#22d3ee';
    ctx.font = '600 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(role.pct, w - 68, baseY);

    // Recessed progress bar slot (3D luminous bar hovers inside this slot)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(68, baseY + 34, w - 136, 18, 9);
    ctx.fill();
    ctx.stroke();
  });

  return finalizeTexture(canvas, maxAnisotropy);
}
