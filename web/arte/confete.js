/* fx-confete, Confete no andar novo (comum, #134; era raro): no andar novo e no chefão derrotado. Hoje são 60 quadradinhos que
   caem retos do topo em 2,2 s. Aqui é papel: dois canhões estouram dos cantos de baixo (ou um só, do card que fez subir o
   andar), os papéis sobem rápido, perdem força no ar e descem flutuando: cada um gira, vira de face (o verso é um tom mais
   escuro) e balança de lado conforme a face que pega o ar, como papel de verdade. Retângulos, tiras finas e bolinhas, nas
   cores da paleta. Simples de propósito, sem brilho nem grito: é a comemoração comum, e o Soco, o Dragão e os Fogos ficam
   para quem quer mais.

   GB_CONFETE.dispara(op)
     op.de      'cantos' (padrão) | um DOMRect (o card: estoura de cima dele)
     op.n       quantos papéis (padrão 140)
     op.lento   1 normal, 4 câmera lenta (bancada)
     op.forca   dispara mesmo com prefers-reduced-motion */
(function(){
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const varCss = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
const ac = (a, b) => a + Math.random() * (b - a);
const tinta = document.createElement('canvas').getContext('2d');
function escuro(c, q){
  tinta.fillStyle = '#000'; tinta.fillStyle = c; const v = tinta.fillStyle;
  const [r, g, b] = v[0] === '#' ? [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)) : (v.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
  return `rgb(${Math.round(r * q)},${Math.round(g * q)},${Math.round(b * q)})`;
}

function dispara(op0){
  const op = Object.assign({de:'cantos', n:140, lento:1, forca:false}, op0);
  if(calmo() && !op.forca) return;
  const cv = document.createElement('canvas'), d = Math.min(devicePixelRatio || 1, 1.5), W = innerWidth, H = innerHeight;
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
  cv.width = W * d; cv.height = H * d; document.body.append(cv);
  const g = cv.getContext('2d'); g.scale(d, d);
  const cores = ['volt', 'aura', 'amb', 'grn', 'red', 'acc'].map(varCss).filter(Boolean);
  const ps = [], forca = Math.sqrt(H / 900);
  /* os canhões: posição, ângulo (graus, 0 = direita, -90 = para cima) e abertura */
  const canhoes = op.de === 'cantos'
    ? [[-10, H + 10, -62, 16], [W + 10, H + 10, -118, 16]]
    : [[op.de.left + op.de.width / 2, op.de.top + 4, -90, 38]];
  for(let i = 0; i < op.n; i++){
    const [x, y, ang, ab] = canhoes[i % canhoes.length], a = (ang + ac(-ab, ab)) * Math.PI / 180;
    const v = (op.de === 'cantos' ? ac(1250, 2000) : ac(420, 860)) * forca, c = cores[i % cores.length];
    const tipo = Math.random() < .62 ? 0 : Math.random() < .6 ? 1 : 2;   // retângulo, tira, bolinha
    ps.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: tipo === 1 ? ac(3, 4) : tipo === 2 ? ac(4, 6) : ac(7, 10), h: tipo === 1 ? ac(12, 18) : tipo === 2 ? 0 : ac(9, 13),
      tipo, ang: ac(0, 6.28), va: ac(-7, 7), fi: ac(0, 6.28), vfi: ac(5, 12) * (Math.random() < .5 ? -1 : 1), cor: c, verso: escuro(c, .62),
      arrasto: tipo === 2 ? .9 : tipo === 1 ? 1.2 : 1.5, queda: tipo === 2 ? ac(170, 220) : tipo === 1 ? ac(120, 160) : ac(70, 115), atraso: Math.random() * .12});
  }
  const t0 = performance.now(), FIM = 6;
  let ult = t0;
  function passo(now){
    const dt = Math.min(.033, (now - ult) / 1000) / op.lento; ult = now;
    const T = (now - t0) / 1000 / op.lento;
    g.clearRect(0, 0, W, H);
    let vivos = 0;
    for(const p of ps){
      if(T < p.atraso || p.y > H + 30) { if(p.y <= H + 30) vivos++; continue; }
      vivos++;
      /* ar: arrasto, gravidade e, descendo, o teto de queda do papel (flutua); o balanço de lado conforme a face que pega o ar */
      const vira = Math.cos(p.fi);
      p.vx -= p.vx * p.arrasto * dt;
      if(p.vy < p.queda * .6){ p.vy += 980 * dt; p.vy -= p.vy * p.arrasto * dt; } else p.vy += (p.queda - p.vy) * Math.min(1, 4 * dt);   // descendo, o ar segura
      if(p.tipo !== 2) p.vx += Math.sin(p.fi) * 260 * dt * (1 - Math.abs(vira));
      p.x += p.vx * dt; p.y += p.vy * dt; p.ang += p.va * dt; p.fi += p.vfi * dt;
      const some = T > FIM - .8 ? Math.max(0, (FIM - T) / .8) : 1;
      g.globalAlpha = some;
      g.save(); g.translate(p.x, p.y); g.rotate(p.ang);
      if(p.tipo === 2){ g.fillStyle = vira > 0 ? p.cor : p.verso; g.beginPath(); g.ellipse(0, 0, p.w / 2, p.w / 2 * Math.max(.15, Math.abs(vira)), 0, 0, 6.29); g.fill(); }
      else { g.scale(1, Math.max(.06, Math.abs(vira))); g.fillStyle = vira > 0 ? p.cor : p.verso; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      g.restore();
    }
    if(vivos && T < FIM) requestAnimationFrame(passo); else cv.remove();
  }
  requestAnimationFrame(passo);
}
window.GB_CONFETE = {dispara};
})();
