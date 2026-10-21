// Efeito Costura da Machi (fx-costura), feito em código, sem imagem: dispara ao concluir uma tarefa.
// O card racha de verdade: uma rachadura corre do meio para cima e para baixo, o card se parte em duas metades (o card do
// jogo mesmo, cortado com clip-path, e uma cópia dele para a metade da direita), que se abrem como uma dobradiça presa
// embaixo; lascas do card caem e trincas finas sobem pelas bordas do corte.
// Então a agulha da Machi entra de longe, deixando o rastro do fio de nen, dá o nó no primeiro furo e costura em
// zigue-zague, um ponto por vez, de uma metade à outra; o fio atrás dela é um fio de verdade (Verlet: pesa, balança,
// sobra), e cada ponto dá um puxãozinho que aproxima as metades.
// No fim, o fio é puxado: a agulha sai voando para o alto, o fio estica de uma vez, os pontos se apertam e o card fecha com
// um estalo (as trincas somem, a costura acende); o fio esticado vibra como uma corda e é cortado rente: a parte de cima
// recolhe para longe e a pontinha cai. O nome da técnica, 念糸縫合 (nen ito hōgō, a sutura de fio de nen), entra
// letra por letra, como pontos. A costura fica no card um pouco e se apaga.
//   CURSORES.costura.dispara(rect, {alvo: document.body, el: card, claro: auto, cor: '#F0A8E0', lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra, a tela inteira por padrão; el = o card, que racha
//   de verdade (sem el, só a costura aparece); claro = fundo claro, por padrão lido da cor do body; lento = câmera lenta)
//   CURSORES.costura.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas para concluir
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const FIO = '#F0A8E0', TINTA = '#0B0C10';
const ABRE = 60, ENTRA = 260, PRIMEIRO = 400, PASSO = 72;   // ms: as metades se abrem, a agulha entra, o 1º furo, cada ponto
const GAP = 9, ANG = .035, OFF = 6;                         // px, rad, px: a abertura das metades e o furo a partir do corte
const DT = 1000 / 240, TAU = Math.PI * 2, NOS = 14, FOLGA = 44;   // o fio solto: 14 nós, 44 px de fio entre o furo e a agulha
const FONTE = '"Dela Gothic One","Hiragino Kaku Gothic StdN","Yu Gothic",sans-serif', NOME = '念糸縫合';

