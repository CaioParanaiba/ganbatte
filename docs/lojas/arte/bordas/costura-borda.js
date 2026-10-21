// Costura de nen (bd-costura, raro, Machi): a borda do card vira uma costura em zigue-zague com o fio de nen da Machi,
// parada, em SVG (border-image), sem imagem. É o contorno do card, não um enfeite num canto: o fio dá a volta inteira, e
// nos cantos ele faz a curva do card e dá um nó (a Machi costura e amarra).
// O fio é o mesmo do efeito Costura da Machi (fx-costura): rosa de nen com a alma clara e um contorno escuro fino, que some
// no escuro e segura o fio no claro. Chapado e parado (é raro): sem brilho, sem animação.
// A espessura (border-image-width) é maior que a borda de verdade (1 px): o fio entra por cima do padding do card, então o
// card não muda de tamanho e nada no jogo sai do lugar. O raio do card passa a ser a espessura, para a curva do fio cair
// em cima da curva do card.
//   CURSORES['costura-borda'].css('.bd-costura', cfg)   o CSS com o seletor dado; no jogo: ':root[data-borda="costura"]'
//                                                        (cfg: {esp: px, passo: px}, padrão 10 e 10)
//   CURSORES['costura-borda'].borda(cfg)                o SVG da borda (slice B)
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const FIO = '#F0A8E0', ALMA = '#FFF4FB', TINTA = '#0B0C10';
const B = 40, O = 9, I = 29;      // unidades do desenho: a fatia (= esp px), e as duas linhas do zigue-zague (de fora e de dentro)
const LARG = 5.2;                 // o fio, em unidades (com esp 10, 1,3 px)
const f1 = n => +n.toFixed(2);
const uri = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

