// ═══ HAILEY DEVICE REPAIR — FLAGSHIP JS v2 ═══
// Circuit traces, magnetic buttons, 3D tilt, counters, scroll progress

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Circuit Canvas — PCB Branching Traces ──────────────────────────────
  const canvas = document.getElementById('circuitCanvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let width, height, dpr;
    const traces = [];
    const TRACE_COUNT = 12;
    let mouse = { x: -1000, y: -1000 };

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createTrace() {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      const segments = [];
      let x = startX, y = startY;
      const segCount = 3 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < segCount; i++) {
        const isHorizontal = Math.random() > 0.5;
        const length = 40 + Math.random() * 120;
        const nextX = isHorizontal ? x + (Math.random() > 0.5 ? length : -length) : x;
        const nextY = isHorizontal ? y : y + (Math.random() > 0.5 ? length : -length);
        
        segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
        
        // Add node at junction
        segments.push({ node: true, x: nextX, y: nextY, radius: 1.5 + Math.random() });
        
        x = nextX;
        y = nextY;
      }
      
      return {
        segments: segments,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02,
        opacity: 0.1 + Math.random() * 0.2
      };
    }

    function initTraces() {
      traces.length = 0;
      for (let i = 0; i < TRACE_COUNT; i++) {
        traces.push(createTrace());
      }
    }

    function drawTraces() {
      ctx.clearRect(0, 0, width, height);
      
      traces.forEach(trace => {
        trace.pulse += trace.pulseSpeed;
        const pulseFactor = 0.5 + 0.5 * Math.sin(trace.pulse);
        
        trace.segments.forEach(seg => {
          if (seg.node) {
            // Draw node
            const glow = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, seg.radius * 4);
            glow.addColorStop(0, `rgba(245, 158, 11, ${trace.opacity * pulseFactor * 0.5})`);
            glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.radius * 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = `rgba(245, 158, 11, ${trace.opacity * pulseFactor})`;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.radius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Draw trace line
            ctx.strokeStyle = `rgba(245, 158, 11, ${trace.opacity * pulseFactor * 0.5})`;
            ctx.lineWidth = 0.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();
            
            // Draw flowing dot on trace
            const t = (Date.now() % 3000) / 3000;
            const dotX = seg.x1 + (seg.x2 - seg.x1) * t;
            const dotY = seg.y1 + (seg.y2 - seg.y1) * t;
            ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + 0.4 * pulseFactor})`;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
      
      requestAnimationFrame(drawTraces);
    }

    canvas.parentElement.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    resize();
    initTraces();
    drawTraces();
    window.addEventListener('resize', () => { resize(); initTraces(); });
  }

  // ─── Typewriter Effect ──────────────────────────────────────────────
  const typewriter = document.getElementById('typewriter');
  if (typewriter && !prefersReducedMotion) {
    const text = "Let me fix it.";
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
    typewriter.textContent = "Let me fix it.";
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
