// Constância no Gungi (hm-gungi, raro, Meruem e Komugi): o heatmap vira um tabuleiro de Gungi, em CSS, sem imagem.
// Como no anime e no jogo oficial (2022): o tabuleiro é de madeira, as peças são redondas, brancas e pretas, com o kanji
// escrito, e ficam dentro das casas. Cada dia é uma casa (o vão entre as casas faz as linhas do tabuleiro) e o dia jogado
// é uma peça branca com 兵 (soldado). No Gungi as peças se empilham até três: quanto mais forte o dia, mais alta a pilha.
// A cor do hábito fica na lateral das peças (a borda do disco), como uma pilha de fichas.
//   dia jogado (h1 a h4)  h1 uma peça só, lateral mal tingida; h2 duas peças empilhadas; h3 três; h4 a torre de três com a
//                         lateral na cor cheia do hábito e um aro dessa cor em volta da peça de cima
//   dia sem nada          a casa vazia
//   dia salvo (z)         a peça preta do 帥 (o rei do Gungi), com a lateral na cor da aura
//   hoje                  o contorno de hoje; se ainda não jogou, o contorno tracejado da peça esperando a jogada
//   futuro, férias, fora  a casa apagada (férias em verde): o tabuleiro fica inteiro, sem buraco na 1ª e na última semana
// Os kanji são traços desenhados no SVG (não precisam de fonte); a 12 px viram só uma marca, de 20 px para cima já leem.
// As cores da madeira saem do tema (--track), então o tabuleiro escurece no escuro e clareia no claro; as peças não mudam.
// Nada se mexe sozinho (é raro): o mouse em cima levanta a peça, como quem vai jogá-la, e a jogada de hoje é um momento só.
//   CURSORES.gungi.css('.hm-gungi')   o CSS com o seletor dado; no jogo: ':root[data-heat="gungi"]'
//   CURSORES.gungi.joga(el)           quando o dia de hoje é jogado (o <i> novo de hoje): a pilha cai na casa com um
//                                     tranco e as linhas de impacto do mangá saem em volta (a Komugi batendo a peça)
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const box = corpo => uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${corpo}</svg>`);
const FUNDO = 9.5, ESP = 1, RX = 4, RY = 2.9;   // o pé da pilha, a grossura de cada peça e os raios do disco (visto de cima, inclinado)
const BRANCA = '#F4F1E8', PRETA = '#1F1E24', TINTA = '#23180F';
// os kanji em traços, com o centro em (0, 0): 兵 (soldado, a peça comum) e 帥 (o rei do Gungi)
const HEI = 'M-1 -1.6L.9 -1.95M-.9 -1.5V-.1M-.9 -.75H1.1M.35 -.75V.35M-1.6 .4H1.6M-.55 .85L-1.3 1.7M.55 .85L1.3 1.7';
const SUI = 'M-1.4 -1.85L-1.65 -1.35M-1.6 -1.25V1.7M-1.6 -1.15H-.75V-.2H-1.6M-1.6 .25H-.75V1.2H-1.6'
  + 'M-.3 -1.4H1.75M.72 -1.95V1.95M-.15 -.65V.95M-.15 -.65H1.6V.75';
const meia = (cy, rx = RX) => `M${5 - rx} ${cy} A${rx} ${RY} 0 0 0 ${5 + rx} ${cy}`;   // a metade de baixo de uma elipse
const disco = (cy, rx = RX, ry = RY) => `M${5 - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
function pilha(n, rei){
  const cy = FUNDO - RY - ESP * n, pe = cy + ESP * n;   // o centro da face de cima e onde a lateral termina
  const lateral = `M${5 - RX} ${cy} V${pe} A${RX} ${RY} 0 0 0 ${5 + RX} ${pe} V${cy} Z`;
  // a cor (máscara, pintada com a cor do hábito): a lateral e um aro um pouco maior que a face (só aparece no h4)
  const cor = box(`<path d="${lateral}"/>`), aro = box(`<path d="${lateral} ${disco(cy, RX + .55, RY + .45)}"/>`);
  // o desenho (cores fixas, por cima): a face, o contorno, as divisões entre as peças e o kanji
  const divisoes = Array.from({length: n - 1}, (_, k) => meia(cy + ESP * (k + 1))).join(' ');
  const face = rei ? PRETA : BRANCA, letra = rei ? BRANCA : TINTA;
  const arte = box(`<g stroke="${TINTA}" stroke-width=".42" stroke-linejoin="round"><path d="${lateral}" fill="none"/>`
    + (divisoes ? `<path d="${divisoes}" fill="none"/>` : '') + `<path d="${disco(cy)}" fill="${face}"/></g>`
    + `<path d="${rei ? SUI : HEI}" transform="translate(5 ${cy}) scale(.82 .78)" fill="none" stroke="${letra}" stroke-width=".55" stroke-linecap="round" stroke-linejoin="round"/>`);
  return {cor, aro, arte};
}
const UM = pilha(1), DOIS = pilha(2), TRES = pilha(3), REI = pilha(1, true);
const ESPERA = box(`<path d="${disco(FUNDO - RY - ESP)} ${meia(FUNDO - RY)} M${5 - RX} ${FUNDO - RY - ESP}V${FUNDO - RY}M${5 + RX} ${FUNDO - RY - ESP}V${FUNDO - RY}" fill="none" stroke="#000" stroke-width=".5" stroke-dasharray="1.1 .8"/>`);
const masc = m => `-webkit-mask:${m} center/contain no-repeat;mask:${m} center/contain no-repeat`;
const img = m => `background:${m} center/contain no-repeat`;

function css(raiz){
  const i = `${raiz} .l-hg i`, jogado = `${i}:is(.h1,.h2,.h3,.h4,.z)`, vazia = `${i}:not(.h1,.h2,.h3,.h4,.z,.fut,.fer,.fora)`;
  const camada = 'content:"";position:absolute;inset:0;transition:translate .15s';
  return `
${raiz} .l-hg{--gg-tab:color-mix(in srgb,#A87444 30%,var(--track));--gg-lin:color-mix(in srgb,#6B4423 45%,var(--track));--gg-peca:#CFC6B4;
  background:var(--gg-lin);border-radius:4px}
${raiz} .l-hg{align-self:start} ${raiz} .l-hg.sem{min-height:0}   /* o tabuleiro não estica até a altura do resumo ao lado (o fundo de madeira apareceria) */
${i}{position:relative;border-radius:1px;background:var(--gg-tab);outline:none}
${jogado}::before{${camada};background:var(--p)} ${jogado}::after{${camada}}
${i}.h1{--p:color-mix(in srgb,var(--c) 35%,var(--gg-peca))} ${i}.h1::before{${masc(UM.cor)}} ${i}.h1::after{${img(UM.arte)}}
${i}.h2{--p:color-mix(in srgb,var(--c) 60%,var(--gg-peca))} ${i}.h2::before{${masc(DOIS.cor)}} ${i}.h2::after{${img(DOIS.arte)}}
${i}.h3{--p:color-mix(in srgb,var(--c) 82%,var(--gg-peca))} ${i}.h3::before{${masc(TRES.cor)}} ${i}:is(.h3,.h4)::after{${img(TRES.arte)}}
${i}.h4{--p:var(--c);z-index:1} ${i}.h4::before{${masc(TRES.aro)}}
${i}.z{--p:var(--aura)} ${i}.z::before{${masc(REI.cor)}} ${i}.z::after{${img(REI.arte)}}
${jogado}:hover::before,${jogado}:hover::after{translate:0 -14%}
${i}:is(.fut,.fer,.fora){visibility:visible;background:color-mix(in srgb,var(--gg-tab) 50%,transparent);outline:none}
${i}.fer{background:color-mix(in srgb,var(--grn) 22%,var(--gg-tab))}
${vazia}.hj::before{${camada};background:var(--ink);opacity:.7;${masc(ESPERA)}}
${i}.hj{outline:2px solid var(--ink);outline-offset:1px}
${i}.joga::before,${i}.joga::after{animation:ggCai .4s cubic-bezier(.5,0,.75,0) both}
@keyframes ggCai{0%{translate:0 -120%;opacity:0}20%{opacity:1}100%{translate:0 0}}
@keyframes ggBate{0%{scale:1}40%{scale:.86 1.08}100%{scale:1}}
${i}.bateu{animation:ggBate .2s ease-out both}
@media (prefers-reduced-motion:reduce){ ${i}.bateu,${i}.joga::before,${i}.joga::after{animation:none} ${jogado}::before,${jogado}::after{transition:none} }`;
}

// ---- a jogada de hoje: a pilha cai na casa e, quando toca, a casa leva o tranco e as linhas de impacto saem em volta
function joga(el){
  el.classList.remove('joga', 'bateu'); void el.offsetWidth; el.classList.add('joga');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setTimeout(() => {
    el.classList.add('bateu');
    const r = el.getBoundingClientRect(), cel = r.width, cor = getComputedStyle(el).getPropertyValue('--ink').trim() || '#ddd';
    const camada = document.createElement('div');
    camada.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
    document.body.append(camada);
    const cx = r.left + cel / 2, cy = r.top + cel * .62;
    // oito traços de tinta, de comprimentos tortos, que saem da peça e somem
    for(let k = 0; k < 8; k++){
      const a = -Math.PI / 2 + (k - 3.5) * .42 + (Math.random() - .5) * .15, comp = cel * (.35 + Math.random() * .3), p = document.createElement('i');
      p.style.cssText = `position:absolute;left:0;top:0;width:${comp}px;height:${Math.max(1.5, cel * .08)}px;border-radius:2px;background:${cor};transform-origin:0 50%`;
      camada.append(p);
      const d0 = cel * .55, d1 = cel * 1.05, gr = a * 180 / Math.PI;
      p.animate([{transform: `translate(${cx + Math.cos(a) * d0}px,${cy + Math.sin(a) * d0}px) rotate(${gr}deg) scaleX(.2)`, opacity: 1},
        {transform: `translate(${cx + Math.cos(a) * d1}px,${cy + Math.sin(a) * d1}px) rotate(${gr}deg) scaleX(1)`, opacity: 0}],
        {duration: 300, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'forwards'});
    }
    setTimeout(() => camada.remove(), 400);
  }, 400);
}

// ---- a bancada: heatmaps de mentira com a marcação do jogo (a mesma temporada das chamas, das cartas e das pegadas)
const BASE = `
.hmc{--ink:#E6E8EE;--track:#262A37;--hair:#3D4254;--aura:#BB9AF7;--grn:#9ECE6A;background:#14161E;color:var(--ink);border-radius:10px;padding:14px;display:grid;gap:12px;min-width:0}
.hmc.cl{--ink:#1D2030;--track:#E3E5EC;--hair:#BFC4D2;--aura:#8A63D2;--grn:#4E8A2E;background:#F4F5F9}
.hmc .nm{font:600 12px var(--f-mono);margin-bottom:4px}
.hmc .l-hg{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,auto);grid-template-columns:repeat(var(--n),var(--cel));gap:3px;padding:2px;overflow-x:auto}
.hmc .l-hg i{border-radius:3px;background:var(--track);aspect-ratio:1}
.hmc .l-hg i.h1{background:color-mix(in srgb,var(--c) 30%,var(--track))} .hmc .l-hg i.h2{background:color-mix(in srgb,var(--c) 55%,var(--track))}
.hmc .l-hg i.h3{background:color-mix(in srgb,var(--c) 80%,var(--track))} .hmc .l-hg i.h4{background:var(--c)}
.hmc .l-hg i.z{background:color-mix(in srgb,var(--aura) 45%,var(--track))} .hmc .l-hg i.fut{background:none;outline:1px dashed var(--hair);outline-offset:-1px}
.hmc .l-hg i.hj{outline:2px solid var(--ink);outline-offset:0} .hmc .l-hg i.fora{visibility:hidden}
.hmc .l-hg i.fer{background:color-mix(in srgb,var(--grn) 14%,transparent);outline:1px dashed color-mix(in srgb,var(--grn) 60%,transparent);outline-offset:-1px}
.hmc .bt{font:600 12px var(--f-mono);padding:6px 12px;border-radius:6px;border:1px solid var(--hair);background:var(--track);color:var(--ink);cursor:pointer}`;
function temporada(semente, sem = 20){
  let s = semente; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const dias = [], hoje = 7 * (sem - 4) + 3;
  let forca = .6;
  for(let d = 0; d < 7 * sem; d++){
    if(d < 2){ dias.push('fora'); continue; }
    if(d > hoje){ dias.push(d >= 7 * (sem - 1) ? 'fer' : 'fut'); continue; }
    forca = Math.max(0, Math.min(1, forca + (rnd() - .48) * .5));
    const r = rnd();
    let c = r > forca + .25 ? '' : r < .06 ? 'z' : 'h' + Math.min(4, 1 + Math.floor(forca * 4 * rnd() + forca * 1.5));
    if(d === hoje) c += ' hj';
    dias.push(c);
  }
  return dias;
}
const HAB = [['digitação', '#9BE15D', 7], ['leitura', '#7AA2F7', 21], ['exercício', '#E0AF68', 33]];
const grade = (cor, dias) => `<div class="l-hg" style="--n:${dias.length / 7};--c:${cor}">${dias.map(c => `<i class="${c}"></i>`).join('')}</div>`;
function bloco(cel, claro, com, hab = HAB){
  return `<div class="hmc ${claro ? 'cl' : ''} ${com ? 'hm-gungi' : ''}" style="--cel:${cel}px">`
    + hab.map(([n, cor, sem]) => `<div><div class="nm">${n}</div>${grade(cor, temporada(sem, cel <= 14 ? 26 : cel <= 20 ? 20 : 15))}</div>`).join('') + '</div>';
}

function previas(el){
  let st = document.getElementById('hm-gungi-css');
  if(!st){ st = document.createElement('style'); st.id = 'hm-gungi-css'; document.head.append(st); }
  // .hmc.hm-gungi: precisa ganhar do .hmc .l-hg i.h1 do heatmap de mentira (no jogo, :root[data-heat] já ganha do .l-hg i.h1)
  st.textContent = BASE + css('.hmc.hm-gungi');
  const estado = (c, t, claro) => `<span style="display:flex;align-items:center;gap:6px"><span class="l-hg" style="--n:1;--c:#E0AF68;grid-template-rows:auto;padding:3px"><i class="${c}"></i></span>${t}</span>`;
  const legenda = claro => `<div class="hmc hm-gungi ${claro ? 'cl' : ''}" style="--cel:30px;grid-auto-flow:column;justify-content:start;align-items:end;gap:18px;font:12px var(--f-mono)">`
    + [['h1', '1 peça'], ['h2', '2'], ['h3', '3'], ['h4', 'forte'], ['', 'sem nada'], ['z', 'salvo (Rei)'], ['hj', 'hoje (falta)'], ['hj h3', 'hoje'], ['fut', 'futuro'], ['fer', 'férias']]
      .map(([c, t]) => estado(c, t, claro)).join('') + '</div>';
  const semana = ['h2', 'h3', 'h1', 'h4', 'h3', 'hj', 'fut'];
  const jogada = `<div class="hmc hm-gungi" style="--cel:30px"><div style="display:flex;gap:28px;align-items:center;flex-wrap:wrap">`
    + `<div class="l-hg" id="gg-semana" style="--n:7;--c:#E0AF68;grid-template-rows:auto;padding:3px">${semana.map(c => `<i class="${c}"></i>`).join('')}</div>`
    + `<button class="bt" id="gg-1">jogar hoje (1 peça)</button><button class="bt" id="gg-4">jogar hoje (dia forte)</button><button class="bt" id="gg-z">salvar hoje (Rei)</button><button class="bt" id="gg-volta">desfazer</button></div></div>`;
  el.innerHTML = `<section><h2>a jogada de hoje: a peça cai na casa ao terminar a tarefa (a 30 px; mouse em cima de uma peça = ela levanta)</h2>${jogada}</section>`
    + `<section><h2>cada estado do dia, a 30 px, no escuro e no claro</h2><div style="display:grid;gap:10px">${legenda(false)}${legenda(true)}</div></section>`
    + `<section><h2>a temporada, com casas de 18 px (o jogo estica de 12 a 26 px para ocupar a largura), no escuro e no claro</h2><div class="linha" style="align-items:flex-start">${bloco(18, false, true)}${bloco(18, true, true)}</div></section>`
    + `<section><h2>no menor (12 px) e no maior (26 px)</h2><div class="linha" style="align-items:flex-start">${bloco(12, false, true)}${bloco(26, false, true, HAB.slice(0, 2))}</div></section>`
    + `<section><h2>o heatmap de hoje, sem item, para comparar</h2><div class="linha" style="align-items:flex-start">${bloco(18, false, false)}</div></section>`;
  const hoje = () => el.querySelector('#gg-semana').children[5];
  const vai = c => { const d = hoje(); d.className = 'hj ' + c; joga(d); };
  el.querySelector('#gg-1').onclick = () => vai('h1');
  el.querySelector('#gg-4').onclick = () => vai('h4');
  el.querySelector('#gg-z').onclick = () => vai('z');
  el.querySelector('#gg-volta').onclick = () => { hoje().className = 'hj'; };
}

(window.CURSORES = window.CURSORES || {}).gungi = {css, joga, previas,
  titulo: 'Constância no Gungi',
  dica: 'o heatmap vira o tabuleiro do Meruem e da Komugi: cada dia é uma casa de madeira, e o dia jogado é uma peça redonda e branca, de soldado · no Gungi as peças se empilham até três andares: a cor do hábito fica na lateral das peças: dia fraco = uma peça só, dia forte = a torre de três com a lateral na cor cheia · sem nada = a casa vazia · salvo = a peça preta do rei (o sui) com a lateral na cor da aura · hoje sem jogar = o contorno da peça esperando<br>"jogar hoje" mostra a peça caindo na casa',
  controles: []};
})();
