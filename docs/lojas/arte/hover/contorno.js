// Hover Contorno (hv-contorno), comum: a borda do card passa para a cor do texto.
// Conserta o de hoje (o contorno aparecia e sumia de uma vez). Agora acende rápido ao entrar e apaga mais devagar ao
// sair, para o olho seguir o cursor sem piscar ao passar por vários cards. Só CSS: nenhum laço, nenhum evento, e não
// mexe nas outras transições do card (transform e box-shadow do jogo continuam iguais).
// No jogo, basta a regra de CSS de REGRA (no lugar do :root[data-hover="contorno"] .card:hover do web/efeitos.js).
//   const h = CURSORES.contorno.cola(raiz, {seletor: '.card', entra: 120, sai: 350})   h.ajusta({sai: 500})   (em ms)   h.desliga()
//   CURSORES.contorno.liga(palco, cfg) → {ajusta, legenda, estado, desliga}: a bancada, um pedaço do jogo de mentira
(() => {
// a regra que vai para o jogo: a saída fica na regra base e a entrada no :hover (a transição usa a do estado de destino)
const REGRA = (pre, sel, entra, sai) => `
${pre} ${sel}{transition:transform .2s,box-shadow .2s,border-color ${sai}ms ease-out}
${pre} ${sel}:hover{border-color:var(--ink);transition:transform .2s,box-shadow .2s,border-color ${entra}ms ease-out}`;
const ANTIGA = (pre, sel) => `\n${pre} ${sel}:hover{border-color:var(--ink)}`;

function cola(raiz, cfg){
  cfg = Object.assign({seletor: '.card', entra: 120, sai: 350, antigo: 0}, cfg);
  const tela = raiz === document.documentElement || raiz === document.body;
  const marca = 'ct-' + Math.random().toString(36).slice(2, 8), est = document.createElement('style');
  raiz.classList.add(marca); document.head.append(est);
  const pinta = () => {
    const pre = (tela ? ':root' : '') + '.' + marca;
    est.textContent = cfg.antigo ? ANTIGA(pre, cfg.seletor) : REGRA(pre, cfg.seletor, cfg.entra, cfg.sai);
  };
  pinta();
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); },
    estado: () => ({antigo: !!cfg.antigo, entra: cfg.entra, sai: cfg.sai}),
    legenda: () => cfg.antigo ? 'versão de hoje: aparece e some de uma vez' : `acende em ${cfg.entra} ms · apaga em ${cfg.sai} ms`,
    desliga(){ est.remove(); raiz.classList.remove(marca); },
  };
}

// ---- bancada: um pedaço do jogo de mentira na tela preta, com cards pequenos lado a lado para passar o mouse depressa
const TAREFAS = [['A', 'Perguntar ao professor de Redes se o trabalho vale nota', '+23'], ['A', 'Mandar mensagem da caixa', '+23'], ['C', 'Lavar o carro', '+15'], ['B', 'Ler 20 páginas', '+12']];
function liga(palco, cfg){
  const antes = palco.style.cssText, pag = document.createElement('div');
  palco.style.cursor = 'default';
  pag.className = 'ct-pag';
  const cor = () => cfg.claro ? {bg: '#F2F3F7', card: '#FFFFFF', borda: '#D9DCE5', tinta: '#1B1D28', suave: '#6B7088'}
    : {bg: '#0B1120', card: '#121A2A', borda: '#243049', tinta: '#E6EDF7', suave: '#8A96AB'};
  pag.innerHTML = `<style>
    .ct-pag{position:absolute;inset:0;overflow:hidden;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-content:start;font:14px var(--f-ui)}
    .ct-pag .ct-col{display:grid;gap:10px;align-content:start;min-width:0}
    .ct-pag .ct-card{background:var(--b-card);border:1px solid var(--b-borda);border-radius:12px;padding:12px 14px;color:var(--b-tinta);min-width:0}
    .ct-pag .ct-tf{display:flex;gap:10px;align-items:center} .ct-pag .ct-tf span{flex:1;min-width:0}
    .ct-pag .ct-tf i{width:18px;height:18px;flex:none;clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%);background:#E0AF68}
    .ct-pag .ct-tf em{font:600 11px var(--f-mono);font-style:normal;color:#9BE15D;border:1px solid currentColor;border-radius:5px;padding:1px 6px}
    .ct-pag .ct-pr{font:600 10px var(--f-mono);color:#0B0C10;background:#8A96AB;border-radius:3px;padding:0 4px;margin-right:6px}
    .ct-pag .ct-gr{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .ct-pag .ct-gr .ct-card{text-align:center;padding:14px 6px;color:var(--b-suave);font:600 11px var(--f-mono)}
    .ct-pag h4{margin:0 0 6px;font:600 11px var(--f-mono);letter-spacing:.06em;color:var(--b-suave)}
    .ct-pag .ct-ln{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--b-borda);font-size:13px}
  </style>
  <div class="ct-col">
    ${TAREFAS.map(([p, n, x]) => `<div class="ct-card ct-tf"><i></i><span><span class="ct-pr">${p}</span>${n}</span><em>${x}</em></div>`).join('')}
    <div class="ct-gr">${['XP', 'JENNY', 'ANDAR', 'DIAS'].map(t => `<div class="ct-card">${t}</div>`).join('')}</div>
  </div>
  <div class="ct-col">
    <div class="ct-card"><h4>RENDE MAIS AGORA</h4><div class="ct-ln"><span>Mandar mensagem</span><b>+23</b></div><div class="ct-ln"><span>Lavar o carro</span><b>+15</b></div></div>
    <div class="ct-card"><h4>MISSÃO DA SEMANA</h4><b style="color:#E0AF68">Especialização</b></div>
  </div>`;
  const pinta = () => { const c = cor(); palco.style.background = c.bg; palco.style.setProperty('--ink', c.tinta); for(const [k, v] of Object.entries(c)) pag.style.setProperty('--b-' + k, v); };
  palco.prepend(pag); pinta();
  const h = cola(palco, Object.assign(cfg, {seletor: '.ct-card'}));
  return {
    ajusta(o){ Object.assign(cfg, o); pinta(); h.ajusta(cfg); },
    estado: h.estado, legenda: h.legenda,
    desliga(){ h.desliga(); pag.remove(); palco.style.cssText = antes; },
  };
}

(window.CURSORES = window.CURSORES || {}).contorno = {cola, liga,
  titulo: 'passe o mouse depressa por vários cards',
  dica: 'o contorno acende rápido ao entrar e apaga devagar ao sair: passando por vários cards, fica um rastro curto em vez de piscar<br>"versão de hoje" mostra como era (aparece e some de uma vez)',
  controles: [{k: 'entra', rot: 'acender', min: 50, max: 400, un: ' ms', padrao: 120},
    {k: 'sai', rot: 'apagar', min: 100, max: 800, un: ' ms', padrao: 350},
    {k: 'antigo', rot: 'versão de hoje', min: 0, max: 1, un: '', padrao: 0},
    {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