// o caminho inteiro, uma volta só: canto, lado, canto... Cada lado é um zigue-zague de período L (fora → dentro → fora),
// e cada canto, um quarto de volta em cima da curva do card (dois zigue-zagues), com o nó no ponto de fora do meio
function borda({esp = 10, passo = 10} = {}){
  const L = Math.max(16, Math.round(B * passo / esp)), S = 2 * B + L, E = B + L;
  const pts = [], nos = [];
  const canto = (cx, cy, a0) => {   // a0: o ângulo de onde o fio chega (graus), anda 90° no sentido horário
    [[a0, B - O], [a0 + 22.5, B - I], [a0 + 45, B - O], [a0 + 67.5, B - I], [a0 + 90, B - O]].forEach(([a, r], k) => {
      const p = [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
      if(k) pts.push(p); if(k === 2) nos.push(p);
    });
  };
  pts.push([O, B]);
  canto(B, B, 180);                                          // em cima à esquerda
  pts.push([B + L / 2, I], [E, O]);                          // em cima
  canto(E, B, 270);                                          // em cima à direita
  pts.push([S - I, B + L / 2], [S - O, E]);                  // direita
  canto(E, E, 0);                                            // embaixo à direita
  pts.push([B + L / 2, S - I], [B, S - O]);                  // embaixo
  canto(B, E, 90);                                           // embaixo à esquerda
  pts.push([I, B + L / 2]);                                  // esquerda (fecha em [O, B])
  const d = 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
  const tr = (w, c, op = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const no = nos.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="5.6" fill="${FIO}" stroke="${TINTA}" stroke-opacity=".55" stroke-width="2"/>`
    + `<circle cx="${f1(x - 1.4)}" cy="${f1(y - 1.4)}" r="1.7" fill="${ALMA}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">`
    + tr(LARG + 2.6, TINTA, .5) + tr(LARG, FIO) + tr(1.5, ALMA, .7) + no + '</svg>';
  return {svg, S, L};
}

function css(raiz, cfg = {}){
  const esp = cfg.esp || 10, b = borda(cfg);
  // o contorno fino do card fica (é o pano que foi costurado): a borda vira imagem, então ele volta como sombra de dentro
  return `${raiz}{border:1px solid transparent;border-radius:${esp}px;border-image:${uri(b.svg)} ${B} / ${esp}px round;box-shadow:inset 0 0 0 1px var(--hair)}`;
}

// ---- a bancada: cards com a marcação e os tamanhos do jogo, no escuro e no claro
const BASE = `
.bdc{--ink:#E6E8EE;--soft:#A9AEBF;--panel:#1B1D28;--hair:#3D4254;background:#14161E;color:var(--ink);border-radius:10px;padding:18px;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
.bdc.cl{--ink:#1D2030;--soft:#5A6075;--panel:#FFFFFF;--hair:#D5D8E1;background:#F4F5F9}
.bdc .card{background:var(--panel);border:1px solid var(--hair);border-radius:14px;padding:14px 16px;min-width:0;display:grid;gap:4px}
.bdc .card b{font:600 14px var(--f-hud,system-ui);color:var(--ink)} .bdc .card small{font-size:12.5px;color:var(--soft)} .bdc .tf{color:var(--ink)}
.bdc.perto .card{padding:40px 44px}
.bdc .tf{display:flex;gap:8px;align-items:center;font-size:13px} .bdc .tf i{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--soft);flex:none}
.bdc .mc{position:relative;width:200px;height:120px;background:var(--panel);border:1px solid var(--hair);border-radius:8px;display:grid;place-items:center;font:600 12px var(--f-hud,system-ui);color:var(--soft)}`;
const cards = () => `
  <div class="card" style="width:min(420px,100%)"><b>Perfil</b><small>Andar 199 · 2.378 XP na temporada</small><small>faltam 14 XP para o 200</small></div>
  <div class="card" style="width:260px"><b>Quanto vale</b><small>até +23 XP</small></div>
  <div class="card" style="width:200px;height:200px"><b>Chefões</b><small>ARQ1 · 86%</small><small>BD · 87%</small></div>
  <div class="card" style="width:min(420px,100%)"><b>Lista</b><div class="tf"><i></i>Ler o que são X.25, Frame Relay e ATM</div><div class="tf"><i></i>Exercícios de sub-redes</div><div class="tf"><i></i>Revisar o capítulo 4</div></div>
  <div class="card" style="width:120px"><small>Ten</small><b>14 dias</b></div><div class="card" style="width:120px"><small>Zetsu</small><b>2</b></div>`;

function previas(el, cfg){
  let st = document.getElementById('bd-costura-css');
  if(!st){ st = document.createElement('style'); st.id = 'bd-costura-css'; document.head.append(st); }
  const tres = {esp: 3 * (cfg.esp || 10), passo: 3 * (cfg.passo || 10)};
  st.textContent = BASE + css('.bdc.bd-costura .card', cfg) + css('.bdc.bd-costura .mc', cfg) + css('.bdc.perto .card', tres);
  el.innerHTML = `<section><h2>nos cards do jogo, no escuro (o raio do card passa a ser a espessura; o card não muda de tamanho)</h2><div class="bdc bd-costura">${cards()}</div></section>`
    + `<section><h2>no claro</h2><div class="bdc cl bd-costura">${cards()}</div></section>`
    + `<section><h2>de perto (a mesma costura 3× maior, para ver o fio, o zigue-zague e o nó do canto)</h2><div class="bdc perto"><div class="card" style="width:420px;height:200px"><b>Lista</b><small>3 tarefas</small></div></div></section>`
    + `<section><h2>o card da vitrine (prévia da loja)</h2><div class="bdc bd-costura"><div class="mc">Costura de nen</div></div><div class="bdc cl bd-costura" style="margin-top:10px"><div class="mc">Costura de nen</div></div></section>`
    + `<section><h2>sem item, para comparar</h2><div class="bdc">${cards()}</div></section>`;
}

(window.CURSORES = window.CURSORES || {})['costura-borda'] = {css, borda, previas,
  titulo: 'Costura de nen',
  dica: 'a borda do card vira uma costura em zigue-zague com o fio de nen da Machi (o mesmo rosa do efeito Costura da Machi), parada · o fio dá a volta inteira no card, faz a curva nos cantos e dá um nó em cada um · ele entra por cima do padding: o card não muda de tamanho · espessura = largura da costura; passo = o comprimento de cada zigue-zague',
  controles: [{k: 'esp', rot: 'espessura', min: 6, max: 16, un: 'px', padrao: 10}, {k: 'passo', rot: 'passo', min: 6, max: 20, un: 'px', padrao: 10}]};
})();
