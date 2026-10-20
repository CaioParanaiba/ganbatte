/* Ganbatte · arte nova das lojas em teste (#134): o que a fila de arte (docs/lojas/arte/) já fez, para os devs provarem na beta.
 * Cada item da Masadora e da Loja da Associação que tem arte nova ganha o aviso de onde ele está (fechado, falta finalizar,
 * em aberto), uma frase do que falta e a troca "antiga | nova". A nova só aparece no provar, no ▶ e no provador: nada
 * de arte nova se compra nem se equipa. Quem comprou o Godspeed ou o Jajanken continua com a versão de hoje.
 * - Os módulos em código (cursores, efeitos, heatmaps) e as imagens aprovadas ficam em web/arte/, copiados da bancada pelo
 *   docs/lojas/arte/leva.py; a licença nova é o web/arte/licenca.js.
 * - Provando com a nova, o atributo do <html> ganha "-nova" (data-cursor="carta-nova"...): o CSS daqui pega esse valor,
 *   e os cursores e os hovers em código ligam pelo GB_FX.aplica.
 * - Ideias da fila ainda não feitas (status `ideia` na FILA.md) entram na vitrine como card "em desenvolvimento" (IDEIAS):
 *   não se compram nem se provam, só mostram o que vem e a faixa decidida. Mudou a FILA.md, mudar aqui também.
 * Carregado depois do efeitos.js e antes do grupo.js: usa UI, COS (via GBx), GB_FX, CURSORES, render, esc, vista.
 */
