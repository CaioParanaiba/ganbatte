// Constância em chamas (hm-chamas, épico): os dias jogados do heatmap viram chamas de anime acesas, em CSS, sem imagem.
// A chama é desenhada quadro a quadro, como no anime (8 quadros a ~10 por segundo, "em dois"), e não balança suave: as
// línguas afiadas trocam de forma a cada quadro e, nas chamas grandes, um pedaço solto sobe e some acima da ponta.
// Cada quadro é um SVG gerado aqui (chama()) e o conjunto vira uma tira; o CSS anda a máscara pela tira com steps().
//   dia jogado (h1 a h4)  h1 uma chama pequena de uma língua, vermelha; h2 duas línguas e o miolo amarelo; h3 três línguas,
//                         ocupa o dia; h4 a chama mais quente: quatro línguas, passa da borda de cima, miolo quase branco
//                         e a base azul (como o fogo de verdade quando esquenta)
//   dia sem nada          a cinza: um montinho apagado na cor da linha
//   dia salvo (z)         a chama de nen, roxa (a --aura do jogo), mais lenta
//   hoje                  o contorno de hoje; se ainda não jogou, o montinho com uma brasa piscando, esperando
//   futuro, férias        como hoje (tracejado, verde tracejado)
// Só a chama de hoje e a que está sob o mouse se mexem (a do mouse sobe e acelera): centenas de máscaras andando ao
// mesmo tempo travavam o jogo com muitos hábitos. As outras ficam paradas, cada uma num quadro da tira e algumas
// espelhadas (por nth-child), para parecerem desenhadas uma a uma. Com prefers-reduced-motion, nada se mexe.
//   CURSORES.chamas.css('.hm-chamas', cor)   o CSS com o seletor dado; no jogo: ':root[data-heat="chamas"]';
//                                            cor 1 pinta o fogo com a cor do hábito (a --c da linha) em vez do laranja
//   CURSORES.chamas.acende(el, {lento})      (lento é o padrão, escolha do Caio: em câmera lenta o acender se vê; lento:0 é o rápido)
//                                            quando o dia de hoje acende (o jogo chama depois de redesenhar o heatmap,
//                                            com o <i> novo de hoje): a faísca cai, a chama estoura com mola, as brasas
//                                            sobem e o ボッ salta (Dela Gothic One, a mesma do Jajanken)
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const N = 8, W = 10, H = 14;   // quadros da tira e o tamanho de cada quadro (a chama é mais alta que larga)
const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const sorte = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const P = (x, y) => `${x.toFixed(2)} ${y.toFixed(2)}`;

