// Transição "Deslizar" (tr-deslizar), comum: a aba velha sai e a nova entra deslizando, no sentido da barra de abas (indo
// para uma aba à direita, a tela anda para a esquerda, e o contrário ao voltar). As duas andam juntas, num trecho curto, e
// a velha se apaga enquanto sai, para nunca ficarem as duas inteiras uma sobre a outra.
// Antes: a nova entrava sempre 40 px da direita (mesmo voltando) e a velha sumia de uma vez.
// Só transform e opacity nas duas seções, nada desenhado por cima; quadro em função do tempo.
//   const h = TRANSICOES.deslizar.cola(raiz, {secao, lento})   h.troca(fn, origem)   h.ajusta({lento})   h.desliga()
(() => {
// a base (tr-base.js no jogo) é procurada só na hora de usar: na demonstração os scripts entram em ordem alfabética
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const DUR = .26;
const sai = x => 1 - Math.pow(1 - x, 3), entra = x => x * x * x;

function def(){
  return {
    dur: DUR,
    inicio(ctx){
      const D = lim(ctx.W * .08, 28, 72);   // o quanto as abas andam
      return {D, tv: ctx.velha.style.transform, ov: ctx.velha.style.opacity, tn: ctx.nova.style.transform, on: ctx.nova.style.opacity};
    },
    quadro(est, t, ctx){
      const u = lim(t / DUR, 0, 1), v = lim(t / (DUR * .55), 0, 1);   // a velha some antes, para as duas não ficarem meio apagadas uma sobre a outra
      ctx.velha.style.transform = `translateX(${(-ctx.dir * est.D * entra(v)).toFixed(2)}px)`;
      ctx.velha.style.opacity = (1 - sai(v)).toFixed(3);
      ctx.nova.style.transform = `translateX(${(ctx.dir * est.D * (1 - sai(u))).toFixed(2)}px)`;
      ctx.nova.style.opacity = sai(lim((t - DUR * .3) / (DUR * .7), 0, 1)).toFixed(3);
    },
    fim(est, ctx){ Object.assign(ctx.nova.style, {transform: est.tn, opacity: est.on}); },
  };
}
function cola(raiz, cfg){ return TR_BASE.cria(raiz, cfg, def()); }
function liga(palco, cfg){ return TR_BASE.liga(palco, cfg, cola); }

(window.TRANSICOES = window.TRANSICOES || {}).deslizar = {cola, liga,
  titulo: 'clique nas abas: para a direita e para a esquerda (ou ligue "trocar sozinho")',
  dica: 'a velha sai e a nova entra no sentido da barra de abas (indo para a direita, a tela anda para a esquerda; voltando, o contrário) · ' + DUR + ' s<br>comum: sóbria e rápida, só movimento, nada desenhado por cima',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 8, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
