// Efeito Cartas do Hisoka (fx-baralho), feito em código, sem imagem: dispara ao concluir uma tarefa, e tudo acontece em
// volta dela, com o card como alvo. Em quatro tempos. 1) O giro (~480 ms): as cartas saem de trás do card e giram em volta
// dele numa elipse, acelerando e fechando, como o Hisoka embaralhando no ar; viram entre frente e verso, as da metade de
// trás passam por trás do card, a tela escurece e a aura rosa acende no contorno. 2) O arremesso: todas param de uma vez,
// apontam para o card e são atiradas em sequência; cravam de ponta em toda a borda (a parte de dentro some no card),
// tremem e deixam o talho, e o card leva o tranco a cada uma. 3) O Coringa: gira sozinho mais uma volta e crava por último,
// no meio da borda de cima, mais forte, com a estrela brilhando. 4) O resto: as cartas soltam uma a uma e caem planando
// como folha; os talhos somem.
// O desenho das cartas é o do cursor da carta (cursores/carta.js), copiado aqui para o efeito não depender dele.
// A 1ª tentativa (o castelo de cartas em cima do card, recusada em 20/10) está em tentativas/fx-baralho/castelo.js.
//   CURSORES.baralho.dispara(rect, {alvo: document.body, el: card, claro: auto, lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra, a tela inteira por padrão; el = o card, que treme;
//   claro = fundo claro, por padrão lido da cor do body; lento = câmera lenta)
//   CURSORES.baralho.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas para concluir
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const TINTA = '#11131A', PAPEL = '#FBF7EE', VERMELHO = '#E0365A', PRETO = '#1D2030';
const OURO = '#FFD23F', OURO_ESC = '#C9961A', ROSA = '#FF5C8A', VINHO = '#8E2457';
// ms: o giro; a parada antes do arremesso; uma carta atirada a cada ESP, cada voo leva VOO; o Coringa sai em CORINGA e
// leva VOO_C; as cartas soltam a partir de SOLTA (uma a cada 22 ms) e tudo acaba em FIM
const GIRO = 480, PARA = 60, ESP = 16, VOO = 100, CORINGA = 900, VOO_C = 170, BATE_C = CORINGA + VOO_C, SOLTA = 1380, FIM = 2450;
const DT = 1000 / 240, TAU = Math.PI * 2;
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const difAng = (a, b) => { let d = (b - a) % TAU; if(d > Math.PI) d -= TAU; if(d < -Math.PI) d += TAU; return d; };
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
// a borda do card, percorrida no sentido do relógio a partir do canto de cima à esquerda: ponto e normal para fora
function borda(R, s){
  const P = 2 * (R.w + R.h); s = (s % P + P) % P;
  if(s < R.w) return [R.x + s, R.y, 0, -1]; s -= R.w;
  if(s < R.h) return [R.x + R.w, R.y + s, 1, 0]; s -= R.h;
  if(s < R.w) return [R.x + R.w - s, R.y + R.h, 0, 1]; s -= R.w;
  return [R.x, R.y + R.h - s, -1, 0];
}
const card = (g, R, r = 9) => { g.beginPath(); g.roundRect ? g.roundRect(R.x, R.y, R.w, R.h, r) : g.rect(R.x, R.y, R.w, R.h); };

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


// ---------- o alvo ----------
// as cartas: cada uma tem o ponto da borda onde vai cravar (espalhados pelo contorno), a direção em que entra (de ponta,
// mais ou menos de frente para a borda) e o lugar dela na elipse do giro, no mesmo ângulo do ponto, para o voo ser curto
function alvo(R, rnd){
  const H = lim(R.h * .85, 32, 46), cx = R.x + R.w / 2, cy = R.y + R.h / 2, P = 2 * (R.w + R.h);
  const N = lim(Math.round(P / (H * 1.6)), 10, 18), FUNDO = H * .24;   // quanto da carta entra no card
  const ax = R.w / 2 + H * .75, ay = R.h / 2 + H * .9;
  const baralho = [];
  for(const s of 'ecop') for(const n of VALORES) baralho.push({n, s});
  for(let i = baralho.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [baralho[i], baralho[j]] = [baralho[j], baralho[i]]; }
  const crava = (bx, by, nx, ny, tilt, Hc) => {
    let dx = -nx - ny * tilt, dy = -ny + nx * tilt; const d = Math.hypot(dx, dy); dx /= d; dy /= d;
    return {bx, by, nx, ny, dx, dy, a: Math.atan2(-dx, dy), x: bx - dx * (Hc / 2 - FUNDO), y: by - dy * (Hc / 2 - FUNDO)};
  };
  const s0 = rnd() * P, pecas = [];
  for(let i = 0; i < N; i++){
    const s = s0 + (i + .5 + (rnd() - .5) * .5) / N * P, [bx, by, nx, ny] = borda(R, s);
    if(Math.min(Math.abs(bx - R.x), Math.abs(bx - R.x - R.w)) < 6 && Math.min(Math.abs(by - R.y), Math.abs(by - R.y - R.h)) < 6) continue;   // nada de quina
    const c = crava(bx, by, nx, ny, (rnd() - .5) * .7, H);
    pecas.push({...c, c: baralho[i], H, th: Math.atan2((by - cy) / ay, (bx - cx) / ax), face: rnd() < .6 ? 1 : -1, ord: pecas.length, giro: rnd() * TAU});
  }
  pecas.forEach(p => { p.sai = GIRO + PARA + p.ord * ESP; p.bate = p.sai + VOO; p.solta = SOLTA + p.ord * 22; });
  const Hj = H * 1.12, cj = {...crava(cx + (rnd() - .5) * R.w * .2, R.y, 0, -1, 0, Hj), c: {n: '★', s: ''}, H: Hj, th: -Math.PI / 2 + Math.PI * .8, face: 1,
    sai: CORINGA, bate: BATE_C, solta: SOLTA + pecas.length * 22 + 80, giro: 0, coringa: 1};
  return {pecas, cj, H, cx, cy, ax, ay, FUNDO};
}

