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
const ST = {fechado:'fechado', finalizar:'falta outro dev', aberto:'em aberto', dev:'em desenvolvimento'};
/* id do item na loja → st: o status da arte (fechado; finalizar = o Caio aprovou e falta o outro dev ver; aberto); tx: o que
   é e o que falta; sem: true quando ainda não há versão nova para ver; fixo: a versão do jogo já é a final (ou fica a de hoje),
   sem troca. Na beta, a borda do card da vitrine mostra o status: verde fechado, dourada falta outro dev, vermelha em aberto ou
   ainda não revisto (todo item que não está aqui) */
const ARTE = {
  'hp-corrente':   {st:'fechado', tx:'Aprovada (20/10): a vida do chefão vira a corrente escarlate, presa pela ponta; o trecho perdido fica com a corrente apagada.'},
  'bd-corrente':   {st:'fechado', tx:'Aprovada (20/10): a corrente da licença, fina, com uma argola em cada canto e a esfera da Dowsing Chain balançando no canto de baixo (acelera com o mouse).'},
  'fx-shim':       {st:'fechado', tx:'Aprovada (20/10): a eletricidade do Killua. Um raio estala dentro da barra de XP, a ponta solta faíscas com um arco para o vazio e, de tempos em tempos, a barra dá uma descarga.'},
  'fx-corrente':   {st:'fechado', tx:'Aprovada (20/10): a corrente vai e volta presa à lâmina da Judgment Chain, na ponta da barra de XP.'},
  'cr-carta':      {st:'fechado', tx:'Aprovada (17/10). Feita em código: clique atira a carta, segurar prende na Bungee Gum, parado ele vira a carta.'},
  'cr-agulha':     {st:'fechado', tx:'Aprovada (20/10). Feita em código: clique atira e crava (trinca a borda); segurar chama de volta pelo fio de nen e abre o leque.'},
  'cr-ioio':       {st:'aberto', tx:'Voltou a um ioiô só (20/10), para não atrapalhar os truques. Clique desce, segurar dorme; segurando com a mão parada o fio carrega de eletricidade e ele volta como raio. Falta o Caio aprovar.'},
  'fx-godspeed':   {st:'fechado', tx:'Aprovado (20/10). O Kanmuru acende no card, o raio cai com quadro negativo, o 神速 entra com rastros e a marca do raio fica no card.'},
  'fx-rastro':     {st:'finalizar', tx:'Refeito em código (21/10): vapor de aura que sobe ondulando; parado, o Ten ainda solta fiapos; o clique é o Ren. Aprovado pelo Caio, ainda provisório.'},
  'fx-rastro-fio': {st:'finalizar', tx:'Novo (21/10), 2º modelo do rastro: uma fita de aura com física de corda que chicoteia, estala em faíscas e se recolhe; o clique manda um pulso. Aprovado pelo Caio, ainda provisório.'},
  'fx-rastro-eco': {st:'finalizar', tx:'Novo (21/10), 3º modelo do rastro: ecos atrasados do cursor com a cor partida, que o alcançam num lampejo; o clique abre os quatro em roda. Aprovado pelo Caio, ainda provisório.'},
  'fx-jajanken':   {st:'fechado', tx:'Aprovado (20/10): as três mãos, com o grito em japonês. O ▶ da nova passa por pedra, papel e tesoura, nessa ordem.'},
  'hv-bungee':     {st:'fechado', tx:'Aprovado (20/10). A goma cobre o contorno do card; ao sair, a borda vira membrana, estica e rasga como elástico.'},
  'hv-en':         {st:'fechado', tx:'Aprovado (20/10). O card acende o Ten e o En da Pitou se abre do ponto tocado, só até os vizinhos; os cards alcançados acendem os cantos.'},
  'hv-shu':        {st:'fechado', tx:'Aprovado (20/10). A aura corre o contorno a partir do ponto tocado, duas faíscas correm a borda e ela escorre ao sair.'},
  'hv-vira':       {st:'fechado', sem:true, fixo:'já no jogo', tx:'Aprovado (20/10). Feito em código, o card vira e mostra o verso; já substituiu o giro antigo, que reiniciava com o mouse mexendo.'},
  'fx-gyo':        {st:'finalizar', tx:'Refeito em código (20/10): cada card guarda um nen escondido (fios, poeira e selos) que só aparece na lente de aura, onde o mouse está; ao entrar, os olhos focam. Aprovado pelo Caio (21/10); falta o outro dev ver.'},
  'fx-baralho':    {st:'fechado', sem:true, fixo:'fica a de hoje', tx:'Revisto (20/10): o castelo de cartas e as cartas em órbita foram recusados; fica o leque de naipes de hoje.'},
  'bd-corte':      {st:'finalizar', sem:true, fixo:'já no jogo', tx:'Aprovada pelo Caio (20/10): borda fina com dois cantos cortados, no lugar da tracejada. Falta o outro dev ver.'},
  'bd-cantos':     {st:'finalizar', sem:true, fixo:'já no jogo', tx:'Aprovada pelo Caio (20/10): os quatro cantos marcados, como um visor. Falta o outro dev ver.'},
  'bd-aura':       {st:'finalizar', sem:true, fixo:'já no jogo', tx:'Aprovada pelo Caio (20/10): a borda respira na cor forte do seu tipo de Nen. Falta o outro dev ver; a aura que sobe e ondula fica para depois.'},
  'sm-moeda':      {st:'fechado', sem:true, fixo:'fica a de hoje', tx:'Revisto (20/10): fica como está. Dos sons, é o único que não vai ser refeito.'},
  'hv-contorno':   {st:'fechado', tx:'Aprovado (20/10). O contorno acende em 120 ms e apaga em 350 ms, sem piscar ao passar por vários cards.'},
  'hm-cartas':     {st:'fechado', tx:'Aprovada (17/10): carta de frente por nível, carta de figura no dia mais forte, verso no dia vazio e Coringa no dia salvo.'},
  'hp-cristal':    {st:'aberto', tx:'Refeito em código (21/10): cristais lapidados chapados, ponta quebrada e engastes vazios na vida perdida; o reflexo passa com o mouse. O Caio achou melhor que o de antes, mas não sabe se gostou: em aberto, esperando o outro dev.'},
  'hm-pegadas':    {st:'aberto', tx:'Refeita em código (21/10): um rastro de pés descalços, esquerdo e direito alternando pela semana; dia fraco só a sola, dia forte com terra. Provando, "pisar hoje" mostra o passo. O Caio achou melhor que a de antes, mas não sabe se gostou: em aberto, esperando o outro dev.'},
  'hm-gungi':      {st:'finalizar', tx:'Nova (21/10), só em código: o tabuleiro de madeira do Gungi, como no anime. Cada dia jogado é uma peça redonda e branca (兵), empilhada até três conforme a força do dia, com a cor do hábito na lateral; o dia salvo é a peça preta do rei (帥). Provando, "jogar hoje" mostra a peça caindo. Aprovada pelo Caio, falta o outro dev ver.'},
  'hm-chamas':     {st:'fechado', tx:'Aprovada (20/10): chama maior por nível, cinza no dia vazio, nen no dia salvo, fogo laranja. Provando, "acender hoje" mostra o acender.'},
  'lic-exame':     {st:'fechado', tx:'Carimbo 念 com anel duplo (16/10).'},
  'lic-chefao':    {st:'fechado', tx:'Selo da torre de tijolos com coroa e folhas (16/10).'},
  'lg-exame':      {st:'fechado', tx:'Selo quadrado tipo hanko, vermelho, com um nó entalhado (16/10).'},
  'lic-emb-aranha':{st:'fechado', tx:'Aranha de 12 patas, solta no painel preto, sem a caixa branca (16/10).'},
  'lg-rei':        {st:'aberto', sem:true, tx:'A coroa feita no Gemini não agradou. Falta um desenho novo, e a nova ainda é a coroa de hoje.'},
  'lic-ouro':      {st:'finalizar', tx:'Três dourados chapados para escolher: filete, chanfro e losangos. O provador da nova mostra os três.'},
  'lic-estojo':    {st:'finalizar', tx:'Couro preto com costura, em volta do cartão novo. Aprovado, mas ainda provisório.'},
  'lic-corrente':  {st:'finalizar', tx:'A corrente do Kurapika dando a volta no estojo. Aprovada, mas ainda provisória.'},
  'tr-deslizar':   {st:'finalizar', tx:'Lapidada (20/10): desliza no sentido da barra de abas, e a velha sai enquanto a nova entra. Aprovada pelo Caio; falta o outro dev ver.'},
  'tr-glitch':     {st:'finalizar', tx:'Lapidada (20/10): a velha separa as cores, rasga em faixas com a nova pelos rasgos, e a nova se firma com um tranco. Aprovada pelo Caio; falta o outro dev ver.'},
  'fx-soco':       {st:'finalizar', tx:'Novo (20/10), só em código: no andar novo, um portal de nen abre ao lado do card, o punho do Leorio sai dele, acerta a borda e volta, em meio segundo. Aprovado pelo Caio; falta o outro dev ver.'},
  'fx-dragao':     {st:'finalizar', tx:'Novo (21/10), só em código: no andar novo, o dragão de aura do Zeno sai do card, dá a volta no alto com 龍星群 e se desfaz em dragõezinhos que mergulham na tela. Aprovado pelo Caio; falta o outro dev ver.'},
  'fx-costura':    {st:'fechado', tx:'Aprovada (20/10). Nova, só em código: o card racha de verdade, a agulha da Machi costura em zigue-zague e o fio é puxado; o card fecha com um estalo e 念糸縫合 entra letra por letra.'},
  'tr-fumaca':     {st:'finalizar', tx:'Nova (20/10): a fumaça roxa sai de onde você clicou, cobre a tela e se desfaz já na aba nova. Só existe em código. Aprovada pelo Caio; falta o outro dev ver.'},
  'tr-aspira':     {st:'finalizar', tx:'Nova (20/10): os cards da aba velha são sugados para o canto mais perto do clique, com um redemoinho. Só existe em código. Aprovada pelo Caio; falta o outro dev ver.'},
  'emb-naipe':     {st:'fechado', tx:'Aprovados (20/10): os quatro naipes com os traços do cursor da carta e o Coringa com a estrela e a lágrima.'},
};
/* ideias da fila ainda sem arte: [id, prateleira (cat; ev = na hora da conquista), faixa decidida ('' = a decidir), de quem,
   nome, descrição, status, o que falta]. A Marca de prazo (prazo) é uma categoria inteira em teste: sai se não agradar */
