/* fx-shake, Fúria visível (#134): o chefão em fúria (a nota que falta passou da média) solta o Ren. Hoje ele só treme sem
   parar. Aqui: labaredas de aura vermelha em volta do anel, desenhadas em três quadros que trocam aos saltos (o "fervor"
   do desenho animado, chapado como os carimbos, sem brilho) e, a cada ~2,8 s, um acesso de raiva: a veia 💢 do mangá salta
   no canto, as labaredas sobem e o anel dá um tranco curto. Entre um acesso e outro ele fica parado, com as chamas.
   Só CSS (gerado aqui uma vez): as chamas são uma máscara SVG na cor --red do tema, a veia é um SVG com contorno de tinta.
   Pede um elemento sem overflow:hidden (no jogo, o retrato do chefão recorta: lá a imagem ganha o border-radius e o
   .av perde o overflow).

   GB_FURIA.css(sel, op) -> texto CSS para os elementos em fúria (ex.: '.ring.fury')
     op.veia    a veia 💢 no acesso (padrão true)
     op.tranco  o tranco do anel no acesso (padrão true)
     op.ciclo   segundos entre um acesso e outro (padrão 2.8) */
(function(){
const TAU = Math.PI * 2;
const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const n1 = v => Math.round(v * 10) / 10;
const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* um quadro das labaredas: línguas de fogo saindo do contorno e puxadas para cima (fogo sobe), altas em cima e quase nada
   embaixo, com as laterais em S; um aro fino na base as une. Entre o anel e o fogo fica uma folga, para a vida ler */
function quadro(seed){
  const r = sorteio(seed), R0 = 30, N = 11, ps = [];
  const P = (x, y) => `${n1(x)} ${n1(y)}`;
  for(let i = 0; i < N; i++){
    const a = (i + (r() - .5) * .5) / N * TAU - Math.PI / 2, cx = Math.cos(a), cy = Math.sin(a);
    const cima = Math.max(0, -cy), L = 3 + 18 * Math.pow(cima, 1.4) * (.65 + r() * .5) + 5 * (1 - Math.abs(cy)) * r();
    const w = TAU / N * (.55 + r() * .2);
    /* direção da ponta: entre a radial e o alto, mais para o alto quanto mais longe da base */
    const dx = cx * .45, dy = cy * .45 - .55, dn = Math.hypot(dx, dy), tx = 50 + cx * R0 + dx / dn * L, ty = 50 + cy * R0 + dy / dn * L;
    const b1x = 50 + Math.cos(a - w) * R0, b1y = 50 + Math.sin(a - w) * R0, b2x = 50 + Math.cos(a + w) * R0, b2y = 50 + Math.sin(a + w) * R0;
    const ond = (r() - .5) * 4;   // a curva em S das laterais
    ps.push(`M${P(b1x, b1y)}C${P(b1x + dx / dn * L * .5 + ond, b1y + dy / dn * L * .45)} ${P(tx - ond * 1.5, ty + L * .35)} ${P(tx, ty)}`
      + `C${P(tx + ond, ty + L * .4)} ${P(b2x + dx / dn * L * .35 - ond, b2y + dy / dn * L * .5)} ${P(b2x, b2y)}Z`);
  }
  const o = R0 + 1.6;
  const aro = `M50 ${50 - o}a${o} ${o} 0 1 1 0 ${2 * o}a${o} ${o} 0 1 1 0 ${-2 * o}ZM50 ${50 - R0 + .4}a${R0 - .4} ${R0 - .4} 0 1 0 0 ${2 * (R0 - .4)}a${R0 - .4} ${R0 - .4} 0 1 0 0 ${-2 * (R0 - .4)}Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill-rule="evenodd" d="${aro}"/><path d="${ps.join('')}"/></svg>`;
}
/* a veia de raiva do mangá: quatro arcos em cruz, vermelho com contorno de tinta */
const VEIA = (() => {
  const d = 'M4 9.5Q9.5 9.5 9.5 4M14.5 4Q14.5 9.5 20 9.5M20 14.5Q14.5 14.5 14.5 20M9.5 20Q9.5 14.5 4 14.5';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="${d}" stroke="#1E0A0E" stroke-width="5.4"/><path d="${d}" stroke="#FF4D5E" stroke-width="3"/><path d="${d}" stroke="#FFB3BB" stroke-width=".9" transform="translate(-.5 -.5)"/></svg>`;
})();
const QUADROS = [11, 23, 37].map(quadro).map(uri);

function css(sel, op0){
  const op = Object.assign({veia:true, tranco:true, ciclo:2.8}, op0), c = op.ciclo + 's';
  const S = sel.split(',').map(s => s.trim()), em = suf => S.map(s => s + suf).join(',');
  return `
${em('')}{position:relative;isolation:isolate;animation:gbFuGlow ${c} ease-out infinite${op.tranco ? `,gbFuTranco ${c} linear infinite` : ''}}
${em('::before')}{content:"";position:absolute;inset:-42%;z-index:-1;pointer-events:none;background:var(--red);
  -webkit-mask:${QUADROS[0]} center/100% 100% no-repeat;mask:${QUADROS[0]} center/100% 100% no-repeat;
  opacity:.7;animation:gbFuFerve .36s steps(1) infinite,gbFuSobe ${c} ease-out infinite}
${op.veia ? `${em('::after')}{content:"";position:absolute;right:-22%;top:-22%;width:52%;height:52%;min-width:13px;min-height:13px;z-index:2;pointer-events:none;
  background:${uri(VEIA)} center/contain no-repeat;transform:scale(0);animation:gbFuVeia ${c} linear infinite}` : ''}
@keyframes gbFuFerve{0%{-webkit-mask-image:${QUADROS[0]};mask-image:${QUADROS[0]}}33.3%{-webkit-mask-image:${QUADROS[1]};mask-image:${QUADROS[1]}}66.6%{-webkit-mask-image:${QUADROS[2]};mask-image:${QUADROS[2]}}}
@keyframes gbFuSobe{0%,58%{transform:scale(1);opacity:.62}63%{transform:scale(1.16) translateY(-5%);opacity:.95}80%{transform:scale(1.05);opacity:.8}100%{transform:scale(1);opacity:.62}}
@keyframes gbFuVeia{0%,58%{transform:scale(0) rotate(-20deg)}62%{transform:scale(1.35) rotate(6deg)}66%{transform:scale(.88) rotate(-3deg)}70%{transform:scale(1.06) rotate(0)}
  76%{transform:scale(.97)}82%{transform:scale(1.04)}90%{transform:scale(1);opacity:1}96%,100%{transform:scale(.6);opacity:0}}
@keyframes gbFuTranco{0%,59%,73%,100%{translate:0 0}61%{translate:-2px 1px}63%{translate:2px -1px}65%{translate:-2px 0}67%{translate:1px 1px}70%{translate:-1px 0}}
@keyframes gbFuGlow{0%,58%{box-shadow:0 0 0 0 transparent}63%{box-shadow:0 0 14px 2px color-mix(in srgb,var(--red) 55%,transparent)}100%{box-shadow:0 0 0 0 transparent}}
@media (prefers-reduced-motion:reduce){${em('')},${em('::before')},${em('::after')}{animation:none}${em('::after')}{transform:scale(1)}}`;
}
window.GB_FURIA = {css, QUADROS, VEIA};
})();