// as línguas de cada tamanho, da direita para a esquerda, com a base em (0, 0) e y para cima negativo
const LINGUAS = {
  1: [[1.3, -6.4], [-.3, -10.4]],
  2: [[1.5, -8.2], [-.7, -11]],
  3: [[2.3, -7.4], [.1, -11.3], [-2.2, -8.5]],
  4: [[2.7, -6.6], [1, -10.2], [-.8, -11.6], [-2.7, -7.6]],
};
// uma chama no quadro f: base redonda e k línguas que trocam a cada quadro (balanço + tremor sorteado, sempre o mesmo);
// esc encolhe a partir da base (o miolo é a mesma chama menor), sem é a semente, gota solta o pedaço que sobe, rb é o raio
// da base (achatada: a base redonda e larga é o que deixa a chama com cara de emoji)
function chama(f, k, esc, sem, gota, rb = 3){
  const t = f / N * 2 * Math.PI, ox = f * W + W / 2, oy = H - .3;
  const X = x => ox + x * esc, Y = y => oy + y * esc;
  const r = rb + (sorte(f, sem + 40) - .5) * .3, ry = r * .72, cy = -ry;
  const pontas = LINGUAS[k].map(([x, y], j) => {
    const alto = -y / 11, bal = Math.sin(t + j * 1.7 + sem) * 1.1 * alto;
    return {x: x + bal + (sorte(f, j + sem) - .5) * .8, y: y * (1 + .07 * Math.sin(2 * t + j * 2.3 + sem)) + (sorte(f, j + sem + 9) - .5) * 1.5, l: bal};
  });
  const L = {x: -r, y: cy}, R = {x: r, y: cy};
  let d = `M${P(X(L.x), Y(L.y))} A${(r * esc).toFixed(2)} ${(ry * esc).toFixed(2)} 0 0 0 ${P(X(R.x), Y(R.y))}`, p = R;
  pontas.forEach((T, j) => {
    // sobe até a ponta numa curva em S (a ponta enrola para o lado do balanço) e desce até o vão da próxima língua
    d += ` C${P(X(p.x - .15 * (p.x - T.x)), Y(p.y - .55 * (p.y - T.y)))} ${P(X(T.x + T.l * 1.4 + .25 * (p.x - T.x)), Y(T.y + .45 * (p.y - T.y)))} ${P(X(T.x), Y(T.y))}`;
    const prox = pontas[j + 1], V = prox ? {x: (T.x + prox.x) / 2, y: Math.max(T.y, prox.y) + 3.4} : L;
    const c2 = prox ? [V.x + .15 * (T.x - V.x), V.y - .35 * (V.y - T.y)] : [L.x - .7, L.y - 2.4];
    d += ` C${P(X(T.x + .2 * (V.x - T.x) + T.l * .8), Y(T.y + .45 * (V.y - T.y)))} ${P(X(c2[0]), Y(c2[1]))} ${P(X(V.x), Y(V.y))}`;
    p = V;
  });
  d += ' Z';
  if(gota){
    // o pedaço solto: nasce na ponta mais alta, sobe e encolhe em 6 dos 8 quadros
    const m = pontas.reduce((a, b) => b.y < a.y ? b : a), q = (f % N) / (N - 2);
    if(q <= 1){
      const s = 1.1 * (1 - q * .75), gx = m.x + m.l * .6, gy = m.y - 1.2 - q * 2.2;
      d += ` M${P(X(gx), Y(gy - s * 1.5))} Q${P(X(gx + s * .8), Y(gy))} ${P(X(gx), Y(gy + s))} Q${P(X(gx - s * .8), Y(gy))} ${P(X(gx), Y(gy - s * 1.5))} Z`;
    }
  }
  return d;
}
const tira = (k, esc, sem, gota, rb) => uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N * W} ${H}"><path d="`
  + Array.from({length: N}, (_, f) => chama(f, k, esc, sem, gota, rb)).join(' ') + '"/></svg>');
// cada nível: as línguas do fogo e do miolo, o tamanho do miolo e se solta o pedaço
const NIVEL = {h1: [1, 0, 0, false], h2: [2, 1, .5, false], h3: [3, 2, .58, true], h4: [4, 2, .66, true], z: [2, 1, .55, false]};
const TIRAS = Object.fromEntries(Object.entries(NIVEL).map(([n, [k, kc, ec, g]], i) =>
  [n, {fogo: tira(k, 1, i * 3.1, g), miolo: kc ? tira(kc, ec, i * 3.1 + 1.3, false, 2.3) : 'none'}]));
// a cinza (montinho apagado) e a brasa de hoje, paradas
const CINZA = uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><path d="M.8 13.7 C1.6 11.6 3.2 10.5 5 10.4 C6.8 10.5 8.4 11.6 9.2 13.7 Z"/></svg>`);
const BRASA = uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><path d="M5 8.2 Q5.9 9.6 5 11 Q4.1 9.6 5 8.2 Z" fill="#FF6A1F"/></svg>`);

// as cores: --f0 as pontas, --f1 o corpo, --f2 o miolo de baixo, --f3 o miolo de cima, --fb a base azul do h4. As faixas
// são chapadas (parada dura no gradiente), como a pintura de anime; a máscara anda e as cores ficam na altura delas
const FOGO = `--f0:#D8341A;--f1:#FF6A1F;--f2:#FFE08A;--f3:#FFB25E`;
function css(raiz, cor){
  const i = `${raiz} .l-hg i`, acesa = `${i}:is(.h1,.h2,.h3,.h4,.z)`, camadas = `${acesa}::before,${acesa}::after`;
  const vazia = `${i}:not(.h1,.h2,.h3,.h4,.z,.fut,.fer,.fora)`;
  const tinta = cor ? `${i}{--f0:var(--c);--f1:var(--c);--f2:#FFF4DA;--f3:var(--c)}
@supports (color: oklch(from red l c h)){ ${i}{--f0:oklch(from var(--c) .5 .15 h);--f1:oklch(from var(--c) .7 .17 h);--f2:oklch(from var(--c) .96 .05 h);--f3:oklch(from var(--c) .85 .13 h)} }
${i}.h1{--f1:oklch(from var(--c) .6 .15 h)} ${i}.h4{--f2:#FFFDF4;--fbh:0%}` : `${i}{${FOGO}}
${i}.h1{--f0:#B02A18;--f1:#E8501C} ${i}.h4{--f2:#FFF6D6;--f3:#FFE08A;--fb:#4F8BFF;--fbh:7%}`;
  return `
${i}{position:relative;background:none;border-radius:3px;outline:none;--a:100%}
${tinta}
${i}.z{--f0:color-mix(in srgb,var(--aura) 65%,#2A1F52);--f1:var(--aura);--f2:#F6F0FF;--f3:color-mix(in srgb,var(--aura) 45%,#fff)}
${i}.h1{--a:58%} ${i}.h2{--a:80%} ${i}.h4{--a:128%;z-index:1} ${i}.z{--a:84%}
${camadas}{content:"";position:absolute;bottom:0;left:50%;height:var(--a);aspect-ratio:${W}/${H};translate:-50% 0;transform-origin:50% 100%;
  -webkit-mask:var(--m) 0 0/${N * 100}% 100% no-repeat;mask:var(--m) 0 0/${N * 100}% 100% no-repeat;
  -webkit-mask-position:var(--q,0%) 0;mask-position:var(--q,0%) 0;transition:height .18s}
${acesa}::before{background:linear-gradient(to top,var(--fb,var(--f1)) 0 var(--fbh,0%),var(--f1) var(--fbh,0%) 52%,var(--f0) 52%)}
${acesa}::after{background:linear-gradient(to top,var(--f2) 0 15%,var(--f3) 15%);--d:.7s}
${Object.entries(TIRAS).map(([n, t]) => `${i}.${n}::before{--m:${t.fogo}} ${i}.${n}::after{${t.miolo === 'none' ? 'content:none' : `--m:${t.miolo}`}}`).join('\n')}
${i}.z::before,${i}.z::after{--d:1.25s}
${Array.from({length: N}, (_, k) => `${i}:nth-child(${N}n+${k})::before{--q:${(k / (N - 1) * 100).toFixed(2)}%}`).join(' ')}
${[0, 3, 5, 2, 6].map((q, k) => `${i}:nth-child(5n+${k})::after{--q:${(q / (N - 1) * 100).toFixed(2)}%}`).join(' ')}
/* só a chama de hoje e a que está sob o mouse se mexem: centenas de máscaras andando ao mesmo tempo travam o jogo */
${i}.hj:is(.h1,.h2,.h3,.h4,.z)::before,${i}.hj:is(.h1,.h2,.h3,.h4,.z)::after,${acesa}:hover::before,${acesa}:hover::after{animation:hmFogo var(--d,.8s) steps(${N}) infinite}
${i}:is(:nth-child(4n+2),:nth-child(7n+3))::before,${i}:is(:nth-child(4n+2),:nth-child(7n+3))::after{scale:-1 1}
${acesa}:hover::before,${acesa}:hover::after{height:calc(var(--a) * 1.2);--d:.42s}
${acesa}.acende::before,${acesa}.acende::after{animation:hmAcende var(--la,.55s) cubic-bezier(.3,1.7,.5,1) both,hmFogo var(--d,.8s) steps(${N}) infinite}
${vazia}::before{content:"";position:absolute;bottom:0;left:50%;height:100%;aspect-ratio:${W}/${H};translate:-50% 0;
  background:var(--hair);-webkit-mask:${CINZA} center/contain no-repeat;mask:${CINZA} center/contain no-repeat}
${vazia}.hj::after{content:"";position:absolute;bottom:0;left:50%;height:100%;aspect-ratio:${W}/${H};translate:-50% 0;
  background:${BRASA} center/contain no-repeat;animation:hmBrasa 1.1s steps(2) infinite}
${i}:is(.fut,.fer){outline:1px dashed var(--hair);outline-offset:-1px}
${i}.fer{background:color-mix(in srgb,var(--grn) 14%,transparent);outline-color:color-mix(in srgb,var(--grn) 60%,transparent)}
${i}.hj{outline:2px solid var(--ink);outline-offset:1px}
${i}.fora{visibility:hidden}
@keyframes hmFogo{from{-webkit-mask-position:0 0;mask-position:0 0}to{-webkit-mask-position:${(N / (N - 1) * 100).toFixed(4)}% 0;mask-position:${(N / (N - 1) * 100).toFixed(4)}% 0}}
@keyframes hmAcende{0%{transform:scale(0,.2)}55%{transform:scale(1.3,1.55)}100%{transform:none}}
@keyframes hmBrasa{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){ ${camadas},${vazia}.hj::after{animation:none} }`;
}

