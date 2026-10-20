/* Ganbatte · a corrente do Kurapika (#134, #142): um gerador só para todos os itens da família.
 * O elo é o da licença (lic-corrente, 17/10), que vem do corrente-elo aprovado: elo de frente (oval com bisel) e elo de
 * lado (barra) alternados, aço claro com contorno escuro. Tudo sai em SVG (data: URI), então a espessura muda sem borrar.
 * Cada item leva a marca de uma corrente da mão do Kurapika:
 * - faixa(): a tira periódica (barra de XP, vida do chefão);
 * - borda(): a imagem do border-image, com uma argola em cada canto;
 * - pendulo(): a Dowsing Chain (indicador), a esfera pendurada no canto da borda;
 * - lamina(): a Judgment Chain (anelar), a lâmina na ponta da barra de XP;
 * - ESCARLATE: as cores da corrente vermelha (a vida do chefão).
 * Medidas em unidades do desenho: B = 64 é a faixa (a altura da tira), L = 104 é o período (um elo de frente + um de lado).
 */
(() => {
const B = 64, L = 104, C = B / 2;
const COR = {tinta:'#2E3038', metal:'#ECEDF1', bisel:'#A9AEB9'};
const f1 = n => +n.toFixed(2);
const frente = (x, y, a = 0, s = 1, k = COR) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${s})">` +
  `<ellipse rx="31" ry="17" fill="none" stroke="${k.tinta}" stroke-width="16"/>` +
  `<ellipse rx="31" ry="17" fill="none" stroke="${k.metal}" stroke-width="9"/>` +
  `<ellipse rx="29" ry="15" cx="1.5" cy="1.5" fill="none" stroke="${k.bisel}" stroke-width="2.5"/></g>`;
const lado = (x, y, a = 0, s = 1, k = COR) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${s})">` +
  `<rect x="-33" y="-7" width="66" height="14" rx="7" fill="${k.metal}" stroke="${k.tinta}" stroke-width="5"/>` +
  `<path d="M-22,2H22" stroke="${k.bisel}" stroke-width="3" stroke-linecap="round"/></g>`;
const svg = (w, h, corpo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${corpo}</svg>`;
const uri = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

/* a tira: um elo de frente no meio e meio elo de lado em cada ponta, que fecha com a próxima cópia */
function faixa(k = COR){
  return svg(L, B, frente(L / 2, C, 0, 1, k) + lado(0, C, 0, 1, k) + lado(L, C, 0, 1, k));
}

/* a borda: S = 2B + L; cantos de B×B e o meio de cada lado é uma tira (border-image-slice B, repeat round).
   Os elos de lado ficam na emenda entre canto e lado, cada fatia desenha a sua metade; no canto, uma argola recebe as duas pontas. */
const argola = (x, y, k = COR) => `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${k.tinta}" stroke-width="15"/>` +
  `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${k.metal}" stroke-width="8"/>` +
  `<path d="M${x - 11},${y + 6}A12.5 12.5 0 0 0 ${x + 6},${y + 11}" fill="none" stroke="${k.bisel}" stroke-width="2.5" stroke-linecap="round"/>`;
function borda(k = COR){
  const S = 2 * B + L, E = S - C;
  let fr = '', ld = '';
  for(const [x, y] of [[C, C], [E, C], [E, E], [C, E]]) fr += argola(x, y, k);
  fr += frente(B + L / 2, C, 0, 1, k) + frente(B + L / 2, E, 0, 1, k) + frente(C, B + L / 2, 90, 1, k) + frente(E, B + L / 2, 90, 1, k);
  for(const p of [B, B + L]) ld += lado(p, C, 0, 1, k) + lado(p, E, 0, 1, k) + lado(C, p, 90, 1, k) + lado(E, p, 90, 1, k);
  return svg(S, S, fr + ld);
}

/* Dowsing Chain: n elos (do tamanho dos da borda) descendo da argola do canto e a esfera.
   A ponta de cima (ax, ay) é o centro da argola: o CSS põe esse ponto no centro dela. */
function pendulo(n = 2, k = COR, acento = ''){
  const R = 44, W = 2 * R + 14, ax = W / 2, ay = 16;
  let fr = '', ld = '', y = ay - 26;   // o primeiro elo prende na argola pela ponta de dentro
  for(let i = 0; i < n; i++){ y += L / 2; (i % 2 ? ld += lado(ax, y, 90, 1, k) : fr += frente(ax, y, 90, 1, k)); }
  const topo = n ? y + (n % 2 ? 20 : 30) : ay + 6, cy = topo + 10 + R;
  const brilho = acento ? `<circle cx="${ax}" cy="${cy}" r="${R - 10}" fill="${acento}" opacity=".3"/>` : '';
  const esfera = `<rect x="${ax - 9}" y="${topo - 4}" width="18" height="16" rx="3" fill="${k.bisel}" stroke="${k.tinta}" stroke-width="5"/>` +
    `<circle cx="${ax}" cy="${cy}" r="${R}" fill="${k.metal}" stroke="${k.tinta}" stroke-width="8"/>` +
    `<path d="M${ax - R + 9},${cy + 7}A${R - 9} ${R - 9} 0 0 0 ${ax + R - 9},${cy + 7}" fill="none" stroke="${k.bisel}" stroke-width="7" stroke-linecap="round"/>` +
    brilho + `<ellipse cx="${ax - 13}" cy="${cy - 14}" rx="9" ry="6" fill="#fff" transform="rotate(-30 ${ax - 13} ${cy - 14})"/>`;
  return {svg:svg(W, Math.ceil(cy + R + 6), fr + ld + esfera), W, H:Math.ceil(cy + R + 6), ax, ay};
}

/* Judgment Chain: o ilhós (onde a corrente entra), a guarda e a lâmina apontando para a direita, na altura da faixa (B).
   O centro do ilhós (ix) fica na ponta da barra; o fundo escuro dele esconde o corte do último elo. */
function lamina(k = COR){
  const W = 84, ix = 20;
  return {W, ix, svg:svg(W, B, `<circle cx="${ix}" cy="${C}" r="14" fill="${k.tinta}" stroke="${k.tinta}" stroke-width="12"/>` +
    `<circle cx="${ix}" cy="${C}" r="14" fill="none" stroke="${k.metal}" stroke-width="6"/>` +
    `<rect x="35" y="${C - 20}" width="9" height="40" rx="3" fill="${k.bisel}" stroke="${k.tinta}" stroke-width="4"/>` +
    `<path d="M44,${C - 13}H62L${W - 4},${C}L62,${C + 13}H44Z" fill="${k.metal}" stroke="${k.tinta}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M47,${C}H${W - 12}" stroke="${k.bisel}" stroke-width="3" stroke-linecap="round"/>`)};
}

/* o escarlate (Emperor Time): a corrente da vida do chefão */
const ESCARLATE = {tinta:'#2A0910', metal:'#F0405C', bisel:'#A3162F'};

window.GB_CORRENTE = {B, L, COR, ESCARLATE, faixa, borda, pendulo, lamina, uri};
})();
