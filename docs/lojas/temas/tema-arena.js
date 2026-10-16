/* ===== Tema Arena Celestial (#137, simulação) =====
   Uma camada de fundo fixa (#ac-cena) com três cenas que trocam pela aba, e a vista da janela na ficha da Lista.
   O céu de tudo sai do andar: fim de tarde sobre a cidade lá embaixo, nuvens na altura do andar 90, céu aberto
   acima delas e noite estrelada perto do topo (251). Ao subir de andar, o painel do elevador pisca e toca o sino. */
(function(){
'use strict';
const root = document.documentElement, NS = 'http://www.w3.org/2000/svg';
root.dataset.tema = 'arena';
const fonte = document.createElement('link'); fonte.rel = 'stylesheet';
fonte.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Chakra+Petch:wght@500;600;700&display=swap';
document.head.appendChild(fonte);

const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const hex = h => [1,3,5].map(i => parseInt(h.slice(i, i+2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i]-v)*t).toString(16).padStart(2,'0')).join(''); };
const faixa = (pts, t) => { for(let i = 1; i < pts.length; i++) if(t <= pts[i][0]){ const [t0,c0] = pts[i-1], [t1,c1] = pts[i]; return mix(c0, c1, (t-t0)/(t1-t0)); } return pts[pts.length-1][1]; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = (pai, tag, at) => { const e = document.createElementNS(NS, tag); for(const k in at) e.setAttribute(k, at[k]); pai.appendChild(e); return e; };
/* cores do céu: [andar/251, cor] em cima, no meio e no horizonte */
const CEU = [
  [[0,'#1E2A55'],[.35,'#24508F'],[.62,'#1B2A62'],[.85,'#0B0F2E'],[1,'#04050F']],
  [[0,'#8E5672'],[.35,'#5F93CC'],[.62,'#3E4F96'],[.85,'#1E2058'],[1,'#0E1236']],
  [[0,'#E9A06E'],[.35,'#BFDDF2'],[.62,'#9B88C4'],[.85,'#4B3A7A'],[1,'#2A2258']]];

/* desenha o céu num svg (fundo fixo e janela da ficha usam a mesma função) */
function ceu(svg, id, W, H, r){
  svg.innerHTML = `<defs><linearGradient id="${id}-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0"/><stop offset=".6"/><stop offset="1"/></linearGradient>
    <radialGradient id="${id}-sol"><stop offset="0" stop-color="#FFE2B0"/><stop offset=".35" stop-color="#FFB877" stop-opacity=".7"/><stop offset="1" stop-color="#FFB877" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#C9D3EA" stop-opacity=".9"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${id}-c)"/>`;
  const est = el(svg, 'g', {});
  for(let i = 0; i < W/9; i++) el(est, 'circle', {cx:r()*W, cy:r()*H*.7, r:.5 + r()*1.2, fill:'#fff', opacity:.3 + r()*.7});
  const sol = el(svg, 'circle', {cx:W*.22, cy:H*.86, r:H*.22, fill:`url(#${id}-sol)`});
  const cid = el(svg, 'g', {});
  let x = -10; while(x < W + 10){ const w = 18 + r()*40, h = 30 + r()*H*.18;
    el(cid, 'rect', {x, y:H-h, width:w+1, height:h+H, fill:'#121830'});
    for(let yy = H-h+7; yy < H-4; yy += 11) for(let xx = x+4; xx < x+w-4; xx += 9) if(r() < .28) el(cid, 'rect', {x:xx, y:yy, width:3.5, height:4.5, fill:'#FFCF7A', opacity:.8});
    x += w + 2; }
  const nuvY = el(svg, 'g', {}), nuv = el(nuvY, 'g', {class:'ac-nuvens'});
  // mar de nuvens: uma faixa cheia embaixo e bolos soltos em cima dela
  el(nuv, 'rect', {x:-100, y:20, width:W+200, height:H*2, fill:'#AFBBD8', opacity:.92});
  for(let i = 0; i < W/22; i++){ const cx = r()*(W+200) - 100, rx = 40 + r()*120; el(nuv, 'ellipse', {cx, cy:16 + r()*14, rx, ry:rx*.3, fill:`url(#${id}-n)`, opacity:.85 + r()*.15}); }
  for(let i = 0; i < W/60; i++){ const cx = r()*(W+200) - 100, rx = 30 + r()*80; el(nuv, 'ellipse', {cx, cy:-30 - r()*H*.35, rx, ry:rx*.22, fill:'#fff', opacity:.25 + r()*.3}); }
  const stops = svg.querySelectorAll(`#${id}-c stop`);
  return function(t){
    stops.forEach((s, i) => s.setAttribute('stop-color', faixa(CEU[i], t)));
    est.setAttribute('opacity', clamp((t - .5)/.35, 0, 1));
    sol.setAttribute('opacity', clamp(1 - t/.4, 0, 1)); sol.setAttribute('cy', H*.86 + t*H*.5);
    cid.setAttribute('transform', `translate(0 ${t*H*1.6})`);
    nuvY.setAttribute('transform', `translate(0 ${H*.18 + t*H*1.05})`);   // andar 90 ≈ nuvens na linha dos olhos
    nuvY.setAttribute('fill-opacity', 1);
    nuv.querySelector('rect').setAttribute('fill', faixa([[0,'#4E5A7C'],[.3,'#7E8BAE'],[.5,'#AEBBD8'],[.8,'#6F6FA0'],[1,'#3A3466']], t));
  };
}

/* ---------- a camada de fundo ---------- */
const W = 1600, H = 1000, r = rnd(11);
const cena = document.createElement('div'); cena.id = 'ac-cena'; cena.setAttribute('aria-hidden', 'true');
cena.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><g class="ac-base"></g><g class="ac-g ac-janela"></g><g class="ac-g ac-torre"></g><g class="ac-g ac-ringue"></g><rect width="${W}" height="${H}" fill="#050812" opacity=".4"/></svg>`;
document.body.prepend(cena);
const svgF = cena.querySelector('svg'), base = svgF.querySelector('.ac-base');
const tmp = document.createElementNS(NS, 'svg'); const pintaF = ceu(tmp, 'acf', W, H, r);
while(tmp.firstChild) base.appendChild(tmp.firstChild);

// Progresso: a torre ao longe, com o seu andar aceso
const tor = svgF.querySelector('.ac-torre'), TX = 1180, TB = H + 40, TT = 120;
el(tor, 'defs', {}).innerHTML = '<linearGradient id="act-t" x1="0" x2="1"><stop offset="0" stop-color="#141A2C"/><stop offset=".5" stop-color="#2A3555"/><stop offset="1" stop-color="#10152A"/></linearGradient><radialGradient id="act-l"><stop offset="0" stop-color="#FFD27A"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>';
el(tor, 'path', {d:`M${TX-80} ${TB} L${TX-30} ${TT+70} L${TX+30} ${TT+70} L${TX+80} ${TB}Z`, fill:'url(#act-t)'});
el(tor, 'path', {d:`M${TX-46} ${TT+72} Q${TX} ${TT-40} ${TX+46} ${TT+72}Z`, fill:'#27314F'});
el(tor, 'rect', {x:TX-2, y:TT-70, width:4, height:56, fill:'#3A4568'});
for(let a = 25; a < 251; a += 25){ const y = TB - a/251*(TB-TT-70), w = 80 - 50*a/251; el(tor, 'rect', {x:TX-w-4, y, width:2*w+8, height:4, fill:'#36426A'}); }
for(let a = 3; a < 251; a += 4){ const y = TB - a/251*(TB-TT-70), w = 80 - 50*a/251; if(r() < .35) el(tor, 'rect', {x:TX - w*.6 + r()*w*1.2, y, width:5, height:4, fill:'#FFCF7A', opacity:.55}); }
const marca = el(tor, 'g', {});
el(marca, 'circle', {cx:TX, cy:0, r:46, fill:'url(#act-l)', class:'ac-pulso'});
el(marca, 'rect', {x:TX-10, y:-5, width:20, height:10, rx:1, fill:'#FFD27A'});

// Chefões: o ringue, com dois holofotes e a plateia no escuro
const rin = svgF.querySelector('.ac-ringue');
el(rin, 'defs', {}).innerHTML = '<linearGradient id="acr-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1D0" stop-opacity=".22"/><stop offset="1" stop-color="#FFF1D0" stop-opacity="0"/></linearGradient><radialGradient id="acr-p"><stop offset="0" stop-color="#FFE9B8" stop-opacity=".35"/><stop offset="1" stop-color="#FFE9B8" stop-opacity="0"/></radialGradient>';
el(rin, 'rect', {width:W, height:H, fill:'#070A16', opacity:.82});
for(let fila = 0; fila < 7; fila++) for(let i = 0; i < 70; i++){ const y = 470 + fila*34, x = (i/70)*W + (fila%2)*11 + r()*6; el(rin, 'circle', {cx:x, cy:y, r:6 + fila*.6, fill:'#121830', opacity:.9}); }
el(rin, 'path', {d:`M220 ${H} L560 720 L1040 720 L1380 ${H}Z`, fill:'#1A2238', stroke:'#3B4A70', 'stroke-width':2});
for(let i = 1; i < 8; i++){ const k = i/8; el(rin, 'path', {d:`M${560 - 340*k} ${720 + 280*k} H${1040 + 340*k}`, stroke:'#2A3556', 'stroke-width':1.5}); }
for(let i = 1; i < 10; i++){ const xt = 560 + 480*i/10, xb = 220 + 1160*i/10; el(rin, 'path', {d:`M${xt} 720 L${xb} ${H}`, stroke:'#2A3556', 'stroke-width':1.5}); }
el(rin, 'ellipse', {cx:800, cy:830, rx:380, ry:90, fill:'url(#acr-p)'});
el(rin, 'path', {class:'ac-holo', style:'transform-origin:300px -20px', d:'M300 -20 L620 900 L900 900Z', fill:'url(#acr-f)'});
el(rin, 'path', {class:'ac-holo h2', style:'transform-origin:1300px -20px', d:'M1300 -20 L700 900 L980 900Z', fill:'url(#acr-f)'});

/* ---------- a janela da ficha (Lista) ---------- */
let pintaJ = null, janelaSvg = null;
function janela(){
  const ficha = document.querySelector('.card.l-me'); if(!ficha) return;
  if(!janelaSvg){ janelaSvg = document.createElementNS(NS, 'svg'); janelaSvg.setAttribute('class', 'ac-vista'); janelaSvg.setAttribute('viewBox', '0 0 1200 220');
    janelaSvg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); janelaSvg.setAttribute('aria-hidden', 'true'); pintaJ = ceu(janelaSvg, 'acj', 1200, 220, rnd(5)); }
  if(janelaSvg.parentNode !== ficha){ ficha.prepend(janelaSvg); const v = document.createElement('i'); v.className = 'ac-vidro'; janelaSvg.after(v); }
}

/* ---------- estado: andar e aba ---------- */
let sim = null, ultimo = null;
const andarReal = () => { const b = document.querySelector('#facts .fact:first-child b'); return b ? parseInt(b.textContent, 10) || 1 : 1; };
const abaAtual = () => { try { return cur; } catch(e){ return (location.hash || '#l').slice(1); } };
function mostraAndar(n){
  const f = document.querySelector('#facts .fact:first-child b'); if(f) f.textContent = n;
  const l = document.querySelector('.l-me .l-n'); if(l && l.lastChild) l.lastChild.textContent = 'andar ' + n;
  const me = document.querySelector('.shaft .me b'); if(me) me.textContent = n;
}
function atualiza(){
  const n = sim || andarReal(), t = (n - 1)/250;
  root.dataset.aba = abaAtual();
  if(sim) mostraAndar(sim);
  janela();
  pintaF(t); if(pintaJ) pintaJ(clamp(t - .06, 0, 1));
  marca.setAttribute('transform', `translate(0 ${TB - (n/251)*(TB-TT-70)})`);
  if(ultimo != null && n > ultimo) sobe();
  ultimo = n; const o = document.getElementById('ac-andar'); if(o){ o.value = n; document.getElementById('ac-andar-o').textContent = n; }
}
/* subiu de andar: o painel pisca e toca o sino do elevador */
let AC = null;
function sobe(){
  root.classList.remove('ac-sobe'); void root.offsetWidth; root.classList.add('ac-sobe');
  clearTimeout(sobe.t); sobe.t = setTimeout(() => root.classList.remove('ac-sobe'), 1800);
  try { if(!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); const t0 = AC.currentTime;
    [[1318.5, 0], [1046.5, .28]].forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(.12, t0 + d + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + d + 1.4);
      o.connect(g).connect(AC.destination); o.start(t0 + d); o.stop(t0 + d + 1.5); });
  } catch(e){}
}

/* o jogo redesenha a aba a cada ação: o tema refaz o que é dele depois de cada render */
if(typeof render === 'function'){ const r0 = render; render = function(){ const v = r0.apply(this, arguments); try { atualiza(); } catch(e){ console.error(e); } return v; }; }
let pedido = 0;   // a ficha pode ser redesenhada fora do render (ex.: a janela de tarefas); o tema confere no próximo quadro
const obs = new MutationObserver(ms => { if(pedido || ms.every(m => cena.contains(m.target) || p.contains(m.target))) return;
  pedido = requestAnimationFrame(() => { pedido = 0; const f = document.querySelector('.card.l-me');
    if((f && !f.querySelector('.ac-vista')) || root.dataset.aba !== abaAtual()) atualiza(); }); });
obs.observe(document.body, {childList:true, subtree:true});

/* ---------- controles da simulação ---------- */
const p = document.createElement('div'); p.id = 'ac-sim';
p.innerHTML = `<b>Simulação · Arena Celestial</b><button type="button" class="x" aria-label="recolher">–</button>
  <label for="ac-andar">ver o andar <input type="range" id="ac-andar" min="1" max="251" value="1"><output id="ac-andar-o">1</output></label>
  <div class="bt"><button type="button" data-sa="1">térreo</button><button type="button" data-sa="90">nas nuvens</button><button type="button" data-sa="0">o meu</button><button type="button" data-sa="251">topo</button><button type="button" id="ac-up">subir 1 andar ▲</button></div>`;
document.body.appendChild(p);
p.querySelector('.x').onclick = () => p.classList.toggle('min');
document.getElementById('ac-andar').addEventListener('input', e => { sim = +e.target.value; ultimo = sim; atualiza(); });
p.querySelectorAll('[data-sa]').forEach(b => b.onclick = () => { sim = +b.dataset.sa || null; ultimo = null; if(!sim) render(); else atualiza(); });
document.getElementById('ac-up').onclick = () => { sim = Math.min(251, (sim || andarReal()) + 1); atualiza(); };
atualiza();
})();
