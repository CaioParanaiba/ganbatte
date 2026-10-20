// Hover Bungee Gum do Hisoka (hv-bungee), feito em código, sem imagem: o que acontece quando o mouse passa pelos cards.
// A Bungee Gum tem as propriedades da borracha e do chiclete, e quem a ganha é o card, não o cursor (nada se desenha no
// cursor). Ao entrar, a goma cobre o contorno do card a partir do ponto tocado: corre pela borda nos dois sentidos, com a
// frente embolada, até fechar a volta; grossa, irregular (calombos de chiclete) e com brilho. Dentro do card, a borda mais
// perto do cursor incha, como se quisesse alcançá-lo. Ao sair, a própria borda é puxada: uma membrana larga nasce no
// contorno, afina até o cursor, cede com o peso e atrasa quando ele mexe, e abre buracos quando estica muito, até virar
// teia de fios. O card vai junto, puxado e inclinado pelo ponto de onde a goma sai. Passando do limite, a membrana rasga:
// a parte presa ao card volta como elástico (passa do ponto e volta), a ponta solta some, uma onda corre a borda inteira e
// o card balança como mola até parar; depois a goma se recolhe. Voltar para dentro do card antes de rasgar recolhe a
// membrana sem rasgo; parado fora do card, ela rasga sozinha.
// Física de verdade a 240 Hz: mola com pouco amortecimento nos cards e massa pelo tamanho (card pequeno pula, painel
// grande mal mexe); o meio da membrana é um ponto com massa e mola, por isso ela atrasa e balança. O card só se move pelas
// propriedades translate e rotate do estilo, que somam com o transform que o jogo já usa.
//   const h = CURSORES.bungee.cola(raiz, {seletor: '.card', rompe: 160, lento: 1})   h.ajusta({rompe: 200})   h.desliga()
//   (raiz = document.documentElement no jogo, com o desenho numa camada fixa da tela inteira; ou um elemento, como a tela
//   preta da bancada, com a camada dentro dele; rompe = até quantos px a membrana estica antes de rasgar; lento = câmera
//   lenta; um elemento com data-sem-goma, e o que estiver dentro dele, fica de fora)
//   CURSORES.bungee.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, um pedaço do jogo de mentira
//   titulo, dica e controles: o que a bancada mostra
(() => {
const ROSA = '#FF5C8A', ROSA_ESC = '#E8457A', VINHO = '#8E2457', BRILHO = 'rgba(255,220,232,.8)';
const DT = 1 / 240, PASSO = 4;     // passo da física (s) e o espaçamento dos pontos do contorno (px)
const OMEGA = 2 * Math.PI * 2.6;   // a mola do card: uns 2,6 balanços por segundo
const ZETA = .14;                  // pouco amortecimento: solto, o card balança algumas vezes antes de parar
const KG = 55, L0 = 10;            // a membrana: força por px esticado e o quanto estica sem puxar
const MASSA = 26000;               // px² de card por unidade de massa
const GIRO = .45;                  // quanto do torque vira giro (o card é preso no layout; girar muito parece quebrado)
const GROSSO = 4.4;                // grossura média da goma no contorno (px)
const COBRE = .34;                 // segundos para a goma dar a volta no card
const PARADO = 2.5;                // segundos com o cursor parado fora do card até a membrana rasgar sozinha
const TAU = Math.PI * 2;
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = (a, b, x) => { const t = lim((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// o contorno do card (retângulo de cantos redondos, centrado em 0,0), em pontos a cada ~4 px, com a normal para fora
function contorno(hw, hh, r){
  r = Math.min(r, hw, hh);
  const P = [], peca = (n, f) => { for(let i = 0; i < n; i++) P.push(f(i / n)); };
  const reta = (x0, y0, x1, y1, nx, ny) => peca(Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / PASSO)), u => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, nx, ny]);
  const arco = (cx, cy, a0) => peca(Math.max(1, Math.ceil(r * Math.PI / 2 / PASSO)), u => { const a = a0 + u * Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)]; });
  reta(-hw + r, -hh, hw - r, -hh, 0, -1); arco(hw - r, -hh + r, -Math.PI / 2);
  reta(hw, -hh + r, hw, hh - r, 1, 0); arco(hw - r, hh - r, 0);
  reta(hw - r, hh, -hw + r, hh, 0, 1); arco(-hw + r, hh - r, Math.PI / 2);
  reta(-hw, hh - r, -hw, -hh + r, -1, 0); arco(-hw + r, -hh + r, Math.PI);
  let L = 0;
  P.forEach((p, i) => { L += Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1]); });
  return {P, n: P.length, L, ds: L / P.length};
}

