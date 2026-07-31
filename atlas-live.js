(() => {
  'use strict';
  const root = document.documentElement;
  const boot = document.getElementById('boot');
  const header = document.getElementById('site-header');
  const menuToggle = document.getElementById('menu-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.getElementById('hero');

  const finishBoot = () => setTimeout(() => boot?.classList.add('done'), 260);
  if (document.readyState === 'complete') finishBoot(); else addEventListener('load', finishBoot, { once:true });
  setTimeout(finishBoot, 2300);

  let pointerX = innerWidth / 2, pointerY = innerHeight / 2;
  addEventListener('pointermove', e => {
    pointerX = e.clientX; pointerY = e.clientY;
    root.style.setProperty('--mx', `${pointerX}px`);
    root.style.setProperty('--my', `${pointerY}px`);
  }, { passive:true });

  const onScroll = () => {
    const p = Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight)));
    root.style.setProperty('--scroll', p.toFixed(4));
    header.classList.toggle('scrolled', scrollY > 80);
  };
  addEventListener('scroll', onScroll, { passive:true }); onScroll();

  menuToggle?.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  header?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => header.classList.remove('menu-open')));

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  }), { threshold:.16, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const experience = document.querySelector('.experience');
  const chapters = [...document.querySelectorAll('.chapter')];
  const sceneTick = () => {
    if (!experience || innerWidth < 721) return;
    const rect = experience.getBoundingClientRect();
    const total = experience.offsetHeight - innerHeight;
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1,total)));
    const index = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
    chapters.forEach((c,i) => c.classList.toggle('active', i === index));
    root.style.setProperty('--scene', progress.toFixed(4));
  };
  addEventListener('scroll', sceneTick, { passive:true }); sceneTick();

  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d', { alpha:true });
  let nodes = [], raf = 0, last = 0, speed = 1;
  function resize(){
    const dpr = Math.min(devicePixelRatio || 1, 1.55);
    canvas.width = Math.floor(innerWidth * dpr); canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = innerWidth < 720 ? 24 : Math.min(78, Math.round(innerWidth / 22));
    nodes = Array.from({length:count},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.14,vy:(Math.random()-.5)*.14,r:.3+Math.random()*1.2,p:Math.random()*6.28}));
  }
  function draw(t){
    if (document.hidden || reduced) return;
    if (t-last < 28){raf=requestAnimationFrame(draw);return;} last=t;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(let i=0;i<nodes.length;i++){
      const n=nodes[i];n.x+=n.vx*speed;n.y+=n.vy*speed;n.p+=.012;
      if(n.x<-20)n.x=innerWidth+20;if(n.x>innerWidth+20)n.x=-20;if(n.y<-20)n.y=innerHeight+20;if(n.y>innerHeight+20)n.y=-20;
      const pd=Math.hypot(n.x-pointerX,n.y-pointerY);if(pd<160){n.x+=(n.x-pointerX)*.0007;n.y+=(n.y-pointerY)*.0007;}
      ctx.beginPath();ctx.arc(n.x,n.y,n.r*(1+Math.sin(n.p)*.35),0,Math.PI*2);ctx.fillStyle='rgba(139,94,255,.42)';ctx.fill();
      for(let j=i+1;j<nodes.length;j++){
        const m=nodes[j],d=Math.hypot(n.x-m.x,n.y-m.y);if(d<118){ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(m.x,m.y);ctx.strokeStyle=`rgba(80,102,255,${(1-d/118)*.065})`;ctx.lineWidth=.55;ctx.stroke();}
      }
    }
    raf=requestAnimationFrame(draw);
  }
  resize(); addEventListener('resize', resize, {passive:true}); if(!reduced) raf=requestAnimationFrame(draw);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!reduced){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}});

  if (!reduced && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r=el.getBoundingClientRect(); const x=(e.clientX-r.left-r.width/2)*.12; const y=(e.clientY-r.top-r.height/2)*.18;
        el.style.transform=`translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave',()=>el.style.transform='');
    });
  }

  const feedback = document.getElementById('emotion-feedback');
  document.querySelectorAll('.emotion-node').forEach(node => node.addEventListener('click',()=>{
    document.querySelectorAll('.emotion-node').forEach(n=>n.classList.remove('selected'));
    node.classList.add('selected');
    const value=node.dataset.emotion;
    feedback.textContent=value==='Je ne sais pas'?'Très bien. Nous pouvons commencer sans nommer l’émotion.':`Vous avez choisi « ${value} ». ATLAS vous demanderait ensuite de confirmer ce ressenti.`;
  }));

  const breathButton=document.getElementById('breath-start');
  const breathWorld=document.querySelector('.breath-world');
  const breathCore=document.getElementById('breath-core');
  const phaseEl=document.getElementById('breath-phase');
  const secondsEl=document.getElementById('breath-seconds');
  let breathing=false,remaining=60,timer=null,phaseTimer=null;
  const phases=[['Inspirez',4],['Expirez',6],['Repos',2]];
  function setPhase(name){phaseEl.textContent=name;breathCore.classList.toggle('inhale',name==='Inspirez');speed=name==='Inspirez'?.45:name==='Expirez'?.22:.12;}
  function stopBreathing(){clearInterval(timer);clearInterval(phaseTimer);breathing=false;remaining=60;speed=1;breathWorld.classList.remove('active');breathCore.classList.remove('active','inhale');phaseEl.textContent='Prêt';secondsEl.textContent='60';breathButton.innerHTML='Lancer une respiration guidée <span>→</span>';}
  breathButton?.addEventListener('click',()=>{
    if(breathing){stopBreathing();return;} breathing=true;breathWorld.classList.add('active');breathCore.classList.add('active');breathButton.textContent='Arrêter';let pi=0,elapsed=0;setPhase(phases[0][0]);
    timer=setInterval(()=>{remaining--;secondsEl.textContent=String(remaining);if(remaining<=0){stopBreathing();showToast('Séquence terminée. Prenez un instant avant de continuer.');}},1000);
    phaseTimer=setInterval(()=>{elapsed++;if(elapsed>=phases[pi][1]){pi=(pi+1)%phases.length;elapsed=0;setPhase(phases[pi][0]);}},1000);
  });

  const journey=document.getElementById('journey-dialog'); const contact=document.getElementById('contact-dialog');
  let chosen='';
  document.querySelectorAll('[data-open-journey]').forEach(b=>b.addEventListener('click',()=>{document.body.classList.add('locked');document.querySelectorAll('.journey-step').forEach((s,i)=>s.classList.toggle('active',i===0));chosen='';journey.showModal();}));
  document.querySelectorAll('[data-close-journey]').forEach(b=>b.addEventListener('click',()=>{journey.close();document.body.classList.remove('locked');}));
  document.querySelectorAll('[data-journey-emotion]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-journey-emotion]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');chosen=b.dataset.journeyEmotion;document.querySelector('[data-step="1"]').classList.remove('active');document.querySelector('[data-step="2"]').classList.add('active');}));
  const range=document.getElementById('intensity'),output=document.getElementById('intensity-output');range?.addEventListener('input',()=>output.textContent=`${range.value}/10`);
  document.getElementById('journey-next')?.addEventListener('click',()=>{document.querySelector('[data-step="2"]').classList.remove('active');document.querySelector('[data-step="3"]').classList.add('active');document.getElementById('journey-result-title').textContent=chosen==='Je ne sais pas'?'Vous n’avez pas besoin du mot parfait.':`Merci. Vous avez indiqué : ${chosen.toLowerCase()}.`;document.getElementById('journey-result-copy').textContent=`Intensité déclarée : ${range.value}/10. Cette donnée reste locale dans ce prototype.`;});
  journey?.addEventListener('click',e=>{if(e.target===journey){journey.close();document.body.classList.remove('locked');}});
  document.querySelectorAll('[data-open-contact]').forEach(b=>b.addEventListener('click',()=>contact.showModal()));
  document.querySelectorAll('[data-close-contact]').forEach(b=>b.addEventListener('click',()=>contact.close()));contact?.addEventListener('click',e=>{if(e.target===contact)contact.close()});

  const toast=document.getElementById('toast');let toastTimer;function showToast(msg){clearTimeout(toastTimer);toast.textContent=msg;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),3400);}
  addEventListener('keydown',e=>{if(e.key==='Escape'){if(journey?.open){journey.close();document.body.classList.remove('locked');}if(contact?.open)contact.close();}});
})();
