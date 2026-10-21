// Constância no Gungi (hm-gungi, raro, Meruem e Komugi): o heatmap vira um tabuleiro de Gungi, em CSS, sem imagem.
// Cada dia é uma casa de madeira (o vão entre as casas faz as linhas do tabuleiro) e o dia jogado é uma peça de cinco
// lados, como as do anime, com a marca entalhada em tinta. No Gungi as peças se empilham até três andares: quanto mais
// forte o dia, mais alta a pilha.
//   dia jogado (h1 a h4)  h1 uma peça só, a madeira mal tingida; h2 duas peças empilhadas; h3 três; h4 a torre de três na
//                         cor cheia do hábito, com um brilho leve em volta
//   dia sem nada          a casa vazia
//   dia salvo (z)         a peça do Rei (王 desenhado em traços, sem fonte), na cor da aura
//   hoje                  o contorno de hoje; se ainda não jogou, o contorno tracejado da peça esperando a jogada
//   futuro, férias, fora  a casa apagada (férias em verde): o tabuleiro fica inteiro, sem buraco na 1ª e na última semana
// As cores da madeira saem do tema (--track e --hair), então o tabuleiro escurece no escuro e clareia no claro.
// Nada se mexe sozinho (é raro): o mouse em cima levanta a peça, como quem vai jogá-la, e a jogada de hoje é um momento só.
//   CURSORES.gungi.css('.hm-gungi')   o CSS com o seletor dado; no jogo: ':root[data-heat="gungi"]'
//   CURSORES.gungi.joga(el)           quando o dia de hoje é jogado (o <i> novo de hoje): a pilha cai na casa com um
//                                     tranco e as linhas de impacto do mangá saem em volta (a Komugi batendo a peça)
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const box = corpo => uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${corpo}</svg>`);
const P = pts => 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z';
const FUNDO = 9.4, LADO = 1.1, ALTA = 5.4;   // o pé da pilha, a grossura de cada peça e a altura da face
// a face de cinco lados com o pé em b, e a lateral de uma peça (o que aparece de cada andar de baixo)
const face = b => { const t = b - ALTA; return [[5, t], [7.9, t + 1.4], [8.3, b], [1.7, b], [2.1, t + 1.4]]; };
const lado = y => [[1.7, y], [8.3, y], [8.1, y + LADO], [1.9, y + LADO]];
// a marca da peça: um 士 de três traços; o Rei leva um 王 (três horizontais e o traço do meio)
const marca = (b, rei) => { const c = b - ALTA + 3.3;
  return rei ? `M3.3 ${c - 1.4}H6.7M3.6 ${c}H6.4M2.9 ${c + 1.5}H7.1M5 ${c - 1.4}V${c + 1.5}`
    : `M3.4 ${c - .6}H6.6M5 ${c - 1.7}V${c + 1.3}M3.9 ${c + 1.3}H6.1`; };
function pilha(n, rei){
  const b = FUNDO - LADO * n, lados = Array.from({length: n}, (_, k) => lado(FUNDO - LADO * (k + 1)));
  const corpo = box(`<path d="${P(face(b))} ${lados.map(P).join(' ')}"/>`);
  // a tinta: a lateral sombreada, o contorno de cada peça e a marca entalhada
  const tinta = box(`<path d="${lados.map(P).join(' ')}" fill-opacity=".32"/>`
    + `<g fill="none" stroke="#000" stroke-linejoin="round" stroke-linecap="round"><path d="${P(face(b))} ${lados.map(P).join(' ')}" stroke-width=".5"/>`
    + `<path d="${marca(b, rei)}" stroke-width="${rei ? .62 : .7}"/></g>`);
  return {corpo, tinta};
}
const UM = pilha(1), DOIS = pilha(2), TRES = pilha(3), REI = pilha(1, true);
const ESPERA = box(`<path d="${P(face(FUNDO - LADO))} ${P(lado(FUNDO - LADO))}" fill="none" stroke="#000" stroke-width=".55" stroke-dasharray="1.1 .8"/>`);
const masc = m => `-webkit-mask:${m} center/contain no-repeat;mask:${m} center/contain no-repeat`;

function css(raiz){
  const i = `${raiz} .l-hg i`, jogado = `${i}:is(.h1,.h2,.h3,.h4,.z)`, vazia = `${i}:not(.h1,.h2,.h3,.h4,.z,.fut,.fer,.fora)`;
  const camada = 'content:"";position:absolute;inset:0;transition:translate .15s';
  return `
${raiz} .l-hg{--gg-tab:color-mix(in srgb,#A87444 30%,var(--track));--gg-lin:color-mix(in srgb,#6B4423 45%,var(--track));--gg-peca:#E2C28A;--gg-tinta:#2A1C10;
  background:var(--gg-lin);border-radius:4px}
${i}{position:relative;border-radius:1px;background:var(--gg-tab);outline:none}
${jogado}::before{${camada};background:var(--p)} ${jogado}::after{${camada};background:var(--gg-tinta)}
${i}.h1{--p:color-mix(in srgb,var(--c) 30%,var(--gg-peca))} ${i}.h1::before{${masc(UM.corpo)}} ${i}.h1::after{${masc(UM.tinta)}}
${i}.h2{--p:color-mix(in srgb,var(--c) 55%,var(--gg-peca))} ${i}.h2::before{${masc(DOIS.corpo)}} ${i}.h2::after{${masc(DOIS.tinta)}}
${i}.h3{--p:color-mix(in srgb,var(--c) 80%,var(--gg-peca))} ${i}:is(.h3,.h4)::before{${masc(TRES.corpo)}} ${i}:is(.h3,.h4)::after{${masc(TRES.tinta)}}
${i}.h4{--p:var(--c);z-index:1} ${i}.h4::before{filter:drop-shadow(0 0 1.5px var(--c))}
${i}.z{--p:var(--aura)} ${i}.z::before{${masc(REI.corpo)}} ${i}.z::after{${masc(REI.tinta)}}
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
  dica: 'o heatmap vira o tabuleiro do Meruem e da Komugi: cada dia é uma casa de madeira, e o dia jogado é uma peça de cinco lados · no Gungi as peças se empilham até três andares: dia fraco = uma peça mal tingida, dia forte = a torre de três na cor do hábito · sem nada = a casa vazia · salvo = a peça do Rei (o kanji de rei, em traços) na cor da aura · hoje sem jogar = o contorno da peça esperando<br>"jogar hoje" mostra a peça caindo na casa',
  controles: []};
})();
