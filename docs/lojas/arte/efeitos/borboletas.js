/* fx-borboletas (Pouf, épico, #134): borboletas de aura voam devagar pela tela, juntam-se em volta do mouse, pousam
   na borda de cima dos cards e se espalham no clique, soltando escamas (o pó do Spiritual Message).
   Fica no lugar da Poeira de Nen (fx-estrelas). Canvas fixo do tamanho da janela, sem eventos (pointer-events:none).

   GB_BORBOLETAS.liga(op) -> {ajusta(op), para()}
     op.n        quantas (padrão 9)
     op.tam      meia envergadura em px (padrão 9)
     op.camada   'cima' (por cima das telas, padrão) | 'fundo' (atrás, como a poeira)
     op.pousa    seletor onde pousam (padrão '.card'; '' desliga)
     op.escamas  solta escamas (padrão true)
     op.brilho   halo nas asas e nas escamas (padrão false: o padrão é seco)
     op.cores    () => [cor1, cor2, fundo]; padrão lê --aura, --volt e --bg do :root
     op.forca    liga mesmo com prefers-reduced-motion */
(function(){
const TAU = Math.PI * 2;
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const varCss = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
const coresPadrao = () => [varCss('aura') || '#B4A0FF', varCss('volt') || '#9FD3FF', varCss('bg') || '#13141B'];
const ac = (a, b) => a + Math.random() * (b - a);

function liga(op0){
  const op = Object.assign({n:9, tam:9, camada:'cima', pousa:'.card', escamas:true, brilho:false, cores:coresPadrao, forca:false}, op0);
  if(calmo() && !op.forca) return {ajusta(){}, para(){}};

  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none';
  document.body.prepend(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0;
  const mede = () => { const dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W*dpr; cv.height = H*dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  mede(); addEventListener('resize', mede);

  let cs = op.cores(), ultCor = 0;
  const bs = [], es = [];
  const nova = i => ({x:ac(40, W - 40), y:ac(40, H - 40), vx:0, vy:0, ang:ac(0, TAU), dir:ac(0, TAU), fase:ac(0, TAU),
    m:ac(.8, 1.2), s:0, k:i % 2, sem:ac(0, 100), modo:'voa', t:0, plana:0, orb:ac(0, TAU), rOrb:ac(30, 70), esc:0});
  const ajustaN = () => { while(bs.length < op.n) bs.push(nova(bs.length)); bs.length = op.n; };
  ajustaN();

  /* mouse: vale por 4 s depois do último movimento; as borboletas rodeiam o ponto, não pousam nele */
  let mx = 0, my = 0, mt = -1e9;
  const move = e => { if(e.pointerType === 'touch') return; mx = e.clientX; my = e.clientY; mt = performance.now(); };
  const sai = () => { mt = -1e9; };
  const clica = e => {
    const px = e.clientX, py = e.clientY;
    for(const b of bs){
      const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy) || 1;
      if(d > 340) continue;
      const f = 230 + 260 * (1 - d / 340), a = Math.atan2(dy, dx) + ac(-.5, .5);
      b.vx = Math.cos(a) * f; b.vy = Math.sin(a) * f - 60; b.modo = 'foge'; b.t = ac(.7, 1.1); b.alvo = null;
      if(op.escamas) for(let i = 0; i < 7; i++) escama(b, 1);
    }
    mt = -1e9;   // depois do susto elas não voltam na hora para o mouse
  };
  addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerleave', sai);
  addEventListener('pointerdown', clica, {passive:true});

  function escama(b, forte){
    if(es.length > 260) return;
    const a = ac(0, TAU), v = forte ? ac(20, 70) : ac(2, 10);
    es.push({x:b.x + ac(-b.s, b.s)*.6, y:b.y + ac(-b.s, b.s)*.6, vx:Math.cos(a)*v + b.vx*.15, vy:Math.sin(a)*v + b.vy*.15,
      r:ac(.5, 1.3), k:b.k, vida:0, fim:ac(1.2, 2.2), f:ac(0, TAU)});
  }

  /* alvo de pouso: um ponto na borda de cima de um card à vista */
  function escolhePouso(b){
    if(!op.pousa) return;
    const els = [...document.querySelectorAll(op.pousa)].filter(el => { const r = el.getBoundingClientRect(); return r.width > 90 && r.top > 30 && r.top < H - 30; });
    if(!els.length) return;
    const el = els[Math.floor(Math.random() * els.length)];
    b.alvo = {el, fx:ac(.12, .88)}; b.modo = 'vai';
  }
  const pontoPouso = b => { const r = b.alvo.el.getBoundingClientRect(); return [r.left + r.width * b.alvo.fx, r.top - b.s * .15, r]; };

  let t0 = performance.now(), raf = 0, vivo = true;
  function passo(agora){
    if(!vivo) return;
    raf = requestAnimationFrame(passo);
    if(document.hidden){ t0 = agora; return; }
    const dt = Math.min(.05, (agora - t0) / 1000); t0 = agora;
    if(agora - ultCor > 600){ cs = op.cores(); ultCor = agora; }
    const temMouse = agora - mt < 4000;

    for(const b of bs){
      b.sem += dt; b.s = op.tam * b.m;
      let dx = 0, dy = 0, spd = 34, rapido = 1;
      if(b.modo === 'pousa'){
        const [px, py, r] = pontoPouso(b);
        b.x = px; b.y = py; b.t -= dt;
        b.ang += ((-Math.PI/2 + b.inc) - b.ang) * Math.min(1, dt*6);
        b.fase += dt * TAU * .55;
        const perto = temMouse && Math.hypot(mx - b.x, my - b.y) < 70;
        if(b.t <= 0 || perto || r.bottom < 0 || r.top > H){ b.modo = 'voa'; b.alvo = null; b.vy = -70; b.vx = ac(-30, 30); b.t = ac(4, 9); }
        continue;
      }
      if(b.modo === 'foge'){
        b.t -= dt; rapido = 2.2;
        b.vx *= Math.pow(.18, dt); b.vy *= Math.pow(.18, dt);
        if(b.t <= 0){ b.modo = 'voa'; b.t = ac(5, 10); }
      } else {
        /* vagar: a direção anda devagar, com um sobe-e-desce irregular de borboleta */
        b.dir += (Math.sin(b.sem*.7 + b.k*3) * .9 + Math.sin(b.sem*1.9 + b.m*9) * .6) * dt;
        dx = Math.cos(b.dir) * spd; dy = Math.sin(b.dir) * spd + Math.sin(b.sem*3.1 + b.m*9) * 26;
        const dm = temMouse ? Math.hypot(mx - b.x, my - b.y) : 1e9;
        if(dm < 300 && b.modo !== 'foge'){
          b.orb += dt * (.6 + (b.k ? .25 : -.15));
          const ox = mx + Math.cos(b.orb) * b.rOrb, oy = my + Math.sin(b.orb) * b.rOrb * .75;
          const ex = ox - b.x, ey = oy - b.y, de = Math.hypot(ex, ey) || 1, v = Math.min(95, de * 1.6), w = 1 - dm / 300;
          dx = dx * (1 - w) + ex / de * v * (.4 + w); dy = dy * (1 - w) + ey / de * v * (.4 + w);
          if(b.modo === 'vai'){ b.modo = 'voa'; b.alvo = null; }
        } else if(b.modo === 'vai'){
          if(!b.alvo.el.isConnected){ b.modo = 'voa'; b.alvo = null; }
          else {
            const [px, py] = pontoPouso(b), ex = px - b.x, ey = py - b.y, de = Math.hypot(ex, ey) || 1;
            dx = ex / de * Math.min(60, de * 1.4 + 8); dy = ey / de * Math.min(60, de * 1.4 + 8);
            if(de < 5){ b.modo = 'pousa'; b.t = ac(3, 8); b.inc = ac(-.35, .35); b.vx = b.vy = 0; continue; }
          }
        } else {
          b.t -= dt;
          if(b.t <= 0){ if(Math.random() < .55) escolhePouso(b); b.t = ac(5, 11); }
        }
        /* bordas: vira para dentro sem bater */
        const m = 40;
        if(b.x < m) dx += (m - b.x) * 3; if(b.x > W - m) dx -= (b.x - W + m) * 3;
        if(b.y < m) dy += (m - b.y) * 3; if(b.y > H - m) dy -= (b.y - H + m) * 3;
        const k = Math.min(1, dt * 1.8); b.vx += (dx - b.vx) * k; b.vy += (dy - b.vy) * k;
        if(b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20){ b.x = Math.min(W - 40, Math.max(40, b.x)); b.y = Math.min(H - 40, Math.max(40, b.y)); }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      const v = Math.hypot(b.vx, b.vy);
      if(v > 4){ let da = Math.atan2(b.vy, b.vx) - b.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); b.ang += da * Math.min(1, dt * 5); }
      /* planar: de vez em quando para de bater e desliza com as asas abertas */
      if(b.modo === 'voa' && b.plana <= 0 && Math.random() < dt * .25) b.plana = ac(.5, 1.1);
      b.plana -= dt;
      b.fase += dt * TAU * (b.plana > 0 ? .6 : 7.5 * rapido);
      if(op.escamas && (b.esc += dt) > (b.modo === 'foge' ? .05 : .35)){ b.esc = 0; escama(b, 0); }
    }

    for(let i = es.length - 1; i >= 0; i--){
      const e = es[i]; e.vida += dt;
      if(e.vida > e.fim){ es.splice(i, 1); continue; }
      e.vx *= Math.pow(.25, dt); e.vy = e.vy * Math.pow(.25, dt) + 9 * dt; e.f += dt * 3;
      e.x += (e.vx + Math.sin(e.f) * 4) * dt; e.y += e.vy * dt;
    }
    desenha();
  }

  function desenha(){
    g.clearRect(0, 0, W, H);
    const brilho = op.brilho;
    for(const e of es){
      const q = 1 - e.vida / e.fim;
      g.globalAlpha = q * (.45 + .4 * Math.sin(e.f * 2.3) ** 2); g.fillStyle = cs[e.k];
      if(brilho){ g.shadowColor = cs[e.k]; g.shadowBlur = 6; }
      g.beginPath(); g.arc(e.x, e.y, e.r, 0, TAU); g.fill();
    }
    g.shadowBlur = 0; g.globalAlpha = 1;
    for(const b of bs) borboleta(b, brilho);
  }

  /* vista de cima: o bater das asas é o encurtar da envergadura (cos da fase) */
  function borboleta(b, brilho){
    const S = b.s, c = cs[b.k], fundo = cs[2];
    const ab = b.plana > 0 && b.modo === 'voa' ? .92 + .08 * Math.cos(b.fase)
      : b.modo === 'pousa' ? .25 + .75 * (.5 + .5 * Math.cos(b.fase)) ** 2 : .5 + .5 * Math.cos(b.fase);
    const e = .1 + .9 * ab;
    g.save(); g.translate(b.x, b.y); g.rotate(b.ang + Math.PI / 2);
    if(brilho){ g.shadowColor = c; g.shadowBlur = 10; }
    for(const lado of [1, -1]){
      g.save(); g.scale(lado * e, 1);
      // asa da frente
      g.beginPath(); g.moveTo(.08*S, -.25*S);
      g.bezierCurveTo(.5*S, -1.15*S, 1.15*S, -1.05*S, 1.05*S, -.55*S);
      g.bezierCurveTo(1.0*S, -.15*S, .55*S, .05*S, .08*S, .02*S); g.closePath();
      g.globalAlpha = .92; g.fillStyle = c; g.fill();
      // asa de trás
      g.beginPath(); g.moveTo(.08*S, .02*S);
      g.bezierCurveTo(.75*S, .0*S, .95*S, .45*S, .7*S, .78*S);
      g.bezierCurveTo(.5*S, 1.0*S, .2*S, .8*S, .06*S, .35*S); g.closePath();
      g.globalAlpha = .8; g.fill();
      g.shadowBlur = 0;
      // desenho das asas: faixa escura na ponta da frente e o olho na de trás (chapado, cor do fundo)
      g.globalAlpha = .55; g.fillStyle = fundo;
      g.beginPath(); g.moveTo(.62*S, -.92*S); g.bezierCurveTo(.95*S, -1.0*S, 1.1*S, -.8*S, 1.03*S, -.55*S);
      g.bezierCurveTo(.9*S, -.62*S, .72*S, -.72*S, .62*S, -.92*S); g.fill();
      g.beginPath(); g.arc(.55*S, .5*S, .13*S, 0, TAU); g.fill();
      g.restore();
    }
    // corpo e antenas
    g.globalAlpha = 1; g.fillStyle = fundo; g.strokeStyle = c;
    g.beginPath(); g.ellipse(0, .05*S, .11*S, .55*S, 0, 0, TAU); g.fill(); g.lineWidth = 1; g.stroke();
    g.lineWidth = .8; g.beginPath();
    g.moveTo(-.04*S, -.45*S); g.quadraticCurveTo(-.15*S, -.85*S, -.32*S, -1.0*S);
    g.moveTo(.04*S, -.45*S); g.quadraticCurveTo(.15*S, -.85*S, .32*S, -1.0*S); g.stroke();
    g.restore();
  }

  raf = requestAnimationFrame(passo);
  const aplicaCamada = () => { cv.style.zIndex = op.camada === 'fundo' ? 0 : 50; };
  aplicaCamada();
  return {
    ajusta(o){ Object.assign(op, o); ajustaN(); aplicaCamada(); cs = op.cores(); if(!op.escamas) es.length = 0; },
    para(){ vivo = false; cancelAnimationFrame(raf); removeEventListener('pointermove', move); document.removeEventListener('pointerleave', sai); removeEventListener('pointerdown', clica); removeEventListener('resize', mede); cv.remove(); },
  };
}
window.GB_BORBOLETAS = {liga};
})();