// o ataque, numa tela w × h, no card R; quadro(t) avança a física até t (ms desde o começo), desenha e devolve o tremor
function cria(g, w, h, R, op, rnd){
  const {claro} = op, soma = claro ? 'source-over' : 'lighter';
  const {pecas, cj, H, cx, cy, ax, ay, FUNDO} = alvo(R, rnd), todas = [...pecas, cj];
  let sim = 0;
  // o giro: o raio da elipse cresce (as cartas saem de trás do card), passa um pouco e fecha; duas voltas, acelerando
  const orbita = (p, t) => {
    const u = Math.min(1, t / GIRO), raio = u < .35 ? 1.12 * (1 - (1 - u / .35) ** 2) : 1.12 - .12 * (u - .35) / .65;
    const th = p.th + 2 * TAU * u ** 1.6 + (p.coringa && t > GIRO ? (t - GIRO) / 1000 * 9 : 0);   // o Coringa continua girando sozinho
    const x = cx + ax * raio * Math.cos(th), y = cy + ay * raio * Math.sin(th), tx = -ax * Math.sin(th), ty = ay * Math.cos(th);
    return {x, y, a: Math.atan2(-tx, ty), th, raio};
  };
  const fora = () => { g.beginPath(); g.rect(0, 0, w, h); g.roundRect ? g.roundRect(R.x, R.y, R.w, R.h, 9) : g.rect(R.x, R.y, R.w, R.h); g.clip('evenodd'); };
  const brilho = (x, y, r, a) => {   // brilho de quatro pontas
    g.save(); g.globalCompositeOperation = soma; g.globalAlpha = a; g.fillStyle = claro ? OURO_ESC : '#FFFFFF'; g.beginPath();
    for(let i = 0; i < 8; i++){ const an = i * Math.PI / 4, q = i % 2 ? r * .18 : r; g.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q); }
    g.fill(); g.restore();
  };
  // depois de soltar: sai do card (80 ms) e cai planando, balançando de um lado para o outro e virando aos poucos
  function fisica(){
    const dt = DT / 1000;
    for(const p of todas){
      if(sim < p.solta + 80) continue;
      if(!p.livre){ p.livre = true; p.fx = p.x - p.dx * FUNDO; p.fy = p.y - p.dy * FUNDO; p.vx = -p.dx * 90; p.vy = -p.dy * 90 - 30;
        p.fa = p.a; p.ff = p.face > 0 ? 0 : Math.PI; p.vf = (rnd() < .5 ? -1 : 1) * 4; p.fase = rnd() * TAU; p.tau = 0; }
      p.tau += dt;
      p.vy += (75 - p.vy) * 2.6 * dt; p.vx += (Math.sin(p.tau * 3.4 + p.fase) * 110 - p.vx) * 3 * dt;
      p.fx += p.vx * dt; p.fy += p.vy * dt; p.fa += ((p.vx / 110) * .7 - p.fa * .15) * 3 * dt; p.ff += p.vf * dt;
    }
  }

  function quadro(t){
    while(sim + DT <= t){ sim += DT; if(sim >= SOLTA) fisica(); }
    g.save(); g.lineJoin = g.lineCap = 'round';
    // a tela escurece no giro e volta depois do Coringa
    const veu = (t < BATE_C ? Math.min(1, t / GIRO) : Math.exp(-(t - BATE_C) / 300)) * (claro ? .06 : .26);
    if(veu > .005){ g.globalAlpha = veu; g.fillStyle = claro ? TINTA : '#000'; g.fillRect(0, 0, w, h); g.globalAlpha = 1; }
    // a aura rosa no contorno do card: acende no giro, pisca a cada carta que crava e estoura com o Coringa
    let ka = t < GIRO + PARA ? Math.min(1, t / GIRO) : t < BATE_C ? 1 : Math.exp(-(t - BATE_C) / 380) * 1.4;
    for(const p of todas){ const v = t - p.bate; if(v > 0 && v < 200) ka += (p.coringa ? 1.2 : .35) * Math.exp(-v / 60); }
    if(ka > .02){ card(g, R); g.globalCompositeOperation = soma; g.strokeStyle = ROSA;
      for(const [lw, a] of [[14, .07], [6, .15], [1.6, .75]]){ g.lineWidth = lw; g.globalAlpha = Math.min(1, a * ka); g.stroke(); } }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    const some = t < FIM - 450 ? 1 : Math.max(0, (FIM - t) / 450);
    // os talhos na borda, de cada carta que cravou
    for(const p of todas){ if(t < p.bate) continue; const a = (t < p.solta ? 1 : Math.max(0, 1 - (t - p.solta) / 700)) * .8;
      if(a <= 0) continue; const L = p.H * (p.coringa ? .34 : .26), tx = -p.ny, ty = p.nx;
      g.globalAlpha = a; g.strokeStyle = claro ? TINTA : '#05060A'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(p.bx - tx * L, p.by - ty * L); g.lineTo(p.bx + tx * L, p.by + ty * L); g.stroke(); }
    g.globalAlpha = 1;
    // as cartas: primeiro as que estão atrás (metade de cima do giro e as cravadas), depois as da frente
    const frente = [];
    for(const p of todas){
      if(t < p.sai){   // girando (ou parada, apontando para o card)
        const o = orbita(p, Math.min(t, p.coringa ? t : GIRO));
        let a = o.a, vira = Math.cos(o.th * 1.5 + p.giro);
        if(!p.coringa && t > GIRO){ const k = Math.min(1, (t - GIRO) / PARA), e = 1 - (1 - k) ** 2; a = o.a + difAng(o.a, p.a) * e; vira = vira + (p.face - vira) * e; }
        if(p.coringa) vira = Math.cos(o.th * 1.2);
        const atras = Math.sin(o.th) < 0, item = () => desenha(g, p.c, o.x, o.y, p.H * (atras ? .92 : 1), a, vira);
        if(atras){ g.save(); fora(); g.globalAlpha = .85; item(); g.restore(); } else frente.push(item);
        p.ox = o.x; p.oy = o.y; p.oa = a;
        continue;
      }
      if(t < p.bate){   // o voo: reto e rápido, com rastro
        if(p.ox === undefined){ const o = orbita(p, p.coringa ? p.sai : GIRO); p.ox = o.x; p.oy = o.y; }
        const u = (t - p.sai) / (p.bate - p.sai), e = u * (.6 + .4 * u), x = p.ox + (p.x - p.ox) * e, y = p.oy + (p.y - p.oy) * e;
        frente.push(() => {
          for(const [k, al] of [[.16, .12], [.08, .25]]){ g.globalAlpha = al; desenha(g, p.c, x - (p.x - p.ox) * k, y - (p.y - p.oy) * k, p.H, p.a, p.face); }
          g.globalAlpha = 1; desenha(g, p.c, x, y, p.H, p.a, p.face);
        });
        continue;
      }
      if(!p.livre){   // cravada: treme e para; a ponta some dentro do card
        const s = (t - p.bate) / 1000, tr = (p.coringa ? .22 : .17) * Math.exp(-s / .11) * Math.sin(s * 78);
        const v = Math.max(0, (t - p.solta) / 80), x = p.x - p.dx * FUNDO * Math.min(1, v), y = p.y - p.dy * FUNDO * Math.min(1, v);
        g.save(); fora(); desenha(g, p.c, x, y, p.H, p.a + tr, p.face); g.restore();
        // as faíscas da batida
        const vb = t - p.bate;
        if(vb < 140){ const k = 1 - vb / 140, r0 = 4 + vb * .25, r1 = r0 + 8 * k; g.globalCompositeOperation = soma; g.globalAlpha = k; g.strokeStyle = claro ? ROSA : '#FFFFFF'; g.lineWidth = 1.6; g.beginPath();
          for(const an of [-1.1, -.4, .4, 1.1]){ const ca = Math.atan2(p.ny, p.nx) + an; g.moveTo(p.bx + Math.cos(ca) * r0, p.by + Math.sin(ca) * r0); g.lineTo(p.bx + Math.cos(ca) * r1, p.by + Math.sin(ca) * r1); }
          g.stroke(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
        if(p.coringa && vb > 40 && vb < 520){   // a estrela do Coringa brilha
          const k = Math.exp(-(((vb - 140) / 90) ** 2)) + .5 * Math.exp(-(((vb - 360) / 60) ** 2)), W = p.H * .7, ca = Math.cos(p.a), sa = Math.sin(p.a), lx = -W * .1, ly = -p.H * .1;
          brilho(x + lx * ca - ly * sa, y + lx * sa + ly * ca, p.H * .5 * (.6 + k), k);
        }
        continue;
      }
      g.globalAlpha = some; desenha(g, p.c, p.fx, p.fy, p.H, p.a + p.fa, Math.cos(p.ff)); g.globalAlpha = 1;   // caindo como folha
    }
    for(const f of frente) f();
    // o anel do Coringa
    const vc = t - BATE_C;
    if(vc > 0 && vc < 420){ const k = 1 - vc / 420; g.globalCompositeOperation = soma; g.globalAlpha = k ** 1.5; g.strokeStyle = ROSA; g.lineWidth = 2.6 * k + .5;
      card(g, {x: R.x - vc * .12, y: R.y - vc * .12, w: R.w + vc * .24, h: R.h + vc * .24}, 9 + vc * .1); g.stroke(); }
    g.restore();
    // o tranco: cada carta que crava empurra o card, o Coringa mais forte
    let am = 0, ox = 0, oy = 0;
    for(const p of todas){ const v = t - p.bate; if(v > 0 && v < 300){ const k = (p.coringa ? 5 : 2.2) * Math.exp(-v / 55); am += k; ox += p.dx * k; oy += p.dy * k; } }
    return [ox * .6 + (Math.random() - .5) * am * .5, oy * .6 + (Math.random() - .5) * am * .5];
  }
  const ultima = pecas.length ? pecas[pecas.length - 1].bate : GIRO;
  const fase = t => t < GIRO ? 'o giro: as cartas saem de trás do card' : t < GIRO + PARA ? 'param e apontam' : t < ultima ? 'o arremesso: cravam na borda' :
    t < BATE_C ? 'o Coringa gira sozinho' : t < SOLTA ? 'o Coringa cravou' : t < FIM ? 'soltam e caem como folha' : '';
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
  let t0 = null, bateu = false;
  const passo = now => {
    if(t0 === null) t0 = now;
    const t = (now - t0) / lento; fx.t = t;
    cam.g.clearRect(0, 0, cam.w, cam.h);
    const [dx, dy] = fx.quadro(t);
    if(el) el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    if(!bateu && t >= BATE_C && el){ bateu = true; acende(el, lento); }
    if(t < FIM) requestAnimationFrame(passo); else { cam.cv.remove(); if(el) el.style.translate = antes; fx.acabou = true; }
  };
  requestAnimationFrame(passo);
  return fx;
}

// bancada: uma lista de tarefas na tela preta; clicar numa (ou espaço) conclui e dispara o efeito nela
const TAREFAS = ['Ler 20 páginas', 'Treinar 30 min', 'Responder os e-mails', 'Revisar os flashcards'];
function tarefas(palco, cfg, fx){
  const antes = palco.style.cssText, lista = document.createElement('div');
  palco.style.cursor = 'default';
  lista.style.cssText = 'position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:min(440px,86%);display:grid;gap:12px';
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

// prévias paradas: o mesmo ataque (mesma semente) em seis momentos, no escuro e no claro
function previas(el, cfg){
  const W = 340, H = 200, R = {x: 60, y: 78, w: 220, h: 44};
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
  const ts = [[GIRO * .3, 'saem de trás do card'], [GIRO * .85, 'o giro fecha'], [GIRO + PARA + 4 * ESP + VOO * .6, 'o arremesso'],
    [BATE_C + 60, 'o Coringa crava'], [SOLTA + 260, 'soltam'], [SOLTA + 700, 'folhas']];
  el.innerHTML = '<section><h2>' + ts.map(x => x[1]).join(' · ') + ' (o mesmo ataque, parado)</h2><div class="linha"></div><div class="linha" style="margin-top:12px"></div></section>';
  const [esc, cla] = el.querySelectorAll('.linha');
  ts.forEach(([t]) => { esc.append(momento(t, false, 11)); cla.append(momento(t, true, 11)); });
}

(window.CURSORES = window.CURSORES || {}).baralho = {dispara, liga, previas, cria,
  titulo: 'clique numa tarefa (ou aperte espaço) para concluir',
  dica: 'as cartas saem de trás do card e giram em volta dele, acelerando, param apontando e cravam em toda a borda, uma atrás da outra,<br>o Coringa gira sozinho e crava por último no alto, e as cartas soltam e caem como folha · câmera lenta para ver tudo',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