function cola(raiz, cfg){
  cfg = Object.assign({seletor: '.card', rompe: 160, lento: 1}, cfg);
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
  // a camada fica no canto da raiz: o que é do cursor (clientX/Y) vai para ela descontando onde ela está
  const origem = () => { if(tela) return [0, 0]; const b = raiz.getBoundingClientRect(); return [b.left + raiz.clientLeft, b.top + raiz.clientTop]; };

  // ---- os cards: cada um que mexeu tem um corpo (deslocamento, giro e as velocidades); parado, o corpo some
  const corpos = new Map();
  function corpo(el){
    let c = corpos.get(el);
    if(!c){ c = {el, x: 0, y: 0, a: 0, vx: 0, vy: 0, w: 0, r: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0}; corpos.set(el, c); medeCorpo(c); }
    return c;
  }
  // o centro sem o nosso deslocamento (o giro é em volta do centro, então não o muda), o tamanho, a massa e o contorno
  function medeCorpo(c){
    const r = c.el.getBoundingClientRect(), hw = c.el.offsetWidth / 2, hh = c.el.offsetHeight / 2;
    c.cx = r.left + r.width / 2 - c.x; c.cy = r.top + r.height / 2 - c.y;
    if(hw !== c.hw || hh !== c.hh){
      c.hw = hw; c.hh = hh; c.k = contorno(hw, hh, c.r);
      c.m = lim(4 * hw * hh / MASSA, .8, 60); c.I = c.m * (hw * hw + hh * hh) / 3;
      c.amax = 8 / Math.max(20, Math.hypot(hw, hh));   // a quina mais longe anda no máximo 8 px pelo giro
    }
  }
  const mundo = (c, lx, ly) => { const s = Math.sin(c.a), k = Math.cos(c.a); return [c.cx + c.x + lx * k - ly * s, c.cy + c.y + lx * s + ly * k]; };
  const local = (c, X, Y) => { const s = Math.sin(c.a), k = Math.cos(c.a), dx = X - c.cx - c.x, dy = Y - c.cy - c.y; return [dx * k + dy * s, -dx * s + dy * k]; };
  // um ponto do contorno no mundo: [x, y, nx, ny] (o índice dá a volta)
  const borda = (c, i) => { const n = c.k.n, p = c.k.P[((Math.round(i) % n) + n) % n], s = Math.sin(c.a), k = Math.cos(c.a);
    const [x, y] = mundo(c, p[0], p[1]); return [x, y, p[2] * k - p[3] * s, p[2] * s + p[3] * k]; };
  function maisPerto(c, X, Y){
    const [lx, ly] = local(c, X, Y); let mi = 0, md = Infinity;
    c.k.P.forEach((p, i) => { const d = (p[0] - lx) ** 2 + (p[1] - ly) ** 2; if(d < md){ md = d; mi = i; } });
    return [mi, Math.sqrt(md)];
  }
  function empurra(c, X, Y, Fx, Fy, h){
    c.vx += Fx / c.m * h; c.vy += Fy / c.m * h;
    const rx = X - c.cx - c.x, ry = Y - c.cy - c.y;
    c.w += (rx * Fy - ry * Fx) * GIRO / c.I * h;
  }

  // ---- o cursor
  let mx = -1e4, my = -1e4, mvx = 0, mvy = 0, tMove = 0, sobre = null;
  // ---- a goma: a capa de cada card (no contorno), a membrana puxada (uma só) e as que rasgaram e estão voltando
  const capas = new Map();
  let memb = null, soltas = 0;
  const rasgos = [];

  function capa(el){
    const c = corpo(el); medeCorpo(c);
    let v = capas.get(el);
    if(!v){
      const [i0] = maisPerto(c, mx, my);
      v = {c, i0, cobre: 0, qtd: 1, fase: 'cobre', t: 0, ondas: [], f: [0, 0, 0].map(() => Math.random() * TAU), bojo: null, gotas: penduradas(c)};
      capas.set(el, v);
      // o tranco de grudar: o card leva um pouco da velocidade do cursor, e a goma espirra a partir do ponto tocado
      const sp = Math.hypot(mvx, mvy), q = Math.min(1500, sp) / (sp || 1);
      const [ax, ay] = borda(c, i0); empurra(c, ax, ay, mvx * q * .8, mvy * q * .8, 1 / 60);
    } else if(v.fase === 'sai') v.fase = 'cobre';
    return v;
  }
  // as gotas penduradas na borda de baixo (2 ou 3, longe dos cantos): pêndulos de goma que esticam e balançam com o card
  function penduradas(c){
    const baixo = [];
    c.k.P.forEach((p, i) => { if(p[3] > .99 && Math.abs(p[0]) < c.hw - c.r - 10) baixo.push(i); });
    if(baixo.length < 6) return [];
    const n = c.hw > 90 ? 3 : 2, fr = Array.from({length: n}, (_, j) => (j + .25 + Math.random() * .5) / n);
    return fr.map(f => { const L = 9 + Math.random() * 7; return {i: baixo[Math.floor(f * (baixo.length - 1))], L0: L, L, vL: 0, th: 0, w: 0, r: 2.8 + Math.random() * 1.2}; });
  }
  // o cursor saiu do card: a borda é puxada a partir do ponto mais perto dele
  function puxa(v){
    const [ia] = maisPerto(v.c, mx, my), [ax, ay] = borda(v.c, ia);
    memb = {v, ia, t: 0, d: Math.hypot(mx - ax, my - ay), Mx: (ax + mx) / 2, My: (ay + my) / 2, Mvx: 0, Mvy: 0};
  }
  // passou do limite (ou entrou noutro card, ou ficou parado): a membrana rasga
  function rasga(){
    if(!memb) return;
    const m = memb; memb = null; soltas++;
    rasgos.push({v: m.v, ia: m.ia, t: 0, Tx: mx, Ty: my, Mx: m.Mx, My: m.My, d: m.d});
    onda(m.v, m.ia, 1.5);
  }
  // voltou para dentro antes de rasgar: a membrana se recolhe sem rasgo
  function recolhe(){ if(!memb) return; onda(memb.v, memb.ia, .8); memb = null; }
  const onda = (v, i, a) => { v.ondas.push({s: i * v.c.k.ds, t: 0, a}); if(v.ondas.length > 6) v.ondas.shift(); };

  function passo(h){
    // a capa: corre pelo contorno até fechar; sem cursor nem membrana, se recolhe (fica mais fina até sumir)
    for(const [el, v] of capas){
      v.t += h; v.cobre = Math.min(1, v.cobre + h / COBRE);
      const presa = sobre === el || (memb && memb.v === v) || rasgos.some(r => r.v === v);
      if(!presa && v.fase === 'cobre' && v.cobre >= 1) v.fase = 'espera', v.te = 0;
      if(v.fase === 'espera' && !presa && (v.te += h) > .35) v.fase = 'sai';
      if(presa && v.fase !== 'cobre') v.fase = 'cobre';
      v.qtd = v.fase === 'sai' ? v.qtd - h / .45 : Math.min(1, v.qtd + h / .2);
      for(let k = v.ondas.length - 1; k >= 0; k--) if((v.ondas[k].t += h) > 1.4) v.ondas.splice(k, 1);
      // o bojo: a borda mais perto do cursor incha (só com o cursor dentro)
      if(sobre === el){ const [i, d] = maisPerto(v.c, mx, my), a = 1 - suave(6, 46, d); v.bojo = {s: i * v.c.k.ds, a: v.bojo ? v.bojo.a + (a - v.bojo.a) * Math.min(1, h * 14) : a}; }
      else if(v.bojo){ v.bojo.a *= Math.exp(-h * 8); if(v.bojo.a < .01) v.bojo = null; }
      if(v.qtd <= 0) capas.delete(el);
    }
    // a membrana: o meio tem massa e mola (atrasa e cede com o peso); puxa o card pelo ponto de onde sai
    if(memb){
      const m = memb, c = m.v.c, [ax, ay] = borda(c, m.ia), dx = mx - ax, dy = my - ay, d = Math.hypot(dx, dy) || 1e-6;
      m.t += h; m.d = d;
      const w = 2 * Math.PI * 3.2, alvoX = (ax + mx) / 2, alvoY = (ay + my) / 2 + d * .07;
      m.Mvx += (w * w * (alvoX - m.Mx) - 2 * .3 * w * m.Mvx) * h; m.Mvy += (w * w * (alvoY - m.My) - 2 * .3 * w * m.Mvy) * h;
      m.Mx += m.Mvx * h; m.My += m.Mvy * h;
      const F = Math.max(0, KG * (d - L0));
      empurra(c, ax, ay, dx / d * F, dy / d * F, h);
      if(d > cfg.rompe || performance.now() - tMove > PARADO * 1000) rasga();
    }
    for(let k = rasgos.length - 1; k >= 0; k--) if((rasgos[k].t += h) > .45) rasgos.splice(k, 1);
    // as gotas: o card acelerando para um lado empurra a gota para o outro (pêndulo); a gravidade e o tranco esticam
    for(const v of capas.values()){
      const c = v.c, ax = c.pvx === undefined ? 0 : (c.vx - c.pvx) / h, ay = c.pvy === undefined ? 0 : (c.vy - c.pvy) / h;
      for(const g of v.gotas){
        // no referencial do card: gravidade menos a aceleração dele (th > 0 = gota para a esquerda)
        const ge = 1400 - ay, sn = Math.sin(g.th), cs = Math.cos(g.th);
        g.w += (-(ge * sn - ax * cs) / g.L - 3 * g.w) * h; g.th = lim(g.th + g.w * h, -1.2, 1.2);
        g.vL += (300 * (g.L0 - g.L) + (ge * cs + ax * sn - 1400) * .012 - 9 * g.vL) * h; g.L = lim(g.L + g.vL * h, 4, 34);
      }
    }
    // os cards: mola de volta ao lugar, com pouco amortecimento
    for(const c of corpos.values()){
      c.pvx = c.vx; c.pvy = c.vy;
      c.vx += (-OMEGA * OMEGA * c.x - 2 * ZETA * OMEGA * c.vx) * h; c.vy += (-OMEGA * OMEGA * c.y - 2 * ZETA * OMEGA * c.vy) * h;
      c.w += (-OMEGA * OMEGA * c.a - 2 * ZETA * OMEGA * c.w) * h;
      c.x += c.vx * h; c.y += c.vy * h; c.a += c.w * h;
      // por segurança: um card nunca sai mais que uns px do lugar (o painel do lado não pode ser tampado)
      const D = 20 / Math.sqrt(c.m), dd = Math.hypot(c.x, c.y);
      if(dd > D){ c.x *= D / dd; c.y *= D / dd; const vr = (c.vx * c.x + c.vy * c.y) / D; if(vr > 0){ c.vx -= vr * c.x / D; c.vy -= vr * c.y / D; } }
      if(Math.abs(c.a) > c.amax){ c.a = Math.sign(c.a) * c.amax; if(c.w * c.a > 0) c.w = 0; }
    }
  }

  // ---- desenho
  // grossura da capa no ponto i: calombos fixos do card, a frente embolada enquanto corre, as ondas e o bojo
  function grossura(v, i, meia, cheia){
    const k = v.c.k, s = i * k.ds, di = Math.abs(((s - v.i0 * k.ds) % k.L + k.L) % k.L), dist = Math.min(di, k.L - di);
    let g = GROSSO * (1 + .3 * Math.sin(s * .09 + v.f[0]) + .2 * Math.sin(s * .031 + v.f[1]) + .14 * Math.sin(s * .21 + v.f[2]));
    if(!cheia){ const falta = meia - dist; g = g * suave(0, 10, falta) + 3.2 * Math.exp(-((falta - 7) ** 2) / 24); }
    for(const o of v.ondas){
      const dd = Math.abs(((s - o.s) % k.L + k.L) % k.L), od = Math.min(dd, k.L - dd), frente = 420 * o.t;
      g += o.a * 3.4 * Math.exp(-o.t * 2.6) * Math.exp(-((od - frente) ** 2) / 260);
    }
    if(v.bojo){ const dd = Math.abs(((s - v.bojo.s) % k.L + k.L) % k.L), od = Math.min(dd, k.L - dd); g += v.bojo.a * 4.5 * Math.exp(-od * od / 900); }
    return g * suave(0, 1, v.qtd);
  }
  // uma gota pendurada: base larga presa na borda, pescoço e a bolinha na ponta, com brilho
  function pintaGotas(v, ox, oy, meia, cheia){
    const k = v.c.k;
    for(const g of v.gotas){
      const s = g.i * k.ds, di = Math.abs(((s - v.i0 * k.ds) % k.L + k.L) % k.L), q = (cheia ? 1 : suave(0, 14, meia - Math.min(di, k.L - di))) * suave(0, 1, v.qtd);
      if(q < .05) continue;
      const [x, y, nx, ny] = borda(v.c, g.i), tx = -ny, ty = nx, ang = Math.atan2(ny, nx) - Math.PI / 2 + g.th;
      const L = g.L * q, r = g.r * (.5 + .5 * q), px = x + Math.cos(ang + Math.PI / 2) * L - ox, py = y + Math.sin(ang + Math.PI / 2) * L - oy, b = 6 * q;
      ctx.beginPath();
      ctx.moveTo(x - ox + tx * b, y - oy + ty * b);
      ctx.quadraticCurveTo(x - ox + tx * b * .2 + (px - x + ox) * .5, y - oy + ty * b * .2 + (py - y + oy) * .5, px + Math.cos(ang) * r, py + Math.sin(ang) * r);
      ctx.arc(px, py, r, ang, ang + Math.PI);
      ctx.quadraticCurveTo(x - ox - tx * b * .2 + (px - x + ox) * .5, y - oy - ty * b * .2 + (py - y + oy) * .5, x - ox - tx * b, y - oy - ty * b);
      ctx.closePath(); ctx.fillStyle = ROSA; ctx.fill(); ctx.strokeStyle = VINHO; ctx.lineWidth = .9; ctx.stroke();
      ctx.beginPath(); ctx.arc(px - r * .3, py - r * .3, r * .32, 0, TAU); ctx.fillStyle = BRILHO; ctx.fill();
    }
  }
  function pintaCapa(v, ox, oy){
    const k = v.c.k, cheia = v.cobre >= 1, e = 1 - (1 - v.cobre) ** 2, meia = e * k.L / 2;
    const K = cheia ? Math.floor(k.n / 2) : Math.floor(meia / k.ds) + 2, ids = [];
    for(let j = -K; j <= (cheia ? k.n - K - 1 : K); j++) ids.push(v.i0 + j);
    pintaGotas(v, ox, oy, meia, cheia);
    const fora = [], dentro = [], meio = [];
    for(const i of ids){
      const g = grossura(v, i, meia, cheia), [x, y, nx, ny] = borda(v.c, i);
      fora.push([x - ox + nx * g * .55, y - oy + ny * g * .55]); dentro.push([x - ox - nx * g * .45, y - oy - ny * g * .45]);
      meio.push([x - ox + nx * g * .22, y - oy + ny * g * .22, g]);
    }
    ctx.beginPath();
    fora.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    if(cheia){ ctx.closePath(); dentro.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
    else { for(let i = dentro.length - 1; i >= 0; i--) ctx.lineTo(dentro[i][0], dentro[i][1]); ctx.closePath(); }
    ctx.fillStyle = ROSA; ctx.fill('evenodd');
    ctx.strokeStyle = VINHO; ctx.lineWidth = .9; ctx.lineJoin = 'round'; ctx.stroke();
    // o brilho de chiclete: um risco claro do lado de fora, só onde a goma é grossa
    ctx.strokeStyle = BRILHO; ctx.lineCap = 'round';
    for(let i = 1; i < meio.length; i++){
      const [x0, y0, g0] = meio[i - 1], [x1, y1, g1] = meio[i];
      if(g0 < 2.6 || g1 < 2.6) continue;
      ctx.lineWidth = Math.min(1.6, (g0 + g1) * .14); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
  }
  // a membrana: uma faixa ao longo de uma curva que sai do contorno na direção da normal e vai até a ponta; larga e
  // abaulada na base (no card), fina na ponta; esticada, abre buracos e vira teia
  function membrana(c, ia, Tx, Ty, Mx, My, base, ponta, buracos, ox, oy){
    const [ax, ay, nx, ny] = borda(c, ia), d = Math.hypot(Tx - ax, Ty - ay), hb = Math.min(d * .4, 36);
    const P = [[ax, ay], [ax + nx * hb, ay + ny * hb], [Mx, My], [Tx, Ty]];
    const B = u => { const a = 1 - u; return [0, 1].map(j => a * a * a * P[0][j] + 3 * a * a * u * P[1][j] + 3 * a * u * u * P[2][j] + u * u * u * P[3][j]); };
    const N = 28, cen = [], nor = [], lar = [];
    for(let i = 0; i <= N; i++){
      const u = i / N, p = B(u), q = B(Math.min(1, u + .01)), r = B(Math.max(0, u - .01)), tx = q[0] - r[0], ty = q[1] - r[1], t = Math.hypot(tx, ty) || 1;
      cen.push(p); nor.push([-ty / t, tx / t]); lar.push(ponta + (base - ponta) * (1 - u) ** 2.4);
    }
    const lado = s => cen.map((p, i) => [p[0] + nor[i][0] * lar[i] * s - ox, p[1] + nor[i][1] * lar[i] * s - oy]);
    const e = lado(1), di = lado(-1);
    ctx.save();
    ctx.beginPath(); e.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    for(let i = di.length - 1; i >= 0; i--) ctx.lineTo(di[i][0], di[i][1]); ctx.closePath();
    ctx.fillStyle = ROSA_ESC; ctx.fill(); ctx.strokeStyle = VINHO; ctx.lineWidth = .9; ctx.lineJoin = 'round'; ctx.stroke();
    // buracos: elipses no espaço da faixa (u ao longo, v de lado, -1 a 1), recortados e contornados
    for(const [u1, u2, vc, vm] of buracos){
      if(vm < .04) continue;
      const pts = [], M = 14;
      for(let s = 0; s <= 1; s += 1 / M){ const u = u1 + (u2 - u1) * s, i = Math.round(u * N), a = Math.sin(Math.PI * s) * vm; pts.push([i, vc + a]); }
      for(let s = 1; s >= 0; s -= 1 / M){ const u = u1 + (u2 - u1) * s, i = Math.round(u * N), a = Math.sin(Math.PI * s) * vm; pts.push([i, vc - a]); }
      ctx.beginPath(); pts.forEach(([i, v], j) => { const x = cen[i][0] + nor[i][0] * lar[i] * v - ox, y = cen[i][1] + nor[i][1] * lar[i] * v - oy; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
      ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = VINHO; ctx.lineWidth = .8; ctx.stroke();
    }
    // o brilho: um risco claro do lado de cima da faixa, da base até perto da ponta
    ctx.beginPath(); for(let i = 1; i < N - 4; i++){ const x = cen[i][0] + nor[i][0] * lar[i] * .5 - ox, y = cen[i][1] + nor[i][1] * lar[i] * .5 - oy; i > 1 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = BRILHO; ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }
  const furos = k => [[.14, .46, 0, .5 * suave(.3, .55, k)], [.42, .68, -.42, .36 * suave(.5, .75, k)], [.4, .64, .44, .3 * suave(.6, .85, k)], [.62, .8, .05, .32 * suave(.75, .95, k)]];
  function pinta(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    const [ox, oy] = origem();
    if(memb){
      const m = memb, c = m.v.c, k = m.d / cfg.rompe, base = Math.min(lim(34 - 20 * k, 14, 34), c.hw, c.hh + 6);
      membrana(c, m.ia, mx, my, m.Mx, m.My, base, 1.2 + 2.4 * (1 - k), furos(k), ox, oy);
    }
    for(const r of rasgos){
      // a parte presa ao card volta como elástico (passa do ponto e volta); a ponta solta encolhe até sumir
      const c = r.v.c, [ax, ay] = borda(c, r.ia), q = .62 * Math.exp(-r.t * 9) * Math.cos(r.t * 24);
      if(q > .02){
        const tx = ax + (r.Tx - ax) * q, ty = ay + (r.Ty - ay) * q;
        membrana(c, r.ia, tx, ty, ax + (r.Mx - ax) * q, ay + (r.My - ay) * q, Math.min(18, c.hw), 2.6, [], ox, oy);
      }
      if(r.t < .16){
        const cx = ax + (r.Tx - ax) * .62, cy = ay + (r.Ty - ay) * .62, f = Math.exp(-r.t * 26), sx = r.Tx + (cx - r.Tx) * f, sy = r.Ty + (cy - r.Ty) * f;
        ctx.beginPath(); ctx.moveTo(sx - ox, sy - oy); ctx.lineTo(r.Tx - ox, r.Ty - oy);
        ctx.strokeStyle = ROSA_ESC; ctx.lineWidth = 2.4 * (1 - r.t / .16); ctx.lineCap = 'round'; ctx.stroke();
      }
    }
    for(const v of capas.values()) pintaCapa(v, ox, oy);
  }
  // os cards: só translate e rotate (somam com o transform do jogo); parado, devolve o estilo e o corpo some
  function move(){
    for(const [el, c] of corpos){
      const preso = capas.has(el);
      if(!preso && Math.abs(c.x) < .03 && Math.abs(c.y) < .03 && Math.abs(c.a) < 2e-5 && Math.hypot(c.vx, c.vy) < .5 && Math.abs(c.w) < 1e-3){
        el.style.translate = ''; el.style.rotate = ''; corpos.delete(el); continue;
      }
      el.style.translate = `${c.x.toFixed(2)}px ${c.y.toFixed(2)}px`; el.style.rotate = `${c.a.toFixed(5)}rad`;
    }
  }

  // ---- o laço: só roda enquanto há goma ou card mexendo
  let pedido = 0, antes = 0, sobra = 0;
  function quadro(t){
    pedido = 0;
    const dt = antes ? Math.min(.05, (t - antes) / 1000) : DT; antes = t;
    for(const c of corpos.values()) medeCorpo(c);   // a página pode ter rolado ou mudado
    sobra += dt / Math.max(1, cfg.lento);
    while(sobra >= DT){ passo(DT); sobra -= DT; }
    move(); pinta();
    if(capas.size || memb || rasgos.length || corpos.size) pedido = requestAnimationFrame(quadro);
    else { antes = 0; sobra = 0; }
  }
  const acorda = () => { if(!pedido) pedido = requestAnimationFrame(quadro); };

  // ---- eventos: o card sob o cursor é o mais de dentro que casa com o seletor (e que está na raiz)
  const ev = tela ? document : raiz;
  function mexe(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    const t = performance.now(), dt = Math.max(1, t - tMove) / 1000;
    if(t - tMove < 100){ mvx = mvx * .5 + (e.clientX - mx) / dt * .5; mvy = mvy * .5 + (e.clientY - my) / dt * .5; } else { mvx = mvy = 0; }
    mx = e.clientX; my = e.clientY; tMove = t;
    const el = e.target.closest ? e.target.closest(cfg.seletor) : null, card = el && raiz.contains(el) && !el.closest('[data-sem-goma]') ? el : null;
    if(card !== sobre){
      const antigo = sobre; sobre = card;
      if(card){
        if(memb && memb.v.c.el === card) recolhe(); else rasga();
        capa(card);
      }
      if(antigo && capas.has(antigo) && !memb && antigo !== card && !(card && antigo.contains(card))) puxa(capas.get(antigo));
    }
    acorda();
  }
  function sai(e){ if(tela && e.relatedTarget) return; sobre = null; rasga(); acorda(); }
  const ouvintes = [['pointermove', mexe], [tela ? 'mouseout' : 'pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f, {passive: true}));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(raiz); else addEventListener('resize', mede);
  mede();

  return {
    ajusta(o){ Object.assign(cfg, o); acorda(); },
    estado: () => ({memb: memb && {d: memb.d, ia: memb.ia}, capas: [...capas.values()].map(v => ({cobre: v.cobre, qtd: v.qtd, fase: v.fase})), rasgos: rasgos.length, soltas,
      cards: [...corpos.values()].map(c => ({x: c.x, y: c.y, a: c.a, m: c.m}))}),
    legenda(){
      const mx2 = Math.max(0, ...[...corpos.values()].map(c => Math.hypot(c.x, c.y)));
      return (memb ? `membrana ${Math.round(memb.d)} de ${cfg.rompe} px` : rasgos.length ? 'rasgou' : capas.size ? 'goma no card' : 'sem goma')
        + ` · card a ${mx2.toFixed(1)} px do lugar · rasgou ${soltas}×`;
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede);
      cancelAnimationFrame(pedido);
      for(const el of corpos.keys()){ el.style.translate = ''; el.style.rotate = ''; }
      cv.remove();
    },
  };
}


// ---- bancada: um pedaço do jogo de mentira na tela preta (o card do jogador, a caixa de tarefa nova, as tarefas, a
// constância e os cards do lado), com cards de tamanhos bem diferentes para ver a massa
const TAREFAS = [['A', 'Perguntar ao professor de Redes se o trabalho vale nota', '+23'], ['A', 'Mandar mensagem da caixa', '+23'], ['C', 'Lavar o carro', '+15'], ['B', 'Ler 20 páginas', '+12']];
function liga(palco, cfg){
  const antes = palco.style.cssText, pag = document.createElement('div');
  palco.style.cursor = 'default';
  pag.className = 'bg-pag';
  const cor = () => cfg.claro ? {bg: '#F2F3F7', card: '#FFFFFF', borda: '#D9DCE5', tinta: '#1B1D28', suave: '#6B7088', trilho: '#E4E6EE'}
    : {bg: '#0B1120', card: '#121A2A', borda: '#243049', tinta: '#E6EDF7', suave: '#8A96AB', trilho: '#1C2538'};
  const hm = Array.from({length: 84}, (_, i) => `<i style="opacity:${[.15, .4, .7, 1][(i * 7 + (i >> 2)) % 4]}"></i>`).join('');
  pag.innerHTML = `<style>
    .bg-pag{position:absolute;inset:0;overflow:hidden;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-content:start;font:14px var(--f-ui)}
    .bg-pag .bg-col{display:grid;gap:10px;align-content:start;min-width:0}
    .bg-pag .bg-card{background:var(--b-card);border:1px solid var(--b-borda);border-radius:12px;padding:12px 14px;color:var(--b-tinta);min-width:0}
    .bg-pag .bg-me{grid-column:1/-1;display:flex;gap:14px;align-items:center}
    .bg-pag .bg-av{width:44px;height:44px;border-radius:50%;background:url('../../../web/a/killua-3.png') center/cover;flex:none;border:2px solid var(--b-borda)}
    .bg-pag .bg-xp{height:6px;border-radius:9px;background:var(--b-trilho);margin-top:6px} .bg-pag .bg-xp b{display:block;height:100%;width:62%;background:var(--b-tinta);border-radius:9px}
    .bg-pag small{display:block;color:var(--b-suave);font-size:12px}
    .bg-pag .bg-in{display:flex;gap:10px;align-items:center;color:var(--b-suave)} .bg-pag .bg-in span:first-child{flex:1;border:1px solid var(--b-borda);border-radius:8px;padding:8px 10px}
    .bg-pag .bg-tf{display:flex;gap:10px;align-items:center;padding:10px 14px} .bg-pag .bg-tf span{flex:1;min-width:0}
    .bg-pag .bg-tf i{width:18px;height:18px;flex:none;clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%);background:#E0AF68}
    .bg-pag .bg-tf em{font:600 11px var(--f-mono);font-style:normal;color:#9BE15D;border:1px solid currentColor;border-radius:5px;padding:1px 6px}
    .bg-pag .bg-pr{font:600 10px var(--f-mono);color:#0B0C10;background:#8A96AB;border-radius:3px;padding:0 4px;margin-right:6px}
    .bg-pag .bg-hm{display:grid;grid-template-columns:repeat(21,1fr);gap:3px;margin-top:8px} .bg-pag .bg-hm i{aspect-ratio:1;border-radius:2px;background:#9BE15D}
    .bg-pag h4{margin:0 0 6px;font:600 11px var(--f-mono);letter-spacing:.06em;color:var(--b-suave)}
    .bg-pag .bg-ln{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--b-borda);font-size:13px}
  </style>
  <div class="bg-card bg-me"><span class="bg-av"></span><div style="flex:1;min-width:0"><b>Caio</b> · andar 204<div class="bg-xp"><b></b></div><small>hoje +0 XP · meta 65</small></div></div>
  <div class="bg-col">
    <div class="bg-card bg-in"><span>Nova tarefa: ex. Lista 3 de derivadas</span><span>+ adicionar</span></div>
    ${TAREFAS.map(([p, n, x]) => `<div class="bg-card bg-tf"><i></i><span><span class="bg-pr">${p}</span>${n}</span><em>${x}</em></div>`).join('')}
    <div class="bg-card"><h4>CONSTÂNCIA</h4><small>um painel grande: pesado, mal mexe</small><div class="bg-hm">${hm}</div></div>
  </div>
  <div class="bg-col">
    <div class="bg-card"><h4>QUANTO VALE</h4></div>
    <div class="bg-card"><h4>RENDE MAIS AGORA</h4><div class="bg-ln"><span>Mandar mensagem</span><b>+23</b></div><div class="bg-ln"><span>Lavar o carro</span><b>+15</b></div></div>
    <div class="bg-card"><h4>MISSÃO DA SEMANA</h4><b style="color:#E0AF68">Especialização</b><small>vida ×1,5 · 1/3 dias</small></div>
  </div>`;
  const pinta = () => { const c = cor(); palco.style.background = c.bg; for(const [k, v] of Object.entries(c)) pag.style.setProperty('--b-' + k, v); };
  palco.prepend(pag); pinta();
  const h = cola(palco, Object.assign(cfg, {seletor: '.bg-card'}));
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); h.ajusta(cfg); },
    estado: h.estado, legenda: h.legenda,
    desliga(){ h.desliga(); pag.remove(); palco.style.cssText = antes; },
  };
}

(window.CURSORES = window.CURSORES || {}).bungee = {cola, liga,
  titulo: 'passe o mouse pelos cards · saia de um card devagar e vá longe',
  dica: 'ao entrar, a goma corre pelo contorno do card a partir do ponto tocado · dentro, a borda incha para o lado do cursor · ao sair, a borda é puxada numa membrana que vira teia<br>passando do limite, ela rasga, a parte do card volta como elástico, uma onda corre a borda e o card balança · cards pequenos pulam mais; o painel grande da constância é pesado',
  controles: [{k: 'rompe', rot: 'rasga com', min: 80, max: 320, un: ' px', padrao: 160},
    {k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
