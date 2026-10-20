// Transição "Fumaça do Morel" (tr-fumaca), raro: ao trocar de aba, a fumaça do Deep Purple sai do ponto tocado, incha até
// cobrir a tela e se desfaz já na aba nova, levada para cima e para a esquerda. Sem os soldados de fumaça: só a fumaça.
// A aba nova já está valendo desde o clique (o estado trocou); a velha fica na tela, por baixo da fumaça, até a tela estar
// coberta, e é aí que as duas trocam de lugar. Um canvas por cima (meia resolução, a fumaça é mole), sem física:
// cada baforada nasce, cresce e some num horário fixo, e o quadro é função do tempo (dá para pular para qualquer instante).
//   const h = TRANSICOES.fumaca.cola(raiz, {secao, lento, claro})   h.troca(fn, origem)   h.ajusta({lento, claro})   h.desliga()
//   TRANSICOES.fumaca.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, com o jogo de mentira
(() => {
const B = window.TR_BASE, lim = B.lim;
const DUR = .84, T_TROCA = .3;   // s: a transição inteira e o instante em que a tela já está coberta
const SP = 160, NS = 6, ESC = .5; // lado do sprite, quantos sprites e a escala do canvas (meia resolução)
const PAL = {escuro: {s: [24, 20, 38], m: [70, 62, 102], l: [150, 140, 190]}, claro: {s: [92, 86, 122], m: [146, 140, 176], l: [222, 218, 238]}};
const VENTO = {x: -.5, y: -.86};
const TOM = [-.2, .1, -.06, .16, -.14, .04];   // cada baforada um tom: umas mais escuras, outras pegando luz  // para onde a fumaça é levada ao se desfazer (para cima e para a esquerda)

// ---- ruído (valor, 4 oitavas) para dar cara de fumaça aos sprites
const hash = (x, y, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
function ruido(x, y, s){
  const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
  return (hash(xi, yi, s) * (1 - a) + hash(xi + 1, yi, s) * a) * (1 - b) + (hash(xi, yi + 1, s) * (1 - a) + hash(xi + 1, yi + 1, s) * a) * b;
}
function fbm(x, y, s){ let f = 0, k = .5; for(let o = 0; o < 4; o++){ f += k * ruido(x, y, s + o); x = x * 2.03 + 17.1; y = y * 2.03 + 3.7; k *= .5; } return f / .9375; }
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// uma baforada: contorno irregular, miolo mais denso, luz de cima à esquerda e sombra embaixo à direita
function sprite(seed, claro){
  const c = document.createElement('canvas'); c.width = c.height = SP;
  const g = c.getContext('2d'), im = g.createImageData(SP, SP), d = im.data, P = claro ? PAL.claro : PAL.escuro;
  for(let y = 0; y < SP; y++) for(let x = 0; x < SP; x++){
    const nx = (x + .5) / SP * 2 - 1, ny = (y + .5) / SP * 2 - 1, r = Math.hypot(nx, ny);
    if(r >= 1) continue;
    // contorno de nuvem (a borda ondula em calombos grandes) e miolo em rolos largos, não em grão miúdo
    const wx = nx + (fbm(nx * 1.1 + seed, ny * 1.1, seed + 3) - .5) * .5, wy = ny + (fbm(nx * 1.1, ny * 1.1 + seed, seed + 5) - .5) * .5;
    const q = r / (.56 + fbm(wx * 2.2 + seed * 4.3, wy * 2.2 + seed * 2.1, seed) * .4);
    if(q >= 1) continue;
    const m = fbm(wx * 1.7 - seed * 1.9, wy * 1.7 + seed * 6.1, seed + 9);
    const a = Math.min(1, (1 - q) * 3.2) * (.86 + .14 * m);
    const luz = lim(.5 + TOM[seed % TOM.length] - wx * .3 - wy * .38 + (m - .5) * .7, 0, 1);
    const k = luz < .5 ? mix(P.s, P.m, luz * 2) : mix(P.m, P.l, (luz - .5) * 2), i = (y * SP + x) * 4;
    d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = a * 255;
  }
  g.putImageData(im, 0, 0); return c;
}
const SPR = {};
const sprites = claro => SPR[claro ? 1 : 0] || (SPR[claro ? 1 : 0] = Array.from({length: NS}, (_, i) => sprite(i + 1, claro)));

// ---- as baforadas: uma grade que cobre a tela (com folga), mais umas pequenas para a borda ficar irregular.
// Cada uma nasce no ponto tocado e vai até o seu lugar (as mais longe chegam depois: a fumaça se espalha como uma onda),
// e se desfaz num horário que depende do lado do vento (as de cima e da esquerda vão primeiro)
function baforadas(W, H, O, semente){
  const rnd = mulberry(semente), cell = lim(Math.min(W, H) / 4.2, 84, 190), cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
  const dMax = Math.max(Math.hypot(O.x, O.y), Math.hypot(W - O.x, O.y), Math.hypot(O.x, H - O.y), Math.hypot(W - O.x, H - O.y)) || 1;
  const meia = Math.hypot(W, H) / 2, ps = [];
  const nova = (tx, ty, R) => {
    const dist = Math.hypot(tx - O.x, ty - O.y) / dMax, pr = ((tx - W / 2) * VENTO.x + (ty - H / 2) * VENTO.y) / meia;
    ps.push({tx, ty, R, spr: Math.floor(rnd() * NS), da: dist * .14 + rnd() * .03, dg: .17 + rnd() * .06,
      dd: .32 + .22 * (1 - pr) / 2 + rnd() * .04, dx: .18 + rnd() * .07, a: .9 + rnd() * .1,
      ph: rnd() * 6.28, fw: 2.2 + rnd() * 2, sx: 4 + rnd() * 9, sy: 4 + rnd() * 9, vx: (rnd() - .5) * 18, vy: -(6 + rnd() * 14),
      a0: rnd() * 6.28, w: (rnd() - .5) * 1.6});
  };
  for(let j = 0; j <= rows; j++) for(let i = 0; i <= cols; i++) nova((i - .25 + (rnd() - .5) * .7) * cell, (j - .25 + (rnd() - .5) * .7) * cell, cell * (1.45 + rnd() * .35));
  for(let k = 0, n = Math.round(cols * rows * .6); k < n; k++) nova(rnd() * W, rnd() * H, cell * (.4 + rnd() * .35));
  return ps.sort((a, b) => b.R - a.R);
}

// o quadro no instante t (s); g = contexto do canvas, de W×H px de tela desenhados na escala ESC
function pinta(g, W, H, O, ps, spr, t, claro){
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  // o véu: um disco na cor do miolo que cresce atrás da frente da fumaça (fecha os buracos entre as baforadas na hora
  // da troca) e some antes delas, de cima para baixo como o vento
  const dMax = Math.max(Math.hypot(O.x, O.y), Math.hypot(W - O.x, O.y), Math.hypot(O.x, H - O.y), Math.hypot(W - O.x, H - O.y));
  const fr = (1 - Math.pow(1 - lim((t - .04) / .26, 0, 1), 2)) * dMax * 1.05, va = .94 * (1 - lim((t - .34) / .16, 0, 1));
  if(fr > 4 && va > .01){
    const k = (claro ? PAL.claro : PAL.escuro).m, grd = g.createRadialGradient(O.x * ESC, O.y * ESC, 0, O.x * ESC, O.y * ESC, fr * ESC);
    grd.addColorStop(0, `rgba(${k},${va})`); grd.addColorStop(.7, `rgba(${k},${va})`); grd.addColorStop(1, `rgba(${k},0)`);
    g.fillStyle = grd; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  }
  for(const p of ps){
    const gr = lim((t - p.da) / p.dg, 0, 1), s = lim((t - p.dd) / p.dx, 0, 1);
    if(gr <= 0 || s >= 1) continue;
    const eg = 1 - Math.pow(1 - gr, 3), es = s * s * (3 - 2 * s), viva = t - p.da;
    const x = O.x + (p.tx - O.x) * eg + p.sx * Math.sin(t * p.fw + p.ph) + p.vx * viva + VENTO.x * es * 170;
    const y = O.y + (p.ty - O.y) * eg + p.sy * Math.cos(t * p.fw + p.ph) + p.vy * viva + VENTO.y * es * 170;
    const R = p.R * (.25 + .75 * eg) * (1 + .6 * es), a = Math.min(1, gr * 2.5) * p.a * (1 - es);
    if(R < 2 || a < .01) continue;
    const ang = p.a0 + p.w * viva * (1 + 2 * es), k = 2 * R * ESC / SP, co = Math.cos(ang) * k, si = Math.sin(ang) * k;
    g.globalAlpha = a; g.setTransform(co, si, -si, co, x * ESC, y * ESC);
    g.drawImage(spr[p.spr], -SP / 2, -SP / 2);
  }
  g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0);
}

function def(){
  return {
    dur: DUR,
    inicio(ctx){
      const c = document.createElement('canvas'), W = ctx.W, H = ctx.H;
      c.width = Math.max(1, Math.round(W * ESC)); c.height = Math.max(1, Math.round(H * ESC));
      c.style.cssText = `position:${ctx.tela ? 'fixed' : 'absolute'};left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:58`;
      ctx.pai.append(c);
      const vis = ctx.nova.style.visibility; ctx.nova.style.visibility = 'hidden';   // a nova espera a tela cobrir
      const semente = ctx.cfg.semente || Math.floor(Math.random() * 1e9);
      return {c, g: c.getContext('2d'), ps: baforadas(W, H, ctx.origem, semente), spr: sprites(ctx.claro), vis, trocou: false};
    },
    quadro(est, t, ctx){
      if(!est.trocou && t >= T_TROCA){ est.trocou = true; ctx.escondeVelha(); ctx.nova.style.visibility = est.vis; }
      pinta(est.g, ctx.W, ctx.H, ctx.origem, est.ps, est.spr, t, ctx.claro);
    },
    fim(est, ctx){ est.c.remove(); ctx.nova.style.visibility = est.vis; },
  };
}

function cola(raiz, cfg){ return B.cria(raiz, cfg, def()); }

// ---- bancada: o jogo de mentira com as quatro abas; clique nas abas (a fumaça sai do ponto onde você clicou)
function liga(palco, cfg){ return B.liga(palco, cfg, cola); }

// ---- prévias: a tira de quadros da transição (sobre um jogo desenhado à mão) e as seis baforadas
function mock(g, W, H, claro){
  const c = claro ? {bg: '#F2F3F7', card: '#FFFFFF', bo: '#D9DCE5', tx: '#6B7088'} : {bg: '#0B1120', card: '#121A2A', bo: '#243049', tx: '#8A96AB'};
  g.fillStyle = c.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = c.card; g.fillRect(0, 0, W, 28); g.fillStyle = '#E0AF68'; g.fillRect(70, 26, 44, 2);
  const card = (x, y, w, h) => { g.fillStyle = c.card; g.strokeStyle = c.bo; g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill(); g.stroke(); g.fillStyle = c.tx; g.globalAlpha = .45; g.fillRect(x + 10, y + 10, w * .5, 4); g.fillRect(x + 10, y + 20, w * .3, 3); g.globalAlpha = 1; };
  for(let i = 0; i < 5; i++) card(16, 44 + i * 42, W * .62, 34);
  card(W * .62 + 32, 44, W * .38 - 48, 60); card(W * .62 + 32, 116, W * .38 - 48, 90); card(W * .62 + 32, 218, W * .38 - 48, 50);
}
function previas(el, cfg){
  const tempos = [.05, .12, .2, .28, .36, .46, .58, .7], W = 300, H = 200, O = {x: 84, y: 0};
  const claros = [0, 1], ps = baforadas(W, H, O, 7);
  el.innerHTML = `<section><h2>a transição em quadros (instantes em segundos; a aba velha até ${T_TROCA} s, a nova depois), no escuro e no claro</h2>
    ${claros.map(cl => `<div class="linha" style="gap:8px;margin-bottom:8px">${tempos.map(t => `<figure style="margin:0;display:grid;gap:3px"><canvas width="${W}" height="${H}" data-t="${t}" data-cl="${cl}" style="width:${W * .72}px;height:${H * .72}px;border-radius:6px;border:1px solid var(--line)"></canvas><figcaption style="font:11px var(--f-mono);color:var(--dim)">${t.toFixed(2)} s</figcaption></figure>`).join('')}</div>`).join('')}</section>
    <section><h2>as seis baforadas (cada uma é um sprite de ruído, com luz de cima à esquerda)</h2>
    <div class="linha" id="fm-spr" style="gap:10px"></div></section>`;
  el.querySelectorAll('canvas[data-t]').forEach(cv => {
    const t = +cv.dataset.t, cl = +cv.dataset.cl, g = cv.getContext('2d');
    mock(g, W, H, cl);
    const camada = document.createElement('canvas'); camada.width = W * ESC; camada.height = H * ESC;
    pinta(camada.getContext('2d'), W, H, O, ps, sprites(cl), t, cl);
    // numa tira pequena a trocada de aba aparece: antes do T_TROCA a velha, depois uma "aba nova" (outras cores)
    if(t >= T_TROCA){ g.fillStyle = cl ? '#E9EBF3' : '#0F172B'; g.fillRect(0, 29, W, H); for(let i = 0; i < 3; i++){ g.fillStyle = cl ? '#FFF' : '#16203A'; g.fillRect(20 + i * 92, 60, 80, 100); } }
    g.imageSmoothingEnabled = true; g.drawImage(camada, 0, 0, W, H);
  });
  const dst = el.querySelector('#fm-spr');
  sprites(cfg.claro).forEach(s => { const c = document.createElement('canvas'); c.width = c.height = SP; c.getContext('2d').drawImage(s, 0, 0); c.style.cssText = `width:96px;height:96px;background:${cfg.claro ? '#F2F3F7' : '#0B1120'};border-radius:6px`; dst.append(c); });
}

(window.TRANSICOES = window.TRANSICOES || {}).fumaca = {cola, liga, previas,
  titulo: 'clique nas abas para ver a fumaça sair de onde você clicou · ou ligue "trocar sozinho"',
  dica: 'a fumaça do Deep Purple sai do ponto tocado, incha e cobre a tela em cerca de 0,3 s; a aba nova entra por baixo e a fumaça é levada para cima e para a esquerda<br>a aba já vale desde o clique (só a imagem fica por baixo da fumaça) · dura ' + DUR + ' s no total · com "reduzir movimento" no sistema, a troca é seca',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
