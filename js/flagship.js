// ═══ HAILEY DEVICE REPAIR — FLAGSHIP JS v2 ═══
// Circuit traces, magnetic buttons, 3D tilt, counters, scroll progress

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── PCB Board — Copper Traces, Pads, and Live Signals ────────────────────
const hero = document.getElementById('hero');
const heroSpotlight = document.getElementById('heroSpotlight');
const pcbCanvas = document.getElementById('pcbCanvas');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const sideOrder = ['top', 'right', 'bottom', 'left'];
  const chipLabels = ['U1', 'U2', 'Q3', 'R7', 'C5', 'D8', 'L2', 'J9', 'P4'];
  const monoFont = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace';

let pointer = { x: 0, y: 0, active: false };

function setHeroPointer(clientX, clientY) {
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const x = clamp(clientX - rect.left, 0, rect.width);
  const y = clamp(clientY - rect.top, 0, rect.height);
  pointer = { x, y, active: true };

  hero.style.setProperty('--mx', `${((x / rect.width) * 100).toFixed(2)}%`);
  hero.style.setProperty('--my', `${((y / rect.height) * 100).toFixed(2)}%`);
  hero.style.setProperty('--px', `${((x - rect.width / 2) * 0.035).toFixed(2)}px`);
  hero.style.setProperty('--py', `${((y - rect.height / 2) * 0.03).toFixed(2)}px`);
}

if (hero && !prefersReducedMotion) {
  hero.style.setProperty('--mx', '50%');
  hero.style.setProperty('--my', '38%');
  hero.style.setProperty('--px', '0px');
  hero.style.setProperty('--py', '0px');

  const resetHeroPointer = () => {
    pointer.active = false;
    hero.style.setProperty('--mx', '50%');
    hero.style.setProperty('--my', '38%');
    hero.style.setProperty('--px', '0px');
    hero.style.setProperty('--py', '0px');
  };

  hero.addEventListener('pointermove', e => setHeroPointer(e.clientX, e.clientY));
  hero.addEventListener('pointerenter', e => setHeroPointer(e.clientX, e.clientY));
  hero.addEventListener('pointerdown', e => setHeroPointer(e.clientX, e.clientY));
  hero.addEventListener('pointerleave', resetHeroPointer);
}

