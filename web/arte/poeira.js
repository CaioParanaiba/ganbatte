/* fx-estrelas, Poeira de Nen (épico, #134): poeira de aura colorida flutuando no fundo, como os grãos de nen do anime.
   Fica atrás das telas (z-index 0, os cards por cima) e só aparece entre eles. Três profundidades: longe são pontos
   pequenos e lentos, perto são grãos maiores e desfocados que andam mais (paralaxe com o mouse). O ar tem correnteza
   (um campo de vento que muda devagar), uma rajada de aura atravessa a tela de tempos em tempos acendendo a poeira,
   o mouse abre caminho e o clique solta uma onda que empurra os grãos.
   Leve de propósito: canvas em 1x, grãos desenhados de sprites prontos (sem shadowBlur), densidade pela área da
   janela e parada com a aba escondida.

   GB_POEIRA.liga(op) -> {ajusta(op), para()}
     op.n        grãos numa janela de 1440×900 (padrão 170; cresce e diminui com a área)
     op.cores    'tema' (as cores da paleta: aura, volt, destaque, verde, âmbar) | 'arco' (todas as cores, mudando devagar)
     op.rajada   a rajada de aura de tempos em tempos (padrão true)
     op.mouse    paralaxe, abrir caminho e a onda do clique (padrão true)
     op.forca    liga mesmo com prefers-reduced-motion */
