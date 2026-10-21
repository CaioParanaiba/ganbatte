// Constância em pegadas (hm-pegadas, raro): os dias do heatmap viram um rastro de pés descalços, em CSS, sem imagem.
// Não é tema do anime. Cada coluna é uma semana e os dias descem em pé esquerdo, pé direito, esquerdo..., um pouco
// tortos e para fora, como um rastro de verdade; o dia que falta é um buraco no rastro.
//   dia jogado (h1 a h4)  h1 um passo leve: só a sola, sem os dedos, clarinha; h2 e h3 o pé inteiro, mais forte; h4 o pé
//                         inteiro na cor do hábito, um pouco maior, com a terra que espirrou dos lados
//   dia sem nada          uma pedrinha na cor da linha (o rastro tem um buraco)
//   dia salvo (z)         a pegada de nen, na cor da aura
//   hoje                  o contorno de hoje; se ainda não jogou, o contorno do pé esperando o passo
//   futuro, férias        o contorno do pé, apagado (os passos que faltam); férias em verde
// Nada se mexe sozinho (é raro): o mouse em cima afunda o pé, e o passo de hoje (pisa) é um momento só.
//   CURSORES.pegadas.css('.hm-pegadas')   o CSS com o seletor dado; no jogo: ':root[data-heat="pegadas"]'
//   CURSORES.pegadas.pisa(el)             quando o dia de hoje é jogado (o <i> novo de hoje): o pé desce, achata no chão e a
//                                         terra levanta dos dois lados
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const W = 10, H = 14;
const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
// o pé esquerdo, apontando para cima (o dedão fica à direita); o direito é o mesmo espelhado
const SOLA = 'M5.3 4.5 C7 4.3 8.1 5.4 8 7 C7.9 8.3 7 9 6.9 10.2 C6.8 11.2 7.3 12 7 12.9 C6.6 13.8 5.6 14 4.9 13.9 '
  + 'C3.9 13.8 3.4 13.1 3.4 12.1 C3.4 10.6 2.7 9.6 2.5 7.8 C2.4 5.8 3.6 4.6 5.3 4.5 Z';
const elipse = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const DEDOS = [[7.1, 2.5, 1.05, 1.3], [5.4, 1.75, .72, .85], [4.05, 1.95, .62, .72], [2.95, 2.6, .55, .62], [2.15, 3.55, .48, .52]]
  .map(e => elipse(...e)).join(' ');
const box = (corpo, extra = '') => uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${corpo}${extra}</svg>`);
const PE = box(`<path d="${SOLA} ${DEDOS}"/>`);
const SO_SOLA = box(`<path d="${SOLA}"/>`);
const CONTORNO = box(`<path d="${SOLA} ${DEDOS}" fill="none" stroke="#000" stroke-width=".75" stroke-dasharray="1.4 .9"/>`);
// a terra do h4: três grãos de cada lado da sola
const TERRA = box(`<path d="${[[1.2, 9.4, .45], [.6, 11.3, .35], [1.5, 12.9, .3], [8.8, 8.6, .4], [9.4, 10.6, .35], [8.6, 12.4, .3]]
  .map(([x, y, r]) => elipse(x, y, r, r)).join(' ')}"/>`);
const PEDRA = box(`<path d="${elipse(5, 9.5, 1.2, .9)}"/>`);