if (hero && pcbCanvas) {
  const ctx = pcbCanvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let boardRect = null;
  let traces = [];
  let chips = [];
  let boardHoles = [];
  let probe = { x: 0, y: 0 };

  function roundRectPath(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    pcbCanvas.width = width * dpr;
    pcbCanvas.height = height * dpr;
    pcbCanvas.style.width = `${width}px`;
    pcbCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const marginX = Math.max(18, Math.round(width * 0.045));
    const marginY = Math.max(20, Math.round(height * 0.055));
    boardRect = {
      x: marginX,
      y: marginY,
      w: width - marginX * 2,
      h: height - marginY * 2,
      r: Math.max(28, Math.min(width, height) * 0.045)
    };

    probe.x = width * 0.52;
    probe.y = height * 0.37;
    buildBoard();
  }

  function sidePoint(side, t, jitter = 0) {
    const xMin = boardRect.x + boardRect.w * 0.08;
    const xMax = boardRect.x + boardRect.w * 0.92;
    const yMin = boardRect.y + boardRect.h * 0.12;
    const yMax = boardRect.y + boardRect.h * 0.88;
    const xMidLeft = boardRect.x + boardRect.w * 0.16;
    const xMidRight = boardRect.x + boardRect.w * 0.84;
    const yMidTop = boardRect.y + boardRect.h * 0.16;
    const yMidBottom = boardRect.y + boardRect.h * 0.84;
    const j = jitter;

    switch (side) {
      case 'top':
        return { side, x: lerp(xMin, xMax, t) + j, y: yMidTop + j * 0.35 };
      case 'bottom':
        return { side, x: lerp(xMin, xMax, t) + j, y: yMidBottom + j * 0.35 };
      case 'left':
        return { side, x: xMidLeft + j * 0.35, y: lerp(yMin, yMax, t) + j };
      case 'right':
      default:
        return { side, x: xMidRight + j * 0.35, y: lerp(yMin, yMax, t) + j };
    }
  }

  function routeTrace(start, end) {
    const lanes = {
      top: boardRect.y + boardRect.h * 0.18,
      bottom: boardRect.y + boardRect.h * 0.82,
      left: boardRect.x + boardRect.w * 0.18,
      right: boardRect.x + boardRect.w * 0.82
    };
    const laneBias = Math.random() > 0.5 ? 1 : -1;

    if ((start.side === 'left' && end.side === 'right') || (start.side === 'right' && end.side === 'left')) {
      const laneY = (Math.random() > 0.5 ? lanes.top : lanes.bottom) + laneBias * 4;
      return [
        start,
        { x: start.x, y: laneY },
        { x: end.x, y: laneY },
        end
      ];
    }

    if ((start.side === 'top' && end.side === 'bottom') || (start.side === 'bottom' && end.side === 'top')) {
      const laneX = (Math.random() > 0.5 ? lanes.left : lanes.right) + laneBias * 4;
      return [
        start,
        { x: laneX, y: start.y },
        { x: laneX, y: end.y },
        end
      ];
    }

    const viaX = (start.side === 'left' || end.side === 'left') ? lanes.left : lanes.right;
    const viaY = (start.side === 'top' || end.side === 'top') ? lanes.top : lanes.bottom;

    return [
      start,
      { x: start.x, y: viaY },
      { x: viaX, y: viaY },
      { x: viaX, y: end.y },
      end
    ];
  }

  function buildSegments(points) {
    const segments = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 0.001;
      segments.push({ a, b, len, start: total, end: total + len });
      total += len;
    }
    return { segments, total };
  }

  function pointOnPath(metrics, t) {
    if (!metrics.total) return { x: 0, y: 0, segment: null };
    const distance = (((t % 1) + 1) % 1) * metrics.total;
    const segment = metrics.segments.find(seg => distance >= seg.start && distance <= seg.end) || metrics.segments[metrics.segments.length - 1];
    const local = clamp((distance - segment.start) / segment.len, 0, 1);
    return {
      x: lerp(segment.a.x, segment.b.x, local),
      y: lerp(segment.a.y, segment.b.y, local),
      segment
    };
  }

  function nearestPointOnPath(metrics, x, y) {
    let best = { dist: Infinity, x: 0, y: 0, segment: null };
    metrics.segments.forEach(segment => {
      const vx = segment.b.x - segment.a.x;
      const vy = segment.b.y - segment.a.y;
      const len2 = vx * vx + vy * vy || 1;
      let t = ((x - segment.a.x) * vx + (y - segment.a.y) * vy) / len2;
      t = clamp(t, 0, 1);
      const px = segment.a.x + vx * t;
      const py = segment.a.y + vy * t;
      const dist = Math.hypot(x - px, y - py);
      if (dist < best.dist) {
        best = { dist, x: px, y: py, segment };
      }
    });
    return best;
  }

  function buildBoard() {
    traces = [];
    chips = [];
    boardHoles = [];

    const traceCount = width < 768 ? 8 : 15;
    const topStops = [0.08, 0.23, 0.39, 0.55, 0.71, 0.9];
    const bottomStops = [0.1, 0.28, 0.45, 0.62, 0.79, 0.92];
    const leftStops = [0.16, 0.34, 0.54, 0.74, 0.86];
    const rightStops = [0.16, 0.31, 0.49, 0.68, 0.84];
    const sideStops = { top: topStops, bottom: bottomStops, left: leftStops, right: rightStops };

    for (let i = 0; i < traceCount; i++) {
      const startSide = sideOrder[i % sideOrder.length];
      let endSide = sideOrder[(i + 2 + Math.floor(Math.random() * 3)) % sideOrder.length];
      if (endSide === startSide) endSide = sideOrder[(sideOrder.indexOf(startSide) + 1) % sideOrder.length];

      const start = sidePoint(startSide, sideStops[startSide][Math.floor(Math.random() * sideStops[startSide].length)], (Math.random() - 0.5) * 8);
      const end = sidePoint(endSide, sideStops[endSide][Math.floor(Math.random() * sideStops[endSide].length)], (Math.random() - 0.5) * 8);
      const path = routeTrace(start, end);
      const metrics = buildSegments(path);
      traces.push({
        points: path,
        metrics,
        width: width < 768 ? 1.35 + Math.random() * 0.8 : 1.55 + Math.random() * 1.05,
        phase: Math.random() * TAU,
        speed: 0.55 + Math.random() * 0.85,
        baseAlpha: 0.08 + Math.random() * 0.08,
        pulses: Array.from({ length: width < 768 ? 1 : 2 }, () => ({
          phase: Math.random(),
          speed: 0.3 + Math.random() * 0.9,
          size: 1.4 + Math.random() * 1.8
        }))
      });
    }

    const chipCount = width < 768 ? 5 : 8;
    for (let i = 0; i < chipCount; i++) {
      const side = sideOrder[i % sideOrder.length];
      const t = sideStops[side][Math.floor(Math.random() * sideStops[side].length)];
      const pinCount = 5 + Math.floor(Math.random() * 4);
      const chipWidth = width < 768 ? 42 + Math.random() * 10 : 52 + Math.random() * 16;
      const chipHeight = width < 768 ? 20 + Math.random() * 6 : 24 + Math.random() * 10;
      const p = sidePoint(side, t, (Math.random() - 0.5) * 10);
      chips.push({
        x: p.x,
        y: p.y,
        w: chipWidth,
        h: chipHeight,
        label: chipLabels[i % chipLabels.length],
        pins: pinCount,
        side,
        phase: Math.random() * TAU,
        glow: 0.08 + Math.random() * 0.14
      });
    }

    boardHoles = [
      { x: boardRect.x + 16, y: boardRect.y + 16 },
      { x: boardRect.x + boardRect.w - 16, y: boardRect.y + 16 },
      { x: boardRect.x + 16, y: boardRect.y + boardRect.h - 16 },
      { x: boardRect.x + boardRect.w - 16, y: boardRect.y + boardRect.h - 16 }
    ];
  }

  function drawBoardBackground(now) {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#13100d');
    bg.addColorStop(0.58, '#0c0a09');
    bg.addColorStop(1, '#070605');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const ambient = ctx.createRadialGradient(width * 0.52, height * 0.36, 0, width * 0.52, height * 0.36, Math.max(width, height) * 0.75);
    ambient.addColorStop(0, 'rgba(245,158,11,0.08)');
    ambient.addColorStop(0.5, 'rgba(245,158,11,0.02)');
    ambient.addColorStop(1, 'rgba(245,158,11,0)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, width, height);

    roundRectPath(boardRect.x, boardRect.y, boardRect.w, boardRect.h, boardRect.r);
    const panel = ctx.createLinearGradient(boardRect.x, boardRect.y, boardRect.x, boardRect.y + boardRect.h);
    panel.addColorStop(0, 'rgba(17, 21, 18, 0.96)');
    panel.addColorStop(1, 'rgba(9, 11, 10, 0.97)');
    ctx.fillStyle = panel;
    ctx.fill();

    ctx.save();
    roundRectPath(boardRect.x, boardRect.y, boardRect.w, boardRect.h, boardRect.r);
    ctx.clip();

    // PCB grid / substrate etch
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.018)';
    const gridStep = width < 768 ? 42 : 54;
    for (let gx = boardRect.x + 18; gx < boardRect.x + boardRect.w - 18; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, boardRect.y + 10);
      ctx.lineTo(gx, boardRect.y + boardRect.h - 10);
      ctx.stroke();
    }
    for (let gy = boardRect.y + 18; gy < boardRect.y + boardRect.h - 18; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(boardRect.x + 10, gy);
      ctx.lineTo(boardRect.x + boardRect.w - 10, gy);
      ctx.stroke();
    }

    // Tiny via dots across the board
    ctx.fillStyle = 'rgba(245,158,11,0.05)';
    for (let vx = boardRect.x + 22; vx < boardRect.x + boardRect.w - 22; vx += gridStep) {
      for (let vy = boardRect.y + 22; vy < boardRect.y + boardRect.h - 22; vy += gridStep) {
        ctx.beginPath();
        ctx.arc(vx + ((vy / 10) % 4), vy + ((vx / 10) % 4), 0.9, 0, TAU);
        ctx.fill();
      }
    }

    // subtle moving scan bar
    const scanY = boardRect.y + ((now * 0.04) % (boardRect.h + 90)) - 45;
    const scanGlow = ctx.createLinearGradient(boardRect.x, scanY, boardRect.x, scanY + 2);
    scanGlow.addColorStop(0, 'rgba(245,158,11,0)');
    scanGlow.addColorStop(0.5, 'rgba(251,191,36,0.10)');
    scanGlow.addColorStop(1, 'rgba(245,158,11,0)');
    ctx.strokeStyle = scanGlow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boardRect.x + 6, scanY);
    ctx.lineTo(boardRect.x + boardRect.w - 6, scanY);
    ctx.stroke();

    // Board holes / fiducials
    boardHoles.forEach(hole => {
      ctx.fillStyle = 'rgba(3, 3, 3, 0.82)';
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, 7.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251,191,36,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, 10.5, 0, TAU);
      ctx.stroke();
    });

    ctx.restore();

    roundRectPath(boardRect.x, boardRect.y, boardRect.w, boardRect.h, boardRect.r);
    ctx.strokeStyle = 'rgba(245,158,11,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawTrace(trace, now) {
    const nearest = nearestPointOnPath(trace.metrics, probe.x, probe.y);
    const boost = clamp(1 - nearest.dist / (width < 768 ? 150 : 210), 0, 1);
    const wave = 0.55 + 0.45 * Math.sin(now * 0.0012 * trace.speed + trace.phase);
    const pulseAlpha = trace.baseAlpha + wave * 0.09 + boost * 0.28;

    // main copper track
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(185, 119, 31, ${pulseAlpha})`;
    ctx.lineWidth = trace.width;
    ctx.beginPath();
    trace.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // bright inner signal trace
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.08 + boost * 0.42 + wave * 0.13})`;
    ctx.lineWidth = Math.max(1, trace.width * 0.42);
    ctx.beginPath();
    trace.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // vias / pads on corners
    trace.points.forEach((point, index) => {
      const padBoost = index === 0 || index === trace.points.length - 1 ? 1 : 0.75;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.10 + boost * 0.3 + padBoost * 0.06})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(245, 158, 11, ${0.18 + boost * 0.35})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.1, 0, TAU);
      ctx.fill();
    });

    // moving signals
    trace.pulses.forEach(pulse => {
      const progress = (now * 0.00018 * pulse.speed + pulse.phase) % 1;
      const point = pointOnPath(trace.metrics, progress);
      ctx.shadowColor = 'rgba(251,191,36,0.85)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.42 + boost * 0.35})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pulse.size, 0, TAU);
      ctx.fill();

      const tail = pointOnPath(trace.metrics, progress - 0.035);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 214, 102, ${0.20 + boost * 0.25})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    });
  }

  function drawChip(chip, now) {
    const hot = clamp(1 - Math.hypot(probe.x - chip.x, probe.y - chip.y) / (width < 768 ? 180 : 240), 0, 1);
    const pulse = 0.55 + 0.45 * Math.sin(now * 0.0013 + chip.phase);
    const glow = chip.glow + hot * 0.28 + pulse * 0.05;
    const x = chip.x - chip.w / 2;
    const y = chip.y - chip.h / 2;
    const pinCount = chip.pins;
    const pinStep = chip.w / (pinCount + 1);

    // soft component glow
    const g = ctx.createRadialGradient(chip.x, chip.y, 0, chip.x, chip.y, Math.max(chip.w, chip.h) * 1.6);
    g.addColorStop(0, `rgba(245,158,11,${0.12 + glow * 0.35})`);
    g.addColorStop(1, 'rgba(245,158,11,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(chip.x, chip.y, Math.max(chip.w, chip.h) * 1.45, 0, TAU);
    ctx.fill();

    // body
    ctx.fillStyle = 'rgba(20, 20, 18, 0.96)';
    roundRectPath(x, y, chip.w, chip.h, 6);
    ctx.fill();
    ctx.strokeStyle = `rgba(251,191,36,${0.10 + hot * 0.26})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // pin legs
    ctx.strokeStyle = `rgba(245,158,11,${0.18 + hot * 0.35})`;
    ctx.lineWidth = 1;
    for (let i = 1; i <= pinCount; i++) {
      const pinX = x + pinStep * i;
      ctx.beginPath();
      ctx.moveTo(pinX, y);
      ctx.lineTo(pinX, y - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pinX, y + chip.h);
      ctx.lineTo(pinX, y + chip.h + 4);
      ctx.stroke();
    }

    // chip face text
    ctx.fillStyle = `rgba(251,191,36,${0.4 + hot * 0.3})`;
    ctx.font = `${width < 768 ? 9 : 10}px ${monoFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(chip.label, chip.x, chip.y - 0.5);

    // status LED
    ctx.fillStyle = `rgba(251,191,36,${0.5 + hot * 0.4})`;
    ctx.beginPath();
    ctx.arc(x + chip.w - 7, y + 7, 1.4 + hot * 0.8, 0, TAU);
    ctx.fill();
  }

  function drawProbe(now) {
    const closest = traces.reduce((best, trace) => {
      const point = nearestPointOnPath(trace.metrics, probe.x, probe.y);
      return point.dist < best.dist ? point : best;
    }, { dist: Infinity, x: probe.x, y: probe.y, segment: null });
    const link = clamp(1 - closest.dist / (width < 768 ? 170 : 240), 0, 1);

    // energy tether from cursor to nearest trace
    if (link > 0.03) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = 'rgba(251,191,36,0.95)';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = `rgba(251,191,36,${0.14 + link * 0.36})`;
      ctx.lineWidth = 1.3 + link * 1.2;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(probe.x, probe.y);
      ctx.lineTo(closest.x, closest.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(251,191,36,${0.42 + link * 0.5})`;
      ctx.beginPath();
      ctx.arc(closest.x, closest.y, 2.8 + link * 1.8, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // moving probe orb
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const orb = ctx.createRadialGradient(probe.x, probe.y, 0, probe.x, probe.y, width < 768 ? 36 : 48);
    orb.addColorStop(0, 'rgba(255,240,186,0.95)');
    orb.addColorStop(0.3, 'rgba(251,191,36,0.5)');
    orb.addColorStop(1, 'rgba(245,158,11,0)');
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(probe.x, probe.y, width < 768 ? 18 : 24, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function render(now) {
    const targetX = pointer.active ? pointer.x : width * (0.52 + 0.045 * Math.sin(now * 0.00023));
    const targetY = pointer.active ? pointer.y : height * (0.37 + 0.03 * Math.cos(now * 0.00018));
    probe.x = probe.x ? lerp(probe.x, targetX, pointer.active ? 0.12 : 0.028) : targetX;
    probe.y = probe.y ? lerp(probe.y, targetY, pointer.active ? 0.12 : 0.028) : targetY;

    drawBoardBackground(now);
    traces.forEach(trace => drawTrace(trace, now));
    chips.forEach(chip => drawChip(chip, now));
    drawProbe(now);

    if (!prefersReducedMotion) requestAnimationFrame(render);
  }

  resize();
  if (prefersReducedMotion) {
    render(performance.now());
  } else {
    requestAnimationFrame(render);
  }
  window.addEventListener('resize', resize, { passive: true });
}

  // ─── Typewriter Effect ──────────────────────────────────────────────
  const typewriter = document.getElementById('typewriter');
  if (typewriter && !prefersReducedMotion) {
    const text = "Bring it back.";
    let i = 0;
    function type() {
      if (i < text.length) {
        typewriter.textContent += text.charAt(i);
        i++;
        setTimeout(type, 80 + Math.random() * 60);
      }
    }
    setTimeout(type, 600);
  } else if (typewriter) {
    typewriter.textContent = "Bring it back.";
  }

  // ─── Scroll Progress Bar ─────────────────────────────────────────────
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.width = progress + '%';
    }, { passive: true });
  }

  // ─── Scroll Reveal ─────────────────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');
  if (!prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // ─── Animated Counters ───────────────────────────────────────────────
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!prefersReducedMotion) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.target);
          const decimals = parseInt(el.dataset.decimals || '0');
          const suffix = el.dataset.suffix || '';
          const duration = 1500;
          const startTime = performance.now();
          
          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            el.textContent = current.toFixed(decimals) + suffix;
            
            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          }
          
          requestAnimationFrame(updateCounter);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => counterObserver.observe(el));
  } else {
    statNumbers.forEach(el => {
      const target = parseFloat(el.dataset.target);
      const decimals = parseInt(el.dataset.decimals || '0');
      const suffix = el.dataset.suffix || '';
      el.textContent = target.toFixed(decimals) + suffix;
    });
  }

  // ─── Magnetic Buttons ─────────────────────────────────────────────────
  if (!prefersReducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  // ─── 3D Card Tilt ─────────────────────────────────────────────────────────
  if (!prefersReducedMotion && !window.matchMedia('(pointer: coarse)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -8;
        const rotateY = (x - centerX) / centerX * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  // ─── Nav Scroll Shadow ─────────────────────────────────────────────────
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // ─── Mobile Nav ─────────────────────────────────────────────────────────
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobile');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !expanded);
      mobileMenu.classList.toggle('open');
      mobileMenu.setAttribute('aria-hidden', expanded);
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // ─── Back to Top ─────────────────────────────────────────────────────────
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // ─── Smooth Scroll for Anchor Links ──────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ 
          behavior: prefersReducedMotion ? 'auto' : 'smooth', 
          block: 'start' 
        });
      }
    });
  });

})();
