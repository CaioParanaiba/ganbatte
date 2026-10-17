// Efeito Jajanken, pedra (fx-jajanken-pedra), do Gon, feito em código, sem imagem: dispara ao concluir uma tarefa.
// "Saisho wa guu…": primeiro a carga. O nen do Gon é puxado de volta em espiral para um ponto no meio do card, que vira uma
// bola de aura cada vez maior e mais quente; as pedrinhas do chão em volta flutuam, e o card treme cada vez mais (430 ms).
// "…GUU!": o soco. Clarão, a estrela de impacto do mangá, duas ondas de choque, as linhas de foco do mangá (piscando, como
// no anime) e a tela treme. O soco racha o fundo em teia: as rachaduras correm do ponto para fora, brilhando com o nen que
// vaza delas, e esfriam até ficar só o risco. As pedrinhas que flutuavam e os cacos do soco voam com física de verdade
// (gravidade, giro, quicam no chão e nas paredes e param), com poeira. O "PEDRA!" bate em letra de mangá, com mola, e sobe
// sumindo. As outras mãos do Jajanken (papel e tesoura) virão no mesmo esquema.
//   CURSORES.jajanken.dispara(rect, {alvo: document.body, el: card, claro: auto, cor: '#9BE15D', texto: 'PEDRA!', lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra, a tela inteira por padrão; el = o card, que treme;
//   claro = fundo claro, por padrão lido da cor do body; lento = câmera lenta)
//   CURSORES.jajanken.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas para concluir
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const NEN = '#9BE15D', TINTA = '#0B0C10';
const CARGA = 430, FIM = 1150;   // ms: a carga dura 430 ms; depois do soco, tudo some em 1150 ms
const DT = 1000 / 240, G = 2600, TAU = Math.PI * 2;
const FONTE = 'Bangers,Impact,"Arial Black",sans-serif';

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

