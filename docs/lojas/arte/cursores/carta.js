// Cursor com física da carta do Hisoka (cr-carta), desenhado em código, sem imagem.
// O cursor é uma carta presa pelo canto entre os dedos (o canto de cima à esquerda é a ponta do clique): ela balança com
// o mouse, pela inércia e pelo ar, e a mola dos dedos traz de volta. Clicar atira a carta girando, como o Hisoka: rápida,
// o giro a sustenta e ela voa reta; perdendo velocidade, cai. Batendo forte numa borda da tela, crava de quina e treme;
// uns segundos depois solta e cai planando como folha, virando (aparece o verso). Segurando o clique, a Bungee Gum gruda
// na carta (tem as propriedades da borracha e do chiclete): o fio rosa estica e afina no meio, a carta fica pendurada
// pelo canto e quica como num elástico, gruda se bater numa borda e arranca se esticar demais; soltar o clique contrai a
// goma e a carta volta para os dedos. O baralho é de verdade (52 cartas e o Coringa do Hisoka, embaralhadas): cada carta
// atirada sai com a sua face e a próxima aparece entre os dedos. Com o mouse parado, ele vira a carta e ela troca de face.
//   const c = CURSORES.carta.liga(elemento, {altura: 34, toque: false})   c.ajusta({altura: 40})   c.legenda()   c.desliga()
//   (toque: true também aceita o dedo no celular: tocar atira, segurar e arrastar leva a carta na goma)
//   CURSORES.carta.desenha(ctx, carta, x, y, altura, angulo, vira)   (carta = {n:'K', s:'c'}; x, y = centro; vira < 0 = verso)
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const TINTA = '#11131A', PAPEL = '#FBF7EE', VERMELHO = '#E0365A', PRETO = '#1D2030';
const OURO = '#FFD23F', OURO_ESC = '#C9961A', ROSA = '#FF5C8A', VINHO = '#8E2457';
const PASSO = 1 / 240, G = 3400;
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SIMB = {e: '♠', c: '♥', o: '♦', p: '♣'};
const A0 = -.22;              // a carta entre os dedos fica um pouco inclinada para a esquerda, com a ponta para cima
const ATIRA = 1500;           // velocidade com que a carta sai da mão (px/s), mais parte da do mouse
const CRAVA = 520;            // mais rápido que isso contra a borda, a quina crava; mais devagar, ela bate e cai
const CRAVADA = 3.2;          // segundos cravada antes de soltar
const GOMA = {k: 34, L0: 22, amort: 3, arranca: 16000};   // a Bungee Gum: mola mole, comprimento solto e a força que arranca da borda
const NG = 14;                // nós do fio de goma (só para desenhar: a força é a da mola)

// os naipes, desenhados (não dependem de fonte); t = largura
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

// a frente: índice nos dois cantos (o de baixo de ponta-cabeça) e um naipe grande no meio, que é o que se lê com 34 px;
// valete, dama e rei têm a letra num quadro dourado
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
// o Coringa do Hisoka: a estrela e a lágrima do rosto dele, num quadro dourado
function coringa(ctx, W, H){
  ctx.strokeStyle = OURO_ESC; ctx.lineWidth = H * .022; ctx.strokeRect(-W * .34, -H * .38, W * .68, H * .76);
  ctx.lineWidth = Math.max(.8, H * .025); ctx.strokeStyle = TINTA;
  estrela(ctx, -W * .1, -H * .1, W * .26); ctx.fillStyle = OURO; ctx.fill(); ctx.stroke();
  gota(ctx, W * .14, H * .15, W * .34); ctx.fillStyle = ROSA; ctx.fill(); ctx.stroke();
  for(const k of [1, -1]){ ctx.save(); ctx.scale(k, k); estrela(ctx, -W / 2 + W * .17, -H / 2 + H * .13, W * .1); ctx.fillStyle = OURO_ESC; ctx.fill(); ctx.restore(); }
}
// o verso: vinho com treliça rosa e um losango dourado no meio
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
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(Math.abs(vira) < .02 ? .02 : vira, 1);
  ctx.beginPath(); ctx.roundRect(-W / 2, -H / 2, W, H, H * .085); ctx.fillStyle = PAPEL; ctx.fill();
  if(vira < 0) verso(ctx, W, H); else frente(ctx, c, W, H);
  ctx.beginPath(); ctx.roundRect(-W / 2 + lw / 2, -H / 2 + lw / 2, W - lw, H - lw, H * .075);
  ctx.strokeStyle = TINTA; ctx.lineWidth = lw; ctx.stroke();
  ctx.restore();
}
const nome = c => c.n === '★' ? 'Coringa' : c.n + SIMB[c.s];

