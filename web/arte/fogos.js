/* fx-fogos, Fogos no andar novo (raro, #134): no andar novo e no chefão derrotado. Hoje são cinco estouros de bolinhas iguais
   que já nascem no alto. Aqui é um show curto, de ~4 s: cada foguete sobe do pé da tela com um rastro de faíscas e um
   leve zigue-zague, desacelera e estoura no ponto mais alto, com um clarão no lugar. Cinco tipos de estouro, sorteados sem
   repetir em seguida:
     peônia      esfera cheia de uma cor, que cai devagar
     anel        um anel inclinado com o miolo de outra cor
     salgueiro   dourado, com rastros longos que pendem e escorrem como galhos
     crisântemo  duas cores, e no fim cada fagulha estala num pontinho branco
     palmeira    poucos braços grossos que sobem, abrem e caem em arco
   e no fim um trio junto. Cores da paleta; o dourado do salgueiro é fixo.
   Leve: no máximo ~1.400 fagulhas, canvas até 1,5x, rastro pelo apagar do quadro anterior (sem guardar histórico).

   GB_FOGOS.dispara(op)
     op.lento   1 normal, 4 câmera lenta (bancada)
     op.forca   dispara mesmo com prefers-reduced-motion */
(function(){
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const varCss = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
const ac = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2, OURO = '#FFC864', G = 260;
const TIPOS = ['peonia', 'anel', 'salgueiro', 'crisantemo', 'palmeira'];

function dispara(op0){
  const op = Object.assign({lento:1, forca:false}, op0);
  if(calmo() && !op.forca) return;
  const cv = document.createElement('canvas'), d = Math.min(devicePixelRatio || 1, 1.5), W = innerWidth, H = innerHeight;
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
  cv.width = W * d; cv.height = H * d; document.body.append(cv);
  const g = cv.getContext('2d'); g.scale(d, d);
  const cores = ['volt', 'aura', 'red', 'grn', 'amb', 'acc'].map(varCss).filter(Boolean);
  const bg = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g) || [0, 0, 0];
  const claro = (.299 * bg[0] + .587 * bg[1] + .114 * bg[2]) > 150;
  const esc = Math.min(1.25, Math.max(.7, Math.sqrt(W * H) / 1100));   // estouro proporcional à tela
  const fog = [], fag = [], clar = [];
  let ultTipo = '';
  const cor = () => cores[Math.floor(Math.random() * cores.length)];

  function lanca(x, alto, tipo){
    const y0 = H + 8, ap = H * alto, vy = -Math.sqrt(2 * G * 3 * (y0 - ap));
    if(!tipo){ do tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)]; while(tipo === ultTipo); }
    ultTipo = tipo;
    fog.push({x, y: y0, vx: ac(-25, 25), vy, tipo, fase: ac(0, TAU)});
  }
  function fagulha(x, y, vx, vy, c, o){ if(fag.length < 1400) fag.push(Object.assign({x, y, vx, vy, c, vida: 1, dur: 1.4, arr: 1.3, gr: 1, r: 1.8, estala: false}, o)); }
  function estoura(f){
    const {x, y, tipo} = f, c1 = cor(); let c2 = cor(); if(c2 === c1) c2 = cores[(cores.indexOf(c1) + 2) % cores.length];
    clar.push({x, y, c: tipo === 'salgueiro' ? OURO : c1, vida: 1});
    const v = 230 * esc;
    if(tipo === 'peonia') for(let i = 0; i < 120; i++){ const a = ac(0, TAU), s = v * Math.pow(Math.random(), .35); fagulha(x, y, Math.cos(a) * s, Math.sin(a) * s, c1, {dur: ac(1.2, 1.7)}); }
    if(tipo === 'anel'){
      const inc = ac(-.6, .6), ach = ac(.35, .6);
      for(let i = 0; i < 72; i++){ const a = i / 72 * TAU, ex = Math.cos(a) * v * 1.05, ey = Math.sin(a) * v * 1.05 * ach;
        fagulha(x, y, ex * Math.cos(inc) - ey * Math.sin(inc), ex * Math.sin(inc) + ey * Math.cos(inc), c1, {dur: 1.5, arr: 1.1}); }
      for(let i = 0; i < 26; i++){ const a = ac(0, TAU), s = v * .3 * Math.random(); fagulha(x, y, Math.cos(a) * s, Math.sin(a) * s, c2, {dur: 1.1}); }
    }
    if(tipo === 'salgueiro') for(let i = 0; i < 95; i++){ const a = ac(0, TAU), s = v * .95 * Math.pow(Math.random(), .3);
      fagulha(x, y, Math.cos(a) * s, Math.sin(a) * s, OURO, {dur: ac(2.4, 3), arr: 2.1, gr: .55, r: 1.5}); }
    if(tipo === 'crisantemo') for(let i = 0; i < 110; i++){ const a = ac(0, TAU), s = v * Math.pow(Math.random(), .3);
      fagulha(x, y, Math.cos(a) * s, Math.sin(a) * s, i % 2 ? c1 : c2, {dur: ac(1.1, 1.4), estala: Math.random() < .55}); }
    if(tipo === 'palmeira'){ const n = 7, a0 = ac(0, TAU);
      for(let i = 0; i < n; i++){ const a = a0 + i / n * TAU, s = v * 1.1;
        for(let k = 0; k < 9; k++) fagulha(x, y, Math.cos(a) * s * (1 - k * .045), Math.sin(a) * s * (1 - k * .045) - 40, k ? c1 : '#FFFFFF', {dur: 1.9 - k * .05, arr: 1.4, gr: 1.1, r: 2.6 - k * .12}); } }
  }
  /* o roteiro: cinco foguetes espalhados e o trio do final */
  const roteiro = [[0, .3, .3], [.38, .7, .22], [.78, .5, .36], [1.15, .2, .26], [1.55, .82, .3], [2.15, .25, .2, 'peonia'], [2.2, .5, .14, 'salgueiro'], [2.25, .75, .2, 'crisantemo']];
  const t0 = performance.now(); let ult = t0, i = 0;
  function passo(now){
    const dt = Math.min(.033, (now - ult) / 1000) / op.lento; ult = now;
    const T = (now - t0) / 1000 / op.lento;
    while(i < roteiro.length && roteiro[i][0] <= T){ const [, fx, alto, tipo] = roteiro[i++]; lanca(W * (fx + ac(-.04, .04)), alto + ac(-.03, .03), tipo); }
    /* rastro: apaga um pouco do quadro anterior em vez de limpar */
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.fillStyle = `rgba(0,0,0,${Math.max(.06, .22 / op.lento)})`; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = claro ? 'source-over' : 'lighter';
    for(let k = fog.length - 1; k >= 0; k--){
      const f = fog[k]; f.vy += G * 3 * dt; f.fase += dt * 9; f.x += (f.vx + Math.sin(f.fase) * 18) * dt; f.y += f.vy * dt;
      fagulha(f.x + ac(-1, 1), f.y + 4, ac(-14, 14), ac(20, 70), OURO, {dur: ac(.25, .45), arr: 3, gr: .4, r: 1.3});
      g.globalAlpha = 1; g.fillStyle = '#FFF4D6'; g.beginPath(); g.arc(f.x, f.y, 2.2, 0, TAU); g.fill();
      if(f.vy >= -25){ estoura(f); fog.splice(k, 1); }
    }
    for(let k = clar.length - 1; k >= 0; k--){
      const c = clar[k]; c.vida -= dt * 3.2; if(c.vida <= 0){ clar.splice(k, 1); continue; }
      const r = 120 * esc * (1.4 - c.vida * .4), gr = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
      gr.addColorStop(0, c.c); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = c.vida * (claro ? .18 : .32); g.fillStyle = gr; g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.fill();
    }
    for(let k = fag.length - 1; k >= 0; k--){
      const p = fag[k]; p.vida -= dt / p.dur;
      if(p.vida <= 0){ if(p.estala) for(let j = 0; j < 2; j++) fagulha(p.x, p.y, ac(-50, 50), ac(-50, 50), '#FFFFFF', {dur: .18, r: 1.4, arr: 4}); fag.splice(k, 1); continue; }
      p.vx -= p.vx * p.arr * dt; p.vy -= p.vy * p.arr * dt; p.vy += G * p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const a = p.vida < .3 ? p.vida / .3 : 1;
      g.globalAlpha = a * (Math.random() < .12 && p.vida < .5 ? .3 : 1);   // cintila perto do fim
      g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r * (.6 + .4 * p.vida), 0, TAU); g.fill();
    }
    if(T < 6 && (i < roteiro.length || fog.length || fag.length || clar.length)) requestAnimationFrame(passo);
    else { g.globalAlpha = 1; let f = 0; const some = () => { g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, H); if(++f < 14) requestAnimationFrame(some); else cv.remove(); }; some(); }
  }
  requestAnimationFrame(passo);
}
window.GB_FOGOS = {dispara};
})();
