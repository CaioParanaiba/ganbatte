// HP de cristal (hp-cristal, raro): a vida do chefão vira uma fileira de cristais lapidados, em CSS, sem imagem para fatiar.
// Não é tema do anime: é o cristal de RPG, chapado como o resto do jogo (facetas de cor dura, sem degradê nem brilho borrado).
//   a vida que resta    cristais de três tamanhos que se repetem, cada um com 3 tons de faceta (de cima clara, a mesa no meio,
//                       de baixo escura) e um traço de luz na mesa; a ponta da vida é uma fratura em zigue-zague, não um
//                       corte reto no meio do cristal
//   a vida perdida      os engastes vazios: o contorno dos cristais que já quebraram, gravado no trilho
//   mouse em cima       um reflexo passa uma vez pelas facetas de cima (é o único movimento parado; raro não se mexe sozinho)
//   golpe               CURSORES.cristal.estilhaca(b, de, para): os cristais do trecho perdido estouram em lascas que caem com
//                       peso e giram (o jogo chama quando a vida do chefão desce)
// Cores (cor): 0 gelo (o padrão), 1 rubi na cor da vida do jogo (a --red da paleta), 2 ametista.
//   CURSORES.cristal.css('.hp-cristal', cor)   o CSS com o seletor dado (a barra, a lista de chefões e a prévia da vitrine
//                                              dentro dele); no jogo: ':root[data-hp="cristal"]'
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const H = 12;   // altura do desenho; a largura de cada cristal sai da lista abaixo
const LARG = [26, 17, 22];   // os três cristais do ladrilho, em unidades da altura 12
const W = LARG.reduce((a, b) => a + b, 0);
const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const P = (...xy) => xy.map((v, k) => (k % 2 ? '' : ' ') + v.toFixed(2)).join(' ').trim();

// um cristal de x0 a x0 + w: hexágono alongado com as pontas no meio da altura; f = folga entre um e outro (o trilho
// aparece no vão, e é isso que separa os cristais, sem contorno desenhado)
function cristal(x0, w, f = .55){
  const a = x0 + f, b = x0 + w - f, t = 1.1, d = H - 1.1, m = H / 2, bis = Math.min(3, w * .16);
  const L = a + bis, R = b - bis, il = a + bis * 2.1, ir = b - bis * 2.1, mt = 4.5, mb = 7.5;
  return {
    corpo: `M${P(a, m)} L${P(L, t)} L${P(R, t)} L${P(b, m)} L${P(R, d)} L${P(L, d)} Z`,
    // facetas claras: a de cima, o chanfro de cima à esquerda e o traço de luz na mesa
    claro: `M${P(L, t)} L${P(R, t)} L${P(ir, mt)} L${P(il, mt)} Z M${P(a, m)} L${P(L, t)} L${P(il, mt)} L${P(il, m)} Z `
      + `M${P(il + 1.4, mt + .7)} L${P(il + 1.4 + w * .14, mt + .7)} L${P(il + .9 + w * .1, mb - .7)} L${P(il + .9 - w * .04, mb - .7)} Z`,
    // facetas escuras: a de baixo e o chanfro de baixo à direita
    escuro: `M${P(il, mb)} L${P(ir, mb)} L${P(R, d)} L${P(L, d)} Z M${P(b, m)} L${P(R, d)} L${P(ir, mb)} L${P(ir, m)} Z`,
  };
}
const PEDRAS = (() => { let x = 0; return LARG.map(w => { const c = cristal(x, w); x += w; return c; }); })();
const svg = (d, extra = '') => uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="${d}" ${extra}/></svg>`);
const CORPO = svg(PEDRAS.map(p => p.corpo).join(' '));
const CLARO = svg(PEDRAS.map(p => p.claro).join(' '));
const ESCURO = svg(PEDRAS.map(p => p.escuro).join(' '));
// os engastes vazios: o contorno de cada cristal, num cinza que lê no claro e no escuro
const ENGASTE = uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="${PEDRAS.map(p => p.corpo).join(' ')}" `
  + `fill="rgba(128,138,165,.10)" stroke="rgba(128,138,165,.55)" stroke-width=".7" stroke-linejoin="round"/></svg>`);
