/* Ganbatte · a barra elétrica do Killua (#134): o gerador do fx-shim novo, no mesmo esquema das correntes do Kurapika.
 * A barra de XP vira a eletricidade do Killua (o Kanmuru): um raio branco-azulado estala dentro do trecho cheio e a ponta
 * solta faíscas, com um arco que pula para o trecho vazio. Raro, não épico: só a barra mexe, nada sai dela pela tela.
 * Tudo sai em SVG (data: URI), em quadros empilhados (sprite): o CSS troca de quadro aos saltos, que é o estalo do raio.
 * - raios(): a tira do raio, QUADROS quadros de altura B, cada um com outro traçado; fecha com a próxima cópia (repeat-x);
 * - faisca(): a ponta, QUADROS quadros de FW × FB, o centro (fx) fica na ponta da barra;
 * - AZUL: as cores (o raio do Killua é branco no meio e azul por fora).
 * Medidas em unidades do desenho: B = 64 é a altura da barra, W = 384 é o período da tira.
 */
(() => {
const B = 64, C = B / 2, W = 384, QUADROS = 3, FW = 120, FB = 96, FC = FB / 2, FX = 40;
const AZUL = {brilho:'#3E8BFF', meio:'#9FD8FF', miolo:'#FFFFFF', fundo:'#173468', fundo2:'#2E6CD0'};
const f1 = n => +n.toFixed(1);
const svg = (w, h, corpo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${corpo}</svg>`;
const uri = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
/* sorteio com semente: o desenho sai sempre igual (o jogo e a vitrine mostram o mesmo raio) */
const sorteio = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const linha = pts => 'M' + pts.map(([x, y]) => f1(x) + ',' + f1(y)).join('L');
/* o traço em três camadas: o halo borrado, o azul do meio e o miolo branco */
const traco = (d, k, l = 1) => `<path d="${d}" fill="none" stroke="${k.brilho}" stroke-width="${14 * l}" opacity=".55" filter="url(#bl)"/>` +
  `<path d="${d}" fill="none" stroke="${k.meio}" stroke-width="${6 * l}"/><path d="${d}" fill="none" stroke="${k.miolo}" stroke-width="${2.4 * l}"/>`;
/* cada quadro é recortado no seu retângulo: o halo não vaza para o quadro de baixo */
const defs = (w, h) => `<defs><filter id="bl" filterUnits="userSpaceOnUse" x="-12" y="-12" width="${w + 24}" height="${h + 24}"><feGaussianBlur stdDeviation="4"/></filter>` +
  `<clipPath id="q"><rect width="${w}" height="${h}"/></clipPath></defs>`;
const junta = 'stroke-linejoin="round" stroke-linecap="round"';

/* um raio de 0 a W que começa e termina no meio (a cópia seguinte continua dele): deslocamento do ponto médio, que dá os
   trechos longos e os dentes curtos de um raio de verdade; um segundo raio mais fraco por trás e um ou dois galhos */
function trilha(r, amp, nivel){
  let pts = [[0, C], [W, C]];
  for(let n = 0; n < nivel; n++, amp *= .62){
    const nv = [pts[0]];
    for(let i = 1; i < pts.length; i++){
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      nv.push([(x0 + x1) / 2 + (r() - .5) * (x1 - x0) * .3, Math.max(9, Math.min(B - 9, (y0 + y1) / 2 + (r() - .5) * 2 * amp))], pts[i]);
    }
    pts = nv;
  }
  return pts;
}
function raio(r, k){
  const pts = trilha(r, B * .46, 5);
  let galhos = '';
  for(let g = 0; g < 1 + (r() < .6); g++){
    const i = 2 + Math.floor(r() * (pts.length - 4)), [x0, y0] = pts[i], v = y0 < C ? -1 : 1;
    const gp = [[x0, y0]]; let x = x0, y = y0;
    for(let s = 0; s < 3; s++){ x += 7 + r() * 10; y += v * (4 + r() * 6); if(y < 8 || y > B - 8) break; gp.push([x, y]); }
    galhos += traco(linha(gp), k, .5);
  }
  return `<g ${junta}><g opacity=".45">${traco(linha(trilha(r, B * .34, 5)), k, .5)}</g>${galhos}${traco(linha(pts), k)}</g>`;
}
function raios(k = AZUL, semente = 7){
  const r = sorteio(semente);
  let q = '';
  for(let i = 0; i < QUADROS; i++) q += `<g transform="translate(0 ${i * B})"><g clip-path="url(#q)">${raio(r, k)}</g></g>`;
  return svg(W, B * QUADROS, defs(W, B) + q);
}

/* a ponta: o miolo aceso e os raios curtos em volta; um deles, mais comprido, pula para a frente (o trecho vazio) */
function ponta(r, k){
  let q = '';
  const n = 3 + Math.floor(r() * 2);
  for(let i = 0; i < n; i++){
    const a = (i / n) * Math.PI * 2 + r() * .8, comp = 12 + r() * 14;
    const pts = [[FX, FC]]; let d = 0;
    while(d < comp){ d += 4 + r() * 4; const t = a + (r() - .5) * 1.3; pts.push([FX + Math.cos(t) * d, FC + Math.sin(t) * d]); }
    q += traco(linha(pts), k, .7);
  }
  const arco = [[FX, FC]], alcance = FW - FX - 10 - r() * 34;
  for(let x = FX; x < FX + alcance;){ x += 8 + r() * 8; arco.push([Math.min(x, FW - 6), FC + (r() - .5) * FB * .34]); }
  q += traco(linha(arco), k, .75);
  return q + `<circle cx="${FX}" cy="${FC}" r="18" fill="${k.brilho}" opacity=".8" filter="url(#bl)"/>` +
    `<circle cx="${FX}" cy="${FC}" r="10" fill="${k.meio}"/><circle cx="${FX}" cy="${FC}" r="6" fill="${k.miolo}"/>`;
}
function faisca(k = AZUL, semente = 11){
  const r = sorteio(semente);
  let q = '';
  for(let i = 0; i < QUADROS; i++) q += `<g transform="translate(0 ${i * FB})"><g clip-path="url(#q)" ${junta}>${ponta(r, k)}</g></g>`;
  return {svg:svg(FW, FB * QUADROS, defs(FW, FB) + q), W:FW, H:FB, fx:FX};
}

window.GB_ELETRICA = {B, W, QUADROS, AZUL, raios, faisca, uri};
})();
