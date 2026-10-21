// Rastro de aura (fx-rastro), em código, sem imagem: o que o cursor deixa por onde passa, o tempo todo.
// Três modelos para o Caio escolher (20/10), cada um com a sua física:
//   1 · Aura (Ten e Ren): vapor de aura que sai do cursor e sobe ondulando, como a aura no anime; parado, o Ten ainda
//       solta fiapos por uns segundos, cada vez menos; o clique é o Ren: a aura estoura em volta e sobe.
//   2 · Fio de aura: uma fita contínua presa à ponta, com física de corda: arrasta, chicoteia nas viradas e solta
//       faíscas na ponta quando estala; parada, ondula como chama e se recolhe para dentro do cursor; o clique manda
//       um pulso de aura correndo pela fita.
//   3 · Eco (o Rhythm Echo do Killua, do Pacote Zoldyck): rápido, o cursor deixa imagens atrasadas de si, com a cor
//       partida e gaguejando; ao parar, os ecos alcançam o cursor e se fundem num lampejo; o clique abre os quatro
//       ecos em roda, girando, e fecha.
//   const r = CURSORES.rastro.liga(elemento, {modelo: 1, claro: false})   r.ajusta({modelo: 2})   r.legenda()   r.desliga()
//   (elemento = document.body no jogo; as cores são --aura e --volt do tema; claro = tema claro, em tinta, sem brilho
//    somado; sem claro, decide pelo fundo; auto = anda sozinho enquanto ninguém mexe, só para as prévias)
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const ESCURO = {aura: '#B4A0FF', volt: '#9FD3FF', luz: '#F2EEFF'}, CLARO = {aura: '#6B4FD8', volt: '#1F78C8', luz: '#241A5C'};
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t, cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgba = (h, a) => `rgba(${rgb(h).join(',')},${a})`;

// a mancha de aura (degradê redondo), desenhada uma vez por cor e reusada em cada partícula
function mancha(cor){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(cor, 1)); gr.addColorStop(.35, rgba(cor, .45)); gr.addColorStop(1, rgba(cor, 0));
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c;
}

