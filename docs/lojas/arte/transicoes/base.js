// Base das transições de aba (tr-*), em código. A troca de verdade é do jogo (ou do jogo de mentira da bancada): ele
// chama h.troca(fn), e a base faz fn() (que esconde a aba velha e mostra a nova, com o estado já trocado) e segura a aba
// velha na tela, fora do fluxo e no mesmo lugar, só para a animação. Quem anima é o módulo da transição (def).
// No fim a velha volta a ficar escondida e todo estilo posto nela é devolvido. Com "reduzir movimento" no sistema, só fn().
//   const h = TR_BASE.cria(raiz, cfg, def)  → {troca(fn, origem), ajusta(o), estado(), legenda(), vai(t), encerra(), desliga()}
//   raiz: document.documentElement no jogo (overlays fixos na tela), ou um elemento posicionado (a bancada), que também
//   contém as seções e recorta o que sair dele
//   cfg: {secao: seletor das abas, lento: câmera lenta, claro: tema claro, manual: 1 = não anda sozinho (testes: h.vai(t))}
//   def: {dur (s), inicio(ctx) → est, quadro(est, t, ctx), fim(est, ctx)}; t em segundos já dividido pelo "lento"
//   ctx: {tela, pai, W, H, velha, nova, dir (1 = a nova vem depois da velha na ordem das abas, -1 = antes), caixa {l,t,w,h}
//   da aba velha, origem {x,y} do clique, loc(p), claro, escondeVelha()}
//   TR_BASE.liga(palco, cfg, cola): a bancada de qualquer transição, com o jogo de mentira (palco.js)
//   origem: onde o jogador clicou (coordenadas do navegador); sem ela, o último clique recente ou o meio do topo
(() => {
const quieto = matchMedia('(prefers-reduced-motion: reduce)');
const lim = (v, a, b) => Math.max(a, Math.min(b, v));

function cria(raiz, cfg, def){
  cfg = Object.assign({secao: 'section[id^="v-"]', lento: 1, claro: 0, manual: 0}, cfg);
  const tela = raiz === document.documentElement || raiz === document.body;
  const alvo = tela ? document : raiz;
  let ativa = null, trocas = 0, ult = null;
  const marca = e => { ult = {x: e.clientX, y: e.clientY, t: performance.now()}; };
  alvo.addEventListener('pointerdown', marca, true);
  const secoes = () => [...raiz.querySelectorAll(cfg.secao)];
  const caixa = () => {
    if(tela) return {l: 0, t: 0, W: document.documentElement.clientWidth, H: innerHeight};
    const r = raiz.getBoundingClientRect(); return {l: r.left, t: r.top, W: r.width, H: r.height};
  };

  function troca(fn, origem){
    if(ativa) ativa.encerra();
    const velha = secoes().find(s => !s.hidden);
    if(quieto.matches || !velha){ fn(); return null; }
    const c = caixa(), r = velha.getBoundingClientRect(), op = tela ? null : velha.offsetParent, pr = op && op.getBoundingClientRect();
    const css = velha.style.cssText;
    fn();
    const todas = secoes(), nova = todas.find(s => s !== velha && !s.hidden);
    if(!nova || !velha.hidden) return null;   // a aba não mudou
    velha.hidden = false;
    Object.assign(velha.style, {
      position: tela ? 'fixed' : 'absolute', margin: '0', boxSizing: 'border-box', pointerEvents: 'none', zIndex: def.zVelha || 57,
      left: (op ? r.left - pr.left - op.clientLeft + op.scrollLeft : r.left) + 'px',
      top: (op ? r.top - pr.top - op.clientTop + op.scrollTop : r.top) + 'px', width: r.width + 'px'});
    const loc = p => ({x: p.x - c.l, y: p.y - c.t});
    const ctx = {raiz, tela, dir: todas.indexOf(nova) > todas.indexOf(velha) ? 1 : -1, pai: tela ? document.body : raiz, W: c.W, H: c.H, velha, nova, loc, claro: !!cfg.claro, cfg,
      caixa: {l: r.left - c.l, t: r.top - c.t, w: r.width, h: r.height},
      origem: origem ? loc(origem) : ult && performance.now() - ult.t < 800 ? loc(ult) : {x: c.W / 2, y: 0},
      escondeVelha(){ velha.hidden = true; }};
    let est, fim = false, raf = 0;
    const cur = {encerra, vai, t: 0};
    function encerra(){
      if(fim) return; fim = true; cancelAnimationFrame(raf);
      try { def.fim(est, ctx); } catch(e){ console.error(e); }
      velha.hidden = true; velha.style.cssText = css;
      if(ativa === cur) ativa = null;
    }
    function vai(t){ if(fim) return; cur.t = t; try { def.quadro(est, t, ctx); } catch(e){ console.error(e); encerra(); } }
    try { est = def.inicio(ctx); } catch(e){ console.error(e); fim = true; velha.hidden = true; velha.style.cssText = css; return null; }
    ativa = cur; trocas++;
    vai(0);
    if(!cfg.manual){
      const t0 = performance.now();
      const passo = agora => {
        if(fim) return;
        const t = Math.max(0, agora - t0) / 1000 / Math.max(.2, cfg.lento);
        if(t >= def.dur) return encerra();
        vai(t); if(!fim) raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
    }
    return cur;
  }
  return {
    troca, ajusta(o){ Object.assign(cfg, o); },
    vai: t => ativa && ativa.vai(t), encerra: () => ativa && ativa.encerra(),
    estado: () => ({ativa: !!ativa, trocas, t: ativa ? ativa.t : 0}),
    legenda: () => (ativa ? `trocando · ${ativa.t.toFixed(2)} s de ${def.dur} s` : 'parada') + ` · ${trocas}× trocou`,
    desliga(){ if(ativa) ativa.encerra(); alvo.removeEventListener('pointerdown', marca, true); },
  };
}

// a bancada: o jogo de mentira com as quatro abas, e a transição colada nele
function liga(palco, cfg, cola){
  let h = null;
  const p = window.TR_PALCO.monta(palco, cfg, () => h);
  h = cola(p.app, cfg);
  return {
    ajusta(o){ Object.assign(cfg, o); p.pinta(); h.ajusta(cfg); },
    legenda: h.legenda, estado: () => Object.assign(h.estado(), {aba: p.atual()}),
    abre: p.abre, proxima: p.proxima, vai: h.vai, encerra: h.encerra, app: p.app,
    desliga(){ h.desliga(); p.desliga(); },
  };
}

window.TR_BASE = {cria, liga, lim};
})();