// um soco, numa tela w × h, no card R; quadro(t) avança a física até t (ms desde o começo), desenha e devolve o tremor
function cria(g, w, h, R, op, rnd){
  const {cor, claro} = op, soma = claro ? 'source-over' : 'lighter', texto = op.texto || 'PEDRA!';
  const px = R.x + R.w / 2, py = R.y + R.h / 2;
  // a carga: o nen volta em espiral, cada fio com seu atraso
  const fios = Array.from({length: 60}, () => ({a: rnd() * TAU, r0: 110 + rnd() * 140, atraso: rnd() * 200, giro: 1.4 + rnd() * 1.6, lw: .8 + rnd() * 1.6}));
  const fio = (f, t) => { const q = lim((t - f.atraso) / (CARGA - f.atraso), 0, 1), r = f.r0 * (1 - Math.pow(q, 1.7)), a = f.a + f.giro * q; return [px + Math.cos(a) * r, py + Math.sin(a) * r, q]; };
  // pedras: as que flutuam em volta do card na carga e os cacos que saem do soco
  const pedras = [];
  for(let i = 0; i < 8; i++){ const rr = 3 + rnd() * 5, x = R.x - 24 + rnd() * (R.w + 48), y = R.y + R.h + 8 + rnd() * 14;
    pedras.push({x, y, bx: x, by: y, vx: 0, vy: 0, a: rnd() * TAU, va: (rnd() - .5) * 2, rr, f: forma(rnd, rr), voa: false, sobe: 18 + rnd() * 22, fase: rnd() * TAU}); }
  const cacos = Array.from({length: 16}, () => { const rr = 2.5 + rnd() * 5.5; return {rr, f: forma(rnd, rr), a: rnd() * TAU, ang: rnd() * TAU, v: 380 + rnd() * 620, va: (rnd() - .5) * 26}; });
  // a teia de rachaduras: raios que correm para fora e anéis tortos ligando os vizinhos
  const raios = [], aneis = [], N = 9;
  for(let i = 0; i < N; i++){
    let a = i / N * TAU + (rnd() - .5) * .5, x = px + Math.cos(a) * 8, y = py + Math.sin(a) * 8, d = 8;
    const pts = [[x, y, d]], L = 90 + rnd() * 140; raios.push(pts);
    while(d < L){
      a += (rnd() - .5) * .55; const s = 8 + rnd() * 9; x += Math.cos(a) * s; y += Math.sin(a) * s; d += s; pts.push([x, y, d]);
      if(rnd() < .1){ let b = a + (rnd() < .5 ? -1 : 1) * (.5 + rnd() * .5), bx = x, by = y, bd = d; const br = [[bx, by, bd]], bl = d + 18 + rnd() * 32;
        while(bd < bl){ b += (rnd() - .5) * .5; const s2 = 6 + rnd() * 6; bx += Math.cos(b) * s2; by += Math.sin(b) * s2; bd += s2; br.push([bx, by, bd]); }
        aneis.push(br); }
    }
  }
  const em = (pts, d) => pts.find(p => p[2] >= d);
  for(const r of [26, 56, 94]) for(let i = 0; i < N; i++){
    const p = em(raios[i], r), q = em(raios[(i + 1) % N], r * (.88 + rnd() * .24)); if(!p || !q || rnd() < .2) continue;
    const mx = (p[0] + q[0]) / 2 + (rnd() - .5) * 8, my = (p[1] + q[1]) / 2 + (rnd() - .5) * 8;
    aneis.push([[p[0], p[1], p[2]], [mx, my, p[2] + 4], [q[0], q[1], p[2] + 8]]);
  }
  const estrela = Array.from({length: 36}, (_, i) => (i % 2 ? 26 + rnd() * 10 : 62 + rnd() * 46));
  const poeira = Array.from({length: 10}, () => { const a = rnd() * TAU, v = 50 + rnd() * 120; return {a, v, r0: 10 + rnd() * 10}; });
  const letras = [...texto].map(() => ({r: (rnd() - .5) * .22, dy: (rnd() - .5) * 8}));
  const focoSemente = rnd() * 1e9 | 0;

  let sim = 0, socou = false;
  function fisica(){
    const t = sim, dt = DT / 1000;
    if(t >= CARGA && !socou){
      socou = true;
      for(const p of pedras){ const dx = p.x - px, dy = p.y - py, d = Math.hypot(dx, dy) || 1, v = 520 + 260 * rnd();
        p.voa = true; p.vx = dx / d * v; p.vy = dy / d * v - 420; p.va = (rnd() - .5) * 20; }
      for(const c of cacos) pedras.push({x: px + Math.cos(c.ang) * 6, y: py + Math.sin(c.ang) * 6, vx: Math.cos(c.ang) * c.v, vy: Math.sin(c.ang) * c.v - 300,
        a: c.a, va: c.va, rr: c.rr, f: c.f, voa: true, caco: true});
    }
    for(const p of pedras){
      if(!p.voa){ const q = Math.pow(lim(t / CARGA, 0, 1), 1.3); p.x = p.bx + Math.sin(t / 90 + p.fase) * 1.5 * q; p.y = p.by - p.sobe * q + Math.sin(t / 70 + p.fase) * 1.2 * q; p.a += p.va * dt * q; continue; }
      p.vy += G * dt; p.vx *= .998; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
      const chao = h - p.rr;
      if(p.y > chao){ p.y = chao; if(p.vy > 0){ p.vy *= -.36; p.vx *= .72; p.va = p.vx / p.rr * .6; } if(Math.abs(p.vy) < 50){ p.vy = 0; p.vx *= .9; p.va *= .9; } }
      if(p.x < p.rr && p.vx < 0 || p.x > w - p.rr && p.vx > 0){ p.vx *= -.5; p.x = lim(p.x, p.rr, w - p.rr); }
    }
  }
  const traca = camadas => { for(const [lw, c, a] of camadas){ if(a <= 0) continue; g.lineWidth = lw; g.strokeStyle = c; g.globalAlpha = Math.min(1, a); g.stroke(); } };

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
      const rr = 3 + 14 * q * q + Math.sin(t / 22) * 1.3 * q, rg = g.createRadialGradient(px, py, 0, px, py, rr * 3);
      rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(.3, cor); rg.addColorStop(1, zero(g, cor));
      g.globalAlpha = .4 + .6 * q; g.fillStyle = rg; g.beginPath(); g.arc(px, py, rr * 3, 0, TAU); g.fill();
    } else {
      // o tremor do soco: mola que apaga
      dx = 3 * Math.exp(-u / 80) * Math.sin(TAU * u / 45); dy = 7 * Math.exp(-u / 80) * Math.cos(TAU * u / 60);
      const brasa = Math.exp(-u / 240), some = u < 820 ? 1 : Math.max(0, 1 - (u - 820) / 330);
      // linhas de foco do mangá, sorteadas de novo a cada 40 ms
      if(u < 320){
        const fr = sorteio(focoSemente + (u / 40 | 0)), k = 1 - u / 320, fora = Math.hypot(w, h);
        g.globalAlpha = (claro ? .55 : .32) * k; g.fillStyle = claro ? '#111111' : '#FFFFFF';
        for(let i = 0; i < 72; i++){
          const a = fr() * TAU, rin = 120 + fr() * 120, hw = .003 + fr() * .011;
          g.beginPath(); g.moveTo(px + Math.cos(a) * rin, py + Math.sin(a) * rin);
          g.lineTo(px + Math.cos(a - hw) * fora, py + Math.sin(a - hw) * fora); g.lineTo(px + Math.cos(a + hw) * fora, py + Math.sin(a + hw) * fora); g.fill();
        }
      }
      // as rachaduras: correm para fora em ~90 ms, quentes de nen, e esfriam
      const corre = 2600 * u / 1000;
      for(const [pts, lw] of [...raios.map(p => [p, 1.6]), ...aneis.map(p => [p, .9])]){
        // duas passadas: a rachadura inteira fina, e a parte de dentro mais grossa (afina para fora)
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
      // poeira
      g.globalCompositeOperation = 'source-over';
      for(const p of poeira){
        const s = 1 - Math.exp(-u / 300), x = px + Math.cos(p.a) * p.v * s * .9, y = py + Math.sin(p.a) * p.v * s * .9 - 30 * s, r = p.r0 + 40 * s;
        const rg = g.createRadialGradient(x, y, 0, x, y, r); const pc = claro ? '#B3AA9C' : '#6E6A72'; rg.addColorStop(0, pc); rg.addColorStop(1, zero(g, pc));
        g.globalAlpha = .28 * Math.max(0, 1 - u / 900); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
      // ondas de choque
      g.globalCompositeOperation = soma;
      for(const [atraso, peso] of [[0, 1], [70, .6]]){
        const v = u - atraso; if(v < 0 || v > 520) continue;
        const k = v / 520, r = 30 + 300 * (1 - Math.exp(-v / 120));
        g.beginPath(); g.arc(px, py, r, 0, TAU);
        if(claro){ g.globalCompositeOperation = 'source-over'; traca([[(7 * peso * (1 - k) + 1) + 2, TINTA, .35 * (1 - k) * peso]]); }
        traca([[7 * peso * (1 - k) + 1, cor, (1 - k) * peso]]);
        g.globalCompositeOperation = soma;
      }
      // clarão e estrela de impacto
      if(u < 100){
        const rg = g.createRadialGradient(px, py, 0, px, py, 110);
        rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(.4, cor); rg.addColorStop(1, zero(g, cor));
        g.globalAlpha = 1 - u / 100; g.fillStyle = rg; g.fillRect(px - 110, py - 110, 220, 220);
      }
      if(u < 170){
        const k = u / 170, sc = .55 + .9 * Math.sqrt(k);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1 - k * k;
        g.beginPath(); estrela.forEach((r, i) => { const a = i / estrela.length * TAU; g[i ? 'lineTo' : 'moveTo'](px + Math.cos(a) * r * sc, py + Math.sin(a) * r * sc); }); g.closePath();
        g.fillStyle = '#FFFFFF'; g.fill(); g.lineWidth = claro ? 2.5 : 3; g.strokeStyle = claro ? '#111111' : cor; g.stroke();
      }
    }
    // pedras (as que flutuam e as que voam), esquentadas pelo nen logo depois do soco
    g.globalCompositeOperation = 'source-over';
    const quente = u < 0 ? .5 * Math.max(0, t / CARGA) : Math.exp(-u / 260);
    for(const p of pedras){ g.globalAlpha = u < 820 ? 1 : Math.max(0, 1 - (u - 820) / 330); pedra(g, p, claro, cor, quente); }
    // o grito
    if(u >= 0) grito(u);
    g.restore();
    return [dx, dy];
  }
  function grito(u){
    const fs = lim(R.w * .17, 36, 60), sc = Math.max(.3, 1 + 1.6 * Math.exp(-u / 60) * Math.cos(TAU * u / 170));
    const sobe = u > 700 ? (u - 700) * .06 : 0, a = u > 700 ? Math.max(0, 1 - (u - 700) / 420) : 1; if(a <= 0) return;
    const treme = u < 150 ? (1 - u / 150) * 6 : 0;
    const tx = lim(px, fs * 2.2, w - fs * 2.2) + (Math.random() - .5) * treme, ty = Math.max(fs * .95, R.y - fs * .5) - sobe + (Math.random() - .5) * treme;
    g.save(); g.translate(tx, ty); g.rotate(-.1); g.scale(sc, sc); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    g.font = `${fs}px ${FONTE}`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.lineJoin = 'round';
    const ls = [...texto], ws = ls.map(c => g.measureText(c).width * 1.04), total = ws.reduce((s, x) => s + x, 0);
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
  const fase = t => t < CARGA ? 'saisho wa guu… (carga)' : t < CARGA + 320 ? 'GUU! (o soco)' : t < CARGA + FIM ? 'pedras e rachaduras' : '';
  return {quadro, fase};
}

function dispara(r, o = {}){
  const alvo = o.alvo || document.body, cam = camada(alvo), lento = o.lento || 1, el = o.el, antes = el ? el.style.translate : '';
  const fx = cria(cam.g, cam.w, cam.h, {x: r.left - cam.ox, y: r.top - cam.oy, w: r.width, h: r.height},
    {cor: o.cor || NEN, claro: o.claro ?? fundoClaro(), texto: o.texto}, sorteio(Math.random() * 4294967296));
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

// a fonte de mangá do jogo (Bangers): o jogo já carrega; a bancada pede ao Google Fonts
function fonte(){
  if(document.fonts && document.fonts.check(`20px Bangers`)) return Promise.resolve();
  if(!document.getElementById('f-bangers')){ const l = document.createElement('link'); l.id = 'f-bangers'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bangers&display=swap'; document.head.append(l); }
  return document.fonts ? document.fonts.load('20px Bangers').catch(() => {}) : Promise.resolve();
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
const liga = (palco, cfg) => tarefas(palco, cfg, (r, el) => dispara(r, {alvo: palco, el, claro: !!cfg.claro, cor: cfg.cor, lento: cfg.lento}));

// prévias paradas: o mesmo soco (mesma semente) em quatro momentos, no escuro e no claro
function previas(el, cfg){
  const W = 300, H = 260, R = {x: 40, y: 120, w: 220, h: 48};
  const momento = (t, claro, semente) => {
    const c = document.createElement('canvas'), d = devicePixelRatio || 1; c.className = 'prev';
    c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px';
    const g = c.getContext('2d'); g.scale(d, d);
    g.fillStyle = claro ? '#F2F3F7' : '#0F1016'; g.fillRect(0, 0, W, H);
    g.fillStyle = claro ? '#FFFFFF' : '#1B1D28'; g.strokeStyle = claro ? '#D9DCE5' : '#2A2D3C';
    g.beginPath(); g.roundRect(R.x, R.y, R.w, R.h, 10); g.fill(); g.stroke();
    g.strokeStyle = '#E0AF68'; g.lineWidth = 2; g.beginPath(); g.arc(R.x + 27, R.y + 24, 10, 0, 7); g.stroke();
    g.fillStyle = claro ? '#1B1D28' : '#E6E8F0'; g.font = '14px system-ui,sans-serif'; g.fillText('Ler 20 páginas', R.x + 48, R.y + 29);
    cria(g, W, H, R, {cor: cfg.cor || NEN, claro}, sorteio(semente)).quadro(t);
    return c;
  };
  const ts = [[CARGA * .75, 'a carga'], [CARGA + 40, 'o soco'], [CARGA + 180, 'rachaduras e cacos'], [CARGA + 560, 'esfriando, PEDRA! subindo']];
  el.innerHTML = '<section><h2>' + ts.map(x => x[1]).join(' · ') + ' (o mesmo soco, parado)</h2><div class="linha"></div><div class="linha" style="margin-top:12px"></div></section>';
  const [esc, cla] = el.querySelectorAll('.linha');
  fonte().then(() => ts.forEach(([t]) => { esc.append(momento(t, false, 11)); cla.append(momento(t, true, 11)); }));
}

(window.CURSORES = window.CURSORES || {}).jajanken = {dispara, liga, previas, cria,
  titulo: 'clique numa tarefa (ou aperte espaço) para concluir',
  dica: 'saisho wa guu: o nen volta em espiral para o card, as pedrinhas flutuam e o card treme<br>GUU!: estrela de impacto, ondas de choque, linhas de foco, o fundo racha em teia e as pedras voam e quicam · câmera lenta para ver a carga',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
