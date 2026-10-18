// A licença hunter redesenhada (lic-cartao, #134), para o provador da Loja da Associação mostrar a versão nova ao lado
// da de hoje. Vem do docs/lojas/arte/licenca/prototipo.html (o mesmo cartão e os mesmos estojos), mas com os dados
// reais de quem vê: o cartão segue a licença do anime (painel preto com o emblema e a foto; o azul com a faixa, o nome
// na caixa e as linhas; no verso a tarja e o número em caixinhas), com lugar fixo para as 3 estrelas, o carimbo (campo
// tracejado no canto) e o emblema (a aranha e a coroa soltas no preto). O estojo é uma moldura em SVG em volta.
//   GB_LIC.peca('h' | 'v', 'frente' | 'verso', o, largura)   o = {est, cor, emb, car, st, fx, d}
//   est: padrao | preto | ouro | ouro-chanfro | ouro-losangos | corrente · cor: azul | verde | escarlate · emb: hunter |
//   aranha | rei · car: lic-exame | lic-chefao | lg-exame · st: 0 a 3 · fx: brilho | holo
//   d = {foto, nome, faixa, num: [a, b, c], linhas: [html], glifo, placares: [[posição, html]], curso: [html], registro: [html]}
(() => {
const EMBLEMA = '<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M60 10 L84 35 L60 60 L36 35 Z" fill="#C8102E"/><path d="M12 10 L60 60 M60 10 L12 60 M60 10 L108 60 M108 10 L60 60" stroke="#141418" stroke-width="7" fill="none"/><path d="M3 10 H23 M50 10 H70 M97 10 H117 M3 60 H23 M50 60 H70 M97 60 H117" stroke="#141418" stroke-width="3.5"/></svg>';
const COROA = '<svg viewBox="20 6 80 60" aria-hidden="true"><path d="M28 54 L22 18 L42 36 L60 10 L78 36 L98 18 L92 54 Z" fill="#E8C35A" stroke="#6E5418" stroke-width="2"/><rect x="27" y="54" width="66" height="8" rx="2" fill="#E8C35A" stroke="#6E5418" stroke-width="2"/><circle cx="60" cy="40" r="5" fill="#C8102E"/><circle cx="42" cy="44" r="3.4" fill="#2F6FD0"/><circle cx="78" cy="44" r="3.4" fill="#2F6FD0"/></svg>';
const ESTRELA = 'M12 2l2.9 6.5 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.7z';
let UID = 0;
const IMG = n => (window.GB_ARTE_IMG || {})[n] || `arte/${n}.png`;   // no modo demonstração (standalone.py) as imagens vêm embutidas

const CSS = `
.lic2{position:relative;flex:none;max-width:100%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.35))}
.lic2>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.lic2>svg.na-frente{pointer-events:none;z-index:3}
.lic2 .cartao{position:relative;container-type:inline-size;--lk:#17171B;--lb:#BBDDF5;--lb2:#EEF7FD;--gl:#9CCBEC;--ac:#1F5FA8;--lt:#141418;
  color:var(--lt);background:#E2E4EA;overflow:hidden;font-family:var(--f-mono);display:grid}
.lic2 .cartao.h{aspect-ratio:1.56;border-radius:3%/4.7%;grid-template-columns:38% 1fr}
.lic2 .cartao.v{aspect-ratio:.641;border-radius:4%/2.56%;grid-template-rows:48% 1fr}
.lic2 .cartao.cor-verde{--lb:#BFE8CF;--lb2:#EEFBF2;--gl:#93D3AC;--ac:#1E7A47}
.lic2 .cartao.cor-escarlate{--lb:#F5C2C8;--lb2:#FDF0F2;--lk:#2A0A10;--gl:#E9A4AF;--ac:#A3203A}
.lic2 .topo{background:var(--lk);position:relative;display:grid;justify-items:center;align-content:center}
.lic2 .h .topo{gap:3.2cqw;padding:3cqw 0 8cqw}
.lic2 .v .topo{gap:4cqw;padding:5cqw 0 13cqw}
.lic2 .emb{background:#fff;display:grid;place-items:center;padding:1.3cqw 2.4cqw;width:24cqw}
.lic2 .v .emb{width:36cqw;padding:2cqw 3.6cqw}
.lic2 .emb svg,.lic2 .emb img{width:100%;height:auto;display:block}
.lic2 .emb.solto{background:none;padding:0}
.lic2 .h .emb.solto{width:17cqw} .lic2 .v .emb.solto{width:26cqw}
.lic2 .foto{width:22cqw;aspect-ratio:1;display:block;object-fit:contain}
.lic2 .v .foto{width:30cqw}
.lic2 .estrelas{position:absolute;left:0;right:0;display:flex;justify-content:center}
.lic2 .h .estrelas{bottom:2.6cqw;gap:1.6cqw} .lic2 .v .estrelas{bottom:4cqw;gap:3cqw}
.lic2 .estrelas svg{width:4.4cqw;height:4.4cqw} .lic2 .v .estrelas svg{width:7.6cqw;height:7.6cqw}
.lic2 .estrelas .vazia{fill:none;stroke:#ffffff45;stroke-width:1.3;stroke-dasharray:2 1.7}
.lic2 .estrelas .cheia{fill:#E8C35A;stroke:#7A5A12;stroke-width:1}
.lic2 .azul{position:relative;background:linear-gradient(180deg,#FFFFFF 0%,var(--lb) 100%);display:grid;align-content:start;min-width:0}
.lic2 .h .azul{padding:3.6cqw 4cqw;gap:2cqw}
.lic2 .v .azul{padding:5cqw 7cqw;gap:3cqw}
.lic2 .guil{position:absolute;inset:0;width:100%;height:100%;color:var(--gl);pointer-events:none}
.lic2 .azul>:not(.guil){position:relative}
.lic2 .faixa{background:repeating-linear-gradient(90deg,#666 0 .35cqw,transparent .35cqw 1.3cqw) left/11% 100% no-repeat,repeating-linear-gradient(90deg,transparent 0 .9cqw,#666 .9cqw 1.25cqw) right/11% 100% no-repeat,#F2F2F2;
  color:#222;text-align:center;font-weight:700;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:1.9cqw;padding:1.6cqw 6.5cqw}
.lic2 .v .faixa{font-size:3cqw;padding:2.4cqw 10cqw}
.lic2 .nomebox{border:.7cqw solid var(--lt);background:#FFFFFF;font:700 5cqw/1.2 var(--f-hud);letter-spacing:.06em;padding:1cqw 2.2cqw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lic2 .v .nomebox{font-size:8cqw;border-width:1cqw;padding:1.4cqw 3.4cqw}
.lic2 .lls{display:grid;font-weight:600;color:#222;font-size:2.2cqw;gap:.8cqw} .lic2 .lls b{font-weight:800;color:var(--lt)}
.lic2 .lls span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lic2 .v .lls{font-size:3.1cqw;gap:1.3cqw}
.lic2 .tt-glifo{display:block;max-width:100%;height:1.9cqw;width:auto;color:#2A2A30}
.lic2 .v .tt-glifo{height:2.9cqw;max-width:52%}
.lic2 .visto{position:absolute!important;border:.3cqw dashed color-mix(in srgb,var(--ac) 40%,transparent);border-radius:1.4cqw}
.lic2 .h .visto{right:3.4cqw;bottom:3.4cqw;width:18cqw;height:18cqw}
.lic2 .v .visto{right:6cqw;bottom:5cqw;width:30cqw;height:30cqw}
.lic2 .visto img{position:absolute;left:50%;top:50%;width:104%;transform:translate(-50%,-50%) rotate(-11deg);mix-blend-mode:multiply;opacity:.88}
.lic2 .cartao.verso{display:block;background:linear-gradient(180deg,var(--lb2),var(--lb))}
.lic2 .cartao.verso>*{position:absolute}
.lic2 .tarja{left:0;right:0;background:#1A0B0B}
.lic2 .h .tarja{top:7cqw;height:10cqw} .lic2 .v .tarja{top:10cqw;height:14cqw}
.lic2 .numq{display:flex;gap:.8cqw}
.lic2 .numq i{font-style:normal;display:grid;place-items:center;border:.5cqw solid var(--lt);border-radius:1.2cqw;font-weight:800;width:4.4cqw;height:4.4cqw;font-size:2.4cqw}
.lic2 .numq .esp{width:2.4cqw}
.lic2 .h .numq{left:4cqw;top:21cqw}
.lic2 .v .numq{left:6cqw;top:30cqw;gap:.9cqw} .lic2 .v .numq i{width:6cqw;height:6.6cqw;font-size:3.6cqw} .lic2 .v .numq .esp{width:2cqw}
.lic2 .vinfo{display:grid;gap:2cqw 4cqw;font-size:2.1cqw}
.lic2 .h .vinfo{left:4cqw;right:4cqw;top:30cqw;grid-template-columns:1fr 1fr}
.lic2 .v .vinfo{left:7cqw;right:7cqw;top:44cqw;grid-template-columns:1fr;font-size:3.4cqw;gap:4cqw}
.lic2 h5{margin:0 0 .8cqw;font-size:.85em;letter-spacing:.14em;color:#3A3D4A}
.lic2 .vinfo ul{list-style:none;margin:0;padding:0;display:grid;gap:.6cqw} .lic2 .vinfo li{display:flex;gap:1.6cqw;align-items:baseline;white-space:nowrap;overflow:hidden}
.lic2 .vinfo .q{display:inline-grid;place-items:center;min-width:1.9em;height:1.5em;border-radius:99px;font-weight:800;background:#FFFFFFAA;font-size:.9em}
.lic2 .vinfo .q.m1{background:#E8C35A} .lic2 .vinfo .q.m2{background:#D5D9E2} .lic2 .vinfo .q.m3{background:#E2A877}
.lic2 .fx{position:absolute;inset:0;pointer-events:none;z-index:5}
.lic2 .fx.holo{background:linear-gradient(115deg,#BFE8FF,#E4D2FF,#FFD2E6,#FFF1BF,#D2F5C4,#BFE8FF);background-size:300% 100%;mix-blend-mode:multiply;opacity:.75}
.lic2 .fx.brilho{background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 45%,transparent 60%);background-size:250% 100%;background-position:120% 0}
@media (prefers-reduced-motion:no-preference){
  .lic2 .fx.holo{animation:lic2Holo 6s linear infinite}
  .lic2 .fx.brilho{animation:lic2Brilho 2.8s ease-in-out infinite}
}
@keyframes lic2Holo{to{background-position:300% 0}}
@keyframes lic2Brilho{from{background-position:120% 0}to{background-position:-120% 0}}`;
const st = document.createElement('style'); st.id = 'gb-lic2'; st.textContent = CSS; document.head.appendChild(st);

/* guilhochê leve: ondas entrelaçadas, só no azul e no verso */
function guilloche(w, h){
  let d = '';
  for(let y0 = 30; y0 < h; y0 += 120) for(let k = 0; k < 3; k++){
    let p = '';
    for(let x = 0; x <= w; x += 12){ const y = y0 + 30 * Math.sin(2 * Math.PI * x / 240 + k * Math.PI * 2 / 3); p += (p ? 'L' : 'M') + x + ' ' + y.toFixed(1); }
    d += p;
  }
  return `<svg class="guil" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".35"/></svg>`;
}

const emblema = e => e === 'aranha' ? `<div class="emb solto"><img src="${IMG('lic-emb-aranha')}" alt=""></div>`
  : e === 'rei' ? `<div class="emb solto">${COROA}</div>` : `<div class="emb">${EMBLEMA}</div>`;
const estrelas = n => `<div class="estrelas">${[0,1,2].map(i => `<svg viewBox="0 0 24 24"><path class="${i < n ? 'cheia' : 'vazia'}" d="${ESTRELA}"/></svg>`).join('')}</div>`;
const fx = o => o.fx ? `<div class="fx ${o.fx}"></div>` : '';

function frente(or, o){
  const d = o.d;
  return `<div class="cartao ${or} frente cor-${o.cor || 'azul'}">
    <div class="topo">${emblema(o.emb)}${d.foto ? `<img class="foto" src="${d.foto}" alt="">` : '<span class="foto"></span>'}${estrelas(o.st || 0)}</div>
    <div class="azul">${guilloche(or === 'h' ? 970 : 1000, or === 'h' ? 1000 : 870)}<div class="faixa">${d.faixa}</div><div class="nomebox">${d.nome}</div>
      <div class="lls">${d.linhas.map(l => `<span>${l}</span>`).join('')}</div>
      ${d.glifo}
      <div class="visto">${o.car ? `<img src="${IMG(o.car)}" alt="">` : ''}</div></div>${fx(o)}</div>`;
}

function verso(or, o){
  const d = o.d, num = d.num.map((n, i) => [...n].map(c => `<i>${c}</i>`).join('') + (i < 2 ? '<span class="esp"></span>' : '')).join('');
  return `<div class="cartao ${or} verso cor-${o.cor || 'azul'}">${guilloche(or === 'h' ? 1560 : 1000, or === 'h' ? 1000 : 1560)}
    <div class="tarja"></div><div class="numq">${num}</div>
    <div class="vinfo"><div><h5>PLACARES</h5><ul>${d.placares.map(([k, n]) => `<li><span class="q${k <= 3 ? ' m' + k : ''}">${k}º</span>${n}</li>`).join('') || '<li>nenhum ainda</li>'}</ul></div>
      <div><h5>EM CURSO</h5><ul>${d.curso.map(l => `<li>${l}</li>`).join('')}</ul><h5 style="margin-top:2cqw">REGISTRO</h5><ul>${d.registro.map(l => `<li>${l}</li>`).join('')}</ul></div></div>${fx(o)}</div>`;
}

/* ---------- estojo em SVG: moldura com sobra m em volta do cartão ---------- */
function rrect(x, y, w, h, r){ return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`; }

function estojo(or, tipo){
  const cw = or === 'h' ? 1560 : 1000, ch = or === 'h' ? 1000 : 1560, m = 64;
  const rc = or === 'h' ? 47 : 40, R = rc + m;
  const W = cw + 2 * m, H = ch + 2 * m;
  const card = {x: m, y: m, w: cw, h: ch};
  const corpo = i => rrect(i, i, W - 2 * i, H - 2 * i, R - i);
  const jan = k => rrect(card.x - k, card.y - k, card.w + 2 * k, card.h + 2 * k, rc + k);
  const u = 'lic2e' + (UID++);
  let tras = '', frente = '';

  if(tipo === 'padrao'){   // o cinza de hoje, com espessura
    tras = `<path d="${corpo(0)}" fill="#E2E4EA" stroke="#9AA0B0" stroke-width="5"/>
      <path d="${corpo(10)}" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>
      <path d="${jan(6)}" fill="#9AA0B0"/>`;
  }
  if(tipo === 'preto'){   // couro com costura, a borda cobre um pouco do cartão
    tras = `<filter id="${u}g"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <path d="${corpo(0)}" fill="#24252B" stroke="#0E0E11" stroke-width="6"/>
      <path d="${corpo(0)}" fill="#fff" filter="url(#${u}g)"/>
      <path d="${corpo(20)}" fill="none" stroke="#B89A6A" stroke-width="4" stroke-dasharray="16 11" stroke-linecap="round"/>
      <path d="${jan(6)}" fill="#0E0E11"/>`;
    frente = `<path d="${jan(0)}" fill="none" stroke="#24252B" stroke-width="18"/>
      <path d="${jan(20)}" fill="none" stroke="#B89A6A" stroke-width="4" stroke-dasharray="16 11" stroke-linecap="round"/>`;
  }
  if(tipo.startsWith('ouro')){   // dourado chapado, como os carimbos: ouro liso, contorno de tinta, um detalhe só
    const OURO = '#D9AC4E', ESC = '#9C7224', TINTA = '#2B1D14', VERM = '#C8102E';
    const los = (x, y, s, cor, tr) => `<path d="M${x},${y - s}L${x + s},${y}L${x},${y + s}L${x - s},${y}Z" fill="${cor}"${tr ? ` stroke="${TINTA}" stroke-width="${tr}"` : ''}/>`;
    const c = m / 2, rr = R - c, dg = R - rr * Math.SQRT1_2;   // meio da faixa e o ponto da curva no canto
    if(tipo === 'ouro'){   // filete: uma linha no meio da faixa, o losango vermelho do emblema em cima e embaixo
      tras = `<path d="${corpo(0)}" fill="${OURO}" stroke="${TINTA}" stroke-width="6"/>
        <path d="${corpo(c)}" fill="none" stroke="${ESC}" stroke-width="4"/>
        ${los(W / 2, c, 22, OURO)}${los(W / 2, H - c, 22, OURO)}${los(W / 2, c, 13, VERM, 3)}${los(W / 2, H - c, 13, VERM, 3)}
        <path d="${jan(5)}" fill="${TINTA}"/>`;
    }
    if(tipo === 'ouro-chanfro'){   // cantos cortados retos (o visual Nen), filete e um cravo em cada canto
      const k = or === 'h' ? 96 : 84;
      const chanfro = i => { const x0 = i, y0 = i, x1 = W - i, y1 = H - i, q = k - i * .41;
        return `M${x0 + q},${y0}H${x1 - q}L${x1},${y0 + q}V${y1 - q}L${x1 - q},${y1}H${x0 + q}L${x0},${y1 - q}V${y0 + q}Z`; };
      const p = 70;
      tras = `<path d="${chanfro(0)}" fill="${OURO}" stroke="${TINTA}" stroke-width="6" stroke-linejoin="miter"/>
        <path d="${chanfro(c - 6)}" fill="none" stroke="${ESC}" stroke-width="4"/>
        <path d="${jan(5)}" fill="${TINTA}"/>`;
      frente = [[p, p], [W - p, p], [p, H - p], [W - p, H - p]].map(([x, y]) => los(x, y, 13, ESC, 3)).join('');
    }
    if(tipo === 'ouro-losangos'){   // uma fileira de losangos gravados (o do emblema), vermelhos nos cantos
      let fila = '';
      const reta = (x0, y0, x1, y1) => { const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 46);
        for(let t = 0; t <= n; t++) fila += los(x0 + (x1 - x0) * t / n, y0 + (y1 - y0) * t / n, 8, ESC); };
      reta(R + 30, c, W - R - 30, c); reta(R + 30, H - c, W - R - 30, H - c); reta(c, R + 30, c, H - R - 30); reta(W - c, R + 30, W - c, H - R - 30);
      tras = `<path d="${corpo(0)}" fill="${OURO}" stroke="${TINTA}" stroke-width="6"/>${fila}
        ${[[dg, dg], [W - dg, dg], [dg, H - dg], [W - dg, H - dg]].map(([x, y]) => los(x, y, 15, VERM, 3)).join('')}
        <path d="${jan(5)}" fill="${TINTA}"/>`;
    }
    frente = `<path d="${jan(0)}" fill="none" stroke="${TINTA}" stroke-width="4"/>` + frente;
  }
  if(tipo === 'corrente'){   // a corrente do Kurapika dando a volta na moldura, com os elos da arte aprovada
    tras = `<path d="${corpo(0)}" fill="#3A3D46" stroke="#17181D" stroke-width="6"/>
      <path d="${corpo(12)}" fill="none" stroke="#5A5E6A" stroke-width="3"/>
      <path d="${jan(6)}" fill="#17181D"/>`;
    const face = (x, y, a) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a})"><ellipse rx="31" ry="17" fill="none" stroke="#2E3038" stroke-width="16"/><ellipse rx="31" ry="17" fill="none" stroke="#ECEDF1" stroke-width="9"/><ellipse rx="29" ry="15" cx="1.5" cy="1.5" fill="none" stroke="#A9AEB9" stroke-width="2.5"/></g>`;
    const lado = (x, y, a) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a})"><rect x="-33" y="-7" width="66" height="14" rx="7" fill="#ECEDF1" stroke="#2E3038" stroke-width="5"/><path d="M-22,2H22" stroke="#A9AEB9" stroke-width="3" stroke-linecap="round"/></g>`;
    const reta = (x0, y0, x1, y1) => { const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 52), a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI; let s = '';
      for(let k = 0; k <= n; k++){ const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; s += k % 2 ? lado(x, y, a) : face(x, y, a); } return s; };
    const c = m / 2, r = R - c;
    let elos = reta(R, c, W - R, c) + reta(W - c, R, W - c, H - R) + reta(W - R, H - c, R, H - c) + reta(c, H - R, c, R);
    for(const [x, y, a] of [[R, R, 225], [W - R, R, 315], [W - R, H - R, 45], [R, H - R, 135]]){
      const t = a * Math.PI / 180; elos += lado(x + r * Math.cos(t), y + r * Math.sin(t), a + 90);
    }
    frente = elos;
  }
  return {W, H, card, tras, frente};
}

function peca(or, face, o, largura){
  const e = estojo(or, o.est || 'padrao');
  const pc = (v, t) => (v / t * 100).toFixed(3) + '%';
  return `<div class="lic2" style="width:${largura}px;aspect-ratio:${e.W}/${e.H}">
    <svg viewBox="0 0 ${e.W} ${e.H}" aria-hidden="true">${e.tras}</svg>
    <div style="position:absolute;z-index:2;left:${pc(e.card.x, e.W)};top:${pc(e.card.y, e.H)};width:${pc(e.card.w, e.W)}">${face === 'frente' ? frente(or, o) : verso(or, o)}</div>
    <svg class="na-frente" viewBox="0 0 ${e.W} ${e.H}" aria-hidden="true">${e.frente}</svg></div>`;
}

window.GB_LIC = {peca, EMBLEMA, COROA};
})();
