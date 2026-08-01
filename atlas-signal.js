(() => {
  'use strict';

  const body = document.body;
  const canvas = document.querySelector('#signal-field');
  const ctx = canvas.getContext('2d', { alpha: true });
  const textarea = document.querySelector('#emotion-text');
  const counter = document.querySelector('#char-count');
  const chips = [...document.querySelectorAll('.emotion-chip')];
  const continueButton = document.querySelector('#continue-button');
  const modal = document.querySelector('#path-modal');
  const modalContext = document.querySelector('#modal-context');
  const header = document.querySelector('.site-header');
  const cursor = document.querySelector('.cursor');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const palettes = {
    neutral: { rgb: [49, 92, 255], amplitude: 0.62, speed: 0.34, spread: 0.55 },
    anxious: { rgb: [49, 92, 255], amplitude: 1.22, speed: 0.9, spread: 0.32 },
    lost: { rgb: [111, 115, 167], amplitude: 0.86, speed: 0.45, spread: 0.72 },
    sad: { rgb: [87, 127, 159], amplitude: 0.52, speed: 0.22, spread: 0.82 },
    tired: { rgb: [161, 132, 109], amplitude: 0.32, speed: 0.16, spread: 0.92 },
    angry: { rgb: [213, 79, 69], amplitude: 1.42, speed: 1.06, spread: 0.24 }
  };

  let emotion = 'neutral';
  let typedEnergy = 0;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let animationFrame = null;
  let start = performance.now();

  class SignalLine {
    constructor(index, total) {
      this.index = index;
      this.total = total;
      this.seed = Math.random() * 1000;
      this.offset = (index / Math.max(total - 1, 1) - 0.5);
      this.weight = index % 7 === 0 ? 1.35 : 0.72;
      this.opacity = 0.045 + Math.random() * 0.12;
      this.drift = 0.5 + Math.random() * 0.9;
    }

    draw(time, state) {
      const { rgb, amplitude, speed, spread } = state;
      const responsiveAmplitude = Math.min(width, height) * (0.035 + amplitude * 0.035 + typedEnergy * 0.028);
      const centerY = height * (0.54 + (pointerY - 0.5) * 0.09);
      const baseline = centerY + this.offset * height * spread;
      const phase = time * speed * this.drift + this.seed;
      const cursorPull = (pointerX - 0.5) * width * 0.08;

      ctx.beginPath();
      const segments = Math.max(70, Math.floor(width / 18));
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const x = t * width;
        const envelope = Math.sin(Math.PI * t);
        const y = baseline
          + Math.sin(t * Math.PI * (2.2 + this.index * 0.018) + phase) * responsiveAmplitude * envelope
          + Math.sin(t * 13.0 + phase * 0.58) * responsiveAmplitude * 0.18
          + cursorPull * envelope * (this.offset * 0.35);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${rgb.join(',')},${this.opacity})`;
      ctx.lineWidth = this.weight * pixelRatio;
      ctx.stroke();
    }
  }

  const lines = Array.from({ length: 46 }, (_, index) => new SignalLine(index, 46));

  function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.8);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function render(now) {
    const elapsed = (now - start) / 1000;
    const state = palettes[emotion];
    ctx.clearRect(0, 0, width, height);

    const wash = ctx.createRadialGradient(
      width * (0.69 + (pointerX - 0.5) * 0.06),
      height * (0.42 + (pointerY - 0.5) * 0.04),
      0,
      width * 0.68,
      height * 0.45,
      Math.max(width, height) * 0.64
    );
    wash.addColorStop(0, `rgba(${state.rgb.join(',')},${0.09 + typedEnergy * 0.04})`);
    wash.addColorStop(1, 'rgba(243,241,236,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    lines.forEach(line => line.draw(elapsed, state));
    animationFrame = requestAnimationFrame(render);
  }

  function setEmotion(next) {
    emotion = next;
    body.dataset.emotion = next;
    chips.forEach(chip => chip.classList.toggle('is-active', chip.dataset.emotion === next));
  }

  function updateTextState() {
    const length = textarea.value.trim().length;
    counter.textContent = `${textarea.value.length} / 420`;
    typedEnergy += ((Math.min(length / 180, 1)) - typedEnergy) * 0.25;
    continueButton.classList.toggle('is-ready', length > 2);
  }

  function openModal() {
    const text = textarea.value.trim();
    modalContext.textContent = text
      ? `À partir de « ${text.slice(0, 92)}${text.length > 92 ? '…' : ''} », choisissez le type d’aide qui vous semble le plus utile maintenant.`
      : 'Choisissez un chemin. Vous pourrez revenir en arrière à tout moment.';
    modal.hidden = false;
    body.classList.add('modal-open');
    window.setTimeout(() => modal.querySelector('.modal-close').focus(), 20);
  }

  function closeModal() {
    modal.hidden = true;
    body.classList.remove('modal-open');
    continueButton.focus();
  }

  chips.forEach(chip => chip.addEventListener('click', () => setEmotion(chip.dataset.emotion)));
  textarea.addEventListener('input', updateTextState);
  continueButton.addEventListener('click', openModal);

  modal.addEventListener('click', event => {
    const closeTarget = event.target.closest('[data-close-modal]');
    if (closeTarget) closeModal();

    const pathButton = event.target.closest('[data-path]');
    if (pathButton) {
      const target = {
        understand: '#comprendre',
        calm: '#apaiser',
        human: '#relier'
      }[pathButton.dataset.path];
      closeModal();
      window.setTimeout(() => document.querySelector(target)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }), 30);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  window.addEventListener('scroll', () => {
    header.classList.toggle('is-scrolled', window.scrollY > 30);
  }, { passive: true });

  window.addEventListener('pointermove', event => {
    pointerX = event.clientX / Math.max(window.innerWidth, 1);
    pointerY = event.clientY / Math.max(window.innerHeight, 1);
    if (cursor) {
      cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    }
  }, { passive: true });

  document.querySelectorAll('a, button, textarea').forEach(element => {
    element.addEventListener('mouseenter', () => cursor?.classList.add('is-hovering'));
    element.addEventListener('mouseleave', () => cursor?.classList.remove('is-hovering'));
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.18 });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

  const chapterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-active', entry.isIntersecting));
  }, { threshold: 0.45 });
  document.querySelectorAll('.chapter').forEach(chapter => chapterObserver.observe(chapter));

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateTextState();

  if (!reducedMotion) animationFrame = requestAnimationFrame(render);
  else canvas.hidden = true;

  window.addEventListener('pagehide', () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });
})();