function css(raiz){
  const i = `${raiz} .l-hg i`, jogado = `${i}:is(.h1,.h2,.h3,.h4,.z)`, vazia = `${i}:not(.h1,.h2,.h3,.h4,.z,.fut,.fer,.fora)`;
  const pe = `content:"";position:absolute;bottom:0;left:50%;height:100%;aspect-ratio:${W}/${H};`;
  return `
${i}{position:relative;background:none;border-radius:3px;outline:none;--lado:-1;--tort:-8deg;--sc:1}
${i}:nth-child(even){--lado:1;--tort:8deg}
${i}::before,${i}::after{transform:translateX(calc(-50% + var(--lado) * 17%)) rotate(var(--tort)) scale(calc(var(--lado) * -1 * var(--sc)),var(--sc));transform-origin:50% 60%;transition:scale .15s,translate .15s}
${jogado}::before{${pe}background:var(--p);-webkit-mask:${PE} center/contain no-repeat;mask:${PE} center/contain no-repeat}
${i}.h1{--p:color-mix(in srgb,var(--c) 42%,var(--track));--sc:.86} ${i}.h1::before{-webkit-mask-image:${SO_SOLA};mask-image:${SO_SOLA}}
${i}.h2{--p:color-mix(in srgb,var(--c) 62%,var(--track));--sc:.92}
${i}.h3{--p:color-mix(in srgb,var(--c) 84%,var(--track))}
${i}.h4{--p:var(--c);--sc:1.06;z-index:1}
${i}.h4::after{${pe}background:color-mix(in srgb,var(--c) 55%,var(--hair));-webkit-mask:${TERRA} center/contain no-repeat;mask:${TERRA} center/contain no-repeat}
${i}.z{--p:var(--aura)}
${jogado}:hover::before{scale:1.14 .92;translate:0 4%}
${vazia}::before{${pe}background:var(--hair);-webkit-mask:${PEDRA} center/contain no-repeat;mask:${PEDRA} center/contain no-repeat}
${i}:is(.fut,.fer)::before,${vazia}.hj::before{${pe}background:var(--hair);-webkit-mask:${CONTORNO} center/contain no-repeat;mask:${CONTORNO} center/contain no-repeat}
${i}.fer::before{background:color-mix(in srgb,var(--grn) 70%,transparent)}
${vazia}.hj::before{background:var(--ink)}
${i}.hj{outline:2px solid var(--ink);outline-offset:1px}
${i}.fora{visibility:hidden}
${i}.pisa::before{animation:pgPisa .42s cubic-bezier(.3,.7,.4,1) both}
${i}.pisa.h4::after{animation:pgTerra .42s ease-out both}
@keyframes pgPisa{0%{translate:0 -70%;scale:1.5;opacity:0}45%{translate:0 0;scale:1.5;opacity:1}62%{scale:1.2 .8}100%{translate:0 0;scale:1}}
@keyframes pgTerra{0%,45%{opacity:0;scale:.4}70%{opacity:1;scale:1.25}100%{scale:1}}
@media (prefers-reduced-motion:reduce){ ${i}.pisa::before,${i}.pisa::after{animation:none} ${jogado}::before{transition:none} }`;
}

// ---- o passo de hoje: a classe .pisa desce o pé e, quando ele toca o chão, a poeira abre para os lados
function pisa(el){
  el.classList.remove('pisa'); void el.offsetWidth; el.classList.add('pisa');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setTimeout(() => {
    const r = el.getBoundingClientRect(), cel = r.width, cs = getComputedStyle(el);
    const cor = cs.getPropertyValue('--hair').trim() || '#888';
    const camada = document.createElement('div');
    camada.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
    document.body.append(camada);
    // uma sombra que achata no chão e a poeira: bolinhas que saem rente ao chão para os dois lados e sobem um pouco
    const ch = document.createElement('i');
    ch.style.cssText = `position:absolute;left:${r.left + cel * .1}px;top:${r.bottom - cel * .22}px;width:${cel * .8}px;height:${cel * .3}px;border-radius:50%;border:1.5px solid ${cor};box-sizing:border-box`;
    camada.append(ch);
    ch.animate([{transform: 'scale(.4)', opacity: .9}, {transform: 'scale(1.9,1.4)', opacity: 0}], {duration: 380, easing: 'ease-out', fill: 'forwards'});
    for(let k = 0; k < 10; k++){
      const lado = k % 2 ? 1 : -1, s = Math.max(2, cel * (.12 + Math.random() * .12)), p = document.createElement('i');
      p.style.cssText = `position:absolute;left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:${cor}`;
      camada.append(p);
      const x = r.left + cel / 2 + lado * cel * .2, y = r.bottom - cel * .15, dx = lado * cel * (.6 + Math.random() * .9), dy = -cel * (.1 + Math.random() * .45);
      p.animate([{transform: `translate(${x}px,${y}px) scale(.6)`, opacity: 1},
        {transform: `translate(${x + dx}px,${y + dy}px) scale(1.3)`, opacity: 0}], {duration: 360 + Math.random() * 260, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'forwards'});
    }
    setTimeout(() => camada.remove(), 700);
  }, 190);
}

// ---- a bancada: heatmaps de mentira com a marcação do jogo (a mesma temporada das chamas e das cartas)
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
  return `<div class="hmc ${claro ? 'cl' : ''} ${com ? 'hm-pegadas' : ''}" style="--cel:${cel}px">`
    + hab.map(([n, cor, sem]) => `<div><div class="nm">${n}</div>${grade(cor, temporada(sem, cel <= 14 ? 26 : cel <= 20 ? 20 : 15))}</div>`).join('') + '</div>';
}

