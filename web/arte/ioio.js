// Cursor com física do ioiô do Killua (cr-ioio), desenhado em código, sem imagem.
// São dois, como no anime, um em cada dedo, enrolados logo abaixo do cursor (dá para ligar com um só). Clicar joga os
// dois para baixo, um logo depois do outro (desenrolam girando); segurar deixa eles "dormindo" na ponta do fio esticado;
// soltar dá o tranco e eles sobem enrolando, mais rápido quanto mais giro sobrou. Os dois são de aço: batem um no outro
// (tac) e trocam um pouco do giro. Dormindo por mais de meio segundo, o Killua carrega os fios de eletricidade: o fio
// pisca em raio e o ioiô solta faíscas, cada vez mais; soltando carregado, eles voltam como raio e a mão estala.
// O fio é uma corda de verdade (Verlet, 16 nós, passo fixo de 1/240 s) presa no cursor, e o ioiô é o peso da ponta:
// balança com o mouse, afrouxa se o mouse desce mais rápido que ele, dá a volta ao mundo se girar forte e, encostado no
// chão enquanto dorme, anda (walk the dog) gastando o giro. O borrão do giro é a média de cópias do ioiô girado no quadro.
// É de aço e pesado: batendo forte numa borda, solta faíscas e marca a borda; voltando rápido, estala na mão. Com o mouse
// parado uns segundos, um choque desce do dedo até o ioiô, que estala em raios e dá um giro.
//   const io = CURSORES.ioio.liga(elemento, {raio: 15, fio: 170, ioios: 2})   io.ajusta({fio: 220})   io.estado()   io.desliga()
//   CURSORES.ioio.desenha(ctx, x, y, raio, angulo, varredura)       só o ioiô, para as prévias paradas
//   titulo, dica, controles, previas(el, cfg) e io.legenda(): o que a bancada mostra
(() => {
const TINTA = '#11131A', ARO = '#8CC8FF', FACE = '#EAF2FF', FIO = '#E8ECF4';
const PASSO = 1 / 240, N = 16, VOLTAS = 10;
const G = 3400;                  // gravidade (px/s²): a escala de um ioiô de 5 cm com ~30 px
const JOGA = 450;                // velocidade com que o clique joga o ioiô para baixo (px/s)
const DESCE = 1600, SOBE = 1700; // aceleração no fio: o giro freia a queda; na subida, a gravidade freia
const CHEGA = [70, 420];         // velocidade com que ele chega na mão: sem giro (o tranco garante a volta) e com o giro todo
const SONO = 8;                  // segundos para o giro cair a 1/e dormindo
const EIXO = .2;                 // raio do eixo, em raios do ioiô: o fio que desenrola a v px/s gira o ioiô a v/eixo
const ATRITO = .5, INERCIA = 1.5;// chão: atrito, e quanto o giro sente o empurrão (m·R²/I de um ioiô com peso no aro)
const ARGOLA = 4.5;              // a argola do fio no dedo, que é o ponteiro
const DEDO = 6;                  // com dois ioiôs, cada argola fica a 6 px do ponteiro, uma em cada dedo
const BATE = 650;                // mais rápido que isso contra a borda (px/s), o aço solta faíscas e marca a borda
const RAIOS = '#BFE6FF';         // a eletricidade do Killua

// o raio (do Godspeed) que atravessa a face, em raios do ioiô: é ele que mostra o giro, e continua legível com 24 px
const RAIO = [[-.17, -.59], [.285, -.59], [.057, -.133], [.323, -.133], [-.209, .608], [-.038, .057], [-.304, .057]];
const roda = (ctx, r) => { ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); };
// a parte que gira: aro com rebites (aço), face clara e o raio
function corpo(ctx, R){
  roda(ctx, R); ctx.fillStyle = ARO; ctx.fill();
  ctx.fillStyle = TINTA;
  if(R >= 11) for(let k = 0; k < 6; k++){ const a = k * Math.PI / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * R * .88, Math.sin(a) * R * .88, R * .05, 0, 2 * Math.PI); ctx.fill(); }
  roda(ctx, R * .76); ctx.fillStyle = FACE; ctx.fill();
  ctx.beginPath(); RAIO.forEach(([x, y], i) => i ? ctx.lineTo(x * R, y * R) : ctx.moveTo(x * R, y * R)); ctx.closePath();
  ctx.fillStyle = TINTA; ctx.fill();
}

