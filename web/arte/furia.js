/* fx-shake, Fúria visível (#134): o chefão em fúria (a nota que falta passou da média) solta o Ren. Hoje ele só treme sem
   parar. Aqui a aura é desenhada em código, no nível do Ten do En (hover/en.js):
     o fogo   duas camadas presas ao contorno do retrato: a de fora, vermelha, sobe em línguas (mais altas em cima, quase
              nada embaixo) que tremulam por ondas que correm a volta; a de dentro, mais clara, é o miolo quente rente ao
              retrato. Uma folga fina separa o fogo do retrato, que fica limpo.
     soltas   línguas que se desprendem do alto e sobem afinando, e brasas que sobem balançando.
     o acesso a cada ~2,8 s (desencontrado entre os chefões): a onda de choque sai do contorno, as chamas dobram e voltam,
              estoura um punhado de brasas, a veia 💢 do mangá salta no canto (chapada, contorno de tinta) e o retrato dá
              um tranco curto. Entre um acesso e outro ele fica parado, só com o fogo.
   Um canvas só por cima da página (sem eventos de mouse), que acha os elementos pelo seletor a cada quadro e apaga o
   miolo de cada um, então serve para qualquer tamanho (a Lista, os cards e a coluna da aba Chefões) e não precisa mexer
   no retrato (o overflow:hidden dele não atrapalha). Parado com a aba escondida e sem nada em fúria na tela.

   GB_FURIA.cola(op) -> {ajusta(op), para(), estado()}
     op.sel     os elementos em fúria (padrão '.av.bs.hurt,.ring.fury')
     op.ciclo   segundos entre um acesso e outro (padrão 2.8)
     op.veia    a veia 💢 no acesso (padrão true)
     op.tranco  o tranco do retrato no acesso (padrão true)
     op.forca   liga mesmo com prefers-reduced-motion (sem isso, só o fogo parado) */
