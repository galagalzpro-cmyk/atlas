(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const loader = document.getElementById('loader');
  const hero = document.querySelector('.hero');
  const header = document.getElementById('floating-header');
  const menuToggle = document.getElementById('menu-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ready = () => setTimeout(() => loader?.classList.add('loaded'), 300);
  if (document.readyState === 'complete') ready(); else addEventListener('load', ready, { once:true });
  setTimeout(ready, 2400);

  addEventListener('pointermove', (event) => {
    root.style.setProperty('--mx', `${event.clientX}px`);
    root.style.setProperty('--my', `${event.clientY}px`);
    if (!reducedMotion) {
      const x = (event.clientX / innerWidth - .5) * 2;
      const y = (event.clientY / innerHeight - .5) * 2;
      root.style.setProperty('--parallax-x', `${x}`);
      root.style.setProperty('--parallax-y', `${y}`);
    }
  }, { passive:true });

  const updateScroll = () => {
    const progress = Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight)));
    root.style.setProperty('--hero-progress', progress.toFixed(4));
    header.classList.toggle('visible', scrollY > hero.offsetHeight * .72);
  };
  addEventListener('scroll', updateScroll, { passive:true });
  updateScroll();

  menuToggle?.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  header?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => header.classList.remove('menu-open')));

  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  }), { threshold:.16, rootMargin:'0px 0px -7% 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Neural field: adaptive, decorative, and non-blocking.
  const canvas = document.getElementById('neural-field');
  const ctx = canvas.getContext('2d', { alpha:true });
  let nodes = [], raf = 0, last = 0;
  const resizeCanvas = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.6);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = innerWidth < 700 ? 22 : Math.min(65, Math.round(innerWidth / 28));
    nodes = Array.from({ length:count }, () => ({
      x:Math.random()*innerWidth, y:Math.random()*innerHeight,
      vx:(Math.random()-.5)*.12, vy:(Math.random()-.5)*.12,
      r:Math.random()*1.2+.25, phase:Math.random()*Math.PI*2
    }));
  };
  const draw = (time) => {
    if (document.hidden || reducedMotion) return;
    if (time-last < 32) { raf=requestAnimationFrame(draw); return; }
    last=time;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for (let i=0;i<nodes.length;i++) {
      const n=nodes[i]; n.x+=n.vx; n.y+=n.vy; n.phase+=.006;
      if(n.x<-20)n.x=innerWidth+20;if(n.x>innerWidth+20)n.x=-20;if(n.y<-20)n.y=innerHeight+20;if(n.y>innerHeight+20)n.y=-20;
      ctx.beginPath();ctx.arc(n.x,n.y,n.r*(1+Math.sin(n.phase)*.3),0,Math.PI*2);ctx.fillStyle='rgba(111,80,255,.36)';ctx.fill();
      for(let j=i+1;j<nodes.length;j++){
        const m=nodes[j],dx=n.x-m.x,dy=n.y-m.y,d=Math.hypot(dx,dy);
        if(d<125){ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(m.x,m.y);ctx.strokeStyle=`rgba(74,92,255,${(1-d/125)*.07})`;ctx.lineWidth=.6;ctx.stroke();}
      }
    }
    raf=requestAnimationFrame(draw);
  };
  resizeCanvas();
  addEventListener('resize', resizeCanvas, { passive:true });
  if (!reducedMotion) raf=requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => { if(!document.hidden && !reducedMotion){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);} });

  // Journey dialog.
  const journey = document.getElementById('journey-dialog');
  const contact = document.getElementById('contact-dialog');
  let chosenEmotion = '';
  document.querySelectorAll('[data-open-journey]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.dialog-step').forEach((s,i) => s.classList.toggle('active', i===0));
    chosenEmotion=''; journey.showModal();
  }));
  document.querySelectorAll('[data-close-dialog]').forEach(b => b.addEventListener('click', () => journey.close()));
  document.querySelectorAll('[data-dialog-emotion]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-dialog-emotion]').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected'); chosenEmotion=b.dataset.dialogEmotion;
    document.querySelector('[data-step="1"]').classList.remove('active');
    document.querySelector('[data-step="2"]').classList.add('active');
  }));
  const range=document.getElementById('intensity-range'), output=document.getElementById('intensity-output');
  range?.addEventListener('input',()=>output.textContent=`${range.value}/10`);
  document.getElementById('dialog-next')?.addEventListener('click',()=>{
    document.querySelector('[data-step="2"]').classList.remove('active');
    document.querySelector('[data-step="3"]').classList.add('active');
    document.getElementById('dialog-result-title').textContent = chosenEmotion === 'Je ne sais pas' ? 'Vous n’avez pas besoin de trouver le mot parfait.' : `Merci. Vous avez indiqué : ${chosenEmotion.toLowerCase()}.`;
    document.getElementById('dialog-result-copy').textContent = `Intensité déclarée : ${range.value}/10. Cette donnée reste locale dans ce prototype et n’est transmise à aucun serveur.`;
  });
  journey?.addEventListener('click',e=>{if(e.target===journey)journey.close()});

  document.querySelectorAll('[data-open-contact]').forEach(b=>b.addEventListener('click',()=>contact.showModal()));
  document.querySelectorAll('[data-close-contact]').forEach(b=>b.addEventListener('click',()=>contact.close()));
  contact?.addEventListener('click',e=>{if(e.target===contact)contact.close()});

  // Emotion cards.
  const emotionResponse=document.getElementById('emotion-response');
  document.querySelectorAll('.emotion-card').forEach(card=>card.addEventListener('click',()=>{
    document.querySelectorAll('.emotion-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    const emotion=card.dataset.emotion;
    emotionResponse.textContent = emotion === 'Je ne sais pas' ? 'Très bien. Nous pouvons commencer sans mettre d’étiquette.' : `Vous avez choisi « ${emotion} ». ATLAS vous demanderait ensuite de confirmer ce choix.`;
  }));

  // Breathing engine.
  const breathToggle=document.getElementById('breath-toggle');
  const breathCore=document.getElementById('breath-core');
  const breathLabel=document.getElementById('breath-label');
  const breathCount=document.getElementById('breath-count');
  const breathCaption=document.getElementById('breath-caption');
  let breathTimer=null, remaining=60, phaseTimer=null, breathing=false;
  const setPhase=(phase)=>{
    breathCore.classList.toggle('inhale',phase==='Inspirez');
    breathLabel.textContent=phase;
    breathCaption.textContent=phase==='Inspirez'?'Laissez l’espace s’ouvrir':phase==='Expirez'?'Relâchez sans forcer':'Restez simplement présent';
  };
  const stopBreath=()=>{
    clearInterval(breathTimer);clearInterval(phaseTimer);breathTimer=phaseTimer=null;breathing=false;remaining=60;
    breathCore.classList.remove('active','inhale');breathLabel.textContent='Prêt';breathCount.textContent='60';breathCaption.textContent='Respiration cohérente';breathToggle.textContent='Lancer 60 secondes';
  };
  breathToggle?.addEventListener('click',()=>{
    if(breathing){stopBreath();return;} breathing=true;breathCore.classList.add('active');breathToggle.textContent='Arrêter';
    let phaseIndex=0;const phases=['Inspirez','Expirez','Repos'];const durations=[4,6,2];let phaseElapsed=0;setPhase(phases[0]);
    breathTimer=setInterval(()=>{remaining--;breathCount.textContent=String(remaining);if(remaining<=0){stopBreath();showToast('Séquence terminée. Prenez un instant avant de continuer.');}},1000);
    phaseTimer=setInterval(()=>{phaseElapsed++;if(phaseElapsed>=durations[phaseIndex]){phaseIndex=(phaseIndex+1)%phases.length;phaseElapsed=0;setPhase(phases[phaseIndex]);}},1000);
  });

  const toast=document.getElementById('toast');let toastTimer;
  function showToast(message){clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),3400);}
  document.querySelectorAll('[data-resource]').forEach(b=>b.addEventListener('click',()=>showToast(`${b.dataset.resource} — module de démonstration.`)));

  // Keyboard escape closes dialogs.
  addEventListener('keydown',e=>{if(e.key==='Escape'){if(journey?.open)journey.close();if(contact?.open)contact.close();}});

  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
