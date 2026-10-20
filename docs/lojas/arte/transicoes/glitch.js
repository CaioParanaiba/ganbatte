// Transição "Glitch" (tr-glitch), raro: a tela falha por um instante ao trocar de aba. Em quadros secos (~22 por segundo,
// como sinal ruim): a aba velha separa as cores (vermelho e ciano) e treme; depois rasga em faixas horizontais deslocadas
// com a nova aparecendo pelos rasgos, blocos digitais e linhas de varredura piscam; no fim a nova se firma, com um último
// tranco. Antes: duas faixas recortadas da aba nova e 6 px de sacudida, quase invisível.
// Sem cópia da tela: as faixas são a própria aba velha recortada (clip-path com várias faixas) por cima da nova; o resto
// (blocos e varredura) é um canvas por cima. Quadro em função do tempo; o sorteio de cada quadro é fixo pela semente.
//   const h = TRANSICOES.glitch.cola(raiz, {secao, lento, claro})   h.troca(fn, origem)   h.ajusta({lento, claro})   h.desliga()
(() => {
// a base (tr-base.js no jogo) é procurada só na hora de usar: na demonstração os scripts entram em ordem alfabética
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const DUR = .42, PASSO = .045;   // s: a falha inteira e a duração de cada quadro
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rgb = (d, k) => d ? `drop-shadow(${d}px 0 0 rgba(255,40,90,${k})) drop-shadow(${-d}px 0 0 rgba(0,220,255,${k}))` : '';

// faixas horizontais (em px da seção) como um clip-path só: polygon que desce pela borda esquerda ligando as faixas
function faixas(lista, w){
  if(!lista.length) return 'inset(0 0 100% 0)';
  const p = [];
  for(const [a, b] of lista) p.push(`0 ${a}px`, `${w}px ${a}px`, `${w}px ${b}px`, `0 ${b}px`);
  return `polygon(${p.join(',')})`;
}

function def(){
  return {
    dur: DUR,
    inicio(ctx){
      const c = document.createElement('canvas'); c.width = ctx.W; c.height = ctx.H;
      c.style.cssText = `position:${ctx.tela ? 'fixed' : 'absolute'};left:0;top:0;width:${ctx.W}px;height:${ctx.H}px;pointer-events:none;z-index:58`;
      ctx.pai.append(c);
      const v = ctx.velha.style, n = ctx.nova.style;
      return {c, g: c.getContext('2d'), semente: ctx.cfg.semente || Math.floor(Math.random() * 1e9), q: -1,
        guarda: {tn: n.transform, fn: n.filter, on: n.opacity, cn: n.clipPath}};
    },
    quadro(est, t, ctx){
      const q = Math.floor(t / PASSO);
      if(q === est.q) return;   // quadros secos: só muda a cada PASSO
      est.q = q;
      const rnd = mulberry(est.semente + q * 977), V = ctx.velha.style, N = ctx.nova.style, cx = ctx.caixa, W = ctx.W, H = ctx.H;
      const fase = t < .1 ? 0 : t < .28 ? 1 : 2;
      // linha de varredura: em que altura da tela (nas coordenadas da seção velha) está cada faixa
      const lista = [];
      if(fase === 0){
        // a velha inteira, cores separadas e tremendo; a nova ainda não
        V.clipPath = ''; V.transform = `translateX(${((rnd() - .5) * 10).toFixed(1)}px)`; V.filter = rgb(2 + Math.round(rnd() * 3), .75);
        N.opacity = '0';
      } else if(fase === 1){
        // a velha só em faixas, cada quadro noutras alturas, deslocadas; a nova aparece pelos rasgos
        let y = -cx.t + rnd() * 30;
        while(y < H - cx.t){ const h = 8 + rnd() * 60; if(rnd() < .55 - (t - .1) * 1.2) lista.push([y, y + h]); y += h + rnd() * 26; }
        V.clipPath = faixas(lista, cx.w); V.transform = `translateX(${((rnd() < .5 ? -1 : 1) * (8 + rnd() * 26)).toFixed(1)}px)`; V.filter = rgb(3 + Math.round(rnd() * 3), .8);
        N.opacity = '1'; N.transform = `translateX(${((rnd() - .5) * 8).toFixed(1)}px)`; N.filter = rgb(2 + Math.round(rnd() * 2), .6);
        N.clipPath = rnd() < .35 ? `inset(${(rnd() * 40).toFixed(0)}% 0 0 0)` : '';
      } else {
        // a nova se firma: um tranco no começo, depois parada; a velha some
        ctx.escondeVelha();
        const tranco = q === Math.floor(.28 / PASSO) || q === Math.floor(.36 / PASSO);
        N.opacity = '1'; N.clipPath = '';
        N.transform = tranco ? `translateX(${((rnd() < .5 ? -1 : 1) * (4 + rnd() * 5)).toFixed(1)}px)` : '';
        N.filter = tranco ? rgb(2, .55) : '';
      }
      // por cima: blocos digitais e a varredura
      const g = est.g; g.clearRect(0, 0, W, H);
      if(fase < 2 || q === Math.floor(.28 / PASSO)){
        const n = fase === 0 ? 3 : 7;
        for(let i = 0; i < n; i++){
          const bw = 20 + rnd() * W * .3, bh = 3 + rnd() * 22, x = rnd() * W, y = rnd() * H;
          const r = rnd();
          g.fillStyle = r < .35 ? 'rgba(255,40,90,.55)' : r < .7 ? 'rgba(0,220,255,.5)' : ctx.claro ? 'rgba(20,22,32,.75)' : 'rgba(230,237,247,.6)';
          g.fillRect(x, y, bw, bh);
        }
        g.fillStyle = ctx.claro ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.035)';
        for(let y = (q * 2) % 4; y < H; y += 4) g.fillRect(0, y, W, 1);
      }
    },
    fim(est, ctx){
      est.c.remove();
      const N = ctx.nova.style; Object.assign(N, {transform: est.guarda.tn, filter: est.guarda.fn, opacity: est.guarda.on, clipPath: est.guarda.cn});
    },
  };
}
function cola(raiz, cfg){ return TR_BASE.cria(raiz, cfg, def()); }
function liga(palco, cfg){ return TR_BASE.liga(palco, cfg, cola); }

(window.TRANSICOES = window.TRANSICOES || {}).glitch = {cola, liga,
  titulo: 'clique nas abas (ou ligue "trocar sozinho"); a câmera lenta ajuda a ver quadro a quadro',
  dica: 'a velha separa as cores e treme, rasga em faixas com a nova aparecendo pelos rasgos, blocos digitais e varredura piscam, e a nova se firma com um último tranco · ' + DUR + ' s, em quadros secos<br>raro: um disparo curto, sem cópia da tela (as faixas são a própria aba recortada)',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 8, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