// ---- o acender: a faísca cai do alto, a chama estoura (classe .acende), as brasas sobem com empuxo e ar, o ボッ salta
const FONTE = '"Dela Gothic One","Hiragino Kaku Gothic StdN","Yu Gothic",sans-serif';
function fonte(){
  if(document.querySelector('link[href*="Dela+Gothic+One"]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap&text=' + encodeURIComponent('ボッ');
  l.onload = () => document.fonts.load('20px "Dela Gothic One"', 'ボッ');   // baixa já, para o primeiro ボッ não sair em quadradinho
  document.head.append(l);
}
function acende(el, op = {}){
  const len = op.lento === 0 || op.lento === false ? 1 : 4, r = el.getBoundingClientRect(), cel = r.width;
  el.classList.remove('acende'); void el.offsetWidth;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ el.classList.add('acende'); return; }
  const cx = r.left + r.width / 2, base = r.bottom;
  const camada = document.createElement('div');
  camada.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.append(camada);
  const ponto = (w, h, cor, extra = '') => { const p = document.createElement('i');
    p.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;background:${cor};${extra}`; camada.append(p); return p; };
  // 1. a faísca: um traço que cai da diagonal até o pé do dia
  const fa = ponto(3, 3, '#FFE08A', 'border-radius:50%;box-shadow:0 0 0 1px #FF6A1F');
  const de = {x: cx - cel * 2.2, y: r.top - cel * 2.6}, ate = {x: cx, y: base - cel * .25};
  fa.animate([{transform: `translate(${de.x}px,${de.y}px)`, opacity: 0}, {opacity: 1, offset: .2}, {transform: `translate(${ate.x}px,${ate.y}px)`, opacity: 1}],
    {duration: 170 * len, easing: 'cubic-bezier(.5,0,1,.6)', fill: 'forwards'});
  setTimeout(() => {
    fa.remove();
    el.style.setProperty('--la', `${.55 * len}s`);
    el.classList.add('acende');
    // 2. o anel do estouro, chapado, que abre do pé da chama
    const an = ponto(cel, cel * .45, 'none', 'border:2px solid #FFB25E;border-radius:50%;box-sizing:border-box');
    an.animate([{transform: `translate(${cx - cel / 2}px,${base - cel * .3}px) scale(.3)`, opacity: 1},
      {transform: `translate(${cx - cel / 2}px,${base - cel * .3}px) scale(2.6,1.8)`, opacity: 0}], {duration: 380 * len, easing: 'ease-out', fill: 'forwards'});
    // 3. o ボッ: inclinado, com contorno grosso, salta em mola e sobe sumindo
    fonte();
    const tx = document.createElement('b'); tx.textContent = 'ボッ';
    const fs = Math.max(14, Math.min(22, cel * .9));
    tx.style.cssText = `position:absolute;left:${cx + cel * .55}px;top:${r.top - fs * 1.15}px;font:${fs}px ${FONTE};color:#FFE08A;`
      + `-webkit-text-stroke:${Math.max(3, fs * .22)}px #2A1208;paint-order:stroke fill;letter-spacing:-.04em;white-space:nowrap`;
    camada.append(tx);
    tx.animate([{transform: 'rotate(-12deg) scale(0)', opacity: 1}, {transform: 'rotate(-12deg) scale(1.35)', offset: .18},
      {transform: 'rotate(-9deg) scale(1)', offset: .32}, {transform: 'rotate(-9deg) scale(1) translateY(0)', opacity: 1, offset: .7},
      {transform: 'rotate(-9deg) scale(.9) translateY(-8px)', opacity: 0}], {duration: 900 * len, fill: 'forwards'});
    // 4. as brasas: losangos que sobem (empuxo maior que o peso), com arrasto e um zigue-zague do ar quente
    const CORES = ['#FFE08A', '#FFB25E', '#FF6A1F', '#FFF8E2'], brasas = [];
    for(let k = 0; k < 16; k++){
      const s = 2 + Math.random() * (cel > 18 ? 2.8 : 2), b = ponto(s, s, CORES[k % 4]);
      brasas.push({b, x: cx + (Math.random() - .5) * cel * .6, y: base - cel * (.3 + Math.random() * .4),
        vx: (Math.random() - .5) * 140, vy: -(80 + Math.random() * 200), f: Math.random() * 6, v: .55 + Math.random() * .6, t: 0});
    }
    let antes = performance.now();
    (function passo(agora){
      const dt = Math.min(.033, (agora - antes) / 1000) / len; antes = agora;
      let vivas = 0;
      for(const e of brasas){
        e.t += dt; if(e.t > e.v){ e.b.style.opacity = 0; continue; } vivas++;
        e.vy += -160 * dt; e.vx *= Math.exp(-2.2 * dt); e.vy *= Math.exp(-1.4 * dt);
        e.x += (e.vx + Math.sin(e.t * 14 + e.f) * 40) * dt; e.y += e.vy * dt;
        e.b.style.transform = `translate(${e.x}px,${e.y}px) rotate(45deg) scale(${1 - e.t / e.v * .8})`;   // o giro depois do translate, senão ele gira o caminho junto
      }
      if(vivas) requestAnimationFrame(passo); else camada.remove();
    })(antes);
  }, 170 * len);
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
.hmc .l-hg i.fer{background:color-mix(in srgb,var(--grn) 14%,transparent);outline:1px dashed color-mix(in srgb,var(--grn) 60%,transparent);outline-offset:-1px}
.hmc .bt{font:600 12px var(--f-mono);padding:6px 12px;border-radius:6px;border:1px solid var(--hair);background:var(--track);color:var(--ink);cursor:pointer}`;

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
function bloco(cel, claro, comChamas, hab = HAB){
  return `<div class="hmc ${claro ? 'cl' : ''} ${comChamas ? 'hm-chamas' : ''}" style="--cel:${cel}px">`
    + hab.map(([n, cor, sem]) => `<div><div class="nm">${n}</div>${grade(cor, temporada(sem, cel <= 14 ? 26 : cel <= 20 ? 20 : 15))}</div>`).join('') + '</div>';
}

function previas(el, cfg){
  let st = document.getElementById('hm-chamas-css');
  if(!st){ st = document.createElement('style'); st.id = 'hm-chamas-css'; document.head.append(st); }
  // .hmc.hm-chamas: precisa ganhar do .hmc .l-hg i.h1 do heatmap de mentira (no jogo, :root[data-heat] já ganha do .l-hg i.h1)
  st.textContent = BASE + css('.hmc.hm-chamas', +cfg.cor);
  const legenda = `<div class="hmc hm-chamas" style="--cel:26px;grid-auto-flow:column;justify-content:start;align-items:end;gap:18px;font:12px var(--f-mono)">`
    + [['h1', 'fraco'], ['h2', ''], ['h3', ''], ['h4', 'forte'], ['', 'sem nada'], ['z', 'salvo'], ['hj', 'hoje (falta)'], ['hj h3', 'hoje'], ['fut', 'futuro'], ['fer', 'férias']]
      .map(([c, t]) => `<span style="display:flex;align-items:center;gap:6px"><span class="l-hg" style="--n:1;--c:#E0AF68;grid-template-rows:auto;padding:10px 3px 3px"><i class="${c}"></i></span>${t}</span>`).join('') + '</div>';
  // o acender: uma semana com a sequência e o dia de hoje ainda apagado; o botão acende e o outro apaga de novo
  const semana = ['h2', 'h3', 'h3', 'h4', 'h3', 'hj', 'fut'];
  const fogo = `<div class="hmc hm-chamas" style="--cel:26px;grid-auto-flow:column;justify-content:start;align-items:center;gap:16px">`
    + `<div style="display:flex;gap:28px;align-items:center"><div class="l-hg" id="hm-acende" style="--n:7;--c:#E0AF68;grid-template-rows:auto;padding-top:20px">`
    + semana.map(c => `<i class="${c}"></i>`).join('') + '</div>'
    + `<button class="bt" id="hm-bt-acende">acender hoje</button><button class="bt" id="hm-bt-apaga">apagar</button></div></div>`;
  el.innerHTML = `<section><h2>o acender: o dia de hoje pegando fogo ao terminar a tarefa (a 26 px; em câmera lenta, que é o padrão; "lento" 0 mostra o rápido)</h2>${fogo}</section>`
    + `<section><h2>cada estado do dia, a 26 px (paradas; só a de hoje se mexe, e a que estiver sob o mouse sobe e acelera)</h2>${legenda}</section>`
    + `<section><h2>a temporada, com células de 18 px (o jogo estica de 12 a 26 px para ocupar a largura), no escuro e no claro</h2><div class="linha" style="align-items:flex-start">${bloco(18, false, true)}${bloco(18, true, true)}</div></section>`
    + `<section><h2>no menor (12 px) e no maior (26 px)</h2><div class="linha" style="align-items:flex-start">${bloco(12, false, true)}${bloco(26, false, true, HAB.slice(0, 2))}</div></section>`
    + `<section><h2>como é hoje (o mesmo heatmap sem o item), para comparar</h2><div class="linha" style="align-items:flex-start">${bloco(18, false, false)}</div></section>`;
  const hoje = () => el.querySelector('#hm-acende').children[5];
  el.querySelector('#hm-bt-acende').onclick = () => { const d = hoje(); if(d.classList.contains('h3')) return; d.className = 'hj h3'; acende(d, {lento: +cfg.lento}); };
  el.querySelector('#hm-bt-apaga').onclick = () => { hoje().className = 'hj'; };
  fonte();
}

(window.CURSORES = window.CURSORES || {}).chamas = {css, acende, previas,
  titulo: 'Constância em chamas',
  dica: 'dia jogado = chama de anime desenhada quadro a quadro, maior e mais quente quanto mais forte o dia (h4 passa da borda, miolo branco e base azul) · sem nada = cinza · dia salvo = chama de nen roxa · hoje sem jogar = brasa piscando<br>"acender hoje" mostra o momento em que o dia pega fogo · "cor" 1 pinta o fogo com a cor do hábito, em vez do laranja',
  controles: [{k: 'cor', rot: 'cor (0 fogo · 1 cor do hábito)', min: 0, max: 1, un: '', padrao: 0},
    {k: 'lento', rot: 'acender em câmera lenta (1 padrão · 0 rápido)', min: 0, max: 1, un: '', padrao: 1}]};
})();