// a fratura na ponta da vida: só a coluna da esquerda é cheia, a direita é o zigue-zague (largura = metade da altura)
const FRATURA = uri(`<svg xmlns="http://www.w3.org/2000/svg" width="6" height="12" viewBox="0 0 6 12"><path d="M0 0 L3.6 0 L1.9 2.8 L5.4 5.1 L2.2 7.6 L4.2 10.2 L2.6 12 L0 12 Z"/></svg>`);

// as cores: --cr0 as facetas claras, --cr1 a mesa, --cr2 as facetas escuras, --cr3 o reflexo
const COR = [
  '--cr0:#DDF4FF;--cr1:#7CC6F2;--cr2:#2F6EA8;--cr3:#fff',
  '--cr0:color-mix(in srgb,var(--red) 38%,#fff);--cr1:var(--red);--cr2:color-mix(in srgb,var(--red) 55%,#1a0508);--cr3:#fff',
  '--cr0:#E6D6FF;--cr1:#A47BEA;--cr2:#58339A;--cr3:#fff',
];
function css(raiz, cor = 0){
  const trilho = `${raiz} :is(.hp4,.l-boss .hp,.hp7 > i)`, vida = `${raiz} :is(.hp4 > b,.l-boss .hp i,.hp7 > i > b)`;
  const tile = `0 0/auto 100% repeat-x`;
  return `
${raiz}{${COR[cor] || COR[0]}}
${trilho}{background:${ENGASTE} ${tile},var(--track);border-radius:2px}
${vida}{background:var(--cr1);border-radius:0;box-shadow:none;
  -webkit-mask:${CORPO} ${tile},linear-gradient(#000 0 0) 0 0/calc(100% - 3px) 100% no-repeat,${FRATURA} right 0 top 0/auto 100% no-repeat;
  -webkit-mask-composite:source-in,source-over;
  mask:${CORPO} ${tile},linear-gradient(#000 0 0) 0 0/calc(100% - 3px) 100% no-repeat,${FRATURA} right 0 top 0/auto 100% no-repeat;
  mask-composite:intersect,add}
${raiz} :is(.l-boss .hp i,.hp7 > i > b){position:relative}
${vida}::before,${vida}::after{content:"";position:absolute;inset:0;pointer-events:none}
${vida}::before{background:linear-gradient(105deg,var(--cr0) 0 44%,var(--cr3) 44% 50%,var(--cr0) 50%) 100% 0/300% 100% no-repeat;
  -webkit-mask:${CLARO} ${tile};mask:${CLARO} ${tile}}
${vida}::after{background:var(--cr2);-webkit-mask:${ESCURO} ${tile};mask:${ESCURO} ${tile}}
@media (prefers-reduced-motion:no-preference){
  ${raiz} :is(.hp4:hover > b,.l-boss:hover .hp i,.hp7:hover > i > b)::before{animation:crReflexo .7s steps(9) both}
}
@keyframes crReflexo{from{background-position:100% 0}to{background-position:0 0}}`;
}

