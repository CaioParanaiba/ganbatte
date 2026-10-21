// Dragon Dive do Zeno (fx-dragao, épico), feito em código, sem imagem: dispara no andar novo e no chefão derrotado (o
// momento do confete e dos fogos), como alternativa aos fogos. Uma cena de tela inteira em ~2,9 s:
//   a carga: a tela escurece um pouco e a aura do Zeno sobe do card em chamas.
//   o Dragon Head: o dragão de aura sai do card e sobe serpenteando; o corpo é uma corda de verdade (Verlet, 34 nós,
//     com a cabeça puxando e uma onda de lado), com espinhos no dorso, cabeça de boca aberta, chifres, juba de fogo e
//     dois bigodes compridos que também são cordas e ficam para trás com a inércia.
//   a curva: no alto ele dá quase uma volta inteira, e o nome da técnica entra no meio da volta: 龍星群 (ryūseigun), com
//     a leitura ドラゴンダイヴ que o Togashi usa, em Dela Gothic One.
//   o Dragon Dive: o dragão se desfaz em 34 dragõezinhos (um por nó do corpo), que se espalham, viram e mergulham, cada
//     um com rabo de corda, em pontos da tela e alguns no próprio card; cada impacto é um clarão, um anel e faíscas que
//     caem com gravidade e quicam no chão. Os que acertam o card fazem ele tremer.
//   CURSORES.dragao.dispara(rect, {alvo: document.body, el: card, claro: auto, cor: '#F2C14E', lento: 1})
//   (rect = getBoundingClientRect() do card; alvo = onde a camada entra; el = o card, que treme com os impactos)
//   CURSORES.dragao.liga(palco, cfg) → {ajusta, legenda, desliga}: a bancada, uma lista de tarefas onde cada uma sobe um andar
(() => {
const ZENO = '#F2C14E', TINTA = '#0B0C10', ESCURO = '#6B4508';
const CARGA = 320, SOBE = 1050, ESTOURA = 1450, FIM = 2900;   // ms
const DT = 1000 / 240, G = 1800, TAU = Math.PI * 2;
const NOME = '龍星群', LEITURA = 'ドラゴンダイヴ';
const FONTE = '"Dela Gothic One","Hiragino Kaku Gothic StdN","Yu Gothic",sans-serif';

const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = q => { q = lim(q, 0, 1); return q * q * (3 - 2 * q); };
const mola = q => { q = lim(q, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); };
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
// a corda: b fica no máximo a d de a (a cabeça puxa, o resto vem atrás com a inércia do Verlet)
const prende = (a, b, d) => { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy); if(l > d){ const f = (l - d) / l; b.x -= dx * f; b.y -= dy * f; } };
const no = (x, y) => ({x, y, ox: x, oy: y});
const inercia = (p, amort) => { const vx = (p.x - p.ox) * amort, vy = (p.y - p.oy) * amort; p.ox = p.x; p.oy = p.y; p.x += vx; p.y += vy; };

// uma cena, numa tela w × h, com o card R; quadro(t) avança a física até t (ms desde o começo), desenha e devolve o tremor
function cria(g, w, h, R, op, rnd){
  const {cor, claro} = op, soma = claro ? 'source-over' : 'lighter', luz = claro ? '#FFF3CF' : '#FFFFFF';
  const s = op.escala || lim(Math.min(w, h) / 700, .55, 1.25), px = R.x + R.w / 2, py = R.y + R.h / 2;
  // o caminho da cabeça: sobe serpenteando do card e, no alto, dá quase uma volta em torno de C
  const raio = lim(Math.min(w, h) * .13, 46, 130), topo = lim(Math.min(Math.max(h * .2, 70 * s), py - 140 * s), raio * .7, h);
  const A = 46 * s * (rnd() < .5 ? -1 : 1), xA = px + A * Math.sin(TAU * 1.1);
  let sent = 1; const C = {x: xA + raio, y: topo};
  if(C.x + raio > w - 16){ sent = -1; C.x = xA - raio; }
  function cabeca(t){
    if(t <= CARGA) return [px, py];
    if(t < SOBE){ const q = (t - CARGA) / (SOBE - CARGA), e = q * q * (1.6 - .6 * q); return [px + A * Math.sin(TAU * 1.1 * e) * Math.min(1, e * 2), py + (topo - py) * e]; }
    const q = Math.min(1, (t - SOBE) / (ESTOURA - SOBE)), th = sent > 0 ? Math.PI + q * TAU * .9 : -q * TAU * .9;
    return [C.x + Math.cos(th) * raio, C.y + Math.sin(th) * raio];
  }
  const N = 34, D = 10 * s, HS = 19 * s;
  const corpo = Array.from({length: N}, () => no(px, py));
  const bigodes = [0, 1].map(() => Array.from({length: 10}, () => no(px, py)));
  const chamas = Array.from({length: 16}, () => ({x: rnd(), v: .6 + rnd() * .8, f: rnd() * TAU, l: .5 + rnd() * .7}));
  const mini = [], estouros = [], faiscas = [];
  let tSim = 0, tremor = 0, angulo = -Math.PI / 2;

  // a cabeça no referencial dela (+x para a frente); os bigodes saem das pontas do focinho
  const focinho = (lado) => { const c = Math.cos(angulo), sn = Math.sin(angulo), vira = Math.cos(angulo) < 0 ? -1 : 1, lx = 1.25 * HS, ly = (lado ? .02 : .16) * HS * vira;
    return [corpo[0].x + c * lx - sn * ly, corpo[0].y + sn * lx + c * ly]; };

  function nasce(t){
    corpo.forEach((p, i) => {
      const dx = p.x - C.x, dy = p.y - C.y, l = Math.hypot(dx, dy) || 1, v = 220 + rnd() * 260, card = i % 6 === 2;
      mini.push({x: p.x, y: p.y, vx: dx / l * v + (rnd() - .5) * 120, vy: dy / l * v - 60 - rnd() * 80, atraso: 90 + rnd() * 380 + i * 6, vmax: 950 + rnd() * 650,
        tx: card ? R.x + 8 + rnd() * (R.w - 16) : w * (.04 + rnd() * .92), ty: card ? R.y + 6 + rnd() * (R.h - 12) : h * (.6 + rnd() * .37),
        card, rabo: Array.from({length: 7}, () => no(p.x, p.y)), morto: 0, t0: t});
    });
  }
  function impacto(m, t){
    estouros.push({x: m.x, y: m.y, t0: t, card: m.card});
    for(let i = 0; i < 5; i++){ const a = -Math.PI / 2 + (rnd() - .5) * 2.4, v = 160 + rnd() * 320; faiscas.push({x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1}); }
    if(m.card) tremor = Math.max(tremor, 6);
  }
  function passo(t){
    const dts = DT / 1000;
    if(t < ESTOURA){
      const [hx, hy] = cabeca(t);
      for(let i = 1; i < N; i++){
        const p = corpo[i], q = corpo[i - 1]; inercia(p, .94);
        const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, onda = Math.sin(t * .018 - i * .55) * .35 * s;   // serpenteia de lado
        p.x -= dy / l * onda; p.y += dx / l * onda;
      }
      const c0 = corpo[0]; c0.ox = c0.x; c0.oy = c0.y; c0.x = hx; c0.y = hy;
      for(let k = 0; k < 4; k++) for(let i = 1; i < N; i++) prende(corpo[i - 1], corpo[i], D);
      const dx = corpo[0].x - corpo[2].x, dy = corpo[0].y - corpo[2].y; if(Math.hypot(dx, dy) > 1) angulo = Math.atan2(dy, dx);
      bigodes.forEach((b, lado) => { const [ax, ay] = focinho(lado); b[0].x = ax; b[0].y = ay;
        for(let i = 1; i < b.length; i++){ inercia(b[i], .86); b[i].y -= .04 * s; }
        for(let k = 0; k < 3; k++) for(let i = 1; i < b.length; i++) prende(b[i - 1], b[i], 5.5 * s); });
    } else if(!mini.length) nasce(t);
    for(const m of mini){
      if(m.morto) continue;
      const idade = t - ESTOURA;
      if(idade > m.atraso){
        const dx = m.tx - m.x, dy = m.ty - m.y, l = Math.hypot(dx, dy) || 1, vm = Math.min(m.vmax, 300 + (idade - m.atraso) * 2.4), k = Math.min(1, dts * 7);
        m.vx += (dx / l * vm - m.vx) * k; m.vy += (dy / l * vm - m.vy) * k;
        if(l < 11 || idade > m.atraso + 1500){ m.morto = t; impacto(m, t); }
      } else { m.vx *= .985; m.vy = m.vy * .985 - 40 * dts; }   // espalham e flutuam antes de mergulhar
      m.x += m.vx * dts; m.y += m.vy * dts;
      m.rabo[0].x = m.x; m.rabo[0].y = m.y; for(let i = 1; i < m.rabo.length; i++) prende(m.rabo[i - 1], m.rabo[i], 5 * s);
    }
    for(const f of faiscas){ if(f.vida <= 0) continue; f.vy += G * dts; f.x += f.vx * dts; f.y += f.vy * dts;
      if(f.y > h - 2){ f.y = h - 2; f.vy *= -.4; f.vx *= .7; } f.vida -= dts * 2.2; }
    tremor *= .985;
  }

  // ---------- desenho ----------
  function corpoGrande(a){
    const r = i => 7.5 * s * Math.pow(1 - i / N, .6) + 1.2, vira = Math.cos(angulo) < 0 ? 1 : -1;
    const segs = []; for(let i = 0; i < N - 1; i++){ const p = corpo[i], q = corpo[i + 1], l = Math.hypot(p.x - q.x, p.y - q.y); if(l >= .5) segs.push([p, q, r(i), (p.x - q.x) / l, (p.y - q.y) / l, i]); }
    const traco = (lw, c, comp, al) => { g.globalCompositeOperation = comp; g.strokeStyle = c; g.globalAlpha = a * al;
      for(const [p, q, rr] of segs){ g.lineWidth = lw(rr); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    // o brilho da aura em volta: um traço só (por segmento, as sobreposições somavam e viravam contas)
    if(!claro && segs.length){ g.globalCompositeOperation = 'lighter'; g.strokeStyle = cor;
      for(const [lw, al] of [[r(3) * 5, .1], [r(3) * 3.2, .12]]){ g.globalAlpha = a * al; g.lineWidth = lw; g.beginPath(); g.moveTo(segs[0][0].x, segs[0][0].y); for(const [, q] of segs) g.lineTo(q.x, q.y); g.stroke(); } }
    // os espinhos do dorso, atrás do corpo, do lado de fora da curva
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = a; g.fillStyle = cor; g.strokeStyle = ESCURO; g.lineWidth = 1.2;
    for(const [p, , rr, ux, uy, i] of segs){ if(i < 2 || i % 2 || i > N - 6) continue;
      const nx = -uy * vira, ny = ux * vira;
      g.beginPath(); g.moveTo(p.x + nx * rr * .6 + ux * 4 * s, p.y + ny * rr * .6 + uy * 4 * s);
      g.lineTo(p.x + nx * (rr + 8 * s) - ux * 5 * s, p.y + ny * (rr + 8 * s) - uy * 5 * s);
      g.lineTo(p.x + nx * rr * .6 - ux * 5 * s, p.y + ny * rr * .6 - uy * 5 * s); g.closePath(); g.fill(); g.stroke(); }
    traco(rr => 2 * rr + 2.6, claro ? TINTA : ESCURO, 'source-over', 1);   // o contorno
    traco(rr => 2 * rr, cor, 'source-over', 1);                            // o corpo
    // a barriga clara, do lado de dentro, e as escamas em V ao longo do corpo
    g.strokeStyle = '#FFF1C4'; g.globalAlpha = a * .85;
    for(const [p, q, rr, ux, uy] of segs){ const nx = uy * vira, ny = -ux * vira, o = rr * .45;
      g.lineWidth = rr * .55; g.beginPath(); g.moveTo(p.x + nx * o, p.y + ny * o); g.lineTo(q.x + nx * o, q.y + ny * o); g.stroke(); }
    g.strokeStyle = '#B57A1C'; g.lineWidth = 1.1 * s; g.globalAlpha = a * .8;
    for(const [p, , rr, ux, uy, i] of segs){ if(i < 1 || i > N - 4) continue; const nx = -uy, ny = ux, k2 = rr * .55;
      g.beginPath(); g.moveTo(p.x + nx * k2 - ux * k2 * .7, p.y + ny * k2 - uy * k2 * .7); g.lineTo(p.x, p.y); g.lineTo(p.x - nx * k2 - ux * k2 * .7, p.y - ny * k2 - uy * k2 * .7); g.stroke(); }
    // os bigodes, finos e compridos
    g.strokeStyle = claro ? TINTA : cor; g.globalAlpha = a * .95; g.globalCompositeOperation = soma;
    for(const b of bigodes){ for(let i = 0; i < b.length - 1; i++){ g.lineWidth = (2 - i * .16) * s; g.beginPath(); g.moveTo(b[i].x, b[i].y); g.lineTo(b[i + 1].x, b[i + 1].y); g.stroke(); } }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  function cabecaGrande(a, t){
    const p = corpo[0], vira = Math.cos(angulo) < 0;
    g.save(); g.translate(p.x, p.y); g.rotate(angulo); if(vira) g.scale(1, -1);
    g.globalAlpha = a; g.lineJoin = 'round'; g.lineCap = 'round';
    // a juba de fogo para trás, tremendo
    g.globalCompositeOperation = soma; g.strokeStyle = cor;
    for(let i = 0; i < 6; i++){ const y = (-.8 + i * .32) * HS, fl = Math.sin(t * .03 + i * 1.7) * .25 * HS;
      g.lineWidth = (3.2 - Math.abs(i - 2.5) * .5) * s; g.globalAlpha = a * .75;
      g.beginPath(); g.moveTo(-.3 * HS, y * .5); g.quadraticCurveTo(-1.1 * HS, y + fl, -1.9 * HS, y * 1.3 + fl * 1.5); g.stroke(); }
    // os chifres
    g.globalAlpha = a; g.strokeStyle = claro ? '#B8862B' : luz; g.lineWidth = 2.4 * s;
    g.beginPath(); g.moveTo(-.1 * HS, -.5 * HS); g.quadraticCurveTo(-.6 * HS, -1.25 * HS, -1.4 * HS, -1.15 * HS); g.stroke();
    g.lineWidth = 1.8 * s; g.globalAlpha = a * .6;
    g.beginPath(); g.moveTo(-.25 * HS, -.42 * HS); g.quadraticCurveTo(-.8 * HS, -.95 * HS, -1.3 * HS, -.8 * HS); g.stroke();
    g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    if(!claro){ const br = g.createRadialGradient(.4 * HS, -.2 * HS, 0, .4 * HS, -.2 * HS, 2.2 * HS); br.addColorStop(0, cor); br.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .35; g.fillStyle = br; g.beginPath(); g.arc(.4 * HS, -.2 * HS, 2.2 * HS, 0, TAU); g.fill(); g.globalAlpha = a; g.globalCompositeOperation = 'source-over'; }
    const pinta = () => { const pg = g.createLinearGradient(0, -.8 * HS, 0, .4 * HS); pg.addColorStop(0, '#FFE7A0'); pg.addColorStop(.5, cor); pg.addColorStop(1, '#C98A1A');
      g.fillStyle = pg; g.fill(); g.strokeStyle = claro ? TINTA : ESCURO; g.lineWidth = 1.8 * s; g.stroke(); };
    // a mandíbula, aberta (rugindo), e os dentes
    const abre = .26 + Math.sin(t * .02) * .06;
    g.save(); g.translate(-.1 * HS, .1 * HS); g.rotate(abre); g.translate(.1 * HS, -.1 * HS);
    g.beginPath(); g.moveTo(-.4 * HS, .1 * HS); g.lineTo(1.1 * HS, .1 * HS); g.quadraticCurveTo(1.18 * HS, .3 * HS, .9 * HS, .33 * HS); g.quadraticCurveTo(.2 * HS, .46 * HS, -.4 * HS, .4 * HS); g.closePath(); pinta();
    g.fillStyle = luz; for(let i = 0; i < 3; i++){ const x = (.45 + i * .22) * HS; g.beginPath(); g.moveTo(x, .1 * HS); g.lineTo(x + .07 * HS, -.04 * HS); g.lineTo(x + .14 * HS, .1 * HS); g.fill(); }
    g.restore();
    // o crânio e o focinho comprido
    g.beginPath(); g.moveTo(-.6 * HS, -.5 * HS); g.quadraticCurveTo(.2 * HS, -.85 * HS, .8 * HS, -.45 * HS); g.quadraticCurveTo(1.3 * HS, -.35 * HS, 1.55 * HS, -.1 * HS);
    g.quadraticCurveTo(1.5 * HS, .08 * HS, 1.2 * HS, .06 * HS); g.lineTo(.1 * HS, .1 * HS); g.quadraticCurveTo(-.4 * HS, .2 * HS, -.6 * HS, .1 * HS); g.closePath(); pinta();
    g.fillStyle = luz; for(let i = 0; i < 4; i++){ const x = (.3 + i * .22) * HS; g.beginPath(); g.moveTo(x, .08 * HS); g.lineTo(x + .07 * HS, .24 * HS); g.lineTo(x + .14 * HS, .08 * HS); g.fill(); }
    // a narina, a sobrancelha e o olho aceso
    g.strokeStyle = claro ? TINTA : ESCURO; g.lineWidth = 1.4 * s;
    g.beginPath(); g.arc(1.35 * HS, -.2 * HS, .07 * HS, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(.15 * HS, -.6 * HS); g.quadraticCurveTo(.5 * HS, -.66 * HS, .78 * HS, -.42 * HS); g.stroke();
    const olho = g.createRadialGradient(.48 * HS, -.38 * HS, 0, .48 * HS, -.38 * HS, .45 * HS);
    olho.addColorStop(0, '#FFFFFF'); olho.addColorStop(.3, claro ? '#FFE9A8' : '#FFF6D8'); olho.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalCompositeOperation = soma; g.fillStyle = olho; g.beginPath(); g.arc(.48 * HS, -.38 * HS, .45 * HS, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over'; g.fillStyle = claro ? TINTA : '#7A1F0E';
    g.beginPath(); g.ellipse(.5 * HS, -.38 * HS, .13 * HS, .07 * HS, -.25, 0, TAU); g.fill();
    g.restore();
  }
  function dragaozinho(m, a){
    const r = m.rabo;
    g.lineCap = 'round'; g.globalCompositeOperation = soma;
    for(const [c, mult, al] of claro ? [[TINTA, 1.6, 1], [cor, 1, 1]] : [[cor, 2.6, .2], [ESCURO, 1.45, 1], [cor, 1, 1], [luz, .35, .9]]){
      g.strokeStyle = c; g.globalAlpha = a * al;
      for(let i = 0; i < r.length - 1; i++){ g.lineWidth = (4.4 - i * .55) * s * mult; g.beginPath(); g.moveTo(r[i].x, r[i].y); g.lineTo(r[i + 1].x, r[i + 1].y); g.stroke(); }
    }
    // a cabecinha: o focinho em ponta, os dois chifres e o olho
    const an = Math.atan2(m.vy, m.vx), hs = 7.5 * s;
    g.save(); g.translate(m.x, m.y); g.rotate(an); g.globalAlpha = a;
    g.beginPath(); g.moveTo(1.6 * hs, 0); g.quadraticCurveTo(.6 * hs, -.8 * hs, -.5 * hs, -.55 * hs); g.lineTo(-.5 * hs, .55 * hs); g.quadraticCurveTo(.6 * hs, .8 * hs, 1.6 * hs, 0); g.closePath();
    g.fillStyle = cor; g.fill(); g.strokeStyle = claro ? TINTA : ESCURO; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = claro ? TINTA : '#FFE7A0'; g.lineWidth = 1.3 * s;
    g.beginPath(); g.moveTo(-.2 * hs, -.5 * hs); g.lineTo(-1.2 * hs, -1.1 * hs); g.moveTo(-.2 * hs, .5 * hs); g.lineTo(-1.2 * hs, 1.1 * hs); g.stroke();
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(.5 * hs, -.2 * hs, .18 * hs, 0, TAU); g.fill();
    g.restore();
  }
  function carga(t){
    const q = t < CARGA ? t / CARGA : Math.max(0, 1 - (t - CARGA) / 300); if(q <= 0) return;
    g.globalCompositeOperation = soma; g.lineCap = 'round';
    for(const c of chamas){ const x = R.x + c.x * R.w, sobe = ((t * .001 * c.v + c.f) % 1), l = c.l * 40 * s * q;
      const y0 = R.y - sobe * 30 * s, onda = Math.sin(t * .02 + c.f * 5) * 3 * s;
      g.strokeStyle = cor; g.globalAlpha = q * (1 - sobe) * .8; g.lineWidth = 3 * s;
      g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + onda, y0 - l * .5, x - onda * .5, y0 - l); g.stroke(); }
    // o card acende na borda
    g.globalAlpha = q * .9; g.strokeStyle = cor; g.lineWidth = 2.5; g.beginPath(); g.roundRect(R.x - 2, R.y - 2, R.w + 4, R.h + 4, 11); g.stroke();
    g.globalAlpha = q * .25; g.lineWidth = 9; g.stroke();
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  function clarao(x, y, u, dur, rmax, al = 1){
    if(u < 0 || u > dur) return; const q = u / dur;
    const rg = g.createRadialGradient(x, y, 0, x, y, rmax * (.4 + q * .6));
    rg.addColorStop(0, luz); rg.addColorStop(.35, cor); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = soma; g.globalAlpha = (1 - q) * al; g.fillStyle = rg; g.beginPath(); g.arc(x, y, rmax, 0, TAU); g.fill();
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  function nome(t){
    const u = t - ESTOURA + 120; if(u < 0) return;
    const a = u < 900 ? 1 : Math.max(0, 1 - (u - 900) / 400); if(a <= 0) return;
    const fs = lim(raio * .62, 30, 64), sc = Math.max(.3, mola(u / 260)), x = lim(C.x, fs * 1.8, w - fs * 1.8), y = lim(C.y, fs, h - fs);
    g.save(); g.translate(x, y - u * .02); g.scale(sc, sc); g.globalAlpha = a;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.font = `${fs}px ${FONTE}`;
    const lg = g.createLinearGradient(0, -fs / 2, 0, fs / 2); lg.addColorStop(0, '#FFFFFF'); lg.addColorStop(.4, cor); lg.addColorStop(1, '#C98A1A');
    for(const [lw, st] of [[fs * .3, '#FFFFFF'], [fs * .18, TINTA], [0, lg]]){ if(lw){ g.lineWidth = lw; g.strokeStyle = st; g.strokeText(NOME, 0, 0); } else { g.fillStyle = st; g.fillText(NOME, 0, 0); } }
    const f2 = fs * .3; g.font = `${f2}px ${FONTE}`;
    for(const [lw, st] of [[f2 * .35, TINTA], [0, '#FFFFFF']]){ if(lw){ g.lineWidth = lw; g.strokeStyle = st; g.strokeText(LEITURA, 0, -fs * .78); } else { g.fillStyle = st; g.fillText(LEITURA, 0, -fs * .78); } }
    g.restore();
  }

  function quadro(t){
    while(tSim + DT <= t){ tSim += DT; passo(tSim); }
    // a tela escurece um pouco durante a cena
    const esc = t < 220 ? t / 220 : t > FIM - 500 ? Math.max(0, (FIM - t) / 500) : 1;
    g.fillStyle = TINTA; g.globalAlpha = esc * (claro ? .12 : .32); g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    carga(t);
    clarao(px, py, t - CARGA + 40, 280, 70 * s);   // o dragão sai do card
    if(t > CARGA && t < ESTOURA + 260){
      const a = t < CARGA + 80 ? (t - CARGA) / 80 : t > ESTOURA ? Math.max(0, 1 - (t - ESTOURA) / 260) : 1;
      corpoGrande(a); cabecaGrande(a, t);
    }
    clarao(C.x, C.y, t - ESTOURA, 380, raio * 1.6);   // se desfaz
    nome(t);
    for(const m of mini){
      const a = m.morto ? Math.max(0, 1 - (t - m.morto) / 120) : Math.min(1, (t - m.t0) / 80);
      if(a > 0) dragaozinho(m, a * (t > FIM - 300 ? Math.max(0, (FIM - t) / 300) : 1));
    }
    for(const e of estouros){
      const u = t - e.t0; if(u > 320) continue; const q = u / 320;
      clarao(e.x, e.y, u, 220, (e.card ? 30 : 22) * s, .9);
      g.globalCompositeOperation = soma; g.strokeStyle = claro ? '#B8862B' : cor; g.lineWidth = 2.4 * (1 - q) + .4; g.globalAlpha = 1 - q;
      g.beginPath(); g.ellipse(e.x, e.y, (6 + q * 26) * s, (3 + q * 10) * s, 0, 0, TAU); g.stroke();
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    g.globalCompositeOperation = soma; g.fillStyle = claro ? '#C98A1A' : luz;
    for(const f of faiscas){ if(f.vida <= 0) continue; g.globalAlpha = f.vida; g.beginPath(); g.arc(f.x, f.y, 1.6 * s, 0, TAU); g.fill(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    return [(Math.random() - .5) * 2 * tremor, (Math.random() - .5) * 2 * tremor];
  }
  const fase = t => t < CARGA ? 'a aura do Zeno sobe do card' : t < SOBE ? 'o dragão sobe' : t < ESTOURA ? 'a curva no alto'
    : t < ESTOURA + 400 ? 'ryūseigun: o dragão se desfaz' : t < FIM - 300 ? 'a chuva de dragões' : t < FIM ? 'apagando' : '';
  return {quadro, fase};
}

function dispara(r, o = {}){
  const alvo = o.alvo || document.body, cam = camada(alvo), lento = o.lento || 1, el = o.el, antes = el ? el.style.translate : '';
  const fx = cria(cam.g, cam.w, cam.h, {x: r.left - cam.ox, y: r.top - cam.oy, w: r.width, h: r.height},
    {cor: o.cor || ZENO, claro: o.claro ?? fundoClaro()}, sorteio(Math.random() * 4294967296));
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

// a fonte japonesa (Dela Gothic One, do Google Fonts, só com as letras do nome): o jogo junta 龍星群ドラゴンダイヴ ao &text=
function fonte(){
  const txt = NOME + LEITURA;
  let l = document.getElementById('f-dela-ryu');
  if(!l){ l = document.createElement('link'); l.id = 'f-dela-ryu'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap&text=' + encodeURIComponent(txt); document.head.append(l);
    l.pronto = new Promise(ok => { l.onload = l.onerror = ok; }); }
  return (l.pronto || Promise.resolve()).then(() => document.fonts && document.fonts.load('20px "Dela Gothic One"', txt)).catch(() => {});
}

// bancada: uma lista de tarefas na tela preta; cada uma concluída sobe um andar (o aviso do jogo aparece embaixo) e o
// dragão sai dela, na tela inteira (como no jogo). "card largo" deixa a lista da largura da tela, como a Lista do jogo
const TAREFAS = ['Ler 20 páginas', 'Treinar 30 min', 'Responder os e-mails', 'Revisar os flashcards'];
function liga(palco, cfg){
  const antes = palco.style.cssText, lista = document.createElement('div'), aviso = document.createElement('div');
  palco.style.cursor = 'default'; palco.style.overflow = 'hidden';
  aviso.style.cssText = 'position:absolute;left:50%;bottom:18px;translate:-50% 0;padding:9px 16px;border-radius:10px;font:600 14px var(--f-ui);opacity:0;transition:opacity .2s;pointer-events:none;z-index:4';
  const cards = TAREFAS.map(n => {
    const c = document.createElement('div'); c.innerHTML = `<i></i><span>${n}</span>`;
    c.style.cssText = 'position:relative;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:10px;border:1px solid;cursor:pointer;font:14px var(--f-ui)';
    c.firstChild.style.cssText = 'width:22px;height:22px;border-radius:50%;border:2px solid var(--amb);flex:none';
    c.onclick = () => conclui(c); lista.append(c); return c;
  });
  const pinta = () => {
    lista.style.cssText = `position:absolute;left:50%;top:62%;transform:translate(-50%,-50%);width:${cfg.largo ? '94%' : 'min(380px,64%)'};display:grid;gap:12px`;
    palco.style.background = cfg.claro ? '#F2F3F7' : '#000';
    aviso.style.background = cfg.claro ? '#1B1D28' : '#E6E8F0'; aviso.style.color = cfg.claro ? '#E6E8F0' : '#1B1D28';
    for(const c of cards){ c.style.background = cfg.claro ? '#FFFFFF' : '#1B1D28'; c.style.borderColor = cfg.claro ? '#D9DCE5' : '#2A2D3C';
      c.style.color = c.feito ? (cfg.claro ? '#8A8FA0' : '#6B7088') : (cfg.claro ? '#1B1D28' : '#E6E8F0'); }
  };
  let ultimo = null, andar = 97, some = 0;
  function conclui(c){
    if(c.feito || (ultimo && !ultimo.acabou)) return;
    c.feito = true; c.firstChild.style.background = 'var(--amb)'; c.lastChild.style.textDecoration = 'line-through'; pinta();
    ultimo = dispara(c.getBoundingClientRect(), {alvo: document.body, el: c, claro: !!cfg.claro, cor: cfg.cor, lento: cfg.lento});
    andar++; aviso.innerHTML = `▲ Andar ${andar} <small style="font-weight:400;opacity:.7">a torre sobe</small>`; aviso.style.opacity = 1;
    clearTimeout(some); some = setTimeout(() => { aviso.style.opacity = 0; }, 2600 * cfg.lento);
    setTimeout(() => { c.feito = false; c.firstChild.style.background = ''; c.lastChild.style.textDecoration = ''; pinta(); }, 3400 * cfg.lento);
  }
  const tecla = e => { if(e.code !== 'Space' || e.target.closest('input,button')) return; e.preventDefault(); const c = cards.find(c => !c.feito); if(c) conclui(c); };
  document.addEventListener('keydown', tecla);
  palco.append(lista, aviso); pinta(); fonte();
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); },
    estado: () => ({andar, t: ultimo && ultimo.t, acabou: ultimo && ultimo.acabou}),
    legenda: () => `andar ${andar}` + (ultimo && !ultimo.acabou ? ' · ' + ultimo.fase(ultimo.t || 0) : ''),
    desliga(){ document.removeEventListener('keydown', tecla); clearTimeout(some); lista.remove(); aviso.remove(); palco.style.cssText = antes; },
  };
}

// prévias paradas: seis momentos no escuro (mesma semente) e os mesmos no claro
const MOMENTOS = [[220, 'a aura sobe do card'], [760, 'o dragão sobe'], [1300, 'a curva no alto'], [1560, 'ryūseigun: se desfaz'], [1900, 'a chuva de dragões'], [2250, 'os impactos']];
function previas(el, cfg){
  const W = 440, H = 380, R = {x: 130, y: 300, w: 180, h: 44};
  const momento = (t, claro) => {
    const c = document.createElement('canvas'), d = devicePixelRatio || 1; c.className = 'prev';
    c.width = W * d; c.height = H * d; c.style.width = W + 'px'; c.style.height = H + 'px';
    const g = c.getContext('2d'); g.scale(d, d);
    g.fillStyle = claro ? '#F2F3F7' : '#0F1016'; g.fillRect(0, 0, W, H);
    g.fillStyle = claro ? '#FFFFFF' : '#1B1D28'; g.strokeStyle = claro ? '#D9DCE5' : '#2A2D3C';
    g.beginPath(); g.roundRect(R.x, R.y, R.w, R.h, 10); g.fill(); g.stroke();
    g.fillStyle = '#E0AF68'; g.beginPath(); g.arc(R.x + 25, R.y + 22, 10, 0, 7); g.fill();
    g.fillStyle = claro ? '#8A8FA0' : '#6B7088'; g.font = '14px system-ui,sans-serif'; g.fillText('Ler 20 páginas', R.x + 46, R.y + 27);
    cria(g, W, H, R, {cor: cfg.cor || ZENO, claro, escala: .8}, sorteio(5)).quadro(t);
    return c;
  };
  const linhas = [false, true];
  el.innerHTML = linhas.map(claro => `<section><h2>${claro ? 'no claro' : 'no escuro'}: ${MOMENTOS.map(x => x[1]).join(' · ')}</h2><div class="linha"></div></section>`).join('');
  const ls = el.querySelectorAll('.linha');
  fonte().then(() => linhas.forEach((claro, i) => MOMENTOS.forEach(([t]) => ls[i].append(momento(t, claro)))));
}

(window.CURSORES = window.CURSORES || {}).dragao = {dispara, liga, previas, cria,
  titulo: 'clique numa tarefa (ou aperte espaço): cada uma sobe um andar',
  dica: 'épico: só no andar novo e no chefão derrotado, no lugar dos fogos, ~2,9 s na tela toda<br>a aura do Zeno sobe do card, o dragão sai serpenteando (corpo e bigodes com física), dá a volta no alto com o nome da técnica, se desfaz em dragõezinhos que mergulham na tela e no card<br>câmera lenta para ver o dragão',
  controles: [{k: 'largo', rot: 'card largo', min: 0, max: 1, un: '', padrao: 0},
    {k: 'lento', rot: 'câmera lenta', min: 1, max: 10, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
