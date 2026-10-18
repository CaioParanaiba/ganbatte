// Efeito Godspeed do Killua (fx-godspeed), feito em código, sem imagem: dispara ao concluir uma tarefa.
// Um raio de verdade cai na tarefa concluída. Primeiro o líder: um fio fraco desce do alto da tela aos degraus, em
// zigue-zague, abrindo galhos que tateiam o caminho (~150 ms). Quando ele encosta na borda de cima do card, vem a descarga
// de volta: o canal inteiro acende de uma vez, branco no meio, e pisca como raio de verdade (acende, quase apaga, reacende,
// pelo mesmo caminho, que treme um pouco a cada vez); os galhos acendem mais fracos e somem antes. No ponto onde bateu,
// faíscas saltam com gravidade e quicam no card e no chão; a corrente corre pela borda do card nos dois sentidos, em arcos
// que tremem a cada quadro e pulam para fora de vez em quando (o Kanmuru: o Killua desenhado com eletricidade em volta do
// corpo), perdendo força até parar. O card treme e clareia junto com a descarga. No tema claro o raio ganha um contorno de
// tinta, para não sumir no branco.
//   CURSORES.godspeed.dispara(rect, {alvo: document.body, el: card, claro: auto, cor: var(--volt), lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra, a tela inteira por padrão; el = o card, que treme;
//   claro = fundo claro, por padrão lido da cor do body; lento = câmera lenta)
//   CURSORES.godspeed.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas para concluir
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const TINTA = '#0A1226';
const LIDER = 150, FIM = 1100;   // ms: o líder desce em 150 ms; o resto some até 1100 ms depois que ele bate
const PULSOS = [[0, 1], [55, .3], [85, 1], [150, .22], [190, .75], [250, .12], [330, 0]];  // brilho da descarga (ms, 0 a 1)
const DT = 1000 / 240;

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
// param; cada ponto guarda o degrau em que foi alcançado, depois convertido em ms
function lider(x0, y0, x1, y1, rnd){
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
  const ms = LIDER / t;
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

// um raio, numa tela w × h, no card R; quadro(t) avança a física até t (ms desde o começo) e desenha
function cria(g, w, h, R, op, rnd){
  const {cor, claro} = op, soma = claro ? 'source-over' : 'lighter';
  const xi = R.x + R.w * (.3 + rnd() * .4), yi = R.y;
  const x0 = Math.min(w - 20, Math.max(20, xi + (rnd() - .5) * Math.min(w * .6, 420)));
  const {tronco, galhos} = lider(x0, -12, xi, yi, rnd);
  let canal = fino(tronco, rnd, .3), pulso = -1;
  const ramos = galhos.map(r => ({w: r.w, pts: fino(r.pts, rnd, .3)}));
  const faiscas = [], correntes = [1, 1, -1, -1].map((d, i) => ({d, V: (i % 2 ? 1.2 : 2.3) * (.85 + rnd() * .3), cauda: 50 + rnd() * 60}));
  let sim = 0, bateu = false;
  function fisica(){
    if(sim >= LIDER && !bateu){
      bateu = true;
      for(let i = 0; i < 34; i++){ const a = -Math.PI / 2 + (rnd() - .5) * Math.PI * 1.5, v = 250 + rnd() * 750;
        faiscas.push({x: xi, y: yi - 1, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: .3 + rnd() * .55, idade: 0}); }
    }
    const dt = DT / 1000;
    for(const p of faiscas){
      const py = p.y; p.idade += dt; p.vy += 1900 * dt; p.vx *= .996; p.x += p.vx * dt; p.y += p.vy * dt;
      if(p.vy > 0 && py <= R.y && p.y > R.y && p.x > R.x && p.x < R.x + R.w){ p.y = R.y; p.vy *= -.35; p.vx *= .75; }   // quica no card
      if(p.vy > 0 && p.y > h - 2){ p.y = h - 2; p.vy *= -.35; p.vx *= .7; }
      if(p.x < 0 || p.x > w) p.vx *= -.6;
    }
  }
  const traca = (camadas) => { for(const [lw, c, a] of camadas){ if(a <= 0) continue; g.lineWidth = lw; g.strokeStyle = c; g.globalAlpha = Math.min(1, a); g.stroke(); } };
  function quadro(t){
    while(sim + DT <= t){ sim += DT; fisica(); }
    const u = t - LIDER;
    g.save(); g.lineJoin = g.lineCap = 'round';
    if(u < 0){
      // o líder: fio fraco, com a ponta acesa
      g.globalCompositeOperation = soma;
      for(const r of [{pts: canal, w: 1}, ...ramos]){
        const p = caminho(g, r.pts, t); if(!p) continue;
        traca([[1.2 * Math.max(.7, r.w), claro ? TINTA : cor, claro ? .5 : .55]]);
        g.globalAlpha = .9; g.fillStyle = claro ? TINTA : '#FFFFFF'; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, 7); g.fill();
      }
      g.restore(); return;
    }
    const b = brilho(u), pk = u < 85 ? 0 : u < 190 ? 1 : 2;
    if(pk !== pulso){ pulso = pk; if(pk) canal = fino(tronco, rnd, .3); }   // cada reacendida treme um pouco o caminho
    if(b > 0){
      g.globalAlpha = (claro ? .1 : .14) * b; g.fillStyle = cor; g.fillRect(0, 0, w, h);   // o clarão
      caminho(g, canal, 1e9);
      if(claro) traca([[3 + 5 * b, TINTA, .9 * Math.min(1, b * 2)]]);
      g.globalCompositeOperation = soma;
      traca([[22 * b, cor, .1], [9 * Math.sqrt(b), cor, .3 * b], [3.4, cor, b * 1.2], [1.5, '#FFFFFF', b * 1.2]]);
      const bg = b * .6 * Math.exp(-u / 140);
      for(const r of ramos){
        caminho(g, r.pts, LIDER);
        if(claro){ g.globalCompositeOperation = 'source-over'; traca([[2 + 4 * r.w, TINTA, .8 * bg]]); g.globalCompositeOperation = soma; }
        traca([[8 * r.w, cor, .25 * bg], [2.4 * r.w + .6, cor, bg], [1, '#FFFFFF', bg]]);
      }
      const rg = g.createRadialGradient(xi, yi, 0, xi, yi, 60 * b + 10);
      rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(.25, cor); rg.addColorStop(1, zero(g, cor));
      g.globalAlpha = .8 * b; g.fillStyle = rg; g.fillRect(xi - 80, yi - 80, 160, 160);
    }
    // a corrente na borda do card: sai do ponto da batida nos dois sentidos e perde força
    if(u < 760){
      const a = 1 - u / 760, s0 = xi - R.x;
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = .5 * Math.exp(-u / 260); g.strokeStyle = cor; g.lineWidth = 1.5;
      g.beginPath(); g.roundRect ? g.roundRect(R.x - 1, R.y - 1, R.w + 2, R.h + 2, 9) : g.rect(R.x - 1, R.y - 1, R.w + 2, R.h + 2); g.stroke();
      for(const c of correntes){
        const anda = c.V * 300 * (1 - Math.exp(-u / 300)), s = s0 + c.d * anda, n = Math.max(1, Math.min(c.cauda, anda) / 6 | 0);
        g.beginPath();
        for(let j = 0; j <= n; j++){ const [x, y, nx, ny] = borda(R, s - c.d * j * 6), o = (rnd() - .35) * 5; j ? g.lineTo(x + nx * o, y + ny * o) : g.moveTo(x + nx * o, y + ny * o); }
        if(rnd() < .3){   // um arco pula para fora
          const [x, y, nx, ny] = borda(R, s), an = Math.atan2(ny, nx) + (rnd() - .5) * 1.6, L = 10 + rnd() * 18;
          g.moveTo(x, y);
          for(let k = 1; k <= 3; k++){ const q = k / 3 * L, o = k < 3 ? (rnd() - .5) * 8 : 0; g.lineTo(x + Math.cos(an) * q - Math.sin(an) * o, y + Math.sin(an) * q + Math.cos(an) * o); }
        }
        if(claro) traca([[3.2, TINTA, .7 * a]]);
        g.globalCompositeOperation = soma; traca([[2.2, cor, a], [.9, '#FFFFFF', a]]); g.globalCompositeOperation = 'source-over';
        const [hx, hy] = borda(R, s); g.globalAlpha = a; g.fillStyle = claro ? cor : '#FFFFFF'; g.beginPath(); g.arc(hx, hy, 2.2, 0, 7); g.fill();
      }
    }
    // faíscas: riscos do tamanho da velocidade, brancas no começo e da cor do raio no fim
    g.globalCompositeOperation = soma;
    for(const p of faiscas){
      const k = 1 - p.idade / p.vida; if(k <= 0) continue;
      g.beginPath(); g.moveTo(p.x - p.vx * .014, p.y - p.vy * .014); g.lineTo(p.x, p.y);
      if(claro){ g.globalCompositeOperation = 'source-over'; traca([[2.6, TINTA, .6 * k]]); }
      traca([[1.5, k > .55 ? '#FFFFFF' : cor, k]]);
    }
    g.restore();
  }
  const fase = t => t < LIDER ? 'o líder desce' : t < LIDER + 330 ? 'descarga (pisca pelo mesmo caminho)' : t < LIDER + 760 ? 'corrente na borda' : t < LIDER + FIM ? 'faíscas' : '';
  return {quadro, fase, xi, yi};
}

