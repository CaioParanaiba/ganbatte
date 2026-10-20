// Hover "Carta que vira" (hv-vira), raro: o card dá a volta como uma carta de Greed Island, mostra o verso e volta à frente.
// Conserta o de hoje (um rotateY de 360° no :hover): girando, o card saía de baixo do cursor, perdia o :hover e recomeçava a
// cada ~130 ms com o mouse mexendo; e girava painéis enormes com perspectiva de 600 px, que cresciam por cima do cabeçalho.
// Agora o giro é disparado ao entrar no card (não pelo :hover) e sempre termina; só vira de novo depois que o cursor sai e
// volta. O lado tocado afunda primeiro (o giro sai para lá), o card passa pelo verso (moldura dourada, treliça e o selo
// G·I), segura um instante e volta à frente com uma passada leve. Card largo e baixo (as linhas de tarefa) vira pelo eixo
// deitado, como uma placa de aeroporto; a perspectiva sai do tamanho do card, para nada crescer demais. Painel grande não
// vira: só se inclina de leve para o lado tocado e volta. Com "reduzir movimento" no sistema, nada acontece.
// Só CSS animado pelo navegador (Web Animations): nenhum laço por quadro; o verso é um elemento posto no card durante o giro.
//   const h = CURSORES.vira.cola(raiz, {seletor: '.card', lento: 1})   h.ajusta({lento: 3})   h.desliga()
//   (raiz = document.documentElement no jogo, ou um elemento, como a tela preta da bancada; um elemento com data-sem-hover,
//   e o que estiver dentro dele, fica de fora)
//   CURSORES.vira.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, um pedaço do jogo de mentira
(() => {
const DUR = 1000, DUR_LEVE = 650;   // ms da volta inteira e da inclinação do painel grande
const GRANDE = 110000, ALTO = 360;  // px² e px: acima disso o card é painel e só inclina
const DEITADO = 4;                  // largura/altura acima disso vira pelo eixo deitado (X)
const AMOSTRAS = 60;                // quadros-chave da curva (o navegador interpola entre eles)
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const io = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, sai = x => 1 - Math.pow(1 - x, 3);

// o ângulo (graus) e a escala no tempo t (0..1) da volta: o lado tocado afunda, passa pelo verso, segura e volta
function volta(t){
  let a;
  if(t < .12) a = 14 * sai(t / .12);
  else if(t < .46) a = 14 + 166 * io((t - .12) / .34);
  else if(t < .58) a = 180;
  else if(t < .9) a = 180 + 190 * io((t - .58) / .32);
  else { const u = (t - .9) / .1; a = 360 + 10 * Math.cos(u * Math.PI * 1.5) * (1 - u); }
  return [a, 1 + .05 * Math.sin(Math.PI * lim((t - .08) / .84, 0, 1))];
}
// o painel grande: inclina para o lado tocado e volta, com uma passada amortecida
const leve = t => [t >= 1 ? 0 : 6 * Math.sin(Math.PI * 2.5 * t) * Math.exp(-3.4 * t), 1];

const CSS = `
vira-verso{position:absolute;z-index:3;pointer-events:none;display:flex;align-items:center;justify-content:center;gap:10px;overflow:hidden;
  box-sizing:border-box;padding:0 14px;color:#D9B85C;background-color:#1D2748;
  background-image:repeating-linear-gradient(45deg,rgba(217,184,92,.11) 0 1px,transparent 1px 9px),repeating-linear-gradient(-45deg,rgba(217,184,92,.11) 0 1px,transparent 1px 9px);
  box-shadow:inset 0 0 0 3px #1D2748,inset 0 0 0 4px #D9B85C,inset 0 0 0 6px #1D2748,inset 0 0 0 6.6px rgba(217,184,92,.45);
  font:700 10px Georgia,'Times New Roman',serif;letter-spacing:.22em}
vira-verso::before,vira-verso::after{content:"";flex:1;max-width:34%;height:1px;background:currentColor;opacity:.6}
vira-verso vira-selo{flex:none;width:var(--vira-d);height:var(--vira-d);border-radius:50%;display:grid;place-items:center;box-sizing:border-box;
  border:1.5px solid currentColor;box-shadow:0 0 0 2px #1D2748,0 0 0 2.6px rgba(217,184,92,.45);background:#1D2748;
  font-size:calc(var(--vira-d) * .34);letter-spacing:.04em;line-height:1}
vira-verso vira-txt{display:block;flex:none;white-space:nowrap}
vira-verso:not(.largo) vira-txt{display:none}`;

function cola(raiz, cfg){
  cfg = Object.assign({seletor: '.card', lento: 1}, cfg);
  const tela = raiz === document.documentElement || raiz === document.body;
  const est = document.createElement('style');
  est.textContent = CSS; (tela ? document.head : raiz).append(est);
  const girando = new Map(), espera = new WeakSet();   // espera: virou com o cursor em cima; só vira de novo depois de sair
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  let sobre = null, viradas = 0, ultima = '';

  function vira(card, x, y){
    if(girando.has(card) || quieto.matches) return;
    const r = card.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight;
    if(!w || !h) return;
    const painel = w * h > GRANDE || h > ALTO, eixo = w > DEITADO * h ? 'X' : 'Y';
    // o lado tocado afunda: rotateY positivo leva a direita para trás; rotateX positivo leva o alto para trás
    const s = eixo === 'Y' ? (x < r.left + r.width / 2 ? -1 : 1) : (y < r.top + r.height / 2 ? 1 : -1);
    const P = painel ? Math.max(900, (eixo === 'Y' ? w : h) * 2.5) : Math.max(320, (eixo === 'Y' ? w : h) * 3.2);
    const curva = painel ? leve : volta, cartas = [], verso = [];
    for(let i = 0; i <= AMOSTRAS; i++){
      const t = i / AMOSTRAS, [a, k] = curva(t), m = ((a % 360) + 360) % 360;
      cartas.push({offset: t, transform: `perspective(${P.toFixed(0)}px) rotate${eixo}(${(s * a).toFixed(2)}deg) scale(${k.toFixed(4)})`});
      verso.push({offset: t, opacity: m > 90 && m < 270 ? 1 : 0});
    }
    const dur = (painel ? DUR_LEVE : DUR) * Math.max(1, cfg.lento), anims = [card.animate(cartas, {duration: dur, easing: 'linear'})];
    let v = null;
    if(!painel){
      // o verso cobre o card com a borda junto (o card girando é o bloco que o contém) e vem espelhado, para ler direito
      const cs = getComputedStyle(card), b = k => parseFloat(cs['border' + k + 'Width']) || 0;
      // tags próprias, que o CSS do jogo não pega (um <span> dentro do card herdava o flex e a borda dos spans do card)
      v = document.createElement('vira-verso');
      if(w > 300) v.className = 'largo';
      v.innerHTML = '<vira-txt>GREED</vira-txt><vira-selo>G·I</vira-selo><vira-txt>ISLAND</vira-txt>';
      v.style.cssText = `top:${-b('Top')}px;right:${-b('Right')}px;bottom:${-b('Bottom')}px;left:${-b('Left')}px;border-radius:${cs.borderTopLeftRadius};`
        + `transform:scale${eixo === 'Y' ? 'X' : 'Y'}(-1);opacity:0;--vira-d:${lim(h * .56, 18, 64).toFixed(1)}px`;
      card.append(v);
      anims.push(v.animate(verso, {duration: dur, easing: 'linear'}));
    }
    girando.set(card, {anims, v}); viradas++; ultima = painel ? 'painel inclinou' : `virou pelo eixo ${eixo === 'X' ? 'deitado' : 'em pé'}`;
    anims[0].finished.then(fim, fim);
    function fim(){
      const g = girando.get(card); if(!g) return;
      if(g.v) g.v.remove();
      girando.delete(card);
      if(sobre === card) espera.add(card);
    }
  }

  // ---- eventos: o card sob o cursor é o mais de dentro que casa com o seletor (e que está na raiz)
  const ev = tela ? document : raiz;
  function mexe(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    const el = e.target.closest ? e.target.closest(cfg.seletor) : null, card = el && raiz.contains(el) && !el.closest('[data-sem-hover]') ? el : null;
    if(card === sobre) return;
    if(sobre && !(card && sobre.contains(card))) espera.delete(sobre);
    sobre = card;
    if(card && !espera.has(card)) vira(card, e.clientX, e.clientY);
  }
  function fora(e){ if(tela && e.relatedTarget) return; if(sobre) espera.delete(sobre); sobre = null; }
  const ouvintes = [['pointermove', mexe], [tela ? 'mouseout' : 'pointerleave', fora]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f, {passive: true}));

  return {
    ajusta(o){ Object.assign(cfg, o); },
    estado: () => ({girando: girando.size, viradas, ultima}),
    legenda: () => (girando.size ? 'virando' : 'parado') + ` · virou ${viradas}×` + (ultima ? ` · último: ${ultima}` : ''),
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      for(const g of girando.values()){ g.anims.forEach(a => a.cancel()); if(g.v) g.v.remove(); }
      girando.clear(); est.remove();
    },
  };
}


