// Efeito Cartas do Hisoka (fx-baralho), feito em código, sem imagem: dispara ao concluir uma tarefa. É o castelo de cartas
// do Hisoka, em quatro tempos. 1) Dá as cartas (~660 ms): de fora da tela, como se viessem da mão dele, as cartas chegam
// girando uma atrás da outra e montam em cima do card um castelo de três andares (pares encostados em Λ e cartas deitadas
// por cima), cada uma assentando com um tranco. 2) O Coringa desce virando e fica equilibrado na quina, no topo. 3) A pausa:
// o castelo balança um pouco, a tela escurece, a aura rosa do Hisoka cresce em volta e a estrela do Coringa brilha.
// 4) O estouro: o castelo explode a partir da base, as cartas saem girando e virando (frente e verso), com rastro; as
// rápidas cravam na borda da tela e tremem, duas cravam no próprio card, e o resto perde força e cai planando como folha.
// O desenho das cartas é o do cursor da carta (cursores/carta.js), copiado aqui para o efeito não depender dele.
//   CURSORES.baralho.dispara(rect, {alvo: document.body, el: card, claro: auto, lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra, a tela inteira por padrão; el = o card, que treme;
//   claro = fundo claro, por padrão lido da cor do body; lento = câmera lenta)
//   CURSORES.baralho.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas para concluir
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const TINTA = '#11131A', PAPEL = '#FBF7EE', VERMELHO = '#E0365A', PRETO = '#1D2030';
const OURO = '#FFD23F', OURO_ESC = '#C9961A', ROSA = '#FF5C8A', VINHO = '#8E2457';
const DA = 30, VOO = 210, MONTA = 15 * DA + VOO;          // ms: uma carta a cada 30 ms, cada voo leva 210 ms
const CORINGA = MONTA - 60, POUSA = CORINGA + 320, ESTOURA = POUSA + 260, FIM = 1350;   // depois do estouro, tudo some em 1350 ms
const DT = 1000 / 240, G = 1500, TH = .36, CRAVA = 520, TAU = Math.PI * 2;
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function fundoClaro(){
  const m = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g);
  return !!m && (m[3] === undefined || +m[3] > .5) && (.299 * m[0] + .587 * m[1] + .114 * m[2]) > 150;
}

