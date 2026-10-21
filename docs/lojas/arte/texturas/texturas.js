/* Ganbatte · texturas de fundo refeitas (#134): um gerador para as sete (o Céu da Arena fica para depois; a teia saiu).
 * Regra das novas: a textura mora nas bordas e nos cantos da tela, onde os cards não cobrem, com uma composição de verdade
 * (um canto, um horizonte, uma moldura) em vez de um padrão repetido e apagado.
 * Cada textura pinta o ::before e o ::after da tela (z-index -1, atrás de tudo): desenho em SVG usado como máscara de uma
 * cor do tema (var(--ink), var(--aura)...), então troca de paleta sem gerar nada de novo.
 * GB_TEXTURAS.css(id, S, P) → o CSS da textura id no seletor S, com position P ('fixed' no jogo, no body; 'absolute' na
 * vitrine, numa .tela de 1280×800). GB_TEXTURAS.LISTA = as fichas (nome, faixa, de quem, a ideia).
 * Aura do dia (tx-nen): o quanto ela contorna a tela sai de --dia (0 a 1, tarefas feitas / meta do dia) e --cheio (0 ou 1); a cor é
 * var(--nen-forte), a mesma da Borda de aura viva; --alto e --larg são o tamanho da tela (100vh e 100vw no jogo). Pulso: classe tx-pulso.
 * Sem dependências.
 */