(() => {
const IMG = n => (window.GB_ARTE_IMG || {})[n] || `arte/${n}.png`;   // no modo demonstração (standalone.py) as imagens vêm embutidas
const ST = {fechado:'fechado', finalizar:'falta finalizar', aberto:'em aberto', dev:'em desenvolvimento'};
/* id do item na loja → st: o status da arte; tx: o que é e o que falta; sem: true quando ainda não há versão nova para ver */
const ARTE = {
  'hp-corrente':   {st:'fechado', tx:'A tira de corrente aprovada (16/10). Na nova, a vida do chefão vira a corrente desenhada.'},
  'bd-corrente':   {st:'finalizar', tx:'Provisória: variação 1, com 11 px de espessura. Falta decidir se a versão refeita, com a corrente toda dentro da faixa, substitui esta.'},
  'cr-carta':      {st:'fechado', tx:'Aprovada (17/10). Feita em código: clique atira a carta, segurar prende na Bungee Gum, parado ele vira a carta.'},
  'cr-agulha':     {st:'fechado', tx:'Aprovada (20/10). Feita em código: clique atira e crava (trinca a borda); segurar chama de volta pelo fio de nen e abre o leque.'},
  'cr-ioio':       {st:'fechado', tx:'Aprovado (20/10). Feito em código: dois ioiôs; clique desce, segurar dorme e carrega os fios de eletricidade, soltar volta (carregado, como raio).'},
  'fx-godspeed':   {st:'fechado', tx:'Aprovado (20/10). O Kanmuru acende no card, o raio cai com quadro negativo, o 神速 entra com rastros e a marca do raio fica no card.'},
  'fx-jajanken':   {st:'fechado', tx:'Aprovado (20/10): as três mãos, com o grito em japonês. O ▶ da nova passa por pedra, papel e tesoura, nessa ordem.'},
  'hv-bungee':     {st:'finalizar', tx:'Quase fechado: espera a resposta final. A goma cobre o contorno do card; ao sair, a borda vira membrana, estica e rasga como elástico.'},
  'hv-en':         {st:'finalizar', tx:'Quase fechado: espera a resposta final. O card acende o Ten e o En da Pitou se abre do ponto tocado; os cards alcançados acendem os cantos.'},
  'hv-shu':        {st:'fechado', tx:'Aprovado (20/10). A aura corre o contorno a partir do ponto tocado, duas faíscas correm a borda e ela escorre ao sair.'},
  'hv-contorno':   {st:'fechado', tx:'Aprovado (20/10). O contorno acende em 120 ms e apaga em 350 ms, sem piscar ao passar por vários cards.'},
  'hm-cartas':     {st:'fechado', tx:'Aprovada (17/10): carta de frente por nível, carta de figura no dia mais forte, verso no dia vazio e Coringa no dia salvo.'},
  'hm-chamas':     {st:'fechado', tx:'Aprovada (20/10): chama maior por nível, cinza no dia vazio, nen no dia salvo, fogo laranja. Provando, "acender hoje" mostra o acender.'},
  'lic-exame':     {st:'fechado', tx:'Carimbo 念 com anel duplo (16/10).'},
  'lic-chefao':    {st:'fechado', tx:'Selo da torre de tijolos com coroa e folhas (16/10).'},
  'lg-exame':      {st:'fechado', tx:'Selo quadrado tipo hanko, vermelho, com um nó entalhado (16/10).'},
  'lic-emb-aranha':{st:'fechado', tx:'Aranha de 12 patas, solta no painel preto, sem a caixa branca (16/10).'},
  'lg-rei':        {st:'aberto', sem:true, tx:'A coroa feita no Gemini não agradou. Falta um desenho novo, e a nova ainda é a coroa de hoje.'},
  'lic-ouro':      {st:'finalizar', tx:'Três dourados chapados para escolher: filete, chanfro e losangos. O provador da nova mostra os três.'},
  'lic-estojo':    {st:'finalizar', tx:'Couro preto com costura, em volta do cartão novo. Aprovado, mas ainda provisório.'},
  'lic-corrente':  {st:'finalizar', tx:'A corrente do Kurapika dando a volta no estojo. Aprovada, mas ainda provisória.'},
  'emb-naipe':     {st:'finalizar', tx:'Os quatro naipes estão fechados, com os traços do cursor da carta. Falta o veredito do Coringa (estrela e lágrima).'},
};
/* ideias da fila ainda sem arte: [id, prateleira (cat; ev = na hora da conquista), faixa decidida ('' = a decidir), de quem,
   nome, descrição, status, o que falta]. A Marca de prazo (prazo) é uma categoria inteira em teste: sai se não agradar */
const PRAZO = ' Faz parte da Marca de prazo, categoria em teste: se os estilos não agradarem, ela sai inteira.';
const IDEIAS = [
  ['cr-vara', 'cursor', 'epico', 'Gon', 'Vara de pescar do Gon', 'O cursor vira a vara de pescar: o clique lança a linha e fisga o card.', 'dev', 'Ideia aprovada, ainda sem arte. Vai em código, com física como a carta e o ioiô: linha com anzol e boia, segurar recolhe.'],
  ['fx-borboletas', 'fx', 'epico', 'Pouf', 'Borboletas do Pouf', 'Borboletas de aura voam devagar pelo fundo, juntam-se perto do mouse e se espalham no clique.', 'dev', 'Ideia aprovada, ainda sem arte. Entra no lugar da Poeira de Nen; falta decidir se os pacotes que têm a poeira ficam com ela.'],
  ['fx-costura', 'ev', 'epico', 'Machi', 'Costura da Machi', 'Ao concluir, o card racha no meio e os fios de nen o costuram de volta, ponto a ponto.', 'dev', 'Ideia aprovada, ainda sem arte. Vai em código, com o fio puxado no fim.'],
  ['fx-dragao', 'ev', 'epico', 'Zeno', 'Dragon Dive', 'No andar novo, o dragão de aura sobe, curva no alto e desce em chuva de dragõezinhos.', 'dev', 'Ideia aprovada, ainda sem arte. Vai em código, como alternativa aos fogos.'],
  ['fx-soco', 'ev', 'raro', 'Leorio', 'Soco remoto do Leorio', 'No andar novo, um portal de nen abre perto do card e o punho do Leorio sai dele.', 'dev', 'A decidir: anotada como raro, só no andar novo; o Caio quer ver na prática antes de decidir se fica.'],
  ['bd-costura', 'borda', 'raro', 'Machi', 'Costura de nen', 'A borda dos cards vira uma costura de fio de nen, em zigue-zague.', 'dev', 'Ideia aprovada, ainda sem arte. Parada, em CSS ou SVG.'],
  ['hm-gungi', 'heat', 'raro', 'Meruem e Komugi', 'Constância no Gungi', 'O heatmap vira um tabuleiro de Gungi: cada dia jogado é uma peça, mais alta quanto mais forte o dia; o dia salvo é o Rei.', 'dev', 'Ideia aprovada, ainda sem arte. Parada, em CSS.'],
  ['tr-fumaca', 'trans', 'raro', 'Morel', 'Fumaça do Morel', 'Ao trocar de aba, a fumaça do Deep Purple cobre a tela por meio segundo e se desfaz na aba nova.', 'dev', 'Ideia aprovada, ainda sem arte. Curta, em CSS.'],
  ['tr-aspira', 'trans', '', 'Shizuku', 'Deme-chan', 'Ao trocar de aba, a Deme-chan suga a tela antiga pelo bocal e a aba nova aparece atrás.', 'dev', 'A decidir: falta uma prévia para ver antes de decidir (faixa sugerida: raro).'],
  ['tt-medico', 'title', 'comum', 'Leorio', 'Futuro Médico', 'Título para quem estuda.', 'dev', 'Ideia aprovada, ainda não entrou no catálogo.'],
  ['at-countdown', 'prazo', 'raro', 'Genthru', 'Countdown do Genthru', 'A bomba do Countdown na tarefa com prazo, com os dias que faltam; amanhã e hoje o número fica vermelho, e atrasada ela estoura.', 'aberto', 'Primeira versão feita, em aberto: a prévia mostra 5 dias, amanhã, hoje e 2 dias de atraso.' + PRAZO],
  ['at-carimbo', 'prazo', 'comum', 'Exame Hunter', 'Carimbo de atrasada', 'Um carimbo vermelho torto na tarefa atrasada, no estilo dos carimbos da licença.', 'dev', 'Ideia, ainda sem arte.' + PRAZO],
  ['fx-hakoware', 'prazo', 'raro', 'Knuckle', 'Hakoware', 'O selo do Hakoware com os dias de juros, parado na tarefa atrasada.', 'dev', 'Ideia, ainda sem arte (a versão simples, sem o Potclean animado).' + PRAZO],
  ['at-agulha', 'prazo', 'raro', 'Illumi', 'Agulha na atrasada', 'Uma agulha do Illumi espetada no canto da tarefa atrasada, com uma trinca leve.', 'dev', 'Ideia, ainda sem arte (reaproveita o desenho do cursor da agulha).' + PRAZO],
  ['at-ampulheta', 'prazo', 'raro', 'Exame Hunter', 'Ampulheta do Exame', 'Uma ampulheta na tarefa com prazo, que esvazia conforme o prazo chega.', 'dev', 'Ideia, ainda sem arte.' + PRAZO],
];
const ITENS_DEV = IDEIAS.map(([id, c, fa, quem, n, d, st, tx]) => {
  ARTE[id] = {st, tx, sem: true, ideia: true};
  return {id, cat: c === 'ev' ? 'fx' : c, ...(c === 'ev' ? {ev: 1} : {}), fa, hxh: 1, quem, n, d, dev: 1, prova: 1, p: 0};   // prova: não é "vem com o jogo" nem se compra
});

/* a licença inteira (o cartão novo), que não é item da loja: aparece no provador da Associação */
const CARTAO = {st:'finalizar', tx:'O cartão novo, fiel ao do anime, com lugar para as estrelas, o carimbo e o emblema, foi aprovado como provisório. Falta decidir como a versão em pé entra no placar.'};
const VER = {};   // id → 'antiga' ou 'nova', só nesta tela (o padrão é a nova)
const tem = id => !!ARTE[id];
const nova = id => tem(id) && !ARTE[id].sem && VER[id] !== 'antiga';

/* naipes do emblema (os traços do cursor da carta, em máscara na cor do texto; ♥ e ♦ vermelhos) e o Coringa */
const NAIPE = {
  espadas: 'M0 -.48 C.1 -.33 .5 -.12 .5 .1 C.5 .32 .2 .38 .05 .22 Q.07 .42 .2 .5 L-.2 .5 Q-.07 .42 -.05 .22 C-.2 .38 -.5 .32 -.5 .1 C-.5 -.12 -.1 -.33 0 -.48 Z',
  copas: 'M0 .42 C-.1 .3 -.5 .06 -.5 -.16 C-.5 -.43 -.16 -.5 0 -.26 C.16 -.5 .5 -.43 .5 -.16 C.5 .06 .1 .3 0 .42 Z',
  ouros: 'M0 -.5 Q.14 -.17 .38 0 Q.14 .17 0 .5 Q-.14 .17 -.38 0 Q-.14 -.17 0 -.5 Z',
  paus: 'M.21 -.25 A.21 .21 0 1 0 -.21 -.25 A.21 .21 0 1 0 .21 -.25 Z M-.04 .05 A.21 .21 0 1 0 -.46 .05 A.21 .21 0 1 0 -.04 .05 Z M.46 .05 A.21 .21 0 1 0 .04 .05 A.21 .21 0 1 0 .46 .05 Z M-.06 0 Q-.06 .4 -.2 .5 L.2 .5 Q.06 .4 .06 0 Z',
};
const CORINGA = '<path d="M-.13 -.48 L-.029 -.238 L.231 -.217 L.033 -.047 L.093 .207 L-.13 .071 L-.353 .207 L-.293 -.047 L-.491 -.217 L-.231 -.238 Z" fill="#FFD23F" stroke="#11131A" stroke-width=".05" stroke-linejoin="round"/><path d="M.2 -.179 C.27 -.034 .409 .111 .409 .239 A.209 .209 0 0 1 -.009 .239 C-.009 .111 .13 -.034 .2 -.179 Z" fill="#FF5C8A" stroke="#11131A" stroke-width=".05" stroke-linejoin="round"/>';
const naipe = s => `<svg class="ar-naipe" viewBox="-.6 -.6 1.2 1.2" aria-label="${s}">${s === 'coringa' ? CORINGA : `<path d="${NAIPE[s]}" fill="${s === 'copas' || s === 'ouros' ? '#E0365A' : 'currentColor'}"/>`}</svg>`;

const CSS = `
/* ---------- aviso e troca no card ---------- */
.ar7{display:grid;gap:5px;margin:6px 0 2px;padding:7px 9px;border-radius:8px;border:1px dashed var(--hair);font-size:12.5px;line-height:1.4;color:var(--soft)}
.ar7 .ar-l{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between}
.ar-st{font:700 10.5px var(--f-mono);letter-spacing:.04em;text-transform:uppercase;padding:1px 8px;border-radius:99px;border:1px solid currentColor;white-space:nowrap}
.ar-st.fechado{color:var(--grn)} .ar-st.finalizar{color:var(--amb)} .ar-st.aberto{color:var(--red)} .ar-st.dev{color:var(--soft);border-style:dashed}
/* card em desenvolvimento: a prévia vazia, com de quem é; e a bomba do Countdown */
.it7 .pv.dev7{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;border:1px dashed var(--hair);background:var(--panel)}
.pv.dev7 b{font:700 11px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--soft)} .pv.dev7 span{font-size:13px;color:var(--faint)}
.pv.at7{display:flex;gap:10px;align-items:center;justify-content:center}
.ar-tg{display:inline-flex;border:1px solid var(--hair);border-radius:99px;overflow:hidden}
.ar-tg button{all:unset;cursor:pointer;font:600 11px var(--f-mono);padding:2px 9px;color:var(--soft)}
.ar-tg button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}
.ar-res{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-size:13px}
.ar-res .ar-st{font-size:11px}
#faixa-prova .ar-tg{border-color:#0b0d12} #faixa-prova .ar-tg button{color:#0b0d12} #faixa-prova .ar-tg button[aria-pressed="true"]{background:#0b0d12;color:#fff}
.ar-naipe{width:1.05em;height:1.05em;vertical-align:-.15em;display:inline-block} .tl-emb .ar-naipe{color:var(--ink)}
/* ---------- a versão nova no jogo (provando) e nas prévias da loja ---------- */
:root[data-borda="corrente-nova"] .card,.bd-corrente-nova .mc{border:11px solid transparent;border-image:url(${IMG('bd-corrente')}) 12% / 11px round}
:root[data-hp="corrente-nova"] :is(.hp4 > b,.l-boss .hp i),.hp-corrente-nova .hp7 > i > b{background:url(${IMG('corrente-tira')}) 0 50%/auto 100% repeat-x}
:root[data-cursor$="-nova"] body,:root[data-cursor$="-nova"] body *{cursor:none!important}
.pvc .cur7 canvas{width:72px;height:72px}
.pvc .hmn{position:absolute;inset:12px 18px;display:grid;place-items:center} .pvc .hmn .l-hg{--n:9;grid-template-rows:repeat(4,auto);grid-template-columns:repeat(9,15px)}`;
const st = document.createElement('style'); st.id = 'gb-arte'; st.textContent = CSS; document.head.appendChild(st);
/* heatmaps em CSS: o mesmo CSS dos módulos, com o seletor do jogo e o da prévia */
if(window.CURSORES){
  const C = CURSORES, h = document.createElement('style'); h.id = 'gb-arte-heat';
  const es = C.cartas.naipe('espadas');
  h.textContent = C.cartas.css(':root[data-heat="cartas-nova"]') + C.cartas.css('.hm-cartas-nova')
    + `\n:root[data-heat="cartas-nova"],.hm-cartas-nova{--naipe:${es}}\n` + C.chamas.css(':root[data-heat="chamas-nova"]') + C.chamas.css('.hm-chamas-nova');
  document.head.appendChild(h);
}

/* a fonte japonesa dos gritos (グー！パー！チー！, ボッ, カタカタ, 神速 カンムル): Dela Gothic One, só com essas letras */
let fonteOk = null;
function fonte(){
  if(fonteOk) return fonteOk;
  const txt = 'グーパーチー！ボッカタ神速ンムルPEDRAPAPELTESOURA';
  if(!document.querySelector('link[href*="Dela+Gothic+One"]')){
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap&text=' + encodeURIComponent(txt); document.head.append(l);
  }
  fonteOk = new Promise(ok => setTimeout(ok, 1500)).then(() => document.fonts.load('20px "Dela Gothic One"', txt)).catch(() => {});
  return fonteOk;
}

/* ---------- cursores em código: ligam quando o <html> pede um "-nova" ---------- */
let cur = null, curK = '';
function cursor(){
  const v = document.documentElement.getAttribute('data-cursor') || '', k = v.endsWith('-nova') ? v.slice(0, -5) : '';
  if(k === curK) return;
  if(cur){ cur.desliga(); cur = null; }
  curK = k;
  if(k && window.CURSORES && CURSORES[k]){ cur = CURSORES[k].liga(document.body, {}); if(k === 'agulha') fonte(); }
}
/* ---------- hovers em código: colam nos cards quando o <html> pede um "-nova" (o tamanho do card já muda o efeito) ----------
   TROCADO: os que a versão de hoje tinha defeito e o código já a substituiu: ligam com ou sem "-nova" (vira: o giro em CSS
   reiniciava a cada ~130 ms e girava painéis inteiros, #142) */
const TROCADO = ['vira'];
let hov = null, hovK = '';
function hover(){
  const v = document.documentElement.getAttribute('data-hover') || '', k = v.endsWith('-nova') ? v.slice(0, -5) : TROCADO.includes(v) ? v : '';
  if(k === hovK) return;
  if(hov){ hov.desliga(); hov = null; }
  hovK = k;
  if(k && window.CURSORES && CURSORES[k] && CURSORES[k].cola) hov = CURSORES[k].cola(document.documentElement, {seletor: '.card'});
}
if(window.GB_FX){
  const aplica = GB_FX.aplica, ver = GB_FX.ver;
  GB_FX.aplica = function(){ aplica.apply(this, arguments); cursor(); hover(); };
  /* ▶ na loja: com a nova escolhida, o efeito novo cai no card do item */
  let mao = 0;
  GB_FX.ver = function(id, r){
    const k = {'fx-godspeed':'godspeed', 'fx-jajanken':'jajanken'}[id];
    if(!k || !nova(id) || !window.CURSORES) return ver.apply(this, arguments);
    const b = document.querySelector(`[data-fxver="${id}"]`), card = b && b.closest('.it7'), rr = card ? card.getBoundingClientRect() : r;
    if(k === 'godspeed') return fonte().then(() => CURSORES.godspeed.dispara(rr, {el: card}));
    const m = ['pedra', 'papel', 'tesoura'][mao++ % 3];
    fonte().then(() => CURSORES.jajanken.dispara(rr, {el: card, mao: m}));
  };
}

/* ---------- o que o index.html e o grupo.js chamam ---------- */
const troca = id => `<span class="ar-tg" role="group" aria-label="versão">${['antiga', 'nova'].map(v => `<button type="button" data-arte="${id}:${v}" aria-pressed="${(nova(id) ? 'nova' : 'antiga') === v}">${v}</button>`).join('')}</span>`;
window.GB_ARTE = {
  ARTE, CARTAO, ST, tem, nova, naipe, fonte, troca,
  so: false,   // o filtro "arte nova" da Masadora
  /* os cards em desenvolvimento da vitrine (não se compram nem se provam) e a prévia deles */
  ideias: ITENS_DEV,
  pvDev(it){
    if(it.id === 'at-countdown' && window.CURSORES && CURSORES.countdown) return `<div class="pv at7">${[5, 1, 0, -2].map(k => CURSORES.countdown.marca(k, 40)).join('')}</div>`;
    return `<div class="pv dev7"><b>em desenvolvimento</b><span>${esc(it.quem)}</span></div>`;
  },
  /* provando com a nova: o valor do atributo ganha "-nova" (vista() no index.html) */
  vista(v, it){ if(nova(it.id) && it.eq && v[it.cat] === it.eq[it.cat] && ['borda','cursor','hp','heat','hover'].includes(it.cat)) v[it.cat] += '-nova'; },
  /* a classe da prévia do card (pvNovo): a nova, se for a escolhida */
  k(it){ const k = it.eq[it.cat]; return nova(it.id) && ['borda','hp','heat'].includes(it.cat) ? k + '-nova' : k; },
  /* a prévia do cursor e do heatmap novos no card */
  pv(it){
    if(!nova(it.id)) return '';
    if(it.cat === 'cursor') return `<canvas data-arte-cur="${it.eq.cursor}" width="144" height="144"></canvas>`;
    if(it.cat === 'heat'){ const d = 'h3 h1 h4 . h2 z h4 h3 h1 . h2 h4 h3 h4 . h1 z h2 h3 h4 h2 h1 . h3 h4 h2 h3 . h1 h4 hj fut fut fut fut fut'.split(' ');
      return `<div class="hmn hm-${it.eq.heat}-nova"><div class="l-hg" style="--c:var(--grn)">${d.map(c => `<i class="${c === '.' ? '' : c}"></i>`).join('')}</div></div>`; }
    return '';
  },
  /* o aviso do card: status, a frase e a troca (na Associação, sem troca: ela fica no provador, para a licença inteira) */
  aviso(id, semTroca){ const a = ARTE[id]; if(!a) return '';
    return `<div class="ar7"><span class="ar-l"><span class="ar-st ${a.st}" title="arte nova (#134)">arte: ${ST[a.st]}</span>${a.ideia ? '' : a.sem ? '<span class="sub">ainda sem versão nova</span>' : semTroca ? '<span class="sub">antiga | nova no provador</span>' : troca(id)}</span><span>${esc(a.tx)}</span></div>`; },
  /* o resumo no alto da Masadora */
  resumo(ids){
    const l = ids.filter(tem), n = s => l.filter(id => ARTE[id].st === s).length;
    return `<div class="sec7"><h3>Arte nova em teste</h3><p>Os itens com o aviso "arte" ganharam um desenho novo na fila de arte (#134). Use a troca <b>antiga | nova</b> e o provar (ou o ▶) para comparar. A versão nova ainda não se compra: quem compra ou já tem fica com a de hoje. Os cards "em desenvolvimento" são ideias aprovadas que ainda não têm arte: mostram o que vem e a faixa.</p>
      <div class="ar-res"><span class="ar-st fechado">fechado ${n('fechado')}</span><span class="ar-st finalizar">falta finalizar ${n('finalizar')}</span><span class="ar-st aberto">em aberto ${n('aberto')}</span><span class="ar-st dev">em desenvolvimento ${n('dev')}</span>
      <button type="button" class="btn${this.so ? ' v' : ''}" data-arteso>${this.so ? 'mostrar todos os itens' : 'só os itens com arte nova'}</button></div></div>`;
  },
  /* na faixa do provar: a troca e, nas chamas, o acender */
  faixa(id){ if(!tem(id) || ARTE[id].sem) return '';
    return `<span style="display:flex;gap:8px;align-items:center">versão ${troca(id)}${id === 'hm-chamas' && nova(id) ? '<button type="button" class="btn" data-artehoje style="background:#0b0d12;color:#fff;border-color:#0b0d12">acender hoje</button>' : ''}</span>`; },
};

/* desenha os cursores novos nas prévias dos cards (canvas que acabou de entrar na página) */
function pinta(){
  if(!window.CURSORES) return;
  for(const c of document.querySelectorAll('canvas[data-arte-cur]:not([data-ok])')){
    c.dataset.ok = 1; const g = c.getContext('2d'), k = c.dataset.arteCur; g.scale(2, 2);
    if(k === 'carta') CURSORES.carta.desenha(g, {n:'K', s:'c'}, 36, 36, 40, -.22);
    if(k === 'ioio'){ g.strokeStyle = '#E8ECF4'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(36, 2); g.lineTo(36, 40); g.stroke(); CURSORES.ioio.desenha(g, 36, 48, 15, -.3); }
    if(k === 'agulha') CURSORES.agulha.desenha(g, 15, 57, 60, 3 * Math.PI / 4);
  }
}
new MutationObserver(pinta).observe(document.documentElement, {childList:true, subtree:true});

document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-arte],[data-arteso],[data-artehoje]'); if(!t) return;
  if(t.dataset.arte){ const [id, v] = t.dataset.arte.split(':'); VER[id] = v; }
  else if(t.hasAttribute('data-arteso')) GB_ARTE.so = !GB_ARTE.so;
  else { const hj = document.querySelector('.l-hg i.hj'); if(hj) CURSORES.chamas.acende(hj); else toast('O dia de hoje fica na Lista, no heatmap da constância: abra a aba e tente de novo.'); return; }
  render();
});
})();