// a camada do efeito: a tela inteira (alvo = body) ou só o alvo (a tela preta da bancada); ox, oy levam o rect para dentro dela
function camada(alvo){
  const tela = alvo === document.body, cv = document.createElement('canvas'), d = Math.min(devicePixelRatio || 1, 2);
  const b = tela ? {left: 0, top: 0, width: innerWidth, height: innerHeight} : alvo.getBoundingClientRect();
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;width:${b.width}px;height:${b.height}px;pointer-events:none;z-index:${tela ? 2147483000 : 3}`;
  cv.width = Math.ceil(b.width * d); cv.height = Math.ceil(b.height * d);
  const g = cv.getContext('2d'); g.scale(d, d); alvo.append(cv);
  return {cv, g, w: b.width, h: b.height, ox: b.left, oy: b.top};
}

// ---------- o desenho das cartas (o mesmo do cursor da carta) ----------
function naipe(ctx, s, x, y, t){
  ctx.beginPath();
  if(s === 'c'){
    ctx.moveTo(x, y + .42 * t);
    ctx.bezierCurveTo(x - .1 * t, y + .3 * t, x - .5 * t, y + .06 * t, x - .5 * t, y - .16 * t);
    ctx.bezierCurveTo(x - .5 * t, y - .43 * t, x - .16 * t, y - .5 * t, x, y - .26 * t);
    ctx.bezierCurveTo(x + .16 * t, y - .5 * t, x + .5 * t, y - .43 * t, x + .5 * t, y - .16 * t);
    ctx.bezierCurveTo(x + .5 * t, y + .06 * t, x + .1 * t, y + .3 * t, x, y + .42 * t);
  } else if(s === 'o'){
    ctx.moveTo(x, y - .5 * t);
    ctx.quadraticCurveTo(x + .14 * t, y - .17 * t, x + .38 * t, y); ctx.quadraticCurveTo(x + .14 * t, y + .17 * t, x, y + .5 * t);
    ctx.quadraticCurveTo(x - .14 * t, y + .17 * t, x - .38 * t, y); ctx.quadraticCurveTo(x - .14 * t, y - .17 * t, x, y - .5 * t);
  } else if(s === 'e'){
    ctx.moveTo(x, y - .48 * t);
    ctx.bezierCurveTo(x + .1 * t, y - .33 * t, x + .5 * t, y - .12 * t, x + .5 * t, y + .1 * t);
    ctx.bezierCurveTo(x + .5 * t, y + .32 * t, x + .2 * t, y + .38 * t, x + .05 * t, y + .22 * t);
    ctx.quadraticCurveTo(x + .07 * t, y + .42 * t, x + .2 * t, y + .5 * t); ctx.lineTo(x - .2 * t, y + .5 * t);
    ctx.quadraticCurveTo(x - .07 * t, y + .42 * t, x - .05 * t, y + .22 * t);
    ctx.bezierCurveTo(x - .2 * t, y + .38 * t, x - .5 * t, y + .32 * t, x - .5 * t, y + .1 * t);
    ctx.bezierCurveTo(x - .5 * t, y - .12 * t, x - .1 * t, y - .33 * t, x, y - .48 * t);
  } else {
    const r = .21 * t;
    for(const [cx, cy] of [[x, y - .25 * t], [x - .25 * t, y + .05 * t], [x + .25 * t, y + .05 * t]]){ ctx.moveTo(cx + r, cy); ctx.arc(cx, cy, r, 0, 2 * Math.PI); }
    ctx.moveTo(x - .06 * t, y); ctx.quadraticCurveTo(x - .06 * t, y + .4 * t, x - .2 * t, y + .5 * t);
    ctx.lineTo(x + .2 * t, y + .5 * t); ctx.quadraticCurveTo(x + .06 * t, y + .4 * t, x + .06 * t, y);
  }
  ctx.fill();
}
function estrela(ctx, x, y, r){
  ctx.beginPath();
  for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  ctx.closePath();
}
function gota(ctx, x, y, t){
  ctx.beginPath(); ctx.moveTo(x, y - .55 * t);
  ctx.bezierCurveTo(x + .12 * t, y - .3 * t, x + .36 * t, y - .05 * t, x + .36 * t, y + .17 * t);
  ctx.arc(x, y + .17 * t, .36 * t, 0, Math.PI);
  ctx.bezierCurveTo(x - .36 * t, y - .05 * t, x - .12 * t, y - .3 * t, x, y - .55 * t);
}
function frente(ctx, c, W, H){
  if(c.n === '★') return coringa(ctx, W, H);
  const cor = c.s === 'c' || c.s === 'o' ? VERMELHO : PRETO;
  ctx.fillStyle = cor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(const k of [1, -1]){
    ctx.save(); ctx.scale(k, k);
    const ix = -W / 2 + W * .17, iy = -H / 2 + H * .14;
    ctx.font = `700 ${H * .19}px Georgia,"Times New Roman",serif`;
    ctx.save(); ctx.translate(ix, iy); if(c.n === '10') ctx.scale(.74, 1); ctx.fillText(c.n, 0, 0); ctx.restore();
    naipe(ctx, c.s, ix, iy + H * .16, W * .17);
    ctx.restore();
  }
  if('JQK'.includes(c.n)){
    ctx.strokeStyle = OURO_ESC; ctx.lineWidth = H * .022;
    ctx.strokeRect(-W * .2, -H * .3, W * .4, H * .6);
    ctx.fillStyle = cor; ctx.font = `700 ${H * .3}px Georgia,"Times New Roman",serif`; ctx.fillText(c.n, 0, -H * .07);
    naipe(ctx, c.s, 0, H * .17, W * .22);
  } else naipe(ctx, c.s, 0, 0, W * (c.n === 'A' ? .6 : .46));
}
function coringa(ctx, W, H){
  ctx.strokeStyle = OURO_ESC; ctx.lineWidth = H * .022; ctx.strokeRect(-W * .34, -H * .38, W * .68, H * .76);
  ctx.lineWidth = Math.max(.8, H * .025); ctx.strokeStyle = TINTA;
  estrela(ctx, -W * .1, -H * .1, W * .26); ctx.fillStyle = OURO; ctx.fill(); ctx.stroke();
  gota(ctx, W * .14, H * .15, W * .34); ctx.fillStyle = ROSA; ctx.fill(); ctx.stroke();
  for(const k of [1, -1]){ ctx.save(); ctx.scale(k, k); estrela(ctx, -W / 2 + W * .17, -H / 2 + H * .13, W * .1); ctx.fillStyle = OURO_ESC; ctx.fill(); ctx.restore(); }
}
function verso(ctx, W, H){
  const m = W * .09;
  ctx.save(); ctx.beginPath(); ctx.roundRect(-W / 2 + m, -H / 2 + m, W - 2 * m, H - 2 * m, H * .04); ctx.fillStyle = VINHO; ctx.fill(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,92,138,.55)'; ctx.lineWidth = Math.max(.6, H * .02); ctx.beginPath();
  for(let d = -H; d <= H; d += H * .14){ ctx.moveTo(-W, d - W); ctx.lineTo(W, d + W); ctx.moveTo(-W, d + W); ctx.lineTo(W, d - W); }
  ctx.stroke(); ctx.restore();
  ctx.fillStyle = OURO; naipe(ctx, 'o', 0, 0, W * .4);
  ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(.7, H * .02); ctx.stroke();
}
// uma carta: (x, y) é o centro; vira = quanto ela está de frente (1) ou de costas (-1) girando no próprio eixo
function desenha(ctx, c, x, y, H, ang = 0, vira = 1){
  const W = H * .7, lw = Math.max(1, H * .034);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(Math.abs(vira) < .04 ? .04 * Math.sign(vira || 1) : vira, 1);
  ctx.beginPath(); ctx.roundRect(-W / 2, -H / 2, W, H, H * .085); ctx.fillStyle = PAPEL; ctx.fill();
  if(vira < 0) verso(ctx, W, H); else frente(ctx, c, W, H);
  ctx.beginPath(); ctx.roundRect(-W / 2 + lw / 2, -H / 2 + lw / 2, W - lw, H - lw, H * .075);
  ctx.strokeStyle = TINTA; ctx.lineWidth = lw; ctx.stroke();
  ctx.restore();
}

// ---------- o castelo ----------
// três andares em cima do card: pares encostados em Λ (inclinados TH, vistos de lado, por isso estreitos) e cartas deitadas
// por cima (vistas de quina: uma lâmina fina); o Coringa fica equilibrado na quina, no topo. Cada peça: x, y, a, f
// (o giro no próprio eixo: vira = cos f), na ordem em que é dada
function castelo(R, rnd){
  const H = lim(R.h * .9, 34, 50), sn = Math.sin(TH) * H, cs = Math.cos(TH) * H, ft = H * .09;
  const cx = lim(R.x + R.w * (.3 + rnd() * .4), R.x + 1.5 * H, R.x + R.w - 1.5 * H);
  const pecas = [];
  let base = R.y, topo = R.y;
  for(const n of [3, 2, 1]){
    const ay = base - cs, apices = Array.from({length: n}, (_, j) => cx + (j - (n - 1) / 2) * H);
    for(const ax of apices){
      pecas.push({x: ax - sn / 2, y: ay + cs / 2, a: TH, f: Math.acos(.42), andar: 3 - n});
      pecas.push({x: ax + sn / 2, y: ay + cs / 2, a: -TH, f: Math.acos(-.42), andar: 3 - n});
    }
    for(let j = 0; j < n - 1; j++) pecas.push({x: (apices[j] + apices[j + 1]) / 2, y: ay - ft / 2, a: Math.PI / 2, f: Math.acos(.13), andar: 3 - n, deitada: 1});
    topo = ay; base = ay - ft;
  }
  // o baralho, embaralhado; o Coringa fica de fora, é dele o topo
  const baralho = [];
  for(const s of 'ecop') for(const n of VALORES) baralho.push({n, s});
  for(let i = baralho.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [baralho[i], baralho[j]] = [baralho[j], baralho[i]]; }
  pecas.forEach((p, i) => { p.c = baralho[i]; });
  const Hj = H * 1.12, Wj = Hj * .7, dj = Math.hypot(Wj, Hj) / 2;
  const coringa = {c: {n: '★', s: ''}, H: Hj, x: cx, y: topo - dj, a: Math.PI / 2 - Math.atan2(Hj / 2, -Wj / 2), f: 0, topo};
  return {pecas, coringa, H, cx, topo};
}

// um castelo, numa tela w × h, no card R; quadro(t) avança a física até t (ms desde o começo), desenha e devolve o tremor
function cria(g, w, h, R, op, rnd){
  const {claro} = op, soma = claro ? 'source-over' : 'lighter';
  const {pecas, coringa: cj, H, cx, topo} = castelo(R, rnd);
  const lado = rnd() < .5 ? -1 : 1, ox = lado < 0 ? -H : w + H, oy = Math.max(-H, R.y - (R.y + H) * (.4 + rnd() * .5));   // de onde vêm as cartas
  for(const [i, p] of pecas.entries()){
    p.t0 = i * DA; p.sx = ox + (rnd() - .5) * 40; p.sy = oy + (rnd() - .5) * 60;
    p.giro = -lado * (2 + rnd()) * TAU; p.vol = (2 + (rnd() * 2 | 0)) * Math.PI;   // voltas no plano e no próprio eixo durante o voo
  }
  const bx = cx, by = R.y + H * .4;   // o estouro sai daqui, da base do castelo
  let sim = 0, corpos = null, ondas = [], cravadas = 0;
  const desce = [0, 5];   // duas cartas do térreo cravam no próprio card

  function estoura(){
    corpos = [...pecas, cj].map(p => ({...p, Hc: p.H || H, vx: 0, vy: 0, va: 0, vf: 0, modo: 'voa', tau: 0, alfa: 1}));
    corpos.forEach((b, i) => {
      if(b.c.n === '★'){ b.vx = (rnd() - .5) * 120; b.vy = -820; b.va = 2.4; b.vf = 7; return; }
      if(desce.includes(i)){
        const alvo = R.x + R.w / 2 + (i ? 1 : -1) * R.w * (.18 + rnd() * .16), dx = alvo - b.x, dy = R.y - b.y + 10, d = Math.hypot(dx, dy) || 1;
        b.vx = dx / d * 900; b.vy = dy / d * 900; b.a = Math.atan2(-b.vx, b.vy); b.f = 0; b.desce = 1; return;
      }
      const dx = b.x - bx, dy = b.y - by, d = Math.hypot(dx, dy) || 1, an = Math.atan2(dy, dx) + (rnd() - .5) * .5;
      const v = 420 + rnd() * 650 + (3 - b.andar) * 50;
      b.vx = Math.cos(an) * v; b.vy = Math.sin(an) * v - 120; b.va = (rnd() < .5 ? -1 : 1) * (8 + rnd() * 14); b.vf = (rnd() < .5 ? -1 : 1) * (10 + rnd() * 18);
    });
    ondas = [{t: 0, r: Math.min(200, 2.2 * H + 90), lw: 3}, {t: 60, r: Math.min(130, 1.4 * H + 60), lw: 1.6}];
  }
  function fisica(){
    const dt = DT / 1000, m = H * .3;
    for(const b of corpos){
      b.tau += dt;
      if(b.modo === 'voa'){
        b.vy += G * dt; const ar = Math.exp(-1.3 * dt); b.vx *= ar; b.vy *= ar;
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt; b.f += b.vf * dt;
        const v = Math.hypot(b.vx, b.vy);
        if(b.desce && b.y >= R.y - b.Hc * .22){ b.modo = 'card'; b.y = R.y - b.Hc * .22; b.tau = 0; b.a0 = b.a; continue; }
        if(v > CRAVA && cravadas < 5 && (b.x < m || b.x > w - m || b.y < m)){   // crava de ponta na borda da tela (no máximo cinco)
          cravadas++; b.modo = 'cravada'; b.tau = 0; b.vf = 0; b.f = Math.cos(b.f) < 0 ? Math.PI : 0;
          if(b.y < m){ b.y = b.Hc * .18; b.a0 = Math.PI + (rnd() - .5) * .5; }
          else if(b.x < m){ b.x = b.Hc * .18; b.a0 = Math.PI / 2 + (rnd() - .5) * .5; }
          else { b.x = w - b.Hc * .18; b.a0 = -Math.PI / 2 + (rnd() - .5) * .5; }
          b.a = b.a0; continue;
        }
        if(b.x < -2 * H || b.x > w + 2 * H) b.alfa = 0;
        if(v < 260 && b.vy > 0){ b.modo = 'folha'; b.tau = 0; b.fase = rnd() * TAU; b.a1 = b.a; }
      } else if(b.modo === 'folha'){   // cai planando: desce devagar, balança de um lado para o outro e vira aos poucos
        b.vy += (70 - b.vy) * 3 * dt; b.vx += (Math.sin(b.tau * 3.4 + b.fase) * 120 - b.vx) * 4 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += ((b.vx / 120) * .7 + b.a1 * .2 - b.a) * 3 * dt;
        b.vf += ((b.vf < 0 ? -4 : 4) - b.vf) * 2 * dt; b.f += b.vf * dt;
      } else {   // cravada (na tela ou no card): treme e para
        b.a = b.a0 + .16 * Math.exp(-b.tau / .12) * Math.sin(b.tau * 75);
        if(b.modo === 'cravada' && b.tau > .45){ b.modo = 'folha'; b.tau = 0; b.fase = rnd() * TAU; b.a1 = b.a0 * .3; b.vx = (b.x < w / 2 ? 1 : -1) * 60; b.vy = 0; b.vf = 3; }
      }
    }
  }
  const brilho = (x, y, r, a) => {   // brilho de quatro pontas
    g.save(); g.globalCompositeOperation = soma; g.globalAlpha = a; g.fillStyle = claro ? OURO_ESC : '#FFFFFF'; g.beginPath();
    for(let i = 0; i < 8; i++){ const an = i * Math.PI / 4, q = i % 2 ? r * .18 : r; g.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q); }
    g.fill(); g.restore();
  };

  function quadro(t){
    while(sim + DT <= t){ sim += DT; if(sim >= ESTOURA){ if(!corpos) estoura(); fisica(); } }
    const u = t - ESTOURA;
    g.save(); g.lineJoin = g.lineCap = 'round';
    // a tela escurece na pausa e volta depois do estouro
    const veu = (u < 0 ? lim((t - CORINGA) / 400, 0, 1) : Math.exp(-u / 300)) * (claro ? .06 : .28);
    if(veu > .005){ g.globalAlpha = veu; g.fillStyle = claro ? TINTA : '#000'; g.fillRect(0, 0, w, h); g.globalAlpha = 1; }
    // a aura rosa do Hisoka em volta do castelo, crescendo até o estouro
    const ka = u < 0 ? lim((t - POUSA + 200) / 460, 0, 1) : Math.exp(-u / 120);
    if(ka > .01){
      const my = (topo + R.y) / 2 - H * .3, r0 = (R.y - topo) * .9 + H, pul = 1 + .05 * Math.sin(t / 45);
      const rg = g.createRadialGradient(cx, my, 0, cx, my, r0 * pul);
      rg.addColorStop(0, 'rgba(255,92,138,.5)'); rg.addColorStop(.55, 'rgba(255,92,138,.16)'); rg.addColorStop(1, 'rgba(255,92,138,0)');
      g.globalCompositeOperation = soma; g.globalAlpha = (claro ? .55 : .7) * ka; g.fillStyle = rg; g.fillRect(cx - r0 * 1.2, my - r0 * 1.2, r0 * 2.4, r0 * 2.4);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    if(u < 0){
      // o castelo sendo montado: cada carta voa num arco, girando, e assenta com um tranco; na pausa, o castelo balança
      const bal = t > POUSA ? Math.sin((t - POUSA) / 70) * 1.4 * Math.min(1, (t - POUSA) / 120) : 0;
      for(const p of pecas){
        const v = (t - p.t0) / VOO; if(v <= 0) continue;
        const alt = (R.y - p.y) / 120;
        if(v >= 1){
          const s = (t - p.t0 - VOO), tr = .07 * Math.exp(-s / 45) * Math.sin(s / 9);
          desenha(g, p.c, p.x + bal * alt, p.y - Math.abs(tr) * 6, H, p.a + tr, Math.cos(p.f));
          continue;
        }
        const e = 1 - (1 - v) ** 3, mx = (p.sx + p.x) / 2, my = Math.min(p.sy, p.y) - 90;
        const x = (1 - e) ** 2 * p.sx + 2 * (1 - e) * e * mx + e * e * p.x, y = (1 - e) ** 2 * p.sy + 2 * (1 - e) * e * my + e * e * p.y;
        g.globalAlpha = .18; desenha(g, p.c, x - (p.x - p.sx) * .04, y - (p.y - p.sy) * .04, H, p.a + p.giro * (1 - e) * 1.06, Math.cos(p.f + p.vol * (1 - e)));
        g.globalAlpha = 1; desenha(g, p.c, x, y, H, p.a + p.giro * (1 - e), Math.cos(p.f + p.vol * (1 - e)));
      }
      // o Coringa desce do alto virando e pousa na quina, no topo
      if(t > CORINGA){
        const v = Math.min(1, (t - CORINGA) / (POUSA - CORINGA)), e = 1 - (1 - v) ** 2;
        const y = -cj.H + (cj.y + cj.H) * e, os = t > POUSA ? Math.sin((t - POUSA) / 60) * .05 : 0;
        desenha(g, cj.c, cj.x + bal * (R.y - cj.y) / 120, y, cj.H, cj.a * e + os, Math.cos((1 - e) * 3 * TAU));
        if(t > POUSA){   // a estrela brilha
          const s = t - POUSA, k = Math.exp(-(((s - 90) / 70) ** 2)) + .6 * Math.exp(-(((s - 230) / 50) ** 2));
          const W = cj.H * .7, ca = Math.cos(cj.a + os), sa = Math.sin(cj.a + os), lx = -W * .1, ly = -cj.H * .1;
          brilho(cj.x + lx * ca - ly * sa, cj.y + lx * sa + ly * ca, cj.H * .5 * (.6 + k), k);
        }
      }
      g.restore();
      const j = t > POUSA ? .8 : 0;
      return [(Math.random() - .5) * j, (Math.random() - .5) * j];
    }
    // o estouro: clarão rosa e duas ondas saindo da base do castelo
    if(u < 160){ g.globalCompositeOperation = soma; g.globalAlpha = (claro ? .12 : .2) * (1 - u / 160); g.fillStyle = ROSA; g.fillRect(0, 0, w, h); }
    for(const o of ondas){
      const v = u - o.t; if(v < 0 || v > 380) continue;
      const a = (1 - v / 380) ** 1.5, r = 10 + o.r * (1 - Math.exp(-v / 110));
      g.globalCompositeOperation = soma; g.globalAlpha = a; g.strokeStyle = ROSA; g.lineWidth = o.lw * a + .5;
      g.beginPath(); g.ellipse(bx, by - H * .4, r, r * .7, 0, 0, TAU); g.stroke();
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // as cartas
    const some = u < FIM - 450 ? 1 : Math.max(0, (FIM - u) / 450);
    for(const b of corpos){
      if(!b.alfa) continue;
      const a = some * b.alfa, vira = Math.cos(b.f);
      if(b.modo === 'card'){   // cravada no card: só a parte de fora aparece, com o talho na borda
        g.save(); g.beginPath(); g.rect(0, 0, w, R.y); g.clip(); g.globalAlpha = a; desenha(g, b.c, b.x, b.y, b.Hc, b.a, 1); g.restore();
        g.globalAlpha = a; g.strokeStyle = claro ? TINTA : '#000'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(b.x - b.Hc * .3, R.y + .5); g.lineTo(b.x + b.Hc * .3, R.y + .5); g.stroke();
        continue;
      }
      if(b.modo === 'voa'){   // rastro das rápidas
        const v = Math.hypot(b.vx, b.vy);
        if(v > 500) for(const [k, al] of [[2, .1], [1, .2]]){ g.globalAlpha = al * a; desenha(g, b.c, b.x - b.vx * .012 * k, b.y - b.vy * .012 * k, b.Hc, b.a - b.va * .012 * k, Math.cos(b.f - b.vf * .012 * k)); }
      }
      g.globalAlpha = a; desenha(g, b.c, b.x, b.y, b.Hc, b.a, vira);
    }
    g.restore();
    const am = u < 300 ? 6 * Math.exp(-u / 70) : 0;   // o card treme com o estouro
    return [(Math.random() - .5) * am, (Math.random() - .5) * am];
  }
  const fase = t => t < MONTA ? 'dá as cartas: o castelo sobe' : t < POUSA ? 'o Coringa pousa no topo' : t < ESTOURA ? 'a pausa (a aura cresce)' :
    t < ESTOURA + 400 ? 'o estouro: cravam na borda e no card' : t < ESTOURA + FIM ? 'caem como folhas' : '';
  return {quadro, fase};
}

function acende(el, lento){
  if(!el.animate) return;
  el.animate([{filter: 'brightness(1.9) saturate(1.4)'}, {filter: 'brightness(1.15)', offset: .35}, {filter: 'none'}], {duration: 480 * lento, easing: 'ease-out'});
}

function dispara(r, o = {}){
  const alvo = o.alvo || document.body, cam = camada(alvo), lento = o.lento || 1, el = o.el, antes = el ? el.style.translate : '';
  const fx = cria(cam.g, cam.w, cam.h, {x: r.left - cam.ox, y: r.top - cam.oy, w: r.width, h: r.height},
    {claro: o.claro ?? fundoClaro()}, sorteio(Math.random() * 4294967296));
  let t0 = null, estourou = false;
  const passo = now => {
    if(t0 === null) t0 = now;
    const t = (now - t0) / lento; fx.t = t;
    cam.g.clearRect(0, 0, cam.w, cam.h);
    const [dx, dy] = fx.quadro(t);
    if(el) el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    if(!estourou && t >= ESTOURA && el){ estourou = true; acende(el, lento); }
    if(t < ESTOURA + FIM) requestAnimationFrame(passo); else { cam.cv.remove(); if(el) el.style.translate = antes; fx.acabou = true; }
  };
  requestAnimationFrame(passo);
  return fx;
}

// bancada: uma lista de tarefas na tela preta; clicar numa (ou espaço) conclui e dispara o efeito nela
const TAREFAS = ['Ler 20 páginas', 'Treinar 30 min', 'Responder os e-mails', 'Revisar os flashcards'];
function tarefas(palco, cfg, fx){
  const antes = palco.style.cssText, lista = document.createElement('div');
  palco.style.cursor = 'default';
  lista.style.cssText = 'position:absolute;left:50%;top:66%;transform:translate(-50%,-50%);width:min(440px,86%);display:grid;gap:12px';
  const cards = TAREFAS.map(n => {
    const c = document.createElement('div'); c.innerHTML = `<i></i><span>${n}</span>`;
    c.style.cssText = 'display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:10px;border:1px solid;cursor:pointer;font:14px var(--f-ui)';
    c.firstChild.style.cssText = 'width:22px;height:22px;border-radius:50%;border:2px solid var(--amb);flex:none';
    c.onclick = () => conclui(c); lista.append(c); return c;
  });
  const pinta = () => {
    palco.style.background = cfg.claro ? '#F2F3F7' : '#000';
    for(const c of cards){ c.style.background = cfg.claro ? '#FFFFFF' : '#1B1D28'; c.style.borderColor = cfg.claro ? '#D9DCE5' : '#2A2D3C';
      c.style.color = c.feito ? (cfg.claro ? '#8A8FA0' : '#6B7088') : (cfg.claro ? '#1B1D28' : '#E6E8F0'); }
  };
  let ultimo = null, vezes = 0;
  function conclui(c){
    if(c.feito) return;
    c.feito = true; c.firstChild.style.background = 'var(--amb)'; c.lastChild.style.textDecoration = 'line-through'; pinta();
    ultimo = fx(c.getBoundingClientRect(), c); vezes++;
    setTimeout(() => { c.feito = false; c.firstChild.style.background = ''; c.lastChild.style.textDecoration = ''; pinta(); }, 3400 * cfg.lento);
  }
  const tecla = e => { if(e.code !== 'Space' || e.target.closest('input,button')) return; e.preventDefault(); const c = cards.find(c => !c.feito); if(c) conclui(c); };
  document.addEventListener('keydown', tecla);
  palco.append(lista); pinta();
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); },
    estado: () => ({vezes, t: ultimo && ultimo.t, acabou: ultimo && ultimo.acabou}),
    legenda: () => `concluídas: ${vezes}` + (ultimo && !ultimo.acabou ? ' · ' + ultimo.fase(ultimo.t || 0) : ''),
    desliga(){ document.removeEventListener('keydown', tecla); lista.remove(); palco.querySelectorAll('canvas').forEach(c => c.remove()); palco.style.cssText = antes; },
  };
}
const liga = (palco, cfg) => tarefas(palco, cfg, (r, el) => dispara(r, {alvo: palco, el, claro: !!cfg.claro, lento: cfg.lento}));

// prévias paradas: o mesmo castelo (mesma semente) em seis momentos, no escuro e no claro
function previas(el, cfg){
  const W = 300, H = 270, R = {x: 40, y: 210, w: 220, h: 44};
  const momento = (t, claro, semente) => {
    const c = document.createElement('canvas'), d = devicePixelRatio || 1; c.className = 'prev';
    c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px';
    const g = c.getContext('2d'); g.scale(d, d);
    g.fillStyle = claro ? '#F2F3F7' : '#0F1016'; g.fillRect(0, 0, W, H);
    g.fillStyle = claro ? '#FFFFFF' : '#1B1D28'; g.strokeStyle = claro ? '#D9DCE5' : '#2A2D3C';
    g.beginPath(); g.roundRect(R.x, R.y, R.w, R.h, 10); g.fill(); g.stroke();
    g.strokeStyle = '#E0AF68'; g.lineWidth = 2; g.beginPath(); g.arc(R.x + 27, R.y + 22, 10, 0, 7); g.stroke();
    g.fillStyle = claro ? '#1B1D28' : '#E6E8F0'; g.font = '14px system-ui,sans-serif'; g.fillText('Ler 20 páginas', R.x + 48, R.y + 27);
    cria(g, W, H, R, {claro}, sorteio(semente)).quadro(t);
    return c;
  };
  const ts = [[260, 'dando as cartas'], [POUSA + 30, 'o Coringa no topo'], [ESTOURA - 40, 'a pausa'], [ESTOURA + 50, 'o estouro'],
    [ESTOURA + 300, 'cravadas'], [ESTOURA + 800, 'folhas']];
  el.innerHTML = '<section><h2>' + ts.map(x => x[1]).join(' · ') + ' (o mesmo castelo, parado)</h2><div class="linha"></div><div class="linha" style="margin-top:12px"></div></section>';
  const [esc, cla] = el.querySelectorAll('.linha');
  ts.forEach(([t]) => { esc.append(momento(t, false, 11)); cla.append(momento(t, true, 11)); });
}

(window.CURSORES = window.CURSORES || {}).baralho = {dispara, liga, previas, cria,
  titulo: 'clique numa tarefa (ou aperte espaço) para concluir',
  dica: 'as cartas chegam girando e montam um castelo de três andares em cima do card, o Coringa pousa na quina, no topo,<br>a aura rosa cresce na pausa e o castelo estoura: as cartas cravam na borda e no card e o resto cai como folha · câmera lenta para ver tudo',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
