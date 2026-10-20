// Hover Shu (hv-shu), raro: o card se cobre de aura, como um objeto reforçado com Shu.
// Conserta o de hoje (a borda e o brilho trocavam de uma vez, sem transição). Ao entrar, a aura sai do ponto da borda
// tocado e corre o contorno nos dois sentidos até fechar a volta; ao fechar, a borda engrossa num pulso e o brilho acende.
// Com o mouse dentro, duas faíscas de aura correm a borda na mesma velocidade em px (num card grande a volta demora mais)
// e o brilho respira. Ao sair, a aura escorre para o ponto por onde o cursor saiu e apaga. Painel grande ganha só o
// contorno e o brilho, sem faíscas correndo. Com "reduzir movimento" no sistema, a aura aparece e some sem correr.
// Um <svg> por card numa camada por cima (o card não muda de estilo nem de posição); o laço só roda com aura acesa.
//   const h = CURSORES.shu.cola(raiz, {seletor: '.card', lento: 1})   h.ajusta({lento: 3})   h.desliga()
//   (raiz = document.documentElement no jogo, com a camada fixa na tela inteira; ou um elemento, como a tela preta da
//   bancada, com a camada dentro dele; a cor é a var(--aura) do jogo, e a ponta das faíscas puxa para a var(--ink); um elemento com data-sem-hover fica de fora)
//   CURSORES.shu.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, um pedaço do jogo de mentira
(() => {
const COBRE = .3, APAGA = .32;     // segundos para a aura fechar a volta e para escorrer ao sair
const PULSO = .28;                 // segundos do pulso ao fechar
const VEL = 300;                   // px/s das faíscas na borda
const GRANDE = 110000, ALTO = 360; // px² e px: acima disso o card é painel e fica sem faíscas
const CAUDA = [[14, 1], [42, .6], [110, .25]];   // a faísca: traços de px e opacidade com a mesma ponta (cauda que some)
const NS = 'http://www.w3.org/2000/svg';
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const sai = x => 1 - Math.pow(1 - x, 3);

const CSS = `
.shu-capa{position:absolute;left:0;top:0;pointer-events:none;overflow:visible}
.shu-capa svg{position:absolute;overflow:visible}
.shu-capa rect{fill:none}
.shu-capa .shu-luz{stroke:var(--aura);stroke-width:7}
.shu-capa svg.shu-borra{filter:blur(4px)}
.shu-capa .shu-anel{stroke:var(--aura)}
.shu-capa .shu-fx{stroke:color-mix(in srgb,var(--aura) 35%,var(--ink,#fff));stroke-width:3.2;stroke-linecap:round}`;

// onde, de 0 a 1, o ponto (x,y) cai no contorno do retângulo w×h (o <rect> começa no alto à esquerda, depois do canto, e
// segue em sentido horário); os cantos redondos entram como retos, o erro é de poucos px
function noContorno(x, y, w, h, r){
  x = lim(x, 0, w); y = lim(y, 0, h);
  const d = [y, w - x, h - y, x], m = d.indexOf(Math.min(...d)), P = 2 * (w + h);
  const s = [x, w + y, 2 * w + h - x, 2 * w + 2 * h - y][m] - r;
  return ((s / P) % 1 + 1) % 1;
}

function cola(raiz, cfg){
  cfg = Object.assign({seletor: '.card', lento: 1}, cfg);
  const tela = raiz === document.documentElement || raiz === document.body;
  const capa = document.createElement('div'), est = document.createElement('style');
  est.textContent = CSS;
  capa.className = 'shu-capa';
  capa.style.cssText = tela ? 'position:fixed;inset:0;z-index:2147482000' : 'z-index:5';
  (tela ? document.head : raiz).append(est); (tela ? document.body : raiz).append(capa);
  const origem = () => { if(tela) return [0, 0]; const b = raiz.getBoundingClientRect(); return [b.left + raiz.clientLeft, b.top + raiz.clientTop]; };
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const auras = new Map();   // card → {svg, rects, c (0..1 coberto), meio (0..1 no contorno), dentro, t, fechou, ...}
  let sobre = null, acesas = 0;

  function rect(svg, classe){ const r = document.createElementNS(NS, 'rect'); r.setAttribute('class', classe); r.setAttribute('pathLength', '1000'); svg.append(r); return r; }
  function acende(card, x, y){
    let a = auras.get(card);
    if(!a){
      // o brilho fica num <svg> próprio: o desfoque vai no <svg> (o Chrome não desfoca um <rect> por CSS)
      const svgL = document.createElementNS(NS, 'svg'), svg = document.createElementNS(NS, 'svg');
      svgL.setAttribute('class', 'shu-borra');
      a = {svg, svgL, luz: rect(svgL, 'shu-luz'), anel: rect(svg, 'shu-anel'), fx: [], c: 0, t: 0, fechou: -1, fxv: 0, corre: 0, w: 0, h: 0, raio: 0};
      for(let k = 0; k < 2; k++) for(const [len, op] of CAUDA){ const r = rect(svg, 'shu-fx'); r.style.opacity = 0; a.fx.push({r, len, op, k}); }
      capa.append(svgL, svg); auras.set(card, a); mede(card, a);
      a.meio = noContorno(x - a.l, y - a.tp, a.w, a.h, a.raio);
      acesas++;
    }
    a.dentro = true;
  }
  function mede(card, a){
    const b = card.getBoundingClientRect(), [ox, oy] = origem();
    a.l = b.left; a.tp = b.top;
    if(b.width !== a.w || b.height !== a.h){
      a.w = b.width; a.h = b.height;
      a.raio = Math.max(0, (parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0) - 1);
      a.painel = a.w * a.h > GRANDE || a.h > ALTO;
      a.P = 2 * (a.w + a.h - 2 * a.raio) + Math.PI * 2 * a.raio;
      for(const v of [a.svg, a.svgL]){ v.setAttribute('width', a.w); v.setAttribute('height', a.h); }
      for(const r of [a.luz, a.anel, ...a.fx.map(f => f.r)]){
        r.setAttribute('x', 1); r.setAttribute('y', 1); r.setAttribute('width', Math.max(0, a.w - 2)); r.setAttribute('height', Math.max(0, a.h - 2));
        r.setAttribute('rx', a.raio); r.setAttribute('ry', a.raio);
      }
    }
    for(const v of [a.svg, a.svgL]){ v.style.left = (b.left - ox) + 'px'; v.style.top = (b.top - oy) + 'px'; }
  }

  // um traço de comprimento L (em 1000 avos do contorno) centrado em m: com o padrão de período 1000, a volta fecha certa
  const traco = (r, L, m) => { r.setAttribute('stroke-dasharray', `${L.toFixed(2)} ${(1000 - L).toFixed(2)}`); r.setAttribute('stroke-dashoffset', (-(m * 1000 - L / 2)).toFixed(2)); };

  function passo(card, a, dt){
    const lento = Math.max(1, cfg.lento);
    a.t += dt / lento;
    if(quieto.matches) a.c = a.dentro ? 1 : 0;
    else a.c = lim(a.c + (a.dentro ? 1 / COBRE : -1 / APAGA) * dt / lento, 0, 1);
    if(a.c >= 1 && a.fechou < 0) a.fechou = a.t;
    if(!a.dentro && a.c <= 0){ a.svg.remove(); a.svgL.remove(); auras.delete(card); return; }
    mede(card, a);
    const c = a.dentro ? sai(a.c) : a.c * a.c;
    // o pulso de quando a volta fecha, e depois a respiração
    const p = a.fechou < 0 ? 0 : Math.max(0, 1 - (a.t - a.fechou) / PULSO), resp = quieto.matches ? 0 : .12 * Math.sin((a.t - Math.max(0, a.fechou)) * Math.PI * 2 / 2.4);
    traco(a.anel, c * 1000, a.meio);
    a.anel.style.strokeWidth = (2 + 1.6 * p * p).toFixed(2);
    a.luz.style.opacity = (c * (.42 + .4 * p + resp)).toFixed(3);
    traco(a.luz, c * 1000, a.meio);
    // as faíscas: só depois de fechar, nascem no ponto tocado e correm cada uma para um lado; ao sair, somem aos poucos
    const quer = a.dentro && a.fechou >= 0 && !a.painel && !quieto.matches ? 1 : 0;
    a.fxv = lim(a.fxv + (quer ? 1 / .3 : -1 / APAGA) * dt / lento, 0, 1);
    if(a.fxv > 0) a.corre += dt / lento * VEL / a.P; else a.corre = 0;
    const fx = a.fxv * (a.dentro ? 1 : a.c), anda = a.corre;
    for(const f of a.fx){
      if(!fx){ f.r.style.opacity = 0; continue; }
      const L = f.len / a.P * 1000, ponta = a.meio + (f.k ? -anda : anda);
      // a ponta segue na frente: o traço vai da ponta para trás
      traco(f.r, L, ((ponta - (f.k ? -1 : 1) * L / 2000) % 1 + 1) % 1);
      f.r.style.opacity = (f.op * fx).toFixed(3);
    }
  }

  let pedido = 0, antes = 0;
  function quadro(t){
    pedido = 0;
    const dt = antes ? Math.min(.05, (t - antes) / 1000) : 1 / 60; antes = t;
    for(const [card, a] of auras) passo(card, a, dt);
    if(auras.size) pedido = requestAnimationFrame(quadro); else antes = 0;
  }
  const acorda = () => { if(!pedido) pedido = requestAnimationFrame(quadro); };

  // ---- eventos: o card sob o cursor é o mais de dentro que casa com o seletor (e que está na raiz)
  const ev = tela ? document : raiz;
  function solta(card, x, y){
    const a = auras.get(card); if(!a) return;
    a.dentro = false; a.fechou = -1;   // voltando antes de apagar, fecha de novo com outro pulso
    // a aura escorre para o ponto de saída: o traço encolhe centrado nele
    if(x != null) a.meio = noContorno(x - a.l, y - a.tp, a.w, a.h, a.raio);
  }
  function mexe(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    const el = e.target.closest ? e.target.closest(cfg.seletor) : null, card = el && raiz.contains(el) && !el.closest('[data-sem-hover]') ? el : null;
    if(card === sobre) return;
    if(sobre && !(card && sobre.contains(card))) solta(sobre, e.clientX, e.clientY);
    sobre = card;
    if(card) acende(card, e.clientX, e.clientY);
    acorda();
  }
  function fora(e){ if(tela && e.relatedTarget) return; if(sobre) solta(sobre, e.clientX, e.clientY); sobre = null; acorda(); }
  const ouvintes = [['pointermove', mexe], [tela ? 'mouseout' : 'pointerleave', fora]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f, {passive: true}));

  return {
    ajusta(o){ Object.assign(cfg, o); acorda(); },
    estado: () => ({auras: [...auras.values()].map(a => ({c: a.c, dentro: a.dentro, fechou: a.fechou >= 0, painel: a.painel})), acesas}),
    legenda(){
      const a = sobre && auras.get(sobre);
      return (a ? (a.c < 1 ? 'a aura corre o contorno' : a.painel ? 'Shu no painel (sem faíscas)' : 'Shu: faíscas correndo') : auras.size ? 'a aura escorre e apaga' : 'sem aura') + ` · acendeu ${acesas}×`;
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      cancelAnimationFrame(pedido); auras.clear(); capa.remove(); est.remove();
    },
  };
}


// ---- bancada: um pedaço do jogo de mentira na tela preta (o card do jogador, a caixa de tarefa nova, as tarefas, a
// constância e os cards do lado), com cards de tamanhos bem diferentes para ver a faísca andando na mesma velocidade
const TAREFAS = [['A', 'Perguntar ao professor de Redes se o trabalho vale nota', '+23'], ['A', 'Mandar mensagem da caixa', '+23'], ['C', 'Lavar o carro', '+15'], ['B', 'Ler 20 páginas', '+12']];
function liga(palco, cfg){
  const antes = palco.style.cssText, pag = document.createElement('div');
  palco.style.cursor = 'default';
  pag.className = 'sh-pag';
  const cor = () => cfg.claro ? {bg: '#F2F3F7', card: '#FFFFFF', borda: '#D9DCE5', tinta: '#1B1D28', suave: '#6B7088', trilho: '#E4E6EE', aura: '#6B4FD8'}
    : {bg: '#0B1120', card: '#121A2A', borda: '#243049', tinta: '#E6EDF7', suave: '#8A96AB', trilho: '#1C2538', aura: '#B4A0FF'};
  const hm = Array.from({length: 84}, (_, i) => `<i style="opacity:${[.15, .4, .7, 1][(i * 7 + (i >> 2)) % 4]}"></i>`).join('');
  pag.innerHTML = `<style>
    .sh-pag{position:absolute;inset:0;overflow:hidden;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-content:start;font:14px var(--f-ui)}
    .sh-pag .sh-col{display:grid;gap:10px;align-content:start;min-width:0}
    .sh-pag .sh-card{background:var(--b-card);border:1px solid var(--b-borda);border-radius:12px;padding:12px 14px;color:var(--b-tinta);min-width:0}
    .sh-pag .sh-me{grid-column:1/-1;display:flex;gap:14px;align-items:center}
    .sh-pag .sh-av{width:44px;height:44px;border-radius:50%;background:url('../../../web/a/killua-3.png') center/cover;flex:none;border:2px solid var(--b-borda)}
    .sh-pag .sh-xp{height:6px;border-radius:9px;background:var(--b-trilho);margin-top:6px} .sh-pag .sh-xp b{display:block;height:100%;width:62%;background:var(--b-tinta);border-radius:9px}
    .sh-pag small{display:block;color:var(--b-suave);font-size:12px}
    .sh-pag .sh-in{display:flex;gap:10px;align-items:center;color:var(--b-suave)} .sh-pag .sh-in span:first-child{flex:1;border:1px solid var(--b-borda);border-radius:8px;padding:8px 10px}
    .sh-pag .sh-tf{display:flex;gap:10px;align-items:center;padding:10px 14px} .sh-pag .sh-tf span{flex:1;min-width:0}
    .sh-pag .sh-tf i{width:18px;height:18px;flex:none;clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%);background:#E0AF68}
    .sh-pag .sh-tf em{font:600 11px var(--f-mono);font-style:normal;color:#9BE15D;border:1px solid currentColor;border-radius:5px;padding:1px 6px}
    .sh-pag .sh-pr{font:600 10px var(--f-mono);color:#0B0C10;background:#8A96AB;border-radius:3px;padding:0 4px;margin-right:6px}
    .sh-pag .sh-hm{display:grid;grid-template-columns:repeat(21,1fr);gap:3px;margin-top:8px} .sh-pag .sh-hm i{aspect-ratio:1;border-radius:2px;background:#9BE15D}
    .sh-pag h4{margin:0 0 6px;font:600 11px var(--f-mono);letter-spacing:.06em;color:var(--b-suave)}
    .sh-pag .sh-ln{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--b-borda);font-size:13px}
  </style>
  <div class="sh-card sh-me"><span class="sh-av"></span><div style="flex:1;min-width:0"><b>Caio</b> · andar 204<div class="sh-xp"><b></b></div><small>hoje +0 XP · meta 65</small></div></div>
  <div class="sh-col">
    <div class="sh-card sh-in"><span>Nova tarefa: ex. Lista 3 de derivadas</span><span>+ adicionar</span></div>
    ${TAREFAS.map(([p, n, x]) => `<div class="sh-card sh-tf"><i></i><span><span class="sh-pr">${p}</span>${n}</span><em>${x}</em></div>`).join('')}
    <div class="sh-card"><h4>CONSTÂNCIA</h4><small>um painel grande: só o contorno e o brilho</small><div class="sh-hm">${hm}</div></div>
  </div>
  <div class="sh-col">
    <div class="sh-card"><h4>QUANTO VALE</h4></div>
    <div class="sh-card"><h4>RENDE MAIS AGORA</h4><div class="sh-ln"><span>Mandar mensagem</span><b>+23</b></div><div class="sh-ln"><span>Lavar o carro</span><b>+15</b></div></div>
    <div class="sh-card"><h4>MISSÃO DA SEMANA</h4><b style="color:#E0AF68">Especialização</b><small>vida ×1,5 · 1/3 dias</small></div>
  </div>`;
  const pinta = () => { const c = cor(); palco.style.background = c.bg; palco.style.setProperty('--aura', c.aura); palco.style.setProperty('--ink', c.tinta); for(const [k, v] of Object.entries(c)) pag.style.setProperty('--b-' + k, v); };
  palco.prepend(pag); pinta();
  const h = cola(palco, Object.assign(cfg, {seletor: '.sh-card'}));
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); h.ajusta(cfg); },
    estado: h.estado, legenda: h.legenda,
    desliga(){ h.desliga(); pag.remove(); palco.style.cssText = antes; },
  };
}

(window.CURSORES = window.CURSORES || {}).shu = {cola, liga,
  titulo: 'passe o mouse pelos cards · entre por um lado e saia por outro',
  dica: 'ao entrar, a aura sai do ponto tocado e corre o contorno nos dois sentidos até fechar · ao fechar, a borda dá um pulso e o brilho acende<br>dentro, duas faíscas correm a borda e o brilho respira · ao sair, a aura escorre para o ponto de saída e apaga · o painel grande da constância fica só com o contorno',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
