// Efeito Jajanken do Gon (fx-jajanken: pedra, papel e tesoura), feito em código, sem imagem: dispara ao concluir uma tarefa.
// As três mãos são uma família: a carga, as linhas de foco e o grito são de todas; o golpe é de cada uma, e cada golpe é
// o tipo de nen que o Gon usa nela (no jogo a mão é sorteada a cada tarefa).
// "Saisho wa guu…": a carga. O nen do Gon é puxado de volta em espiral para um ponto no meio do card, que vira uma bola de
// aura cada vez maior e mais quente; as pedrinhas do chão em volta flutuam, e o card treme cada vez mais (430 ms). Então
// as linhas de foco do mangá piscam (como no anime) e o grito bate em letra japonesa de mangá (Dela Gothic One), com mola,
// e sobe sumindo: グー！ (guu, pedra), パー！ (paa, papel) ou チー！ (chii, tesoura).
//   pedra (reforço): o soco. Clarão, a estrela de impacto do mangá, uma onda de choque e a tela treme. O fundo racha em
//     volta do card: as rachaduras correm para fora brilhando com o nen que vaza delas e esfriam até ficar só o risco; as
//     pedrinhas e os cacos voam com física de verdade (gravidade, giro, quicam no chão e nas paredes e param).
//   papel (emissão): a aura sai da mão como uma bola, que voa em curva para o alto, de lado, deixando rastro, e explode
//     longe do card numa esfera de aura que incha e se desfaz, com a borda acesa, uma onda e brilhos que sobem flutuando.
//     O card leva o coice para o lado oposto ao tiro; as pedrinhas só são empurradas e caem.
//   tesoura (transformação): a aura vira lâmina. Um arco crescente corta o card em diagonal num instante e se desfaz pela
//     ponta de trás; o corte fica no card, uma linha reta que se abre em duas, acesa e depois fria; faíscas saem da ponta
//     da lâmina na direção do corte. O card sacode de lado; as pedrinhas caem.
// Cada golpe é contido de propósito, para não passar o Godspeed, que é mais caro.
//   CURSORES.jajanken.dispara(rect, {alvo: document.body, el: card, mao: 'pedra' | 'papel' | 'tesoura' (sem = sorteia),
//     claro: auto, cor: '#9BE15D', lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra, a tela inteira por padrão; el = o card, que treme;
//   claro = fundo claro, por padrão lido da cor do body; lento = câmera lenta)
//   CURSORES.jajanken.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas para concluir
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra (a mão começa pela do item aberto, ?id=fx-jajanken-MAO)
(() => {
const NEN = '#9BE15D', TINTA = '#0B0C10';
const CARGA = 430, FIM = 1150;   // ms: a carga dura 430 ms; depois do golpe, tudo some em 1150 ms
const VOO = 150, CORTE = 70;     // ms: o voo da bola do papel e a passada da lâmina da tesoura
const MAOS = {pedra: {grito: 'グー！', nome: 'guu! pedra', fim: 'pedras e rachaduras'}, papel: {grito: 'パー！', nome: 'paa! papel', fim: 'a bola explode longe'},
  tesoura: {grito: 'チー！', nome: 'chii! tesoura', fim: 'o corte fica no card'}};
const ORDEM = ['pedra', 'papel', 'tesoura'];   // o controle da bancada: 0 sorteia, 1 pedra, 2 papel, 3 tesoura
const DT = 1000 / 240, G = 2600, TAU = Math.PI * 2;
const FONTE = '"Dela Gothic One","Hiragino Kaku Gothic StdN","Yu Gothic",sans-serif';

const zero = (g, c) => { g.fillStyle = c; const v = g.fillStyle; if(v[0] !== '#') return v.replace(/[\d.]+\)$/, '0)'); const n = parseInt(v.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},0)`; };
const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
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

// uma pedra: polígono irregular, iluminado de cima à esquerda
const forma = (rnd, rr) => { const n = 5 + rnd() * 3 | 0; return Array.from({length: n}, (_, i) => { const a = i / n * TAU + (rnd() - .5) * .7, q = rr * (.65 + rnd() * .5); return [Math.cos(a) * q, Math.sin(a) * q]; }); };
function pedra(g, p, claro, cor, quente){
  g.save(); g.translate(p.x, p.y); g.rotate(p.a);
  g.beginPath(); p.f.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  const lg = g.createLinearGradient(-p.rr, -p.rr, p.rr, p.rr);
  lg.addColorStop(0, claro ? '#C9C0B2' : '#B8AFA3'); lg.addColorStop(1, claro ? '#6F665B' : '#5A544E');
  g.fillStyle = lg; g.fill();
  g.lineWidth = 1; g.strokeStyle = claro ? '#2B2620' : '#1A1714'; g.stroke();
  if(quente > 0){ g.lineWidth = 2; g.strokeStyle = cor; g.globalAlpha *= quente; g.stroke(); }
  g.restore();
}
// uma linha quebrada que mostra só até a distância d (a rachadura correndo para fora)
function risca(g, pts, d){
  g.beginPath(); let n = 0;
  for(const p of pts){ if(p[2] > d) break; n++ ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
  return n > 1;
}

// um golpe, numa tela w × h, no card R; quadro(t) avança a física até t (ms desde o começo), desenha e devolve o tremor.
// A carga, as linhas de foco e o grito são das três mãos; o resto é de cada uma (op.mao: pedra, papel ou tesoura)
function cria(g, w, h, R, op, rnd){
  const {cor, claro} = op, mao = MAOS[op.mao] ? op.mao : 'pedra', soma = claro ? 'source-over' : 'lighter', texto = op.grito || MAOS[mao].grito;
  const px = R.x + R.w / 2, py = R.y + R.h / 2;
  // a carga: o nen volta em espiral, cada fio com seu atraso
  const fios = Array.from({length: 60}, () => ({a: rnd() * TAU, r0: 110 + rnd() * 140, atraso: rnd() * 200, giro: 1.4 + rnd() * 1.6, lw: .8 + rnd() * 1.6}));
  const fio = (f, t) => { const q = lim((t - f.atraso) / (CARGA - f.atraso), 0, 1), r = f.r0 * (1 - Math.pow(q, 1.7)), a = f.a + f.giro * q; return [px + Math.cos(a) * r, py + Math.sin(a) * r, q]; };
  // pedrinhas que flutuam em volta do card na carga (nas três mãos); depois do golpe, cada mão faz uma coisa com elas
  const pedras = [];
  for(let i = 0; i < 5; i++){ const rr = 3 + rnd() * 4.5, x = R.x - 24 + rnd() * (R.w + 48), y = R.y + R.h + 8 + rnd() * 14;
    pedras.push({x, y, bx: x, by: y, vx: 0, vy: 0, a: rnd() * TAU, va: (rnd() - .5) * 2, rr, f: forma(rnd, rr), voa: false, sobe: 18 + rnd() * 22, fase: rnd() * TAU}); }
  const letras = [...texto].map(() => ({r: (rnd() - .5) * .22, dy: (rnd() - .5) * 8}));
  const focoSemente = rnd() * 1e9 | 0, luzes = [];   // luzes: pontos de nen soltos (faíscas da tesoura, brilhos do papel)

  // pedra: o soco racha o fundo em volta do card e solta cacos
  const cacos = mao !== 'pedra' ? [] : Array.from({length: 8}, () => { const rr = 2.5 + rnd() * 4.5; return {rr, f: forma(rnd, rr), a: rnd() * TAU, ang: rnd() * TAU, v: 320 + rnd() * 480, va: (rnd() - .5) * 26}; });
  const raios = [], aneis = [];
  if(mao === 'pedra'){
    const N = 9;
    for(let i = 0; i < N; i++){
      let a = i / N * TAU + (rnd() - .5) * .5, x = px + Math.cos(a) * 8, y = py + Math.sin(a) * 8, d = 8;
      const pts = [[x, y, d]], L = 45 + rnd() * 60; raios.push(pts);
      while(d < L){
        a += (rnd() - .5) * .55; const s = 8 + rnd() * 9; x += Math.cos(a) * s; y += Math.sin(a) * s; d += s; pts.push([x, y, d]);
        if(rnd() < .1){ let b = a + (rnd() < .5 ? -1 : 1) * (.5 + rnd() * .5), bx = x, by = y, bd = d; const br = [[bx, by, bd]], bl = d + 18 + rnd() * 32;
          while(bd < bl){ b += (rnd() - .5) * .5; const s2 = 6 + rnd() * 6; bx += Math.cos(b) * s2; by += Math.sin(b) * s2; bd += s2; br.push([bx, by, bd]); }
          aneis.push(br); }
      }
    }
    const em = (pts, d) => pts.find(p => p[2] >= d);
    for(const r of [22, 44]) for(let i = 0; i < N; i++){
      const p = em(raios[i], r), q = em(raios[(i + 1) % N], r * (.88 + rnd() * .24)); if(!p || !q || rnd() < .2) continue;
      const mx = (p[0] + q[0]) / 2 + (rnd() - .5) * 8, my = (p[1] + q[1]) / 2 + (rnd() - .5) * 8;
      aneis.push([[p[0], p[1], p[2]], [mx, my, p[2] + 4], [q[0], q[1], p[2] + 8]]);
    }
  }
  const estrela = Array.from({length: 36}, (_, i) => (i % 2 ? 26 + rnd() * 10 : 62 + rnd() * 46));

  // papel: a bola de aura sai da mão para o alto, de lado, e explode longe do card
  const lado = rnd() < .5 ? -1 : 1, aSai = -Math.PI / 2 + lado * (.35 + rnd() * .35), dist = 170 + rnd() * 60;
  const ex = lim(px + Math.cos(aSai) * dist, 60, w - 60), ey = lim(py + Math.sin(aSai) * dist, 60, h - 60);
  const bola = v => { const k = lim(v / VOO, 0, 1), e = 1 - Math.pow(1 - k, 1.6), cx = (ex - px) * e, cy = (ey - py) * e;
    const o = Math.sin(k * Math.PI) * 18 * lado;   // a bola faz uma curva leve, não uma reta
    return [px + cx - Math.sin(aSai) * o, py + cy + Math.cos(aSai) * o]; };

  // tesoura: a lâmina corta o card em diagonal, num arco crescente que nasce e se desfaz
  const th = (rnd() < .5 ? 1 : -1) * (.32 + rnd() * .2), corda = lim(R.w * 1.1, 220, 380), curva = rnd() < .5 ? 1 : -1;
  const nx = -Math.sin(th) * curva, ny = Math.cos(th) * curva;
  const lamina = (s, dentro = 0) => { const q = (s - .5) * corda, b = corda * .12 * 4 * s * (1 - s) - dentro;
    return [px + Math.cos(th) * q + nx * b, py + Math.sin(th) * q + ny * b]; };

  let sim = 0, bateu = false, explodiu = false;
  function fisica(){
    const t = sim, dt = DT / 1000, u = t - CARGA;
    if(u >= 0 && !bateu){
      bateu = true;
      for(const p of pedras){ const dx = p.x - px, dy = p.y - py, d = Math.hypot(dx, dy) || 1;
        // pedra: arremessadas; papel: empurradas pelo coice; tesoura: só caem
        const v = mao === 'pedra' ? 520 + 260 * rnd() : mao === 'papel' ? 120 + 80 * rnd() : 0;
        p.voa = true; p.vx = dx / d * v + (mao === 'tesoura' ? (rnd() - .5) * 60 : 0); p.vy = dy / d * v - (mao === 'pedra' ? 420 : mao === 'papel' ? 120 : 0); p.va = (rnd() - .5) * (mao === 'pedra' ? 20 : 6); }
      for(const c of cacos) pedras.push({x: px + Math.cos(c.ang) * 6, y: py + Math.sin(c.ang) * 6, vx: Math.cos(c.ang) * c.v, vy: Math.sin(c.ang) * c.v - 300,
        a: c.a, va: c.va, rr: c.rr, f: c.f, voa: true});
    }
    if(mao === 'papel' && u >= VOO && !explodiu){
      explodiu = true;
      for(let i = 0; i < 30; i++){ const a = rnd() * TAU, v = 70 + rnd() * 240; luzes.push({x: ex, y: ey, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: .5 + rnd() * .6, idade: 0, sobe: 1, r: 1.5 + rnd() * 1.8}); }
    }
    if(mao === 'tesoura' && u >= 0 && u < CORTE){   // faíscas que saem da ponta da lâmina, na direção do corte
      for(let i = 0; i < 2; i++){
        const s = lim(u / CORTE, 0, 1), [x0, y0] = lamina(s), [x1, y1] = lamina(Math.min(1, s + .02)), tg = Math.atan2(y1 - y0, x1 - x0) + (rnd() - .5) * .7, v = 380 + rnd() * 520;
        luzes.push({x: x0, y: y0, vx: Math.cos(tg) * v, vy: Math.sin(tg) * v, vida: .22 + rnd() * .3, idade: 0, sobe: 0, r: 1.2 + rnd()});
      }
    }
    for(const l of luzes){ l.idade += dt; const ar = Math.exp(-(l.sobe ? 3.2 : 2.2) * dt); l.vx *= ar; l.vy *= ar; l.vy += (l.sobe ? -70 : 900) * dt; l.x += l.vx * dt; l.y += l.vy * dt; }
    for(const p of pedras){
      if(!p.voa){ const q = Math.pow(lim(t / CARGA, 0, 1), 1.3); p.x = p.bx + Math.sin(t / 90 + p.fase) * 1.5 * q; p.y = p.by - p.sobe * q + Math.sin(t / 70 + p.fase) * 1.2 * q; p.a += p.va * dt * q; continue; }
      p.vy += G * dt; p.vx *= .998; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
      const chao = h - p.rr;
      if(p.y > chao){ p.y = chao; if(p.vy > 0){ p.vy *= -.36; p.vx *= .72; p.va = p.vx / p.rr * .6; } if(Math.abs(p.vy) < 50){ p.vy = 0; p.vx *= .9; p.va *= .9; } }
      if(p.x < p.rr && p.vx < 0 || p.x > w - p.rr && p.vx > 0){ p.vx *= -.5; p.x = lim(p.x, p.rr, w - p.rr); }
    }
  }
  const traca = camadas => { for(const [lw, c, a] of camadas){ if(a <= 0) continue; g.lineWidth = lw; g.strokeStyle = c; g.globalAlpha = Math.min(1, a); g.stroke(); } };
  const brilho = (x, y, r, a, meio = .3) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(meio, cor); rg.addColorStop(1, zero(g, cor));
    g.globalAlpha = a; g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
  const onda = (x, y, v, alcance, grossa) => {
    if(v < 0 || v > 520) return; const k = v / 520, r = 30 + alcance * (1 - Math.exp(-v / 120)), lw = grossa * (1 - k) + 1;
    g.beginPath(); g.arc(x, y, r, 0, TAU);
    if(claro){ g.globalCompositeOperation = 'source-over'; traca([[lw + 2, TINTA, .35 * (1 - k)]]); }
    g.globalCompositeOperation = soma; traca([[lw, cor, 1 - k]]);
  };

  function quadro(t){
    while(sim + DT <= t){ sim += DT; fisica(); }
    const u = t - CARGA;
    let dx = 0, dy = 0;
    g.save(); g.lineJoin = g.lineCap = 'round';
    if(u < 0){
      // a carga: fios de nen em espiral e a bola de aura crescendo
      const q = t / CARGA, amp = 1.8 * q * q;
      dx = (rnd() - .5) * 2 * amp; dy = (rnd() - .5) * 2 * amp;
      g.globalCompositeOperation = soma;
      for(const f of fios){   // cada fio é um rastro curvo: a cauda mais longa e fraca, a cabeça curta e forte
        const k = fio(f, t)[2]; if(k <= 0 || k >= 1) continue;
        const a = Math.min(1, k * 3);
        for(const [atras, lw, al] of [[90, f.lw, .35 * a], [35, f.lw * 1.3, a]]){
          g.beginPath(); for(let i = 0; i <= 6; i++){ const [x, y] = fio(f, t - atras * (1 - i / 6)); i ? g.lineTo(x, y) : g.moveTo(x, y); }
          if(claro){ g.globalCompositeOperation = 'source-over'; traca([[lw + 2, TINTA, .3 * al]]); }
          g.globalCompositeOperation = soma; traca([[lw, k > .85 ? '#FFFFFF' : cor, al]]);
        }
      }
      const rr = 3 + 14 * q * q + Math.sin(t / 22) * 1.3 * q;
      g.globalCompositeOperation = soma; brilho(px, py, rr * 3, .4 + .6 * q);
    } else {
      const some = u < 820 ? 1 : Math.max(0, 1 - (u - 820) / 330);
      // o tremor: o soco empurra para baixo, o papel dá um coice para o lado oposto ao tiro, a tesoura sacode de lado
      const ap = Math.exp(-u / 80);
      if(mao === 'pedra'){ dx = 3 * ap * Math.sin(TAU * u / 45); dy = 7 * ap * Math.cos(TAU * u / 60); }
      else if(mao === 'papel'){ const c = 7 * Math.exp(-u / 110) * Math.cos(TAU * u / 220); dx = -Math.cos(aSai) * c; dy = -Math.sin(aSai) * c; }
      else { dx = 6 * Math.exp(-u / 70) * Math.sin(TAU * u / 50); }
      // linhas de foco do mangá (as três mãos), sorteadas de novo a cada 40 ms
      if(u < 320){
        const fr = sorteio(focoSemente + (u / 40 | 0)), k = 1 - u / 320, fora = Math.hypot(w, h);
        g.globalAlpha = (claro ? .55 : .32) * k; g.fillStyle = claro ? '#111111' : '#FFFFFF';
        for(let i = 0; i < 72; i++){
          const a = fr() * TAU, rin = 120 + fr() * 120, hw = .003 + fr() * .011;
          g.beginPath(); g.moveTo(px + Math.cos(a) * rin, py + Math.sin(a) * rin);
          g.lineTo(px + Math.cos(a - hw) * fora, py + Math.sin(a - hw) * fora); g.lineTo(px + Math.cos(a + hw) * fora, py + Math.sin(a + hw) * fora); g.fill();
        }
      }
      if(mao === 'pedra') golpePedra(u, some);
      else if(mao === 'papel') golpePapel(u, some);
      else golpeTesoura(u, some);
      // luzes de nen soltas: riscos curtos do tamanho da velocidade
      g.globalCompositeOperation = soma;
      for(const l of luzes){
        const k = 1 - l.idade / l.vida; if(k <= 0) continue;
        g.beginPath(); g.moveTo(l.x - l.vx * .02, l.y - l.vy * .02); g.lineTo(l.x, l.y);
        if(claro){ g.globalCompositeOperation = 'source-over'; traca([[l.r * 2 + 1.5, TINTA, .5 * k]]); g.globalCompositeOperation = soma; }
        traca([[l.r * 2, k > .6 ? '#FFFFFF' : cor, k]]);
      }
    }
    // as pedrinhas, esquentadas pelo nen
    g.globalCompositeOperation = 'source-over';
    const quente = u < 0 ? .5 * Math.max(0, t / CARGA) : Math.exp(-u / 260);
    for(const p of pedras){ g.globalAlpha = u < 820 ? 1 : Math.max(0, 1 - (u - 820) / 330); pedra(g, p, claro, cor, quente); }
    if(u >= 0) grito(u);
    g.restore();
    return [dx, dy];
  }

  function golpePedra(u, some){
    const brasa = Math.exp(-u / 240), corre = 2600 * u / 1000;
    // as rachaduras correm para fora em ~40 ms, quentes de nen, e esfriam; afinam para fora
    for(const [pts, lw] of [...raios.map(p => [p, 1.6]), ...aneis.map(p => [p, .9])]){
      for(const [ate, k] of [[corre, 1], [Math.min(corre, pts[0][2] + 60), 1.9]]){
        if(!risca(g, pts, ate)) continue;
        const l = lw * k;
        g.globalCompositeOperation = soma; traca([[l + 2.5, cor, .45 * brasa * some]]);
        g.globalCompositeOperation = 'source-over';
        traca([[l, claro ? '#1E1A14' : '#000000', (claro ? .85 : .7) * some * (1 - brasa * .7)]]);
        g.globalCompositeOperation = soma; traca([[l * .6, '#FFFFFF', brasa * some]]);
        if(!claro){ g.globalCompositeOperation = 'source-over'; g.save(); g.translate(.7, .7); traca([[.6, '#FFFFFF', .14 * some * (1 - brasa)]]); g.restore(); }
      }
    }
    onda(px, py, u, 220, 7);
    g.globalCompositeOperation = soma;
    if(u < 100) brilho(px, py, 110, 1 - u / 100, .4);
    if(u < 170){   // a estrela de impacto
      const k = u / 170, sc = .55 + .9 * Math.sqrt(k);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1 - k * k;
      g.beginPath(); estrela.forEach((r, i) => { const a = i / estrela.length * TAU; g[i ? 'lineTo' : 'moveTo'](px + Math.cos(a) * r * sc, py + Math.sin(a) * r * sc); }); g.closePath();
      g.fillStyle = '#FFFFFF'; g.fill(); g.lineWidth = claro ? 2.5 : 3; g.strokeStyle = claro ? '#111111' : cor; g.stroke();
    }
  }

  function golpePapel(u, some){
    g.globalCompositeOperation = soma;
    if(u < 90) brilho(px, py, 70, 1 - u / 90, .35);   // o clarão na mão, no tiro
    if(u < VOO){
      // a bola voando, com o rastro que afina para trás
      for(let i = 8; i >= 0; i--){ const [x, y] = bola(u - i * 9), r = 15 * (1 - i / 10); brilho(x, y, r * 2.4, (1 - i / 9) * .7 + .3, .32); }
      const [x, y] = bola(u);
      if(claro){ g.globalCompositeOperation = 'source-over'; g.beginPath(); g.arc(x, y, 15, 0, TAU); traca([[2, TINTA, .7]]); g.globalCompositeOperation = soma; }
      return;
    }
    // a explosão, longe do card: uma esfera de aura que incha e se desfaz, com a borda acesa e uma onda
    const e = u - VOO, k = Math.min(1, e / 520), rs = 16 + 58 * (1 - Math.exp(-e / 90));
    if(e < 80) brilho(ex, ey, 90, 1 - e / 80, .3);
    brilho(ex, ey, rs, (1 - k) * .85 * some, .45);
    g.beginPath(); g.arc(ex, ey, rs * .92, 0, TAU);
    if(claro){ g.globalCompositeOperation = 'source-over'; traca([[4.5 * (1 - k) + 2, TINTA, .45 * (1 - k)]]); g.globalCompositeOperation = soma; }
    traca([[4 * (1 - k) + .5, cor, (1 - k) * some], [1.4 * (1 - k), '#FFFFFF', (1 - k) * some]]);
    onda(ex, ey, e - 30, 120, 5);
  }

  function golpeTesoura(u, some){
    // a lâmina: arco crescente que corre de uma ponta à outra em CORTE ms e se desfaz pela ponta de trás
    const cab = lim(u / CORTE, 0, 1), cau = lim((u - 110) / 220, 0, 1);
    if(cau < cab){
      // a grossura vai pela parte visível: fina na cauda, mais grossa perto da cabeça, que termina em ponta
      const N = 44, ss = Array.from({length: N + 1}, (_, i) => cau + (cab - cau) * i / N);
      const gr = i => { const q = i / N; return 11 * Math.pow(q, 1.3) * Math.pow(1 - q, .3) * 1.7 * Math.min(1, (cab - cau) * 4); };
      const forma = (larga) => { g.beginPath(); ss.forEach((s, i) => { const [x, y] = lamina(s); g[i ? 'lineTo' : 'moveTo'](x, y); });
        for(let i = N; i >= 0; i--){ const [x, y] = lamina(ss[i], gr(i) * larga); g.lineTo(x, y); } g.closePath(); };
      g.globalCompositeOperation = soma;
      forma(2.2); g.fillStyle = cor; g.globalAlpha = .35 * some; g.fill();
      forma(1); if(claro){ g.globalCompositeOperation = 'source-over'; traca([[2.2, TINTA, .85]]); } g.fillStyle = '#FFFFFF'; g.globalAlpha = some; g.fill();
      g.globalCompositeOperation = soma; forma(.35); g.fillStyle = cor; g.globalAlpha = .6 * some; g.fill();
    }
    // o corte que fica no card: uma linha reta e fina que se abre em duas, acesa e depois fria
    if(u > 50){
      const v = u - 50, abre = 1.6 * Math.min(1, v / 140), acesa = Math.exp(-v / 260), [x0, y0] = lamina(.06), [x1, y1] = lamina(.94);
      const ox = -Math.sin(th) * abre, oy = Math.cos(th) * abre;
      for(const s of [-1, 1]){
        g.beginPath(); g.moveTo(x0 + ox * s, y0 + oy * s); g.lineTo(x1 + ox * s, y1 + oy * s);
        g.globalCompositeOperation = soma; traca([[4, cor, .5 * acesa * some]]);
        g.globalCompositeOperation = 'source-over'; traca([[1.1, claro ? TINTA : '#FFFFFF', (claro ? .8 : .55 + .45 * acesa) * some]]);
      }
    }
    if(u < 80){ g.globalCompositeOperation = soma; const [x, y] = lamina(cab); brilho(x, y, 46, 1 - u / 80, .3); }
  }

  function grito(u){
    const fs = lim(R.w * .15, 34, 54), sc = Math.max(.3, 1 + 1.6 * Math.exp(-u / 60) * Math.cos(TAU * u / 170));
    const sobe = u > 700 ? (u - 700) * .06 : 0, a = u > 700 ? Math.max(0, 1 - (u - 700) / 420) : 1; if(a <= 0) return;
    const treme = u < 150 ? (1 - u / 150) * 6 : 0;
    const tx = lim(px, fs * 2.2, w - fs * 2.2) + (Math.random() - .5) * treme, ty = Math.max(fs * .95, R.y - fs * .6) - sobe + (Math.random() - .5) * treme;
    g.save(); g.translate(tx, ty); g.rotate(-.1); g.scale(sc, sc); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    g.font = `${fs}px ${FONTE}`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.lineJoin = 'round';
    const ls = [...texto], ws = ls.map(c => g.measureText(c).width * .98), total = ws.reduce((s, x) => s + x, 0);
    const lg = g.createLinearGradient(0, -fs / 2, 0, fs / 2); lg.addColorStop(0, '#FFFFFF'); lg.addColorStop(.35, cor); lg.addColorStop(1, cor);
    for(const [lw, st] of [[fs * .34, '#FFFFFF'], [fs * .2, TINTA], [0, lg]]){
      let x = -total / 2;
      ls.forEach((c, i) => {
        g.save(); g.translate(x + ws[i] / 2, letras[i].dy); g.rotate(letras[i].r);
        if(lw){ g.lineWidth = lw; g.strokeStyle = st; g.strokeText(c, 0, 0); } else { g.fillStyle = st; g.fillText(c, 0, 0); }
        g.restore(); x += ws[i];
      });
    }
    g.restore();
  }
  const fase = t => t < CARGA ? 'saisho wa guu… (carga)' : t < CARGA + 320 ? MAOS[mao].nome + ' (o golpe)' : t < CARGA + FIM ? MAOS[mao].fim : '';
  return {quadro, fase, mao};
}

function dispara(r, o = {}){
  const alvo = o.alvo || document.body, cam = camada(alvo), lento = o.lento || 1, el = o.el, antes = el ? el.style.translate : '';
  const fx = cria(cam.g, cam.w, cam.h, {x: r.left - cam.ox, y: r.top - cam.oy, w: r.width, h: r.height},
    {cor: o.cor || NEN, claro: o.claro ?? fundoClaro(), mao: MAOS[o.mao] ? o.mao : ORDEM[Math.random() * 3 | 0]}, sorteio(Math.random() * 4294967296));
  let t0 = null;
  const passo = now => {
    if(t0 === null) t0 = now;
    const t = (now - t0) / lento; fx.t = t;
    cam.g.clearRect(0, 0, cam.w, cam.h);
    const [dx, dy] = fx.quadro(t);
    if(el) el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    cam.cv.style.translate = t > CARGA ? `${(dx * .5).toFixed(1)}px ${(dy * .5).toFixed(1)}px` : '';   // a tela treme junto, menos
    if(t < CARGA + FIM) requestAnimationFrame(passo); else { cam.cv.remove(); if(el) el.style.translate = antes; fx.acabou = true; }
  };
  requestAnimationFrame(passo);
  return fx;
}

// a fonte japonesa (Dela Gothic One, do Google Fonts, como a DotGothic16 do jogo): vem com a página, então funciona mesmo
// sem fonte japonesa instalada; o jogo precisa pôr a família no <link> do index.html
function fonte(){
  const f = `20px "Dela Gothic One"`, txt = 'グーパーチー！PEDRAPAPELTESOURA';
  let l = document.getElementById('f-dela');
  if(!l){ l = document.createElement('link'); l.id = 'f-dela'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap&text=' + encodeURIComponent(txt); document.head.append(l);   // só as letras dos gritos: um arquivo pequeno, com o katakana junto
    l.pronto = new Promise(ok => { l.onload = l.onerror = ok; }); }
  return (l.pronto || Promise.resolve()).then(() => document.fonts && document.fonts.load(f, txt)).catch(() => {});
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
    setTimeout(() => { c.feito = false; c.firstChild.style.background = ''; c.lastChild.style.textDecoration = ''; pinta(); }, 2600 * cfg.lento);
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
const liga = (palco, cfg) => tarefas(palco, cfg, (r, el) => dispara(r, {alvo: palco, el, mao: ORDEM[cfg.mao - 1], claro: !!cfg.claro, cor: cfg.cor, lento: cfg.lento}));

// prévias paradas: cada mão em quatro momentos no escuro (mesma semente), e a escolhida no controle também no claro
const MOMENTOS = {pedra: [[CARGA * .75, 'a carga'], [CARGA + 40, 'o soco'], [CARGA + 180, 'rachaduras e cacos'], [CARGA + 560, 'esfriando']],
  papel: [[CARGA + 70, 'a bola voando'], [CARGA + VOO + 40, 'explode'], [CARGA + VOO + 200, 'a esfera se desfaz'], [CARGA + 640, 'brilhos subindo']],
  tesoura: [[CARGA + 40, 'a lâmina corta'], [CARGA + 130, 'se desfaz'], [CARGA + 300, 'o corte se abre'], [CARGA + 640, 'esfriando']]};
function previas(el, cfg){
  const W = 300, H = 260, R = {x: 40, y: 120, w: 220, h: 48};
  const momento = (mao, t, claro, semente) => {
    const c = document.createElement('canvas'), d = devicePixelRatio || 1; c.className = 'prev';
    c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px';
    const g = c.getContext('2d'); g.scale(d, d);
    g.fillStyle = claro ? '#F2F3F7' : '#0F1016'; g.fillRect(0, 0, W, H);
    g.fillStyle = claro ? '#FFFFFF' : '#1B1D28'; g.strokeStyle = claro ? '#D9DCE5' : '#2A2D3C';
    g.beginPath(); g.roundRect(R.x, R.y, R.w, R.h, 10); g.fill(); g.stroke();
    g.strokeStyle = '#E0AF68'; g.lineWidth = 2; g.beginPath(); g.arc(R.x + 27, R.y + 24, 10, 0, 7); g.stroke();
    g.fillStyle = claro ? '#1B1D28' : '#E6E8F0'; g.font = '14px system-ui,sans-serif'; g.fillText('Ler 20 páginas', R.x + 48, R.y + 29);
    cria(g, W, H, R, {cor: cfg.cor || NEN, claro, mao}, sorteio(semente)).quadro(t);
    return c;
  };
  const esc = ORDEM[cfg.mao - 1] || 'pedra', linhas = [...ORDEM.map(m => [m, false]), [esc, true]];
  el.innerHTML = linhas.map(([m, claro]) => `<section><h2>${MAOS[m].nome}${claro ? ', no claro' : ''}: ${MOMENTOS[m].map(x => x[1]).join(' · ')}</h2><div class="linha"></div></section>`).join('');
  const ls = el.querySelectorAll('.linha');
  fonte().then(() => linhas.forEach(([m, claro], i) => MOMENTOS[m].forEach(([t]) => ls[i].append(momento(m, t, claro, 11)))));
}

(window.CURSORES = window.CURSORES || {}).jajanken = {dispara, liga, previas, cria,
  titulo: 'clique numa tarefa (ou aperte espaço) para concluir',
  dica: 'as três mãos: o nen volta em espiral para o card (as pedrinhas flutuam), linhas de foco e o grito em japonês<br>pedra: soco, o fundo racha e as pedras voam · papel: a bola de aura voa e explode longe · tesoura: a lâmina corta o card<br>mão: 0 sorteia (como no jogo) · câmera lenta para ver o golpe',
  controles: [{k: 'mao', rot: 'mão (1 pedra · 2 papel · 3 tesoura · 0 sorteia)', min: 0, max: 3, un: '', padrao: {papel: 2, tesoura: 3}[(new URLSearchParams(location.search).get('id') || '').replace('fx-jajanken-', '')] || 1},
    {k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
