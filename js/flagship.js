// ═══ HAILEY DEVICE REPAIR — FLAGSHIP JS v2 ═══
// Circuit traces, magnetic buttons, 3D tilt, counters, scroll progress

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Hero Motion — Repair Halo, Smoke, and Scope ─────────────────────────
const hero = document.getElementById('hero');
const heroSpotlight = document.getElementById('heroSpotlight');
const smokeCanvas = document.getElementById('smokeCanvas');
const scopeCanvas = document.getElementById('scopeCanvas');

let pointer = { x: 50, y: 36, active: false };

function setHeroPointer(clientX, clientY) {
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
  pointer = { x, y, active: true };

  hero.style.setProperty('--mx', `${x.toFixed(2)}%`);
  hero.style.setProperty('--my', `${y.toFixed(2)}%`);
  hero.style.setProperty('--px', `${((x - 50) * 0.34).toFixed(2)}px`);
  hero.style.setProperty('--py', `${((y - 36) * 0.28).toFixed(2)}px`);
}

if (hero && !prefersReducedMotion) {
  hero.style.setProperty('--mx', '50%');
  hero.style.setProperty('--my', '36%');
  hero.style.setProperty('--px', '0px');
  hero.style.setProperty('--py', '0px');

  const resetHeroPointer = () => {
    pointer.active = false;
    pointer = { x: 50, y: 36, active: false };
    hero.style.setProperty('--mx', '50%');
    hero.style.setProperty('--my', '36%');
    hero.style.setProperty('--px', '0px');
    hero.style.setProperty('--py', '0px');
  };

  hero.addEventListener('pointermove', e => setHeroPointer(e.clientX, e.clientY));
  hero.addEventListener('pointerenter', e => setHeroPointer(e.clientX, e.clientY));
  hero.addEventListener('pointerleave', resetHeroPointer);
}

if (hero && smokeCanvas && scopeCanvas && !prefersReducedMotion) {
  const smokeCtx = smokeCanvas.getContext('2d');
  const scopeCtx = scopeCanvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let smokeParticles = [];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function makeSmokeParticle(spawnHigh = false) {
    const baseX = width * (0.34 + Math.random() * 0.32);
    return {
      x: baseX + (Math.random() - 0.5) * width * 0.14,
      y: spawnHigh ? height * (0.18 + Math.random() * 0.32) : height * (0.55 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 0.14,
      vy: -(0.16 + Math.random() * 0.34),
      size: 34 + Math.random() * 88,
      alpha: 0.028 + Math.random() * 0.045,
      wobble: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function resizeHeroCanvases() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    [smokeCanvas, scopeCanvas].forEach(canvas => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    });

    smokeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scopeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    smokeParticles = Array.from({ length: width < 768 ? 14 : 24 }, () => makeSmokeParticle(true));
  }

  function drawSmokeFrame(now) {
    smokeCtx.globalCompositeOperation = 'source-over';
    smokeCtx.fillStyle = 'rgba(12, 10, 9, 0.085)';
    smokeCtx.fillRect(0, 0, width, height);
    smokeCtx.globalCompositeOperation = 'lighter';

    smokeParticles.forEach((particle, index) => {
      particle.wobble += 0.008 + index * 0.0002;
      particle.x += particle.vx + Math.sin(now * 0.00038 + particle.phase) * 0.06;
      particle.y += particle.vy;
      particle.size += 0.01;

      if (particle.y + particle.size < -40) {
        Object.assign(particle, makeSmokeParticle(false));
        particle.y = height + Math.random() * 50;
      }
      if (particle.x < -90) particle.x = width + 60;
      if (particle.x > width + 90) particle.x = -60;

      const pulse = 0.72 + 0.28 * Math.sin(now * 0.0011 + particle.phase);
      const alpha = particle.alpha * pulse;
      const gradient = smokeCtx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
      gradient.addColorStop(0, `rgba(251, 191, 36, ${alpha})`);
      gradient.addColorStop(0.35, `rgba(245, 158, 11, ${alpha * 0.6})`);
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');

      smokeCtx.fillStyle = gradient;
      smokeCtx.beginPath();
      smokeCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      smokeCtx.fill();
    });

    requestAnimationFrame(drawSmokeFrame);
  }

  function drawScopeFrame(now) {
    scopeCtx.clearRect(0, 0, width, height);
    scopeCtx.save();
    scopeCtx.globalCompositeOperation = 'lighter';
    scopeCtx.lineJoin = 'round';
    scopeCtx.lineCap = 'round';

    const pointerPull = clamp((pointer.y - 36) / 50, -1, 1);
    const midY = height * (0.44 + pointerPull * 0.035);
    const amp = Math.min(height * 0.08, 72);
    const points = [];

    for (let x = 0; x <= width; x += 4) {
      const t = x / width;
      const wave =
        Math.sin(t * 11 + now * 0.0011) * amp * 0.28 +
        Math.sin(t * 29 - now * 0.0014) * amp * 0.12 +
        Math.sin(t * 4.5 - now * 0.0008) * amp * 0.18;
      const taper = Math.sin(t * Math.PI) * pointerPull * 16;
      points.push([x, midY + wave + taper]);
    }

    const glow = scopeCtx.createLinearGradient(0, 0, width, 0);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0)');
    glow.addColorStop(0.2, 'rgba(245, 158, 11, 0.08)');
    glow.addColorStop(0.5, 'rgba(251, 191, 36, 0.24)');
    glow.addColorStop(0.8, 'rgba(245, 158, 11, 0.08)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');

    scopeCtx.strokeStyle = glow;
    scopeCtx.lineWidth = 9;
    scopeCtx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) scopeCtx.moveTo(x, y);
      else scopeCtx.lineTo(x, y);
    });
    scopeCtx.stroke();

    scopeCtx.strokeStyle = 'rgba(251, 191, 36, 0.82)';
    scopeCtx.lineWidth = 1.5;
    scopeCtx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) scopeCtx.moveTo(x, y);
      else scopeCtx.lineTo(x, y);
    });
    scopeCtx.stroke();

    scopeCtx.shadowColor = 'rgba(245, 158, 11, 0.75)';
    scopeCtx.shadowBlur = 16;
    for (let i = 0; i < points.length; i += 28) {
      const [x, y] = points[i];
      scopeCtx.fillStyle = 'rgba(251, 191, 36, 0.65)';
      scopeCtx.beginPath();
      scopeCtx.arc(x, y, 1.7, 0, Math.PI * 2);
      scopeCtx.fill();
    }

    const beatX = (now * 0.12) % width;
    const beatIndex = Math.max(0, Math.min(points.length - 1, Math.round((beatX / width) * (points.length - 1))));
    const [beatYx, beatY] = points[beatIndex];
    scopeCtx.shadowBlur = 24;
    scopeCtx.fillStyle = 'rgba(251, 191, 36, 0.95)';
    scopeCtx.beginPath();
    scopeCtx.arc(beatYx, beatY, 4.5, 0, Math.PI * 2);
    scopeCtx.fill();

    scopeCtx.restore();
    requestAnimationFrame(drawScopeFrame);
  }

  resizeHeroCanvases();
  drawSmokeFrame(performance.now());
  drawScopeFrame(performance.now());
  window.addEventListener('resize', resizeHeroCanvases, { passive: true });
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
