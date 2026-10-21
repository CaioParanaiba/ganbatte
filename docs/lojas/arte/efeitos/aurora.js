/* fx-ascensao, Ascensão (exclusivo do Pacote Ascensão, #134): cortinas de aurora boreal penduradas no alto da tela.
   A de hoje é um borrão de cores girando atrás de tudo, que lia como mais uma nuvem de aura de fundo (a Aura ambiente
   já é isso, e a Poeira de Nen também mora no fundo). Esta tem forma própria: três cortinas de raios verticais, com a
   barra de baixo acesa e os raios sumindo para cima, que dobram e ondulam devagar; os raios cintilam, e de tempos em
   tempos uma onda de luz corre a cortina de um lado ao outro (o "surto" da aurora de verdade). As cores andam pela
   paleta (verde, volt, aura, rosa), então na Aurora é a aurora clássica e em outra paleta muda junto.
   Leve: desenha numa tela de 1/3 do tamanho (o navegador amplia e já borra), cada raio é um sprite de gradiente pronto,
   30 quadros por segundo e parada com a aba escondida.

   GB_AURORA.liga(op) -> {ajusta(op), para()}
     op.forte   intensidade (padrão 1)
     op.altura  quanto da tela ela desce, 0..1 (padrão .5)
     op.surto   a onda de luz de tempos em tempos (padrão true)
     op.mouse   a cortina acende um pouco onde o mouse está (padrão true)
     op.forca   liga mesmo com prefers-reduced-motion */