const PRAZO = ' Faz parte da Marca de prazo, categoria em teste: se os estilos não agradarem, ela sai inteira.';
const IDEIAS = [
  ['cr-vara', 'cursor', 'epico', 'Gon', 'Vara de pescar do Gon', 'O cursor vira a vara de pescar: o clique lança a linha e fisga o card.', 'dev', 'Ideia aprovada, ainda sem arte. Vai em código, com física como a carta e o ioiô: linha com anzol e boia, segurar recolhe.'],
  ['fx-borboletas', 'fx', 'epico', 'Pouf', 'Borboletas do Pouf', 'Borboletas de aura voam devagar pelo fundo, juntam-se perto do mouse e se espalham no clique.', 'aberto', 'Prévia em código na bancada (20/10), em aberto: o Caio ainda não decidiu se gostou, nem a camada (por cima ou atrás dos cards) e se os pacotes que têm a Poeira de Nen ficam com ela.'],
  ['bd-costura', 'borda', 'raro', 'Machi', 'Costura de nen', 'A borda dos cards vira uma costura de fio de nen, em zigue-zague.', 'dev', 'Ideia aprovada, ainda sem arte. Parada, em CSS ou SVG.'],
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
/* efeitos (data-fx, uma lista) com versão nova: provando com a nova, o efeito vira "X-nova" no <html> e na prévia (a nova
   é só CSS, ou um módulo em código que liga por esse nome, como o Gyo) */
const FX_NOVA = ['fx-corrente', 'fx-shim', 'fx-gyo', 'fx-rastro'];
/* a corrente do Kurapika (web/arte/corrente.js): as imagens saem do gerador, a borda com a Dowsing Chain, a barra de XP
   com a Judgment Chain e a vida do chefão escarlate */
const CH = window.GB_CORRENTE, CHP = CH && CH.pendulo(2), CHL = CH && CH.lamina(), CHU = s => CH ? CH.uri(s) : 'none';
/* a barra elétrica do Killua (web/arte/eletrica.js): os quadros do raio e da faísca, trocados aos saltos */
const EL = window.GB_ELETRICA, ELF = EL && EL.faisca();
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
.ar-st.fechado{color:var(--ok7)} .ar-st.finalizar{color:var(--ouro7)} .ar-st.aberto{color:var(--nao7)} .ar-st.dev{color:var(--soft);border-style:dashed}
/* a borda do card da vitrine pelo status (só na beta): uma cor só em volta do card inteiro, também no alto (a cor da faixa
   no alto fazia um card vermelho de topo azul), e cores fixas, iguais em toda paleta (o --grn da Killua é quase o --volt) */
:root{--ok7:#2EA043;--ouro7:#E3B341;--nao7:#E5534B}
.it7.ab-ok,.it7.ab-ouro,.it7.ab-nao{border-width:2px}
.it7.ab-ok{border-color:var(--ok7)} .it7.ab-ouro{border-color:var(--ouro7)} .it7.ab-nao{border-color:var(--nao7)}
.ar-leg{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;margin:6px 0}
.ar-leg span{padding-left:8px;border-left:4px solid} .ar-leg .ab-ok{border-color:var(--ok7)} .ar-leg .ab-ouro{border-color:var(--ouro7)} .ar-leg .ab-nao{border-color:var(--nao7)}
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
${CH ? `
:root[data-borda="corrente-nova"] .card{position:relative}
:root[data-borda="corrente-nova"] .card,.bd-corrente-nova .mc{border:9px solid transparent;border-image:${CHU(CH.borda())} 64 / 9px round;background-clip:padding-box;border-radius:8px}
:root[data-borda="corrente-nova"] .card::after,.bd-corrente-nova .mc::after{--u:calc(9px / 64);content:"";position:absolute;pointer-events:none;z-index:3;
  background:${CHU(CHP.svg)} 0 0/100% 100% no-repeat;width:calc(${CHP.W} * var(--u));height:calc(${CHP.H} * var(--u));
  right:calc(-4.5px - ${CHP.W} * var(--u) / 2);top:calc(100% + 4.5px - ${CHP.ay} * var(--u));transform-origin:50% calc(${CHP.ay} * var(--u))}
:root[data-hp="corrente-nova"] :is(.hp4,.l-boss .hp),.hp-corrente-nova .hp7 > i{background:linear-gradient(color-mix(in srgb,var(--track) 72%,transparent),color-mix(in srgb,var(--track) 72%,transparent)),${CHU(CH.faixa())} 0 50%/auto 100% repeat-x,var(--track)}
:root[data-hp="corrente-nova"] :is(.hp4 > b,.l-boss .hp i),.hp-corrente-nova .hp7 > i > b{background:${CHU(CH.faixa(CH.ESCARLATE))} right 0 center/auto 100% repeat-x}
:root[data-fx~="corrente-nova"] :is(.xpbar,.l-bar):not(.fxd *),.fxd.corrente-nova .xpbar{overflow:visible}
:root[data-fx~="corrente-nova"] .l-bar i:not(.fxd *){position:relative}
:root[data-fx~="corrente-nova"] :is(.xpbar > b,.l-bar i):not(.fxd *),.fxd.corrente-nova .xpbar > b{--ida:5px;box-shadow:none;
  background:${CHU(CH.faixa())} right 0 center/auto 100% repeat-x,color-mix(in srgb,var(--soft) 26%,var(--track))}
:root[data-fx~="corrente-nova"] :is(.xpbar > b,.l-bar i):not(.fxd *)::after,.fxd.corrente-nova .xpbar > b::after{content:"";position:absolute;left:100%;top:50%;height:190%;
  aspect-ratio:${CHL.W}/${CH.B};translate:${(-CHL.ix / CHL.W * 100).toFixed(2)}% -50%;background:${CHU(CHL.svg)} 0 0/100% 100% no-repeat}
@media (prefers-reduced-motion:no-preference){
  :root[data-borda="corrente-nova"] .card::after,.bd-corrente-nova .mc::after{animation:chDows 1.6s ease-in-out infinite alternate}
  :root[data-borda="corrente-nova"] .card:hover::after,.bd-corrente-nova:hover .mc::after{animation:chDowsBusca .55s ease-in-out infinite alternate}
  :root[data-fx~="corrente-nova"] :is(.xpbar > b,.l-bar i):not(.fxd *),.fxd.corrente-nova .xpbar > b{animation:chPuxa 1.5s ease-in-out infinite alternate}
  :root[data-fx~="corrente-nova"] :is(.xpbar > b,.l-bar i):not(.fxd *)::after,.fxd.corrente-nova .xpbar > b::after{animation:chPuxaL 1.5s ease-in-out infinite alternate}
}
@keyframes chDows{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}
@keyframes chDowsBusca{from{transform:rotate(-26deg)}to{transform:rotate(26deg)}}
/* ida e volta: a corrente e a lâmina andam juntas (o encaixe não muda) e nunca passam do XP de verdade */
@keyframes chPuxa{from{background-position:right 0 center,0 0}to{background-position:right var(--ida) center,0 0}}
@keyframes chPuxaL{from{transform:none}to{transform:translateX(calc(var(--ida) * -1))}}` : ''}
${EL ? `
:root[data-fx~="shim-nova"] :is(.xpbar,.l-bar):not(.fxd *),.fxd.shim-nova .xpbar{overflow:visible}
:root[data-fx~="shim-nova"] .l-bar i:not(.fxd *){position:relative}
:root[data-fx~="shim-nova"] :is(.xpbar > b,.l-bar i):not(.fxd *),.fxd.shim-nova .xpbar > b{
  background:${EL.uri(EL.raios())} 0 0/auto 300% repeat-x,linear-gradient(90deg,${EL.AZUL.fundo},${EL.AZUL.fundo2});box-shadow:0 0 10px -2px ${EL.AZUL.brilho}}
:root[data-fx~="shim-nova"] :is(.xpbar > b,.l-bar i):not(.fxd *)::after,.fxd.shim-nova .xpbar > b::after{content:"";position:absolute;left:100%;top:50%;height:320%;pointer-events:none;
  aspect-ratio:${ELF.W}/${ELF.H};translate:${(-ELF.fx / ELF.W * 100).toFixed(2)}% -50%;background:${EL.uri(ELF.svg)} 0 0/100% 300% no-repeat}
@media (prefers-reduced-motion:no-preference){
  :root[data-fx~="shim-nova"] :is(.xpbar > b,.l-bar i):not(.fxd *),.fxd.shim-nova .xpbar > b{animation:elEstala .36s steps(1,end) infinite,elDescarga 3.4s linear infinite}
  :root[data-fx~="shim-nova"] :is(.xpbar > b,.l-bar i):not(.fxd *)::after,.fxd.shim-nova .xpbar > b::after{animation:elFaisca .29s steps(1,end) infinite}
}
/* a tira anda um pouco para a ponta a cada quadro; de tempos em tempos a barra acende inteira (a descarga) */
@keyframes elEstala{0%{background-position:0 0,0 0}33.333%{background-position:31px 50%,0 0}66.667%{background-position:67px 100%,0 0}}
@keyframes elFaisca{0%{background-position:0 0}33.333%{background-position:0 50%}66.667%{background-position:0 100%}}
@keyframes elDescarga{0%,86%,100%{filter:none}89%{filter:brightness(1.7) drop-shadow(0 0 5px ${EL.AZUL.meio})}92%{filter:brightness(1.05)}94%{filter:brightness(1.45)}97%{filter:none}}` : ''}
/* prévia do Gyo novo no card: a lente acesa no meio, com a borda acendendo perto dela */
.fxd.gyo-nova .mini{background-image:radial-gradient(70px circle at 45% 55%,color-mix(in srgb,var(--aura) 26%,transparent),transparent 70%);border-color:color-mix(in srgb,var(--aura) 55%,var(--hair))}
/* rastro em código (web/arte/rastro.js): na prévia do card, os pontinhos do rastro de hoje */
.fxd:is(.rastro-nova,.rastro-fio,.rastro-eco){background-image:radial-gradient(2px 2px at 20% 70%,var(--aura),transparent),radial-gradient(2px 2px at 60% 40%,var(--volt),transparent),radial-gradient(1.5px 1.5px at 85% 80%,var(--aura),transparent),radial-gradient(1.5px 1.5px at 40% 20%,var(--volt),transparent);animation:hjSobe 3s linear infinite}
:root[data-cursor$="-nova"] body,:root[data-cursor$="-nova"] body *{cursor:none!important}
.pvc .cur7 canvas{width:72px;height:72px}
/* prévia das transições que só existem em código: a fumaça cobre e abre; a aba encolhe girando para o canto */
@media (prefers-reduced-motion:no-preference){
  .tr-fumaca .tr7::after{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 30% 0,#5A4E86 0 35%,#3A3355 55%,transparent 72%);animation:arFumPv 2.8s ease-in-out infinite}
  .tr-aspira .tr7 .mc{transform-origin:100% 0;animation:arAspPv 2.8s ease-in infinite}
}
@keyframes arFumPv{0%,15%{transform:scale(0);opacity:1}40%,55%{transform:scale(1.4);opacity:1}85%,100%{transform:translate(-25%,-35%) scale(1.8);opacity:0}}
@keyframes arAspPv{0%,20%{transform:none;opacity:1}55%{transform:translate(40%,-40%) rotate(-40deg) scale(.05);opacity:.4}60%,75%{transform:scale(0);opacity:0}100%{transform:none;opacity:1}}
.pvc .hmn{position:absolute;inset:12px 18px;display:grid;place-items:center} .pvc .hmn .l-hg{--n:9;grid-template-rows:repeat(4,auto);grid-template-columns:repeat(9,15px)}`;
const st = document.createElement('style'); st.id = 'gb-arte'; st.textContent = CSS; document.head.appendChild(st);
/* heatmaps e a vida de cristal em CSS: o mesmo CSS dos módulos, com o seletor do jogo e o da prévia */
if(window.CURSORES){
  const C = CURSORES, h = document.createElement('style'); h.id = 'gb-arte-heat';
  const es = C.cartas.naipe('espadas');
  h.textContent = C.cartas.css(':root[data-heat="cartas-nova"]') + C.cartas.css('.hm-cartas-nova')
    + `\n:root[data-heat="cartas-nova"],.hm-cartas-nova{--naipe:${es}}\n` + C.chamas.css(':root[data-heat="chamas-nova"]') + C.chamas.css('.hm-chamas-nova')
    + C.pegadas.css(':root[data-heat="pegadas-nova"]') + C.pegadas.css('.hm-pegadas-nova')
    + C.gungi.css(':root:is([data-heat="gungi"],[data-heat="gungi-nova"])') + C.gungi.css('.hm-gungi-nova')
    + C.cristal.css(':root[data-hp="cristal-nova"]') + C.cristal.css('.hp-cristal-nova');
  document.head.appendChild(h);
}

/* a fonte japonesa dos gritos (グー！パー！チー！, ボッ, カタカタ, 神速 カンムル, 念糸縫合, 龍星群 ドラゴンダイヴ): Dela Gothic One, só com essas letras */
let fonteOk = null;
function fonte(){
  if(fonteOk) return fonteOk;
  const txt = 'グーパーチー！ボッカタ神速ンムル念糸縫合龍星群ドラゴンダイヴPEDRAPAPELTESOURA';
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
/* ---------- Gyo em código: cola nos cards quando o data-fx do <html> pede o "gyo-nova" (o Gyo de hoje é o "gyo", em CSS) ---------- */
let gyo = null;
function gyoNovo(){
  const on = (document.documentElement.getAttribute('data-fx') || '').split(' ').includes('gyo-nova');
  if(!on === !gyo) return;
  if(gyo){ gyo.desliga(); gyo = null; }
  else if(window.CURSORES && CURSORES.gyo) gyo = CURSORES.gyo.cola(document.documentElement, {seletor: '.card'});
}
/* ---------- rastro em código: um modelo por item (a Aura é a nova do fx-rastro; o Fio e o Eco só existem em código).
   Liga com o primeiro que o data-fx do <html> pedir; o tema muda as cores, então troca de tema refaz o rastro ---------- */
const RASTRO = {'rastro-nova': 1, 'rastro-fio': 2, 'rastro-eco': 3};
let ras = null, rasK = '';
function rastro(){
  const fx = (document.documentElement.getAttribute('data-fx') || '').split(' '), m = fx.map(f => RASTRO[f]).find(Boolean) || 0;
  const k = m ? m + '|' + getComputedStyle(document.body).backgroundColor + '|' + getComputedStyle(document.documentElement).getPropertyValue('--aura') : '';
  if(k === rasK) return;
  if(ras){ ras.desliga(); ras = null; }
  rasK = k;
  if(m && window.CURSORES && CURSORES.rastro) ras = CURSORES.rastro.liga(document.body, {modelo: m});
}
/* ---------- transições em código: a troca de aba passa pelo módulo quando o <html> pede um "-nova" (deslizar, glitch) ou
   uma transição que só existe em código (fumaca, aspira). fn é a troca de verdade (esconde a velha, mostra a nova) ---------- */
const SO_CODIGO = ['fumaca', 'aspira'], trs = {};
const claro = () => { const c = (getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [0, 0, 0]).map(Number); return c[0] * .3 + c[1] * .59 + c[2] * .11 > 140; };
function aba(fn){
  const v = document.documentElement.getAttribute('data-trans') || '', k = v.endsWith('-nova') ? v.slice(0, -5) : SO_CODIGO.includes(v) ? v : '';
  const M = k && window.TRANSICOES && window.TR_BASE && TRANSICOES[k];
  if(!M) return fn();
  const h = trs[k] || (trs[k] = M.cola(document.documentElement, {}));
  h.ajusta({claro: claro()});
  h.troca(fn);
}
if(window.GB_FX){
  const aplica = GB_FX.aplica, ver = GB_FX.ver;
  GB_FX.aplica = function(){ aplica.apply(this, arguments); cursor(); hover(); gyoNovo(); rastro(); };
  /* ▶ na loja: com a nova escolhida, o efeito novo cai no card do item */
  let mao = 0;
  GB_FX.ver = function(id, r){
    const k = {'fx-godspeed':'godspeed', 'fx-jajanken':'jajanken', 'fx-costura':'costura', 'fx-soco':'soco', 'fx-dragao':'dragao'}[id];
    if(!k || !nova(id) || !window.CURSORES) return ver.apply(this, arguments);
    const b = document.querySelector(`[data-fxver="${id}"]`), card = b && b.closest('.it7'), rr = card ? card.getBoundingClientRect() : r;
    if(k === 'soco') return CURSORES.soco.dispara(rr, {el: card});
    if(k !== 'jajanken') return fonte().then(() => CURSORES[k].dispara(rr, {el: card}));
    const m = ['pedra', 'papel', 'tesoura'][mao++ % 3];
    fonte().then(() => CURSORES.jajanken.dispara(rr, {el: card, mao: m}));
  };
}

/* ---------- o que o index.html e o grupo.js chamam ---------- */
const troca = id => `<span class="ar-tg" role="group" aria-label="versão">${['antiga', 'nova'].map(v => `<button type="button" data-arte="${id}:${v}" aria-pressed="${(nova(id) ? 'nova' : 'antiga') === v}">${v}</button>`).join('')}</span>`;
window.GB_ARTE = {
  ARTE, CARTAO, ST, tem, nova, naipe, fonte, troca, aba,
  so: false,   // o filtro "arte nova" da Masadora
  /* os cards em desenvolvimento da vitrine (não se compram nem se provam) e a prévia deles */
  ideias: ITENS_DEV,
  pvDev(it){
    if(it.id === 'at-countdown' && window.CURSORES && CURSORES.countdown) return `<div class="pv at7">${[5, 1, 0, -2].map(k => CURSORES.countdown.marca(k, 40)).join('')}</div>`;
    return `<div class="pv dev7"><b>em desenvolvimento</b><span>${esc(it.quem)}</span></div>`;
  },
  /* provando com a nova: o valor do atributo ganha "-nova" (vista() no index.html) */
  vista(v, it){
    if(nova(it.id) && it.eq && v[it.cat] === it.eq[it.cat] && ['borda','cursor','hp','heat','hover','trans'].includes(it.cat)) v[it.cat] += '-nova';
    if(FX_NOVA.includes(it.id) && nova(it.id)) v.fx = v.fx.map(f => f === it.fx ? f + '-nova' : f);
  },
  /* a classe de efeito da prévia do card (a nova, se for a escolhida) */
  fx: it => FX_NOVA.includes(it.id) && nova(it.id) ? it.fx + '-nova' : it.fx,
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
    return `<div class="ar7"><span class="ar-l"><span class="ar-st ${a.st}" title="arte nova (#134)">arte: ${ST[a.st]}</span>${a.ideia ? '' : a.fixo ? `<span class="sub">${a.fixo}</span>` : a.sem ? '<span class="sub">ainda sem versão nova</span>' : semTroca ? '<span class="sub">antiga | nova no provador</span>' : troca(id)}</span><span>${esc(a.tx)}</span></div>`; },
  /* a borda do card da vitrine pelo status, só na beta: ok (fechado), ouro (amarela: falta outro dev), nao (em aberto, em
     desenvolvimento ou ainda não revisto) */
  borda(id){
    if(typeof podeTeste !== 'function' || !podeTeste()) return '';
    const a = ARTE[id];
    return ' ab-' + (a && a.st === 'fechado' ? 'ok' : a && a.st === 'finalizar' ? 'ouro' : 'nao');
  },
  /* o resumo no alto da Masadora */
  resumo(ids){
    const l = ids.filter(tem), n = s => l.filter(id => ARTE[id].st === s).length, nao = ids.length - n('fechado') - n('finalizar');
    return `<div class="sec7"><h3>Arte nova em teste</h3><p>Os itens com o aviso "arte" ganharam um desenho novo na fila de arte (#134) ou já tiveram o veredito do Caio. Use a troca <b>antiga | nova</b> e o provar (ou o ▶) para comparar. A versão nova ainda não se compra: quem compra ou já tem fica com a de hoje. Os cards "em desenvolvimento" são ideias aprovadas que ainda não têm arte: mostram o que vem e a faixa.</p>
      ${this.borda('') ? `<p class="ar-leg"><span class="ab-ok">verde: fechado (${n('fechado')})</span><span class="ab-ouro">amarela: o Caio aprovou, falta o outro dev ver (${n('finalizar')})</span><span class="ab-nao">vermelha: em aberto ou ainda não revisto (${nao})</span></p>` : ''}
      <div class="ar-res"><span class="ar-st fechado">fechado ${n('fechado')}</span><span class="ar-st finalizar">falta outro dev ${n('finalizar')}</span><span class="ar-st aberto">em aberto ${n('aberto')}</span><span class="ar-st dev">em desenvolvimento ${n('dev')}</span>
      <button type="button" class="btn${this.so ? ' v' : ''}" data-arteso>${this.so ? 'mostrar todos os itens' : 'só os itens da fila de arte'}</button></div></div>`;
  },
  /* na faixa do provar: a troca e, nas chamas, nas pegadas e no Gungi, o momento de hoje */
  faixa(id){ if(!tem(id) || ARTE[id].sem) return '';
    const hoje = nova(id) && {'hm-chamas': ['chamas', 'acender hoje'], 'hm-pegadas': ['pegadas', 'pisar hoje'], 'hm-gungi': ['gungi', 'jogar hoje']}[id];
    return `<span style="display:flex;gap:8px;align-items:center">versão ${troca(id)}${hoje ? `<button type="button" class="btn" data-artehoje="${hoje[0]}" style="background:#0b0d12;color:#fff;border-color:#0b0d12">${hoje[1]}</button>` : ''}</span>`; },
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
  else { const hj = document.querySelector('.l-hg i.hj'); if(hj) ({pegadas: () => CURSORES.pegadas.pisa(hj), gungi: () => CURSORES.gungi.joga(hj)}[t.dataset.artehoje] || (() => CURSORES.chamas.acende(hj)))(); else toast('O dia de hoje fica na Lista, no heatmap da constância: abra a aba e tente de novo.'); return; }
  render();
});
})();
