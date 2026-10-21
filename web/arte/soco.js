// Soco remoto do Leorio (fx-soco, raro), feito em código, sem imagem: dispara no andar novo e no chefão derrotado (o
// momento do confete e dos fogos), não a cada tarefa. Um portal de nen abre ao lado do card que fez subir o andar, o punho
// do Leorio (terno escuro, punho da camisa com abotoadura) sai dele e acerta a borda do card; o card leva o tranco, a
// estrela de impacto do mangá estoura, ficam as marcas dos nós dos dedos, o braço volta pelo portal e o portal fecha.
// Tudo em ~0,56 s, desenhado quadro a quadro em fórmulas (sem física, sem tremer a tela, sem grito): é o raro da regra
// do gatilho (GUIA.md), um disparo curto num momento que não é toda hora. O capricho fica no desenho, não na duração.
//   portal: aparece de lado, uma elipse funda com a borda acesa e o redemoinho girando; o braço só existe do lado de cá
//     (o resto está "do outro lado"), e a borda da frente passa por cima dele.
//   card largo (a Lista do jogo ocupa a largura): sem espaço do lado, o portal abre acima (ou abaixo) e o soco desce em
//     diagonal na borda de cima.
//   CURSORES.soco.dispara(rect, {alvo: document.body, el: card, lado: 0 auto | 1 de lado | 2 de cima, claro: auto,
//     cor: '#7DCFFF', lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra; el = o card, que leva o tranco)
//   CURSORES.soco.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas onde cada uma sobe um andar
(() => {
const NEN = '#7DCFFF', TINTA = '#0B0C10';
// ms: o portal abre, o punho sai e acerta, segura, volta e o portal fecha
const ABRE = 130, SAI = 110, IMPACTO = 220, VOLTA = 280, DENTRO = 390, FECHA = 480, FIM = 560;
const PELE = '#E9B48C', PELE_LUZ = '#F6D2B0', PELE_SOMBRA = '#C98D67', TERNO = '#2A3152', TERNO_LUZ = '#3E4878', CAMISA = '#F2F1EA', OURO = '#E0AF68';
const TAU = Math.PI * 2;

const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = q => { q = lim(q, 0, 1); return q * q * (3 - 2 * q); };
const mola = q => { q = lim(q, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); };   // passa um pouco e volta
function fundoClaro(){
  const m = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g);
  return !!m && (m[3] === undefined || +m[3] > .5) && (.299 * m[0] + .587 * m[1] + .114 * m[2]) > 150;
}
function camada(alvo){
  const tela = alvo === document.body, cv = document.createElement('canvas'), d = Math.min(devicePixelRatio || 1, 2);
  const b = tela ? {left: 0, top: 0, width: innerWidth, height: innerHeight} : alvo.getBoundingClientRect();
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;width:${b.width}px;height:${b.height}px;pointer-events:none;z-index:${tela ? 2147483000 : 3}`;
  cv.width = Math.ceil(b.width * d); cv.height = Math.ceil(b.height * d);
  const g = cv.getContext('2d'); g.scale(d, d); alvo.append(cv);
  return {cv, g, w: b.width, h: b.height, ox: b.left, oy: b.top};
}

// onde o portal abre e para onde o soco vai: de lado, se cabe (o lado com mais espaço); senão de cima, em diagonal
function mira(w, h, R, lado, L, k){
  const cy = R.y + R.h / 2, esq = R.x, dir = w - R.x - R.w;
  if(lado !== 2 && (lado === 1 || Math.max(esq, dir) >= L + k * .6)){
    const daEsq = esq >= dir, px = daEsq ? R.x + 2 : R.x + R.w - 2;
    const ox = daEsq ? Math.max(k * .5, px - L) : Math.min(w - k * .5, px + L);
    return {ox, oy: cy, a: daEsq ? 0 : Math.PI, vira: !daEsq, L: Math.abs(px - ox)};
  }
  const a0 = .98, cx = R.x + Math.max(k, 20) + Math.cos(a0) * L;
  const cima = R.y + 2 - Math.sin(a0) * L >= k, a = cima ? a0 : -a0, py = cima ? R.y + 2 : R.y + R.h - 2;
  return {ox: cx - Math.cos(a) * L, oy: py - Math.sin(a) * L, a, vira: false, L};
}

// um soco, numa tela w × h, no card R; quadro(t) desenha o momento t (ms) e devolve o tranco do card [dx, dy].
// Tudo é desenhado num referencial do portal: a origem é o centro do portal, +x aponta para o card, -y é o lado do polegar
function cria(g, w, h, R, op, rnd){
  const {cor, claro} = op, k = lim(R.h * .74, 28, 42);
  const m = mira(w, h, R, op.lado || 0, 2.3 * k + 24, k), L = m.L, ux = Math.cos(m.a), uy = Math.sin(m.a);
  const pontas = Array.from({length: 14}, () => .82 + rnd() * .42);
  const riscos = Array.from({length: 9}, (_, i) => ({a: -1.9 + i / 8 * 3.8 + (rnd() - .5) * .18, r: 1.3 + rnd() * .25, n: .3 + rnd() * .35}));
  const traco = claro ? TINTA : '#FFFFFF';

  // até onde o punho chegou: acelera até o card, recua um tico depois do soco, volta para o portal
  const alcance = t => t < SAI ? 0 : t < IMPACTO ? L * Math.pow((t - SAI) / (IMPACTO - SAI), 2) : t < VOLTA ? L - 4 * suave((t - IMPACTO) / (VOLTA - IMPACTO))
    : t < DENTRO ? (L - 4) * (1 - suave((t - VOLTA) / (DENTRO - VOLTA))) : 0;
  const abertura = t => t < ABRE ? mola(t / ABRE) : t < DENTRO ? 1 : 1 - suave((t - DENTRO) / (FECHA - DENTRO));

  function portalAtras(s, t){
    const rx = .34 * k * s, ry = 1.0 * k * s;
    const halo = g.createRadialGradient(0, 0, 0, 0, 0, 1.7 * k * s);
    halo.addColorStop(0, cor); halo.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.globalAlpha = (claro ? .25 : .4) * s; g.fillStyle = halo; g.beginPath(); g.arc(0, 0, 1.7 * k * s, 0, TAU); g.fill(); g.restore();
    // o fundo do portal: escuro no meio, a cor do nen chegando na borda
    g.save(); g.scale(rx / ry, 1);
    const fundo = g.createRadialGradient(0, 0, 0, 0, 0, ry);
    fundo.addColorStop(0, TINTA); fundo.addColorStop(.62, '#151A2E'); fundo.addColorStop(1, cor);
    g.fillStyle = fundo; g.beginPath(); g.arc(0, 0, ry, 0, TAU); g.fill(); g.restore();
    // o redemoinho: três arcos girando por dentro
    g.lineCap = 'round';
    for(let i = 0; i < 3; i++){
      const a = t * .011 + i * TAU / 3;
      g.globalAlpha = .75 * s; g.strokeStyle = i ? cor : '#FFFFFF'; g.lineWidth = 1.3;
      g.beginPath(); g.ellipse(0, 0, rx * (.78 - i * .16), ry * (.78 - i * .16), 0, a, a + 1.4); g.stroke();
    }
    g.globalAlpha = 1;
    if(claro){ g.strokeStyle = TINTA; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, rx + 1.8, ry + 1.8, 0, 0, TAU); g.stroke(); }
    g.strokeStyle = cor; g.lineWidth = 3.2; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.stroke();
  }
  // a metade da borda que fica do lado de cá, por cima do braço
  function portalFrente(s){
    const rx = .34 * k * s, ry = 1.0 * k * s;
    g.lineCap = 'round';
    g.strokeStyle = cor; g.lineWidth = 3.2; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, -Math.PI / 2, Math.PI / 2); g.stroke();
    g.strokeStyle = '#FFFFFF'; g.globalAlpha = .8; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, -Math.PI / 2.4, Math.PI / 2.4); g.stroke();
    g.globalAlpha = 1;
  }
  // fagulhas que voltam para o meio enquanto o portal fecha
  function fecha(t){
    const q = (t - DENTRO) / (FIM - DENTRO); if(q <= 0 || q >= 1) return;
    g.strokeStyle = cor; g.lineWidth = 1.6; g.globalAlpha = 1 - q; g.lineCap = 'round';
    for(let i = 0; i < 6; i++){ const a = i / 6 * TAU + .4, r = 1.25 * k * (1 - q * .8);
      g.beginPath(); g.moveTo(Math.cos(a) * r * .4, Math.sin(a) * r); g.lineTo(Math.cos(a) * r * .4 * .7, Math.sin(a) * r * .7); g.stroke(); }
    g.globalAlpha = 1;
  }

  // a mão fechada, de lado: o dorso que vem do pulso, os quatro dedos dobrados um sobre o outro com os nós na frente
  // (do indicador ao mínimo, o mínimo menor e mais para trás) e o polegar cruzando por cima deles
  const DEDOS = [[-.33, .05, .22], [-.11, 0, .22], [.11, .02, .22], [.31, .1, .19]];   // [centro em y, quanto fica para trás, altura]
  const dorso = e => { const x0 = e - k; g.beginPath(); g.moveTo(x0, -.3 * k); g.quadraticCurveTo(x0 + .3 * k, -.46 * k, x0 + .6 * k, -.44 * k);
    g.lineTo(x0 + .6 * k, .4 * k); g.quadraticCurveTo(x0 + .3 * k, .44 * k, x0, .3 * k); g.closePath(); };
  const dedo = (e, [y, atras, hh]) => { const x1 = e - atras * k, x0 = e - .64 * k, r = hh * k / 2;
    g.beginPath(); g.roundRect(x0, y * k - r, x1 - x0, 2 * r, [0, r, r, 0]); };
  const polegar = e => { const x0 = e - k; g.beginPath(); g.moveTo(x0 + .1 * k, .12 * k); g.quadraticCurveTo(x0 + .4 * k, .0 * k, x0 + .74 * k, .01 * k);
    g.quadraticCurveTo(x0 + .88 * k, .02 * k, x0 + .88 * k, .13 * k); g.quadraticCurveTo(x0 + .87 * k, .23 * k, x0 + .73 * k, .24 * k);
    g.quadraticCurveTo(x0 + .42 * k, .27 * k, x0 + .14 * k, .36 * k); g.closePath(); };
  const pele = (y0, y1, luz) => { const pg = g.createLinearGradient(0, y0, 0, y1); pg.addColorStop(0, luz ? '#FBE3CC' : PELE_LUZ); pg.addColorStop(.55, PELE); pg.addColorStop(1, PELE_SOMBRA); return pg; };
  function braco(e, aura){
    const x0 = e - k, mx = e - 1.45 * k;
    g.lineJoin = 'round'; g.lineCap = 'round';
    // a manga do terno, que vem de dentro do portal
    if(mx > 0){
      const tg = g.createLinearGradient(0, -.45 * k, 0, .45 * k);
      tg.addColorStop(0, TERNO_LUZ); tg.addColorStop(.45, TERNO); tg.addColorStop(1, '#1A1F38');
      g.fillStyle = tg; g.strokeStyle = TINTA; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-6, -.48 * k); g.lineTo(mx, -.42 * k); g.lineTo(mx, .42 * k); g.lineTo(-6, .48 * k); g.closePath(); g.fill(); g.stroke();
      // as dobras do tecido e os três botões da manga
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.2;
      for(const [y, f] of [[-.18, .5], [.12, .3]]){ g.beginPath(); g.moveTo(mx * f, y * k); g.quadraticCurveTo(mx * (f + .2), (y - .06) * k, mx - .1 * k, (y + .02) * k); g.stroke(); }
      g.fillStyle = '#10131F'; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .8;
      for(let i = 0; i < 3; i++){ const bx = mx - .16 * k - i * .15 * k; if(bx < 2) break; g.beginPath(); g.arc(bx, .3 * k, .05 * k, 0, TAU); g.fill(); g.stroke(); }
    }
    // o punho da camisa, com a abotoadura
    g.fillStyle = CAMISA; g.strokeStyle = TINTA; g.lineWidth = 1.5;
    g.beginPath(); g.roundRect(e - 1.52 * k, -.38 * k, .3 * k, .76 * k, .05 * k); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(11,12,16,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(e - 1.42 * k, -.34 * k); g.lineTo(e - 1.42 * k, .34 * k); g.stroke();
    g.fillStyle = OURO; g.strokeStyle = TINTA; g.lineWidth = .9; g.beginPath(); g.arc(e - 1.34 * k, -.06 * k, .065 * k, 0, TAU); g.fill(); g.stroke();
    // o pulso
    g.fillStyle = PELE_SOMBRA; g.strokeStyle = TINTA; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(e - 1.23 * k, -.28 * k); g.quadraticCurveTo(e - 1.05 * k, -.31 * k, x0 + .06 * k, -.34 * k); g.lineTo(x0 + .06 * k, .36 * k);
    g.quadraticCurveTo(e - 1.05 * k, .3 * k, e - 1.23 * k, .28 * k); g.closePath(); g.fill(); g.stroke();
    // o pulso
    g.fillStyle = PELE_SOMBRA; g.strokeStyle = TINTA; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(e - 1.23 * k, -.28 * k); g.quadraticCurveTo(e - 1.08 * k, -.3 * k, x0 + .06 * k, -.3 * k); g.lineTo(x0 + .06 * k, .3 * k);
    g.quadraticCurveTo(e - 1.08 * k, .3 * k, e - 1.23 * k, .28 * k); g.closePath(); g.fill(); g.stroke();
    // o nen em volta da mão, aceso enquanto o soco viaja
    const formas = [() => dorso(e), ...DEDOS.map(d => () => dedo(e, d)), () => polegar(e)];
    if(aura > 0){ g.save(); g.strokeStyle = cor;
      for(const [lw, al] of [[8, .45], [3.5, .9]]){ g.lineWidth = lw; g.globalAlpha = al * aura; formas.forEach(f => { f(); g.stroke(); }); }
      g.restore(); }
    // o dorso, os dedos (de baixo para cima) e o polegar, cada um com o traço de tinta
    g.strokeStyle = TINTA; g.lineWidth = 1.6;
    dorso(e); g.fillStyle = pele(-.46 * k, .42 * k); g.fill(); g.stroke();
    for(const d of [...DEDOS].reverse()){
      const [y, atras, hh] = d, fx = e - atras * k;
      dedo(e, d); g.fillStyle = pele((y - hh / 2) * k, (y + hh / 2) * k, true); g.fill(); g.strokeStyle = TINTA; g.lineWidth = 1.5; g.stroke();
      // a dobra da falange e a luz no nó
      g.strokeStyle = 'rgba(11,12,16,.45)'; g.lineWidth = 1;
      g.beginPath(); g.arc(fx - .4 * k, y * k, hh * k * .42, -Math.PI / 2.6, Math.PI / 2.6); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.1;
      g.beginPath(); g.arc(fx - hh * k / 2, y * k, hh * k * .34, -Math.PI / 2.1, -Math.PI / 7); g.stroke();
    }
    polegar(e); g.fillStyle = pele(0, .36 * k, true); g.fill(); g.strokeStyle = TINTA; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#F7DCC8'; g.lineWidth = .8; g.beginPath(); g.ellipse(x0 + .79 * k, .1 * k, .07 * k, .055 * k, 0, 0, TAU); g.fill(); g.stroke();
  }
  // as linhas de velocidade do mangá, atrás do punho, só fora do braço
  function velocidade(e, q){
    if(q <= 0) return;
    g.strokeStyle = traco; g.lineCap = 'round';
    [[-.62, 1.5], [-.76, 1.0], [.6, 1.7], [.74, 1.1], [-.9, .7], [.88, .8]].forEach(([y, n], i) => {
      const fim = e - k * (.9 + i * .05), ini = fim - n * k * (.6 + q);
      g.globalAlpha = q * (.75 - i * .07); g.lineWidth = i < 4 ? 1.5 : 1;
      g.beginPath(); g.moveTo(Math.max(0, ini), y * k); g.lineTo(Math.max(0, fim), y * k); g.stroke();
    });
    g.globalAlpha = 1;
  }
  // as marcas dos nós dos dedos no card, que somem devagar
  function marcas(u){
    const a = u < 20 ? u / 20 : Math.max(0, 1 - (u - 20) / 300); if(a <= 0) return;
    g.strokeStyle = cor; g.lineWidth = 2.4; g.lineCap = 'round'; g.globalAlpha = .9 * a;
    for(let i = 0; i < 4; i++){ g.beginPath(); g.arc(L + .02 * k, (-.33 + i * .22) * k, .085 * k, -Math.PI / 2, Math.PI / 2); g.stroke(); }
    g.globalAlpha = 1;
  }
  // o impacto: clarão, a estrela do mangá que estoura e fecha, um anel do nen e os riscos para fora
  function estouro(u){
    if(u > 230) return;
    g.save(); g.translate(L + .12 * k, 0);
    if(u < 35){ g.globalAlpha = (1 - u / 35) * .85; g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(0, 0, 1.3 * k * (.3 + u / 35), 0, TAU); g.fill(); }
    const sc = u < 45 ? .55 + .65 * (1 - Math.pow(1 - u / 45, 3)) : 1.2 - .15 * Math.min(1, (u - 45) / 80);
    const a = u < 70 ? 1 : Math.max(0, 1 - (u - 70) / 70);
    if(a > 0){
      const estrela = f => { g.beginPath(); pontas.forEach((p, i) => { const an = i / pontas.length * TAU, r0 = .5 * k * sc * f, r1 = p * 1.15 * k * sc * f;
        const ax = Math.cos(an) * r1, ay = Math.sin(an) * r1, bn = an + Math.PI / pontas.length, bx = Math.cos(bn) * r0, by = Math.sin(bn) * r0;
        i ? g.lineTo(ax, ay) : g.moveTo(ax, ay); g.lineTo(bx, by); }); g.closePath(); };
      g.globalAlpha = a; g.lineJoin = 'miter';
      estrela(1); g.fillStyle = '#FFFFFF'; g.fill(); g.strokeStyle = TINTA; g.lineWidth = 2.2; g.stroke();
      estrela(.55); g.fillStyle = cor; g.fill();
    }
    const q = u / 230;
    g.globalAlpha = 1 - q; g.strokeStyle = cor; g.lineWidth = 3 * (1 - q) + .5;
    g.beginPath(); g.arc(0, 0, .6 * k + u * .16, 0, TAU); g.stroke();
    g.strokeStyle = traco; g.lineWidth = 2; g.lineCap = 'round'; g.globalAlpha = Math.max(0, 1 - u / 200);
    for(const r of riscos){ const r1 = (r.r * .85 * k + u * .1), r2 = r1 + r.n * k;
      g.beginPath(); g.moveTo(Math.cos(r.a) * r1, Math.sin(r.a) * r1); g.lineTo(Math.cos(r.a) * r2, Math.sin(r.a) * r2); g.stroke(); }
    g.restore();
  }

  function quadro(t){
    const s = abertura(t), e = alcance(t), u = t - IMPACTO;
    g.save(); g.translate(m.ox, m.oy); g.rotate(m.a); if(m.vira) g.scale(1, -1);
    if(u >= 0){ marcas(u); estouro(u); }   // o estouro fica atrás do punho, para ver a mão acertando
    if(s > 0) portalAtras(s, t);
    if(e > 0){
      g.save(); g.beginPath(); g.rect(0, -3 * k, L + 3 * k, 6 * k); g.clip();   // do outro lado do portal o braço não existe
      velocidade(e, t < IMPACTO ? (t - SAI) / (IMPACTO - SAI) : Math.max(0, 1 - u / 50));
      braco(e, t < IMPACTO + 40 ? 1 : Math.max(0, 1 - (u - 40) / 120));
      g.restore();
    }
    if(s > 0) portalFrente(s);
    fecha(t);
    g.restore();
    const p = u < 0 ? 0 : u < 40 ? 7 * u / 40 : 7 * (1 - suave((u - 40) / 200));   // o tranco no card, na direção do soco
    return [ux * p, uy * p];
  }
  const fase = t => t < SAI ? 'o portal abre' : t < IMPACTO ? 'o punho sai' : t < VOLTA ? 'o soco' : t < DENTRO ? 'volta pelo portal' : t < FIM ? 'o portal fecha' : '';
  return {quadro, fase};
}

function dispara(r, o = {}){
  const alvo = o.alvo || document.body, cam = camada(alvo), lento = o.lento || 1, el = o.el, antes = el ? el.style.translate : '';
  const fx = cria(cam.g, cam.w, cam.h, {x: r.left - cam.ox, y: r.top - cam.oy, w: r.width, h: r.height},
    {cor: o.cor || NEN, claro: o.claro ?? fundoClaro(), lado: o.lado || 0}, sorteio(Math.random() * 4294967296));
  let t0 = null;
  const passo = now => {
    if(t0 === null) t0 = now;
    const t = (now - t0) / lento; fx.t = t;
    cam.g.clearRect(0, 0, cam.w, cam.h);
    const [dx, dy] = fx.quadro(t);
    if(el) el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    if(t < FIM) requestAnimationFrame(passo); else { cam.cv.remove(); if(el) el.style.translate = antes; fx.acabou = true; }
  };
  requestAnimationFrame(passo);
  return fx;
}

// bancada: uma lista de tarefas na tela preta; cada uma concluída sobe um andar (o aviso do jogo aparece embaixo) e o soco
// sai nela. "card largo" deixa a lista da largura da tela, como a Lista do jogo, e o portal abre em cima
const TAREFAS = ['Ler 20 páginas', 'Treinar 30 min', 'Responder os e-mails', 'Revisar os flashcards'];
function liga(palco, cfg){
  const antes = palco.style.cssText, lista = document.createElement('div'), aviso = document.createElement('div');
  palco.style.cursor = 'default';
  aviso.style.cssText = 'position:absolute;left:50%;bottom:18px;translate:-50% 0;padding:9px 16px;border-radius:10px;font:600 14px var(--f-ui);opacity:0;transition:opacity .2s;pointer-events:none';
  const cards = TAREFAS.map(n => {
    const c = document.createElement('div'); c.innerHTML = `<i></i><span>${n}</span>`;
    c.style.cssText = 'position:relative;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:10px;border:1px solid;cursor:pointer;font:14px var(--f-ui)';
    c.firstChild.style.cssText = 'width:22px;height:22px;border-radius:50%;border:2px solid var(--amb);flex:none';
    c.onclick = () => conclui(c); lista.append(c); return c;
  });
  const pinta = () => {
    lista.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${cfg.largo ? '94%' : 'min(380px,64%)'};display:grid;gap:12px`;
    palco.style.background = cfg.claro ? '#F2F3F7' : '#000';
    aviso.style.background = cfg.claro ? '#1B1D28' : '#E6E8F0'; aviso.style.color = cfg.claro ? '#E6E8F0' : '#1B1D28';
    for(const c of cards){ c.style.background = cfg.claro ? '#FFFFFF' : '#1B1D28'; c.style.borderColor = cfg.claro ? '#D9DCE5' : '#2A2D3C';
      c.style.color = c.feito ? (cfg.claro ? '#8A8FA0' : '#6B7088') : (cfg.claro ? '#1B1D28' : '#E6E8F0'); }
  };
  let ultimo = null, andar = 97, some = 0;
  function conclui(c){
    if(c.feito) return;
    c.feito = true; c.firstChild.style.background = 'var(--amb)'; c.lastChild.style.textDecoration = 'line-through'; pinta();
    ultimo = dispara(c.getBoundingClientRect(), {alvo: palco, el: c, lado: cfg.lado, claro: !!cfg.claro, cor: cfg.cor, lento: cfg.lento});
    andar++; aviso.innerHTML = `▲ Andar ${andar} <small style="font-weight:400;opacity:.7">a torre sobe</small>`; aviso.style.opacity = 1;
    clearTimeout(some); some = setTimeout(() => { aviso.style.opacity = 0; }, 1800 * cfg.lento);
    setTimeout(() => { c.feito = false; c.firstChild.style.background = ''; c.lastChild.style.textDecoration = ''; pinta(); }, 2200 * cfg.lento);
  }
  const tecla = e => { if(e.code !== 'Space' || e.target.closest('input,button')) return; e.preventDefault(); const c = cards.find(c => !c.feito); if(c) conclui(c); };
  document.addEventListener('keydown', tecla);
  palco.append(lista, aviso); pinta();
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); },
    estado: () => ({andar, t: ultimo && ultimo.t, acabou: ultimo && ultimo.acabou}),
    legenda: () => `andar ${andar}` + (ultimo && !ultimo.acabou ? ' · ' + ultimo.fase(ultimo.t || 0) : ''),
    desliga(){ document.removeEventListener('keydown', tecla); clearTimeout(some); lista.remove(); aviso.remove(); palco.querySelectorAll('canvas').forEach(c => c.remove()); palco.style.cssText = antes; },
  };
}

