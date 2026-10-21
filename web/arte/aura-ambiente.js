/* fx-drift, Aura ambiente (raro, #134): a névoa de nen que passeia devagar no fundo, refeita a partir da de hoje.
   A de hoje é um círculo de aura que vai e volta do canto de cima à direita. A nova guarda essa ideia (uma nuvem grande,
   lenta, no canto), mas a nuvem tem forma viva: é feita de lobos que giram uns em volta dos outros, então ela se
   deforma e respira em vez de só deslizar. Uma segunda nuvem, menor e na cor volt, responde do canto oposto, e a
   principal se inclina devagar para o lado onde está o mouse (sem segui-lo).
   Barata: um canvas em 1/4 da resolução (o navegador amplia e a ampliação já desfoca), redesenhado a 30 qps, parado
   com a aba escondida. Fica atrás das telas (z-index 0).

   GB_AURA_AMB.liga(op) -> {ajusta(op), para()}
     op.forte    intensidade, 0.5 a 1.6 (padrão 1, perto da de hoje)
     op.segue    a nuvem se inclina para o mouse (padrão true)
     op.eco      a segunda nuvem, no canto oposto (padrão true)
     op.forca    liga mesmo com prefers-reduced-motion */
(function(){
const TAU = Math.PI * 2;
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const varCss = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
const tinta = document.createElement('canvas').getContext('2d');
function rgb(c){
  tinta.fillStyle = '#000'; tinta.fillStyle = c; const v = tinta.fillStyle;
  if(v[0] === '#') return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
  const m = v.match(/[\d.]+/g) || [0, 0, 0]; return m.slice(0, 3).map(Number);
}
const lum = ([r, g, b]) => (.2126*r + .7152*g + .0722*b) / 255;

const ESC = 4;   // o canvas tem 1/ESC da janela

/* uma nuvem: âncora (fração da janela), passeio (amplitude em px, períodos) e os lobos */
const NUVENS = [
  {ax:.86, ay:.12, amp:[170, 130], per:[29, 23], raio:300, cor:'aura', a:.17,
   lobos:[[0, 0, 1, 0], [.42, .3, .72, 11], [.5, -.25, .62, 17], [-.38, .4, .66, 13], [-.3, -.35, .55, 19]]},
  {ax:.1, ay:.9, amp:[120, 90], per:[37, 31], raio:220, cor:'volt', a:.1, eco:true,
   lobos:[[0, 0, 1, 0], [.45, -.3, .7, 15], [-.4, .25, .65, 21], [.2, .45, .55, 12]]},
];

function liga(op0){
  const op = Object.assign({forte:1, segue:true, eco:true, forca:false}, op0);
  if(calmo() && !op.forca) return {ajusta(){}, para(){}};

  const cv = document.createElement('canvas');
  cv.className = 'gb-aura-amb';
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:0';
  document.body.prepend(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0;
  const mede = () => { W = innerWidth; H = innerHeight; cv.width = Math.ceil(W / ESC); cv.height = Math.ceil(H / ESC); };
  mede(); addEventListener('resize', mede);

  let mx = .5, my = .5, ix = 0, iy = 0;
  const move = e => { if(e.pointerType === 'touch') return; mx = e.clientX / W; my = e.clientY / H; };
  addEventListener('pointermove', move, {passive:true});

  let cores = {}, claro = false, ultPal = 0;
  const paleta = () => { const bg = rgb(varCss('bg') || '#13141B'); claro = lum(bg) > .5; cores = {aura:rgb(varCss('aura') || '#B4A0FF'), volt:rgb(varCss('volt') || '#9FD3FF')}; };
  paleta();

  let raf = 0, ultQ = 0, vivo = true;
  function passo(agora){
    if(!vivo) return;
    raf = requestAnimationFrame(passo);
    if(document.hidden || agora - ultQ < 33) return;
    const dt = Math.min(.1, (agora - ultQ) / 1000); ultQ = agora;
    if(agora - ultPal > 1000){ ultPal = agora; paleta(); }
    const t = agora / 1000;

    /* inclinação para o mouse: uma fração pequena do caminho, com constante de tempo de ~5 s */
    const alvoX = op.segue ? (mx - .5) * 160 : 0, alvoY = op.segue ? (my - .5) * 110 : 0;
    ix += (alvoX - ix) * dt / 5; iy += (alvoY - iy) * dt / 5;

    g.clearRect(0, 0, cv.width, cv.height);
    g.globalCompositeOperation = claro ? 'source-over' : 'lighter';
    for(const nv of NUVENS){
      if(nv.eco && !op.eco) continue;
      const [r, gg, b] = cores[nv.cor];
      /* passeio em Lissajous no lugar do vai e volta, para não se ver o fim do caminho */
      const cx = nv.ax * W + Math.sin(t * TAU / nv.per[0]) * nv.amp[0] - (nv.eco ? 0 : nv.amp[0] * .5) + (nv.eco ? -ix * .5 : ix);
      const cy = nv.ay * H + Math.sin(t * TAU / nv.per[1] + 1.3) * nv.amp[1] + (nv.eco ? -iy * .5 : iy);
      const resp = 1 + .08 * Math.sin(t * TAU / 9 + nv.ax * 5);   // respira
      const a = nv.a * op.forte * (claro ? 1.3 : 1);
      for(const [lx, ly, lr, lp] of nv.lobos){
        /* cada lobo gira em volta do centro com período próprio: a nuvem se deforma sem parar */
        const ang = lp ? t * TAU / lp : 0, R = nv.raio * resp;
        const x = (cx + (lx * Math.cos(ang) - ly * Math.sin(ang)) * R * .8) / ESC;
        const y = (cy + (lx * Math.sin(ang) + ly * Math.cos(ang)) * R * .8) / ESC;
        const rr = R * lr / ESC;
        const gr = g.createRadialGradient(x, y, 0, x, y, rr);
        const c = al => `rgba(${r},${gg},${b},${al})`;
        gr.addColorStop(0, c(a)); gr.addColorStop(.45, c(a * .55)); gr.addColorStop(1, c(0));
        g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
    }
    g.globalCompositeOperation = 'source-over';
  }
  raf = requestAnimationFrame(passo);

  return {
    ajusta(o){ Object.assign(op, o); paleta(); },
    para(){ vivo = false; cancelAnimationFrame(raf); cv.remove(); removeEventListener('pointermove', move); removeEventListener('resize', mede); },
  };
}
window.GB_AURA_AMB = {liga};
})();
