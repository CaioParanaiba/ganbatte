// Cursor com física da agulha do Illumi (cr-agulha), desenhado em código, sem imagem.
// O cursor é uma agulha longa de aço com a cabeça redonda; a ponta é a ponta do clique. Parada, aponta para cima e para a
// esquerda como a seta do sistema; andando, o ar a vira como um cata-vento e a ponta aponta para onde o mouse vai (é assim
// que se mira). Apertar recua a agulha um pouco (a armada); soltar atira: reta e muito rápida, a ponta na frente, caindo só
// um pouco. Batendo de ponta e rápido numa borda, crava e vibra (a haste enverga, 14 Hz) e as vizinhas cravadas na mesma
// borda tremem junto; de lado ou devagar, ricocheteia e cai rolando (de ponta no chão, crava no chão). Segurando o clique,
// o nen do Illumi chama as agulhas de volta: as cravadas tremem, saem da borda uma depois da outra (a mais perto primeiro)
// e voltam puxadas pela cabeça, fazendo a curva; entram entre os dedos abrindo um leque, e o que faltar ele tira da manga.
// Soltar atira o leque inteiro de uma vez, cada agulha no seu ângulo. Cravadas, afrouxam depois de 20 s e caem. Com o
// mouse parado uns segundos, a agulha treme sozinha: カタカタ (kata kata), o barulho do Gittarackur.
// O nen se vê: chamando, um fio violeta liga os dedos a cada agulha que volta (ondula, e estica reto quando ela arranca);
// cravada, a agulha trinca a borda em volta do furo, e a trinca some quando ela sai.
//   const a = CURSORES.agulha.liga(elemento, {comprimento: 44, leque: 5, toque: false})   a.ajusta({leque: 7})   a.legenda()   a.desliga()
//   (toque: true também aceita o dedo no celular: tocar atira, segurar chama as agulhas)
//   CURSORES.agulha.desenha(ctx, x, y, comprimento, angulo, curva, dentro)   (x, y = ponta; angulo = para onde a ponta aponta;
//   curva = quanto a cabeça sai da reta, em px; dentro = quanto da ponta está enterrado e não enverga)
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const TINTA = '#11131A', ACO = '#DCE3EE', CABECA = '#7451B8', LUZ = '#F1EBFF', NEN = '#B79CFF';
const PASSO = 1 / 240, G = 2400;
const A0 = -2.2;          // em repouso a ponta aponta para cima e para a esquerda, como a seta do sistema
const ATIRA = 2600;       // velocidade com que a agulha sai da mão (px/s), mais metade da do mouse
const CRAVA = 360;        // mais rápido que isso contra a borda, e de ponta (ALINHA = cosseno mínimo com a borda), crava
const ALINHA = .45;
const CRAVADA = 20;       // segundos cravada antes de afrouxar e cair
const ABRE = .17;         // abertura entre as agulhas do leque (rad); a ordem é do meio para fora
const ORDEM = [0, -1, 1, -2, 2, -3, 3];
const W_VIB = 2 * Math.PI * 14, Z_VIB = .035;   // a haste cravada: 14 Hz, apagando em ~0,3 s
const MAX_FORA = 28;
const KATA = [[0, .16], [.26, .42], [.52, .68]];  // as três tremidas do カタカタ (s)

const ang = d => { d %= 2 * Math.PI; if(d > Math.PI) d -= 2 * Math.PI; if(d < -Math.PI) d += 2 * Math.PI; return d; };

// uma agulha: (x, y) é a ponta. A haste afina até a ponta no primeiro quinto, tem um fio de luz e termina na cabeça
// redonda; envergada, sai da reta a partir do que está enterrado, mais quanto mais perto da cabeça (como uma viga presa)
function desenha(ctx, x, y, L, a, curva = 0, dentro = 0){
  const c = Math.cos(a), s = Math.sin(a), qx = -s, qy = c;
  const t = Math.max(1.3, 1 + L * .018), R = Math.max(2.4, 1.2 + L * .062), bico = Math.min(L * .22, 9 + L * .05), lw = Math.max(.9, L * .022), N = 12, fim = L - R * .5;
  const sai = u => { const q = u > dentro ? (u - dentro) / (L - dentro) : 0; return curva * q * q; };
  const m = [];
  for(let i = 0; i <= N; i++){
    const u = i / N * fim, o = sai(u), w = t / 2 * Math.pow(Math.min(1, u / bico), .7);
    m.push([x - c * u + qx * o, y - s * u + qy * o, w]);
  }
  ctx.beginPath();
  m.forEach(([mx, my, w], i) => i ? ctx.lineTo(mx + qx * w, my + qy * w) : ctx.moveTo(mx, my));
  for(let i = N; i >= 0; i--){ const [mx, my, w] = m[i]; ctx.lineTo(mx - qx * w, my - qy * w); }
  ctx.closePath(); ctx.lineJoin = 'round';
  // o contorno antes do aço: na parte fina da ponta o aço fica por cima e a ponta não some no escuro
  ctx.strokeStyle = TINTA; ctx.lineWidth = lw; ctx.stroke(); ctx.fillStyle = ACO; ctx.fill();
  if(t > 1.5){
    ctx.beginPath();
    for(let i = 3; i < N; i++){ const [mx, my, w] = m[i]; i > 3 ? ctx.lineTo(mx + qx * w * .3, my + qy * w * .3) : ctx.moveTo(mx + qx * w * .3, my + qy * w * .3); }
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(.5, t * .28); ctx.lineCap = 'round'; ctx.stroke();
  }
  const o = sai(L), hx = x - c * L + qx * o, hy = y - s * L + qy * o;
  ctx.beginPath(); ctx.arc(hx, hy, R, 0, 2 * Math.PI); ctx.fillStyle = CABECA; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = lw; ctx.stroke();
  ctx.beginPath(); ctx.arc(hx - R * .34, hy - R * .34, R * .32, 0, 2 * Math.PI); ctx.fillStyle = LUZ; ctx.fill();
}