// 1 · Aura: partículas soltas ao longo do caminho (o segmento entre dois eventos é preenchido, então o mouse rápido
// deixa um rio contínuo), empurradas por um campo que ondula e por um empuxo para cima
function aura(g, P){
  const ps = [], aneis = [], S = {a: mancha(P.aura), v: mancha(P.volt), l: mancha(P.luz)};
  let t = 0, resto = 0, q = 1, nucleo = 0;
  const nova = (x, y, vx, vy, o) => { if(ps.length > 260) ps.shift(); ps.push({x, y, vx, vy, i: 0, f: Math.random() * TAU, ...o}); };
  return {
    segmento(x0, y0, x1, y1, v){
      // uma partícula a cada PASSO px andados, levando o resto de um evento para o outro: o número de partículas depende
      // da distância, não de quantos eventos o mouse manda (um mouse de 1000 Hz manda 16 por quadro)
      const d = Math.hypot(x1 - x0, y1 - y0); if(d < .5) return;
      const PASSO = 9 / q, ux = (x1 - x0) / d, uy = (y1 - y0) / d, forca = cl(v / 1400);
      resto = Math.min(resto, PASSO);
      for(let a = PASSO - resto; a <= d; a += PASSO){
        const x = x0 + ux * a, y = y0 + uy * a;
        // o corpo: vapor que fica para trás, mais largo quanto mais rápido
        nova(x + (Math.random() - .5) * 4, y + (Math.random() - .5) * 4, -ux * v * .04 + (Math.random() - .5) * 30, -uy * v * .04 - 20 - Math.random() * 30,
          {vida: .55 + Math.random() * .5, r0: 6 + forca * 5, r1: 18 + forca * 14, s: Math.random() < .62 ? S.a : S.v, a: .3});
        // o núcleo quente, curto, colado no caminho
        if(nucleo++ % 2 === 0) nova(x, y, 0, -30, {vida: .25, r0: 5, r1: 2, s: S.l, a: .6});
      }
      resto = (resto + d) % PASSO;
    },
    clique(x, y){
      aneis.push({x, y, i: 0});
      for(let k = 0; k < 44; k++){ const a = k / 44 * TAU + Math.random() * .2, sp = 140 + Math.random() * 150;
        nova(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 40, {vida: .7 + Math.random() * .5, r0: 8, r1: 30, s: k % 3 ? S.a : S.v, a: .26}); }
    },
    passo(dt, c){
      t += dt; q = c.q;
      // Ten: parado, a aura continua saindo em fiapos que sobem, cada vez menos, até apagar em 2,2 s
      if(c.dentro && c.parado > .08 && c.parado < 2.2 && Math.random() < 20 * q * (1 - c.parado / 2.2) * dt){
        const a = Math.random() * TAU;
        nova(c.x + Math.cos(a) * 5, c.y + Math.sin(a) * 5 + 2, Math.cos(a) * 10, -40 - Math.random() * 30,
          {vida: .9 + Math.random() * .4, r0: 5, r1: 18, s: Math.random() < .6 ? S.a : S.v, a: .22});
      }
      const ar = Math.exp(-2.4 * dt);
      for(let k = ps.length - 1; k >= 0; k--){
        const p = ps[k]; p.i += dt / p.vida; if(p.i >= 1){ ps.splice(k, 1); continue; }
        p.vx = p.vx * ar + Math.sin(p.y * .045 + t * 2.3 + p.f) * 90 * dt;
        p.vy = p.vy * ar + (Math.cos(p.x * .04 + t * 1.9 + p.f) * 50 - 110) * dt;   // sobe ondulando, como chama
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for(let k = aneis.length - 1; k >= 0; k--) if((aneis[k].i += dt / .38) >= 1) aneis.splice(k, 1);
      return ps.length > 0 || aneis.length > 0;
    },
    desenha(){
      g.globalCompositeOperation = P.claro ? 'multiply' : 'lighter';
      for(const p of ps){ const r = lerp(p.r0, p.r1, p.i);
        g.globalAlpha = p.a * Math.min(1, p.i * 10) * (1 - p.i) ** 1.4; g.drawImage(p.s, p.x - r, p.y - r, r * 2, r * 2); }
      g.strokeStyle = P.volt;
      for(const n of aneis){ const e = 1 - (1 - n.i) ** 3;
        g.globalAlpha = (1 - n.i) ** 2 * .8; g.lineWidth = 3 * (1 - n.i) + .5; g.beginPath(); g.arc(n.x, n.y, 10 + 70 * e, 0, TAU); g.stroke(); }
    },
    estado: () => `${ps.length} partículas`,
  };
}

// 2 · Fio: uma corda de nós (Verlet) presa à ponta do cursor; o empuxo e uma onda que corre da ponta para a cauda fazem
// ela ondular como chama; a largura afina até a cauda, e a cor vem de três passadas (halo, corpo e núcleo)
function fio(g, P){
  const N = 26, nos = Array.from({length: N}, () => ({x: 0, y: 0, px: 0, py: 0})), fa = [];
  let vivo = false, seg = 0, t = 0, pulso = -1, chicote = false, cx = 0, cy = 0;
  return {
    clique(){ pulso = 0; chicote = true; },
    passo(dt, c){
      t += dt;
      if(!vivo && c.dentro && c.parado < .05){ vivo = true; seg = 0; for(const n of nos){ n.x = n.px = c.x; n.y = n.py = c.y; } }
      if(vivo){
        // estica um pouco com a velocidade; parado ou fora da tela, se recolhe para dentro do cursor
        const alvo = !c.dentro || c.parado > 1.8 ? 0 : 7 + cl(c.v / 1500) * 4;
        seg = lerp(seg, alvo, 1 - Math.exp(-(alvo ? 6 : 1.6) * dt));
        if(!alvo && seg < .25) vivo = false;
      }
      if(vivo){
        cx = c.x; cy = c.y;
        const sub = 3, d = dt / sub;
        for(let s = 0; s < sub; s++){
          const h = nos[0]; h.px = h.x; h.py = h.y; h.x = lerp(h.x, cx, (s + 1) / sub); h.y = lerp(h.y, cy, (s + 1) / sub);
          for(let i = 1; i < N; i++){
            const n = nos[i], q = i / (N - 1), vx = (n.x - n.px) * .965, vy = (n.y - n.py) * .965;
            n.px = n.x; n.py = n.y;
            n.x += vx + Math.sin(t * 4.2 - i * .3) * 300 * q * d * d; n.y += vy - 260 * q * d * d;
          }
          if(chicote){ chicote = false;   // o clique dá um tranco de lado, que corre como chicote
            for(let i = 1; i < N; i++){ const a = nos[i - 1], b = nos[i], l = Math.hypot(b.x - a.x, b.y - a.y) || 1, k = Math.sin(i * .5) * 5 * (i / N);
              b.px += (b.y - a.y) / l * k; b.py -= (b.x - a.x) / l * k; } }
          for(let it = 0; it < 4; it++) for(let i = 1; i < N; i++){
            const a = nos[i - 1], b = nos[i], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1e-6, f = (l - seg) / l;
            if(i === 1){ b.x -= dx * f; b.y -= dy * f; } else { b.x -= dx * f * .5; b.y -= dy * f * .5; a.x += dx * f * .5; a.y += dy * f * .5; }
          }
        }
        // a cauda estala: rápida demais, solta faíscas com a velocidade dela
        const r = nos[N - 1], vx = (r.x - r.px) / d, vy = (r.y - r.py) / d;
        if(Math.hypot(vx, vy) > 1500 && Math.random() < .6 && fa.length < 60) fa.push({x: r.x, y: r.y, vx: vx * .5 + (Math.random() - .5) * 200, vy: vy * .5 + (Math.random() - .5) * 200, i: 0});
      }
      if(pulso >= 0 && (pulso += dt / .5) > 1) pulso = -1;
      for(let k = fa.length - 1; k >= 0; k--){ const p = fa[k]; if((p.i += dt / .35) >= 1){ fa.splice(k, 1); continue; }
        p.vy += 900 * dt; p.vx *= Math.exp(-3 * dt); p.x += p.vx * dt; p.y += p.vy * dt; }
      return vivo || fa.length > 0;
    },
    desenha(){
      g.globalCompositeOperation = P.claro ? 'source-over' : 'lighter';
      if(vivo){
        const W0 = 5 * cl(seg / 7) ** .5, borda = nos.map((n, i) => {
          const a = nos[Math.max(0, i - 1)], b = nos[Math.min(N - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, q = i / (N - 1);
          let w = W0 * (1 - q) ** .85; if(pulso >= 0) w *= 1 + 1.6 * Math.exp(-(((q - pulso) / .09) ** 2));
          return {x: n.x, y: n.y, nx: -dy / l, ny: dx / l, w};
        });
        const h = nos[0], r = nos[N - 1];
        const passadas = P.claro ? [[3.4, P.aura, .12], [1.6, P.volt, .35], [.5, P.luz, .9]] : [[3.6, P.aura, .12], [1.8, P.volt, .3], [.5, P.luz, .95]];
        for(const [k, cor, al] of passadas){
          const gr = g.createLinearGradient(h.x, h.y, r.x + .01, r.y + .01);
          gr.addColorStop(0, rgba(cor, al)); gr.addColorStop(.7, rgba(cor, al * .6)); gr.addColorStop(1, rgba(cor, 0));
          g.globalAlpha = 1; g.fillStyle = gr; g.beginPath();
          borda.forEach((b, i) => i ? g.lineTo(b.x + b.nx * b.w * k, b.y + b.ny * b.w * k) : g.moveTo(b.x + b.nx * b.w * k, b.y + b.ny * b.w * k));
          for(let i = N - 1; i >= 0; i--){ const b = borda[i]; g.lineTo(b.x - b.nx * b.w * k, b.y - b.ny * b.w * k); }
          g.closePath(); g.fill();
        }
      }
      g.lineWidth = 1.4; g.lineCap = 'round';
      for(const p of fa){ g.globalAlpha = 1 - p.i; g.strokeStyle = p.i < .3 ? P.luz : P.volt;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .02, p.y - p.vy * .02); g.stroke(); }
    },
    estado: () => vivo ? `fita ${Math.round(seg * (N - 1))} px` + (fa.length ? ` · faíscas ${fa.length}` : '') : 'fita recolhida',
  };
}

// 3 · Eco: o cursor de 0,05 a 0,2 s atrás (lido de um histórico de posições), em quatro cópias; a força (E) sobe com a
// velocidade e cai devagar, e como o histórico converge para o cursor quando ele para, os ecos o alcançam sozinhos
const SETA = [[0, 0], [0, 17], [4.2, 13.2], [7.1, 19.4], [9.9, 18.2], [7.1, 12.2], [12.4, 12.2]];
const seta = (g, x, y) => { g.beginPath(); SETA.forEach(([a, b], i) => i ? g.lineTo(x + a, y + b) : g.moveTo(x + a, y + b)); g.closePath(); };
function eco(g, P){
  const ATRASO = [.05, .1, .15, .2], K = ATRASO.length, hist = [], lampejos = [];
  let E = 0, roda = -1, abriu = false, quadro = 0, cx = 0, cy = 0, agora = 0;
  const em = tt => {   // a posição do cursor no instante tt (entre duas amostras do histórico)
    if(!hist.length) return {x: cx, y: cy};
    for(let k = hist.length - 1; k > 0; k--){ const a = hist[k - 1], b = hist[k];
      if(a.t <= tt){ const u = b.t > a.t ? cl((tt - a.t) / (b.t - a.t)) : 1; return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u)}; } }
    return {x: hist[0].x, y: hist[0].y};
  };
  const lampejo = a => lampejos.push({x: cx + 5, y: cy + 9, i: 0, a});
  return {
    clique(){ roda = 0; },
    passo(dt, c){
      agora = c.t; cx = c.x; cy = c.y; quadro++;
      hist.push({t: agora, x: cx, y: cy}); while(hist.length > 2 && hist[0].t < agora - .3) hist.shift();
      const alvo = c.dentro ? cl((c.v - 300) / 800) : 0;
      E = lerp(E, alvo, 1 - Math.exp(-(alvo > E ? 14 : 2.2) * dt));
      const ult = em(agora - ATRASO[K - 1]), esp = Math.hypot(ult.x - cx, ult.y - cy);
      if(esp > 60 && E > .3) abriu = true;
      if(abriu && esp < 2.5){ abriu = false; if(E > .12){ lampejo(E); E = 0; } }   // os ecos alcançaram: fundem num lampejo
      if(E < .05) abriu = false;
      if(roda >= 0 && (roda += dt / .6) >= 1){ roda = -1; lampejo(1); }
      for(let k = lampejos.length - 1; k >= 0; k--) if((lampejos[k].i += dt / .3) >= 1) lampejos.splice(k, 1);
      return E > .02 || roda >= 0 || lampejos.length > 0;
    },
    desenha(){
      g.lineJoin = 'round'; g.lineCap = 'round';
      const ecos = [];
      for(let k = 0; k < K; k++){
        if(roda >= 0){   // Rhythm Echo: os quatro abrem em roda em volta do cursor, giram e voltam
          const s = Math.sin(Math.PI * roda), R = 46 * s ** .6, an = k * TAU / K + roda * TAU * .6 - Math.PI / 4;
          ecos.push({x: cx + Math.cos(an) * R, y: cy + Math.sin(an) * R, a: .9 * s ** .4});
        } else { const p = em(agora - ATRASO[k]); ecos.push({...p, a: E * (1 - k * .17)}); }
      }
      // os riscos de velocidade, de um eco ao outro
      g.globalCompositeOperation = P.claro ? 'multiply' : 'lighter'; g.strokeStyle = P.volt; g.lineWidth = 1;
      if(roda < 0) ecos.forEach((e, k) => { const a = k ? ecos[k - 1] : {x: cx, y: cy};
        if(e.a < .03) return; g.globalAlpha = e.a * .3; g.beginPath(); g.moveTo(a.x + 5, a.y + 9); g.lineTo(e.x + 5, e.y + 9); g.stroke(); });
      for(let k = K - 1; k >= 0; k--){
        const {x, y, a} = ecos[k];
        if(a < .03) continue;
        if(roda < 0 && E > .45 && (quadro + k * 2) % 7 === 0) continue;   // gagueja, como o eco no anime
        // a cor parte na direção do movimento: aura atrás, volt na frente
        const dx = cx - x, dy = cy - y, l = Math.hypot(dx, dy) || 1, o = 1.2 + 2.4 * a, ox = dx / l * o, oy = dy / l * o;
        g.globalCompositeOperation = P.claro ? 'source-over' : 'lighter';
        g.globalAlpha = a * (P.claro ? .55 : .22); seta(g, x, y); g.fillStyle = P.claro ? '#FFFFFF' : P.luz; g.fill();
        if(P.claro) g.globalCompositeOperation = 'multiply';
        g.globalAlpha = a; g.lineWidth = P.claro ? 1.6 : 1.5;
        seta(g, x - ox, y - oy); g.strokeStyle = P.aura; g.stroke();
        seta(g, x + ox, y + oy); g.strokeStyle = P.volt; g.stroke();
      }
      g.globalCompositeOperation = P.claro ? 'multiply' : 'lighter';
      for(const f of lampejos){ const e = 1 - (1 - f.i) ** 2, r = 8 + 20 * e;
        g.globalAlpha = (1 - f.i) * .9 * Math.max(.5, f.a); g.strokeStyle = P.volt; g.lineWidth = 2 * (1 - f.i) + .6;
        g.beginPath(); g.arc(f.x, f.y, r, 0, TAU); g.stroke();
        g.strokeStyle = P.luz; g.beginPath();
        for(let j = 0; j < 8; j++){ const an = j * TAU / 8 + .2, r2 = r + 4 + 10 * (1 - f.i); g.moveTo(f.x + Math.cos(an) * (r + 3), f.y + Math.sin(an) * (r + 3)); g.lineTo(f.x + Math.cos(an) * r2, f.y + Math.sin(an) * r2); }
        g.stroke(); }
    },
    estado: () => roda >= 0 ? 'Rhythm Echo (roda)' : `eco ${Math.round(E * 100)}%`,
  };
}

