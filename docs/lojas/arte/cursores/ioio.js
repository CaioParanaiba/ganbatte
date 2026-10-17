// Cursor com física do ioiô do Killua (cr-ioio), desenhado em código, sem imagem.
// O ioiô fica enrolado logo abaixo do cursor. Clicar joga ele para baixo (desenrola girando); segurar deixa ele
// "dormindo" na ponta do fio esticado; soltar dá o tranco e ele sobe enrolando, mais rápido quanto mais giro sobrou.
// O fio é uma corda de verdade (Verlet, 16 nós, passo fixo de 1/240 s) presa no cursor, e o ioiô é o peso da ponta:
// balança com o mouse, afrouxa se o mouse desce mais rápido que ele, dá a volta ao mundo se girar forte e, encostado no
// chão enquanto dorme, anda (walk the dog) gastando o giro. O borrão do giro é a média de cópias do ioiô girado no quadro.
//   const io = CURSORES.ioio.liga(elemento, {raio: 15, fio: 170})   io.ajusta({fio: 220})   io.estado()   io.desliga()
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
  const cfg = {raio: 15, fio: 170, ...op};
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483000;opacity:0;transition:opacity .15s`;
  (tela ? document.body : alvo).append(cv);
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // nós do fio: 0 é o dedo (segue o mouse), N é o ioiô; o (ox, oy) é a posição do passo anterior (Verlet)
  const px = new Float64Array(N + 1), py = new Float64Array(N + 1), ox = new Float64Array(N + 1), oy = new Float64Array(N + 1);
  const w = new Float64Array(N + 1).fill(1); w[0] = 0; w[N] = .012;   // o fio é leve; o ioiô de aço pesa como 80 nós
  let R, Lmin, Lmax, L = 0, vL = 0, fase = 'mao', preso = false, giro = 0, giroFundo = 1, ang = 0, pulso = 0;
  let mx = 0, my = 0, dentro = false, larg = 0, alt = 0, dpr = 1, antes = 0, sobra = 0, pedido = 0, parado = 0;
  let mundo = 0, rodou = 0, angAnt = 0, noChao = false;   // truques desde o último arremesso (a bancada mostra)

  function medidas(){ R = cfg.raio; Lmin = R + ARGOLA + 7; Lmax = Math.max(Lmin + 30, cfg.fio); }
  function mede(){
    const r = tela ? {width: innerWidth, height: innerHeight} : alvo.getBoundingClientRect();
    larg = r.width; alt = r.height; dpr = devicePixelRatio || 1;
    cv.width = Math.round(larg * dpr); cv.height = Math.round(alt * dpr); acorda();
  }
  // recomeça enrolado, parado, pendurado reto embaixo do cursor
  function poe(x, y){
    fase = 'mao'; vL = 0; L = Lmin; giro = 0;
    for(let i = 0; i <= N; i++){ px[i] = ox[i] = x; py[i] = oy[i] = y + L * i / N; }
  }
  function joga(){ fase = 'desce'; vL = Math.max(vL, JOGA); mundo = rodou = 0; }
  // o tranco: o fio prende no eixo e o giro que sobrou vira subida. Com o giro de quando chegou no fim do fio, ele volta
  // estalando na mão; dormiu muito ou gastou andando no chão, volta devagar (mas sempre volta: o puxão completa)
  function sobe(){
    const g = Math.min(1, Math.abs(giro) / giroFundo), chega = CHEGA[0] + (CHEGA[1] - CHEGA[0]) * g * g;
    vL = -Math.sqrt(2 * SOBE * Math.max(0, L - Lmin) + chega * chega); fase = 'sobe';
  }

  // o comprimento do fio solto muda pelas fases (a corda só sabe que cada segmento mede L/N)
  function fio(h){
    if(fase === 'desce'){
      vL += DESCE * h; L += vL * h; giro = vL / (R * EIXO);
      if(L >= Lmax){ giroFundo = Math.max(1, giro); if(preso) fase = 'sono'; else { L = Lmax; sobe(); } }
    } else if(fase === 'sono'){
      vL += (-12000 * (L - Lmax) - 55 * vL) * h; L += vL * h;   // fim do fio: estica uns px com o tranco e assenta
      giro *= Math.exp(-h / SONO);
    } else if(fase === 'sobe'){
      vL += SOBE * h; L += vL * h; giro = -vL / (R * EIXO);
      if(L <= Lmin){ L = Lmin; fase = 'mao'; vL = -.2 * vL; pulso = 1; if(preso) joga(); }
      else if(vL > -CHEGA[0] / 2) vL = -CHEGA[0] / 2;
    } else {
      vL += (-1600 * (L - Lmin) - 50 * vL) * h; L += vL * h;    // na mão: o quique de quando ele chega
      if(L < Lmin){ L = Lmin; vL = Math.max(0, vL); }
      giro *= Math.exp(-h / .25);
    }
  }

  function passo(h, ax, ay){
    fio(h);
    const seg = L / N, chao = alt - R, g = G * h * h;
    const amIo = Math.exp(-h * (calmo ? 8 : fase === 'mao' ? 5 : .5)), amFio = Math.exp(-h * 4);
    for(let i = 1; i <= N; i++){
      const am = i === N ? amIo : amFio, vx = (px[i] - ox[i]) * am, vy = (py[i] - oy[i]) * am;
      ox[i] = px[i]; oy[i] = py[i]; px[i] += vx; py[i] += vy + g;
    }
    ox[0] = px[0]; oy[0] = py[0]; px[0] = ax; py[0] = ay;
    for(let k = 0; k < VOLTAS; k++){
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
    // batida nas bordas: o ioiô volta com 30% da velocidade (devagar, só encosta)
    const dx = px[N] - ox[N], dy = py[N] - oy[N];
    if((py[N] >= chao - .01 && dy > 0) || (py[N] <= R + .01 && dy < 0)) oy[N] = py[N] + (Math.abs(dy) > .5 ? dy * .3 : 0);
    if((px[N] >= larg - R - .01 && dx > 0) || (px[N] <= R + .01 && dx < 0)) ox[N] = px[N] + (Math.abs(dx) > .5 ? dx * .3 : 0);
    // volta ao mundo: o ioiô dá a volta inteira em torno do dedo com o fio esticado
    const a = Math.atan2(py[N] - py[0], px[N] - px[0]);
    if(fase === 'sono' && Math.hypot(px[N] - px[0], py[N] - py[0]) > .8 * L){
      rodou += a - angAnt - 2 * Math.PI * Math.round((a - angAnt) / (2 * Math.PI));
      if(Math.abs(rodou) >= 2 * Math.PI){ mundo++; rodou -= Math.sign(rodou) * 2 * Math.PI; }
    }
    angAnt = a;
    // no chão, o aro girando empurra o ioiô (anda para o lado do giro) e o atrito gasta o giro
    noChao = py[N] >= chao - .5;
    if(noChao){
      const v = (px[N] - ox[N]) / h, lim = ATRITO * G * h;
      const J = Math.max(-lim, Math.min(lim, (giro * R - v) / (1 + INERCIA)));
      ox[N] -= J * h; giro -= INERCIA * J / R;
    }
    ang += giro * h;
  }

  function pinta(dt){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    // o fio sai da borda da argola e passa liso pelos nós (curvas pelos pontos médios); contorno escuro para o tema claro
    let j = 1; while(j < N && Math.hypot(px[j] - px[0], py[j] - py[0]) < ARGOLA) j++;
    const d = Math.hypot(px[j] - px[0], py[j] - py[0]) || 1;
    ctx.beginPath(); ctx.moveTo(px[0] + (px[j] - px[0]) / d * ARGOLA, py[0] + (py[j] - py[0]) / d * ARGOLA);
    for(let i = j; i < N; i++) ctx.quadraticCurveTo(px[i], py[i], (px[i] + px[i + 1]) / 2, (py[i] + py[i + 1]) / 2);
    ctx.lineTo(px[N], py[N]);
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(8,10,16,.55)'; ctx.lineWidth = 2.8; ctx.stroke();
    ctx.strokeStyle = FIO; ctx.lineWidth = 1.2; ctx.stroke();
    desenha(ctx, px[N], py[N], R, ang, calmo ? 0 : giro * dt * .7);
    // a argola no dedo é o ponteiro (o clique cai no centro); pulsa quando o ioiô volta para a mão
    const ra = ARGOLA * (1 + .35 * pulso * pulso);
    ctx.beginPath(); ctx.arc(px[0], py[0], ra, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(8,10,16,.6)'; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.strokeStyle = FIO; ctx.lineWidth = 1.6; ctx.stroke();
  }

  function quadro(agora){
    pedido = 0;
    const dt = Math.min(.05, antes ? (agora - antes) / 1000 : 1 / 60); antes = agora;
    sobra += dt; let n = Math.floor(sobra / PASSO); sobra -= n * PASSO;
    if(n > 12){ n = 12; sobra = 0; }
    // o dedo anda em linha reta entre os quadros, dividido pelos passos: puxão rápido não atravessa nada
    const bx = px[0], by = py[0];
    for(let i = 1; i <= n; i++) passo(PASSO, i < n ? bx + (mx - bx) * i / n : mx, i < n ? by + (my - by) * i / n : my);
    pulso = Math.max(0, pulso - dt / .18);
    pinta(dt);
    // enrolado, sem balançar e sem mexer o mouse: o laço para até o próximo evento
    const mexe = Math.hypot(px[N] - ox[N], py[N] - oy[N]) / PASSO;
    parado = fase === 'mao' && mexe < 1 && Math.abs(vL) < 1 && !pulso && Math.abs(mx - bx) + Math.abs(my - by) < .01 ? parado + 1 : 0;
    if(parado < 30) pedido = requestAnimationFrame(quadro); else antes = 0;
  }
  function acorda(){ parado = 0; if(!pedido) pedido = requestAnimationFrame(quadro); }

  const pos = e => { if(tela) return [e.clientX, e.clientY]; const r = alvo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function move(e){
    if(e.pointerType === 'touch') return;
    [mx, my] = pos(e);
    if(!dentro){ dentro = true; poe(mx, my); cv.style.opacity = 1; }
    acorda();
  }
  function aperta(e){
    if(e.pointerType === 'touch' || e.button !== 0) return;
    move(e); preso = true; if(fase === 'mao') joga();
    if(!tela) try { alvo.setPointerCapture(e.pointerId); } catch {}
    acorda();
  }
  function solta(){ if(!preso) return; preso = false; if(fase === 'sono') sobe(); acorda(); }
  function sai(){ if(preso) return; dentro = false; cv.style.opacity = 0; acorda(); }
  const ev = tela ? document.documentElement : alvo;
  const ouvintes = [['pointermove', move], ['pointerdown', aperta], ['pointerup', solta], ['pointercancel', solta], ['pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(alvo); else addEventListener('resize', mede);
  medidas(); mede(); poe(larg / 2, alt / 3);

  return {
    ajusta(o){ Object.assign(cfg, o); medidas(); acorda(); },
    estado: () => ({fase, voltas: giro / (2 * Math.PI), fio: L, preso, x: px[N], y: py[N], mundo, noChao}),
    legenda(){
      const v = Math.abs(giro / (2 * Math.PI));
      return FASES[fase] + (v >= .5 ? ` · ${v.toFixed(v < 10 ? 1 : 0)} voltas/s` : '')
        + (noChao && v > 1 ? ' · passeando com o cachorro' : '') + (mundo && fase !== 'mao' ? ` · volta ao mundo ×${mundo}` : '');
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede);
      cancelAnimationFrame(pedido); cv.remove();
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
  dica: 'clique: desce · segurando: fica esticado, dormindo · soltando: volta · balance o mouse e o fio balança<br>segurando, gire o mouse em círculos (volta ao mundo) ou encoste o ioiô no chão (ele anda com o giro)',
  controles: [{k: 'raio', rot: 'raio do ioiô', min: 9, max: 26, un: 'px', padrao: 15}, {k: 'fio', rot: 'fio', min: 90, max: 320, un: 'px', padrao: 170}]};
})();