function liga(alvo, op = {}){
  const tela = alvo === document.body || alvo === document.documentElement;
  const cfg = {altura: 34, ...op};
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483000`;
  (tela ? document.body : alvo).append(cv);
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let H, W, J, Ic;
  function medidas(){ H = cfg.altura; W = H * .7; J = (W * W + H * H) / 3; Ic = (W * W + H * H) / 12; }

  // o baralho, embaralhado (Fisher–Yates); a carta de cima vai para os dedos
  const baralho = [];
  for(const s of 'ecop') for(const n of VALORES) baralho.push({n, s});
  baralho.push({n: '★', s: ''});
  for(let i = baralho.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [baralho[i], baralho[j]] = [baralho[j], baralho[i]]; }
  // na mão: ângulo e giro em volta do canto preso, escala de quando aparece, o pulo de quando volta e a virada do truque
  const mao = {c: baralho.shift(), a: A0, w: 0, s: 1, pop: 0, fl: 0, trocou: false};
  const soltas = [];    // cartas fora da mão: voa, goma, cravada, folha
  let goma = null;      // a carta presa pela Bungee Gum e o fio dela
  let mx = 0, my = 0, fx = 0, fy = 0, dentro = false, larg = 0, alt = 0, dpr = 1, antes = 0, sobra = 0, pedido = 0, parado = 0;
  let vx = 0, vy = 0, axs = 0, ays = 0, dirx = Math.cos(A0 + Math.atan2(1, .7)), diry = Math.sin(A0 + Math.atan2(1, .7));
  let preso = false, tPreso = 0, aguarda = null, ocioso = 0, fezTruque = false;

  function mede(){
    const r = tela ? {width: innerWidth, height: innerHeight} : alvo.getBoundingClientRect();
    larg = r.width; alt = r.height; dpr = devicePixelRatio || 1;
    cv.width = Math.round(larg * dpr); cv.height = Math.round(alt * dpr); acorda();
  }
  const gira = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  // o canto de cima à esquerda (o que fica entre os dedos e onde a goma gruda), relativo ao centro
  const canto = a => gira(-W / 2, -H / 2, a);

  // ---- na mão
  function passoMao(h, nx, ny){
    const rvx = (nx - fx) / h, rvy = (ny - fy) / h; fx = nx; fy = ny;
    const q = 1 - Math.exp(-h / .03), vx0 = vx, vy0 = vy;
    vx += (rvx - vx) * q; vy += (rvy - vy) * q;
    axs += ((vx - vx0) / h - axs) * q; ays += ((vy - vy0) / h - ays) * q;
    const sp = Math.hypot(vx, vy); if(sp > 300){ dirx = vx / sp; diry = vy / sp; }
    // gira em volta do canto preso: a mola dos dedos, a inércia (o mouse acelera e o centro da carta fica para trás) e o
    // ar (andando, ela se deita para trás como uma bandeira)
    const [rx, ry] = gira(W / 2, H / 2, mao.a);
    const alfa = -700 * (mao.a - A0) - 13 * mao.w - .5 * (rx * ays - ry * axs) / J - 8 * (rx * vy - ry * vx) / J;
    mao.w += alfa * h; mao.a += mao.w * h;
    const d = mao.a - A0; if(Math.abs(d) > 1.1){ mao.a = A0 + Math.sign(d) * 1.1; mao.w *= -.3; }
    mao.s = Math.min(1, mao.s + h / .14); mao.pop = Math.max(0, mao.pop - h / .22);
    // o truque: vira a carta nos dedos e, quando ela está de costas, troca de face
    if(mao.fl > 0){
      mao.fl += h * 2 * Math.PI / .55;
      if(!mao.trocou && mao.fl > Math.PI){ baralho.push(mao.c); mao.c = baralho.shift(); mao.trocou = true; }
      if(mao.fl >= 2 * Math.PI) mao.fl = 0;
    }
  }
  function centroMao(){ const [rx, ry] = gira(W / 2, H / 2, mao.a); return [fx + rx, fy + ry]; }

  function atira(){
    const sp = Math.hypot(vx, vy), dx = sp > 250 ? vx / sp : dirx, dy = sp > 250 ? vy / sp : diry;
    const [x, y] = centroMao();
    // gira no sentido em que vai (para a direita, horário), uns 5,4 giros por segundo
    const c = {c: mao.c, x, y, vx: dx * ATIRA + vx * .6, vy: dy * ATIRA + vy * .6, a: mao.a, w: (dx >= 0 ? 1 : -1) * 34, vira: 1, fase: 'voa', t: 0, alfa: 1};
    soltas.push(c);
    // muitas fora da mão: a mais antiga solta da borda
    const fora = soltas.filter(s => s.fase === 'voa' || (s.fase === 'cravada' && s !== (goma && goma.c)));
    if(fora.length > 12) folha(fora[0]);
    // a próxima do baralho aparece entre os dedos, entrando girada
    mao.c = baralho.shift(); mao.a = A0 - .9; mao.w = 0; mao.s = 0; mao.fl = 0;
    return c;
  }

  // ---- a Bungee Gum
  function gruda(c){
    const [rx, ry] = canto(c.a), qx = c.x + rx, qy = c.y + ry, nos = new Float64Array(4 * (NG + 1));
    for(let i = 0; i <= NG; i++){ const u = i / NG; nos[4 * i] = nos[4 * i + 2] = fx + (qx - fx) * u; nos[4 * i + 1] = nos[4 * i + 3] = fy + (qy - fy) * u; }
    goma = {c, k: GOMA.k, L0: GOMA.L0, amort: GOMA.amort, cresce: 0, solta: false, d: Math.hypot(qx - fx, qy - fy), nos};
    if(c.fase === 'voa') c.fase = 'goma';
  }
  function contrai(){ Object.assign(goma, {solta: true, k: 150, L0: 0, amort: 14}); }
  function passoGoma(h){
    const g = goma, c = g.c;
    g.cresce = Math.min(1, g.cresce + h / .07);
    const [rx, ry] = canto(c.a), qx = c.x + rx, qy = c.y + ry, dx = fx - qx, dy = fy - qy, d = Math.hypot(dx, dy) || 1e-6;
    g.d = d;
    // só puxa (goma não empurra); o amortecimento é o do próprio estica-e-encolhe
    const vqx = c.vx - c.w * ry, vqy = c.vy + c.w * rx, chega = (vqx * dx + vqy * dy) / d;
    const F = Math.max(0, g.k * (d - g.L0) - g.amort * chega) * g.cresce, Fx = dx / d * F, Fy = dy / d * F;
    if(c.fase === 'cravada'){
      // grudada na borda: arranca se a goma puxar forte (esticou demais, ou está contraindo)
      if(F > GOMA.arranca){ c.fase = 'goma'; c.vx = dx / d * 260; c.vy = dy / d * 260; c.w = (Math.random() - .5) * 20; }
    } else {
      // a força entra pelo canto: puxa a carta e gira, e ela fica pendurada pela quina
      c.vx += Fx * h; c.vy += (Fy + G * .8) * h;
      c.w += (rx * Fy - ry * Fx) / Ic * h;
      const ar = Math.exp(-h * (g.solta ? 3 : 1.1)); c.vx *= ar; c.vy *= ar; c.w *= Math.exp(-h * 2.5);
    }
    if(g.solta && d < 16) volta();
    else fio(h, qx, qy, d);
  }
  // o fio de goma: nós leves entre o dedo e o canto da carta, um pouco mais curtos que a reta (fica esticado, mas
  // ondula e cede um pouco com o peso quando a carta mexe)
  function fio(h, qx, qy, d){
    const n = goma.nos, am = Math.exp(-h * 6), g = G * .15 * h * h, rest = d * .96 / NG;
    for(let i = 1; i < NG; i++){
      const b = 4 * i, x = n[b], y = n[b + 1];
      n[b] += (x - n[b + 2]) * am; n[b + 1] += (y - n[b + 3]) * am + g; n[b + 2] = x; n[b + 3] = y;
    }
    n[0] = fx; n[1] = fy; n[4 * NG] = qx; n[4 * NG + 1] = qy;
    for(let k = 0; k < 4; k++) for(let i = 0; i < NG; i++){
      const a = 4 * i, b = 4 * (i + 1), ex = n[b] - n[a], ey = n[b + 1] - n[a + 1], e = Math.hypot(ex, ey) || 1e-6;
      const c = (e - rest) / e * .5 * .8, wa = i === 0 ? 0 : 1, wb = i + 1 === NG ? 0 : 1, ws = wa + wb;
      if(!ws) continue;
      n[a] += ex * c * wa * 2 / ws; n[a + 1] += ey * c * wa * 2 / ws; n[b] -= ex * c * wb * 2 / ws; n[b + 1] -= ey * c * wb * 2 / ws;
    }
  }
  // a goma contraiu até os dedos: a carta volta para o topo do baralho e para a mão, com o tranco
  function volta(){
    const c = goma.c; goma = null;
    soltas.splice(soltas.indexOf(c), 1);
    baralho.unshift(mao.c);
    let d = (c.a - A0) % (2 * Math.PI); if(d > Math.PI) d -= 2 * Math.PI; if(d < -Math.PI) d += 2 * Math.PI;
    Object.assign(mao, {c: c.c, a: A0 + Math.max(-1, Math.min(1, d)), w: Math.max(-12, Math.min(12, c.w)) * .4, s: 1, pop: 1, fl: 0});
  }

  // ---- fora da mão
  function quinas(c){ return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => { const [x, y] = gira(u * W / 2, v * H / 2, c.a); return [c.x + x, c.y + y]; }); }
  // bate na borda: rápido, a quina crava 5 px e a carta treme; devagar, bate e perde a força
  function bate(c){
    let pen = 0, nx = 0, ny = 0, q = null;
    for(const p of quinas(c)) for(const [e, ax, ay] of [[-p[0], 1, 0], [p[0] - larg, -1, 0], [-p[1], 0, 1], [p[1] - alt, 0, -1]]) if(e > pen){ pen = e; nx = ax; ny = ay; q = p; }
    if(!q) return;
    const rx = q[0] - c.x, ry = q[1] - c.y, vn = -((c.vx - c.w * ry) * nx + (c.vy + c.w * rx) * ny);
    if(vn > CRAVA){
      const k = pen - 5; c.x += nx * k; c.y += ny * k;
      Object.assign(c, {fase: 'cravada', t: 0, px: q[0] + nx * k, py: q[1] + ny * k, a0: c.a, nx, ny, vx: 0, vy: 0, w: 0,
        amp: Math.min(.32, vn / 5000) * (Math.random() < .5 ? -1 : 1)});
      c.ox = c.x - c.px; c.oy = c.y - c.py;
    } else {
      c.x += nx * pen; c.y += ny * pen;
      const vnc = c.vx * nx + c.vy * ny; if(vnc < 0){ c.vx -= 1.3 * vnc * nx; c.vy -= 1.3 * vnc * ny; }
      c.vx *= .7; c.vy *= .7; c.w *= -.5;
    }
  }
  // cai planando como folha: desce devagar, balança de um lado para o outro, vira (aparece o verso) e some
  function folha(c){
    if(c.fase === 'cravada' && c.nx !== undefined){ c.vx = c.nx * 70; c.vy = c.ny * 70; c.a = posCravada(c)[2]; }
    Object.assign(c, {fase: 'folha', t: 0, ph: Math.random() * 2 * Math.PI, fl: 0, base: c.a});
  }
  // a pose da cravada: treme em volta da quina enterrada (17 Hz, apagando em ~0,2 s)
  function posCravada(c){
    const d = c.amp * Math.exp(-c.t / .22) * Math.sin(2 * Math.PI * 17 * c.t), [x, y] = gira(c.ox, c.oy, d);
    return [c.px + x, c.py + y, c.a0 + d];
  }
  function passoCarta(c, h){
    c.t += h;
    if(c.fase === 'voa' || c.fase === 'goma'){
      if(c.fase === 'voa'){
        const sp = Math.hypot(c.vx, c.vy), arr = .25 + .00025 * sp;
        c.vx -= c.vx * arr * h; c.vy -= c.vy * arr * h;
        // a sustentação: rápida e girando, a carta plana; devagar, a gravidade ganha
        const sust = Math.min(1, sp / 1100) * Math.min(1, Math.abs(c.w) / 15);
        c.vy += G * .6 * (1 - sust) * h; c.w *= Math.exp(-.4 * h);
        if(sp < 260 && c.t > .15){ folha(c); return; }
      }
      c.x += c.vx * h; c.y += c.vy * h; c.a += c.w * h;
      bate(c);
    } else if(c.fase === 'cravada'){
      if(!(goma && goma.c === c) && c.t > CRAVADA) folha(c);
    } else {
      c.vy += (G * .35 - c.vy * 9) * h;
      c.ph += 5.5 * h; c.vx += (150 * Math.cos(c.ph) - c.vx) * 3 * h;
      c.w += ((c.base + .55 * Math.sin(c.ph) - c.a) * 40 - c.w * 8) * h; c.a += c.w * h;
      c.fl += 4 * h; c.vira = Math.cos(c.fl);
      c.x += c.vx * h; c.y += c.vy * h;
      if(c.t > .9) c.alfa = Math.max(0, 1 - (c.t - .9) / 1.1);
      if(!c.alfa || c.y - H > alt){ soltas.splice(soltas.indexOf(c), 1); baralho.push(c.c); }
    }
  }

  function passo(h, nx, ny){
    passoMao(h, nx, ny);
    if(preso && aguarda && !goma){
      tPreso += h;
      // segurou além de um clique: a goma gruda na carta que acabou de sair
      if(tPreso > .12){ if(soltas.includes(aguarda) && aguarda.fase !== 'folha') gruda(aguarda); aguarda = null; }
    }
    for(let i = soltas.length - 1; i >= 0; i--) passoCarta(soltas[i], h);
    if(goma) passoGoma(h);
  }

  function pintaSolta(c){
    let x = c.x, y = c.y, a = c.a;
    if(c.fase === 'cravada') [x, y, a] = posCravada(c);
    const sp = Math.hypot(c.vx, c.vy);
    if(c.fase === 'voa' && sp > 500 && !calmo) for(const [d, al] of [[.021, .07], [.014, .13], [.007, .22]]){
      ctx.globalAlpha = al * c.alfa; desenha(ctx, c.c, x - c.vx * d, y - c.vy * d, H, a - c.w * d, c.vira);
    }
    ctx.globalAlpha = c.alfa; desenha(ctx, c.c, x, y, H, a, c.vira); ctx.globalAlpha = 1;
  }
  // a goma: grossa nas pontas (onde gruda) e fina no meio, mais fina quanto mais estica, com um brilho de chiclete
  function pintaGoma(){
    // a curva passa lisa pelos nós (Catmull-Rom, 4 pontos por trecho)
    const n = goma.nos, ate = Math.max(1, Math.round(NG * goma.cresce)), pts = [], no = i => { i = Math.max(0, Math.min(ate, i)); return [n[4 * i], n[4 * i + 1]]; };
    for(let i = 0; i < ate; i++){
      const [p0, p1, p2, p3] = [no(i - 1), no(i), no(i + 1), no(i + 2)];
      for(let k = 0; k < 4; k++){
        const t = k / 4, t2 = t * t, t3 = t2 * t;
        pts.push([0, 1].map(j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    pts.push(no(ate));
    const pe = 4.2, meio = Math.max(1, Math.min(pe, pe * Math.sqrt(70 / Math.max(1, goma.d))));
    const esq = [], dir = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], t = Math.hypot(tx, ty) || 1;
      const u = i / (pts.length - 1 || 1) * goma.cresce, l = (meio + (pe - meio) * Math.pow(1 - Math.sin(Math.PI * u), 2)) / 2;
      esq.push([p[0] - ty / t * l, p[1] + tx / t * l]); dir.push([p[0] + ty / t * l, p[1] - tx / t * l]);
    });
    ctx.beginPath(); esq.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); dir.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
    ctx.fillStyle = ROSA; ctx.fill(); ctx.strokeStyle = VINHO; ctx.lineWidth = .8; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y - .4) : ctx.moveTo(x, y - .4));
    ctx.strokeStyle = 'rgba(255,214,228,.75)'; ctx.lineWidth = Math.max(.6, meio * .3); ctx.lineCap = 'round'; ctx.stroke();
    for(const i of [0, ate]){ ctx.beginPath(); ctx.arc(n[4 * i], n[4 * i + 1], pe * .62, 0, 2 * Math.PI); ctx.fillStyle = ROSA; ctx.fill(); ctx.strokeStyle = VINHO; ctx.stroke(); }
  }
  function pinta(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    for(const c of soltas) if(!goma || goma.c !== c) pintaSolta(c);
    if(goma){ pintaGoma(); pintaSolta(goma.c); }
    if(dentro){
      // a carta da mão: o canto preso fica na ponta do clique; aparece crescendo a partir dele
      const s = 1 - Math.pow(1 - mao.s, 3), e = s * (1 + .14 * mao.pop * mao.pop), [rx, ry] = gira(W / 2 * e, H / 2 * e, mao.a);
      if(e > .02) desenha(ctx, mao.c, fx + rx, fy + ry, H * e, mao.a, Math.cos(mao.fl));
      if(goma){ ctx.beginPath(); ctx.arc(fx, fy, 2.2, 0, 2 * Math.PI); ctx.fillStyle = ROSA; ctx.fill(); ctx.strokeStyle = VINHO; ctx.lineWidth = .8; ctx.stroke(); }
    }
  }

  function quadro(agora){
    pedido = 0;
    const dt = Math.min(.05, antes ? (agora - antes) / 1000 : 1 / 60); antes = agora;
    sobra += dt; let n = Math.floor(sobra / PASSO); sobra -= n * PASSO;
    if(n > 12){ n = 12; sobra = 0; }
    const bx = fx, by = fy;
    for(let i = 1; i <= n; i++) passo(PASSO, i < n ? bx + (mx - bx) * i / n : mx, i < n ? by + (my - by) * i / n : my);
    pinta();
    // nada voando, a carta assentada e o mouse parado: o laço para; parado uns segundos, ele faz o truque
    const quieto = !soltas.length && !goma && Math.abs(mao.w) < .01 && Math.abs(mao.a - A0) < .002 && mao.s === 1 && !mao.pop && !mao.fl
      && Math.abs(mx - bx) + Math.abs(my - by) < .01 && Math.hypot(vx, vy) < 1;
    parado = quieto ? parado + 1 : 0;
    if(parado < 20) pedido = requestAnimationFrame(quadro);
    else { antes = 0; clearTimeout(ocioso); if(dentro && !calmo && !fezTruque) ocioso = setTimeout(() => { fezTruque = true; mao.fl = 1e-6; mao.trocou = false; acorda(); }, 4500); }
  }
  function acorda(){ parado = 0; if(!pedido) pedido = requestAnimationFrame(quadro); }

  const pos = e => { if(tela) return [e.clientX, e.clientY]; const r = alvo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function move(e){
    if(e.pointerType === 'touch' && !cfg.toque) return;
    [mx, my] = pos(e); clearTimeout(ocioso); fezTruque = false;
    if(!dentro){ dentro = true; fx = mx; fy = my; vx = vy = axs = ays = 0; mao.s = 0; mao.a = A0 - .9; mao.w = 0; }
    acorda();
  }
  // segurar não pode marcar texto: apertando, a página não começa seleção (user-select e selectstart); e num campo de texto o
  // clique é do campo, o cursor não segura nem atira ali
  const campo = e => !!(e.target.closest && e.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])'));
  const semSel = e => e.preventDefault();
  const trava = on => {
    document.documentElement.style.userSelect = on ? 'none' : '';
    document.removeEventListener('selectstart', semSel); if(on) document.addEventListener('selectstart', semSel);
  };
  function aperta(e){
    if((e.pointerType === 'touch' && !cfg.toque) || e.button !== 0 || campo(e)) return;
    move(e); preso = true; tPreso = 0; aguarda = atira(); trava(true);
    if(!tela) try { alvo.setPointerCapture(e.pointerId); } catch {}
    acorda();
  }
  function solta(){ if(!preso) return; preso = false; trava(false); aguarda = null; if(goma && !goma.solta) contrai(); acorda(); }
  function sai(){ if(preso) return; dentro = false; clearTimeout(ocioso); acorda(); }
  const ev = tela ? document.documentElement : alvo;
  const ouvintes = [['pointermove', move], ['pointerdown', aperta], ['pointerup', solta], ['pointercancel', solta], ['pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(alvo); else addEventListener('resize', mede);
  medidas(); mede();

  return {
    ajusta(o){ Object.assign(cfg, o); medidas(); acorda(); },
    estado: () => ({mao: nome(mao.c), angulo: mao.a, soltas: soltas.map(c => ({c: nome(c.c), fase: c.fase, x: c.x, y: c.y, vx: c.vx, vy: c.vy, a: c.a})),
      goma: goma && {d: goma.d, solta: goma.solta, fase: goma.c.fase}, baralho: baralho.length, preso}),
    legenda(){
      const voa = soltas.filter(c => c.fase === 'voa').length, crav = soltas.filter(c => c.fase === 'cravada' && (!goma || goma.c !== c)).length;
      return `na mão: ${nome(mao.c)}` + (voa ? ` · voando ${voa}` : '') + (crav ? ` · cravadas ${crav}` : '')
        + (goma ? ` · Bungee Gum ${Math.round(goma.d)} px${goma.c.fase === 'cravada' ? ' (grudada na borda)' : ''}${goma.solta ? ' (contraindo)' : ''}` : '')
        + ` · baralho ${baralho.length}`;
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede);
      trava(false); cancelAnimationFrame(pedido); clearTimeout(ocioso); cv.remove();
    },
  };
}

// prévias paradas para a bancada (com as classes dela)
function previas(el, cfg){
  const tela = (w, h, fn, claro) => { const c = document.createElement('canvas'), d = devicePixelRatio || 1;
    c.className = 'prev'; c.width = Math.ceil(w * d); c.height = Math.ceil(h * d); c.style.width = w + 'px'; c.style.height = h + 'px';
    const x = c.getContext('2d'); x.scale(d, d); fn(x); return c; };
  const card = (c, H, vira = 1) => tela(H * .7 + 4, H + 4, x => desenha(x, c, H * .35 + 2, H / 2 + 2, H, 0, vira));
  // a carta na mão do cursor: o canto de cima à esquerda é a ponta; a seta marca o ponto do clique
  const cursor = (c, H) => tela(H * .95 + 8, H * 1.15 + 8, x => {
    const W = H * .7, a = A0, y0 = 4 - W * Math.sin(a), cx = 4 + (W / 2) * Math.cos(a) - (H / 2) * Math.sin(a), cy = y0 + (W / 2) * Math.sin(a) + (H / 2) * Math.cos(a);
    desenha(x, c, cx, cy, H, a);
  });
  el.innerHTML = '<section><h2>a mão do Hisoka (o baralho tem as 52 e o Coringa dele)</h2><div class="linha"></div></section>'
    + '<section><h2>o cursor (a ponta é o canto de cima à esquerda), de 56 a 26 px de altura, no escuro e no claro</h2><div class="linha"></div><div class="linha claro" style="margin-top:12px"></div></section>';
  const [mao, esc, cla] = el.querySelectorAll('.linha');
  // um leque de cinco cartas, como ele segura
  const leque = [{n: 'A', s: 'e'}, {n: 'K', s: 'c'}, {n: 'Q', s: 'o'}, {n: 'J', s: 'p'}, {n: '★', s: ''}];
  mao.append(tela(380, 200, x => leque.forEach((c, i) => {
    const a = (i - 2) * .24; x.save(); x.translate(190, 225); x.rotate(a); desenha(x, c, 0, -112, 120, 0); x.restore();
  })), ...[{n: '7', s: 'c'}, {n: '10', s: 'o'}, {n: '3', s: 'p'}].map(c => card(c, 120)), card({n: 'A', s: 'e'}, 120, -1));
  for(const l of [esc, cla]) l.append(...[56, 44, cfg.altura, 26].map(h => cursor({n: 'A', s: 'o'}, h)), cursor({n: '★', s: ''}, cfg.altura), cursor({n: 'K', s: 'e'}, cfg.altura));
}

(window.CURSORES = window.CURSORES || {}).carta = {liga, desenha, previas,
  titulo: 'mexa o mouse na tela preta · clique · segure · solte',
  dica: 'clique: atira a carta (ela crava na borda se for rápida) · segurando: a Bungee Gum gruda e a carta fica no elástico · soltando: a goma contrai e a carta volta<br>com a goma, bata a carta numa borda (ela gruda) e estique; parado uns segundos, ele vira a carta e ela troca',
  controles: [{k: 'altura', rot: 'altura da carta', min: 24, max: 56, un: 'px', padrao: 34}]};
})();