(() => {
const rnd = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const f = n => Math.round(n * 10) / 10;
const uri = s => `url("data:image/svg+xml,${s.replace(/"/g, "'").replace(/[%#<>{}]/g, encodeURIComponent)}")`;
const svg = (w, h, corpo, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${extra}>${corpo}</svg>`;
const mix = (c, p) => `color-mix(in srgb,${c} ${p}%,transparent)`;
/* máscara de várias camadas: [[imagem, posição, tamanho, repetição, composição]] */
const mascara = cs => {
  const j = i => cs.map(c => c[i]).join(',');
  return `mask-image:${j(0)};mask-position:${j(1)};mask-size:${j(2)};mask-repeat:${j(3)};mask-composite:${cs.map(c => c[4] || 'add').join(',')}`;
};
const mexe = css => `@media (prefers-reduced-motion:no-preference){${css}}`;

/* ---------- Retícula de mangá: screentone em degradê num canto + linhas de foco na moldura ---------- */
function manga(){
  const r = rnd(7), W = 760, H = 560, a = 9, R = 700, nv = {};
  for(let u = -10; u < 140; u++) for(let v = -80; v < 80; v++){
    const x = (u - v) * a * .7071, y = H - (u + v) * a * .7071;   // a grade girada 45°, como a retícula de verdade
    if(x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
    const t = 1 - Math.hypot(x, H - y) / R + (r() - .5) * .05;
    if(t <= 0) continue;
    const q = Math.round(a * .64 * Math.pow(t, 1.35) * 4) / 4;
    if(q < .5) continue;
    nv[q] = (nv[q] || '') + `M${f(x)} ${f(y)}h0`;
  }
  const tom = svg(W, H, Object.entries(nv).map(([q, d]) => `<path d="${d}" stroke="#000" stroke-width="${q * 2}" stroke-linecap="round"/>`).join(''));
  /* linhas de foco (集中線): cunhas finas que saem da moldura e apontam para o meio, sem chegar nos cards */
  const cx = 640, cy = 400, foco = [];
  for(let k = 0; k < 210; k++){
    const th = (k + r() * .8) / 210 * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    const e = Math.min(Math.abs(cx / (c || 1e-6)), Math.abs(cy / (s || 1e-6)));   // até a borda da tela nessa direção
    if(r() < .22) continue;
    const ponta = e - (26 + Math.pow(r(), 1.7) * e * .3), w = (1.2 + r() * 4.5) / e / 2, L = e + 60;
    foco.push(`M${f(cx + c * ponta)} ${f(cy + s * ponta)}L${f(cx + Math.cos(th - w) * L)} ${f(cy + Math.sin(th - w) * L)}L${f(cx + Math.cos(th + w) * L)} ${f(cy + Math.sin(th + w) * L)}Z`);
  }
  const linhas = svg(1280, 800, `<path d="${foco.join('')}" fill="#000" fill-opacity=".75"/>`, 'preserveAspectRatio="none"');
  return S => `${S}::before{background:${mix('var(--ink)', 13)};${mascara([[uri(tom), 'left bottom', `${W}px ${H}px`, 'no-repeat'], [uri(linhas), 'center', '100% 100%', 'no-repeat']])}}
${S}::after{content:none}`;
}

/* ---------- Papel antigo: fibras e grão, manchas de umidade e a borda queimada ---------- */
function grao(){
  /* o grão (ruído fino) + fibras soltas, curtas e curvas, e pontinhos de sujeira, num ladrilho de 300 px */
  const r = rnd(23), fibras = [], pontos = [];
  for(let k = 0; k < 46; k++){
    const x = r() * 300, y = r() * 300, an = r() * Math.PI, L = 8 + r() * 30, c = (r() - .5) * 10;
    const x2 = x + Math.cos(an) * L, y2 = y + Math.sin(an) * L;
    fibras.push(`M${f(x)} ${f(y)}Q${f((x + x2) / 2 - Math.sin(an) * c)} ${f((y + y2) / 2 + Math.cos(an) * c)} ${f(x2)} ${f(y2)}`);
  }
  for(let k = 0; k < 14; k++) pontos.push(`<circle cx="${f(r() * 300)}" cy="${f(r() * 300)}" r="${f(.5 + r() * 1.3)}"/>`);
  const fibra = svg(300, 300, `<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2 0 0 0 -.98"/></filter>`
    + `<rect width="100%" height="100%" filter="url(#g)"/><path d="${fibras.join('')}" fill="none" stroke="#000" stroke-width=".7" stroke-opacity=".55" stroke-linecap="round"/><g fill-opacity=".7">${pontos.join('')}</g>`);
  /* recorte irregular (ruído largo): deixa a borda queimada e as manchas com contorno de papel de verdade */
  const roto = svg(500, 500, `<filter id="q" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="3" seed="5" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2.1 0 0 0 -.45"/></filter><rect width="100%" height="100%" filter="url(#q)"/>`);
  const manchas = [[8, 86, 300, 220], [94, 14, 260, 200], [90, 92, 220, 170], [4, 22, 180, 240]]   // manchas de umidade, sem contorno
    .map(([x, y, w, h]) => `radial-gradient(${w}px ${h}px at ${x}% ${y}%,${mix('var(--amb)', 11)},${mix('var(--amb)', 5)} 60%,transparent)`);
  const queimado = 'color-mix(in srgb,var(--amb) 34%,#1E0D03)';
  return S => `${S}::before{background:${mix('var(--ink)', 15)};${mascara([[uri(fibra), '0 0', '300px 300px', 'repeat']])}}
${S}::after{background:${manchas.join(',')},radial-gradient(ellipse 74% 70% at 50% 48%,transparent 56%,${mix('var(--amb)', 9)} 76%,color-mix(in srgb,${queimado} 34%,transparent) 93%,color-mix(in srgb,${queimado} 62%,transparent));${mascara([[uri(roto), '0 0', '500px 500px', 'repeat']])}}`;
}

/* ---------- Tela do Joystation: tubo de TV com moldura, linhas, RGB e a faixa que rola ---------- */
function scan(){
  return S => `${S}::before{background:
  linear-gradient(180deg,transparent,${mix('var(--ink)', 5)} 50%,transparent) 0 -40%/100% 24% no-repeat,
  repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 1px,transparent 1px 3px),
  repeating-linear-gradient(90deg,rgba(255,40,90,.04) 0 1px,rgba(40,255,150,.04) 1px 2px,rgba(60,130,255,.04) 2px 3px),
  radial-gradient(ellipse 70% 62% at 50% 45%,${mix('var(--prompt)', 7)},transparent 75%)}
${S}::after{inset:7px;border-radius:44px/36px;box-shadow:0 0 0 80px color-mix(in srgb,var(--bg) 30%,#000),0 0 0 81px ${mix('var(--ink)', 8)},inset 0 0 120px 16px rgba(0,0,0,.55),inset 0 0 0 1.5px ${mix('var(--ink)', 12)}}
${mexe(`${S}::before{animation:txRola 9s linear infinite}`)}
@keyframes txRola{from{background-position:0 -40%,0 0,0 0,0 0}to{background-position:0 140%,0 0,0 0,0 0}}`;
}

/* ---------- Ninho das Quimeras: favos irregulares saindo do canto, com ovos que pulsam ---------- */
function hex(){
  const r = rnd(11), W = 900, H = 660, R = 30, dx = R * Math.sqrt(3), dy = R * 1.5, J = new Map(), nv = {}, cera = [], ovos = [];
  const jit = (x, y) => { const k = Math.round(x) + ',' + Math.round(y); if(!J.has(k)) J.set(k, [x + (r() - .5) * R * .38, y + (r() - .5) * R * .38]); return J.get(k); };
  for(let j = 0; j * dy < H + R; j++) for(let i = 0; i * dx < W + R; i++){
    const cx = W - (i * dx + (j % 2) * dx / 2), cy = H - j * dy, d = Math.hypot(W - cx, H - cy), lim = 700 + (r() - .5) * 170;
    if(d > lim) continue;
    const t = 1 - d / lim, p = [];
    for(let k = 0; k < 6; k++){ const an = Math.PI / 6 + k * Math.PI / 3; p.push(jit(cx + R * Math.cos(an), cy + R * Math.sin(an))); }
    const caminho = 'M' + p.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
    const q = Math.round((.7 + 4.6 * Math.pow(t, 1.6)) * 2) / 2;
    nv[q] = (nv[q] || '') + caminho;
    if(t > .5) cera.push(caminho);   // perto do canto os favos estão cheios de resina
    if(t > .42 && ovos.length < 8 && r() < .17) ovos.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(R * .46)}" ry="${f(R * .6)}" transform="rotate(${f(r() * 180)} ${f(cx)} ${f(cy)})" fill="url(#o)"/>`);
  }
  const favos = svg(W, H, `<path d="${cera.join('')}" fill="#000" fill-opacity=".18"/>` + Object.entries(nv).map(([q, d]) => `<path d="${d}" fill="none" stroke="#000" stroke-width="${q}" stroke-linejoin="round"/>`).join(''));
  const ninho = svg(W, H, `<defs><radialGradient id="o" cx=".42" cy=".38" r=".65"><stop offset="0" stop-opacity="1"/><stop offset=".55" stop-opacity=".55"/><stop offset="1" stop-opacity=".12"/></radialGradient></defs>${ovos.join('')}`);
  return S => `${S}::before{background:${mix('var(--ink)', 15)};${mascara([[uri(favos), 'right bottom', `${W}px ${H}px`, 'no-repeat']])}}
${S}::after{background:${mix('var(--aura)', 46)};${mascara([[uri(ninho), 'right bottom', `${W}px ${H}px`, 'no-repeat']])}}
${mexe(`${S}::after{animation:txOvo 4.8s ease-in-out infinite}`)}
@keyframes txOvo{0%,100%{opacity:1}50%{opacity:.55}}`;
}

/* ---------- Verso de carta: a tela é o verso de uma carta do Hisoka (treliça com naipes, cantos e filete duplo) ---------- */
const NAIPE = {   // os traços do cursor da carta (web/arte.js), em -.5..+.5
  espadas: 'M0 -.48 C.1 -.33 .5 -.12 .5 .1 C.5 .32 .2 .38 .05 .22 Q.07 .42 .2 .5 L-.2 .5 Q-.07 .42 -.05 .22 C-.2 .38 -.5 .32 -.5 .1 C-.5 -.12 -.1 -.33 0 -.48 Z',
  copas: 'M0 .42 C-.1 .3 -.5 .06 -.5 -.16 C-.5 -.43 -.16 -.5 0 -.26 C.16 -.5 .5 -.43 .5 -.16 C.5 .06 .1 .3 0 .42 Z',
  ouros: 'M0 -.5 Q.14 -.17 .38 0 Q.14 .17 0 .5 Q-.14 .17 -.38 0 Q-.14 -.17 0 -.5 Z',
  paus: 'M.21 -.25 A.21 .21 0 1 0 -.21 -.25 A.21 .21 0 1 0 .21 -.25 Z M-.04 .05 A.21 .21 0 1 0 -.46 .05 A.21 .21 0 1 0 -.04 .05 Z M.46 .05 A.21 .21 0 1 0 .04 .05 A.21 .21 0 1 0 .46 .05 Z M-.06 0 Q-.06 .4 -.2 .5 L.2 .5 Q.06 .4 .06 0 Z',
};
const naipe = (n, x, y, s, extra = '') => `<path d="${NAIPE[n]}" transform="translate(${x} ${y}) scale(${s})" ${extra}/>`;
function cartas(){
  const T = 84, h = T / 2, ns = ['espadas', 'copas', 'ouros', 'paus'];
  let corpo = '';
  for(let k = 0; k < 4; k++){
    const ox = (k % 2) * T, oy = Math.floor(k / 2) * T;
    corpo += `<path d="M${ox + h} ${oy + 2}L${ox + T - 2} ${oy + h}L${ox + h} ${oy + T - 2}L${ox + 2} ${oy + h}Z" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.2"/>`
      + `<path d="M${ox + h} ${oy + 11}L${ox + T - 11} ${oy + h}L${ox + h} ${oy + T - 11}L${ox + 11} ${oy + h}Z" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>`
      + naipe(ns[k], ox + h, oy + h, 17, 'fill="#000" fill-opacity=".7"')
      + `<circle cx="${ox}" cy="${oy}" r="2" fill-opacity=".6"/>`;
  }
  const trelica = svg(T * 2, T * 2, corpo);
  const canto = (n, gira) => svg(170, 170, `<g transform="${gira}">` + naipe(n, 52, 52, 34)
    + `<path d="M18 112A94 94 0 0 1 112 18M18 126A108 108 0 0 1 126 18" fill="none" stroke="#000" stroke-width="1.4"/>`
    + `<circle cx="28" cy="134" r="2.4"/><circle cx="134" cy="28" r="2.4"/>${naipe('ouros', 92, 92, 11, 'fill-opacity=".8"')}</g>`);
  const quina = [['espadas', ''], ['copas', 'translate(170 0) scale(-1 1)'], ['paus', 'translate(0 170) scale(1 -1)'], ['ouros', 'translate(170 170) scale(-1 -1)']];
  const pos = ['left 20px top 20px', 'right 20px top 20px', 'left 20px bottom 20px', 'right 20px bottom 20px'];
  return S => `${S}::before{background:${mix('var(--volt)', 16)};${mascara([
    ...quina.map(([n, g], i) => [uri(canto(n, g)), pos[i], '170px 170px', 'no-repeat']),
    [uri(trelica), 'center', `${T * 2}px ${T * 2}px`, 'repeat', 'intersect'],
    ['radial-gradient(ellipse 72% 68% at 50% 50%,transparent 38%,#000 92%)', '0 0', '100% 100%', 'no-repeat']])}}
${S}::after{inset:12px;border-radius:18px;border:1.5px solid ${mix('var(--volt)', 32)};outline:1px solid ${mix('var(--aura)', 22)};outline-offset:-8px}`;
}

/* ---------- Ringue da Arena: o piso em perspectiva no pé da tela, com a borda do ringue ---------- */
function arena(){
  const W = 1280, H = 380, vx = 640, s = 250, lin = [], ringue = [];
  const P = (X, z) => [vx + X * s / z, H / z];
  for(let X = -9; X <= 9; X++){ const [x1, y1] = P(X, 1), [x2, y2] = P(X, 40); lin.push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`); }
  for(let z = 1; z < 30; z += .5){ const y = H / z; lin.push(`M0 ${f(y)}H${W}`); }
  const borda = (X0, X1, z0, z1) => { const a = P(X0, z0), b = P(X1, z0), c = P(X1, z1), d = P(X0, z1); return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(c[0])} ${f(c[1])}L${f(d[0])} ${f(d[1])}Z`; };
  ringue.push(borda(-2.6, 2.6, 1.25, 9), borda(-2.45, 2.45, 1.32, 8.6));
  const piso = svg(W, H, `<path d="${lin.join('')}" fill="none" stroke="#000" stroke-width="1.1"/>`, 'preserveAspectRatio="xMidYMax slice"');
  const ring = svg(W, H, `<path d="${ringue[0]}" fill="none" stroke="#000" stroke-width="2.6"/><path d="${ringue[1]}" fill="none" stroke="#000" stroke-width="1" stroke-opacity=".7"/>`, 'preserveAspectRatio="xMidYMax slice"');
  const some = 'linear-gradient(to bottom,transparent 54%,#000 86%)';
  return S => `${S}::before{background:${mix('var(--ink)', 12)};${mascara([[uri(piso), 'center bottom', '100% 48%', 'no-repeat', 'intersect'], [some, '0 0', '100% 100%', 'no-repeat']])}}
${S}::after{background:${mix('var(--amb)', 34)};${mascara([[uri(ring), 'center bottom', '100% 48%', 'no-repeat', 'intersect'], [some, '0 0', '100% 100%', 'no-repeat']])}}`;
}

/* ---------- Aura do dia (épico): a aura do seu tipo contorna a tela e avança a cada tarefa do dia ----------
   Começa como brasa nos dois cantos de baixo, sobe pelas laterais e corre pelo alto até as duas pontas se encontrarem no
   meio quando a meta fecha. O caminho de cada lado tem altura + meia largura; --dia (0 a 1) diz quanto dele está aceso.
   Cada ponta tem um foco mais forte, que é onde o olho acha o progresso; a faixa é fina e só pega a beirada. */
function nen(){
  /* fiapos: manchas desfocadas num ladrilho (com as cópias nas bordas, para emendar), que sobem devagar dentro da faixa */
  const r = rnd(41), TW = 120, TH = 260;
  let b = '';
  for(let k = 0; k < 14; k++){
    const x = r() * TW, y = r() * TH, rx = 8 + r() * 16, ry = 24 + r() * 40;
    for(const ox of [-TW, 0, TW]) for(const oy of [-TH, 0, TH]) b += `<ellipse cx="${f(x + ox)}" cy="${f(y + oy)}" rx="${f(rx)}" ry="${f(ry)}"/>`;
  }
  const fiapos = svg(TW, TH, `<filter id="d" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter><rect width="${TW}" height="${TH}" fill-opacity=".45"/><g filter="url(#d)">${b}</g>`);
  const N = 'var(--nen-forte,var(--aura))', A = 'var(--alto,100vh)', L = 'var(--larg,100vw)', s = 'var(--tx-s)';
  const lado = `min(${s},${A})`, topo = `clamp(0px,${s} - ${A},${L} / 2)`;
  const pLado = `clamp(0px,(${A} - ${s}) * 100,130px)`, pTopo = `clamp(0px,(${s} - ${A}) * 100,130px)`;   // o foco da ponta: um ou outro
  const faixa = d => `linear-gradient(${d},${mix(N, 28)},${mix(N, 9)} 45%,transparent)`;
  const ponta = `radial-gradient(closest-side,${mix(N, 42)},${mix(N, 12)} 55%,transparent)`;
  const vai = 'background-size 1.8s cubic-bezier(.2,.8,.2,1),background-position 1.8s cubic-bezier(.2,.8,.2,1)';
  return S => `${S}{--tx-s:calc(var(--dia,0) * (${A} + ${L} / 2))}
${S}::before{background:
  ${faixa('to right')} left bottom/40px ${lado} no-repeat,
  ${faixa('to left')} right bottom/40px ${lado} no-repeat,
  ${faixa('to bottom')} left top/${topo} 40px no-repeat,
  ${faixa('to bottom')} right top/${topo} 40px no-repeat,
  linear-gradient(to top,${mix(N, 10)},transparent) left bottom/100% 22px no-repeat;
  transition:${vai};${mascara([[uri(fiapos), '0 0', `${TW}px ${TH}px`, 'repeat']])}}
${S}::after{background:
  ${ponta} left -65px bottom calc(${lado} - 65px)/${pLado} ${pLado} no-repeat,
  ${ponta} right -65px bottom calc(${lado} - 65px)/${pLado} ${pLado} no-repeat,
  ${ponta} left calc(${topo} - 65px) top -65px/${pTopo} ${pTopo} no-repeat,
  ${ponta} right calc(${topo} - 65px) top -65px/${pTopo} ${pTopo} no-repeat,
  radial-gradient(closest-side,${mix(N, 30)},transparent) center top -70px/calc(var(--cheio,0) * 560px) 170px no-repeat;
  transition:${vai}}
${mexe(`${S}::before{animation:txFiapos 14s linear infinite}${S}::after{animation:txRespira 5s ease-in-out infinite}
${S}.tx-pulso::before{animation:txFiapos 14s linear infinite,txPulso 1.4s ease-out}${S}.tx-pulso::after{animation:txRespira 5s ease-in-out infinite,txPulso 1.4s ease-out}`)}
@keyframes txFiapos{to{mask-position:0 -${TH}px}}
@keyframes txRespira{0%,100%{opacity:.75}50%{opacity:1}}
@keyframes txPulso{0%{filter:none}15%{filter:brightness(2.4) saturate(1.3)}100%{filter:none}}`;
}

const GERA = {manga, grao, scan, hex, cartas, arena, nen}, FEITO = {};
const LISTA = [
  {id:'tx-manga', bg:'manga', n:'Retícula de mangá', fa:'raro', quem:'', pacote:'', d:'Retícula de verdade: os pontos crescem num degradê até o canto de baixo, como screentone colado à mão, e as linhas de foco saem da moldura e apontam para o meio da tela.'},
  {id:'tx-grao', bg:'grao', n:'Papel antigo', fa:'comum', quem:'', pacote:'pergaminho', d:'Papel com fibras e grão, manchas de umidade perto das bordas e a beirada da tela queimada. Feita para o Pergaminho.'},
  {id:'tx-scan', bg:'scan', n:'Tela do Joystation', fa:'raro', quem:'Greed Island', pacote:'greed', d:'A tela vira o tubo do console: cantos curvos com a moldura em volta, linhas, o RGB separado e uma faixa de luz que rola devagar.'},
  {id:'tx-hex', bg:'hex', n:'Ninho das Quimeras', fa:'raro', quem:'Formigas Quimera', pacote:'meruem', d:'Favos irregulares saindo do canto de baixo, cheios de resina perto do canto e sumindo pela tela, com ovos que pulsam devagar.'},
  {id:'tx-cartas', bg:'cartas', n:'Verso de carta', fa:'raro', quem:'Hisoka', pacote:'hisoka', d:'A tela é o verso de uma carta: treliça com os naipes do cursor da carta, sumindo para o meio, naipes nos cantos e o filete duplo. Só no pacote Hisoka.'},
  {id:'tx-arena', bg:'arena', n:'Ringue da Arena', fa:'raro', quem:'Arena Celestial', pacote:'', d:'O piso do ringue em perspectiva no pé da tela, com a borda do ringue em dourado e as linhas sumindo no horizonte.'},
  {id:'tx-nen', bg:'nen', n:'Aura do dia', fa:'epico', quem:'Nen', pacote:'meruem', d:'A aura do seu tipo de Nen contorna a tela e avança a cada tarefa: de manhã é brasa nos cantos de baixo, sobe pelas laterais e corre pelo alto até as duas pontas se encontrarem quando a meta do dia fecha. Cada tarefa dá um pulso.'},
];
window.GB_TEXTURAS = {
  LISTA,
  css(id, S, P = 'fixed'){
    const bg = id.replace(/^tx-/, '');
    if(!FEITO[bg]) FEITO[bg] = GERA[bg]();
    return `${S}::before,${S}::after{content:"";position:${P};inset:0;pointer-events:none;z-index:-1}\n` + FEITO[bg](S);
  },
};
})();