(function(){
const TAU = Math.PI * 2;
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const varCss = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
const ac = (a, b) => a + Math.random() * (b - a);

/* cor → [r,g,b]; aceita #rgb, #rrggbb e rgb()/hsl() (via um canvas de 1 px) */
const tinta = document.createElement('canvas').getContext('2d');
function rgb(c){
  tinta.fillStyle = '#000'; tinta.fillStyle = c; const v = tinta.fillStyle;
  if(v[0] === '#') return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
  const m = v.match(/[\d.]+/g) || [0, 0, 0]; return m.slice(0, 3).map(Number);
}
const lum = c => { const [r, g, b] = rgb(c); return (.2126*r + .7152*g + .0722*b) / 255; };
function hsl(h, s, l){
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}

/* sprite de um grão: núcleo cheio e halo curto (longe/meio) ou disco desfocado com borda um pouco mais clara (perto) */
function sprite([r, g, b], desfocado, claro){
  const S = 32, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'), gr = x.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2), cor = a => `rgba(${r},${g},${b},${a})`;
  if(desfocado){ gr.addColorStop(0, cor(.55)); gr.addColorStop(.62, cor(.42)); gr.addColorStop(.8, cor(.5)); gr.addColorStop(1, cor(0)); }
  else if(claro){ gr.addColorStop(0, cor(1)); gr.addColorStop(.3, cor(.85)); gr.addColorStop(.55, cor(.2)); gr.addColorStop(1, cor(0)); }
  else { gr.addColorStop(0, `rgba(255,255,255,1)`); gr.addColorStop(.1, cor(1)); gr.addColorStop(.3, cor(.9)); gr.addColorStop(.5, cor(.3)); gr.addColorStop(1, cor(0)); }
  x.fillStyle = gr; x.fillRect(0, 0, S, S); return c;
}

function liga(op0){
  const op = Object.assign({n:170, cores:'tema', rajada:true, mouse:true, forca:false}, op0);
  if(calmo() && !op.forca) return {ajusta(){}, para(){}};

  const cv = document.createElement('canvas');
  cv.className = 'gb-poeira';
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:0';
  document.body.prepend(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0;
  const mede = () => { W = innerWidth; H = innerHeight; cv.width = W; cv.height = H; ajustaN(); };

  /* paleta: lida do tema a cada segundo; as sprites só são refeitas quando a paleta muda */
  let chave = '', claro = false, sp = [];
  const ARCO = 18;
  function paleta(){
    const bg = varCss('bg') || '#13141B';
    const nomes = ['aura', 'volt', 'acc', 'grn', 'amb', 'red'], cs = nomes.map(varCss);
    const k = op.cores + bg + cs.join();
    if(k === chave) return; chave = k; claro = lum(bg) > .5;
    let base;
    if(op.cores === 'arco') base = Array.from({length:ARCO}, (_, i) => hsl(i * 360 / ARCO, claro ? .7 : .9, claro ? .46 : .7));
    else {
      /* aura e volt mandam (são as cores do nen no tema), as outras temperam */
      const pesos = [5, 4, 2, 2, 2, 1]; base = [];
      cs.forEach((c, i) => { if(c) for(let j = 0; j < pesos[i]; j++) base.push(rgb(c)); });
      if(!base.length) base = [rgb('#B4A0FF'), rgb('#9FD3FF')];
    }
    sp = base.map(c => [sprite(c, false, claro), sprite(c, true, claro)]);
  }

  /* grãos: z é a profundidade (0 longe, 1 perto) */
  const gs = [];
  const novo = (x, y) => {
    const z = Math.pow(Math.random(), 1.6);
    return {x:x ?? ac(0, W), y:y ?? ac(0, H), z, vx:0, vy:0, k:Math.random(), f:ac(0, TAU), tw:ac(.6, 1.8), luz:0};
  };
  function ajustaN(){
    const alvo = Math.round(op.n * Math.min(2.2, Math.max(.35, W * H / (1440 * 900))));
    while(gs.length < alvo) gs.push(novo());
    gs.length = alvo;
  }

  /* mouse: posição suavizada para a paralaxe; ondas do clique */
  let mx = innerWidth / 2, my = innerHeight / 2, px = mx, py = my, mVivo = false;
  const ondas = [];
  const move = e => { if(e.pointerType === 'touch') return; mx = e.clientX; my = e.clientY; mVivo = true; };
  const sai = () => { mVivo = false; };
  const clica = e => { if(op.mouse && ondas.length < 4) ondas.push({x:e.clientX, y:e.clientY, r:0}); };
  addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerleave', sai);
  addEventListener('pointerdown', clica, {passive:true});
  addEventListener('resize', mede);
  mede(); paleta();

  /* rajada: uma frente de aura que atravessa a tela inclinada */
  let raj = null, proxRaj = performance.now() + ac(5000, 9000);

  /* correnteza: campo de vento feito de senos que derivam no tempo (barato e sem costura) */
  const vento = (x, y, t) => {
    const a = Math.sin(x * .0023 + t * .07) + Math.sin(y * .0031 - t * .05) * .8 + Math.sin((x + y) * .0012 + t * .03) * .6;
    return [Math.cos(a * 1.4), Math.sin(a * 1.4) * .7 - .35];   // leve tendência a subir, como aura
  };

  let raf = 0, ant = performance.now(), ultPal = 0, vivo = true;
  function passo(agora){
    if(!vivo) return;
    raf = requestAnimationFrame(passo);
    if(document.hidden){ ant = agora; return; }
    const dt = Math.min(.05, (agora - ant) / 1000); ant = agora;
    const t = agora / 1000;
    if(agora - ultPal > 1000){ ultPal = agora; paleta(); }

    px += (mx - px) * Math.min(1, dt * 2.2); py += (my - py) * Math.min(1, dt * 2.2);
    const ox = op.mouse ? (px - W/2) / W : 0, oy = op.mouse ? (py - H/2) / H : 0;

    if(op.rajada && !raj && agora > proxRaj){ const dir = Math.random() < .5 ? 1 : -1; raj = {x:dir > 0 ? -300 : W + 300, dir, v:ac(380, 520), lg:ac(160, 260)}; }
    if(raj){ raj.x += raj.dir * raj.v * dt; if(raj.x < -400 || raj.x > W + 400){ raj = null; proxRaj = agora + ac(9000, 16000); } }
    for(const o of ondas) o.r += 520 * dt;
    while(ondas.length && ondas[0].r > Math.max(W, H)) ondas.shift();

    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = claro ? 'source-over' : 'lighter';
    const n = sp.length;
    for(const p of gs){
      const vel = 7 + 26 * p.z;                       // perto anda mais (paralaxe)
      const [wx, wy] = vento(p.x, p.y, t);
      let fx = wx * vel, fy = wy * vel;
      if(raj){
        /* frente inclinada: x + y*0.35 */
        const d = (p.x + p.y * .35 - raj.x) * raj.dir;
        if(d < 0 && d > -raj.lg){ const k = Math.sin(-d / raj.lg * Math.PI); fx += raj.dir * 120 * k * (.4 + p.z); fy -= 30 * k; p.luz = Math.max(p.luz, k); }
      }
      if(op.mouse && mVivo){
        const dx = p.x - mx, dy = p.y - my, d2 = dx*dx + dy*dy, R = 90 + 70 * p.z;
        if(d2 < R*R){ const d = Math.sqrt(d2) || 1, k = (1 - d / R); fx += dx / d * 160 * k; fy += dy / d * 160 * k; }
      }
      for(const o of ondas){
        const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1, e = Math.abs(d - o.r);
        if(e < 50){ const k = (1 - e / 50) * Math.max(0, 1 - o.r / 900); p.vx += dx / d * 260 * k * dt * 8; p.vy += dy / d * 260 * k * dt * 8; p.luz = Math.max(p.luz, k * .8); }
      }
      /* inércia: o grão segue a correnteza com atraso, e o empurrão da onda se desfaz */
      const amort = Math.min(1, dt * 1.6);
      p.vx += (fx - p.vx) * amort; p.vy += (fy - p.vy) * amort;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.luz = Math.max(0, p.luz - dt * .9);
      const M = 30;
      if(p.x < -M) p.x += W + 2*M; else if(p.x > W + M) p.x -= W + 2*M;
      if(p.y < -M) p.y += H + 2*M; else if(p.y > H + M) p.y -= H + 2*M;

      /* desenho */
      const perto = p.z > .78;
      const r = perto ? 5 + 8 * (p.z - .78) / .22 : 1.3 + 3 * p.z;
      /* pisca devagar e, de vez em quando, um grão acende de repente (o brilho do nen) */
      const pisca = .6 + .4 * Math.sin(t * p.tw + p.f), faisca = Math.max(0, Math.sin(t * p.tw * .37 + p.f * 3) - .96) * 25;
      let a = (perto ? .42 : .5 + .5 * p.z) * pisca + p.luz * .6 + faisca;
      if(claro) a *= .8;
      const k = op.cores === 'arco' ? Math.floor(((p.k * n) + t * .4) % n) : Math.floor(p.k * n);
      const s = sp[k][perto ? 1 : 0];
      const dx = -ox * 40 * p.z, dy = -oy * 26 * p.z, R = r * (perto ? 1 : 3) * (1 + p.luz * .5 + faisca * .5);
      g.globalAlpha = Math.min(1, a);
      g.drawImage(s, p.x + dx - R, p.y + dy - R, 2*R, 2*R);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  raf = requestAnimationFrame(passo);

  return {
    ajusta(o){ Object.assign(op, o); chave = ''; paleta(); ajustaN(); },
    para(){ vivo = false; cancelAnimationFrame(raf); cv.remove(); removeEventListener('pointermove', move); document.removeEventListener('pointerleave', sai);
      removeEventListener('pointerdown', clica); removeEventListener('resize', mede); },
  };
}
window.GB_POEIRA = {liga};
})();