const MODELOS = [{nome: 'Aura (Ten e Ren)', cria: aura}, {nome: 'Fio de aura', cria: fio}, {nome: 'Eco do Killua (Rhythm Echo)', cria: eco}];

function liga(alvo, op = {}){
  const tela = alvo === document.body || alvo === document.documentElement;
  const cfg = {modelo: 1, claro: null, auto: false, toque: false, ...op};
  const cv = document.createElement('canvas'), g = cv.getContext('2d');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:${tela ? 58 : 1}`;
  (tela ? document.body : alvo).append(cv);
  const cursorAntes = tela ? '' : alvo.style.cursor; if(!tela) alvo.style.cursor = 'default';   // o rastro fica atrás da seta de verdade
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, D = 1;
  const mede = () => { const r = tela ? {width: innerWidth, height: innerHeight} : alvo.getBoundingClientRect();
    D = +cfg.modelo === 3 ? Math.min(2, devicePixelRatio || 1) : 1; W = r.width; H = r.height; cv.width = Math.ceil(W * D); cv.height = Math.ceil(H * D); };
  mede();
  const obs = tela ? null : new ResizeObserver(mede); if(obs) obs.observe(alvo); else addEventListener('resize', mede);

  const fundoClaro = () => { const m = getComputedStyle(tela ? document.body : alvo).backgroundColor.match(/[\d.]+/g);
    return !!m && (m[3] === undefined || +m[3] > .5) && (.2126 * m[0] + .7152 * m[1] + .0722 * m[2]) / 255 > .55; };
  function paleta(){
    const claro = cfg.claro === null || cfg.claro === undefined ? fundoClaro() : !!+cfg.claro, B = claro ? CLARO : ESCURO;
    const css = getComputedStyle(document.documentElement), le = (k, p) => { const v = css.getPropertyValue(k).trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : p; };
    return {claro, aura: le('--aura', B.aura), volt: le('--volt', B.volt), luz: B.luz};
  }
  let M, n;
  const monta = () => { n = cl(Math.round(+cfg.modelo) || 1, 1, MODELOS.length); mede(); M = MODELOS[n - 1].cria(g, paleta()); };
  monta();

  const c = {x: 0, y: 0, v: 0, parado: 9, dentro: false, t: 0, q: 1};
  let medio = 1 / 60, visivel = true;
  let ultMov = 0, pedido = 0, antes = 0, mexeuEm = -9;
  function move(x, y, ts){
    const d = Math.hypot(x - c.x, y - c.y), dt = Math.max(ts - ultMov, 1 / 240);
    if(c.dentro){ c.v = lerp(c.v, Math.min(d / dt, 6000), .35); if(M.segmento) M.segmento(c.x, c.y, x, y, c.v); }
    c.x = x; c.y = y; c.dentro = true; c.parado = 0; ultMov = ts; acorda();
  }
  const pos = e => { if(tela) return [e.clientX, e.clientY]; const r = alvo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const vale = e => e.pointerType === 'mouse' || cfg.toque;
  const ev = tela ? window : alvo;
  const ouvintes = [
    ['pointermove', e => { if(!vale(e)) return; mexeuEm = e.timeStamp / 1000;
      const l = e.getCoalescedEvents ? e.getCoalescedEvents() : []; for(const q of l.length ? l : [e]){ const [x, y] = pos(q); move(x, y, q.timeStamp / 1000); } }],
    ['pointerdown', e => { if(!vale(e)) return; mexeuEm = e.timeStamp / 1000; const [x, y] = pos(e); if(!c.dentro) move(x, y, e.timeStamp / 1000); M.clique(x, y); acorda(); }],
    tela ? ['mouseout', e => { if(!e.relatedTarget) c.dentro = false; }] : ['pointerleave', () => { c.dentro = false; }],
  ];
  if(!calmo) ouvintes.forEach(([k, f]) => ev.addEventListener(k, f, {passive: true}));

  // prévias: anda sozinho num oito, rápido, devagar e parado (com um clique), enquanto ninguém mexe
  let u = Math.random() * 10, fase = 0, tf = 0, clicou = false;
  const FASES = [{d: 1.5, vel: 3.4}, {d: .9, vel: .8}, {d: 1.3, vel: 0}];
  function anda(dt, ts){
    if(ts - mexeuEm < 2.5) return;
    if((tf += dt) > FASES[fase].d){ tf = 0; fase = (fase + 1) % FASES.length; clicou = false; }
    const F = FASES[fase];
    if(F.vel){ u += F.vel * dt; move(W / 2 + W * .36 * Math.sin(u * 1.3), H / 2 + H * .32 * Math.sin(u * 2.1 + .6), ts); }
    else if(!clicou && tf > .5){ clicou = true; M.clique(c.x, c.y); }
  }

  function acorda(){ if(!pedido && !calmo){ antes = 0; pedido = requestAnimationFrame(quadro); } }
  function quadro(ms){
    pedido = 0; if(!cv.isConnected){ api.desliga(); return; }
    const ts = ms / 1000, real = antes ? ts - antes : 1 / 60, dt = Math.min(real, 1 / 30); antes = ts;
    medio = lerp(medio, Math.min(real, .1), .05); c.q = cl((1 / 40) / medio, .35, 1);   // abaixo de ~40 qps, solta menos
    if(cfg.auto) anda(dt, ts);
    c.t = ts;
    if(c.dentro){ c.parado = Math.max(0, ts - ultMov); if(c.parado > .05) c.v *= Math.exp(-9 * dt); }   // parado, a velocidade cai
    g.setTransform(D, 0, 0, D, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    const vivo = M.passo(dt, c); M.desenha();
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    if(visivel && (vivo || cfg.auto || (c.dentro && c.parado < 3))) pedido = requestAnimationFrame(quadro);
  }
  // fora da vista (prévia rolada para longe, aba escondida), não desenha nada
  const io = tela ? null : new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if(visivel && cfg.auto) acorda(); });
  if(io) io.observe(alvo);
  if(cfg.auto) acorda();

  const api = {
    ajusta(o){ const era = [cfg.modelo, cfg.claro]; Object.assign(cfg, o); if(era[0] !== cfg.modelo || era[1] !== cfg.claro){ monta(); acorda(); } },
    legenda: () => `${n} · ${MODELOS[n - 1].nome} · ${Math.round(c.v)} px/s · ${M.estado()}`,
    desliga(){
      ouvintes.forEach(([k, f]) => ev.removeEventListener(k, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede); if(io) io.disconnect();
      cancelAnimationFrame(pedido); pedido = 0; cv.remove(); if(!tela) alvo.style.cursor = cursorAntes;
    },
  };
  return api;
}

// prévias para a bancada: os três andando sozinhos lado a lado, no escuro e no claro (montadas uma vez; os controles
// só mudam a tela grande)
function previas(el){
  if(el.querySelector('.rastros')) return;
  const linha = (claro) => `<section><h2>os três lado a lado, ${claro ? 'no claro' : 'no escuro'} (andam sozinhos; passe o mouse para guiar, clique)</h2>
    <div class="rastros" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">${MODELOS.map((m, i) =>
      `<figure style="margin:0"><div class="palco" data-m="${i + 1}" data-claro="${claro}" style="height:260px;background:${claro ? '#F4F1EA' : '#000'}"></div>
      <figcaption style="font:12px var(--f-mono);color:var(--dim);margin-top:6px">${i + 1} · ${m.nome}</figcaption></figure>`).join('')}</div></section>`;
  el.innerHTML = linha(0) + linha(1);
  el.querySelectorAll('.palco').forEach(p => liga(p, {modelo: +p.dataset.m, claro: +p.dataset.claro, auto: true}));
}

(window.CURSORES = window.CURSORES || {}).rastro = {liga, previas, modelos: MODELOS.map(m => m.nome),
  titulo: 'mexa o mouse na tela preta · rápido e devagar · pare · clique',
  dica: '1 · Aura: vapor que sobe ondulando; parado, o Ten solta fiapos; clique = Ren (estoura em volta)<br>'
    + '2 · Fio: fita com física de corda, chicoteia nas viradas e estala em faíscas; parada, ondula e se recolhe; clique = pulso pela fita<br>'
    + '3 · Eco: rápido, ecos atrasados do cursor com a cor partida; ao parar, alcançam o cursor num lampejo; clique = Rhythm Echo (os quatro em roda)',
  controles: [{k: 'modelo', rot: 'modelo', min: 1, max: 3, un: '', padrao: 1}]};
})();
