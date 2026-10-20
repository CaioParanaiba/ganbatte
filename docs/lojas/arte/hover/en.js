// Hover En (hv-en), feito em código, sem imagem: o que acontece quando o mouse passa pelos cards.
// O En é o Ten esticado até virar um campo que sente tudo o que está dentro dele, e quem o faz é o card, não o cursor
// (nada se desenha no cursor). Ao entrar, o card acende o Ten: a aura cobre o contorno e sobe como chama, mais alta em
// cima. Logo depois o En se abre do ponto tocado: a borda do campo sai do contorno primeiro desse lado e corre em volta,
// passa dos limites do card e para um pouco além do lugar, como quem respira fundo; a borda ondula devagar. Os cards que o
// campo alcança "sentem" o En: cada canto que fica dentro trava com uma cantoneira de aura que pisca forte e fica acesa
// fraca, o contorno do card dá um sinal e ele estremece de leve, como quem percebeu. Com o mouse dentro, o campo pende
// para o lado do cursor e solta pulsos de tempos em tempos, como um sonar: a onda corre do card até a borda e reacende os
// cantos que passa. Ao sair, o En recolhe para dentro do card e o Ten dá um último lampejo. Variação da Pitou: o campo
// fica irregular e solta tentáculos que vão até os cards por perto e os tocam.
// O alcance cai com o tamanho do card: num painel enorme o En mal sai dele. O campo não pinta por cima do próprio card.
// Física de verdade a 240 Hz: cada ponto da borda do campo é uma mola (abre passando do ponto, recolhe sem passar); o
// tremor dos cards sentidos é uma mola curta, só pelas propriedades translate do estilo, que somam com o transform do jogo.
//   const h = CURSORES.en.cola(raiz, {seletor: '.card', alcance: 200, lento: 1, pitou: 0, cor: '#B4A0FF'})   h.ajusta({pitou: 1})   h.desliga()
//   (raiz = document.documentElement no jogo, com o desenho numa camada fixa da tela inteira; ou um elemento, como a tela
//   preta da bancada, com a camada dentro dele; alcance = até quantos px o campo passa do card pequeno; cor = a da aura,
//   sem ela vem do --aura da página; lento = câmera lenta; um elemento com data-sem-en, e o que estiver dentro dele, fica de fora)
//   CURSORES.en.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, um pedaço do jogo de mentira
//   titulo, dica e controles: o que a bancada mostra
(() => {
const DT = 1 / 240, PASSO = 6, CANTO = 10;   // passo da física (s), espaçamento das retas do contorno (px), pontos por quina
const ABRE = .2;                   // segundos para o En dar a volta no card, saindo do ponto tocado
const W_ABRE = 2 * Math.PI * 2.2, Z_ABRE = .5;   // a borda abrindo: mola mole, passa do ponto e volta
const W_FECHA = 2 * Math.PI * 3.4, Z_FECHA = 1;   // recolhendo: sem passar do ponto
const ESPERA = .14;                // segundos depois de entrar até o En abrir (o Ten acende antes)
const PULSO = 1.6, ONDA = 1;       // de quanto em quanto tempo sai um pulso de sonar, e quanto ele leva até a borda
const PENDE = .2;                  // quanto o campo cresce para o lado do cursor
const MAXEN = 2;                   // campos ao mesmo tempo (o mais velho fecha na hora)
const MAXT = 4;                    // tentáculos da Pitou
const LIGA = .12;                  // quanto cada ponto da borda puxa os vizinhos a cada passo (0 a .5)
const TAU = Math.PI * 2;
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = (a, b, x) => { const t = lim((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// cor em hex → rgba com a transparência pedida
const rgba = (hex, a) => { const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${lim(a, 0, 1).toFixed(3)})`; };

// o contorno do card (retângulo de cantos redondos, centrado em 0,0) com a normal para fora; as quinas têm sempre CANTO
// pontos, mesmo sem raio, para a borda do campo ficar redonda longe do card; s = quanto já andou pelo contorno
function contorno(hw, hh, r){
  r = Math.min(r, hw, hh);
  const P = [];
  const reta = (x0, y0, x1, y1, nx, ny) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / PASSO)); for(let i = 0; i < n; i++) P.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, nx, ny]); };
  const arco = (cx, cy, a0) => { for(let i = 0; i < CANTO; i++){ const a = a0 + i / CANTO * Math.PI / 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)]); } };
  reta(-hw + r, -hh, hw - r, -hh, 0, -1); arco(hw - r, -hh + r, -Math.PI / 2);
  reta(hw, -hh + r, hw, hh - r, 1, 0); arco(hw - r, hh - r, 0);
  reta(hw - r, hh, -hw + r, hh, 0, 1); arco(-hw + r, hh - r, Math.PI / 2);
  reta(-hw, hh - r, -hw, -hh + r, -1, 0); arco(-hw + r, -hh + r, Math.PI);
  const S = [0];
  for(let i = 1; i <= P.length; i++){ const a = P[i - 1], b = P[i % P.length]; S.push(S[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]) + 1); }
  return {P, n: P.length, S, L: S[P.length], r};
}
// distância com sinal até um retângulo de cantos redondos (centrado em 0,0): negativa dentro
function sdf(x, y, hw, hh, r){
  const qx = Math.abs(x) - hw + r, qy = Math.abs(y) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function cola(raiz, cfg){
  cfg = Object.assign({seletor: '.card', alcance: 200, lento: 1, pitou: 0}, cfg);
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
  const origem = () => { if(tela) return [0, 0]; const b = raiz.getBoundingClientRect(); return [b.left + raiz.clientLeft, b.top + raiz.clientTop]; };
  const corAura = () => cfg.cor || getComputedStyle(raiz === document.body ? document.documentElement : raiz).getPropertyValue('--aura').trim() || '#B4A0FF';

  // ---- geometria de um card: centro (sem o nosso tremor), meio tamanho, raio da quina
  const tremores = new Map();   // card sentido → {x, y, vx, vy}: o estremecer
  function geo(el, g){
    g = g || {};
    const b = el.getBoundingClientRect(), t = tremores.get(el), tx = t ? t.x : 0, ty = t ? t.y : 0;
    g.cx = b.left + b.width / 2 - tx; g.cy = b.top + b.height / 2 - ty; g.bw = b.width / 2; g.bh = b.height / 2;
    const hw = el.offsetWidth / 2, hh = el.offsetHeight / 2;
    if(hw !== g.hw || hh !== g.hh){ g.hw = hw; g.hh = hh; g.r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, hw, hh); g.mudou = true; }
    return g;
  }

  // ---- o cursor
  let mx = -1e4, my = -1e4, sobre = null;
  // ---- os campos (um por card que o cursor tocou), os cards sentidos e as faíscas do Ten
  const ens = [], sentidos = new Map(), fumos = [];
  let tSentir = 0, abertos = 0, nid = 0;

  // o alcance do card: cheio nos pequenos; nos painéis grandes, o En mal sai deles
  const alcance = g => cfg.alcance * lim(1.25 - Math.sqrt(g.hw * g.hh) / 380, .18, 1);
  function abre(el){
    let v = ens.find(e => e.el === el);
    if(v){ v.fase = 'abre'; v.fechou = false; return v; }
    const g = geo(el); g.mudou = false;
    const k = contorno(g.hw, g.hh, g.r);
    // o ponto tocado: o do contorno mais perto do cursor
    const lx = mx - g.cx, ly = my - g.cy; let i0 = 0, md = Infinity;
    k.P.forEach((p, i) => { const d = (p[0] - lx) ** 2 + (p[1] - ly) ** 2; if(d < md){ md = d; i0 = i; } });
    v = {el, g, k, i0, t: 0, fase: 'abre', D: new Float32Array(k.n), V: new Float32Array(k.n), ten: 0, lampejo: 0, bx: 0, by: 0, bvx: 0, bvy: 0,
      pulsos: [], proxPulso: .55, f: [0, 0, 0, 0].map(() => Math.random() * TAU), tent: new Map(), cantos: new Map()};
    ens.push(v); abertos++;
    while(ens.length > MAXEN) ens.shift();
    return v;
  }
  // o tamanho mudou (a página reflui): refaz o contorno levando junto o tamanho médio do campo
  function refaz(v){
    let soma = 0; for(const d of v.D) soma += d; const med = soma / v.D.length;
    v.k = contorno(v.g.hw, v.g.hh, v.g.r); v.D = new Float32Array(v.k.n).fill(med); v.V = new Float32Array(v.k.n);
    v.i0 = Math.min(v.i0, v.k.n - 1); v.g.mudou = false;
  }
  // até onde vai o campo do ponto i, se nada o estivesse segurando
  function alvo(v, i, A){
    const k = v.k, p = k.P[i];
    const dc = Math.abs(k.S[i] - k.S[v.i0]), dist = Math.min(dc, k.L - dc) / (k.L / 2);   // 0 no ponto tocado, 1 do outro lado
    if(v.fase === 'fecha' || v.t < ESPERA + dist * ABRE) return 0;
    const u = k.S[i] / k.L * TAU, t = v.t, pi = cfg.pitou;
    let f = 1 + PENDE * (p[2] * v.bx + p[3] * v.by);
    f += (1 - pi) * (.035 * Math.sin(3 * u + t * 1.3 + v.f[0]) + .025 * Math.sin(5 * u - t * 2.1 + v.f[1]));
    f += pi * (.13 * Math.sin(2 * u + t * 1.7 + v.f[0]) + .09 * Math.sin(5 * u - t * 2.9 + v.f[1]) + .06 * Math.sin(11 * u + t * 4.3 + v.f[2]) + .02 * Math.sin(17 * u - t * 6 + v.f[3]));
    return A * Math.max(.2, f);
  }

  let tmp = new Float32Array(0);
  function alisa(a){
    const n = a.length; if(tmp.length !== n) tmp = new Float32Array(n);
    tmp.set(a); for(let i = 0; i < n; i++) a[i] = tmp[i] + LIGA * (tmp[(i + n - 1) % n] + tmp[(i + 1) % n] - 2 * tmp[i]);
  }
  function passo(h){
    for(let e = ens.length - 1; e >= 0; e--){
      const v = ens[e], A = alcance(v.g), dentro = sobre === v.el;
      v.t += h;
      if(!dentro && v.fase !== 'fecha'){ v.fase = 'fecha'; v.tf = 0; }
      if(v.fase === 'fecha') v.tf += h;
      // o Ten: acende rápido com o cursor dentro, apaga devagar
      v.ten = v.fase === 'fecha' ? Math.max(0, v.ten - h / .5) : Math.min(1, v.ten + h / .12);
      v.lampejo = Math.max(0, v.lampejo - h / .35);
      // o campo pende para o cursor (mola, para não pular com o mouse)
      const tx = dentro ? lim((mx - v.g.cx) / Math.max(30, v.g.hw), -1, 1) : 0, ty = dentro ? lim((my - v.g.cy) / Math.max(30, v.g.hh), -1, 1) : 0, wb = 2 * Math.PI * 1.6;
      v.bvx += (wb * wb * (tx - v.bx) - 2 * .7 * wb * v.bvx) * h; v.bvy += (wb * wb * (ty - v.by) - 2 * .7 * wb * v.bvy) * h;
      v.bx += v.bvx * h; v.by += v.bvy * h;
      // cada ponto da borda: mola até o alvo (abrindo passa do ponto; recolhendo, não)
      const w = v.fase === 'fecha' ? W_FECHA : W_ABRE, z = v.fase === 'fecha' ? Z_FECHA : Z_ABRE;
      let maior = 0;
      for(let i = 0; i < v.k.n; i++){
        v.V[i] += (w * w * (alvo(v, i, A) - v.D[i]) - 2 * z * w * v.V[i]) * h;
        v.D[i] += v.V[i] * h; if(v.D[i] < 0){ v.D[i] = 0; if(v.V[i] < 0) v.V[i] = 0; }
      }
      // cada ponto da borda puxa os vizinhos (difusão, que só acalma): a borda é uma membrana, não pontos soltos
      alisa(v.D); alisa(v.V);
      for(const d of v.D) if(d > maior) maior = d;
      v.maior = maior;
      // fechou: o Ten dá o último lampejo quando o campo volta para dentro do card
      if(v.fase === 'fecha' && !v.fechou && maior < 6 && v.tf > .05){ v.fechou = true; if(v.abriu) v.lampejo = 1; }
      if(maior > A * .5) v.abriu = true;
      // os pulsos do sonar: só com o cursor dentro e o campo aberto
      if(dentro && v.abriu && (v.proxPulso -= h) <= 0){ v.pulsos.push({t: 0}); v.proxPulso = PULSO; }
      for(let k = v.pulsos.length - 1; k >= 0; k--) if((v.pulsos[k].t += h) > ONDA) v.pulsos.splice(k, 1);
      // os tentáculos da Pitou crescem até o alvo (mola) e voltam ao fechar
      for(const [chave, tn] of v.tent){
        const quer = v.fase === 'fecha' || !tn.vivo ? 0 : 1, wt = 2 * Math.PI * (quer ? 1.8 : 3);
        tn.vq += (wt * wt * (quer - tn.q) - 2 * .5 * wt * tn.vq) * h; tn.q = lim(tn.q + tn.vq * h, 0, 1.1); tn.t += h;
        if(!quer && tn.q < .02) v.tent.delete(chave);
      }
      if(v.fase === 'fecha' && v.fechou && v.ten <= 0 && v.lampejo <= 0 && !v.tent.size && !v.pulsos.length) ens.splice(e, 1);
    }
    // o tremor dos cards sentidos: mola curta e firme
    for(const [el, t] of tremores){
      const w = 2 * Math.PI * 9;
      t.vx += (-w * w * t.x - 2 * .3 * w * t.vx) * h; t.vy += (-w * w * t.y - 2 * .3 * w * t.vy) * h;
      t.x += t.vx * h; t.y += t.vy * h;
    }
    // as labaredas do Ten: línguas de aura presas ao contorno, que sobem, balançam e baixam (mais em cima e nos lados)
    for(const v of ens){
      if(v.ten < .3 || v.fase === 'fecha') continue;
      v.fumoAcc = (v.fumoAcc || 0) + h * Math.min(90, v.k.L / 22);
      while(v.fumoAcc >= 1){
        v.fumoAcc--;
        let i, p, tenta = 0; do { i = Math.floor(Math.random() * v.k.n); p = v.k.P[i]; } while(p[3] > .2 && tenta++ < 8);
        if(p[3] > .2) continue;
        const cima = Math.max(0, -p[3]);
        fumos.push({v, i, t: 0, T: .3 + Math.random() * .35, H: (5 + Math.random() * 9) * (.55 + .45 * cima), w: 2.5 + Math.random() * 2.5, ph: Math.random() * TAU});
      }
    }
    for(let k = fumos.length - 1; k >= 0; k--) if((fumos[k].t += h) > fumos[k].T) fumos.splice(k, 1);
  }

  // ---- sentir: os cards que o campo alcança (até 60, os que estão na tela), canto a canto
  function cardsPerto(v){
    const lista = [];
    for(const el of raiz.querySelectorAll(cfg.seletor)){
      if(el === v.el || el.contains(v.el) || v.el.contains(el) || el.closest('[data-sem-en]')) continue;
      const b = el.getBoundingClientRect();
      if(b.bottom < 0 || b.top > innerHeight || b.right < 0 || b.left > innerWidth || !b.width) continue;
      lista.push(el); if(lista.length >= 60) break;
    }
    return lista;
  }
  // um ponto do mundo visto do campo: a que ponto do contorno ele está de frente, a distância até o card e até a borda
  function frente(v, X, Y){
    const g = v.g, lx = X - g.cx, ly = Y - g.cy, d = sdf(lx, ly, g.hw, g.hh, g.r);
    // o ponto do contorno mais perto, puxado pela normal até a distância d: é o de frente para (X, Y)
    let mi = 0, md = Infinity;
    for(let i = 0; i < v.k.n; i++){ const p = v.k.P[i], ex = p[0] + p[2] * d - lx, ey = p[1] + p[3] * d - ly, q = ex * ex + ey * ey; if(q < md){ md = q; mi = i; } }
    return [mi, d];
  }
  function sente(){
    const agora = performance.now();
    const refaz = agora - tSentir > 400; if(refaz) tSentir = agora;
    const visto = new Set();
    for(const v of ens){
      if(refaz || !v.lista) v.lista = cardsPerto(v);
      const A = alcance(v.g), fechando = v.fase === 'fecha', cands = [], garras = cfg.pitou && !fechando && v.abriu;
      for(const el of v.lista){
        const g = geo(el, (sentidos.get(el) || {}).g), cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        let s = sentidos.get(el);
        // pula os cards bem longe do alcance (nada a sentir)
        const dc = sdf(g.cx - v.g.cx, g.cy - v.g.cy, v.g.hw + g.hw, v.g.hh + g.hh, 0);
        if(dc > A * 1.9 && !s) continue;
        if(!s){ s = {el, id: ++nid, g, a: [0, 0, 0, 0], fl: [0, 0, 0, 0], em: [0, 0, 0, 0], antes: [0, 0, 0, 0], sinal: -1, tinha: false, u: [0, 0, 0, 0]}; sentidos.set(el, s); }
        visto.add(el);
        let algum = false;
        cs.forEach(([sx, sy], c) => {
          const X = g.cx + sx * (g.bw - g.r * .3), Y = g.cy + sy * (g.bh - g.r * .3), [i, d] = frente(v, X, Y), Dv = v.D[i];
          // dentro do campo, ou tocado por um tentáculo da Pitou; os de fora, não muito longe, são alvo dos tentáculos
          const chave = s.id * 4 + c, tn = v.tent.get(chave), noCampo = !fechando && Dv > 4 && d < Dv, den = noCampo || !!(tn && tn.vivo && tn.q > .95);
          if(garras && !noCampo && d < A * 1.8) cands.push({chave, X, Y, d});
          if(den){ algum = true; s.em[c] = 1; if(!s.antes[c]) s.fl[c] = 1; }
          // o pulso do sonar passando pelo canto o reacende
          for(const p of v.pulsos){ const u = suave(0, 1, p.t / ONDA) ** .7; if(den && s.u[c] < d / Dv && u >= d / Dv) s.fl[c] = Math.max(s.fl[c], .75); s.u[c] = u; }
          if(!v.pulsos.length) s.u[c] = 0;
        });
        // o primeiro canto a entrar: o contorno do card dá o sinal e ele estremece, para longe de quem o sentiu
        if(algum && !s.tinha){
          s.sinal = 0;
          const dx = g.cx - v.g.cx, dy = g.cy - v.g.cy, dd = Math.hypot(dx, dy) || 1, m = lim(Math.sqrt(g.hw * g.hh) / 60, 1, 6), im = 70 / m;
          const t = tremores.get(el) || {x: 0, y: 0, vx: 0, vy: 0}; t.vx += dx / dd * im; t.vy += dy / dd * im; tremores.set(el, t);
        }
        s.tinha = s.tinha || algum;
      }
      // os tentáculos da Pitou: até MAXT, para os cantos mais perto que o campo não alcança
      cands.sort((a, b) => a.d - b.d);
      const quer = new Set(cands.slice(0, MAXT).map(c => c.chave));
      for(const [chave, tn] of v.tent) tn.vivo = quer.has(chave);
      for(const c of cands.slice(0, MAXT)){
        let tn = v.tent.get(c.chave);
        if(!tn){ tn = {q: 0, vq: 0, t: Math.random() * 3, ph: Math.random() * TAU, lado: Math.random() < .5 ? -1 : 1, vivo: true}; v.tent.set(c.chave, tn); }
        tn.X = c.X; tn.Y = c.Y;
      }
    }
    // os cantos se apagam fora do campo; o lampejo dos cantos e o sinal do contorno correm no tempo
    for(const [el, s] of sentidos){
      for(let c = 0; c < 4; c++){ s.fl[c] *= .9; s.a[c] = s.em[c] ? Math.min(1, s.a[c] + .2) : Math.max(0, s.a[c] - .06); s.antes[c] = s.em[c]; s.em[c] = 0; }
      if(!s.antes.some(Boolean)) s.tinha = false;
      if(s.sinal >= 0) s.sinal += 1 / 60;
      if(s.sinal > .6) s.sinal = -1;
      if(!visto.has(el) && s.a.every(a => a <= 0) && s.fl.every(f => f < .02) && s.sinal < 0) sentidos.delete(el);
    }
  }

  // ---- desenho
  const caminho = (pts, fecha) => {
    // curva suave pelos pontos (pelo meio de cada par)
    const n = pts.length; if(n < 3) return;
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for(let i = 0; i < n; i++){ const a = pts[i], b = pts[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    if(fecha) ctx.closePath();
  };
  // um retângulo de cantos redondos no sentido contrário (para o furo do card no meio do campo)
  function furo(g, ox, oy){
    const x0 = g.cx - g.bw - ox, y0 = g.cy - g.bh - oy, x1 = g.cx + g.bw - ox, y1 = g.cy + g.bh - oy, r = Math.min(g.r, g.bw, g.bh);
    ctx.moveTo(x0 + r, y0); ctx.arcTo(x0, y0, x0, y1, r); ctx.arcTo(x0, y1, x1, y1, r); ctx.arcTo(x1, y1, x1, y0, r); ctx.arcTo(x1, y0, x0, y0, r); ctx.closePath();
  }
  function retCurvo(x0, y0, x1, y1, r){
    r = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
    ctx.moveTo(x0 + r, y0); ctx.arcTo(x1, y0, x1, y1, r); ctx.arcTo(x1, y1, x0, y1, r); ctx.arcTo(x0, y1, x0, y0, r); ctx.arcTo(x0, y0, x1, y0, r); ctx.closePath();
  }
  function pintaCampo(v, ox, oy, cor, claro){
    const g = v.g, k = v.k, A = alcance(g), ab = suave(0, A * .25, v.maior);
    if(ab <= 0) return;
    const pts = k.P.map((p, i) => [g.cx + p[0] + p[2] * v.D[i] - ox, g.cy + p[1] + p[3] * v.D[i] - oy]);
    // o campo: aura bem fraca, mais forte perto do card; sem pintar por cima dele
    const gr = ctx.createRadialGradient(g.cx - ox, g.cy - oy, Math.min(g.hw, g.hh), g.cx - ox, g.cy - oy, Math.max(g.hw, g.hh) + A * 1.1);
    const fundo = (claro ? .1 : .08) * ab * (1 + cfg.pitou * .5);
    gr.addColorStop(0, rgba(cor, fundo * 1.8)); gr.addColorStop(.6, rgba(cor, fundo)); gr.addColorStop(1, rgba(cor, fundo * .5));
    ctx.beginPath(); caminho(pts, true); furo(g, ox, oy); ctx.fillStyle = gr; ctx.fill('evenodd');
    // os pulsos do sonar: um anel do card até a borda, que some no caminho
    for(const p of v.pulsos){
      const u = suave(0, 1, p.t / ONDA) ** .7, q = (1 - u) ** 1.4;
      ctx.beginPath(); caminho(k.P.map((pp, i) => [g.cx + pp[0] + pp[2] * v.D[i] * u - ox, g.cy + pp[1] + pp[3] * v.D[i] * u - oy]), true);
      ctx.strokeStyle = rgba(cor, .55 * q * ab); ctx.lineWidth = 1 + 1.5 * q; ctx.stroke();
    }
    // a borda: um halo largo e fraco e o fio forte; recolhendo, ela brilha mais (a aura voltando)
    const forte = (v.fase === 'fecha' ? 1 : .8) * ab;
    ctx.beginPath(); caminho(pts, true);
    ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(cor, .16 * forte); ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = rgba(cor, (claro ? 1 : .85) * forte); ctx.lineWidth = 1.4; ctx.stroke();
    // uns tracinhos correndo pela borda, para ela parecer viva
    ctx.setLineDash([2, 14]); ctx.lineDashOffset = -v.t * 30; ctx.strokeStyle = rgba(cor, .9 * forte); ctx.lineWidth = 2.6; ctx.stroke(); ctx.setLineDash([]);
  }
  // um tentáculo da Pitou: sai da borda do campo de frente para o card e vai até ele, afinando e serpenteando
  // (a ponta vai até o canto que o campo não alcançou e o toca)
  function pintaTentaculo(v, tn, ox, oy, cor){
    if(tn.q <= .01 || tn.X === undefined) return;
    const [i, dc] = frente(v, tn.X, tn.Y), p = v.k.P[i], D = v.D[i] * .9;
    if(dc <= D) return;   // o campo já chegou lá
    const ax = v.g.cx + p[0] + p[2] * D, ay = v.g.cy + p[1] + p[3] * D, bx = tn.X, by = tn.Y;
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); if(d < 4) return;
    const q = tn.q, ux = dx / d, uy = dy / d, nx = -uy, ny = ux, N = 22, base = Math.min(9, 3 + d * .06);
    const c = [], lar = [];
    for(let j = 0; j <= N; j++){
      const u = j / N * q, ond = Math.sin(u * 9 - tn.t * 6 + tn.ph) * Math.sin(Math.PI * u) * Math.min(14, d * .14) * tn.lado;
      c.push([ax + dx * u + nx * ond - ox, ay + dy * u + ny * ond - oy]); lar.push(base * (1 - u / Math.max(q, .01)) ** 1.3 + .6);
    }
    const lado = sg => c.map(([x, y], j) => { const a = c[Math.max(0, j - 1)], b = c[Math.min(N, j + 1)], tx = b[0] - a[0], ty = b[1] - a[1], t = Math.hypot(tx, ty) || 1; return [x - ty / t * lar[j] * sg, y + tx / t * lar[j] * sg]; });
    const e = lado(1), di = lado(-1);
    ctx.beginPath(); e.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for(let j = N; j >= 0; j--) ctx.lineTo(di[j][0], di[j][1]); ctx.closePath();
    ctx.fillStyle = rgba(cor, .32); ctx.fill(); ctx.strokeStyle = rgba(cor, .9); ctx.lineWidth = 1; ctx.stroke();
  }
  // o Ten no card tocado: a aura cobre o contorno e sobe como chama (mais alta em cima, tremulando)
  function pintaTen(v, ox, oy, cor){
    const g = v.g, k = v.k, q = suave(0, 1, v.ten), lp = v.lampejo;
    if(q <= 0 && lp <= 0) return;
    const fora = [], dentro = [];
    for(let i = 0; i < k.n; i++){
      const p = k.P[i], cima = Math.max(0, -p[3]), lado = Math.abs(p[2]) * suave(-g.hh, g.hh * .2, -p[1]);
      const chama = .5 + .5 * Math.sin(p[0] * .11 - v.t * 7 + v.f[0]) * Math.sin(p[1] * .09 + v.t * 9.5 + v.f[1]);
      const th = q * (1.4 + (cima * 3.8 + lado * 2.2) * chama + .6 * Math.sin(k.S[i] * .07 + v.t * 5)) + lp * 7;
      fora.push([g.cx + p[0] + p[2] * Math.max(.4, th) - ox, g.cy + p[1] + p[3] * Math.max(.4, th) - oy]);
      dentro.push([g.cx + p[0] - p[2] * .6 - ox, g.cy + p[1] - p[3] * .6 - oy]);
    }
    ctx.beginPath(); caminho(fora, true); caminho(dentro, true);
    ctx.fillStyle = rgba(cor, .5 * q + .5 * lp); ctx.fill('evenodd');
    ctx.beginPath(); caminho(fora, true); ctx.strokeStyle = rgba(cor, .9 * q + lp); ctx.lineWidth = 1; ctx.stroke();
  }
  // os cantos que sentiram o En: cantoneira que dá a volta na quina, um pouco fora do card
  function pintaSentidos(ox, oy, cor){
    for(const s of sentidos.values()){
      const g = s.g, x0 = g.cx - g.bw - 3 - ox, y0 = g.cy - g.bh - 3 - oy, x1 = g.cx + g.bw + 3 - ox, y1 = g.cy + g.bh + 3 - oy, t = tremores.get(s.el);
      const tx = t ? t.x : 0, ty = t ? t.y : 0, r = Math.min(g.r + 3, g.bw, g.bh), L = Math.min(16, g.bw * .3, g.bh * .6) + r;
      const qs = [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]];
      ctx.lineCap = 'round';
      qs.forEach(([x, y, sx, sy], c) => {
        const a = .5 * s.a[c] + s.fl[c]; if(a < .02) return;
        const px = x + tx, py = y + ty, ex = s.fl[c] * 3;   // no lampejo, a cantoneira abre um pouco
        ctx.beginPath(); ctx.moveTo(px + sx * L, py - sy * ex); ctx.lineTo(px + sx * r, py - sy * ex);
        ctx.arcTo(px - sx * ex, py - sy * ex, px - sx * ex, py + sy * r, r); ctx.lineTo(px - sx * ex, py + sy * L);
        ctx.strokeStyle = rgba(cor, .25 * Math.min(1, a)); ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = rgba(cor, Math.min(1, a)); ctx.lineWidth = 1.8; ctx.stroke();
      });
      // o sinal: o contorno do card acende e se afasta um pouco, sumindo
      if(s.sinal >= 0){
        const u = s.sinal / .6, e = 2 + u * 6;
        ctx.beginPath(); retCurvo(g.cx - g.bw - e - ox + tx, g.cy - g.bh - e - oy + ty, g.cx + g.bw + e - ox + tx, g.cy + g.bh + e - oy + ty, g.r + e);
        ctx.strokeStyle = rgba(cor, .7 * (1 - u) ** 2); ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
  }
  function pintaFumos(ox, oy, cor){
    ctx.fillStyle = rgba(cor, .6);
    for(const p of fumos){
      const v = p.v, pp = v.k.P[p.i]; if(!pp) continue;
      const q = Math.sin(Math.PI * p.t / p.T) ** .8 * suave(0, 1, v.ten); if(q <= .02) continue;
      // sobe na direção entre a normal e o "para cima", balançando
      let ux = pp[2] * .5, uy = pp[3] * .5 - 1; const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
      const H = p.H * q, tx = -pp[3], ty = pp[2], bal = Math.sin(p.t * 14 + p.ph) * H * .3;
      const bx = v.g.cx + pp[0] + pp[2] - ox, by = v.g.cy + pp[1] + pp[3] - oy, px = bx + ux * H - uy * bal, py = by + uy * H + ux * bal;
      ctx.beginPath(); ctx.moveTo(bx - tx * p.w, by - ty * p.w);
      ctx.quadraticCurveTo(bx + ux * H * .55 - tx * p.w * .5, by + uy * H * .55 - ty * p.w * .5, px, py);
      ctx.quadraticCurveTo(bx + ux * H * .55 + tx * p.w * .5, by + uy * H * .55 + ty * p.w * .5, bx + tx * p.w, by + ty * p.w);
      ctx.closePath(); ctx.fill();
    }
  }
  function pinta(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    const [ox, oy] = origem(), cor = corAura(), claro = !!cfg.claro;
    for(const v of ens) pintaCampo(v, ox, oy, cor, claro);
    for(const v of ens) for(const tn of v.tent.values()) pintaTentaculo(v, tn, ox, oy, cor);
    pintaSentidos(ox, oy, cor);
    for(const v of ens) pintaTen(v, ox, oy, cor);
    pintaFumos(ox, oy, cor);
  }
  function move(){
    for(const [el, t] of tremores){
      if(Math.hypot(t.x, t.y) < .02 && Math.hypot(t.vx, t.vy) < .5){ el.style.translate = ''; tremores.delete(el); continue; }
      el.style.translate = `${t.x.toFixed(2)}px ${t.y.toFixed(2)}px`;
    }
  }

  // ---- o laço: só roda enquanto há campo, card sentido ou faísca
  let pedido = 0, antes = 0, sobra = 0;
  function quadro(t){
    pedido = 0;
    const dt = antes ? Math.min(.05, (t - antes) / 1000) : DT; antes = t;
    for(const v of ens){ geo(v.el, v.g); if(v.g.mudou) refaz(v); }   // a página pode ter rolado ou mudado
    sobra += dt / Math.max(1, cfg.lento);
    while(sobra >= DT){ passo(DT); sobra -= DT; }
    sente(); move(); pinta();
    if(ens.length || sentidos.size || fumos.length || tremores.size) pedido = requestAnimationFrame(quadro);
    else { antes = 0; sobra = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  const acorda = () => { if(!pedido) pedido = requestAnimationFrame(quadro); };

  // ---- eventos: o card sob o cursor é o mais de dentro que casa com o seletor (e que está na raiz)
  const ev = tela ? document : raiz;
  function mexe(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    const el = e.target.closest ? e.target.closest(cfg.seletor) : null, card = el && raiz.contains(el) && !el.closest('[data-sem-en]') ? el : null;
    if(card !== sobre){ sobre = card; if(card) abre(card); }
    acorda();
  }
  function sai(e){ if(tela && e.relatedTarget) return; sobre = null; acorda(); }
  const ouvintes = [['pointermove', mexe], [tela ? 'mouseout' : 'pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f, {passive: true}));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(raiz); else addEventListener('resize', mede);
  mede();

  const nSentidos = () => [...sentidos.values()].filter(s => s.a.some(a => a > .1)).length;
  return {
    ajusta(o){ Object.assign(cfg, o); acorda(); },
    estado: () => ({ens: ens.map(v => ({fase: v.fase, maior: v.maior, alcance: alcance(v.g), ten: v.ten, pulsos: v.pulsos.length, tent: [...v.tent.values()].map(t => +t.q.toFixed(2))})),
      sentidos: nSentidos(), cantos: [...sentidos.values()].map(s => s.a.map(a => +a.toFixed(2))), tremendo: tremores.size, abertos}),
    legenda(){
      const v = ens.find(e => e.el === sobre) || ens[ens.length - 1];
      return (v ? (v.fase === 'fecha' ? 'En recolhendo' : `En ${Math.round(v.maior || 0)} de ${Math.round(alcance(v.g))} px`) : 'sem En')
        + ` · sente ${nSentidos()} card${nSentidos() === 1 ? '' : 's'} · abriu ${abertos}×`;
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede);
      cancelAnimationFrame(pedido);
      for(const el of tremores.keys()) el.style.translate = '';
      cv.remove();
    },
  };
}


// ---- bancada: um pedaço do jogo de mentira na tela preta (o card do jogador, a caixa de tarefa nova, as tarefas, a
// constância e os cards do lado), com cards de tamanhos bem diferentes para ver o alcance
const TAREFAS = [['A', 'Perguntar ao professor de Redes se o trabalho vale nota', '+23'], ['A', 'Mandar mensagem da caixa', '+23'], ['C', 'Lavar o carro', '+15'], ['B', 'Ler 20 páginas', '+12']];
function liga(palco, cfg){
  const antes = palco.style.cssText, pag = document.createElement('div');
  palco.style.cursor = 'default';
  pag.className = 'en-pag';
  const cor = () => cfg.claro ? {bg: '#F2F3F7', card: '#FFFFFF', borda: '#D9DCE5', tinta: '#1B1D28', suave: '#6B7088', trilho: '#E4E6EE', aura: '#7C5CD6'}
    : {bg: '#0B1120', card: '#121A2A', borda: '#243049', tinta: '#E6EDF7', suave: '#8A96AB', trilho: '#1C2538', aura: '#B4A0FF'};
  const hm = Array.from({length: 84}, (_, i) => `<i style="opacity:${[.15, .4, .7, 1][(i * 7 + (i >> 2)) % 4]}"></i>`).join('');
  pag.innerHTML = `<style>
    .en-pag{position:absolute;inset:0;overflow:hidden;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-content:start;font:14px var(--f-ui)}
    .en-pag .en-col{display:grid;gap:10px;align-content:start;min-width:0}
    .en-pag .en-card{background:var(--b-card);border:1px solid var(--b-borda);border-radius:12px;padding:12px 14px;color:var(--b-tinta);min-width:0}
    .en-pag .en-me{grid-column:1/-1;display:flex;gap:14px;align-items:center}
    .en-pag .en-av{width:44px;height:44px;border-radius:50%;background:url('../../../web/a/killua-3.png') center/cover;flex:none;border:2px solid var(--b-borda)}
    .en-pag .en-xp{height:6px;border-radius:9px;background:var(--b-trilho);margin-top:6px} .en-pag .en-xp b{display:block;height:100%;width:62%;background:var(--b-tinta);border-radius:9px}
    .en-pag small{display:block;color:var(--b-suave);font-size:12px}
    .en-pag .en-in{display:flex;gap:10px;align-items:center;color:var(--b-suave)} .en-pag .en-in span:first-child{flex:1;border:1px solid var(--b-borda);border-radius:8px;padding:8px 10px}
    .en-pag .en-tf{display:flex;gap:10px;align-items:center;padding:10px 14px} .en-pag .en-tf span{flex:1;min-width:0}
    .en-pag .en-tf i{width:18px;height:18px;flex:none;clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%);background:#E0AF68}
    .en-pag .en-tf em{font:600 11px var(--f-mono);font-style:normal;color:#9BE15D;border:1px solid currentColor;border-radius:5px;padding:1px 6px}
    .en-pag .en-pr{font:600 10px var(--f-mono);color:#0B0C10;background:#8A96AB;border-radius:3px;padding:0 4px;margin-right:6px}
    .en-pag .en-hm{display:grid;grid-template-columns:repeat(21,1fr);gap:3px;margin-top:8px} .en-pag .en-hm i{aspect-ratio:1;border-radius:2px;background:#9BE15D}
    .en-pag h4{margin:0 0 6px;font:600 11px var(--f-mono);letter-spacing:.06em;color:var(--b-suave)}
    .en-pag .en-ln{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--b-borda);font-size:13px}
  </style>
  <div class="en-card en-me"><span class="en-av"></span><div style="flex:1;min-width:0"><b>Caio</b> · andar 204<div class="en-xp"><b></b></div><small>hoje +0 XP · meta 65</small></div></div>
  <div class="en-col">
    <div class="en-card en-in"><span>Nova tarefa: ex. Lista 3 de derivadas</span><span>+ adicionar</span></div>
    ${TAREFAS.map(([p, n, x]) => `<div class="en-card en-tf"><i></i><span><span class="en-pr">${p}</span>${n}</span><em>${x}</em></div>`).join('')}
    <div class="en-card"><h4>CONSTÂNCIA</h4><small>um painel grande: o En mal sai dele</small><div class="en-hm">${hm}</div></div>
  </div>
  <div class="en-col">
    <div class="en-card"><h4>QUANTO VALE</h4></div>
    <div class="en-card"><h4>RENDE MAIS AGORA</h4><div class="en-ln"><span>Mandar mensagem</span><b>+23</b></div><div class="en-ln"><span>Lavar o carro</span><b>+15</b></div></div>
    <div class="en-card"><h4>MISSÃO DA SEMANA</h4><b style="color:#E0AF68">Especialização</b><small>vida ×1,5 · 1/3 dias</small></div>
  </div>`;
  const pinta = () => { const c = cor(); palco.style.background = c.bg; for(const [k, v] of Object.entries(c)) pag.style.setProperty('--b-' + k, v); cfg.cor = c.aura; };
  palco.prepend(pag); pinta();
  const h = cola(palco, Object.assign(cfg, {seletor: '.en-card'}));
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); h.ajusta(cfg); },
    estado: h.estado, legenda: h.legenda,
    desliga(){ h.desliga(); pag.remove(); palco.style.cssText = antes; },
  };
}

(window.CURSORES = window.CURSORES || {}).en = {cola, liga,
  titulo: 'passe o mouse pelos cards · fique parado num card pequeno e veja os vizinhos',
  dica: 'ao entrar, o card acende o Ten (a aura sobe pelo contorno) e o En se abre do ponto tocado, passando dos limites do card · os cards que o campo alcança sentem: os cantos travam e acendem, o contorno dá um sinal e o card estremece<br>com o mouse dentro, o campo pende para o cursor e solta pulsos de sonar · ao sair, o En recolhe e o Ten dá um lampejo · Pitou: campo irregular, com tentáculos que tocam os cards perto · o painel grande da constância quase não abre',
  controles: [{k: 'alcance', rot: 'alcance', min: 100, max: 360, un: ' px', padrao: 200},
    {k: 'pitou', rot: 'Pitou', min: 0, max: 1, un: '', padrao: 0},
    {k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