// ---- o golpe: os cristais do trecho perdido estouram em lascas (de e para em %, a vida antes e depois)
const LASCA = ['polygon(50% 0,100% 60%,30% 100%)', 'polygon(0 20%,100% 0,70% 100%)', 'polygon(20% 0,100% 40%,60% 100%,0 70%)', 'polygon(0 0,100% 50%,0 100%)'];
function estilhaca(b, de, para){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches || !(de > para)) return;
  const trilho = b.parentElement.getBoundingClientRect(), h = trilho.height, cs = getComputedStyle(b);
  const cores = ['--cr0', '--cr1', '--cr2', '--cr1'].map(v => cs.getPropertyValue(v).trim() || '#7CC6F2');
  const x0 = trilho.left + trilho.width * para / 100, x1 = trilho.left + trilho.width * de / 100;
  const camada = document.createElement('div');
  camada.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.append(camada);
  const n = Math.max(6, Math.min(28, Math.round((x1 - x0) / h * 3))), lascas = [];
  for(let k = 0; k < n; k++){
    const s = h * (.35 + Math.random() * .55), e = document.createElement('i');
    e.style.cssText = `position:absolute;left:0;top:0;width:${s}px;height:${s * (.7 + Math.random() * .6)}px;background:${cores[k % 4]};clip-path:${LASCA[k % 4]}`;
    camada.append(e);
    lascas.push({e, x: x0 + Math.random() * (x1 - x0), y: trilho.top + Math.random() * h, vx: (Math.random() - .3) * 160, vy: -(60 + Math.random() * 170),
      r: Math.random() * 360, vr: (Math.random() - .5) * 900, v: .55 + Math.random() * .45, t: 0});
  }
  // um clarão curto no lugar do trecho que quebrou
  const fl = document.createElement('i');
  fl.style.cssText = `position:absolute;left:${x0}px;top:${trilho.top}px;width:${Math.max(4, x1 - x0)}px;height:${h}px;background:${cores[0]}`;
  camada.append(fl);
  fl.animate([{opacity: .9}, {opacity: 0}], {duration: 220, fill: 'forwards'});
  let antes = performance.now();
  (function passo(agora){
    const dt = Math.min(.033, (agora - antes) / 1000); antes = agora;
    let vivas = 0;
    for(const l of lascas){
      l.t += dt; if(l.t > l.v){ l.e.style.opacity = 0; continue; } vivas++;
      l.vy += 900 * dt; l.vx *= Math.exp(-1.5 * dt); l.x += l.vx * dt; l.y += l.vy * dt; l.r += l.vr * dt;
      l.e.style.transform = `translate(${l.x}px,${l.y}px) rotate(${l.r}deg)`;
      l.e.style.opacity = Math.min(1, (l.v - l.t) / .2);
    }
    if(vivas) requestAnimationFrame(passo); else camada.remove();
  })(antes);
}

