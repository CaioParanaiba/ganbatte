// Efeito Godspeed do Killua (fx-godspeed), feito em código, sem imagem: dispara ao concluir uma tarefa.
// Em cinco tempos. 1) O Kanmuru (~300 ms): a tela escurece um pouco, a eletricidade do Killua acende no card (arcos que
// correm pela borda e saltam por cima dele, trocando a cada quadro), fagulhas da tela são puxadas para o card e o alto da
// tela pisca, como nuvem carregada. 2) O líder (150 ms): um fio fraco desce do alto aos degraus, em zigue-zague, abrindo
// galhos que tateiam o caminho; dois líderes falsos descem junto e param no ar. 3) O impacto: um quadro negativo de anime
// (a tela inteira inverte por um instante, com o raio em silhueta), a tela e o card tremem, o canal acende de uma vez e
// pisca como raio de verdade (acende, quase apaga, reacende, pelo mesmo caminho, que treme um pouco a cada vez) e uma onda
// de choque elétrica sai do ponto da batida. 4) O 神速 (Kanmuru, o nome da técnica, com a leitura カンムル em cima) entra
// rápido com rastros, como o Killua no Godspeed, e fica com arcos correndo pelas letras; a descarga deixa uma figura de
// Lichtenberg queimada no card (a marca do raio que se espalha em galhos), a corrente corre pela borda nos dois sentidos e
// estoura onde as duas se encontram, e as faíscas quicam no card e no chão (as mais lentas ficam como brasa em cima dele).
// 5) O resto: estática que ainda estala na borda, a marca esfria e some, o 神速 se desfaz em fatias.
// No tema claro o raio ganha um contorno de tinta, para não sumir no branco, e a marca fica como queimado.
//   CURSORES.godspeed.dispara(rect, {alvo: document.body, el: card, claro: auto, cor: var(--volt), lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra, a tela inteira por padrão; el = o card, que treme;
//   claro = fundo claro, por padrão lido da cor do body; lento = câmera lenta). Chame CURSORES.godspeed.fonte() antes, para o
//   神速 sair na Dela Gothic One (no jogo, o GB_ARTE.fonte(), com 神速カンムル no &text=)
//   CURSORES.godspeed.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas para concluir
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const TINTA = '#0A1226';
const CARGA = 300, LIDER = 150, BATE = CARGA + LIDER, FIM = 1500;   // ms: a carga, o líder; depois da batida, tudo some em 1500 ms
const PULSOS = [[0, 1], [55, .3], [85, 1], [150, .22], [190, .75], [250, .12], [330, 0]];  // brilho da descarga (ms, 0 a 1)
const DT = 1000 / 240, TAU = Math.PI * 2;
const FONTE = '"Dela Gothic One","Hiragino Kaku Gothic StdN","Yu Gothic",sans-serif', NOME = '神速', LEITURA = 'カンムル';

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const zero = (g, c) => { g.fillStyle = c; const v = g.fillStyle; if(v[0] !== '#') return v.replace(/[\d.]+\)$/, '0)'); const n = parseInt(v.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},0)`; };
const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const brilho = u => { if(u < 0) return 0; for(let i = 1; i < PULSOS.length; i++){ const [t1, b1] = PULSOS[i], [t0, b0] = PULSOS[i - 1]; if(u <= t1) return b0 + (b1 - b0) * (u - t0) / (t1 - t0); } return 0; };
const corVolt = () => getComputedStyle(document.documentElement).getPropertyValue('--volt').trim() || '#9FD3FF';
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

// o líder: desce aos degraus mirando o ponto (com cada vez menos desvio perto dele), abrindo galhos que crescem um pouco e
// param; cada ponto guarda o degrau em que foi alcançado, depois convertido em ms (o líder inteiro leva dur ms)
function lider(x0, y0, x1, y1, rnd, dur = LIDER){
  const tronco = [[x0, y0, 0]], galhos = [];
  const cresce = (pts, x, y, a, n, t, nivel) => {
    for(let i = 0; i < n; i++){
      a += (rnd() - .5) * 1.1; a += (Math.PI / 2 - a) * .12;   // tateia, puxado um pouco para baixo
      const L = (8 + rnd() * 14) * (nivel > 1 ? .7 : 1);
      x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push([x, y, ++t]);
      if(nivel < 2 && rnd() < .14){ const g = {pts: [[x, y, t]], w: .35}; galhos.push(g); cresce(g.pts, x, y, a + (rnd() < .5 ? -1 : 1) * (.5 + rnd() * .6), 2 + rnd() * 4 | 0, t, nivel + 1); }
    }
  };
  let x = x0, y = y0, t = 0;
  for(let n = 0; n < 200; n++){
    const dist = Math.hypot(x1 - x, y1 - y); if(dist < 24) break;
    const a = Math.atan2(y1 - y, x1 - x) + (rnd() - .5) * 1.4 * Math.min(1, dist / 140), L = Math.min(dist - 10, 12 + rnd() * 18);
    x += Math.cos(a) * L; y += Math.sin(a) * L; tronco.push([x, y, ++t]);
    if(rnd() < .22 && dist > 70){ const g = {pts: [[x, y, t]], w: .6}; galhos.push(g); cresce(g.pts, x, y, a + (rnd() < .5 ? -1 : 1) * (.45 + rnd() * .65), 3 + rnd() * 7 | 0, t, 1); }
  }
  tronco.push([x1, y1, ++t]);
  const ms = dur / t;
  for(const p of tronco) p[2] *= ms;
  for(const g of galhos) for(const p of g.pts) p[2] *= ms;
  return {tronco, galhos};
}
// o detalhe fino do raio: cada degrau ganha um ponto no meio, fora da reta
function fino(pts, rnd, amp){
  const o = [pts[0]];
  for(let i = 1; i < pts.length; i++){
    const [ax, ay, at] = pts[i - 1], [bx, by, bt] = pts[i], dx = bx - ax, dy = by - ay, k = (rnd() - .5) * amp;
    o.push([(ax + bx) / 2 - dy * k, (ay + by) / 2 + dx * k, (at + bt) / 2], pts[i]);
  }
  return o;
}
// o caminho até onde o líder já chegou; devolve a ponta
function caminho(g, pts, T){
  g.beginPath(); let p = null;
  for(const q of pts){ if(q[2] > T) break; p ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); p = q; }
  return p;
}
// a borda do card, percorrida no sentido do relógio a partir do canto de cima à esquerda: ponto e normal para fora
function borda(R, s){
  const P = 2 * (R.w + R.h); s = (s % P + P) % P;
  if(s < R.w) return [R.x + s, R.y, 0, -1]; s -= R.w;
  if(s < R.h) return [R.x + R.w, R.y + s, 1, 0]; s -= R.h;
  if(s < R.w) return [R.x + R.w - s, R.y + R.h, 0, 1]; s -= R.w;
  return [R.x, R.y + R.h - s, -1, 0];
}
// um arco solto entre dois pontos: o meio de cada pedaço sai da reta, três vezes (entra no path atual)
function zigue(g, x0, y0, x1, y1, rf, amp){
  let pts = [[x0, y0], [x1, y1]];
  for(let n = 0; n < 3; n++, amp *= .5){
    const o = [pts[0]];
    for(let i = 1; i < pts.length; i++){ const [ax, ay] = pts[i - 1], [bx, by] = pts[i], k = (rf() - .5) * amp;
      o.push([(ax + bx) / 2 - (by - ay) * k, (ay + by) / 2 + (bx - ax) * k], pts[i]); }
    pts = o;
  }
  g.moveTo(x0, y0); for(const [x, y] of pts) g.lineTo(x, y);
}
// um arco que corre pela borda do card, de s até s + len, pulando para fora (entra no path atual)
function naBorda(g, R, s, len, rf, sai){
  const n = Math.max(2, len / 5 | 0);
  for(let j = 0; j <= n; j++){ const [x, y, nx, ny] = borda(R, s + len * j / n), o = (rf() - .3) * sai; j ? g.lineTo(x + nx * o, y + ny * o) : g.moveTo(x + nx * o, y + ny * o); }
}
const card = (g, R, r = 9) => { g.beginPath(); g.roundRect ? g.roundRect(R.x, R.y, R.w, R.h, r) : g.rect(R.x, R.y, R.w, R.h); };

// a figura de Lichtenberg: a marca que o raio deixa no card, galhos que saem do ponto da batida e se espalham (batem em
// cima e embaixo e voltam); cada pedaço guarda quando o raio chega e sai dele
function marca(xi, R, rnd){
  const segs = [], V = 1.15;   // px por ms
  const ramo = (x, y, a, w, t, prof) => {
    for(let i = 0; i < 40 && segs.length < 300; i++){
      a += (rnd() - .5) * .8;
      const L = 5 + rnd() * 5, nx = x + Math.cos(a) * L; let ny = y + Math.sin(a) * L;
      if(ny < R.y + 2 || ny > R.y + R.h - 2){ a = -a; ny = y + Math.sin(a) * L; }   // bate em cima ou embaixo e volta
      if(nx < R.x + 3 || nx > R.x + R.w - 3) break;
      const t1 = t + L / V * (1 + prof * .25);
      segs.push([x, y, nx, ny, t, t1, w]);
      x = nx; y = ny; t = t1; w *= .95;
      if(rnd() < .2 && prof < 3) ramo(x, y, a + (rnd() < .5 ? -1 : 1) * (.5 + rnd() * .6), w * .6, t, prof + 1);
      if(w < .35 || t > 260) break;
    }
  };
  for(const a of [.12, .45, Math.PI / 2 + (rnd() - .5) * .4, Math.PI - .45, Math.PI - .12])   // abre em leque a partir da batida
    ramo(xi, R.y + 1, a + (rnd() - .5) * .25, 1.7 + rnd() * .5, 0, 0);
  return segs;
}

// a placa do 神速, desenhada uma vez fora da tela (a leitura カンムル pequena em cima, como furigana) e depois só copiada
function placa(fs, cor){
  const d = Math.min(devicePixelRatio || 1, 2), W = fs * 2.9, H = fs * 1.8, oc = document.createElement('canvas');
  oc.width = Math.ceil(W * d); oc.height = Math.ceil(H * d);
  const c = oc.getContext('2d'); c.scale(d, d); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const lg = c.createLinearGradient(0, fs * .55, 0, fs * 1.6); lg.addColorStop(0, '#FFFFFF'); lg.addColorStop(.4, cor); lg.addColorStop(1, cor);
  const camadas = (txt, x, y, f, grad) => { c.font = `${f}px ${FONTE}`;
    for(const [lw, st] of [[f * .32, '#FFFFFF'], [f * .19, TINTA], [0, grad]]){ if(lw){ c.lineWidth = lw; c.strokeStyle = st; c.strokeText(txt, x, y); } else { c.fillStyle = st; c.fillText(txt, x, y); } } };
  [...LEITURA].forEach((ch, i) => camadas(ch, W / 2 + (i - 1.5) * fs * .46, fs * .32, fs * .3, '#FFFFFF'));
  [...NOME].forEach((ch, i) => camadas(ch, W / 2 + (i - .5) * fs * 1.02, fs * 1.12, fs, lg));
  return {oc, W, H};
}

// um raio, numa tela w × h, no card R; quadro(t) avança a física até t (ms desde o começo), desenha e devolve o tremor [dx, dy]
function cria(g, w, h, R, op, rnd){
  const {cor, claro} = op, soma = claro ? 'source-over' : 'lighter', semente = rnd() * 4294967296 | 0;
  const quadroDe = (n, f) => sorteio(semente + n * 7919 + f);   // o mesmo sorteio para o mesmo quadro (as prévias param nele)
  const xi = R.x + R.w * (.3 + rnd() * .4), yi = R.y;
  const x0 = Math.min(w - 20, Math.max(20, xi + (rnd() - .5) * Math.min(w * .6, 420)));
  const {tronco, galhos} = lider(x0, -12, xi, yi, rnd);
  let canal = fino(tronco, rnd, .3), pulso = -1;
  const ramos = galhos.map(r => ({w: r.w, pts: fino(r.pts, rnd, .3)}));
  for(let i = 0; i < 2; i++){   // os líderes falsos: descem junto e param no ar
    const fx = lim(x0 + (i ? 1 : -1) * (60 + rnd() * 140), 10, w - 10), fy = Math.max(30, yi * (.3 + rnd() * .35));
    ramos.push({w: .45, pts: fino(lider(x0 + (rnd() - .5) * 30, -12, fx, fy, rnd, LIDER * (.8 + rnd() * .2)).tronco, rnd, .3)});
  }
  const segs = marca(xi, R, rnd), P = 2 * (R.w + R.h), s0 = xi - R.x;
  const fagulhas = Array.from({length: 28}, () => {   // o Kanmuru puxa fagulhas da tela para o card
    const a = rnd() * TAU, r = 50 + rnd() * 120, [bx, by] = borda(R, rnd() * P);
    return {x: bx + Math.cos(a) * r, y: by + Math.sin(a) * r, bx, by, t0: rnd() * CARGA * .8, d: 150 + rnd() * 140};
  });
  const faiscas = [], correntes = [1, -1, 1, -1].map((d, i) => ({d, V: i < 2 ? 2.4 : 1.2 * (.85 + rnd() * .3), cauda: 50 + rnd() * 60}));
  const solta = (x, y, a0, abre, n, v0, v1) => { for(let i = 0; i < n; i++){ const a = a0 + (rnd() - .5) * abre, v = v0 + rnd() * (v1 - v0);
    faiscas.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: .3 + rnd() * .6, idade: 0}); } };
  const fs = lim(R.w * .16, 36, 60), tx = lim(xi, fs * 1.5, w - fs * 1.5);
  const ty = R.y - fs * 1.05 > fs * .9 ? R.y - fs * 1.05 : R.y + R.h + fs * 1.05 < h - fs * .9 ? R.y + R.h + fs * 1.05 : R.y + R.h / 2;
  let sim = 0, bateu = false, encontro = false, nome = null;
  function fisica(){
    const u = sim - BATE;
    if(u >= 0 && !bateu){ bateu = true; solta(xi, yi - 1, -Math.PI / 2, Math.PI * 1.5, 56, 250, 900); }
    if(!encontro && u > 0 && 2.4 * 300 * (1 - Math.exp(-u / 300)) >= P / 2){   // as duas correntes rápidas se encontram do outro lado
      encontro = true; const [x, y, nx, ny] = borda(R, s0 + P / 2); solta(x, y, Math.atan2(ny, nx), 1.8, 16, 150, 480);
    }
    const dt = DT / 1000;
    for(const p of faiscas){
      p.idade += dt; if(p.preso) continue;
      const py = p.y; p.vy += 1900 * dt; p.vx *= .996; p.x += p.vx * dt; p.y += p.vy * dt;
      if(p.vy > 0 && py <= R.y && p.y > R.y && p.x > R.x && p.x < R.x + R.w){   // quica no card; a lenta fica como brasa
        p.y = R.y; p.vy *= -.35; p.vx *= .75;
        if(Math.abs(p.vy) < 120 && p.idade < p.vida * .7){ p.preso = true; p.vida = p.idade + .5 + rnd() * .7; }
      }
      if(p.vy > 0 && p.y > h - 2){ p.y = h - 2; p.vy *= -.35; p.vx *= .7; }
      if(p.x < 0 || p.x > w) p.vx *= -.6;
    }
  }
  const traca = camadas => { for(const [lw, c, a] of camadas){ if(a <= 0) continue; g.lineWidth = lw; g.strokeStyle = c; g.globalAlpha = Math.min(1, a); g.stroke(); } };
  // um raio elétrico: o contorno de tinta no claro, o brilho e o miolo branco
  const eletrico = (lw, a) => {
    if(claro){ g.globalCompositeOperation = 'source-over'; traca([[lw + 2.4, TINTA, .75 * a]]); }
    g.globalCompositeOperation = soma; traca([[lw * 3.2, cor, .22 * a], [lw, cor, a], [lw * .4, '#FFFFFF', a]]);
  };

  // o Kanmuru: arcos que correm pela borda e saltam por cima do card, trocando a cada 45 ms
  function estatica(t, k, n, comp){
    const rf = quadroDe(1, t / 45 | 0);
    g.beginPath();
    for(let i = 0; i < n; i++){
      if(rf() < .3){ const x1 = R.x + rf() * R.w, y1 = R.y + rf() * R.h, an = rf() * TAU, L = 14 + rf() * 26;
        zigue(g, x1, y1, lim(x1 + Math.cos(an) * L, R.x, R.x + R.w), lim(y1 + Math.sin(an) * L, R.y, R.y + R.h), rf, .5); }
      else naBorda(g, R, rf() * P, comp * (.5 + rf()), rf, 7);
    }
    eletrico(1.5, k);
  }
  function kanmuru(t){
    const k = Math.min(1, t / CARGA);
    // as fagulhas puxadas: riscos que aceleram para a borda
    g.beginPath();
    for(const f of fagulhas){ const p = (t - f.t0) / f.d; if(p <= 0 || p >= 1) continue;
      const e = p * p, e2 = Math.max(0, p - .07) ** 2, x = f.x + (f.bx - f.x) * e, y = f.y + (f.by - f.y) * e;
      g.moveTo(f.x + (f.bx - f.x) * e2, f.y + (f.by - f.y) * e2); g.lineTo(x, y); }
    if(claro){ g.globalCompositeOperation = 'source-over'; traca([[2.6, TINTA, .5 * k]]); }
    g.globalCompositeOperation = soma; traca([[1.4, cor, .9 * k]]);
    // o card acende: contorno e o brilho em volta
    card(g, R); g.globalCompositeOperation = soma; traca([[10, cor, .08 * k], [4, cor, .14 * k], [1.4, cor, .7 * k]]);
    estatica(t, k, 1 + k * 5 | 0, 34);
    // a nuvem carregada: o alto da tela pisca
    if(t > CARGA - 90){ const rf = quadroDe(2, t / 30 | 0), a = rf() < .45 ? .1 + rf() * .18 : 0;
      if(a){ const lg = g.createLinearGradient(0, 0, 0, 120); lg.addColorStop(0, cor); lg.addColorStop(1, zero(g, cor));
        g.globalCompositeOperation = soma; g.globalAlpha = a; g.fillStyle = lg; g.fillRect(0, 0, w, 120); } }
  }

  function quadro(t){
    while(sim + DT <= t){ sim += DT; fisica(); }
    const u = t - BATE;
    g.save(); g.lineJoin = g.lineCap = 'round';
    // a tela escurece na carga e volta depois da batida
    const veu = (u < 0 ? Math.min(1, t / CARGA) : Math.exp(-u / 260)) * (claro ? .07 : .3);
    if(veu > .005){ g.globalAlpha = veu; g.fillStyle = claro ? TINTA : '#000'; g.fillRect(0, 0, w, h); }
    if(u < 120) kanmuru(Math.min(t, BATE));
    if(u < 0){
      if(t >= CARGA){   // o líder: fio fraco, com a ponta acesa
        g.globalCompositeOperation = soma;
        for(const r of [{pts: canal, w: 1}, ...ramos]){
          const p = caminho(g, r.pts, t - CARGA); if(!p) continue;
          traca([[1.2 * Math.max(.7, r.w), claro ? TINTA : cor, claro ? .5 : .55]]);
          g.globalAlpha = .9; g.fillStyle = claro ? TINTA : '#FFFFFF'; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, 7); g.fill();
        }
      }
      g.restore();
      const j = Math.min(1, t / CARGA) * 1.4;   // o card treme de leve, carregando
      return [(Math.random() - .5) * j, (Math.random() - .5) * j];
    }
    // a marca no card: na frente do raio, branca; depois esfria para a cor, e por fim fica como queimado
    if(u < FIM){
      const some = u < 900 ? 1 : Math.max(0, 1 - (u - 900) / 560), grupos = [[], [], []];
      for(const s of segs){ if(s[4] > u) continue; const idade = u - s[5]; grupos[idade < 50 ? 0 : idade < 240 ? 1 : 2].push(s); }
      g.save(); card(g, R); g.clip();
      grupos.forEach((gr, i) => {
        for(const grosso of [true, false]){
          g.beginPath(); let tem = false;
          for(const [ax, ay, bx, by, t0, t1, lw] of gr){ if(lw > .9 !== grosso) continue; const p = Math.min(1, (u - t0) / (t1 - t0));
            g.moveTo(ax, ay); g.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p); tem = true; }
          if(!tem) continue;
          const wk = grosso ? 1.6 : .8;
          if(i === 0){ if(claro){ g.globalCompositeOperation = 'source-over'; traca([[wk * 2.2 + 1, TINTA, .7]]); }
            g.globalCompositeOperation = soma; traca([[wk * 4, cor, .35], [wk * 1.6, cor, 1], [wk * .7, '#FFFFFF', 1]]); }
          else if(i === 1){ g.globalCompositeOperation = soma; traca([[wk * 3, cor, .2 * some], [wk * 1.1, cor, .85 * some]]); }
          else { g.globalCompositeOperation = 'source-over'; traca([[wk, claro ? TINTA : cor, .22 * some]]); }
        }
      });
      g.restore(); g.lineJoin = g.lineCap = 'round';
    }
    const b = brilho(u), pk = u < 85 ? 0 : u < 190 ? 1 : 2;
    if(pk !== pulso){ pulso = pk; if(pk) canal = fino(tronco, rnd, .3); }   // cada reacendida treme um pouco o caminho
    if(b > 0){
      g.globalAlpha = (claro ? .1 : .14) * b; g.fillStyle = cor; g.fillRect(0, 0, w, h);   // o clarão
      caminho(g, canal, 1e9);
      if(claro) traca([[3 + 5 * b, TINTA, .9 * Math.min(1, b * 2)]]);
      g.globalCompositeOperation = soma;
      traca([[26 * b, cor, .1], [10 * Math.sqrt(b), cor, .3 * b], [3.8, cor, b * 1.2], [1.7, '#FFFFFF', b * 1.2]]);
      const bg = b * .6 * Math.exp(-u / 140);
      for(const r of ramos){
        caminho(g, r.pts, LIDER);
        if(claro){ g.globalCompositeOperation = 'source-over'; traca([[2 + 4 * r.w, TINTA, .8 * bg]]); g.globalCompositeOperation = soma; }
        traca([[8 * r.w, cor, .25 * bg], [2.4 * r.w + .6, cor, bg], [1, '#FFFFFF', bg]]);
      }
      const rg = g.createRadialGradient(xi, yi, 0, xi, yi, 70 * b + 12);
      rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(.25, cor); rg.addColorStop(1, zero(g, cor));
      g.globalAlpha = .85 * b; g.fillStyle = rg; g.fillRect(xi - 90, yi - 90, 180, 180);
    } else if(u < 700){   // o canal ainda brilha um pouco no olho, esfriando
      caminho(g, canal, 1e9); g.globalCompositeOperation = soma; traca([[2.4, cor, .2 * Math.exp(-(u - 330) / 140)]]);
    }
    // a onda de choque: um anel elétrico que sai da batida, e um segundo, mais fino, logo atrás
    for(const [atraso, raio, vida, lw] of [[0, 300, 480, 2.6], [70, 200, 420, 1.4]]){
      const v = u - atraso; if(v < 0 || v > vida) continue;
      const a = 1 - v / vida, r = 14 + raio * (1 - Math.exp(-v / 110)), rf = quadroDe(3 + atraso, v / 33 | 0);
      g.beginPath();
      for(let i = 0; i <= 56; i++){ const an = i / 56 * TAU, q = r + (rf() - .5) * (3 + 6 * a); i ? g.lineTo(xi + Math.cos(an) * q, yi + Math.sin(an) * q * .8) : g.moveTo(xi + Math.cos(an) * q, yi + Math.sin(an) * q * .8); }
      eletrico(lw * a + .4, a);
    }
    // a corrente na borda do card: sai do ponto da batida nos dois sentidos, as duas rápidas estouram ao se encontrar
    if(u < 900){
      const a = 1 - u / 900;
      card(g, R); g.globalCompositeOperation = soma; traca([[6, cor, .12 * Math.exp(-u / 300)], [1.6, cor, .6 * Math.exp(-u / 300)]]);
      for(const c of correntes){
        const anda = Math.min(P / 2, c.V * 300 * (1 - Math.exp(-u / 300))), s = s0 + c.d * anda, n = Math.max(1, Math.min(c.cauda, anda) / 6 | 0);
        g.beginPath();
        for(let j = 0; j <= n; j++){ const [x, y, nx, ny] = borda(R, s - c.d * j * 6), o = (rnd() - .35) * 5; j ? g.lineTo(x + nx * o, y + ny * o) : g.moveTo(x + nx * o, y + ny * o); }
        if(rnd() < .35){   // um arco pula para fora
          const [x, y, nx, ny] = borda(R, s), an = Math.atan2(ny, nx) + (rnd() - .5) * 1.6, L = 10 + rnd() * 22;
          g.moveTo(x, y);
          for(let k = 1; k <= 3; k++){ const q = k / 3 * L, o = k < 3 ? (rnd() - .5) * 8 : 0; g.lineTo(x + Math.cos(an) * q - Math.sin(an) * o, y + Math.sin(an) * q + Math.cos(an) * o); }
        }
        eletrico(2.2, a);
        const [hx, hy] = borda(R, s); g.globalCompositeOperation = soma; g.globalAlpha = a; g.fillStyle = claro ? cor : '#FFFFFF'; g.beginPath(); g.arc(hx, hy, 2.4, 0, 7); g.fill();
      }
    }
    // a estática que sobra: estala na borda cada vez menos
    if(u > 380 && u < 1400){ const k = 1 - (u - 380) / 1020, rf = quadroDe(4, u / 70 | 0); if(rf() < k * .9) estatica(u, k, 1 + (k > .5), 22); }
    // faíscas: riscos do tamanho da velocidade, com rastro, brancas no começo e da cor do raio no fim; as presas são brasa
    for(const p of faiscas){
      const k = 1 - p.idade / p.vida; if(k <= 0) continue;
      if(p.preso){ g.globalCompositeOperation = soma; g.globalAlpha = k * (.6 + .4 * Math.sin(p.idade * 40)); g.fillStyle = claro ? cor : '#FFFFFF';
        g.beginPath(); g.arc(p.x, p.y, 1.6, 0, 7); g.fill(); g.globalAlpha *= .35; g.fillStyle = cor; g.beginPath(); g.arc(p.x, p.y, 4.5, 0, 7); g.fill(); continue; }
      g.beginPath(); g.moveTo(p.x - p.vx * .045, p.y - p.vy * .045); g.lineTo(p.x - p.vx * .016, p.y - p.vy * .016);
      g.globalCompositeOperation = soma; traca([[1, cor, .35 * k]]);
      g.beginPath(); g.moveTo(p.x - p.vx * .016, p.y - p.vy * .016); g.lineTo(p.x, p.y);
      if(claro){ g.globalCompositeOperation = 'source-over'; traca([[2.6, TINTA, .6 * k]]); }
      g.globalCompositeOperation = soma; traca([[1.6, k > .55 ? '#FFFFFF' : cor, k]]);
    }
    // o 神速: entra rápido com rastros, fica com arcos correndo pelas letras e sai em fatias
    if(u >= 30 && u < 1250){
      if(!nome) nome = placa(fs, cor);
      const v = u - 30, sc = 1 + 1.1 * Math.exp(-v / 50) * Math.cos(TAU * v / 170), sai = u > 900 ? (u - 900) / 350 : 0;
      const rf = quadroDe(5, u / 40 | 0), jx = (rf() - .5) * 1.6, jy = (rf() - .5) * 1.6, {oc, W, H} = nome;
      const copia = (dx, a) => {
        g.save(); g.translate(tx + dx + jx, ty + jy - sai * 10); g.rotate(-.06); g.scale(sc, sc); g.globalAlpha = a;
        if(!sai) g.drawImage(oc, -W / 2, -H / 2, W, H);
        else for(let i = 0, n = 7; i < n; i++){ const o = (rf() - .5) * 40 * sai, sh = oc.height / n;
          g.drawImage(oc, 0, i * sh, oc.width, sh, -W / 2 + o, -H / 2 + i * H / n, W, H / n); }
        g.restore();
      };
      const ent = Math.min(1, v / 120);
      if(ent < 1) for(let k = 3; k >= 1; k--){ g.globalCompositeOperation = soma; copia(-k * fs * .5 * (1 - ent), (claro ? .18 : .32) / k * (1 - ent)); }
      g.globalCompositeOperation = soma;   // o brilho por trás
      const rg = g.createRadialGradient(tx, ty, 0, tx, ty, W * .6); rg.addColorStop(0, cor); rg.addColorStop(1, zero(g, cor));
      g.globalAlpha = (claro ? .2 : .32) * (1 - sai); g.fillStyle = rg; g.fillRect(tx - W, ty - W, 2 * W, 2 * W);
      g.globalCompositeOperation = 'source-over'; copia(0, 1 - sai);
      if(v > 60 && !sai){   // arcos correndo pelas letras
        g.beginPath();
        for(let i = 0, n = 1 + (rf() < .5); i < n; i++){ const ax = tx + (rf() - .5) * W * .7, ay = ty + (rf() - .2) * H * .45;
          zigue(g, ax, ay, ax + (rf() - .5) * fs * 1.4, ay + (rf() - .5) * fs * .7, rf, .6); }
        eletrico(1.2, .9);
      }
    }
    // o quadro negativo de anime: a tela inverte por um instante, com o raio em silhueta
    if(u < 50){
      const a = .8 * Math.sqrt(1 - u / 50);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = a; g.fillStyle = claro ? TINTA : '#EAF6FF'; g.fillRect(0, 0, w, h);
      caminho(g, canal, 1e9); traca([[8, claro ? '#FFFFFF' : TINTA, a * 1.2], [2.5, claro ? cor : '#FFFFFF', a]]);
      card(g, R); traca([[2, claro ? '#FFFFFF' : TINTA, a]]);
    }
    g.restore();
    const am = u < 360 ? 9 * Math.exp(-u / 80) : 0;   // a tela e o card tremem com a batida
    return [(Math.random() - .5) * am, (Math.random() - .5) * am];
  }
  const fase = t => t < CARGA ? 'o Kanmuru (a carga)' : t < BATE ? 'o líder desce' : t < BATE + 50 ? 'o impacto (quadro negativo)' :
    t < BATE + 330 ? 'descarga, onda de choque e o nome (Kanmuru)' : t < BATE + 900 ? 'a marca no card e a corrente na borda' : t < BATE + FIM ? 'estática e brasas' : '';
  return {quadro, fase, xi, yi};
}

function acende(el, lento){
  if(!el.animate) return;
  el.animate([{filter: 'brightness(2.4) saturate(1.5)'}, {filter: 'brightness(1.1)', offset: .25}, {filter: 'brightness(1.7)', offset: .4},
    {filter: 'brightness(1.15)', offset: .7}, {filter: 'none'}], {duration: 560 * lento, easing: 'ease-out'});
}

function dispara(r, o = {}){
  const alvo = o.alvo || document.body, cam = camada(alvo), lento = o.lento || 1, el = o.el, antes = el ? el.style.translate : '';
  const fx = cria(cam.g, cam.w, cam.h, {x: r.left - cam.ox, y: r.top - cam.oy, w: r.width, h: r.height},
    {cor: o.cor || corVolt(), claro: o.claro ?? fundoClaro()}, sorteio(Math.random() * 4294967296));
  let t0 = null, bateu = false;
  const passo = now => {
    if(t0 === null) t0 = now;
    const t = (now - t0) / lento; fx.t = t;
    cam.g.clearRect(0, 0, cam.w, cam.h);
    const [dx, dy] = fx.quadro(t);
    if(el) el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    cam.cv.style.translate = t > BATE ? `${(dx * .6).toFixed(1)}px ${(dy * .6).toFixed(1)}px` : '';   // a tela treme junto, menos
    if(!bateu && t >= BATE && el){ bateu = true; acende(el, lento); }
    if(t < BATE + FIM) requestAnimationFrame(passo); else { cam.cv.remove(); if(el) el.style.translate = antes; fx.acabou = true; }
  };
  requestAnimationFrame(passo);
  return fx;
}

// a fonte do 神速 (Dela Gothic One, do Google Fonts, só com essas letras): vem com a página, então funciona mesmo sem fonte
// japonesa instalada; o jogo usa o GB_ARTE.fonte(), com 神速カンムル no &text=
function fonte(){
  const txt = NOME + LEITURA;
  let l = document.getElementById('f-dela-gs');
  if(!l){ l = document.createElement('link'); l.id = 'f-dela-gs'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap&text=' + encodeURIComponent(txt); document.head.append(l);
    l.pronto = new Promise(ok => { l.onload = l.onerror = ok; }); }
  return (l.pronto || Promise.resolve()).then(() => document.fonts && document.fonts.load('20px "Dela Gothic One"', txt)).catch(() => {});
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
    setTimeout(() => { c.feito = false; c.firstChild.style.background = ''; c.lastChild.style.textDecoration = ''; pinta(); }, 2800 * cfg.lento);
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
const liga = (palco, cfg) => { fonte(); return tarefas(palco, cfg, (r, el) => dispara(r, {alvo: palco, el, claro: !!cfg.claro, cor: cfg.cor, lento: cfg.lento})); };

// prévias paradas: o mesmo raio (mesma semente) em seis momentos, no escuro e no claro
function previas(el, cfg){
  const W = 300, H = 230, R = {x: 40, y: 150, w: 220, h: 48};
  const momento = (t, claro, semente) => {
    const c = document.createElement('canvas'), d = devicePixelRatio || 1; c.className = 'prev';
    c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px';
    const g = c.getContext('2d'); g.scale(d, d);
    g.fillStyle = claro ? '#F2F3F7' : '#0F1016'; g.fillRect(0, 0, W, H);
    g.fillStyle = claro ? '#FFFFFF' : '#1B1D28'; g.strokeStyle = claro ? '#D9DCE5' : '#2A2D3C';
    g.beginPath(); g.roundRect(R.x, R.y, R.w, R.h, 10); g.fill(); g.stroke();
    g.strokeStyle = '#E0AF68'; g.lineWidth = 2; g.beginPath(); g.arc(R.x + 27, R.y + 24, 10, 0, 7); g.stroke();
    g.fillStyle = claro ? '#1B1D28' : '#E6E8F0'; g.font = '14px system-ui,sans-serif'; g.fillText('Ler 20 páginas', R.x + 48, R.y + 29);
    cria(g, W, H, R, {cor: cfg.cor || '#9FD3FF', claro}, sorteio(semente)).quadro(t);
    return c;
  };
  const ts = [[CARGA * .85, 'o Kanmuru'], [CARGA + 100, 'o líder'], [BATE + 20, 'o impacto'], [BATE + 110, 'reacende e o nome'],
    [BATE + 420, 'a marca e a corrente'], [BATE + 1000, 'estática e brasas']];
  el.innerHTML = '<section><h2>' + ts.map(x => x[1]).join(' · ') + ' (o mesmo raio, parado)</h2><div class="linha"></div><div class="linha" style="margin-top:12px"></div></section>';
  const [esc, cla] = el.querySelectorAll('.linha');
  fonte().then(() => ts.forEach(([t]) => { esc.append(momento(t, false, 7)); cla.append(momento(t, true, 7)); }));
}

(window.CURSORES = window.CURSORES || {}).godspeed = {dispara, liga, previas, cria, fonte,
  titulo: 'clique numa tarefa (ou aperte espaço) para concluir',
  dica: 'o Kanmuru acende no card, o raio cai (o líder tateia, um quadro negativo, a descarga pisca pelo mesmo caminho),<br>o nome da técnica (Kanmuru) entra com rastros, a marca do raio se espalha no card, a corrente estoura na borda e as faíscas viram brasa · câmera lenta para ver tudo',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