// カタカタ desenhado em traços (não depende de fonte japonesa, que muita máquina não tem), como onomatopeia de mangá:
// letra inclinada, cada uma num ângulo, traço violeta com contorno. Os traços de カ e タ numa caixa de 0 a 1
const KANA = {
  'カ': [[[.1, .32], [.84, .32], ['q', .84, .7, .76, .88], [.6, .8]], [[.48, .06], ['q', .46, .66, .1, .94]]],
  'タ': [[[.44, .06], ['q', .3, .3, .08, .46]], [[.3, .22], [.84, .22], ['q', .7, .72, .16, .94]], [[.28, .46], [.64, .64]]],
};
function onomatopeia(ctx, texto, x, y, t, cor = NEN, giro = 0){
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -.18, 1, 0, 0); ctx.lineCap = ctx.lineJoin = 'round';
  [...texto].forEach((ch, i) => {
    ctx.save(); ctx.translate(i * t * 1.02, (i % 2 ? -.08 : .06) * t); ctx.rotate((i % 2 ? .12 : -.08) + giro * (i % 2 ? 1 : -1)); ctx.translate(-t / 2, -t / 2);
    ctx.beginPath();
    for(const traco of KANA[ch]) traco.forEach((p, j) => {
      if(p[0] === 'q') ctx.quadraticCurveTo(p[1] * t, p[2] * t, p[3] * t, p[4] * t);
      else if(j) ctx.lineTo(p[0] * t, p[1] * t); else ctx.moveTo(p[0] * t, p[1] * t);
    });
    ctx.strokeStyle = TINTA; ctx.lineWidth = t * .3; ctx.stroke(); ctx.strokeStyle = cor; ctx.lineWidth = t * .15; ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function liga(alvo, op = {}){
  const tela = alvo === document.body || alvo === document.documentElement;
  const cfg = {comprimento: 44, leque: 5, ...op};
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483000`;
  (tela ? document.body : alvo).append(cv);
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let L, I;
  function medidas(){ L = cfg.comprimento; I = L * L / 12; }

  // na mão: ângulo e giro da agulha do meio em volta da ponta, quantas no leque e a abertura de cada uma (com a
  // velocidade da mola que abre), a escala de quando aparece, a armada (recuo ao apertar) e o カタカタ
  const mao = {n: 1, a: A0, w: 0, abre: [0], va: [0], s: 1, pop: 0, recua: 0, vr: 0, kata: 0, volta: 0};
  const fora = [];        // agulhas fora da mão: livre (voando, quicando), cravada, quieta (no chão), some, volta
  const riscos = [];      // os risquinhos de quando bate
  const furos = [];       // a trinca em volta de cada agulha cravada: {g, x, y, nx, ny, tr, alfa}
  let rajada = [];        // o leque saindo, uma agulha a cada 18 ms
  let mx = 0, my = 0, fx = 0, fy = 0, dentro = false, larg = 0, alt = 0, dpr = 1, antes = 0, sobra = 0, pedido = 0, parado = 0;
  let vx = 0, vy = 0, mira = A0, mvx = 0, mvy = 0, axs = 0, ays = 0, preso = false, tPreso = 0, chamando = false, tTira = 0;
  let ocioso = 0, afrouxa = 0, fezTruque = false, relogio = 0;

  function mede(){
    const r = tela ? {width: innerWidth, height: innerHeight} : alvo.getBoundingClientRect();
    larg = r.width; alt = r.height; dpr = devicePixelRatio || 1;
    cv.width = Math.round(larg * dpr); cv.height = Math.round(alt * dpr); acorda();
  }
  const dir = a => [Math.cos(a), Math.sin(a)];
  const ponta = g => { const [c, s] = dir(g.a); return [g.x + c * L / 2, g.y + s * L / 2]; };
  const cabeca = g => { const [c, s] = dir(g.a); return [g.x - c * L / 2, g.y - s * L / 2]; };
  // a cabeça da agulha do meio é onde os dedos seguram: o leque abre em volta dela
  function maoCabeca(){ const [c, s] = dir(mao.a), Le = L * escala(); return [fx - c * (mao.recua + Le), fy - s * (mao.recua + Le)]; }
  const escala = () => { const e = 1 - Math.pow(1 - mao.s, 3); return e * (1 + .12 * mao.pop * mao.pop); };

  // ---- na mão
  function passoMao(h, nx, ny){
    const rvx = (nx - fx) / h, rvy = (ny - fy) / h; fx = nx; fy = ny;
    const q = 1 - Math.exp(-h / .03), vx0 = vx, vy0 = vy;
    vx += (rvx - vx) * q; vy += (rvy - vy) * q;
    axs += ((vx - vx0) / h - axs) * q; ays += ((vy - vy0) / h - ays) * q;
    // gira em volta da ponta: a mola dos dedos, a inércia (o mouse acelera e a haste fica para trás) e o ar, que a vira
    // como um cata-vento (cresce com o quadrado da velocidade: andando rápido, a ponta aponta para onde vai)
    const ux = -Math.cos(mao.a), uy = -Math.sin(mao.a), sp = Math.hypot(vx, vy);
    const alfa = -160 * Math.sin(ang(mao.a - A0)) - 7 * mao.w - .9 / L * (ux * ays - uy * axs) - .05 * (ux * vy - uy * vx) * sp / L;
    mao.w = Math.max(-40, Math.min(40, mao.w + alfa * h)); mao.a += mao.w * h;
    // a armada: apertando, a agulha recua uns px (a ponta sai da ponta do clique e volta ao soltar)
    mao.vr += ((preso && mao.n ? 5 : 0) - mao.recua) * 900 * h - 40 * mao.vr * h; mao.recua += mao.vr * h;
    mao.s = Math.min(1, mao.s + h / .14); mao.pop = Math.max(0, mao.pop - h / .2);
    // o leque abre com mola (as que chegam entram de onde estão)
    if(!rajada.length) for(let i = 0; i < mao.n; i++){
      const alvoA = (mao.n > 1 ? ORDEM[i] : 0) * ABRE;
      mao.va[i] += ((alvoA - mao.abre[i]) * 700 - 30 * mao.va[i]) * h; mao.abre[i] += mao.va[i] * h;
    }
    if(mao.kata) { mao.kata += h; if(mao.kata > 1.3) mao.kata = 0; }
    // a mão vazia (o leque todo saiu): a próxima aparece da manga
    if(!mao.n && !rajada.length && !chamando){ mao.volta += h; if(mao.volta > .22) poe(0); }
  }
  // uma agulha nova entre os dedos, com a abertura de onde ela vem; a que sai da manga numa mão vazia cresce da ponta
  function poe(abre, manga = true){
    if(!mao.n){ mao.s = manga ? 0 : 1; mao.volta = 0; }
    mao.abre.push(abre); mao.va.push(0); mao.n++;
  }

  // ---- atirar: o que está na mão sai; o leque, do meio para fora
  function dispara(){
    if(!mao.n) return;
    rajada = Array.from({length: mao.n}, (_, i) => i * .018);
    // a mira fica a do instante em que soltou (a mão continua balançando enquanto o leque sai)
    relogio = 0; mira = mao.a; [mvx, mvy] = [vx, vy];
  }
  function solta1(){
    const [hx, hy] = maoCabeca(), a = mira + mao.abre[0] + tremida(), [c, s] = dir(a);
    const g = {x: hx + c * L / 2, y: hy + s * L / 2, vx: c * ATIRA + mvx * .5, vy: s * ATIRA + mvy * .5, a, w: 0, fase: 'livre', t: 0, alfa: 1,
      d: 0, vd: 0, quieto: 0};
    fora.push(g);
    mao.abre.shift(); mao.va.shift(); mao.n--; mao.volta = 0;
    // muitas fora da mão: a cravada mais antiga afrouxa
    const crav = fora.filter(f => f.fase === 'cravada');
    if(fora.length > MAX_FORA && crav.length) desprende(crav[0], .3);
  }

  // ---- o nen chama as agulhas de volta: as cravadas tremem e saem uma depois da outra, a mais perto primeiro
  function chama(){
    chamando = true; tTira = 0;
    const [hx, hy] = maoCabeca();
    fora.filter(g => g.fase !== 'volta').map(g => [Math.hypot(g.x - hx, g.y - hy), g]).sort((p, q) => p[0] - q[0])
      .forEach(([, g], k) => { g.puxa = (g.fase === 'cravada' ? .1 : 0) + k * .045; });
  }
  function arranca(g){
    delete g.t0;
    if(g.fase === 'cravada'){ const [c, s] = dir(g.a); g.x -= c * g.enterrada; g.y -= s * g.enterrada; g.vx = -c * 650; g.vy = -s * 650; }
    else if(g.fase !== 'livre'){ g.vy = -500; g.vx = 0; }
    Object.assign(g, {fase: 'volta', t: 0, alfa: 1, d: 0, vd: 0}); delete g.puxa;
  }

  // ---- fora da mão
  // bate numa borda: a ponta, rápida e de frente, crava; o resto quica (impulso numa barra que gira)
  function bate(g){
    for(const k of [1, -1]){
      // a cabeça bate com o raio dela (deitada no chão, a agulha fica inteira à vista)
      const [c, s] = dir(g.a), p = [g.x + k * c * L / 2, g.y + k * s * L / 2], m = k === 1 ? 1 : Math.max(2.4, 1.2 + L * .062);
      for(const [pen, nx, ny] of [[m - p[0], 1, 0], [p[0] - larg + m, -1, 0], [m - p[1], 0, 1], [p[1] - alt + m, 0, -1]]){
        if(pen <= 0) continue;
        const rx = p[0] - g.x, ry = p[1] - g.y, vpx = g.vx - g.w * ry, vpy = g.vy + g.w * rx, vn = vpx * nx + vpy * ny;
        if(vn >= 0) continue;
        if(k === 1 && -vn > CRAVA && -(c * nx + s * ny) > ALINHA){ crava(g, pen, nx, ny, -vn); return; }
        const rn = rx * ny - ry * nx, j = -1.3 * vn / (1 + rn * rn / I);
        g.vx += j * nx; g.vy += j * ny; g.w += rn * j / I;
        // atrito na borda: a parte que escorrega perde força
        const tx = -ny, ty = nx, vt = g.vx * tx + g.vy * ty; g.vx -= vt * tx * .25; g.vy -= vt * ty * .25; g.w *= .9;
        g.x += nx * pen; g.y += ny * pen;
        if(-vn > 420) risca(p[0], p[1], nx, ny, .5);
      }
    }
  }
  function crava(g, pen, nx, ny, vn){
    const [c, s] = dir(g.a), cos = -(c * nx + s * ny), fundo = Math.max(3, Math.min(L * .36, L * .3 * vn / ATIRA)), sobe = (fundo - pen) / cos;
    g.x += c * sobe; g.y += s * sobe;
    // a vibração começa com a parte da velocidade que veio de lado e com o tranco
    const lado = (-s * g.vx + c * g.vy);
    Object.assign(g, {fase: 'cravada', t: 0, vx: 0, vy: 0, w: 0, nx, ny, enterrada: fundo / cos, desde: performance.now(),
      d: 0, vd: Math.max(-700, Math.min(700, lado * .25 + vn * .14 * (Math.random() < .5 ? -1 : 1)))});
    const [px, py] = ponta(g); risca(px + nx * fundo, py + ny * fundo, nx, ny, 1);
    if(!calmo){
      // a trinca: quatro rachas curtas saindo do furo, ao longo da borda e um pouco para dentro
      const tr = [-1, 1, -.5, .6].map((l, i) => {
        const pts = [[0, 0]]; let u = 0, w = 0;
        for(let k = 0; k < (i < 2 ? 3 : 2); k++){ u += l * (2 + Math.random() * 2.6) * Math.min(1.4, vn / 1400 + .5); w += (i < 2 ? .5 : 2.2) + Math.random() * 1.4; pts.push([u, w]); }
        return pts;
      });
      furos.push({g, x: px + nx * fundo, y: py + ny * fundo, nx, ny, tr, alfa: 1});
    }
    // a borda treme: as vizinhas cravadas nela vibram também
    for(const o of fora) if(o !== g && o.fase === 'cravada' && o.nx === nx && o.ny === ny){
      const [ox, oy] = ponta(o), d = Math.hypot(ox - px, oy - py);
      if(d < 110) o.vd += g.vd * .45 * (1 - d / 110) * (Math.random() < .5 ? -1 : 1);
    }
  }
  // afrouxa da borda e cai
  function desprende(g, empurra = 1){
    if(g.fase !== 'cravada') return;
    const [c, s] = dir(g.a); g.x -= c * g.enterrada; g.y -= s * g.enterrada;
    Object.assign(g, {fase: 'livre', t: 0, vx: g.nx * 90 * empurra, vy: g.ny * 90 * empurra, w: (Math.random() - .5) * 6, quieto: 0});
  }
  function risca(x, y, nx, ny, forca){ if(!calmo) riscos.push({x, y, nx, ny, t: 0, f: forca}); }

  function passoAgulha(g, h){
    g.t += h;
    if(g.puxa !== undefined){
      g.puxa -= h;
      // sendo chamada: treme na borda antes de sair
      if(g.fase === 'cravada') g.vd += (Math.random() - .5) * 9000 * h;
      if(g.puxa <= 0) arranca(g);
    }
    if(g.fase === 'livre'){
      const sp = Math.hypot(g.vx, g.vy);
      // rápida, quase não cai (o arremesso do Illumi); devagar, a gravidade toda
      g.vy += G * (.22 + .78 * Math.max(0, Math.min(1, 1 - (sp - 400) / 1400))) * h;
      const arr = .12 + .00008 * sp; g.vx -= g.vx * arr * h; g.vy -= g.vy * arr * h;
      // a ponta segue a velocidade, como um dardo (balança um pouco depois de sair da mão)
      g.w += (.5 * sp * Math.sin(ang(Math.atan2(g.vy, g.vx) - g.a)) - (4 + .012 * sp) * g.w) * h;
      g.x += g.vx * h; g.y += g.vy * h; g.a += g.w * h;
      bate(g);
      // parou no chão: deita e, um pouco depois, some
      const [, py] = ponta(g), [, hy] = cabeca(g);
      g.quieto = sp < 40 && Math.abs(g.w) < 1.5 && Math.max(py, hy) > alt - 3 - Math.max(2.4, 1.2 + L * .062) ? g.quieto + h : 0;
      if(g.quieto > .3) Object.assign(g, {fase: 'quieta', t: 0, vx: 0, vy: 0, w: 0});
    } else if(g.fase === 'cravada'){
      // a haste vibra como uma régua presa na mesa
      g.vd += (-W_VIB * W_VIB * g.d - 2 * Z_VIB * W_VIB * g.vd) * h; g.d += g.vd * h;
      g.d = Math.max(-L * .2, Math.min(L * .2, g.d));
    } else if(g.fase === 'quieta'){
      if(g.t > 1.4){ g.fase = 'some'; g.t = 0; }
    } else if(g.fase === 'some'){
      g.alfa = Math.max(0, 1 - g.t / .8);
    } else if(g.fase === 'volta'){
      // puxada pela cabeça para os dedos, fazendo a curva; chegando, vira para o ângulo do leque
      const [hx, hy] = maoCabeca(), [gx, gy] = cabeca(g), dx = hx - gx, dy = hy - gy, d = Math.hypot(dx, dy) || 1e-6;
      const quer = Math.min(2600, d * 7 + 260);
      g.vx += (dx / d * quer - g.vx) * 9 * h; g.vy += (dy / d * quer - g.vy) * 9 * h;
      let alvoA = Math.atan2(g.vy, g.vx) + Math.PI;
      if(d < 70){ const k = 1 - d / 70; alvoA = alvoA + ang(mao.a - alvoA) * k; }
      g.w += (420 * Math.sin(ang(alvoA - g.a)) - 30 * g.w) * h;
      g.x += g.vx * h; g.y += g.vy * h; g.a += g.w * h;
      if(d < 9 || g.t > 2.5){
        fora.splice(fora.indexOf(g), 1);
        // entra no leque (de onde ela está); com o leque cheio, vai para a manga
        if(d < 9 && mao.n < cfg.leque){ poe(Math.max(-1.2, Math.min(1.2, ang(g.a - mao.a))), false); mao.pop = Math.max(mao.pop, .5); }
      }
    }
    if(g.alfa <= 0) fora.splice(fora.indexOf(g), 1);
  }

  function passo(h, nx, ny){
    passoMao(h, nx, ny);
    if(rajada.length){
      relogio += h;
      while(rajada.length && relogio >= rajada[0]){ rajada.shift(); if(mao.n) solta1(); }
    }
    if(preso && !chamando){ tPreso += h; if(tPreso > .18) chama(); }
    // chamando, e ninguém mais para voltar: o que falta no leque sai da manga
    if(chamando && mao.n < cfg.leque && !fora.some(g => g.fase === 'volta' || g.puxa !== undefined)){
      tTira += h; if(tTira > .13){ tTira = 0; poe(0); }
    }
    for(let i = fora.length - 1; i >= 0; i--) if(fora[i]) passoAgulha(fora[i], h);
    for(let i = riscos.length - 1; i >= 0; i--){ riscos[i].t += h; if(riscos[i].t > .18) riscos.splice(i, 1); }
    // a agulha saiu do furo: a trinca some
    for(let i = furos.length - 1; i >= 0; i--){ const f = furos[i]; if(f.g.fase !== 'cravada' && (f.alfa -= h / .5) <= 0) furos.splice(i, 1); }
  }

  // ---- pintura
  const tremida = () => {
    if(chamando && !calmo) return (Math.random() - .5) * .03;      // o leque tenso, carregado de nen
    if(!mao.kata) return 0;
    return KATA.some(([a, b]) => mao.kata >= a && mao.kata < b) ? .07 * Math.sin(2 * Math.PI * 30 * mao.kata) : 0;
  };
  function pintaAgulha(g){
    const [px, py] = ponta(g), sp = Math.hypot(g.vx, g.vy);
    ctx.globalAlpha = g.alfa;
    if((g.fase === 'livre' || g.fase === 'volta') && sp > 800 && !calmo){
      // o rastro: um risco fino atrás de quem vai na frente (a ponta voando, a cabeça voltando)
      const [ox, oy] = g.fase === 'volta' ? cabeca(g) : ponta(g), r = Math.min(L * 1.8, sp * .03), ux = g.vx / sp, uy = g.vy / sp;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - ux * (r + L), oy - uy * (r + L));
      ctx.strokeStyle = g.fase === 'volta' ? 'rgba(183,156,255,.45)' : 'rgba(220,227,238,.35)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.stroke();
    }
    desenha(ctx, px, py, L, g.a, g.fase === 'cravada' ? g.d : 0, g.fase === 'cravada' ? g.enterrada : 0);
    ctx.globalAlpha = 1;
  }
  function pintaRisco(r){
    const k = r.t / .18, tx = -r.ny, ty = r.nx, a = 1 - k;
    ctx.strokeStyle = `rgba(255,255,255,${.85 * a})`; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath();
    for(const [u, v] of [[1, .35], [-1, .35], [.6, 1], [-.6, 1]]){
      const ex = tx * u + r.nx * v, ey = ty * u + r.ny * v, n = Math.hypot(ex, ey), d0 = 4 + 10 * k * r.f, d1 = d0 + 7 * r.f * (1 - k * .5);
      ctx.moveTo(r.x + ex / n * d0, r.y + ey / n * d0); ctx.lineTo(r.x + ex / n * d1, r.y + ey / n * d1);
    }
    ctx.stroke();
  }
  function pintaFuro(f){
    const tx = -f.ny, ty = f.nx; ctx.beginPath();
    for(const tr of f.tr) tr.forEach(([u, w], i) => { const x = f.x + tx * u + f.nx * w, y = f.y + ty * u + f.ny * w; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = `rgba(150,160,180,${.85 * f.alfa})`; ctx.lineWidth = 1; ctx.stroke();
  }
  // o fio de nen: dos dedos à cabeça da agulha chamada. Enquanto ela treme na borda, ondula frouxo e vai chegando; quando
  // arranca, estica quase reto e afina com a distância
  function pintaNen(g, hx, hy, agora){
    const [gx, gy] = cabeca(g), dx = gx - hx, dy = gy - hy, d = Math.hypot(dx, dy) || 1, qx = -dy / d, qy = dx / d;
    const frouxo = g.puxa !== undefined, chega = frouxo ? Math.min(1, (g.t0 === undefined ? (g.t0 = agora) : agora - g.t0) / 90) : 1;
    const onda = (frouxo ? 7 : 2.2) * Math.min(1, d / 120), fase = agora / 70 + (g.x + g.y) * .05;
    ctx.beginPath(); ctx.moveTo(hx, hy);
    for(let i = 1; i <= 16; i++){
      const u = i / 16 * chega, o = Math.sin(u * Math.PI) * Math.sin(u * 9 - fase) * onda;
      ctx.lineTo(hx + dx * u + qx * o, hy + dy * u + qy * o);
    }
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(8,10,16,.5)'; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.strokeStyle = NEN; ctx.lineWidth = Math.max(.7, 1.4 - d / 900); ctx.stroke();
  }
  function pinta(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    furos.forEach(pintaFuro);
    if(dentro && !calmo){
      const [hx, hy] = maoCabeca(), agora = performance.now();
      for(const g of fora) if(g.fase === 'volta' || g.puxa !== undefined) pintaNen(g, hx, hy, agora);
    }
    for(const fase of ['cravada', 'quieta', 'some', 'livre', 'volta']) for(const g of fora) if(g.fase === fase) pintaAgulha(g);
    riscos.forEach(pintaRisco);
    if(dentro && mao.n){
      const Le = L * escala(), [hx, hy] = maoCabeca(), j = tremida();
      if(Le > 1){
        // as de fora primeiro, a do meio por cima
        const ordem = mao.abre.map((o, i) => i).sort((p, q) => Math.abs(mao.abre[q]) - Math.abs(mao.abre[p]));
        for(const i of ordem){ const a = mao.a + mao.abre[i] + j, [c, s] = dir(a); desenha(ctx, hx + c * Le, hy + s * Le, Le, a); }
      }
      if(mao.kata && mao.kata < 1.1 && !calmo){
        const k = mao.kata / 1.1;
        ctx.globalAlpha = Math.min(1, (1 - k) * 2.2); onomatopeia(ctx, 'カタカタ', hx + 12, hy - 8 - 10 * k, 11, NEN, j * 1.5); ctx.globalAlpha = 1;
      }
    }
  }

  function quadro(agora){
    pedido = 0;
    const dt = Math.min(.05, antes ? (agora - antes) / 1000 : 1 / 60); antes = agora;
    sobra += dt; let n = Math.floor(sobra / PASSO); sobra -= n * PASSO;
    if(n > 12){ n = 12; sobra = 0; }
    const bx = fx, by = fy;
    for(let i = 1; i <= n; i++) passo(PASSO, i < n ? bx + (mx - bx) * i / n : mx, i < n ? by + (my - by) * i / n : my);
    // cravadas há mais de 20 s afrouxam (o relógio é o de verdade: o laço dorme enquanto nada mexe)
    const t = performance.now();
    for(const g of fora) if(g.fase === 'cravada' && g.puxa === undefined && t - g.desde > CRAVADA * 1000) desprende(g);
    pinta();
    // nada mexendo e o mouse parado: o laço para; parado uns segundos, ele faz o カタカタ
    const quieto = !rajada.length && !riscos.length && !furos.some(f => f.g.fase !== 'cravada') && !chamando && !preso && mao.n && mao.s === 1 && !mao.pop && !mao.kata
      && Math.abs(mao.w) < .01 && Math.abs(ang(mao.a - A0)) < .002 && Math.abs(mao.recua) < .01 && mao.abre.every((o, i) => Math.abs(o - (mao.n > 1 ? ORDEM[i] : 0) * ABRE) < .001)
      && fora.every(g => g.fase === 'cravada' && g.puxa === undefined && Math.abs(g.d) < .05 && Math.abs(g.vd) < 2)
      && Math.abs(mx - bx) + Math.abs(my - by) < .01 && Math.hypot(vx, vy) < 1;
    parado = quieto ? parado + 1 : 0;
    if(parado < 20) pedido = requestAnimationFrame(quadro);
    else {
      antes = 0; clearTimeout(ocioso); clearTimeout(afrouxa);
      if(dentro && !calmo && !fezTruque) ocioso = setTimeout(() => { fezTruque = true; mao.kata = 1e-6; acorda(); }, 4500);
      const prox = Math.min(...fora.map(g => CRAVADA * 1000 - (t - g.desde)));
      if(isFinite(prox)) afrouxa = setTimeout(acorda, Math.max(0, prox) + 30);
    }
  }
  function acorda(){ parado = 0; if(!pedido) pedido = requestAnimationFrame(quadro); }

  const pos = e => { if(tela) return [e.clientX, e.clientY]; const r = alvo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function move(e){
    if(e.pointerType === 'touch' && !cfg.toque) return;
    [mx, my] = pos(e); clearTimeout(ocioso); fezTruque = false; mao.kata = 0;
    if(!dentro){ dentro = true; fx = mx; fy = my; vx = vy = axs = ays = 0; mao.s = 0; mao.a = A0; mao.w = 0; }
    acorda();
  }
  // segurar não pode marcar texto: apertando, a página não começa seleção (user-select e selectstart); e num campo de texto o
  // clique é do campo, o cursor não segura nem atira ali
  const campo = e => !!(e.target.closest && e.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])'));
  const semSel = e => e.preventDefault();
  const trava = on => {
    document.documentElement.style.userSelect = on ? 'none' : '';
    document.removeEventListener('selectstart', semSel); if(on) document.addEventListener('selectstart', semSel);
  };
  function aperta(e){
    if((e.pointerType === 'touch' && !cfg.toque) || e.button !== 0 || campo(e)) return;
    move(e); preso = true; tPreso = 0; trava(true);
    if(!tela) try { alvo.setPointerCapture(e.pointerId); } catch {}
    acorda();
  }
  // soltar atira: um clique, a agulha da mão; depois de chamar, o leque inteiro
  function solta(){ if(!preso) return; preso = false; trava(false); chamando = false; dispara(); acorda(); }
  function sai(){ if(preso) return; dentro = false; clearTimeout(ocioso); acorda(); }
  const ev = tela ? document.documentElement : alvo;
  const ouvintes = [['pointermove', move], ['pointerdown', aperta], ['pointerup', solta], ['pointercancel', solta], ['pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(alvo); else addEventListener('resize', mede);
  medidas(); mede();

  return {
    ajusta(o){ Object.assign(cfg, o); medidas(); while(mao.n > Math.max(1, cfg.leque)){ mao.abre.pop(); mao.va.pop(); mao.n--; } acorda(); },
    estado: () => ({mao: mao.n, angulo: mao.a, chamando, fora: fora.map(g => ({fase: g.fase, x: g.x, y: g.y, vx: g.vx, vy: g.vy, a: g.a, d: g.d}))}),
    legenda(){
      const conta = f => fora.filter(g => g.fase === f).length, voa = conta('livre'), crav = conta('cravada'), volta = conta('volta');
      return `na mão: ${mao.n} agulha${mao.n === 1 ? '' : 's'}` + (voa ? ` · soltas ${voa}` : '') + (crav ? ` · cravadas ${crav}` : '')
        + (volta ? ` · voltando ${volta}` : '') + (chamando ? ' · chamando (nen)' : '') + (mao.kata ? ' · kata kata' : '');
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede);
      trava(false); cancelAnimationFrame(pedido); clearTimeout(ocioso); clearTimeout(afrouxa); cv.remove();
    },
  };
}

// prévias paradas para a bancada (com as classes dela)
function previas(el, cfg){
  const tela = (w, h, fn) => { const c = document.createElement('canvas'), d = devicePixelRatio || 1;
    c.className = 'prev'; c.width = Math.ceil(w * d); c.height = Math.ceil(h * d); c.style.width = w + 'px'; c.style.height = h + 'px';
    const x = c.getContext('2d'); x.scale(d, d); fn(x); return c; };
  // o cursor: a ponta no canto de cima à esquerda, com n agulhas no leque
  const cursor = (L, n = 1) => {
    const abre = ORDEM.slice(0, n).map(o => (n > 1 ? o : 0) * ABRE), R = Math.max(2.4, L * .088) + 1;
    const pts = abre.map(o => [Math.cos(A0 + o) * L, Math.sin(A0 + o) * L]);
    const x0 = Math.min(...pts.map(p => p[0])) - 4, y0 = Math.min(...pts.map(p => p[1])) - 4;
    return tela(R + 4 - x0, R + 4 - y0, x => {
      abre.map((o, i) => i).sort((p, q) => Math.abs(abre[q]) - Math.abs(abre[p])).forEach(i => desenha(x, pts[i][0] - x0, pts[i][1] - y0, L, A0 + abre[i]));
    });
  };
  el.innerHTML = '<section><h2>a agulha de perto (reta, envergada como quando crava, o leque entre os dedos e o kata kata, desenhado em traços para não depender de fonte japonesa)</h2><div class="linha"></div></section>'
    + '<section><h2>o cursor (a ponta é o clique), de 64 a 30 px de comprimento, no escuro e no claro, e com o leque</h2><div class="linha"></div><div class="linha claro" style="margin-top:12px"></div></section>'
    + '<section><h2>cravadas na borda da tela</h2><div class="linha"></div></section>';
  const [perto, esc, cla, borda] = el.querySelectorAll('.linha');
  perto.append(tela(300, 150, x => { desenha(x, 290, 40, 270, 0); desenha(x, 290, 105, 270, 0, 14, 40); }),
    tela(220, 200, x => { const L = 150, a = -Math.PI / 2, hx = 110, hy = 190;
      ORDEM.slice(0, 5).map(o => o * ABRE).sort((p, q) => Math.abs(q) - Math.abs(p)).forEach(o => desenha(x, hx + Math.cos(a + o) * L, hy + Math.sin(a + o) * L, L, a + o)); }),
    tela(250, 200, x => { onomatopeia(x, 'カタカタ', 40, 60, 48); onomatopeia(x, 'カタカタ', 40, 150, 22); onomatopeia(x, 'カタカタ', 150, 150, 10); }));
  for(const l of [esc, cla]) l.append(...[64, 52, cfg.comprimento, 34, 30].map(L => cursor(L)), cursor(cfg.comprimento, Math.min(5, cfg.leque)));
  borda.append(tela(380, 150, x => {
    const L = cfg.comprimento * 1.6;
    [[30, -.12, 0], [62, .25, 4], [78, .05, -3], [116, -.3, 0]].forEach(([y, a, d]) => desenha(x, 384, y, L, a, d, 14));
    x.fillStyle = '#2A2F3D'; x.fillRect(372, 0, 8, 150);
  }));
}

(window.CURSORES = window.CURSORES || {}).agulha = {liga, desenha, previas,
  titulo: 'mexa o mouse na tela preta · clique · segure · solte',
  dica: 'andando, a ponta aponta para onde o mouse vai (é a mira) · clique: atira a agulha (de ponta e rápida, crava na borda)<br>segurando: o fio de nen chama de volta as agulhas (cravadas trincam a borda) e forma o leque entre os dedos · soltando: atira o leque inteiro · parado uns segundos: kata kata',
  controles: [{k: 'comprimento', rot: 'comprimento da agulha', min: 30, max: 64, un: 'px', padrao: 44},
    {k: 'leque', rot: 'agulhas no leque', min: 1, max: 7, un: '', padrao: 5}]};
})();
