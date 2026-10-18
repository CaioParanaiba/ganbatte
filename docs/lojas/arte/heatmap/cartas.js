// Constância em cartas (hm-cartas): os quadradinhos do heatmap viram cartas de baralho, em CSS, sem imagem para fatiar.
// Cada dia é uma carta em pé no lugar do quadradinho:
//   dia jogado (h1 a h4)  carta de frente com o naipe no meio; quanto mais forte o dia, mais o papel pega a cor do hábito
//                         (a --c da linha, como no heatmap de hoje) e maior o naipe; o dia mais forte (h4) é a carta de
//                         figura: toda na cor do hábito, naipe branco e filete dourado, como o quadro do valete, dama e rei
//   dia sem nada          carta virada: o verso vinho da carta do Hisoka, chapado, com um filete rosa
//   dia salvo (z)         o Coringa: a estrela e a lágrima, a mesma do emblema de naipe
//   futuro, férias, hoje  como hoje (tracejado, verde tracejado, contorno), mas no formato da carta
// O naipe é o do emblema de naipe da pessoa (--naipe no <html>); sem o emblema, ♠. Aqui todo naipe pega a cor do hábito
// (é ela que mostra a intensidade), seja ♠ ou ♥. Os naipes são os mesmos traços do cursor da carta e do emblema
// (tentativas/naipes/naipes.py, versão clássica).
//   CURSORES.cartas.css('.hm-cartas')   o CSS do item com o seletor dado; no jogo: ':root[data-heat="cartas"]'
//   CURSORES.cartas.naipe('copas')      o valor de --naipe (url com o SVG) de um naipe
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const OURO = '#C9961A', PAPEL = '#FBF7EE', VINHO = '#6E1F45', ROSA = 'rgba(255,92,138,.55)', TINTA = '#11131A';
const D = {
  espadas: 'M0 -.48 C.1 -.33 .5 -.12 .5 .1 C.5 .32 .2 .38 .05 .22 Q.07 .42 .2 .5 L-.2 .5 Q-.07 .42 -.05 .22 C-.2 .38 -.5 .32 -.5 .1 C-.5 -.12 -.1 -.33 0 -.48 Z',
  copas: 'M0 .42 C-.1 .3 -.5 .06 -.5 -.16 C-.5 -.43 -.16 -.5 0 -.26 C.16 -.5 .5 -.43 .5 -.16 C.5 .06 .1 .3 0 .42 Z',
  ouros: 'M0 -.5 Q.14 -.17 .38 0 Q.14 .17 0 .5 Q-.14 .17 -.38 0 Q-.14 -.17 0 -.5 Z',
  paus: 'M.21 -.25 A.21 .21 0 1 0 -.21 -.25 A.21 .21 0 1 0 .21 -.25 Z M-.04 .05 A.21 .21 0 1 0 -.46 .05 A.21 .21 0 1 0 -.04 .05 Z '
    + 'M.46 .05 A.21 .21 0 1 0 .04 .05 A.21 .21 0 1 0 .46 .05 Z M-.06 0 Q-.06 .4 -.2 .5 L.2 .5 Q.06 .4 .06 0 Z',
};
const NAIPES = ['espadas', 'copas', 'ouros', 'paus'], SIMB = {espadas: '♠', copas: '♥', ouros: '♦', paus: '♣'};
const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const naipe = s => uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 1 1"><path d="${D[s]}"/></svg>`);
// o Coringa: estrela amarela e lágrima rosa com tinta (é imagem colorida, não máscara)
function coringa(){
  const e = [], g = (x, y, t) => `M${x} ${y - .55 * t} C${x + .12 * t} ${y - .3 * t} ${x + .36 * t} ${y - .05 * t} ${x + .36 * t} ${y + .17 * t} `
    + `A${.36 * t} ${.36 * t} 0 0 1 ${x - .36 * t} ${y + .17 * t} C${x - .36 * t} ${y - .05 * t} ${x - .12 * t} ${y - .3 * t} ${x} ${y - .55 * t} Z`;
  for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? .38 * .45 : .38; e.push(`${(-.13 + Math.cos(a) * q).toFixed(3)} ${(-.1 + Math.sin(a) * q).toFixed(3)}`); }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.6 -0.6 1.2 1.2"><g stroke="${TINTA}" stroke-width=".06" stroke-linejoin="round">`
    + `<path d="M${e.join(' L')} Z" fill="#FFD23F"/><path d="${g(.2, .14, .58)}" fill="#FF5C8A"/></g></svg>`);
}