// ---- a bancada: o card do chefão (barra de 12 px), a lista de chefões (7 px) e a prévia da vitrine
const BASE = `
.crc{--ink:#E6E8EE;--soft:#A9AFC2;--track:#262A37;--hair:#3D4254;--red:#F7768E;--grn:#9ECE6A;background:#14161E;color:var(--ink);border-radius:10px;padding:16px;display:grid;gap:16px;width:min(460px,100%)}
.crc.cl{--ink:#1D2030;--soft:#5A6075;--track:#E3E5EC;--hair:#BFC4D2;--red:#D2344F;--grn:#4E8A2E;background:#F4F5F9}
.crc .nm{font:600 12px var(--f-mono);display:flex;justify-content:space-between;margin-bottom:6px;color:var(--soft)}
.crc .hp4{position:relative;height:12px;border-radius:4px;background:var(--track)}
.crc .hp4 > b{position:absolute;inset:0 auto 0 0;border-radius:4px;background:var(--red);transition:width .4s}
.crc .l-boss{display:grid;gap:5px;font:12px var(--f-mono);color:var(--soft);cursor:default}
.crc .l-boss .hp{display:block;height:7px;border-radius:99px;background:var(--track);overflow:hidden} .crc .l-boss .hp i{display:block;height:100%;background:var(--red);transition:width .4s}
.crc .hp7{display:grid;gap:6px;font:600 11px var(--f-mono);color:var(--soft)} .crc .hp7 > i{display:block;height:12px;border-radius:4px;background:var(--track);overflow:hidden}
.crc .hp7 > i > b{display:block;height:100%;background:var(--red)}
.crc .bts{display:flex;gap:8px;flex-wrap:wrap}
.crc .bt{font:600 12px var(--f-mono);padding:6px 12px;border-radius:6px;border:1px solid var(--hair);background:var(--track);color:var(--ink);cursor:pointer}`;
const NOMES = ['gelo', 'rubi (cor da vida)', 'ametista'];
function painel(claro, com, cor, id){
  const c = com ? 'hp-cristal' : '';
  return `<div class="crc ${claro ? 'cl' : ''} ${c}" ${id ? `id="${id}"` : ''} data-cor="${cor}">
    <div><div class="nm"><span>Chrollo · chefão da semana</span><span class="pct">62%</span></div><div class="hp4"><b style="width:62%"></b></div></div>
    <div class="l-boss"><span>lista de chefões (7 px)</span><span class="hp"><i style="width:38%"></i></span></div>
    <div class="l-boss"><span>quase morto</span><span class="hp"><i style="width:9%"></i></span></div>
    <div class="hp7"><span>prévia da vitrine · 62%</span><i><b style="width:62%"></b></i></div>
    ${id ? '<div class="bts"><button class="bt" data-golpe>golpe (−12%)</button><button class="bt" data-cura>vida cheia</button></div>' : ''}
  </div>`;
}
function previas(el, cfg){
  const cor = +cfg.cor || 0;
  let st = document.getElementById('hp-cristal-css');
  if(!st){ st = document.createElement('style'); st.id = 'hp-cristal-css'; document.head.append(st); }
  // cada cor com o seu seletor, para as três aparecerem lado a lado
  // o de hoje no jogo (web/efeitos.js), só para comparar
  const VELHO = '.cr-velho :is(.hp4 > b,.l-boss .hp i,.hp7 > i > b){background:linear-gradient(115deg,#BFE8FF 0 20%,#7FC8F8 20% 45%,#E6F7FF 45% 55%,#5FA8E8 55% 80%,#BFE8FF 80%)}';
  st.textContent = BASE + VELHO + [0, 1, 2].map(k => css(`.crc.hp-cristal[data-cor="${k}"]`, k)).join('\n');
  el.innerHTML = `<section><h2>o golpe: a vida desce e os cristais do trecho perdido estouram (mouse em cima da barra = o reflexo passa)</h2><div class="linha" style="align-items:flex-start">${painel(false, true, cor, 'cr-golpe')}${painel(true, true, cor)}</div></section>`
    + `<section><h2>as três cores (0 gelo · 1 rubi, que segue a cor da vida da paleta · 2 ametista), no escuro e no claro</h2>`
    + [0, 1, 2].map(k => `<h2 style="margin-top:12px">${NOMES[k]}</h2><div class="linha" style="align-items:flex-start">${painel(false, true, k)}${painel(true, true, k)}</div>`).join('') + '</section>'
    + `<section><h2>como é hoje (o degradê de vidro), para comparar</h2><div class="linha" style="align-items:flex-start">${painel(false, false, 0).replace('crc ', 'crc cr-velho ')}</div></section>`;
  const p = el.querySelector('#cr-golpe');
  let vida = 62;
  const poe = (v, golpe) => {
    const antes = vida; vida = v;
    p.querySelector('.pct').textContent = v + '%';
    p.querySelectorAll('.hp4 > b,.hp7 > i > b').forEach(b => { b.style.width = v + '%'; });
    if(golpe) estilhaca(p.querySelector('.hp4 > b'), antes, v);
  };
  p.querySelector('[data-golpe]').onclick = () => poe(Math.max(0, vida - 12), true);
  p.querySelector('[data-cura]').onclick = () => poe(100, false);
}

(window.CURSORES = window.CURSORES || {}).cristal = {css, estilhaca, previas,
  titulo: 'HP de cristal',
  dica: 'a vida do chefão vira uma fileira de cristais lapidados, chapados (3 tons de faceta e um traço de luz), com a ponta quebrada em zigue-zague · a vida perdida mostra os engastes vazios · mouse em cima = um reflexo passa · golpe = os cristais do trecho perdido estouram em lascas<br>"cor" escolhe qual das três vai para o jogo (as três aparecem embaixo)',
  controles: [{k: 'cor', rot: 'cor (0 gelo · 1 rubi · 2 ametista)', min: 0, max: 2, un: '', padrao: 0}]};
})();