function previas(el){
  let st = document.getElementById('hm-pegadas-css');
  if(!st){ st = document.createElement('style'); st.id = 'hm-pegadas-css'; document.head.append(st); }
  // .hmc.hm-pegadas: precisa ganhar do .hmc .l-hg i.h1 do heatmap de mentira (no jogo, :root[data-heat] já ganha do .l-hg i.h1)
  st.textContent = BASE + css('.hmc.hm-pegadas');
  const legenda = `<div class="hmc hm-pegadas" style="--cel:30px;grid-auto-flow:column;justify-content:start;align-items:end;gap:18px;font:12px var(--f-mono)">`
    + [['h1', 'fraco'], ['h2', ''], ['h3', ''], ['h4', 'forte'], ['', 'sem nada'], ['z', 'salvo'], ['hj', 'hoje (falta)'], ['hj h3', 'hoje'], ['fut', 'futuro'], ['fer', 'férias']]
      .map(([c, t]) => `<span style="display:flex;align-items:center;gap:6px"><span class="l-hg" style="--n:1;--c:#E0AF68;grid-template-rows:auto;padding:3px"><i class="${c}"></i></span>${t}</span>`).join('') + '</div>';
  const semana = ['h2', 'h3', 'h3', 'h4', 'h3', 'hj', 'fut'];
  const passo = `<div class="hmc hm-pegadas" style="--cel:30px"><div style="display:flex;gap:28px;align-items:center;flex-wrap:wrap">`
    + `<div class="l-hg" id="pg-semana" style="--n:7;--c:#E0AF68;grid-template-rows:auto;padding:14px 3px 3px">${semana.map(c => `<i class="${c}"></i>`).join('')}</div>`
    + `<button class="bt" id="pg-pisa">jogar hoje</button><button class="bt" id="pg-pisa4">jogar hoje (dia forte)</button><button class="bt" id="pg-volta">desfazer</button></div></div>`;
  el.innerHTML = `<section><h2>o passo de hoje: o pé desce no dia ao terminar a tarefa (a 30 px; mouse em cima de uma pegada = o pé afunda)</h2>${passo}</section>`
    + `<section><h2>cada estado do dia, a 30 px (pé esquerdo e direito se alternam dia a dia)</h2>${legenda}</section>`
    + `<section><h2>a temporada, com células de 18 px (o jogo estica de 12 a 26 px para ocupar a largura), no escuro e no claro</h2><div class="linha" style="align-items:flex-start">${bloco(18, false, true)}${bloco(18, true, true)}</div></section>`
    + `<section><h2>no menor (12 px) e no maior (26 px)</h2><div class="linha" style="align-items:flex-start">${bloco(12, false, true)}${bloco(26, false, true, HAB.slice(0, 2))}</div></section>`
    + `<section><h2>como é hoje (o quadradinho arredondado), para comparar</h2><div class="linha" style="align-items:flex-start">${bloco(18, false, true).replace('hm-pegadas', 'hm-velho')}</div></section>`;
  const hoje = () => el.querySelector('#pg-semana').children[5];
  el.querySelector('#pg-pisa').onclick = () => { const d = hoje(); d.className = 'hj h3'; pisa(d); };
  el.querySelector('#pg-pisa4').onclick = () => { const d = hoje(); d.className = 'hj h4'; pisa(d); };
  el.querySelector('#pg-volta').onclick = () => { hoje().className = 'hj'; };
  // o de hoje no jogo (web/efeitos.js), só para comparar
  st.textContent += `.hm-velho .l-hg i:not(.fora){border-radius:50% 50% 45% 45%/60% 60% 40% 40%;transform:scale(.75,.95)}`;
}

(window.CURSORES = window.CURSORES || {}).pegadas = {css, pisa, previas,
  titulo: 'Constância em pegadas',
  dica: 'cada dia é um passo: pé esquerdo e direito se alternam descendo a semana, um pouco tortos, como um rastro de verdade · dia fraco = só a sola, clarinha; dia forte = o pé inteiro na cor do hábito, com terra espirrada · sem nada = uma pedrinha (o rastro tem um buraco) · salvo = pegada de nen · hoje sem jogar e o futuro = o contorno do pé esperando<br>"jogar hoje" mostra o pé descendo no dia',
  controles: []};
})();