// ---- bancada: um pedaço do jogo de mentira na tela preta (o card do jogador, a caixa de tarefa nova, as tarefas, a
// constância e os cards do lado): os baixos viram deitados, os mais altos em pé, a constância só inclina
const TAREFAS = [['A', 'Perguntar ao professor de Redes se o trabalho vale nota', '+23'], ['A', 'Mandar mensagem da caixa', '+23'], ['C', 'Lavar o carro', '+15'], ['B', 'Ler 20 páginas', '+12']];
function liga(palco, cfg){
  const antes = palco.style.cssText, pag = document.createElement('div');
  palco.style.cursor = 'default';
  pag.className = 'vr-pag';
  const cor = () => cfg.claro ? {bg: '#F2F3F7', card: '#FFFFFF', borda: '#D9DCE5', tinta: '#1B1D28', suave: '#6B7088', trilho: '#E4E6EE'}
    : {bg: '#0B1120', card: '#121A2A', borda: '#243049', tinta: '#E6EDF7', suave: '#8A96AB', trilho: '#1C2538'};
  const hm = Array.from({length: 84}, (_, i) => `<i style="opacity:${[.15, .4, .7, 1][(i * 7 + (i >> 2)) % 4]}"></i>`).join('');
  pag.innerHTML = `<style>
    .vr-pag{position:absolute;inset:0;overflow:hidden;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-content:start;font:14px var(--f-ui)}
    .vr-pag .vr-col{display:grid;gap:10px;align-content:start;min-width:0}
    .vr-pag .vr-card{background:var(--b-card);border:1px solid var(--b-borda);border-radius:12px;padding:12px 14px;color:var(--b-tinta);min-width:0}
    .vr-pag .vr-me{grid-column:1/-1;display:flex;gap:14px;align-items:center}
    .vr-pag .vr-av{width:44px;height:44px;border-radius:50%;background:url('../../../web/a/killua-3.png') center/cover;flex:none;border:2px solid var(--b-borda)}
    .vr-pag .vr-xp{height:6px;border-radius:9px;background:var(--b-trilho);margin-top:6px} .vr-pag .vr-xp b{display:block;height:100%;width:62%;background:var(--b-tinta);border-radius:9px}
    .vr-pag small{display:block;color:var(--b-suave);font-size:12px}
    .vr-pag .vr-in{display:flex;gap:10px;align-items:center;color:var(--b-suave)} .vr-pag .vr-in span:first-child{flex:1;border:1px solid var(--b-borda);border-radius:8px;padding:8px 10px}
    .vr-pag .vr-tf{display:flex;gap:10px;align-items:center;padding:10px 14px} .vr-pag .vr-tf span{flex:1;min-width:0}
    .vr-pag .vr-tf i{width:18px;height:18px;flex:none;clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%);background:#E0AF68}
    .vr-pag .vr-tf em{font:600 11px var(--f-mono);font-style:normal;color:#9BE15D;border:1px solid currentColor;border-radius:5px;padding:1px 6px}
    .vr-pag .vr-pr{font:600 10px var(--f-mono);color:#0B0C10;background:#8A96AB;border-radius:3px;padding:0 4px;margin-right:6px}
    .vr-pag .vr-hm{display:grid;grid-template-columns:repeat(21,1fr);gap:3px;margin-top:8px} .vr-pag .vr-hm i{aspect-ratio:1;border-radius:2px;background:#9BE15D}
    .vr-pag h4{margin:0 0 6px;font:600 11px var(--f-mono);letter-spacing:.06em;color:var(--b-suave)}
    .vr-pag .vr-ln{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--b-borda);font-size:13px}
  </style>
  <div class="vr-card vr-me"><span class="vr-av"></span><div style="flex:1;min-width:0"><b>Caio</b> · andar 204<div class="vr-xp"><b></b></div><small>hoje +0 XP · meta 65</small></div></div>
  <div class="vr-col">
    <div class="vr-card vr-in"><span>Nova tarefa: ex. Lista 3 de derivadas</span><span>+ adicionar</span></div>
    ${TAREFAS.map(([p, n, x]) => `<div class="vr-card vr-tf"><i></i><span><span class="vr-pr">${p}</span>${n}</span><em>${x}</em></div>`).join('')}
    <div class="vr-card"><h4>CONSTÂNCIA</h4><small>um painel grande: não vira, só inclina</small><div class="vr-hm">${hm}</div></div>
  </div>
  <div class="vr-col">
    <div class="vr-card"><h4>QUANTO VALE</h4></div>
    <div class="vr-card"><h4>RENDE MAIS AGORA</h4><div class="vr-ln"><span>Mandar mensagem</span><b>+23</b></div><div class="vr-ln"><span>Lavar o carro</span><b>+15</b></div></div>
    <div class="vr-card"><h4>MISSÃO DA SEMANA</h4><b style="color:#E0AF68">Especialização</b><small>vida ×1,5 · 1/3 dias</small></div>
  </div>`;
  const pinta = () => { const c = cor(); palco.style.background = c.bg; for(const [k, v] of Object.entries(c)) pag.style.setProperty('--b-' + k, v); };
  palco.prepend(pag); pinta();
  const h = cola(palco, Object.assign(cfg, {seletor: '.vr-card'}));
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); h.ajusta(cfg); },
    estado: h.estado, legenda: h.legenda,
    desliga(){ h.desliga(); pag.remove(); palco.style.cssText = antes; },
  };
}

(window.CURSORES = window.CURSORES || {}).vira = {cola, liga,
  titulo: 'passe o mouse pelos cards · mexa o mouse em cima de um card enquanto ele vira',
  dica: 'ao entrar, o lado tocado afunda e o card dá a volta: passa pelo verso de carta de Greed Island, segura um instante e volta à frente · a volta sempre termina, e só vira de novo quando o cursor sai e volta<br>os cards baixos (as tarefas) viram deitados, como placa de aeroporto; os mais altos viram em pé · o painel grande da constância não vira, só inclina',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