// o CSS do item: o <i> do dia vira só o lugar; ::before é a carta (72% da largura, como a carta de baralho) e ::after o
// naipe, em máscara pintada com a cor do hábito
function css(raiz){
  const i = `${raiz} .l-hg i`;
  return `
${i}{position:relative;background:none;border-radius:0;outline:none;--cc:var(--c)}
/* a cor do hábito nas cartas tem teto de claridade e saturação: cor acesa (verde-limão, amarelo, neon) desce para um tom
   mais sóbrio, cor calma (o azul) quase não muda. Sem suporte a oklch(from …), fica a cor do hábito como está */
@supports (color: oklch(from red l c h)){ ${i}{--cc:oklch(from var(--c) min(l, .68) min(c, .13) h)} }
${i}::before{content:"";position:absolute;inset:0 14%;border-radius:max(1.5px,9%);background:${VINHO};box-shadow:inset 0 0 0 1px ${ROSA}}
${i}:is(.h1,.h2,.h3,.h4,.z)::before{background:${PAPEL};box-shadow:inset 0 0 0 1px rgba(17,19,26,.22)}
${i}.h2::before{background:color-mix(in srgb,var(--cc) 22%,${PAPEL})}
${i}.h3::before{background:color-mix(in srgb,var(--cc) 55%,${PAPEL})}
${i}.h4::before{background:var(--cc);box-shadow:inset 0 0 0 1px ${OURO}}
${i}:is(.h1,.h2,.h3,.h4)::after{content:"";position:absolute;left:50%;top:50%;width:var(--t);aspect-ratio:1;translate:-50% -50%;
  -webkit-mask:var(--naipe) center/contain no-repeat;mask:var(--naipe) center/contain no-repeat}
${i}.h1::after{--t:32%;background:color-mix(in srgb,var(--cc) 60%,${PAPEL})}
${i}.h2::after{--t:42%;background:color-mix(in srgb,var(--cc) 75%,${TINTA})}
${i}.h3::after{--t:52%;background:color-mix(in srgb,var(--cc) 45%,${TINTA})}
${i}.h4::after{--t:60%;background:${PAPEL}}
${i}.z::after{content:"";position:absolute;inset:14% 18%;background:${coringa()} center/contain no-repeat}
${i}:is(.fut,.fer)::before{background:none;box-shadow:none;outline:1px dashed var(--hair);outline-offset:-1px}
${i}.fer::before{background:color-mix(in srgb,var(--grn) 14%,transparent);outline-color:color-mix(in srgb,var(--grn) 60%,transparent)}
${i}.hj::before{outline:2px solid var(--ink);outline-offset:1px}
${i}.fora{visibility:hidden}`;
}

// ---- a bancada: heatmaps de mentira com a marcação do jogo (.l-hg, uma coluna por semana, seg → dom)
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
.hmc .l-hg i.fer{background:color-mix(in srgb,var(--grn) 14%,transparent);outline:1px dashed color-mix(in srgb,var(--grn) 60%,transparent);outline-offset:-1px}`;

// uma temporada de mentira, sempre a mesma (gerador com semente): sequências, buracos, dias salvos, hoje, futuro e férias
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
function bloco(cel, claro, comCartas, hab = HAB){
  return `<div class="hmc ${claro ? 'cl' : ''} ${comCartas ? 'hm-cartas' : ''}" style="--cel:${cel}px">`
    + hab.map(([n, cor, sem]) => `<div><div class="nm">${n}</div>${grade(cor, temporada(sem, cel <= 14 ? 26 : cel <= 20 ? 20 : 15))}</div>`).join('') + '</div>';
}

function previas(el, cfg){
  const s = NAIPES[cfg.naipe] || 'espadas';
  let st = document.getElementById('hm-cartas-css');
  if(!st){ st = document.createElement('style'); st.id = 'hm-cartas-css'; document.head.append(st); }
  // .hmc.hm-cartas: precisa ganhar do .hmc .l-hg i.h1 do heatmap de mentira (no jogo, :root[data-heat] já ganha do .l-hg i.h1)
  st.textContent = BASE + css('.hmc.hm-cartas') + `\n.hm-cartas{--naipe:${naipe(s)}}`;
  const legenda = `<div class="hmc hm-cartas" style="--cel:26px;grid-auto-flow:column;justify-content:start;align-items:center;gap:18px;font:12px var(--f-mono)">`
    + [['h1', 'fraco'], ['h2', ''], ['h3', ''], ['h4', 'forte'], ['', 'sem nada'], ['z', 'salvo'], ['hj h3', 'hoje'], ['fut', 'futuro'], ['fer', 'férias']]
      .map(([c, t]) => `<span style="display:flex;align-items:center;gap:6px"><span class="l-hg" style="--n:1;--c:#E0AF68;grid-template-rows:auto;padding:3px"><i class="${c}"></i></span>${t}</span>`).join('') + '</div>';
  el.innerHTML = `<section><h2>cada estado do dia, a 26 px (naipe: ${SIMB[s]} ${s}, o do emblema de naipe da pessoa)</h2>${legenda}</section>`
    + `<section><h2>a temporada, com células de 18 px (o jogo estica de 12 a 26 px para ocupar a largura), no escuro e no claro</h2><div class="linha" style="align-items:flex-start">${bloco(18, false, true)}${bloco(18, true, true)}</div></section>`
    + `<section><h2>no menor (12 px) e no maior (26 px)</h2><div class="linha" style="align-items:flex-start">${bloco(12, false, true)}${bloco(26, false, true, HAB.slice(0, 2))}</div></section>`
    + `<section><h2>como é hoje (o mesmo heatmap sem o item), para comparar</h2><div class="linha" style="align-items:flex-start">${bloco(18, false, false)}</div></section>`;
}

(window.CURSORES = window.CURSORES || {}).cartas = {css, naipe, previas,
  titulo: 'Constância em cartas',
  dica: 'dia jogado = carta de frente com o naipe do emblema, maior e mais forte quanto mais forte o dia (na cor do hábito) · dia sem nada = carta virada (verso vinho) · dia salvo = o Coringa · futuro, férias e hoje como no heatmap de hoje<br>"naipe" troca o naipe (0 ♠, 1 ♥, 2 ♦, 3 ♣), como se a pessoa tivesse escolhido outro no emblema',
  controles: [{k: 'naipe', rot: 'naipe (0 ♠ · 1 ♥ · 2 ♦ · 3 ♣)', min: 0, max: 3, un: '', padrao: 0}]};
})();