(function(){
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const varCss = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
const tinta = document.createElement('canvas').getContext('2d');
function rgb(c){
  tinta.fillStyle = '#000'; tinta.fillStyle = c || '#000'; const v = tinta.fillStyle;
  if(v[0] === '#') return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
  const m = v.match(/[\d.]+/g) || [0, 0, 0]; return m.slice(0, 3).map(Number);
}
const mistura = (a, b, q) => a.map((v, i) => Math.round(v + (b[i] - v) * q));
const ESC = 3, TONS = 32, FPS = 30;

/* o raio: aceso embaixo (a barra da cortina), some para cima; um tiquinho de luz abaixo da barra */
function sprite([r, g, b]){
  const c = document.createElement('canvas'); c.width = 1; c.height = 128;
  const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 128), cor = a => `rgba(${r},${g},${b},${a})`;
  gr.addColorStop(0, cor(0)); gr.addColorStop(.45, cor(.18)); gr.addColorStop(.8, cor(.55)); gr.addColorStop(.9, cor(1));
  gr.addColorStop(.94, `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},.9)`); gr.addColorStop(1, cor(0));
  x.fillStyle = gr; x.fillRect(0, 0, 1, 128); return c;
}

function liga(op0){
  let op = Object.assign({forte:1, altura:.5, surto:true, mouse:true, forca:false}, op0);
  if(calmo() && !op.forca) return {ajusta(){}, para(){}};
  const cv = document.createElement('canvas');
  cv.className = 'gb-aurora';
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:0;filter:blur(3px)';
  document.body.prepend(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0;
  const mede = () => { W = Math.ceil(innerWidth / ESC); H = Math.ceil(innerHeight / ESC); cv.width = W; cv.height = H; };
  mede(); addEventListener('resize', mede);

  /* as cores: os tons ao longo da paleta, relidos a cada segundo; os sprites só refazem quando a paleta muda */
  let chave = '', sp = [], claro = false;
  function paleta(){
    const cs = ['grn', 'volt', 'aura', 'red'].map(varCss), k = cs.join() + varCss('bg');
    if(k === chave) return; chave = k;
    const bg = rgb(varCss('bg') || '#13141B'); claro = (.2126*bg[0] + .7152*bg[1] + .0722*bg[2]) / 255 > .55;
    const pts = cs.map(rgb); sp = [];
    for(let i = 0; i < TONS; i++){ const q = i / (TONS - 1) * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(q)); sp.push(sprite(mistura(pts[j], pts[j + 1], q - j))); }
  }
  paleta(); const relê = setInterval(paleta, 1000);

  /* três cortinas: onde fica a barra (fração da altura), quanto dobra, a altura dos raios, a velocidade e o tom inicial */
  const CORT = [
    {y:.20, a1:.05, k1:.011, s1:.10, a2:.025, k2:.031, s2:.17, h:.26, tom:0,   fase:0},
    {y:.31, a1:.06, k1:.008, s1:.07, a2:.03,  k2:.024, s2:.13, h:.34, tom:.35, fase:2.1},
    {y:.42, a1:.04, k1:.014, s1:.12, a2:.02,  k2:.040, s2:.21, h:.22, tom:.7,  fase:4.4},
  ];
  let mx = -1, surto = {x:-1, v:0, t:0}, prox = 4000 + Math.random() * 5000;
  const mexe = e => { mx = e.clientX / ESC; };
  addEventListener('pointermove', mexe, {passive:true});

  let raf = 0, ult = 0, t = 0, vivo = true;
  function quadro(now){
    if(!vivo) return;
    raf = requestAnimationFrame(quadro);
    if(document.hidden || now - ult < 1000 / FPS - 2) return;
    const dt = Math.min(.1, (now - (ult || now)) / 1000); ult = now; t += dt;
    if(op.surto){ prox -= dt * 1000;
      if(prox <= 0 && surto.v <= 0){ const dir = Math.random() < .5 ? 1 : -1; surto = {x: dir > 0 ? -40 : W + 40, dir, v: 1, c: Math.floor(Math.random() * 3)}; prox = 7000 + Math.random() * 7000; }
      if(surto.v > 0){ surto.x += surto.dir * W * .28 * dt; if(surto.x < -60 || surto.x > W + 60) surto.v = 0; } }
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = claro ? 'source-over' : 'lighter';
    const base = op.forte * (claro ? .4 : .72), alt = H * op.altura / .5;
    CORT.forEach((c, ci) => {
      for(let x = 0; x < W; x++){
        const X = x * ESC;   // as ondas em px de tela, para a forma não mudar com o tamanho da janela
        const y = H * (c.y + c.a1 * Math.sin(X * c.k1 * .33 + t * c.s1 + c.fase) + c.a2 * Math.sin(X * c.k2 * .33 - t * c.s2)) * op.altura / .5;
        const h = alt * c.h * (.65 + .35 * Math.sin(X * .004 + t * .23 + c.fase));
        /* o brilho do raio: dobras largas + cintilar fino + um envelope que deixa trechos quase apagados */
        let b = (.5 + .5 * Math.sin(X * .021 + t * .6 + c.fase)) * (.55 + .45 * Math.sin(X * .0067 - t * .31 + ci))
          + .1 * Math.sin(X * .07 + t * 1.6 + ci * 1.7) + .05 * Math.sin(X * .23 - t * 2.4);
        b *= .35 + .65 * Math.max(0, Math.sin(X * .0021 + t * .05 + c.fase * 1.3) * .5 + .6);
        if(surto.v > 0 && surto.c === ci){ const d = (x - surto.x) / 26; b += 1.1 * Math.exp(-d * d); }
        if(op.mouse && mx >= 0){ const d = (x - mx) / 40; b += .35 * Math.exp(-d * d); }
        if(b <= .04) continue;
        const tom = ((X * .00035 + c.tom + t * .012) % 1 + 1) % 1, i = Math.floor((tom < .5 ? tom * 2 : 2 - tom * 2) * (TONS - 1));
        g.globalAlpha = Math.min(1, b * base);
        g.drawImage(sp[i], x, y - h, 1, h * 1.08);
        g.globalAlpha = Math.min(1, b * base * .7); g.drawImage(sp[i], x, y - h * .22, 1, h * .25);   // a barra de baixo, mais acesa
      }
    });
    g.globalAlpha = 1;
  }
  raf = requestAnimationFrame(quadro);
  return {
    ajusta(o){ op = Object.assign(op, o); chave = ''; paleta(); },
    para(){ vivo = false; cancelAnimationFrame(raf); clearInterval(relê); removeEventListener('resize', mede); removeEventListener('pointermove', mexe); cv.remove(); },
  };
}
window.GB_AURORA = {liga};
})();