// prévias paradas: os cinco momentos de lado no escuro, de cima (card largo, como a Lista do jogo) e de lado no claro
const MOMENTOS = [[70, 'o portal abre'], [185, 'o punho sai'], [232, 'o soco'], [330, 'volta pelo portal'], [440, 'o portal fecha']];
function previas(el, cfg){
  const momento = (t, claro, largo) => {
    const W = 300, H = largo ? 210 : 180, R = largo ? {x: 10, y: 136, w: 280, h: 48} : {x: 128, y: 66, w: 162, h: 48};
    const c = document.createElement('canvas'), d = devicePixelRatio || 1; c.className = 'prev';
    c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px';
    const g = c.getContext('2d'); g.scale(d, d);
    g.fillStyle = claro ? '#F2F3F7' : '#0F1016'; g.fillRect(0, 0, W, H);
    const fx = cria(g, W, H, R, {cor: cfg.cor || NEN, claro, lado: largo ? 2 : 1}, sorteio(7));
    // o card desenhado já com o tranco daquele momento: um quadro só para saber o tranco, apagado em seguida
    const [dx, dy] = fx.quadro(t);
    g.globalAlpha = 1; g.fillStyle = claro ? '#F2F3F7' : '#0F1016'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(dx, dy);
    g.fillStyle = claro ? '#FFFFFF' : '#1B1D28'; g.strokeStyle = claro ? '#D9DCE5' : '#2A2D3C';
    g.beginPath(); g.roundRect(R.x, R.y, R.w, R.h, 10); g.fill(); g.stroke();
    g.fillStyle = '#E0AF68'; g.beginPath(); g.arc(R.x + 27, R.y + 24, 10, 0, 7); g.fill();
    g.fillStyle = claro ? '#8A8FA0' : '#6B7088'; g.font = '14px system-ui,sans-serif'; g.fillText('Ler 20 páginas', R.x + 48, R.y + 29);
    g.restore();
    fx.quadro(t);
    return c;
  };
  const linhas = [['de lado, no escuro', false, false], ['de cima (card largo, como a Lista do jogo)', false, true], ['de lado, no claro', true, false]];
  el.innerHTML = linhas.map(([n]) => `<section><h2>${n}: ${MOMENTOS.map(x => x[1]).join(' · ')}</h2><div class="linha"></div></section>`).join('');
  const ls = el.querySelectorAll('.linha');
  linhas.forEach(([, claro, largo], i) => MOMENTOS.forEach(([t]) => ls[i].append(momento(t, claro, largo))));
}

(window.CURSORES = window.CURSORES || {}).soco = {dispara, liga, previas, cria,
  titulo: 'clique numa tarefa (ou aperte espaço): cada uma sobe um andar',
  dica: 'raro: só no andar novo e no chefão derrotado, ~0,56 s, sem física e sem tremer a tela<br>o portal de nen abre ao lado do card, o punho do Leorio sai, acerta a borda, deixa as marcas dos nós dos dedos e volta<br>card largo: a lista na largura da tela, como no jogo (o portal abre em cima) · câmera lenta para ver o desenho',
  controles: [{k: 'lado', rot: 'portal (0 auto · 1 de lado · 2 de cima)', min: 0, max: 2, un: '', padrao: 0},
    {k: 'largo', rot: 'card largo', min: 0, max: 1, un: '', padrao: 0},
    {k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