// o ioiô de frente; a luz é fixa (não gira com ele). varre = quanto ele girou durante o quadro (rad), para o borrão
function desenha(ctx, x, y, R, ang = 0, varre = 0){
  const lw = Math.max(1.2, R * .11), s = Math.abs(varre), sent = Math.sign(varre) || 1;
  ctx.save(); ctx.translate(x, y);
  // borrão: k cópias do corpo inteiro (opaco, sempre o mesmo disco) giradas ao longo do que ele andou no quadro; com
  // alfa 1/(i+1) o resultado é a média exata delas. Rápido demais para o olho seguir, vira a média da volta toda
  // (sem isso o borrão pularia de lugar a cada quadro)
  const t = Math.min(1, Math.max(0, (s - 1.2) / 1.8)), v = s + (2 * Math.PI - s) * t * t * (3 - 2 * t);
  const k = v < .05 ? 1 : Math.min(40, Math.ceil(v / .1));
  for(let i = 0; i < k; i++){
    ctx.save(); ctx.globalAlpha = 1 / (i + 1); ctx.rotate(ang - sent * v * i / k); corpo(ctx, R); ctx.restore();
  }
  // sombra chapada na face, embaixo à direita
  ctx.save(); roda(ctx, R * .76); ctx.clip();
  ctx.beginPath(); ctx.arc(0, 0, R * .76, 0, 2 * Math.PI); ctx.arc(-R * .16, -R * .16, R * .78, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(40,90,150,.17)'; ctx.fill('evenodd'); ctx.restore();
  ctx.strokeStyle = TINTA; ctx.lineWidth = lw * .55; roda(ctx, R * .76); ctx.stroke();
  // brilho no aro, em cima à esquerda
  ctx.beginPath(); ctx.arc(0, 0, R * .88, Math.PI * 1.06, Math.PI * 1.36); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = R * .085; ctx.stroke();
  // o eixo (pino claro no miolo escuro) e o contorno
  roda(ctx, R * .14); ctx.fillStyle = TINTA; ctx.fill();
  roda(ctx, R * .05); ctx.fillStyle = FACE; ctx.fill();
  ctx.strokeStyle = TINTA; ctx.lineWidth = lw; roda(ctx, R - lw / 2); ctx.stroke();
  ctx.restore();
}

function liga(alvo, op = {}){
  const tela = alvo === document.body || alvo === document.documentElement;
  const cfg = {raio: 15, fio: 170, ioios: 2, ...op};
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483000;opacity:0;transition:opacity .15s`;
  (tela ? document.body : alvo).append(cv);
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cada ioiô tem a sua corda: nós 0 (o dedo, segue o mouse) a N (o ioiô); o (ox, oy) é a posição do passo anterior (Verlet)
  const w = new Float64Array(N + 1).fill(1); w[0] = 0; w[N] = .012;   // o fio é leve; o ioiô de aço pesa como 80 nós
  const novo = () => ({px: new Float64Array(N + 1), py: new Float64Array(N + 1), ox: new Float64Array(N + 1), oy: new Float64Array(N + 1),
    L: 0, vL: 0, fase: 'mao', giro: 0, giroFundo: 1, ang: Math.random() * 6, pulso: 0, espera: 0, eletrico: false,
    mundo: 0, rodou: 0, angAnt: 0, noChao: false, recarga: 0});   // mundo e noChao: os truques desde o último arremesso
  let ios = [], R, Lmin, Lmax, preso = false, carga = 0, tSono = 0, tac = 0;
  let mx = 0, my = 0, dentro = false, larg = 0, alt = 0, dpr = 1, antes = 0, sobra = 0, pedido = 0, parado = 0;
  let ocioso = 0, fezTruque = false, choque = 0;
  const marcas = [];   // faíscas, marcas na borda, a batida entre os dois e os estalos na mão

  // com dois, um em cada dedo, um pouco para cada lado do ponteiro
  const dedo = i => ios.length < 2 ? 0 : (i ? DEDO : -DEDO);
  function medidas(){
    R = cfg.raio; Lmin = R + ARGOLA + 7; Lmax = Math.max(Lmin + 30, cfg.fio);
    const n = Math.max(1, Math.min(2, Math.round(cfg.ioios)));
    if(ios.length !== n){ ios = Array.from({length: n}, novo); ios.forEach((io, i) => poe(io, (dentro ? mx : larg / 2) + dedo(i), dentro ? my : alt / 3)); }
  }
  function mede(){
    const r = tela ? {width: innerWidth, height: innerHeight} : alvo.getBoundingClientRect();
    larg = r.width; alt = r.height; dpr = devicePixelRatio || 1;
    cv.width = Math.round(larg * dpr); cv.height = Math.round(alt * dpr); acorda();
  }
  // recomeça enrolado, parado, pendurado reto embaixo do dedo
  function poe(io, x, y){
    Object.assign(io, {fase: 'mao', vL: 0, L: Lmin, giro: 0, espera: 0, eletrico: false});
    for(let i = 0; i <= N; i++){ io.px[i] = io.ox[i] = x; io.py[i] = io.oy[i] = y + Lmin * i / N; }
  }
  function joga(io){ io.fase = 'desce'; io.vL = Math.max(io.vL, JOGA); io.mundo = io.rodou = 0; }
  // o tranco: o fio prende no eixo e o giro que sobrou vira subida. Com o giro de quando chegou no fim do fio, ele volta
  // estalando na mão; dormiu muito ou gastou andando no chão, volta devagar (mas sempre volta: o puxão completa).
  // Carregado de eletricidade, volta como um raio
  function sobe(io){
    const g = Math.min(1, Math.abs(io.giro) / io.giroFundo), chega = io.eletrico ? CHEGA[1] * 1.4 : CHEGA[0] + (CHEGA[1] - CHEGA[0]) * g * g;
    io.vL = -Math.sqrt(2 * SOBE * Math.max(0, io.L - Lmin) + chega * chega); io.fase = 'sobe';
  }

  // o comprimento do fio solto muda pelas fases (a corda só sabe que cada segmento mede L/N)
  function fio(io, h){
    if(io.fase === 'desce'){
      io.vL += DESCE * h; io.L += io.vL * h; io.giro = io.vL / (R * EIXO);
      if(io.L >= Lmax){ io.giroFundo = Math.max(1, io.giro); if(preso) io.fase = 'sono'; else { io.L = Lmax; sobe(io); } }
    } else if(io.fase === 'sono'){
      io.vL += (-12000 * (io.L - Lmax) - 55 * io.vL) * h; io.L += io.vL * h;   // fim do fio: estica uns px com o tranco e assenta
      io.giro *= Math.exp(-h / SONO * (1 - carga));                            // carregado, a eletricidade mantém o giro
    } else if(io.fase === 'sobe'){
      io.vL += SOBE * h; io.L += io.vL * h; io.giro = -io.vL / (R * EIXO);
      if(io.L <= Lmin){
        if(io.eletrico){
          // a mão segura firme o que volta como raio (sem isso ele passaria por cima do dedo)
          io.ox[N] = io.px[N] - (io.px[N] - io.ox[N]) * .25; io.oy[N] = io.py[N] - (io.py[N] - io.oy[N]) * .25;
          if(!calmo) marcas.push({tipo: 'raios', x: io.px[0], y: io.py[0], t: 0});
        }
        else if(-io.vL > 300 && !calmo) marcas.push({tipo: 'estalo', x: io.px[0], y: io.py[0], t: 0});
        io.L = Lmin; io.fase = 'mao'; io.vL = -.2 * io.vL; io.pulso = 1; io.eletrico = false;
        if(preso) joga(io);
      }
      else if(io.vL > -CHEGA[0] / 2) io.vL = -CHEGA[0] / 2;
    } else {
      io.vL += (-1600 * (io.L - Lmin) - 50 * io.vL) * h; io.L += io.vL * h;    // na mão: o quique de quando ele chega
      if(io.L < Lmin){ io.L = Lmin; io.vL = Math.max(0, io.vL); }
      io.giro *= Math.exp(-h / .25);
    }
  }

  function passo(h, ax, ay){
    // os dois dormindo com o clique preso: o Killua carrega os fios de eletricidade
    const dormindo = preso && ios.every(io => io.fase === 'sono');
    tSono = dormindo ? tSono + h : 0;
    carga = dormindo ? (tSono > .5 && !calmo ? Math.min(1, carga + h / .9) : carga) : 0;
    const g = G * h * h, chao = alt - R;
    ios.forEach((io, k) => {
      if(io.espera > 0 && (io.espera -= h) <= 0){ io.espera = 0; if(io.fase === 'mao') joga(io); }
      fio(io, h);
      const {px, py, ox, oy} = io;
      const amIo = Math.exp(-h * (calmo ? 8 : io.fase === 'mao' ? 5 : .5)), amFio = Math.exp(-h * 4);
      for(let i = 1; i <= N; i++){
        const am = i === N ? amIo : amFio, vx = (px[i] - ox[i]) * am, vy = (py[i] - oy[i]) * am;
        ox[i] = px[i]; oy[i] = py[i]; px[i] += vx; py[i] += vy + g;
      }
      ox[0] = px[0]; oy[0] = py[0]; px[0] = ax + dedo(k); py[0] = ay;
    });
    // quanto os dois se aproximam antes de se tocar (para o tac da batida)
    let chega = 0;
    if(ios.length === 2){
      const [a, b] = ios, dx = b.px[N] - a.px[N], dy = b.py[N] - a.py[N], d = Math.hypot(dx, dy) || 1e-6;
      chega = -(((b.px[N] - b.ox[N]) - (a.px[N] - a.ox[N])) * dx + ((b.py[N] - b.oy[N]) - (a.py[N] - a.oy[N])) * dy) / d / h;
    }
    for(let k = 0; k < VOLTAS; k++){
      for(const {px, py, L} of ios){
        const seg = L / N;
        // cada segmento mede L/N
        for(let i = 0; i < N; i++){
          const dx = px[i + 1] - px[i], dy = py[i + 1] - py[i], d = Math.hypot(dx, dy) || 1e-6, ws = w[i] + w[i + 1];
          const c = (d - seg) / (d * ws);
          px[i] += dx * c * w[i]; py[i] += dy * c * w[i]; px[i + 1] -= dx * c * w[i + 1]; py[i + 1] -= dy * c * w[i + 1];
        }
        // e nenhum nó fica mais longe do dedo do que o fio até ele deixa: o fio não estica, nem com o ioiô pesado
        for(let i = 2; i <= N; i++){
          const dx = px[i] - px[0], dy = py[i] - py[0], d = Math.hypot(dx, dy), lim = seg * i;
          if(d > lim){ const c = (d - lim) / d; px[i] -= dx * c; py[i] -= dy * c; }
        }
        // as bordas: o fio fica dentro, e o ioiô com o corpo todo dentro
        for(let i = 1; i < N; i++){ px[i] = Math.min(larg - 1, Math.max(1, px[i])); py[i] = Math.min(alt - 1, Math.max(1, py[i])); }
        px[N] = Math.min(larg - R, Math.max(R, px[N])); py[N] = Math.min(chao, Math.max(R, py[N]));
      }
      // os dois são de aço: um não entra no outro (cada um cede metade)
      if(ios.length === 2){
        const [a, b] = ios, dx = b.px[N] - a.px[N], dy = b.py[N] - a.py[N], d = Math.hypot(dx, dy) || 1e-6;
        if(d < 2 * R){ const c = (2 * R - d) / d / 2; a.px[N] -= dx * c; a.py[N] -= dy * c; b.px[N] += dx * c; b.py[N] += dy * c; }
      }
    }
    // bateram um no outro com força: tac, e o giro de um passa um pouco para o outro
    tac = Math.max(0, tac - h);
    if(ios.length === 2 && chega > 420 && !tac){
      const [a, b] = ios;
      if(Math.hypot(b.px[N] - a.px[N], b.py[N] - a.py[N]) < 2 * R + .5){
        tac = .1;
        if(!calmo) marcas.push({tipo: 'tac', x: (a.px[N] + b.px[N]) / 2, y: (a.py[N] + b.py[N]) / 2, t: 0, f: Math.min(1, chega / 1500), el: carga > .3});
        const m = (a.giro - b.giro) * .15; a.giro -= m; b.giro += m;
      }
    }
    ios.forEach(io => depois(io, h, chao));
  }
  function depois(io, h, chao){
    const {px, py, ox, oy} = io;
    // batida nas bordas: o ioiô volta com 30% da velocidade (devagar, só encosta)
    const dx = px[N] - ox[N], dy = py[N] - oy[N];
    io.recarga = Math.max(0, io.recarga - h);
    if((py[N] >= chao - .01 && dy > 0) || (py[N] <= R + .01 && dy < 0)){ oy[N] = py[N] + (Math.abs(dy) > .5 ? dy * .3 : 0); bateu(io, Math.abs(dy) / h, 0, dy > 0 ? -1 : 1); }
    if((px[N] >= larg - R - .01 && dx > 0) || (px[N] <= R + .01 && dx < 0)){ ox[N] = px[N] + (Math.abs(dx) > .5 ? dx * .3 : 0); bateu(io, Math.abs(dx) / h, dx > 0 ? -1 : 1, 0); }
    // volta ao mundo: o ioiô dá a volta inteira em torno do dedo com o fio esticado
    const a = Math.atan2(py[N] - py[0], px[N] - px[0]);
    if(io.fase === 'sono' && Math.hypot(px[N] - px[0], py[N] - py[0]) > .8 * io.L){
      io.rodou += a - io.angAnt - 2 * Math.PI * Math.round((a - io.angAnt) / (2 * Math.PI));
      if(Math.abs(io.rodou) >= 2 * Math.PI){ io.mundo++; io.rodou -= Math.sign(io.rodou) * 2 * Math.PI; }
    }
    io.angAnt = a;
    // no chão, o aro girando empurra o ioiô (anda para o lado do giro) e o atrito gasta o giro
    io.noChao = py[N] >= chao - .5;
    if(io.noChao){
      const v = (px[N] - ox[N]) / h, lim = ATRITO * G * h;
      const J = Math.max(-lim, Math.min(lim, (io.giro * R - v) / (1 + INERCIA)));
      ox[N] -= J * h; io.giro -= INERCIA * J / R;
    }
    io.ang += io.giro * h;
  }

  // o aço bate na borda: faíscas que caem e uma marca curta na borda, que some (carregado, solta raios também)
  function bateu(io, v, nx, ny){
    if(v < BATE || io.recarga || calmo) return;
    io.recarga = .12;
    const f = Math.min(1, (v - BATE) / 1800 + .35), x = io.px[N] - nx * R, y = io.py[N] - ny * R;
    const p = Array.from({length: 4 + Math.round(5 * f)}, () => {
      const a = Math.atan2(ny, nx) + (Math.random() - .5) * 2.4, s = (160 + Math.random() * 380) * (.6 + f);
      return [x, y, Math.cos(a) * s, Math.sin(a) * s];
    });
    // a marca: três trincas curtas saindo do ponto, ao longo da borda e um pouco para dentro
    const tr = [-1, 1, Math.random() < .5 ? -1 : 1].map((l, i) => {
      const pts = [[0, 0]]; let u = 0, w = 0;
      for(let k = 0; k < 3; k++){ u += l * (2.5 + Math.random() * 3) * (i === 2 ? .5 : 1); w += (i === 2 ? 3 : .8) + Math.random() * 1.6; pts.push([u, w]); }
      return pts;
    });
    marcas.push({tipo: 'bate', x, y, nx, ny, t: 0, f, p, tr, el: carga > .3 || io.eletrico});
  }
  // um ponto no fio: u vai de 0 (dedo) a 1 (ioiô)
  function noFio(io, u){
    const q = Math.min(N, Math.max(0, u * N)), i = Math.min(N - 1, Math.floor(q)), k = q - i;
    return [io.px[i] + (io.px[i + 1] - io.px[i]) * k, io.py[i] + (io.py[i + 1] - io.py[i]) * k];
  }
  // um raio quebrado de (x0, y0) a (x1, y1), tremendo a cada quadro
  function raio(x0, y0, x1, y1, partes, amp){
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, qx = -dy / d, qy = dx / d;
    ctx.beginPath(); ctx.moveTo(x0, y0);
    for(let i = 1; i < partes; i++){ const u = i / partes, o = (Math.random() - .5) * 2 * amp; ctx.lineTo(x0 + dx * u + qx * o, y0 + dy * u + qy * o); }
    ctx.lineTo(x1, y1);
  }
  const tracoRaio = (lw = 1.3) => { ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,10,16,.6)'; ctx.lineWidth = lw + 1.6; ctx.stroke(); ctx.strokeStyle = RAIOS; ctx.lineWidth = lw; ctx.stroke(); };
  // raios curtos saindo de um círculo (o ioiô carregado, a mão quando ele volta como raio, a borda que ele bateu)
  function estala(x, y, r0, r1, n, amp, lw = 1.2){
    for(let i = 0; i < n; i++){
      const a = Math.random() * 2 * Math.PI, r = r1 * (.75 + Math.random() * .5);
      raio(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a + .35) * r, y + Math.sin(a + .35) * r, 3, amp); tracoRaio(lw);
    }
  }
  // o fio carregado vira raio: passa pelos nós tremendo para os lados
  function fioRaio(io, amp, lw){
    const {px, py} = io;
    ctx.beginPath(); ctx.moveTo(px[0], py[0]);
    for(let i = 1; i < N; i++){
      const dx = px[i + 1] - px[i - 1], dy = py[i + 1] - py[i - 1], d = Math.hypot(dx, dy) || 1, o = (Math.random() - .5) * 2 * amp;
      ctx.lineTo(px[i] - dy / d * o, py[i] + dx / d * o);
    }
    ctx.lineTo(px[N], py[N]); tracoRaio(lw);
  }
  function pintaMarcas(){
    for(const m of marcas){
      if(m.tipo === 'bate'){
        const a = Math.max(0, 1 - m.t / .7), tx = -m.ny, ty = m.nx;
        ctx.beginPath();
        for(const tr of m.tr) tr.forEach(([u, w], i) => { const x = m.x + tx * u + m.nx * w, y = m.y + ty * u + m.ny * w; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = `rgba(150,160,180,${.8 * a})`; ctx.lineWidth = 1; ctx.stroke();
        if(m.t < .18){
          // o clarão do aço: risquinhos curtos em leque
          const k = m.t / .18; ctx.beginPath();
          for(const [u, v] of [[1, .4], [-1, .4], [.5, 1], [-.5, 1], [0, 1]]){
            const ex = tx * u + m.nx * v, ey = ty * u + m.ny * v, n = Math.hypot(ex, ey), d0 = 3 + 10 * k, d1 = d0 + 8 * m.f * (1 - k * .5);
            ctx.moveTo(m.x + ex / n * d0, m.y + ey / n * d0); ctx.lineTo(m.x + ex / n * d1, m.y + ey / n * d1);
          }
          ctx.strokeStyle = `rgba(255,255,255,${.9 * (1 - k)})`; ctx.lineWidth = 1.3; ctx.stroke();
          if(m.el) estala(m.x, m.y, 2, 26 * (1 - k * .4), 4, 3.5, 1.3);
        }
        for(const [x, y, vx, vy] of m.p){
          if(m.t > .45) break;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * .018, y - vy * .018);
          ctx.strokeStyle = m.el ? `rgba(191,230,255,${1 - m.t / .45})` : `rgba(255,214,122,${1 - m.t / .45})`; ctx.lineWidth = 1.4; ctx.stroke();
        }
      } else if(m.tipo === 'tac'){
        // os dois batem: um clarão curto em cruz no ponto de contato
        const k = m.t / .14, d0 = 2 + 6 * k, d1 = d0 + 7 * m.f * (1 - k);
        ctx.beginPath();
        for(let i = 0; i < 6; i++){ const a = i * Math.PI / 3 + .3; ctx.moveTo(m.x + Math.cos(a) * d0, m.y + Math.sin(a) * d0); ctx.lineTo(m.x + Math.cos(a) * d1, m.y + Math.sin(a) * d1); }
        ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 1.3; ctx.stroke();
        if(m.el && k < .7) estala(m.x, m.y, 2, 20, 3, 3);
      } else if(m.tipo === 'estalo'){
        // voltou rápido para a mão: quatro tracinhos em volta da argola
        const k = m.t / .16, d0 = ARGOLA + 3 + 6 * k, d1 = d0 + 4 * (1 - k);
        ctx.beginPath();
        for(let i = 0; i < 4; i++){ const a = Math.PI / 4 + i * Math.PI / 2; ctx.moveTo(m.x + Math.cos(a) * d0, m.y + Math.sin(a) * d0); ctx.lineTo(m.x + Math.cos(a) * d1, m.y + Math.sin(a) * d1); }
        ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(232,236,244,${1 - k})`; ctx.lineWidth = 1.3; ctx.stroke();
      } else if(m.tipo === 'raios'){
        // voltou como raio: a mão estala, cada vez menos
        const k = m.t / .35; estala(m.x, m.y, ARGOLA + 1, 14 + 16 * (1 - k), Math.round(6 * (1 - k)) + 1, 3.2, 1.3);
      }
    }
  }
  const DURA = {bate: .7, tac: .14, estalo: .16, raios: .35};
  // o choque do ócio: a faísca desce pelo fio (curto: ele está enrolado) e o ioiô estala em raios em volta
  function pintaChoque(io){
    const {px, py} = io;
    if(choque < .14){
      const u = choque / .14, [x0, y0] = noFio(io, Math.max(0, u - .14)), [x1, y1] = noFio(io, u);
      raio(x0, y0, x1, y1, 4, 2.6); tracoRaio(1.4);
      ctx.beginPath(); ctx.arc(x1, y1, 1.8, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
    } else if(choque < .9){
      const k = (choque - .14) / .76;
      if(k < .6){
        const [x0, y0] = noFio(io, 0), dx = x0 - px[N], dy = y0 - py[N], d = Math.hypot(dx, dy) || 1;
        raio(x0, y0, px[N] + dx / d * R, py[N] + dy / d * R, 4, 2.4); tracoRaio(1.2);
      }
      estala(px[N], py[N], R * 1.02, R * 1.9 * (1 - .3 * k), Math.round(7 * (1 - k * k)) + 1, R * .16, 1.3);
    }
  }

  function pintaFio(io){
    const {px, py} = io;
    // o fio sai da borda da argola e passa liso pelos nós (curvas pelos pontos médios); contorno escuro para o tema claro
    let j = 1; while(j < N && Math.hypot(px[j] - px[0], py[j] - py[0]) < ARGOLA) j++;
    const d = Math.hypot(px[j] - px[0], py[j] - py[0]) || 1;
    ctx.beginPath(); ctx.moveTo(px[0] + (px[j] - px[0]) / d * ARGOLA, py[0] + (py[j] - py[0]) / d * ARGOLA);
    for(let i = j; i < N; i++) ctx.quadraticCurveTo(px[i], py[i], (px[i] + px[i + 1]) / 2, (py[i] + py[i + 1]) / 2);
    ctx.lineTo(px[N], py[N]);
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(8,10,16,.55)'; ctx.lineWidth = 2.8; ctx.stroke();
    ctx.strokeStyle = FIO; ctx.lineWidth = 1.2; ctx.stroke();
  }
  function pinta(dt){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    for(const io of ios){
      pintaFio(io);
      // carregando, o fio pisca em raio (cada vez mais) e o ioiô solta faíscas; voltando como raio, o fio é o raio
      if(carga && io.fase === 'sono' && Math.random() < .35 + .65 * carga) fioRaio(io, 1.5 + 3 * carga, .8 + .7 * carga);
      if(io.eletrico && io.fase === 'sobe') fioRaio(io, 3.5, 1.6);
      desenha(ctx, io.px[N], io.py[N], R, io.ang, calmo ? 0 : io.giro * dt * .7);
      if(carga > .15 && io.fase === 'sono') estala(io.px[N], io.py[N], R * 1.02, R * (1.3 + .7 * carga), Math.ceil(4 * carga), R * .15);
      if(choque) pintaChoque(io);
    }
    pintaMarcas();
    // a argola no dedo é o ponteiro (com dois, o clique cai entre elas); pulsa quando o ioiô volta para a mão
    for(const io of ios){
      const ra = ARGOLA * (1 + .35 * io.pulso * io.pulso);
      ctx.beginPath(); ctx.arc(io.px[0], io.py[0], ra, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(8,10,16,.6)'; ctx.lineWidth = 3.4; ctx.stroke();
      ctx.strokeStyle = carga > .5 ? RAIOS : FIO; ctx.lineWidth = 1.6; ctx.stroke();
    }
  }

  function quadro(agora){
    pedido = 0;
    const dt = Math.min(.05, antes ? (agora - antes) / 1000 : 1 / 60); antes = agora;
    sobra += dt; let n = Math.floor(sobra / PASSO); sobra -= n * PASSO;
    if(n > 12){ n = 12; sobra = 0; }
    // o dedo anda em linha reta entre os quadros, dividido pelos passos: puxão rápido não atravessa nada
    const bx = ios[0].px[0] - dedo(0), by = ios[0].py[0];
    for(let i = 1; i <= n; i++) passo(PASSO, i < n ? bx + (mx - bx) * i / n : mx, i < n ? by + (my - by) * i / n : my);
    for(const io of ios) io.pulso = Math.max(0, io.pulso - dt / .18);
    for(let i = marcas.length - 1; i >= 0; i--){
      const m = marcas[i]; m.t += dt;
      if(m.p) for(const q of m.p){ q[0] += q[2] * dt; q[1] += q[3] * dt; q[3] += G * .5 * dt; q[2] *= Math.exp(-dt * 3); }
      if(m.t > DURA[m.tipo]) marcas.splice(i, 1);
    }
    if(choque){
      const c0 = choque; choque += dt;
      if(c0 < .14 && choque >= .14) for(const io of ios) if(io.fase === 'mao') io.giro = 38;   // o tranco do choque faz o ioiô girar no lugar
      if(choque > .9) choque = 0;
    }
    pinta(dt);
    // enrolados, sem balançar e sem mexer o mouse: o laço para até o próximo evento
    const quietos = ios.every(io => io.fase === 'mao' && Math.hypot(io.px[N] - io.ox[N], io.py[N] - io.oy[N]) / PASSO < 1 && Math.abs(io.vL) < 1
      && !io.pulso && !io.espera && Math.abs(io.giro) < .3);
    parado = quietos && !choque && !marcas.length && Math.abs(mx - bx) + Math.abs(my - by) < .01 ? parado + 1 : 0;
    if(parado < 30) pedido = requestAnimationFrame(quadro);
    else {
      // parado uns segundos: o Killua carrega o fio
      antes = 0; clearTimeout(ocioso);
      if(dentro && !calmo && !fezTruque) ocioso = setTimeout(() => { fezTruque = true; choque = 1e-6; acorda(); }, 4500);
    }
  }
  function acorda(){ parado = 0; if(!pedido) pedido = requestAnimationFrame(quadro); }

  const pos = e => { if(tela) return [e.clientX, e.clientY]; const r = alvo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function move(e){
    if(e.pointerType === 'touch') return;
    [mx, my] = pos(e); clearTimeout(ocioso); fezTruque = false;
    if(!dentro){ dentro = true; ios.forEach((io, i) => poe(io, mx + dedo(i), my)); cv.style.opacity = 1; }
    acorda();
  }
  // clique: os dois descem, o segundo logo depois do primeiro, como o Killua joga
  function aperta(e){
    if(e.pointerType === 'touch' || e.button !== 0) return;
    move(e); preso = true;
    ios.forEach((io, i) => { if(io.fase === 'mao'){ if(i) io.espera = .07; else joga(io); } });
    if(!tela) try { alvo.setPointerCapture(e.pointerId); } catch {}
    acorda();
  }
  // soltar: os que dormem voltam; carregados, voltam como raio
  function solta(){
    if(!preso) return; preso = false;
    for(const io of ios) if(io.fase === 'sono'){ io.eletrico = carga > .4; sobe(io); }
    carga = 0; acorda();
  }
  function sai(){ if(preso) return; dentro = false; clearTimeout(ocioso); choque = 0; cv.style.opacity = 0; acorda(); }
  const ev = tela ? document.documentElement : alvo;
  const ouvintes = [['pointermove', move], ['pointerdown', aperta], ['pointerup', solta], ['pointercancel', solta], ['pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(alvo); else addEventListener('resize', mede);
  mede(); medidas();

  return {
    ajusta(o){ Object.assign(cfg, o); medidas(); acorda(); },
    estado: () => ({fase: ios[0].fase, fases: ios.map(io => io.fase), voltas: ios[0].giro / (2 * Math.PI), fio: ios[0].L, preso, carga,
      x: ios[0].px[N], y: ios[0].py[N], ioios: ios.map(io => ({x: io.px[N], y: io.py[N], giro: io.giro})), mundo: ios[0].mundo, noChao: ios[0].noChao}),
    legenda(){
      const fases = [...new Set(ios.map(io => FASES[io.fase]))].join(' / ');
      const v = Math.max(...ios.map(io => Math.abs(io.giro / (2 * Math.PI)))), mundo = Math.max(...ios.map(io => io.fase !== 'mao' ? io.mundo : 0));
      return fases + (v >= .5 ? ` · ${v.toFixed(v < 10 ? 1 : 0)} voltas/s` : '')
        + (ios.some(io => io.noChao && Math.abs(io.giro) > 2 * Math.PI) ? ' · passeando com o cachorro' : '') + (mundo ? ` · volta ao mundo ×${mundo}` : '')
        + (carga ? ` · carregando ${Math.round(carga * 100)}%` : '') + (ios.some(io => io.eletrico) ? ' · voltando como raio' : '')
        + (choque ? ' · choque no fio' : '');
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede);
      cancelAnimationFrame(pedido); clearTimeout(ocioso); cv.remove();
    },
  };
}

// o que a bancada mostra: legenda das fases, controles e prévias paradas (com as classes da bancada)
const FASES = {mao: 'enrolado na mão', desce: 'descendo', sono: 'dormindo', sobe: 'subindo'};
function previas(el, cfg){
  const tela = (lado, ang, varre) => { const c = document.createElement('canvas'), d = devicePixelRatio || 1;
    c.className = 'prev'; c.width = c.height = Math.ceil(lado * d); c.style.width = c.style.height = lado + 'px';
    const x = c.getContext('2d'); x.scale(d, d); desenha(x, lado / 2, lado / 2, lado / 2 - 1, ang, varre); return c; };
  el.innerHTML = '<section><h2>parado, de 120 a 24 px de diâmetro, no escuro e no claro</h2><div class="linha"></div><div class="linha claro" style="margin-top:12px"></div></section>'
    + '<section><h2>o borrão do giro (o mesmo ioiô, cada vez mais rápido)</h2><div class="linha"></div></section>';
  const [e, c, g] = el.querySelectorAll('.linha');
  [e, c].forEach(l => l.append(...[120, 64, 48, 2 * cfg.raio, 24].map(t => tela(t, -.3, 0))));
  g.append(...[0, .4, 1.1, 2.1, 6].map(v => tela(96, -.3, v)));
}
(window.CURSORES = window.CURSORES || {}).ioio = {liga, desenha, previas,
  titulo: 'mexa o mouse na tela preta · clique · segure · solte',
  dica: 'clique: os dois descem · segurando: ficam esticados, dormindo, e o fio vai carregando de eletricidade · soltando: voltam (carregados, voltam como raio)<br>segurando, gire o mouse em círculos (volta ao mundo), encoste no chão (anda com o giro) ou bata um no outro e nas bordas · parado uns segundos: choque no fio',
  controles: [{k: 'raio', rot: 'raio do ioiô', min: 9, max: 26, un: 'px', padrao: 15}, {k: 'fio', rot: 'fio', min: 90, max: 320, un: 'px', padrao: 170},
    {k: 'ioios', rot: 'ioiôs', min: 1, max: 2, un: '', padrao: 2}]};
})();