function treme(el, lento){
  if(!el.animate) return;
  el.animate([{translate: '0 0', filter: 'brightness(1.9)'}, {translate: '1.5px -1px'}, {translate: '-2px 1px', filter: 'brightness(1.1)'}, {translate: '1px 2px', filter: 'brightness(1.5)'},
    {translate: '-1px -1px'}, {translate: '0 0', filter: 'none'}], {duration: 320 * lento, easing: 'ease-out'});
}

function dispara(r, o = {}){
  const alvo = o.alvo || document.body, cam = camada(alvo), lento = o.lento || 1;
  const fx = cria(cam.g, cam.w, cam.h, {x: r.left - cam.ox, y: r.top - cam.oy, w: r.width, h: r.height},
    {cor: o.cor || corVolt(), claro: o.claro ?? fundoClaro()}, sorteio(Math.random() * 4294967296));
  let t0 = null, tremeu = false;
  const passo = now => {
    if(t0 === null) t0 = now;
    const t = (now - t0) / lento; fx.t = t;
    cam.g.clearRect(0, 0, cam.w, cam.h); fx.quadro(t);
    if(!tremeu && t >= LIDER && o.el){ tremeu = true; treme(o.el, lento); }
    if(t < LIDER + FIM) requestAnimationFrame(passo); else { cam.cv.remove(); fx.acabou = true; }
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
    setTimeout(() => { c.feito = false; c.firstChild.style.background = ''; c.lastChild.style.textDecoration = ''; pinta(); }, 2600 * cfg.lento);
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
const liga = (palco, cfg) => tarefas(palco, cfg, (r, el) => dispara(r, {alvo: palco, el, claro: !!cfg.claro, cor: cfg.cor, lento: cfg.lento}));

// prévias paradas: o mesmo raio (mesma semente) em quatro momentos, no escuro e no claro
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
  const ts = [[95, 'o líder descendo'], [LIDER + 4, 'a descarga'], [LIDER + 100, 'reacende'], [LIDER + 420, 'corrente na borda e faíscas']];
  el.innerHTML = '<section><h2>' + ts.map(x => x[1]).join(' · ') + ' (o mesmo raio, parado)</h2><div class="linha"></div><div class="linha" style="margin-top:12px"></div></section>';
  const [esc, cla] = el.querySelectorAll('.linha');
  ts.forEach(([t]) => { esc.append(momento(t, false, 7)); cla.append(momento(t, true, 7)); });
}

(window.CURSORES = window.CURSORES || {}).godspeed = {dispara, liga, previas, cria,
  titulo: 'clique numa tarefa (ou aperte espaço) para concluir',
  dica: 'um raio cai na tarefa: o líder desce tateando, a descarga acende o canal e pisca pelo mesmo caminho,<br>a corrente corre pela borda do card e as faíscas quicam · câmera lenta para ver o líder',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
