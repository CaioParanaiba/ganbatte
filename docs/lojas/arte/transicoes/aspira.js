// Transição "Deme-chan" (tr-aspira), da Shizuku, raro: ao trocar de aba, a aba velha é sugada para o canto da tela mais
// perto de onde você clicou, como pelo bocal da Deme-chan (que não aparece: só o redemoinho no canto). Não é uma captura
// da tela: os cards de verdade da aba velha saem um a um, do mais perto do canto ao mais longe, curvando como num
// redemoinho, esticando na direção do canto, girando e encolhendo até sumir nele. A aba nova aparece atrás.
// A aba já vale desde o clique. Sem física: cada peça segue uma curva com horário fixo (o quadro é função do tempo).
//   const h = TRANSICOES.aspira.cola(raiz, {secao, lento, claro})   h.troca(fn, origem)   h.ajusta({lento, claro})   h.desliga()
//   TRANSICOES.aspira.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, com o jogo de mentira
(() => {
const B = window.TR_BASE, lim = B.lim;
const DUR = .72;
const MAXU = 36;                   // no máximo tantas peças voando (acima disso, agrupa pelos pais)
const ss = (a, b, x) => { const u = lim((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ---- as peças da aba velha: desce pela árvore até achar o que tem cara própria (fundo, borda, sombra, imagem, texto)
function pecas(sec, cx, W, H){
  const temCara = (el, cs) => {
    const bg = cs.backgroundColor, a = /rgba?\(([^)]+)\)/.exec(bg), alfa = a ? (a[1].split(',')[3] === undefined ? 1 : +a[1].split(',')[3]) : 0;
    return alfa > .02 || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none' || parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderBottomWidth) > 0
      || /^(IMG|SVG|CANVAS|VIDEO|BUTTON|INPUT|TEXTAREA|SELECT|svg)$/.test(el.tagName) || [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  };
  function junta(prof){
    const res = [];
    (function desce(el, d){
      const cs = getComputedStyle(el);
      if(cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if(cs.display !== 'contents' && (r.width < 2 || r.height < 2 || r.right < cx.l || r.bottom < cx.t || r.left > cx.l + W || r.top > cx.t + H)) return;
      const filhos = [...el.children], inline = filhos.some(f => /^inline(?!-)/.test(getComputedStyle(f).display));
      if(el !== sec && cs.display !== 'contents' && (temCara(el, cs) || !filhos.length || inline || d >= prof)){ res.push(el); return; }
      filhos.forEach(f => desce(f, d + 1));
    })(sec, 0);
    return res;
  }
  for(let prof = 8; prof >= 1; prof--){ const r = junta(prof); if(r.length <= MAXU) return r.length ? r : [sec]; }
  return [sec];
}

function def(){
  return {
    dur: DUR, zVelha: 57,
    inicio(ctx){
      const {W, H} = ctx, rnd = mulberry(ctx.cfg.semente || Math.floor(Math.random() * 1e9));
      // o canto mais perto do clique, um pouco para fora da tela (as peças somem antes de chegar)
      const o = ctx.origem, M = {x: o.x < W / 2 ? -8 : W + 8, y: o.y < H / 2 ? -8 : H + 8}, S = lim(Math.min(W, H) * .36, 120, 240);
      const pos = ctx.tela ? 'fixed' : 'absolute';
      const lin = document.createElement('canvas'); lin.width = W; lin.height = H;
      lin.style.cssText = `position:${pos};left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:58`;
      ctx.pai.append(lin);
      // as peças, com o centro da parte visível (é para lá que a peça encolhe) e a curva até a boca
      const cx = ctx.raiz === document.documentElement ? {l: 0, t: 0} : (r => ({l: r.left, t: r.top}))(ctx.raiz.getBoundingClientRect());
      const ps = pecas(ctx.velha, cx, W, H).map(el => {
        const r = el.getBoundingClientRect(), l = r.left - cx.l, t = r.top - cx.t;
        const vx0 = Math.max(l, 0), vx1 = Math.min(l + r.width, W), vy0 = Math.max(t, 0), vy1 = Math.min(t + r.height, H);
        const c = {x: (vx0 + vx1) / 2, y: (vy0 + vy1) / 2}, dx = M.x - c.x, dy = M.y - c.y, d = Math.hypot(dx, dy) || 1;
        const giro = .22 + rnd() * .22, ctl = {x: (c.x + M.x) / 2 - dy / d * d * giro, y: (c.y + M.y) / 2 + dx / d * d * giro};
        const area = r.width * r.height, spin = (rnd() < .5 ? -1 : 1) * (.5 + rnd() * .8) * (area < 20000 ? 2.2 : 1);
        const guarda = {transform: el.style.transform, transformOrigin: el.style.transformOrigin, opacity: el.style.opacity, willChange: el.style.willChange};
        el.style.transformOrigin = `${c.x - l}px ${c.y - t}px`; el.style.willChange = 'transform, opacity';
        return {el, c, ctl, d, spin, guarda};
      });
      const dMax = Math.max(...ps.map(p => p.d), 1);
      ps.forEach(p => { const dn = p.d / dMax; p.s = .03 + .25 * Math.pow(dn, .9) + rnd() * .03; p.du = .24 + .1 * dn; });
      const meio = Math.atan2(H / 2 - M.y, W / 2 - M.x);   // os raios vêm de dentro da tela para o canto
      const raios = Array.from({length: 30}, () => ({a: meio + (rnd() - .5) * 1.7, r0: (.4 + rnd() * .7) * Math.hypot(W, H) * .6, v: 1.6 + rnd() * 1.4, f: rnd(), l: .1 + rnd() * .1}));
      const op = ctx.nova.style.opacity; ctx.nova.style.opacity = '0';
      return {lin, g: lin.getContext('2d'), ps, M, S, raios, op};
    },
    quadro(est, t, ctx){
      const {M, S} = est;
      ctx.nova.style.opacity = ss(.3, .66, t).toFixed(3);   // a nova só aparece quando a maior parte da velha já foi
      for(const p of est.ps){
        const u = lim((t - p.s) / p.du, 0, 1), st = p.el.style;
        if(u <= 0){   // antes de ir: a peça já sente a puxada
          const k = 4 * ss(0, .12, t) / p.d;
          st.transform = `translate(${((M.x - p.c.x) * k).toFixed(2)}px,${((M.y - p.c.y) * k).toFixed(2)}px)`; continue;
        }
        if(u >= 1){ st.opacity = '0'; continue; }
        const e = Math.pow(u, 2.1), a = 1 - e;
        const x = a * a * p.c.x + 2 * a * e * p.ctl.x + e * e * M.x, y = a * a * p.c.y + 2 * a * e * p.ctl.y + e * e * M.y;
        const vx = 2 * a * (p.ctl.x - p.c.x) + 2 * e * (M.x - p.ctl.x), vy = 2 * a * (p.ctl.y - p.c.y) + 2 * e * (M.y - p.ctl.y), fi = Math.atan2(vy, vx);
        const estica = ss(.45, .98, u), sc = lim(1 - .97 * Math.pow(u, 1.3), .02, 1) * (1 + .05 * Math.sin(Math.PI * lim(u / .18, 0, 1)));
        const th = p.spin * Math.pow(u, 1.6);
        st.transform = `translate(${(x - p.c.x).toFixed(2)}px,${(y - p.c.y).toFixed(2)}px) rotate(${fi.toFixed(4)}rad) scale(${((1 + 1.9 * estica) * sc).toFixed(4)},${(sc / (1 + .7 * estica)).toFixed(4)}) rotate(${(th - fi).toFixed(4)}rad)`;
        st.opacity = u > .85 ? ((1 - u) / .15).toFixed(3) : '';
      }
      // as linhas do vento puxado para a boca
      const g = est.g, env = ss(0, .1, t) * (1 - ss(.52, .66, t));
      g.clearRect(0, 0, ctx.W, ctx.H);
      if(env > 0){
        g.lineCap = 'round'; g.lineWidth = 1.6; g.strokeStyle = ctx.claro ? '#3A4058' : '#DCE4F2';
        for(const L of est.raios){
          const f = (t * L.v + L.f) % 1, cab = L.r0 * Math.pow(1 - f, 1.7), cau = L.r0 * Math.pow(1 - Math.max(0, f - L.l), 1.7);
          if(cab < S * .25) continue;
          g.globalAlpha = env * (1 - f) * .38;
          g.beginPath(); g.moveTo(M.x + Math.cos(L.a) * cau, M.y + Math.sin(L.a) * cau); g.lineTo(M.x + Math.cos(L.a) * cab, M.y + Math.sin(L.a) * cab); g.stroke();
        }
        // o redemoinho no canto: arcos girando cada vez mais rápido, a boca da Deme-chan sem a Deme-chan
        const giro = t * 9 + t * t * 14;
        g.lineWidth = 2.4;
        for(let k = 0; k < 4; k++){
          const r = S * (.12 + k * .11), a0 = giro * (1 - k * .15) + k * 1.3;
          g.globalAlpha = env * (.55 - k * .1);
          g.beginPath(); g.arc(M.x, M.y, r, a0, a0 + 1.1); g.stroke();
          g.beginPath(); g.arc(M.x, M.y, r, a0 + Math.PI, a0 + Math.PI + 1.1); g.stroke();
        }
        g.globalAlpha = 1;
      }
    },
    fim(est, ctx){
      est.lin.remove(); ctx.nova.style.opacity = est.op;
      for(const p of est.ps) Object.assign(p.el.style, p.guarda);
    },
  };
}

function cola(raiz, cfg){ return B.cria(raiz, cfg, def()); }

function liga(palco, cfg){
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

(window.TRANSICOES = window.TRANSICOES || {}).aspira = {cola, liga,
  titulo: 'clique nas abas (ou ligue "trocar sozinho") e veja a aba velha ser sugada para o canto',
  dica: 'os cards de verdade da aba velha são sugados para o canto mais perto do clique (as abas da esquerda puxam para a esquerda; "próxima aba" puxa para a direita), do mais perto ao mais longe: curvam, esticam, giram e somem no redemoinho; a aba nova aparece atrás<br>a aba já vale desde o clique · dura ' + DUR + ' s no total · com "reduzir movimento" no sistema, a troca é seca',
  controles: [{k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
