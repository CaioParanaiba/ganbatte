// Jogo de mentira da bancada das transições (tr-*): um pedaço do jogo com quatro abas (Lista, Perfil, Loja, Chefões),
// cada uma uma <section id="v-…"> com cards de verdade, e uma barra de abas fixa em cima. Só serve à bancada: no jogo
// quem troca de aba é o index.html. O módulo da transição recebe o elemento que monta() devolve em .app.
//   const p = TR_PALCO.monta(palco, cfg, trocaDe)   trocaDe(h) → o handle da transição (h.troca(fn, origem))
//   p.app (a raiz da transição), p.abre(i, origem), p.proxima(), p.auto(bool), p.pinta(), p.atual(), p.desliga()
(() => {
const ABAS = [['lista', 'Lista'], ['perfil', 'Perfil'], ['loja', 'Loja'], ['chefoes', 'Chefões']];
const TAREFAS = [['A', 'Perguntar ao professor de Redes se o trabalho vale nota', '+23'], ['A', 'Mandar mensagem da caixa', '+23'],
  ['B', 'Ler 20 páginas do livro de Cálculo', '+12'], ['C', 'Lavar o carro', '+15'], ['B', 'Lista 3 de derivadas', '+18']];
const LOJA = [['Aura do avatar', '#7AA2F7', '1.500'], ['Terminal vivo', '#9ECE6A', '1.500'], ['Raio no aviso', '#E0AF68', '2.000'],
  ['Godspeed', '#9FD3FF', '3.000'], ['Fúria visível', '#F7768E', '1.000'], ['Barra elétrica', '#BB9AF7', '1.200']];
const CHEFES = [['Arquitetura de Redes', 86], ['Banco de Dados', 87], ['Cálculo II', 41]];
const hm = Array.from({length: 105}, (_, i) => `<i style="opacity:${[.12, .35, .65, 1][(i * 7 + (i >> 2)) % 4]}"></i>`).join('');

const CSS = `
.tg{position:absolute;inset:0;overflow:hidden;isolation:isolate;background:var(--b-bg);color:var(--b-tinta);font:14px var(--f-ui);cursor:default;user-select:none;-webkit-user-select:none}
.tg-nav{display:flex;gap:4px;align-items:center;padding:0 18px;height:46px;border-bottom:1px solid var(--b-borda);background:var(--b-card);position:relative}
.tg-nav button{font:600 13px var(--f-ui);color:var(--b-suave);background:none;border:0;border-bottom:2px solid transparent;height:46px;padding:0 14px;cursor:pointer}
.tg-nav button[aria-pressed="true"]{color:var(--b-tinta);border-bottom-color:#E0AF68}
.tg-nav .tg-fim{margin-left:auto;display:flex;gap:14px;align-items:center;font:12px var(--f-ui);color:var(--b-suave)}
.tg-nav .tg-prox{height:30px;border:1px solid var(--b-borda);border-bottom:1px solid var(--b-borda);border-radius:6px;color:var(--b-tinta);padding:0 12px}
.tg-nav label{display:flex;gap:6px;align-items:center;cursor:pointer}
.tg-main{max-width:900px;margin:0 auto;padding:16px 18px}
.tg section{display:grid;gap:10px}
.tg .c{background:var(--b-card);border:1px solid var(--b-borda);border-radius:12px;padding:12px 14px;min-width:0}
.tg small{display:block;color:var(--b-suave);font-size:12px}
.tg h4{margin:0 0 6px;font:600 11px var(--f-mono);letter-spacing:.06em;color:var(--b-suave)}
.tg .g2{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:12px;align-items:start}
.tg .col{display:grid;gap:10px;align-content:start;min-width:0}
.tg .in{display:flex;gap:10px;align-items:center;color:var(--b-suave)} .tg .in span:first-child{flex:1;border:1px solid var(--b-borda);border-radius:8px;padding:8px 10px}
.tg .tf{display:flex;gap:10px;align-items:center;padding:10px 14px} .tg .tf span{flex:1;min-width:0}
.tg .tf i{width:18px;height:18px;flex:none;clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%);background:#E0AF68}
.tg .tf em{font:600 11px var(--f-mono);font-style:normal;color:#9BE15D;border:1px solid currentColor;border-radius:5px;padding:1px 6px}
.tg .pr{font:600 10px var(--f-mono);color:#0B0C10;background:#8A96AB;border-radius:3px;padding:0 4px;margin-right:6px}
.tg .ln{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--b-borda);font-size:13px}
.tg .eu{display:flex;gap:14px;align-items:center}
.tg .av{width:56px;height:56px;border-radius:50%;background:url('../../../web/a/killua-3.png') center/cover;flex:none;border:2px solid var(--b-borda)}
.tg .xp{height:6px;border-radius:9px;background:var(--b-trilho);margin-top:6px} .tg .xp b{display:block;height:100%;width:62%;background:var(--b-tinta);border-radius:9px}
.tg .tres{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px} .tg .tres b{font:700 22px var(--f-mono)}
.tg .hm{display:grid;grid-template-columns:repeat(35,1fr);gap:3px;margin-top:8px} .tg .hm i{aspect-ratio:1;border-radius:2px;background:#9BE15D}
.tg .chips{display:flex;gap:8px} .tg .chips span{border:1px solid var(--b-borda);border-radius:99px;padding:3px 12px;font-size:12px;color:var(--b-suave)} .tg .chips span:first-child{color:var(--b-tinta);border-color:var(--b-tinta)}
.tg .loja{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.tg .it{display:grid;gap:8px} .tg .it i{display:block;height:86px;border-radius:8px}
.tg .it b{font-size:13px} .tg .it em{font:600 11px var(--f-mono);font-style:normal;color:#E0AF68}
.tg .ch{display:flex;gap:14px;align-items:center} .tg .ch i{width:56px;height:56px;border-radius:10px;background:var(--b-trilho);flex:none;display:grid;place-items:center;font:700 20px var(--f-mono);color:var(--b-suave)}
.tg .ch > div{flex:1;min-width:0} .tg .hp{height:10px;border-radius:9px;background:var(--b-trilho);margin-top:8px;overflow:hidden} .tg .hp b{display:block;height:100%;background:#F7768E;border-radius:9px}`;

function monta(palco, cfg, trocaDe){
  const antes = palco.style.cssText;
  palco.style.cursor = 'default';
  const app = document.createElement('div'); app.className = 'tg';
  const corpo = {
    lista: `<div class="g2"><div class="col"><div class="c in"><span>Nova tarefa: ex. Lista 3 de derivadas</span><span>+ adicionar</span></div>
      ${TAREFAS.map(([p, n, x]) => `<div class="c tf"><i></i><span><span class="pr">${p}</span>${n}</span><em>${x}</em></div>`).join('')}</div>
      <div class="col"><div class="c"><h4>QUANTO VALE</h4><small>até +23 XP por tarefa</small></div>
      <div class="c"><h4>RENDE MAIS AGORA</h4><div class="ln"><span>Mandar mensagem</span><b>+23</b></div><div class="ln"><span>Lavar o carro</span><b>+15</b></div></div>
      <div class="c"><h4>MISSÃO DA SEMANA</h4><b style="color:#E0AF68">Especialização</b><small>vida ×1,5 · 1/3 dias</small></div></div></div>`,
    perfil: `<div class="c eu"><span class="av"></span><div style="flex:1;min-width:0"><b>Caio</b> · andar 204<div class="xp"><b></b></div><small>hoje +0 XP · meta 65</small></div></div>
      <div class="tres"><div class="c"><h4>SEQUÊNCIA</h4><b>12</b><small>dias</small></div><div class="c"><h4>XP DA SEMANA</h4><b>1.840</b><small>2º no grupo</small></div><div class="c"><h4>JENNY</h4><b>3.250</b><small>na carteira</small></div></div>
      <div class="c"><h4>CONSTÂNCIA</h4><div class="hm">${hm}</div></div>`,
    loja: `<div class="chips"><span>Tudo</span><span>Efeitos</span><span>Bordas</span><span>Sons</span></div>
      <div class="loja">${LOJA.map(([n, c, p]) => `<div class="c it"><i style="background:${c}"></i><b>${n}</b><em>${p} J</em></div>`).join('')}</div>`,
    chefoes: CHEFES.map(([n, p], k) => `<div class="c ch"><i>${'ABC'[k]}</i><div><b>${n}</b><small>vida do chefão · ${p}%</small><div class="hp"><b style="width:${p}%"></b></div></div></div>`).join(''),
  };
  app.innerHTML = `<style>${CSS}</style>
    <nav class="tg-nav">${ABAS.map(([k, n]) => `<button type="button" data-aba="${k}" aria-pressed="false">${n}</button>`).join('')}
      <span class="tg-fim"><label><input type="checkbox" class="tg-auto"> trocar sozinho</label><button type="button" class="tg-prox">próxima aba ▶</button></span></nav>
    <main class="tg-main">${ABAS.map(([k]) => `<section id="v-${k}" hidden>${corpo[k]}</section>`).join('')}</main>`;
  palco.prepend(app);

  let atual = 0, tm = 0;
  const botoes = [...app.querySelectorAll('.tg-nav [data-aba]')], secs = ABAS.map(([k]) => app.querySelector('#v-' + k));
  const mostra = i => { atual = i; secs.forEach((s, j) => { s.hidden = j !== i; }); botoes.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i))); };
  mostra(0);
  const cor = () => cfg.claro ? {bg: '#F2F3F7', card: '#FFFFFF', borda: '#D9DCE5', tinta: '#1B1D28', suave: '#6B7088', trilho: '#E4E6EE'}
    : {bg: '#0B1120', card: '#121A2A', borda: '#243049', tinta: '#E6EDF7', suave: '#8A96AB', trilho: '#1C2538'};
  const pinta = () => { for(const [k, v] of Object.entries(cor())) app.style.setProperty('--b-' + k, v); };
  pinta();
  const abre = (i, origem) => {
    if(i === atual) return;
    const b = botoes[i].getBoundingClientRect();
    trocaDe().troca(() => mostra(i), origem || {x: b.left + b.width / 2, y: b.top + b.height / 2});
  };
  botoes.forEach((b, i) => b.onclick = e => abre(i, {x: e.clientX, y: e.clientY}));
  const proxima = origem => abre((atual + 1) % ABAS.length, origem);
  const prox = app.querySelector('.tg-prox');
  prox.onclick = e => { const b = prox.getBoundingClientRect(); proxima({x: b.left + b.width / 2, y: b.top + b.height / 2}); };
  const auto = on => { clearInterval(tm); if(on) tm = setInterval(() => proxima(), 2600 * Math.max(1, cfg.lento || 1)); };
  app.querySelector('.tg-auto').onchange = e => auto(e.target.checked);
  return {app, abre, proxima, auto, pinta, atual: () => atual, mostra,
    desliga(){ clearInterval(tm); app.remove(); palco.style.cssText = antes; }};
}

window.TR_PALCO = {monta};
})();