(function(){
const TAU = Math.PI * 2;
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const varCss = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const ac = (a, b) => a + Math.random() * (b - a);
const tinta = document.createElement('canvas').getContext('2d');
function rgb(c){
  tinta.fillStyle = '#000'; tinta.fillStyle = c || '#F7768E'; const v = tinta.fillStyle;
  if(v[0] === '#') return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
  return (v.match(/[\d.]+/g) || [247, 118, 142]).slice(0, 3).map(Number);
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${lim(a, 0, 1)})`;
const mix = (a, b, q) => a.map((v, i) => Math.round(v + (b[i] - v) * q));
/* o pop da veia: passa do tamanho, encolhe, assenta, pulsa e some */
function veiaEsc(u){
  if(u < .08) return 1.35 * (u / .08);
  if(u < .14) return 1.35 - .47 * ((u - .08) / .06);
  if(u < .2) return .88 + .17 * ((u - .14) / .06);
  if(u < .8) return 1 + .04 * Math.sin((u - .2) * 30);
  return Math.max(0, 1 - (u - .8) / .2 * .4);
}
const VEIA = new Path2D('M4 9.5Q9.5 9.5 9.5 4M14.5 4Q14.5 9.5 20 9.5M20 14.5Q14.5 14.5 14.5 20M9.5 20Q9.5 14.5 4 14.5');

function cola(op0){
  let op = Object.assign({sel:'.av.bs.hurt,.ring.fury', ciclo:2.8, veia:true, tranco:true, forca:false}, op0);
  const quieto = calmo() && !op.forca;
  const cv = document.createElement('canvas');
  cv.className = 'gb-furia';
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:40';
  document.body.append(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const mede = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr); };
  mede(); addEventListener('resize', mede);

  let cor, quente, claro = false;
  const paleta = () => { cor = rgb(varCss('red')); quente = mix(cor, [255, 196, 120], .5);
    const b = rgb(getComputedStyle(document.body).backgroundColor); claro = (.299 * b[0] + .587 * b[1] + .114 * b[2]) > 150; };
  paleta(); const relê = setInterval(paleta, 1000);

  const est = new WeakMap(), vivos = new Set(), soltas = [], brasas = [], ondas = [];
  function estado(el){
    let s = est.get(el);
    if(!s){ s = {f: [ac(0, TAU), ac(0, TAU)], prox: ac(.4, op.ciclo), ac: -1, surto: 0, acum: 0}; est.set(el, s); }
    return s;
  }
  /* o raio da chama em cada ângulo: base fina em volta, línguas altas em cima, ondas que correm a volta */
  function altura(a, R, t, s){
    const cima = Math.max(0, -Math.sin(a)), lado = Math.abs(Math.cos(a));
    /* picos estreitos (a ponta da língua) que correm a volta em velocidades diferentes, por cima de um corpo que respira */
    const pico = (k, v, f) => Math.pow(Math.max(0, Math.sin(a * k + t * v + f)), 5);
    const linguas = pico(7, 5.5, s.f[0]) + .8 * pico(11, -7.3, s.f[1]) + .6 * pico(5, 9.1, s.f[0] * 2);
    const corpo = .5 + .5 * Math.sin(a * 3 - t * 4 + s.f[1]);
    return R * (.08 + (Math.pow(cima, 1.2) * .75 + lado * .16) * (.25 * corpo + .75 * linguas) * (1 + s.surto * .8) + .025 * Math.sin(a * 17 - t * 15));
  }
  function contorno(cx, cy, R0, R, t, s, k){
    const N = 120, pts = [];
    for(let i = 0; i < N; i++){
      const a = i / N * TAU - Math.PI / 2, h = Math.max(.6, altura(a, R, t, s) * k), cima = Math.max(0, -Math.sin(a));
      pts.push([cx + Math.cos(a) * (R0 + h), cy + Math.sin(a) * (R0 + h) - h * .35 * cima]);   // a ponta puxada para cima
    }
    g.moveTo((pts[0][0] + pts[N - 1][0]) / 2, (pts[0][1] + pts[N - 1][1]) / 2);
    for(let i = 0; i < N; i++){ const p = pts[i], q = pts[(i + 1) % N]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    g.closePath();
  }
  function veia(x, y, r, u){
    const e = veiaEsc(u); if(e <= .02) return;
    g.save(); g.translate(x, y); g.rotate((1 - Math.min(1, u / .14)) * -.35); g.scale(e * r / 12, e * r / 12); g.translate(-12, -12);
    g.lineCap = 'round'; g.globalAlpha = u > .8 ? 1 - (u - .8) / .2 : 1;
    g.strokeStyle = '#1E0A0E'; g.lineWidth = 5.4; g.stroke(VEIA);
    g.strokeStyle = '#FF4D5E'; g.lineWidth = 3; g.stroke(VEIA);
    g.translate(-.5, -.5); g.strokeStyle = '#FFB3BB'; g.lineWidth = .9; g.stroke(VEIA);
    g.restore(); g.globalAlpha = 1;
  }

  let raf = 0, ult = 0, t = 0, vivo = true, ocioso = 0;
  function quadro(now){
    if(!vivo) return;
    raf = requestAnimationFrame(quadro);
    const dt = Math.min(.05, (now - (ult || now)) / 1000); ult = now;
    if(document.hidden) return;
    const els = [];
    for(const el of document.querySelectorAll(op.sel)){
      if(el.closest('[hidden]') || !el.offsetParent) continue;
      const b = el.getBoundingClientRect(); if(!b.width || b.bottom < -60 || b.top > H + 60 || b.right < -60 || b.left > W + 60) continue;
      els.push([el, b]);
    }
    for(const el of vivos) if(!els.some(([e]) => e === el)){ el.style.translate = ''; vivos.delete(el); }
    if(!els.length && !soltas.length && !brasas.length && !ondas.length){
      if(ocioso++ === 0){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); }
      return;
    }
    ocioso = 0;
    if(!quieto) t += dt;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const furo = [];
    for(const [el, b] of els){
      const s = estado(el); vivos.add(el);
      /* o centro sem o tranco (o retrato mexe, a aura não) */
      const tr = (el.style.translate || '0px 0px').split(' ').map(parseFloat);
      const cx = b.left + b.width / 2 - (tr[0] || 0), cy = b.top + b.height / 2 - (tr[1] || 0), R = Math.min(b.width, b.height) / 2, R0 = R + Math.max(1.2, R * .05);
      if(!quieto){
        /* o acesso */
        s.prox -= dt;
        if(s.prox <= 0){ s.ac = 0; s.prox = op.ciclo * ac(.85, 1.2);
          ondas.push({x: cx, y: cy, R: R0, t: 0});
          for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + ac(-1.4, 1.4), v = ac(30, 70) * R / 21; brasas.push({x: cx + Math.cos(a) * R0, y: cy + Math.sin(a) * R0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, T: ac(.5, .9), r: ac(.8, 1.6)}); } }
        if(s.ac >= 0){ s.ac += dt; if(s.ac > .95) s.ac = -1; }
        const u = s.ac >= 0 ? s.ac : 9;
        s.surto = u < .1 ? u / .1 : Math.max(0, 1 - (u - .1) / .55);
        el.style.translate = op.tranco && u < .26 ? `${(Math.sin(u * 95) * 2.2 * (1 - u / .26)).toFixed(2)}px ${(Math.cos(u * 70) * 1.1 * (1 - u / .26)).toFixed(2)}px` : '';
        /* soltas e brasas do fogo contínuo, pela altura das línguas */
        s.acum += dt * (2.2 + s.surto * 6) * R / 21;
        while(s.acum >= 1){ s.acum--;
          const a = -Math.PI / 2 + ac(-.9, .9), h = altura(a, R, t, s);
          if(Math.random() < .55) soltas.push({x: cx + Math.cos(a) * (R0 + h * .6), y: cy + Math.sin(a) * (R0 + h * .6) - h * .3, w: ac(1.4, 2.4) * R / 21, H: ac(4, 8) * R / 21, t: 0, T: ac(.35, .6), ph: ac(0, TAU), v: ac(26, 44) * R / 21});
          else brasas.push({x: cx + ac(-R, R) * .8, y: cy - R0 - h * .4, vx: ac(-8, 8), vy: ac(-38, -22) * R / 21, t: 0, T: ac(.6, 1.1), r: ac(.6, 1.3)});
        }
      }
      /* o fogo: a camada de fora (vermelha, com brilho) e o miolo quente */
      /* do vermelho forte na base ao transparente na ponta (o fogo some subindo) */
      const alto = R0 + R * .9 * (1 + s.surto), gf = g.createRadialGradient(cx, cy - R * .15, R0 * .95, cx, cy - R * .35, alto);
      gf.addColorStop(0, rgba(cor, .95)); gf.addColorStop(.45, rgba(cor, claro ? .75 : .62)); gf.addColorStop(1, rgba(cor, .08));
      g.beginPath(); contorno(cx, cy, R0, R, t, s, 1); g.arc(cx, cy, R0 - .2, 0, TAU, true);
      g.shadowColor = rgba(cor, .8); g.shadowBlur = 6 + s.surto * 10;
      g.fillStyle = gf; g.fill('evenodd'); g.shadowBlur = 0;
      /* o miolo quente: as mesmas línguas, mais curtas, puxando para o laranja */
      g.beginPath(); contorno(cx, cy, R0, R, t, s, .38); g.arc(cx, cy, R0 - .2, 0, TAU, true);
      g.fillStyle = rgba(claro ? cor : quente, .8 + s.surto * .2); g.fill('evenodd');
      furo.push([cx, cy, R0 - .3, s, R]);
    }
    /* as línguas soltas: gota que sobe afinando e balança */
    g.fillStyle = rgba(cor, claro ? .6 : .5);
    for(let i = soltas.length - 1; i >= 0; i--){
      const p = soltas[i]; p.t += dt; if(p.t > p.T){ soltas.splice(i, 1); continue; }
      const q = p.t / p.T, w = p.w * (1 - q * .7), h = p.H * (1 - q * .4), x = p.x + Math.sin(p.t * 14 + p.ph) * 1.6, y = p.y - p.v * p.t;
      g.globalAlpha = 1 - q * q;
      g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * .6, y - h * .6, x, y - h); g.quadraticCurveTo(x + w * .6, y - h * .6, x + w, y); g.arc(x, y, w, 0, Math.PI); g.fill();
    }
    g.globalAlpha = 1;
    for(let i = brasas.length - 1; i >= 0; i--){
      const p = brasas[i]; p.t += dt; if(p.t > p.T){ brasas.splice(i, 1); continue; }
      p.vx *= 1 - 1.5 * dt; p.vy += -14 * dt; p.x += (p.vx + Math.sin(p.t * 9) * 6) * dt; p.y += p.vy * dt;
      const q = p.t / p.T; g.fillStyle = rgba(q < .4 ? quente : cor, 1 - q);
      g.beginPath(); g.arc(p.x, p.y, p.r * (1 - q * .5), 0, TAU); g.fill();
    }
    for(let i = ondas.length - 1; i >= 0; i--){
      const o = ondas[i]; o.t += dt; if(o.t > .45){ ondas.splice(i, 1); continue; }
      const q = o.t / .45, r = o.R * (1 + q * 1.1);
      g.beginPath(); g.arc(o.x, o.y, r, 0, TAU); g.strokeStyle = rgba(cor, .7 * (1 - q) ** 1.5); g.lineWidth = 2.2 * (1 - q) + .5; g.stroke();
    }
    /* o retrato fica limpo: apaga o miolo de cada um (o fogo e as soltas que passaram por cima) */
    g.globalCompositeOperation = 'destination-out';
    for(const [cx, cy, r] of furo){ g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    /* a veia vai por cima de tudo, no canto de cima à direita */
    if(op.veia) for(const [cx, cy, , s, R] of furo) if(s.ac >= 0) veia(cx + R * .78, cy - R * .78, Math.max(7, R * .42), s.ac / .95);
  }
  raf = requestAnimationFrame(quadro);
  return {
    ajusta(o){ op = Object.assign(op, o); },
    para(){ vivo = false; cancelAnimationFrame(raf); clearInterval(relê); removeEventListener('resize', mede); for(const el of vivos) el.style.translate = ''; cv.remove(); },
    estado: () => ({soltas: soltas.length, brasas: brasas.length, ondas: ondas.length}),
  };
}
window.GB_FURIA = {cola};
})();
