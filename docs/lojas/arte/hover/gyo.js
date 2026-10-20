// Gyo (fx-gyo), feito em código, sem imagem: o que acontece quando o mouse passa pelos cards.
// O Gyo é concentrar a aura nos olhos para ver o que está escondido com o In. Cada card guarda um nen escondido (fios de
// aura que o atravessam, poeira de aura e um ou dois selos girando) que ninguém vê. Com o mouse em cima, uma lente de
// aura acende no card onde o cursor está, e só dentro dela o escondido aparece; fora dela, o card é o de sempre. Ao entrar,
// os olhos focam: a lente chega larga e o escondido borrado (traço grosso e fraco), e em ~0,2 s tudo fica nítido. A lente
// segue o cursor com um atraso curto (mola), a borda do card acende só perto dela, e os fios correm devagar (o nen está
// vivo). Ao sair, a lente apaga onde estava. Quem acende é o card: nada se desenha no cursor nem fora do card.
// O escondido nasce do tamanho do card (o mesmo card mostra sempre os mesmos fios); card grande ganha mais fios e poeira.
// Só desenha os cards com lente (o de baixo do cursor e o que está apagando); o laço para quando nada está aceso.
//   const h = CURSORES.gyo.cola(raiz, {seletor: '.card', raio: 120, lento: 1, cor: '#B4A0FF'})   h.ajusta({raio: 150})   h.desliga()
//   (raiz = document.documentElement no jogo, com o desenho numa camada fixa da tela inteira; ou um elemento, como a tela
//   preta da bancada, com a camada dentro dele; raio = da lente, em px; cor = a da aura, sem ela vem do --aura da página;
//   lento = câmera lenta; antigo: 1 = a versão de hoje, para comparar; um elemento com data-sem-gyo fica de fora)
//   CURSORES.gyo.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, um pedaço do jogo de mentira
//   titulo, dica e controles: o que a bancada mostra
(() => {
const DT = 1 / 240;
const FOCO = .22;                  // segundos para os olhos focarem ao entrar
const APAGA = .35;                 // segundos para a lente apagar ao sair
const W_LENTE = 2 * Math.PI * 6, Z_LENTE = .85;   // a lente segue o cursor com uma mola curta
const MAXL = 3;                    // lentes ao mesmo tempo (as que apagam)
const TAU = Math.PI * 2;
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = (a, b, x) => { const t = lim((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rgba = (hex, a) => { const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${lim(a, 0, 1).toFixed(3)})`; };
// sorteio com semente: o mesmo card mostra sempre o mesmo nen escondido
const sorteio = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// o nen escondido de um card de w×h (em frações do card, para servir se ele mudar de tamanho)
function escondido(w, h){
  const rnd = sorteio(Math.round(w) * 7919 + Math.round(h) * 104729), area = w * h;
  // um ponto na borda (lado 0..3) e um no meio
  const borda = l => [[rnd(), 0], [1, rnd()], [rnd(), 1], [0, rnd()]][l];
  const fios = [];
  // card largo e baixo (linha de tarefa): fios curtos que cruzam de cima para baixo em diagonal, espalhados pela linha,
  // para a lente sempre pegar uma trama e não três retas paralelas
  if(w > h * 3){
    const d = h / w;
    for(let k = 0, n = lim(Math.round(w / h * .9), 4, 22); k < n; k++){
      const u = (k + rnd()) / n, s = rnd() < .5 ? 0 : 1, v = u + (rnd() - .5) * d * 5;
      fios.push({a: [u, s], b: [v, 1 - s], c1: [u + (v - u) * .3 + (rnd() - .5) * d * 2, .3], c2: [u + (v - u) * .7 + (rnd() - .5) * d * 2, .7],
        ph: rnd() * TAU, vel: (rnd() < .5 ? -1 : 1) * (10 + rnd() * 10), larg: .8 + rnd() * .6});
    }
  }
  else for(let k = 0, n = lim(Math.round(2 + area / 30000), 2, 6); k < n; k++){
    const l0 = Math.floor(rnd() * 4), l1 = (l0 + 1 + Math.floor(rnd() * 3)) % 4;
    fios.push({a: borda(l0), b: borda(l1), c1: [.15 + rnd() * .7, .15 + rnd() * .7], c2: [.15 + rnd() * .7, .15 + rnd() * .7],
      ph: rnd() * TAU, vel: (rnd() < .5 ? -1 : 1) * (14 + rnd() * 14), larg: .9 + rnd() * .8});
  }
  const poeira = [];
  for(let k = 0, n = lim(Math.round(area / 1400), 14, 90); k < n; k++)
    poeira.push({x: rnd(), y: rnd(), r: .7 + rnd() * 1.3, sobe: 4 + rnd() * 10, ph: rnd() * TAU});
  const selos = [];
  for(let k = 0, n = area > 40000 ? 2 : 1; k < n; k++) selos.push({x: .2 + rnd() * .6, y: .25 + rnd() * .5, giro: (rnd() < .5 ? -1 : 1) * (.3 + rnd() * .4), ph: rnd() * TAU});
  return {fios, poeira, selos};
}

function cola(raiz, cfg){
  cfg = Object.assign({seletor: '.card', raio: 120, lento: 1, antigo: 0}, cfg);
  const tela = raiz === document.documentElement || raiz === document.body;
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;pointer-events:none;z-index:${tela ? 2147482000 : 5}`;
  (tela ? document.body : raiz).append(cv);
  let larg = 0, alt = 0, dpr = 1;
  function mede(){
    dpr = Math.min(devicePixelRatio || 1, 2);
    const b = tela ? {width: innerWidth, height: innerHeight} : raiz.getBoundingClientRect();
    larg = b.width; alt = b.height; cv.width = Math.ceil(larg * dpr); cv.height = Math.ceil(alt * dpr);
    cv.style.width = larg + 'px'; cv.style.height = alt + 'px';
  }
  const origem = () => { if(tela) return [0, 0]; const b = raiz.getBoundingClientRect(); return [b.left + raiz.clientLeft, b.top + raiz.clientTop]; };
  const corAura = () => cfg.cor || getComputedStyle(raiz === document.body ? document.documentElement : raiz).getPropertyValue('--aura').trim() || '#B4A0FF';

  let mx = -1e4, my = -1e4, sobre = null, abertas = 0;
  const lentes = [];
  // a lente guarda a posição em relação ao card: rolando a página, ela vai junto
  function lente(el){
    let l = lentes.find(x => x.el === el);
    const b = el.getBoundingClientRect();
    if(l){ l.saindo = false; return l; }
    l = {el, x: mx - b.left, y: my - b.top, vx: 0, vy: 0, a: 0, foco: 0, t: 0, saindo: false, w: 0, h: 0, nen: null};
    lentes.push(l); abertas++;
    while(lentes.length > MAXL) lentes.shift();
    return l;
  }
  function passo(h){
    for(let i = lentes.length - 1; i >= 0; i--){
      const l = lentes[i], dentro = sobre === l.el;
      if(!dentro) l.saindo = true;
      l.t += h;
      if(dentro){
        const b = l.b, tx = mx - b.left, ty = my - b.top;
        l.vx += (W_LENTE * W_LENTE * (tx - l.x) - 2 * Z_LENTE * W_LENTE * l.vx) * h; l.vy += (W_LENTE * W_LENTE * (ty - l.y) - 2 * Z_LENTE * W_LENTE * l.vy) * h;
        l.x += l.vx * h; l.y += l.vy * h;
      }
      l.a = l.saindo ? Math.max(0, l.a - h / APAGA) : Math.min(1, l.a + h / (FOCO * .6));
      l.foco = l.saindo ? l.foco : Math.min(1, l.foco + h / FOCO);
      if(l.saindo && l.a <= 0) lentes.splice(i, 1);
    }
  }

  function retCurvo(x0, y0, x1, y1, r){
    r = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
    ctx.moveTo(x0 + r, y0); ctx.arcTo(x1, y0, x1, y1, r); ctx.arcTo(x1, y1, x0, y1, r); ctx.arcTo(x0, y1, x0, y0, r); ctx.arcTo(x0, y0, x1, y0, r); ctx.closePath();
  }
  // a versão de hoje (para comparar na bancada): uma luz radial de 240 px, sem foco, sem escondido e sem atraso
  function pintaAntigo(l, X0, Y0, W, H, r, cor){
    const cx = X0 + mx - l.b.left, cy = Y0 + my - l.b.top;
    if(sobre !== l.el) return;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 240);
    g.addColorStop(0, rgba(cor, .14)); g.addColorStop(.7, rgba(cor, 0));
    ctx.save(); ctx.beginPath(); retCurvo(X0, Y0, X0 + W, Y0 + H, r); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(X0, Y0, W, H); ctx.restore();
  }
  function pintaLente(l, ox, oy, cor, claro){
    const b = l.b, X0 = b.left - ox, Y0 = b.top - oy, W = b.width, H = b.height, r = l.r;
    if(cfg.antigo) return pintaAntigo(l, X0, Y0, W, H, r, cor);
    const a = suave(0, 1, l.a), f = suave(0, 1, l.foco), turvo = 1 - f;
    if(a <= .005) return;
    // a lente não passa muito do card pequeno (numa linha baixa ela é uma faixa curta, não um holofote)
    const R = Math.min(cfg.raio, 40 + Math.max(W, H) * .5) * (1 + .5 * turvo), cx = X0 + l.x, cy = Y0 + l.y;
    if(!l.nen || Math.abs(l.w - W) > 2 || Math.abs(l.h - H) > 2){ l.nen = escondido(W, H); l.w = W; l.h = H; }
    const k = claro ? 1.35 : 1, t = l.t;
    ctx.save(); ctx.beginPath(); retCurvo(X0, Y0, X0 + W, Y0 + H, r); ctx.clip();
    // a luz da lente: fraca e larga, só para o card "acender" em volta do olhar
    const luz = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    luz.addColorStop(0, rgba(cor, .13 * a * k)); luz.addColorStop(.55, rgba(cor, .06 * a * k)); luz.addColorStop(1, rgba(cor, 0));
    ctx.fillStyle = luz; ctx.fillRect(X0, Y0, W, H);
    // o escondido: tudo pintado com a mesma tinta, que só existe dentro da lente (forte no meio, some na beirada)
    const tinta = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * .92), q = a * (.25 + .75 * f);
    tinta.addColorStop(0, rgba(cor, .95 * q)); tinta.addColorStop(.55, rgba(cor, .55 * q)); tinta.addColorStop(1, rgba(cor, 0));
    ctx.strokeStyle = tinta; ctx.fillStyle = tinta; ctx.lineCap = 'round';
    const P = ([u, v]) => [X0 + u * W, Y0 + v * H];
    // os fios: curvas que atravessam o card, balançando devagar; um traço fraco contínuo e gotas de aura correndo nele
    for(const fio of l.nen.fios){
      const [ax, ay] = P(fio.a), [bx, by] = P(fio.b), [c1x, c1y] = P(fio.c1), [c2x, c2y] = P(fio.c2);
      const o1 = Math.sin(t * .9 + fio.ph) * 6, o2 = Math.cos(t * .7 + fio.ph) * 6;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo(c1x + o1, c1y - o2, c2x - o2, c2y + o1, bx, by);
      ctx.globalAlpha = .45; ctx.lineWidth = fio.larg + 2.5 * turvo; ctx.setLineDash([]); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = fio.larg + .6 + 2.5 * turvo; ctx.setLineDash([3, 11]); ctx.lineDashOffset = -t * fio.vel; ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    // a poeira de aura: sobe devagar e cintila
    for(const p of l.nen.poeira){
      const yy = ((p.y - t * p.sobe / H) % 1 + 1) % 1, x = X0 + p.x * W + Math.sin(t * 1.3 + p.ph) * 3, y = Y0 + yy * H;
      const brilho = .55 + .45 * Math.sin(t * 3 + p.ph * 3);
      ctx.globalAlpha = brilho; ctx.beginPath(); ctx.arc(x, y, p.r + 1.5 * turvo, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // os selos: um círculo duplo com marcas, girando devagar (o nen que alguém deixou ali)
    for(const s of l.nen.selos){
      const sx = X0 + s.x * W, sy = Y0 + s.y * H, rs = lim(Math.min(W, H) * .32, 9, 26), g = s.ph + t * s.giro;
      ctx.lineWidth = 1 + 2 * turvo;
      ctx.beginPath(); ctx.arc(sx, sy, rs, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, rs * .62, g, g + TAU * .8); ctx.stroke();
      for(let m = 0; m < 6; m++){
        const ang = g * -1.4 + m * TAU / 6, c = Math.cos(ang), sn = Math.sin(ang);
        ctx.beginPath(); ctx.moveTo(sx + c * rs * .78, sy + sn * rs * .78); ctx.lineTo(sx + c * rs * (m % 2 ? .95 : 1.18), sy + sn * rs * (m % 2 ? .95 : 1.18)); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // a borda do card acende só perto da lente
    const fio = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.15);
    fio.addColorStop(0, rgba(cor, .95 * a)); fio.addColorStop(.6, rgba(cor, .5 * a)); fio.addColorStop(1, rgba(cor, 0));
    ctx.beginPath(); retCurvo(X0 + .5, Y0 + .5, X0 + W - .5, Y0 + H - .5, r);
    ctx.shadowColor = rgba(cor, .8 * a); ctx.shadowBlur = 6; ctx.strokeStyle = fio; ctx.lineWidth = 1.4; ctx.stroke(); ctx.shadowBlur = 0;
  }
  function pinta(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    const [ox, oy] = origem(), cor = corAura(), claro = !!cfg.claro;
    for(const l of lentes) pintaLente(l, ox, oy, cor, claro);
  }

  let pedido = 0, antes = 0, sobra = 0;
  function quadro(t){
    pedido = 0;
    const dt = antes ? Math.min(.05, (t - antes) / 1000) : DT; antes = t;
    for(const l of lentes){ l.b = l.el.getBoundingClientRect(); if(l.r === undefined) l.r = parseFloat(getComputedStyle(l.el).borderTopLeftRadius) || 0; }
    sobra += dt / Math.max(1, cfg.lento);
    while(sobra >= DT){ passo(DT); sobra -= DT; }
    pinta();
    if(lentes.length) pedido = requestAnimationFrame(quadro);
    else { antes = 0; sobra = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  const acorda = () => { if(!pedido) pedido = requestAnimationFrame(quadro); };

  const ev = tela ? document : raiz;
  function mexe(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    const el = e.target.closest ? e.target.closest(cfg.seletor) : null, card = el && raiz.contains(el) && !el.closest('[data-sem-gyo]') ? el : null;
    if(card !== sobre){ sobre = card; if(card) lente(card); }
    if(lentes.length) acorda();
  }
  function sai(e){ if(tela && e.relatedTarget) return; sobre = null; acorda(); }
  const ouvintes = [['pointermove', mexe], [tela ? 'mouseout' : 'pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f, {passive: true}));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(raiz); else addEventListener('resize', mede);
  mede();

  return {
    ajusta(o){ Object.assign(cfg, o); acorda(); },
    estado: () => ({lentes: lentes.map(l => ({a: +l.a.toFixed(2), foco: +l.foco.toFixed(2), x: Math.round(l.x), y: Math.round(l.y), fios: l.nen ? l.nen.fios.length : 0})), abertas}),
    legenda(){
      if(cfg.antigo) return 'versão de hoje: uma luz de 240 px no cursor';
      const l = lentes.find(x => x.el === sobre);
      return (l ? (l.foco < 1 ? 'focando' : `Gyo · ${l.nen ? l.nen.fios.length : 0} fios escondidos`) : 'sem Gyo') + ` · acendeu ${abertas}×`;
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede);
      cancelAnimationFrame(pedido); cv.remove();
    },
  };
}

// ---- bancada: um pedaço do jogo de mentira na tela preta, com cards de tamanhos bem diferentes
const TAREFAS = [['A', 'Perguntar ao professor de Redes se o trabalho vale nota', '+23'], ['A', 'Mandar mensagem da caixa', '+23'], ['C', 'Lavar o carro', '+15'], ['B', 'Ler 20 páginas', '+12']];
function liga(palco, cfg){
  const antes = palco.style.cssText, pag = document.createElement('div');
  palco.style.cursor = 'default';
  pag.className = 'gy-pag';
  const cor = () => cfg.claro ? {bg: '#F2F3F7', card: '#FFFFFF', borda: '#D9DCE5', tinta: '#1B1D28', suave: '#6B7088', trilho: '#E4E6EE', aura: '#7C5CD6'}
    : {bg: '#0B1120', card: '#121A2A', borda: '#243049', tinta: '#E6EDF7', suave: '#8A96AB', trilho: '#1C2538', aura: '#B4A0FF'};
  const hm = Array.from({length: 84}, (_, i) => `<i style="opacity:${[.15, .4, .7, 1][(i * 7 + (i >> 2)) % 4]}"></i>`).join('');
  pag.innerHTML = `<style>
    .gy-pag{position:absolute;inset:0;overflow:hidden;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-content:start;font:14px var(--f-ui)}
    .gy-pag .gy-col{display:grid;gap:10px;align-content:start;min-width:0}
    .gy-pag .gy-card{background:var(--b-card);border:1px solid var(--b-borda);border-radius:12px;padding:12px 14px;color:var(--b-tinta);min-width:0}
    .gy-pag .gy-me{grid-column:1/-1;display:flex;gap:14px;align-items:center}
    .gy-pag .gy-av{width:44px;height:44px;border-radius:50%;background:url('../../../web/a/killua-3.png') center/cover;flex:none;border:2px solid var(--b-borda)}
    .gy-pag .gy-xp{height:6px;border-radius:9px;background:var(--b-trilho);margin-top:6px} .gy-pag .gy-xp b{display:block;height:100%;width:62%;background:var(--b-tinta);border-radius:9px}
    .gy-pag small{display:block;color:var(--b-suave);font-size:12px}
    .gy-pag .gy-tf{display:flex;gap:10px;align-items:center;padding:10px 14px} .gy-pag .gy-tf span{flex:1;min-width:0}
    .gy-pag .gy-tf i{width:18px;height:18px;flex:none;clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%);background:#E0AF68}
    .gy-pag .gy-tf em{font:600 11px var(--f-mono);font-style:normal;color:#9BE15D;border:1px solid currentColor;border-radius:5px;padding:1px 6px}
    .gy-pag .gy-pr{font:600 10px var(--f-mono);color:#0B0C10;background:#8A96AB;border-radius:3px;padding:0 4px;margin-right:6px}
    .gy-pag .gy-hm{display:grid;grid-template-columns:repeat(21,1fr);gap:3px;margin-top:8px} .gy-pag .gy-hm i{aspect-ratio:1;border-radius:2px;background:#9BE15D}
    .gy-pag h4{margin:0 0 6px;font:600 11px var(--f-mono);letter-spacing:.06em;color:var(--b-suave)}
    .gy-pag .gy-ln{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--b-borda);font-size:13px}
  </style>
  <div class="gy-card gy-me"><span class="gy-av"></span><div style="flex:1;min-width:0"><b>Caio</b> · andar 204<div class="gy-xp"><b></b></div><small>hoje +0 XP · meta 65</small></div></div>
  <div class="gy-col">
    ${TAREFAS.map(([p, n, x]) => `<div class="gy-card gy-tf"><i></i><span><span class="gy-pr">${p}</span>${n}</span><em>${x}</em></div>`).join('')}
    <div class="gy-card"><h4>CONSTÂNCIA</h4><small>um painel grande: mais fios escondidos</small><div class="gy-hm">${hm}</div></div>
  </div>
  <div class="gy-col">
    <div class="gy-card"><h4>QUANTO VALE</h4></div>
    <div class="gy-card"><h4>RENDE MAIS AGORA</h4><div class="gy-ln"><span>Mandar mensagem</span><b>+23</b></div><div class="gy-ln"><span>Lavar o carro</span><b>+15</b></div></div>
    <div class="gy-card"><h4>MISSÃO DA SEMANA</h4><b style="color:#E0AF68">Especialização</b><small>vida ×1,5 · 1/3 dias</small></div>
  </div>`;
  const pinta = () => { const c = cor(); palco.style.background = c.bg; for(const [k, v] of Object.entries(c)) pag.style.setProperty('--b-' + k, v); cfg.cor = c.aura; };
  palco.prepend(pag); pinta();
  const h = cola(palco, Object.assign(cfg, {seletor: '.gy-card'}));
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); h.ajusta(cfg); },
    estado: h.estado, legenda: h.legenda,
    desliga(){ h.desliga(); pag.remove(); palco.style.cssText = antes; },
  };
}

(window.CURSORES = window.CURSORES || {}).gyo = {cola, liga,
  titulo: 'passe o mouse devagar pelos cards · pare no painel grande',
  dica: 'cada card guarda um nen escondido (fios de aura, poeira e selos); só dentro da lente do Gyo ele aparece · ao entrar, os olhos focam: a lente chega larga e borrada e fica nítida<br>a lente segue o cursor com um atraso curto, a borda do card acende só perto dela, e ao sair ela apaga onde estava · "versão de hoje" mostra como era',
  controles: [{k: 'raio', rot: 'raio da lente', min: 60, max: 220, un: ' px', padrao: 120},
    {k: 'antigo', rot: 'versão de hoje', min: 0, max: 1, un: '', padrao: 0},
    {k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
