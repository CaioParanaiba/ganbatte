// Hover Bungee Gum do Hisoka (hv-bungee), feito em código, sem imagem: o que acontece quando o mouse passa pelos cards.
// A Bungee Gum tem as propriedades da borracha e do chiclete. Ao entrar num card, uma bolinha de goma rosa gruda no ponto
// onde o cursor tocou, e um fio curto liga o card ao cursor. Dentro do card a goma escorrega pela superfície atrás do
// cursor (chiclete arrastado), e o card se inclina um pouco para onde ela puxa. Ao sair, a goma fica presa na borda: o
// fio estica e afina, e o card é puxado para o cursor, inclinando pelo ponto onde a goma está. Passando do limite, ela
// solta do cursor e contrai de uma vez, chicoteando de volta para o card, onde vira uma gota que some; o card, solto,
// volta balançando como mola até parar. Entrar noutro card solta a goma do anterior; parado fora do card, ela solta sozinha.
// Tudo é física de verdade (mola com pouco amortecimento nos cards, massa pelo tamanho: card pequeno pula, painel grande
// mal mexe; o fio é uma corda de nós a 240 Hz, como a goma do cursor da carta). O card só se move pelas propriedades
// translate e rotate do estilo, que somam com o transform que o jogo já usa.
//   const h = CURSORES.bungee.cola(raiz, {seletor: '.card', rompe: 170, lento: 1})   h.ajusta({rompe: 200})   h.desliga()
//   (raiz = document.documentElement no jogo, com o desenho numa camada fixa da tela inteira; ou um elemento, como a tela
//   preta da bancada, com a camada dentro dele; rompe = até quantos px o fio estica antes de soltar; lento = câmera lenta)
//   CURSORES.bungee.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, um pedaço do jogo de mentira
//   titulo, dica e controles: o que a bancada mostra
(() => {
const ROSA = '#FF5C8A', VINHO = '#8E2457', BRILHO = 'rgba(255,214,228,.75)';
const DT = 1 / 240, NG = 12, G = 2000;
const OMEGA = 2 * Math.PI * 2.6;   // a mola do card: uns 2,6 balanços por segundo
const ZETA = .14;                  // pouco amortecimento: solto, o card balança algumas vezes antes de parar
const KG = 60, L0 = 4;             // a goma: força por px esticado e o comprimento solto
const MU = 1500;                   // acima dessa força a goma escorrega pelo card (atrito do chiclete)
const MASSA = 26000;               // px² de card por unidade de massa
const GIRO = .45;                  // quanto do torque vira giro (o card é preso no layout; girar muito parece quebrado)
const PARADO = 2.5;                // segundos com o cursor parado fora do card até a goma soltar sozinha
const lim = (v, a, b) => Math.max(a, Math.min(b, v));

function cola(raiz, cfg){
  cfg = Object.assign({seletor: '.card', rompe: 170, lento: 1}, cfg);
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
    if(!c){ c = {el, x: 0, y: 0, a: 0, vx: 0, vy: 0, w: 0}; corpos.set(el, c); medeCorpo(c); }
    return c;
  }
  // o centro sem o nosso deslocamento (o giro é em volta do centro, então não o muda), o tamanho e a massa
  function medeCorpo(c){
    const r = c.el.getBoundingClientRect();
    c.hw = c.el.offsetWidth / 2; c.hh = c.el.offsetHeight / 2;
    c.cx = r.left + r.width / 2 - c.x; c.cy = r.top + r.height / 2 - c.y;
    c.m = lim(4 * c.hw * c.hh / MASSA, .8, 60); c.I = c.m * (c.hw * c.hw + c.hh * c.hh) / 3;
    c.amax = 10 / Math.max(20, Math.hypot(c.hw, c.hh));   // a quina mais longe anda no máximo 10 px pelo giro
  }
  const mundo = (c, lx, ly) => { const s = Math.sin(c.a), k = Math.cos(c.a); return [c.cx + c.x + lx * k - ly * s, c.cy + c.y + lx * s + ly * k]; };
  const local = (c, X, Y) => { const s = Math.sin(c.a), k = Math.cos(c.a), dx = X - c.cx - c.x, dy = Y - c.cy - c.y; return [dx * k + dy * s, -dx * s + dy * k]; };
  const prende = (c, lx, ly) => [lim(lx, -c.hw + 3, c.hw - 3), lim(ly, -c.hh + 3, c.hh - 3)];
  function empurra(c, X, Y, Fx, Fy, h){
    c.vx += Fx / c.m * h; c.vy += Fy / c.m * h;
    const rx = X - c.cx - c.x, ry = Y - c.cy - c.y;
    c.w += (rx * Fy - ry * Fx) * GIRO / c.I * h;
  }

  // ---- o cursor
  let mx = -1e4, my = -1e4, mvx = 0, mvy = 0, tMove = 0, sobre = null, dentro = false;
  // ---- a goma presa ao cursor (uma só), as que estão contraindo de volta e as gotas que ficaram nos cards
  let goma = null;
  const voltando = [], gotas = [];
  let soltas = 0;

  function gruda(el){
    const c = corpo(el); medeCorpo(c);
    const [lx, ly] = prende(c, ...local(c, mx, my)), [ax, ay] = mundo(c, lx, ly), nos = new Float64Array(4 * (NG + 1));
    for(let i = 0; i <= NG; i++){ const u = i / NG; nos[4 * i] = nos[4 * i + 2] = ax + (mx - ax) * u; nos[4 * i + 1] = nos[4 * i + 3] = ay + (my - ay) * u; }
    goma = {c, lx, ly, nos, cresce: 0, t: 0, d: 0, parado: 0};
    // o tranco de grudar: o card leva um pouco da velocidade do cursor
    const v = Math.min(1600, Math.hypot(mvx, mvy)) / (Math.hypot(mvx, mvy) || 1);
    empurra(c, ax, ay, mvx * v * .9, mvy * v * .9, 1 / 60);
  }
  // solta do cursor e contrai: o fio vira uma corda com a ponta livre, cada vez mais curta, que chicoteia de volta
  function solta(){
    if(!goma) return;
    const g = goma; goma = null; soltas++;
    let L = 0; for(let i = 0; i < NG; i++){ const a = 4 * i, b = a + 4; L += Math.hypot(g.nos[b] - g.nos[a], g.nos[b + 1] - g.nos[a + 1]); }
    // a ponta sai com a velocidade do cursor (em px por passo do Verlet)
    const b = 4 * NG; g.nos[b + 2] = g.nos[b] - mvx * DT * .5; g.nos[b + 3] = g.nos[b + 1] - mvy * DT * .5;
    voltando.push({c: g.c, lx: g.lx, ly: g.ly, nos: g.nos, rest: L / NG, L0: L, t: 0});
  }

  function passo(h){
    // a goma presa: escorrega pelo card se puxar mais que o atrito (só até a borda), puxa o card e o fio segue
    if(goma){
      const g = goma, c = g.c;
      g.t += h; g.cresce = Math.min(1, g.cresce + h / .07);
      let [ax, ay] = mundo(c, g.lx, g.ly), dx = mx - ax, dy = my - ay, d = Math.hypot(dx, dy) || 1e-6;
      const desliza = d - L0 - MU / KG;
      if(desliza > 0){
        const [lx, ly] = prende(c, ...local(c, ax + dx / d * desliza, ay + dy / d * desliza));
        g.lx = lx; g.ly = ly; [ax, ay] = mundo(c, lx, ly); dx = mx - ax; dy = my - ay; d = Math.hypot(dx, dy) || 1e-6;
      }
      // dentro do card, a goma é viscosa: com o cursor parado ela escorre até ele e para de puxar (o card volta ao lugar)
      if(dentro && d > L0){
        const q = (d - L0) * (1 - Math.exp(-h * 5)), [lx, ly] = prende(c, ...local(c, ax + dx / d * q, ay + dy / d * q));
        g.lx = lx; g.ly = ly; [ax, ay] = mundo(c, lx, ly); dx = mx - ax; dy = my - ay; d = Math.hypot(dx, dy) || 1e-6;
      }
      g.d = d;
      const F = Math.max(0, KG * (d - L0)) * g.cresce;
      empurra(c, ax, ay, dx / d * F, dy / d * F, h);
      g.parado = !dentro && performance.now() - tMove > PARADO * 1000 ? 1 : 0;
      if(d > cfg.rompe || g.parado) solta();
      else fio(g.nos, h, ax, ay, d);
    }
    // as que contraem: a ponta livre vem chicoteando, o resto encurta; curta o bastante, vira gota no card
    for(let k = voltando.length - 1; k >= 0; k--){
      const v = voltando[k], n = v.nos, [ax, ay] = mundo(v.c, v.lx, v.ly);
      v.t += h; v.rest *= Math.exp(-h * 16);
      const am = Math.exp(-h * 3);
      for(let i = 1; i <= NG; i++){
        const b = 4 * i, x = n[b], y = n[b + 1];
        n[b] += (x - n[b + 2]) * am; n[b + 1] += (y - n[b + 3]) * am + G * .1 * h * h; n[b + 2] = x; n[b + 3] = y;
      }
      n[0] = ax; n[1] = ay;
      restricoes(n, v.rest, false);
      let L = 0; for(let i = 0; i < NG; i++){ const a = 4 * i, b = a + 4; L += Math.hypot(n[b] - n[a], n[b + 1] - n[a + 1]); }
      v.L = L;
      // a goma voltando dá um puxão de leve no card, para o lado de onde ela vem
      const tx = n[4] - ax, ty = n[5] - ay, td = Math.hypot(tx, ty) || 1, F = Math.min(900, 14 * L);
      empurra(v.c, ax, ay, tx / td * F, ty / td * F, h);
      if(L < 7 || v.t > 1.2){ voltando.splice(k, 1); gotas.push({c: v.c, lx: v.lx, ly: v.ly, t: 0}); }
    }
    for(let k = gotas.length - 1; k >= 0; k--) if((gotas[k].t += h) > 1.1) gotas.splice(k, 1);
    // os cards: mola de volta ao lugar, com pouco amortecimento
    for(const c of corpos.values()){
      c.vx += (-OMEGA * OMEGA * c.x - 2 * ZETA * OMEGA * c.vx) * h; c.vy += (-OMEGA * OMEGA * c.y - 2 * ZETA * OMEGA * c.vy) * h;
      c.w += (-OMEGA * OMEGA * c.a - 2 * ZETA * OMEGA * c.w) * h;
      c.x += c.vx * h; c.y += c.vy * h; c.a += c.w * h;
      // por segurança: um card nunca sai mais que uns px do lugar (o painel do lado não pode ser tampado)
      const D = 20 / Math.sqrt(c.m), dd = Math.hypot(c.x, c.y);
      if(dd > D){ c.x *= D / dd; c.y *= D / dd; const vr = (c.vx * c.x + c.vy * c.y) / D; if(vr > 0){ c.vx -= vr * c.x / D; c.vy -= vr * c.y / D; } }
      if(Math.abs(c.a) > c.amax){ c.a = Math.sign(c.a) * c.amax; if(c.w * c.a > 0) c.w = 0; }
    }
  }
  // o fio preso: nós leves entre o card e o cursor, um pouco mais curtos que a reta (fica esticado, mas ondula e cede com
  // o peso quando o cursor mexe)
  function fio(n, h, ax, ay, d){
    const am = Math.exp(-h * 6), g = G * .15 * h * h;
    for(let i = 1; i < NG; i++){
      const b = 4 * i, x = n[b], y = n[b + 1];
      n[b] += (x - n[b + 2]) * am; n[b + 1] += (y - n[b + 3]) * am + g; n[b + 2] = x; n[b + 3] = y;
    }
    n[0] = ax; n[1] = ay; n[4 * NG] = mx; n[4 * NG + 1] = my;
    restricoes(n, d * .96 / NG, true);
  }
  function restricoes(n, rest, presaNaPonta){
    for(let k = 0; k < 4; k++) for(let i = 0; i < NG; i++){
      const a = 4 * i, b = a + 4, ex = n[b] - n[a], ey = n[b + 1] - n[a + 1], e = Math.hypot(ex, ey) || 1e-6;
      const q = (e - rest) / e * .5 * .8, wa = i === 0 ? 0 : 1, wb = i + 1 === NG && presaNaPonta ? 0 : 1, ws = wa + wb;
      if(!ws) continue;
      n[a] += ex * q * wa * 2 / ws; n[a + 1] += ey * q * wa * 2 / ws; n[b] -= ex * q * wb * 2 / ws; n[b + 1] -= ey * q * wb * 2 / ws;
    }
  }

  // ---- desenho
  // a goma: grossa nas pontas (onde gruda) e fina no meio, mais fina quanto mais estica, com um brilho de chiclete
  function pintaFio(n, ate, pe, meio, ox, oy){
    const pts = [], no = i => { i = lim(i, 0, ate); return [n[4 * i] - ox, n[4 * i + 1] - oy]; };
    for(let i = 0; i < ate; i++){
      const [p0, p1, p2, p3] = [no(i - 1), no(i), no(i + 1), no(i + 2)];
      for(let k = 0; k < 4; k++){
        const t = k / 4, t2 = t * t, t3 = t2 * t;
        pts.push([0, 1].map(j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    pts.push(no(ate));
    const esq = [], dir = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], t = Math.hypot(tx, ty) || 1;
      const u = i / (pts.length - 1 || 1), l = (meio + (pe - meio) * Math.pow(1 - Math.sin(Math.PI * u), 2)) / 2;
      esq.push([p[0] - ty / t * l, p[1] + tx / t * l]); dir.push([p[0] + ty / t * l, p[1] - tx / t * l]);
    });
    ctx.beginPath(); esq.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); dir.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
    ctx.fillStyle = ROSA; ctx.fill(); ctx.strokeStyle = VINHO; ctx.lineWidth = .8; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y - .4) : ctx.moveTo(x, y - .4));
    ctx.strokeStyle = BRILHO; ctx.lineWidth = Math.max(.6, meio * .3); ctx.lineCap = 'round'; ctx.stroke();
  }
  // a bolinha onde a goma gruda: achata e volta como gelatina quando gruda (t = segundos desde que grudou)
  function bolinha(x, y, r, t, ang){
    const j = t < .6 ? Math.exp(-t * 7) * Math.sin(t * 38) * .35 : 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0); ctx.scale(1 + j, 1 - j);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fillStyle = ROSA; ctx.fill(); ctx.strokeStyle = VINHO; ctx.lineWidth = .8; ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * .3, -r * .35, r * .32, 0, 2 * Math.PI); ctx.fillStyle = BRILHO; ctx.fill();
    ctx.restore();
  }
  function pinta(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    const [ox, oy] = origem();
    for(const p of gotas){
      const [x, y] = mundo(p.c, p.lx, p.ly), q = Math.max(0, 1 - p.t / 1.1);
      ctx.globalAlpha = Math.min(1, q * 2); bolinha(x - ox, y - oy, 4.4 * (.4 + .6 * q), p.t, 0); ctx.globalAlpha = 1;
    }
    for(const v of voltando){
      const pe = Math.min(6, 4.2 * Math.sqrt(v.L0 / Math.max(8, v.L)) * .8 + 1);   // o volume volta para a goma: engrossa ao encurtar
      pintaFio(v.nos, NG, pe, Math.max(1.2, pe * .6), ox, oy);
      bolinha(v.nos[0] - ox, v.nos[1] - oy, pe * .62, v.t, 0);
      bolinha(v.nos[4 * NG] - ox, v.nos[4 * NG + 1] - oy, pe * .7, 1, 0);
    }
    if(goma){
      const g = goma, pe = 5.2, meio = Math.max(1, Math.min(pe, pe * Math.sqrt(70 / Math.max(1, g.d))));
      const ate = Math.max(1, Math.round(NG * g.cresce)), ang = Math.atan2(my - g.nos[1], mx - g.nos[0]);
      if(g.d > 3) pintaFio(g.nos, ate, pe, meio, ox, oy);
      bolinha(g.nos[0] - ox, g.nos[1] - oy, pe * .62 * 1.2, g.t, ang);
      bolinha(mx - ox, my - oy, pe * .55, 1, 0);
    }
  }
  // os cards: só translate e rotate (somam com o transform do jogo); parado, devolve o estilo e o corpo some
  function move(){
    for(const [el, c] of corpos){
      const preso = (goma && goma.c === c) || voltando.some(v => v.c === c) || gotas.some(p => p.c === c);
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
    if(goma || voltando.length || gotas.length || corpos.size) pedido = requestAnimationFrame(quadro);
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
    if(card && card !== sobre){ sobre = card; if(!goma || goma.c.el !== card){ solta(); gruda(card); } }
    if(!card) sobre = null;
    dentro = !!card && !!goma && goma.c.el === card;
    acorda();
  }
  function sai(e){ if(tela && e.relatedTarget) return; sobre = null; dentro = false; solta(); acorda(); }
  const ouvintes = [['pointermove', mexe], [tela ? 'mouseout' : 'pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f, {passive: true}));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(raiz); else addEventListener('resize', mede);
  mede();

  return {
    ajusta(o){ Object.assign(cfg, o); acorda(); },
    estado: () => ({goma: goma && {d: goma.d, lx: goma.lx, ly: goma.ly}, voltando: voltando.length, gotas: gotas.length, soltas,
      cards: [...corpos.values()].map(c => ({x: c.x, y: c.y, a: c.a, m: c.m}))}),
    legenda(){
      const mx2 = Math.max(0, ...[...corpos.values()].map(c => Math.hypot(c.x, c.y)));
      return (goma ? `Bungee Gum ${Math.round(goma.d)} de ${cfg.rompe} px` : voltando.length ? 'contraindo' : 'sem goma')
        + ` · card a ${mx2.toFixed(1)} px do lugar · soltou ${soltas}×`;
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
  dica: 'a goma gruda onde o cursor entra e escorrega atrás dele dentro do card · ao sair, o fio estica e puxa o card · passando do limite, solta e contrai, e o card balança<br>cards pequenos pulam mais; o painel grande da constância é pesado · parado fora do card, a goma solta sozinha',
  controles: [{k: 'rompe', rot: 'o fio solta com', min: 80, max: 320, un: ' px', padrao: 170},
    {k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