const zero = (g, c) => { g.fillStyle = c; const v = g.fillStyle; if(v[0] !== '#') return v.replace(/[\d.]+\)$/, '0)'); const n = parseInt(v.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},0)`; };
const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = k => k * k * (3 - 2 * k);
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

// a costura num card R; quadro(t, metades) avança a física até t, chama metades([esq, dir]) com a posição de cada metade
// ({x, y, a}: translação e giro em volta do pivô) e desenha por cima. op.fundo é a cor do card (as lascas).
function cria(g, w, h, R, op, rnd){
  const {cor, claro} = op, soma = claro ? 'source-over' : 'lighter', fundo = op.fundo || (claro ? '#FFFFFF' : '#1B1D28');
  // a rachadura: de cima a baixo, perto do meio, em zigue-zague miúdo; o pivô (dobradiça) é o pé dela
  const cx0 = R.x + R.w / 2 + (rnd() - .5) * R.w * .14, corte = [];
  for(let y = R.y - 1, x = cx0; ; y += 5 + rnd() * 4){ y = Math.min(y, R.y + R.h + 1); corte.push([x, y]); if(y >= R.y + R.h + 1) break; x = cx0 + (rnd() - .5) * 9; }
  const pv = corte[corte.length - 1], meioY = R.y + R.h / 2;
  const xEm = y => { for(let i = 1; i < corte.length; i++) if(corte[i][1] >= y){ const [x0, y0] = corte[i - 1], [x1, y1] = corte[i]; return x0 + (x1 - x0) * (y - y0) / ((y1 - y0) || 1); } return pv[0]; };
  const M = 40;   // as metades passam do card, para a sombra dele não ser cortada
  const poligonos = [[[R.x - M, R.y - M], [corte[0][0], R.y - M], ...corte, [pv[0], R.y + R.h + M], [R.x - M, R.y + R.h + M]],
    [[R.x + R.w + M, R.y - M], [corte[0][0], R.y - M], ...corte, [pv[0], R.y + R.h + M], [R.x + R.w + M, R.y + R.h + M]]];
  // trincas finas que sobem do corte para dentro de cada metade (somem quando o card fecha)
  const trincas = [];
  for(const lado of [-1, 1]) for(let i = 0, n = 2 + (rnd() * 2 | 0); i < n; i++){
    const y = R.y + R.h * (.15 + rnd() * .7), x = xEm(y), pts = [[x, y]]; let a = (lado < 0 ? Math.PI : 0) + (rnd() - .5) * 1.4, px = x, py = y;
    for(let k = 0, L = 3 + (rnd() * 3 | 0); k < L; k++){ a += (rnd() - .5) * .8; const s = 3 + rnd() * 4; px += Math.cos(a) * s; py = lim(py + Math.sin(a) * s, R.y + 2, R.y + R.h - 2); pts.push([px, py]); }
    trincas.push({lado: lado < 0 ? 0 : 1, pts});
  }
  // os furos: zigue-zague de cima a baixo, um de cada lado; a metade dona de cada um
  const n = lim(Math.round((R.h - 10) / 9) + 1, 5, 9);   // card alto: no máximo 9 pontos, mais espaçados
  const furos = Array.from({length: n}, (_, i) => { const y = R.y + 5 + (R.h - 10) * i / (n - 1), lado = i % 2; return {lado, x: xEm(y) + (lado ? OFF : -OFF), y, t: PRIMEIRO + i * PASSO}; });
  const ULTIMO = furos[n - 1].t, PUXA = ULTIMO + 90;
  // de onde a agulha vem (a Machi, longe, em cima à esquerda) e para onde ela vai no puxão (em cima à direita)
  const S = [R.x + R.w / 2 - 260, R.y - 200], E = [R.x + R.w / 2 + 420, R.y - 420];
  // lascas do card que caem da rachadura
  const lascas = Array.from({length: 7}, () => { const y = R.y + rnd() * R.h; return {x: xEm(y), y, vx: (rnd() - .5) * 260, vy: -60 - rnd() * 180, a: rnd() * TAU, va: (rnd() - .5) * 30, r: 1.6 + rnd() * 2.2, f: [rnd(), rnd(), rnd()]}; });
  const letras = [...NOME].map(() => ({r: (rnd() - .5) * .16, dy: (rnd() - .5) * 5}));

  // as metades: s = abertura (0 fechado, 1 aberto), uma mola; cada ponto dá um puxão, o fio esticado fecha de vez
  let sim = 0, s = 0, v = 0, alvoS = 0, feitos = 0, tenso = null, fechou = null;
  const ang = Math.min(ANG, 10 / R.h);   // card alto abre menos, para o topo não varrer longe
  const pos = lado => { const k = lado ? 1 : -1; return {x: k * GAP * s, y: 0, a: k * ang * s}; };
  const mundo = (lado, x, y) => { const m = pos(lado), c = Math.cos(m.a), sn = Math.sin(m.a), dx = x - pv[0], dy = y - pv[1];
    return [pv[0] + dx * c - dy * sn + m.x, pv[1] + dx * sn + dy * c + m.y]; };
  const furo = i => mundo(furos[i].lado, furos[i].x, furos[i].y);

  // a agulha: entra de S até o 1º furo, depois pula de furo em furo num arco por cima; no puxão, sai acelerando para E
  const agulha = t => {
    if(t < PRIMEIRO){ const k = suave(lim((t - ENTRA) / (PRIMEIRO - ENTRA), 0, 1)), [fx, fy] = furo(0);
      return [S[0] + (fx - S[0]) * k + Math.sin(k * Math.PI) * 30, S[1] + (fy - S[1]) * k - Math.sin(k * Math.PI) * 40]; }
    if(t < ULTIMO){ const i = Math.min(n - 2, (t - PRIMEIRO) / PASSO | 0), k = suave((t - furos[i].t) / PASSO), [x0, y0] = furo(i), [x1, y1] = furo(i + 1);
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 9]; }
    const [fx, fy] = furo(n - 1); if(t < PUXA) return [fx + Math.sin((t - ULTIMO) / 90 * Math.PI) * 4, fy - (t - ULTIMO) * .05];
    const k = Math.pow(lim((t - PUXA) / 240, 0, 1), 2.2);
    return [fx + (E[0] - fx) * k, fy - 4.5 + (E[1] - fy) * k];
  };
  const giro = t => { const [x0, y0] = agulha(t - 6), [x1, y1] = agulha(t + 6); return Math.hypot(x1 - x0, y1 - y0) < .3 ? -.9 : Math.atan2(y1 - y0, x1 - x0); };
  const olho = t => { const [x, y] = agulha(t), a = giro(t); return [x - Math.cos(a) * 9, y - Math.sin(a) * 9]; };

  // o fio solto, do último furo até o olho da agulha
  let corda = null;
  const prende = () => { const [ax, ay] = furo(feitos - 1), [bx, by] = olho(sim);
    corda = Array.from({length: NOS}, (_, i) => { const k = i / (NOS - 1), x = ax + (bx - ax) * k, y = ay + (by - ay) * k + Math.sin(k * Math.PI) * 6; return {x, y, ox: x, oy: y}; }); };
  function fisica(){
    const t = sim, dt = DT / 1000;
    if(t >= ABRE && t < ABRE + DT) alvoS = 1;
    while(feitos < n && t >= furos[feitos].t){ feitos++; if(feitos > 1){ alvoS = Math.max(.35, alvoS - .09); v -= .9; } prende(); }
    // a mola das metades: aberta balança um pouco; com o fio tenso, fecha forte e bate (sem passar do fechado)
    const k = tenso === null ? 420 : 2400, c = tenso === null ? 16 : 22;
    v += (k * (alvoS - s) - c * v) * dt; s += v * dt;
    if(s < 0){ s = 0; if(fechou === null) fechou = t; v = -v * .28; }
    if(corda){
      const [ax, ay] = furo(feitos - 1), [bx, by] = olho(t), L = FOLGA / (NOS - 1);
      for(const p of corda){ const vx = (p.x - p.ox) * .985, vy = (p.y - p.oy) * .985; p.ox = p.x; p.oy = p.y; p.x += vx; p.y += vy + 700 * dt * dt; }
      for(let it = 0; it < 10; it++){
        corda[0].x = ax; corda[0].y = ay; corda[NOS - 1].x = bx; corda[NOS - 1].y = by;
        for(let i = 0; i < NOS - 1; i++){ const p = corda[i], q = corda[i + 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1e-6, e = (d - L) / d * .5;
          const fp = i === 0 ? 0 : 1, fq = i + 1 === NOS - 1 ? 0 : 1, tot = fp + fq || 1;
          p.x += dx * e * 2 * fp / tot; p.y += dy * e * 2 * fp / tot; q.x -= dx * e * 2 * fq / tot; q.y -= dy * e * 2 * fq / tot; }
      }
      corda[0].x = ax; corda[0].y = ay; corda[NOS - 1].x = bx; corda[NOS - 1].y = by;
      if(tenso === null && t > PUXA && Math.hypot(bx - ax, by - ay) > FOLGA){ tenso = t; alvoS = 0; }
    }
    for(const l of lascas) if(t > ABRE * .4){ l.vy += 1800 * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.a += l.va * dt; }
  }

  const traca = camadas => { for(const [lw, c, a] of camadas){ if(a <= 0) continue; g.lineWidth = lw; g.strokeStyle = c; g.globalAlpha = Math.min(1, a); g.stroke(); } };
  const brilho = (x, y, r, a, meio = .3) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(meio, cor); rg.addColorStop(1, zero(g, cor));
    g.globalAlpha = a; g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
  // o fio de nen: halo na cor, alma clara; no claro, contorno de tinta por baixo
  const fio = (a, lw = 1.2) => {
    if(claro){ g.globalCompositeOperation = 'source-over'; traca([[lw + 2, TINTA, .55 * a]]); traca([[lw + .6, cor, a]]); return; }
    g.globalCompositeOperation = soma; traca([[lw * 3.4, cor, .28 * a], [lw * 1.4, cor, .9 * a], [lw * .6, '#FFFFFF', .9 * a]]);
  };

  function quadro(t, metades){
    while(sim + DT <= t){ sim += DT; fisica(); }
    // o tremor: o estalo da rachadura e o do card fechando
    const tr = t < 120 ? 3 * Math.exp(-t / 50) * Math.sin(TAU * t / 34) : fechou !== null && t - fechou < 140 ? 2.2 * Math.exp(-(t - fechou) / 45) * Math.cos(TAU * (t - fechou) / 40) : 0;
    const ms = [0, 1].map(l => { const m = pos(l); return {x: m.x + tr, y: m.y + Math.abs(tr) * .4, a: m.a}; });
    if(metades) metades(ms);
    const fim = FIM(), some = t < fim - 450 ? 1 : Math.max(0, (fim - t) / 450), aberto = Math.min(1, s * 1.6);
    g.save(); g.lineJoin = g.lineCap = 'round';
    g.translate(tr, 0);
    const caminho = (lado, pts) => { g.beginPath(); pts.forEach(([x, y], i) => { const [X, Y] = mundo(lado, x, y); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); };
    // a rachadura correndo do meio para as pontas (antes das metades se abrirem) e as bordas acesas do corte
    if(t < ABRE + 160){
      const k = lim(t / 70, 0, 1), dentro = corte.filter(([, y]) => Math.abs(y - meioY) <= k * (R.h / 2 + 2));
      if(dentro.length > 1){ const a = 1 - lim((t - ABRE) / 160, 0, 1);
        caminho(0, dentro); g.globalCompositeOperation = 'source-over'; traca([[2.2, claro ? TINTA : '#000000', .8 * a]]);
        g.globalCompositeOperation = soma; traca([[4, cor, .5 * a], [1, '#FFFFFF', a]]); }
      if(t < 90){ g.globalCompositeOperation = soma; brilho(xEm(meioY), meioY, 46, 1 - t / 90, .25); }
    }
    for(const lado of [0, 1]){
      const cura = fechou === null ? 1 : Math.max(0, 1 - (t - fechou) / 220);
      caminho(lado, corte); g.globalCompositeOperation = soma; traca([[2.4, cor, .55 * aberto * cura], [.8, '#FFFFFF', .7 * aberto * cura]]);
      for(const tc of trincas) if(tc.lado === lado){ caminho(lado, tc.pts.slice(0, 1 + Math.ceil(lim((t - 20) / 60, 0, 1) * (tc.pts.length - 1))));
        g.globalCompositeOperation = 'source-over'; traca([[.9, claro ? TINTA : '#05060A', .75 * cura]]); g.globalCompositeOperation = soma; traca([[.5, cor, .5 * cura * aberto]]); }
    }
    // as lascas que caem
    g.globalCompositeOperation = 'source-over';
    for(const l of lascas){ const a = lim(1 - (t - 300) / 300, 0, 1) * (t > ABRE * .4 ? 1 : 0); if(a <= 0) continue;
      g.save(); g.translate(l.x, l.y); g.rotate(l.a); g.beginPath(); l.f.forEach((q, i) => { const b = i / 3 * TAU; g.lineTo(Math.cos(b) * l.r * (.6 + q * .6), Math.sin(b) * l.r * (.6 + q * .6)); }); g.closePath();
      g.globalAlpha = a; g.fillStyle = fundo; g.fill(); g.lineWidth = .8; g.strokeStyle = claro ? '#9AA0B2' : cor; g.stroke(); g.restore(); }

    // os pontos já dados: do nó (1º furo) até o último; com folga antes do puxão, retos depois
    const folga = tenso === null ? 1 : Math.exp(-(t - tenso) / 35), acende = fechou === null ? 0 : Math.exp(-(t - fechou) / 260);
    if(feitos > 1){
      g.beginPath();
      for(let i = 0; i < feitos; i++){ const [x, y] = furo(i); if(!i){ g.moveTo(x, y); continue; }
        const [x0, y0] = furo(i - 1); g.quadraticCurveTo((x + x0) / 2, (y + y0) / 2 + 3.5 * folga, x, y); }
      fio(some, 1.1 + acende * .8);
      if(acende > .02){ g.globalCompositeOperation = soma; for(let i = 0; i < n; i++){ const [x, y] = furo(i); brilho(x, y, 9, acende * .8 * some, .35); } }
    }
    // os furos: um pontinho escuro em cada, e o nó no primeiro
    g.globalCompositeOperation = 'source-over';
    for(let i = 0; i < feitos; i++){ const [x, y] = furo(i); g.globalAlpha = some; g.fillStyle = claro ? TINTA : '#05060A'; g.beginPath(); g.arc(x, y, i ? 1.1 : 1.8, 0, TAU); g.fill();
      if(!i){ g.fillStyle = claro ? cor : '#FFFFFF'; g.beginPath(); g.arc(x, y, 1, 0, TAU); g.fill(); } }
    // o furo acabou de ser dado: um anel pequeno que abre
    for(let i = 0; i < feitos; i++){ const u = t - furos[i].t; if(u < 0 || u > 140) continue; const [x, y] = furo(i);
      g.beginPath(); g.arc(x, y, 2 + u / 140 * 9, 0, TAU); g.globalCompositeOperation = soma; traca([[1.2, cor, 1 - u / 140]]); }

    // a agulha chegando: o rastro do fio voando atrás dela
    if(t >= ENTRA && t < PRIMEIRO + 60){
      g.beginPath(); for(let i = 0; i <= 16; i++){ const [x, y] = agulha(Math.min(t, PRIMEIRO) - 150 * (1 - i / 16)); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      fio(t < PRIMEIRO ? 1 : 1 - (t - PRIMEIRO) / 60, 1);
    }
    if(t >= PRIMEIRO && t < PRIMEIRO + 160){ const [x, y] = furo(0); g.globalCompositeOperation = soma; brilho(x, y, 16, 1 - (t - PRIMEIRO) / 160, .3); }
    // o fio solto (com folga, pesando) ou, depois do puxão, a corda esticada que vibra e é cortada
    const CORTA = tenso === null ? Infinity : tenso + 240;
    if(corda && tenso === null){ g.beginPath(); corda.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); fio(1); }
    else if(corda){
      const [ax, ay] = furo(n - 1), [bx, by] = t < PUXA + 240 ? olho(t) : E, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, u = t - tenso;
      const vib = 5 * Math.exp(-u / 110) * Math.sin(TAU * u / 36), pt = q => [ax + dx * q + nx * vib * Math.sin(Math.PI * q), ay + dy * q + ny * vib * Math.sin(Math.PI * q)];
      const rente = 14 / L;
      if(t < CORTA){ g.beginPath(); for(let i = 0; i <= 24; i++){ const [x, y] = pt(i / 24); i ? g.lineTo(x, y) : g.moveTo(x, y); } fio(1, 1.3); }
      else {
        const k = suave(lim((t - CORTA) / 220, 0, 1)), q0 = rente + (1 - rente) * k;   // a parte de cima recolhe para longe
        if(k < 1){ g.beginPath(); for(let i = 0; i <= 16; i++){ const [x, y] = pt(q0 + (1 - q0) * i / 16); i ? g.lineTo(x, y) : g.moveTo(x, y); } fio(1 - k * .5, 1.2); }
        const c = lim((t - CORTA) / 320, 0, 1), [rx, ry] = pt(rente);   // a pontinha que sobra cai, curvando, e some
        g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(rx, ry + 10 * c, ax + (rx - ax) * (1 - c * .5) + 3 * c, ay + (ry - ay) * (1 - c) + 13 * c); fio((1 - c) * some, 1);
        if(t - CORTA < 110){ g.globalCompositeOperation = soma; brilho(rx, ry, 18, 1 - (t - CORTA) / 110, .2);
          g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1 - (t - CORTA) / 110; g.strokeStyle = claro ? TINTA : '#FFFFFF'; g.lineWidth = 1.2;
          for(const b of [.7, 2.2, 3.7, 5.2]){ g.beginPath(); g.moveTo(rx + Math.cos(b) * 4, ry + Math.sin(b) * 4); g.lineTo(rx + Math.cos(b) * 9, ry + Math.sin(b) * 9); g.stroke(); } }
      }
    }
    // a agulha
    if(t >= ENTRA && t < PUXA + 240) desenhaAgulha(...agulha(t), giro(t));
    if(fechou !== null && t - fechou < 160){ const [x, y] = [xEm(meioY), meioY]; g.globalCompositeOperation = soma; brilho(x, y, 40, (1 - (t - fechou) / 160) * .8, .3); }
    if(tenso !== null) nome(t - tenso - 30, some);
    g.restore();
  }

  function desenhaAgulha(x, y, a){
    g.save(); g.translate(x, y); g.rotate(a); g.globalCompositeOperation = soma; g.globalAlpha = 1;
    if(!claro) brilho(0, 0, 20, .35, .2);
    g.globalCompositeOperation = 'source-over';
    g.beginPath(); g.moveTo(13, 0); g.quadraticCurveTo(2, -1.5, -11, -1.6); g.arc(-11, 0, 1.6, -Math.PI / 2, Math.PI / 2, true); g.quadraticCurveTo(2, 1.5, 13, 0); g.closePath();
    const lg = g.createLinearGradient(0, -2, 0, 2); lg.addColorStop(0, '#FFFFFF'); lg.addColorStop(.45, '#C9CED8'); lg.addColorStop(1, '#6E7484');
    g.fillStyle = lg; g.fill(); g.lineWidth = claro ? 1 : .6; g.strokeStyle = claro ? TINTA : '#2A2D3C'; g.stroke();
    g.beginPath(); g.ellipse(-8.6, 0, 1.6, .6, 0, 0, TAU); g.fillStyle = claro ? TINTA : '#0F1016'; g.fill();
    g.restore();
  }
  function nome(u, some){
    if(u < 0) return;
    const fs = lim(R.w * .09, 22, 30), a = (u > 900 ? Math.max(0, 1 - (u - 900) / 300) : 1) * some; if(a <= 0) return;
    const ls = [...NOME], tx = lim(R.x + R.w / 2, fs * 2.4, w - fs * 2.4), ty = Math.max(fs * .9, R.y - fs * .85) - Math.min(u, 1200) * .006;
    g.save(); g.translate(tx, ty); g.font = `${fs}px ${FONTE}`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.lineJoin = 'round';
    const ws = ls.map(c => g.measureText(c).width * 1.05), total = ws.reduce((x, y) => x + y, 0);
    let x = -total / 2;
    ls.forEach((c, i) => {
      const k = lim((u - i * 70) / 120, 0, 1); if(k <= 0){ x += ws[i]; return; }
      g.save(); g.translate(x + ws[i] / 2, letras[i].dy + (1 - suave(k)) * 6); g.rotate(letras[i].r); g.globalAlpha = a * k; g.globalCompositeOperation = 'source-over';
      if(!claro){ g.shadowColor = cor; g.shadowBlur = 10; }
      g.lineWidth = fs * .16; g.strokeStyle = claro ? '#FFFFFF' : TINTA; g.strokeText(c, 0, 0);
      g.fillStyle = claro ? TINTA : '#FFFFFF'; g.fillText(c, 0, 0);
            g.restore(); x += ws[i];
    });
    // um ponto de costura sob o nome, que corre com as letras
    const k = lim(u / (ls.length * 70 + 120), 0, 1); g.globalCompositeOperation = 'source-over';
    g.beginPath(); for(let i = 0; i <= 12 * k; i++){ const xx = -total / 2 + total * i / 12, yy = fs * .62 + (i % 2 ? 2 : -2); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
    fio(a, .9);
    g.restore();
  }
  const FIM = () => tenso === null ? ULTIMO + 2000 : tenso + 1500;
  const fase = t => t < ENTRA ? 'o card racha' : t < PRIMEIRO ? 'a agulha chega' : t < ULTIMO + 30 ? `costurando (${feitos} de ${n})` : tenso === null || t < tenso + 240 ? 'o fio é puxado' : t < FIM() - 450 ? 'cortado rente' : t < FIM() ? 'a costura se apaga' : '';
  return {quadro, fase, fim: FIM, poligonos, pivo: pv, get tenso(){ return tenso; }};
}

// o card de verdade em duas metades: o próprio el (esquerda) e uma cópia no mesmo pai (direita), cortados com clip-path
function parte(el, r, R, poligonos, pivo){
  const guarda = ['clipPath', 'translate', 'rotate', 'transformOrigin', 'willChange'].map(k => [k, el.style[k]]);
  const local = p => p.map(([x, y]) => `${(x - R.x).toFixed(1)}px ${(y - R.y).toFixed(1)}px`).join(',');
  const copia = el.cloneNode(true); copia.removeAttribute('id'); copia.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  copia.setAttribute('aria-hidden', 'true');
  Object.assign(copia.style, {position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: '0', boxSizing: 'border-box', pointerEvents: 'none'});
  el.after(copia);
  const r2 = copia.getBoundingClientRect();   // um pai com transform muda o fixed: corrige pelo que mediu
  copia.style.left = (2 * r.left - r2.left) + 'px'; copia.style.top = (2 * r.top - r2.top) + 'px';
  const origem = `${(pivo[0] - R.x).toFixed(1)}px ${(pivo[1] - R.y).toFixed(1)}px`;
  [el, copia].forEach((e, i) => { e.style.clipPath = `polygon(${local(poligonos[i])})`; e.style.transformOrigin = origem; e.style.willChange = 'translate, rotate'; });
  return {
    poe(ms){ [el, copia].forEach((e, i) => { e.style.translate = `${ms[i].x.toFixed(2)}px ${ms[i].y.toFixed(2)}px`; e.style.rotate = `${ms[i].a.toFixed(4)}rad`; }); },
    tira(){ copia.remove(); for(const [k, v] of guarda) el.style[k] = v; },
  };
}

function dispara(r, o = {}){
  const alvo = o.alvo || document.body, cam = camada(alvo), lento = o.lento || 1, el = o.el;
  const fundo = el && getComputedStyle(el).backgroundColor, R = {x: r.left - cam.ox, y: r.top - cam.oy, w: r.width, h: r.height};
  const fx = cria(cam.g, cam.w, cam.h, R, {cor: o.cor || FIO, claro: o.claro ?? fundoClaro(), fundo: fundo && !/rgba\(.*, 0\)$|transparent/.test(fundo) ? fundo : null}, sorteio(Math.random() * 4294967296));
  const metades = el ? parte(el, r, R, fx.poligonos, fx.pivo) : null;
  let t0 = null;
  const passo = now => {
    if(t0 === null) t0 = now;
    const t = (now - t0) / lento; fx.t = t;
    cam.g.clearRect(0, 0, cam.w, cam.h);
    fx.quadro(t, metades && metades.poe);
    if(t < fx.fim()) requestAnimationFrame(passo); else { cam.cv.remove(); if(metades) metades.tira(); fx.acabou = true; }
  };
  requestAnimationFrame(passo);
  return fx;
}

// a fonte japonesa (Dela Gothic One, só com as letras do nome), como no Jajanken
function fonte(){
  const f = `20px "Dela Gothic One"`;
  let l = document.getElementById('f-dela-costura');
  if(!l){ l = document.createElement('link'); l.id = 'f-dela-costura'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap&text=' + encodeURIComponent(NOME); document.head.append(l);
    l.pronto = new Promise(ok => { l.onload = l.onerror = ok; }); }
  return (l.pronto || Promise.resolve()).then(() => document.fonts && document.fonts.load(f, NOME)).catch(() => {});
}

// bancada: uma lista de tarefas na tela preta; clicar numa (ou espaço) conclui e dispara o efeito nela
const TAREFAS = ['Ler 20 páginas', 'Treinar 30 min', 'Responder os e-mails', 'Revisar os flashcards'];
function tarefas(palco, cfg, fx){
  const antes = palco.style.cssText, lista = document.createElement('div');
  palco.style.cursor = 'default';
  lista.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,86%);display:grid;gap:12px';
  const cards = TAREFAS.map(n => {
    const c = document.createElement('div'); c.innerHTML = `<i></i><span>${n}</span>`;
    c.style.cssText = 'position:relative;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:10px;border:1px solid;cursor:pointer;font:14px var(--f-ui)';
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
    setTimeout(() => { c.feito = false; c.firstChild.style.background = ''; c.lastChild.style.textDecoration = ''; pinta(); }, 3200 * cfg.lento);
  }
  const tecla = e => { if(e.code !== 'Space' || e.target.closest('input,button')) return; e.preventDefault(); const c = cards.find(c => !c.feito); if(c) conclui(c); };
  document.addEventListener('keydown', tecla);
  palco.append(lista); pinta(); fonte();
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); },
    estado: () => ({vezes, t: ultimo && ultimo.t, acabou: ultimo && ultimo.acabou}),
    legenda: () => `concluídas: ${vezes}` + (ultimo && !ultimo.acabou ? ' · ' + ultimo.fase(ultimo.t || 0) : ''),
    desliga(){ document.removeEventListener('keydown', tecla); lista.remove(); palco.querySelectorAll('canvas').forEach(c => c.remove()); palco.style.cssText = antes; },
  };
}
const liga = (palco, cfg) => tarefas(palco, cfg, (r, el) => dispara(r, {alvo: palco, el, claro: !!cfg.claro, lento: cfg.lento}));

// prévias paradas: seis momentos no escuro e os mesmos no claro (mesma semente); o card é desenhado e cortado aqui
const MOMENTOS = [[30, 'a rachadura'], [240, 'aberto'], [560, 'costurando'], [-1, 'o fio é puxado'], [-2, 'cortado rente'], [-3, 'a costura']];
function previas(el){
  const W = 300, H = 260, R = {x: 40, y: 140, w: 220, h: 48};
  const momento = (t, claro) => {
    const c = document.createElement('canvas'), d = devicePixelRatio || 1; c.className = 'prev';
    c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px';
    const g = c.getContext('2d'); g.scale(d, d);
    g.fillStyle = claro ? '#F2F3F7' : '#0F1016'; g.fillRect(0, 0, W, H);
    const card = document.createElement('canvas'); card.width = W * d; card.height = H * d;
    const k = card.getContext('2d'); k.scale(d, d);
    k.fillStyle = claro ? '#FFFFFF' : '#1B1D28'; k.strokeStyle = claro ? '#D9DCE5' : '#2A2D3C';
    k.beginPath(); k.roundRect(R.x, R.y, R.w, R.h, 10); k.fill(); k.stroke();
    k.strokeStyle = '#E0AF68'; k.lineWidth = 2; k.beginPath(); k.arc(R.x + 27, R.y + 24, 10, 0, 7); k.stroke();
    k.fillStyle = claro ? '#1B1D28' : '#E6E8F0'; k.font = '14px system-ui,sans-serif'; k.fillText('Ler 20 páginas', R.x + 48, R.y + 29);
    // os momentos negativos dependem do puxão (que vem da física): roda uma vez para achar a hora dele
    const sonda = cria(document.createElement('canvas').getContext('2d'), W, H, R, {cor: FIO, claro}, sorteio(11));
    let tt = 0; while(tt < 4000 && sonda.tenso === null){ tt += 10; sonda.quadro(tt); }
    tt = sonda.tenso ?? tt;
    const quando = t >= 0 ? t : t === -1 ? tt + 20 : t === -2 ? tt + 300 : tt + 650;
    const fx = cria(g, W, H, R, {cor: FIO, claro}, sorteio(11));
    fx.quadro(quando, ms => ms.forEach((m, i) => {
      g.save(); g.translate(fx.pivo[0] + m.x, fx.pivo[1] + m.y); g.rotate(m.a); g.translate(-fx.pivo[0], -fx.pivo[1]);
      g.beginPath(); fx.poligonos[i].forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
      g.drawImage(card, 0, 0, W, H); g.restore();
    }));
    return c;
  };
  el.innerHTML = [false, true].map(claro => `<section><h2>${claro ? 'no claro' : 'no escuro'}: ${MOMENTOS.map(x => x[1]).join(' · ')}</h2><div class="linha"></div></section>`).join('');
  const ls = el.querySelectorAll('.linha');
  fonte().then(() => [false, true].forEach((claro, i) => MOMENTOS.forEach(([t]) => ls[i].append(momento(t, claro)))));
}

(window.CURSORES = window.CURSORES || {}).costura = {dispara, liga, previas, cria,
  titulo: 'clique numa tarefa (ou aperte espaço) para concluir',
  dica: 'o card racha de verdade e se abre em duas metades; a agulha da Machi costura em zigue-zague, um ponto por vez, com fio de verdade<br>no fim o fio é puxado: o card fecha com um estalo, o fio vibra e é cortado rente; 念糸縫合 entra letra por letra<br>câmera lenta para ver os pontos',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
