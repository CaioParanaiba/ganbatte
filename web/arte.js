/* Ganbatte · a arte nova das lojas (#134), fechada em 21/10 (#77): o que a fila de arte (docs/lojas/arte/) fez é a versão
 * oficial de cada item, no jogo de quem tem, no provar, no ▶ e nas prévias. Correção de arte daqui em diante vai por issue.
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
/* id do item na loja → st: o status da arte (tudo fechado em 21/10, #77); tx: o que é; sem: true quando não há versão nova
   (fica a de hoje); fixo: a versão do jogo já é a final, sem troca */
const ARTE = {
  'hp-corrente':   {st:'fechado', tx:'Aprovada (20/10): a vida do chefão vira a corrente escarlate, presa pela ponta; o trecho perdido fica com a corrente apagada.'},
  'bd-corrente':   {st:'fechado', tx:'Aprovada (20/10): a corrente da licença, fina, com uma argola em cada canto e a esfera da Dowsing Chain balançando no canto de baixo (acelera com o mouse).'},
  'fx-shim':       {st:'fechado', tx:'Aprovada (20/10): a eletricidade do Killua. Um raio estala dentro da barra de XP, a ponta solta faíscas com um arco para o vazio e, de tempos em tempos, a barra dá uma descarga.'},
  'fx-corrente':   {st:'fechado', tx:'Aprovada (20/10): a corrente vai e volta presa à lâmina da Judgment Chain, na ponta da barra de XP.'},
  'cr-carta':      {st:'fechado', tx:'Aprovada (17/10). Feita em código: clique atira a carta, segurar prende na Bungee Gum, parado ele vira a carta.'},
  'cr-agulha':     {st:'fechado', tx:'Aprovada (20/10). Feita em código: clique atira e crava (trinca a borda); segurar chama de volta pelo fio de nen e abre o leque.'},
  'cr-vara':       {st:'fechado', tx:'Aprovada (21/10). Feita em código: o clique lança a linha e o anzol fisga o card; clique de novo dá o tranco e segurar recolhe, até o anzol arrancar. Parado, um peixe vem morder.'},
  'cr-ioio':       {st:'fechado', tx:'Aprovado (21/10). Feito em código, um ioiô só: clique desce, segurar dorme; segurando com a mão parada o fio carrega de eletricidade e ele volta como raio.'},
  'fx-godspeed':   {st:'fechado', tx:'Aprovado (20/10). O Kanmuru acende no card, o raio cai com quadro negativo, o 神速 entra com rastros e a marca do raio fica no card.'},
  'fx-rastro':     {st:'fechado', tx:'Refeito em código (21/10): vapor de aura que sobe ondulando; parado, o Ten ainda solta fiapos; o clique é o Ren. Aprovado pelo Caio, ainda provisório.'},
  'fx-rastro-fio': {st:'fechado', tx:'Novo (21/10), 2º modelo do rastro: uma fita de aura com física de corda que chicoteia, estala em faíscas e se recolhe; o clique manda um pulso. Aprovado pelo Caio, ainda provisório.'},
  'fx-rastro-eco': {st:'fechado', tx:'Novo (21/10), 3º modelo do rastro: ecos atrasados do cursor com a cor partida, que o alcançam num lampejo; o clique abre os quatro em roda. Aprovado pelo Caio, ainda provisório.'},
  'fx-jajanken':   {st:'fechado', tx:'Aprovado (20/10): as três mãos, com o grito em japonês. O ▶ da nova passa por pedra, papel e tesoura, nessa ordem.'},
  'hv-bungee':     {st:'fechado', tx:'Aprovado (20/10). A goma cobre o contorno do card; ao sair, a borda vira membrana, estica e rasga como elástico.'},
  'hv-en':         {st:'fechado', tx:'Aprovado (20/10). O card acende o Ten e o En da Pitou se abre do ponto tocado, só até os vizinhos; os cards alcançados acendem os cantos.'},
  'hv-shu':        {st:'fechado', tx:'Aprovado (20/10). A aura corre o contorno a partir do ponto tocado, duas faíscas correm a borda e ela escorre ao sair.'},
  'hv-vira':       {st:'fechado', sem:true, fixo:'já no jogo', tx:'Aprovado (20/10). Feito em código, o card vira e mostra o verso; já substituiu o giro antigo, que reiniciava com o mouse mexendo.'},
  'fx-gyo':        {st:'fechado', tx:'Refeito em código (20/10): cada card guarda um nen escondido (fios, poeira e selos) que só aparece na lente de aura, onde o mouse está; ao entrar, os olhos focam. Aprovado pelo Caio (21/10); falta o outro dev ver.'},
  'fx-baralho':    {st:'fechado', sem:true, fixo:'fica a de hoje', tx:'Revisto (20/10): o castelo de cartas e as cartas em órbita foram recusados; fica o leque de naipes de hoje.'},
  'bd-corte':      {st:'fechado', sem:true, fixo:'já no jogo', tx:'Aprovada pelo Caio (20/10): borda fina com dois cantos cortados, no lugar da tracejada. Falta o outro dev ver.'},
  'bd-cantos':     {st:'fechado', sem:true, fixo:'já no jogo', tx:'Aprovada pelo Caio (20/10): os quatro cantos marcados, como um visor. Falta o outro dev ver.'},
  'bd-aura':       {st:'fechado', sem:true, fixo:'já no jogo', tx:'Aprovada pelo Caio (20/10): a borda respira na cor forte do seu tipo de Nen. Falta o outro dev ver; a aura que sobe e ondula fica para depois.'},
  'fx-estrelas':   {st:'fechado', tx:'Aprovada (21/10). Feita em código: poeira de aura colorida no fundo, atrás das telas, em três profundidades; a correnteza muda devagar, uma rajada de aura atravessa a tela de tempos em tempos, o mouse abre caminho e o clique solta uma onda.'},
  'fx-drift':      {st:'fechado', tx:'Aprovada (21/10). Feita em código: a nuvem de aura do canto, agora viva (deforma e respira, sem fim de caminho), com uma 2ª nuvem na cor volt no canto oposto; deixe o mouse num lado e ela se inclina para lá.'},
  'sm-moeda':      {st:'fechado', sem:true, fixo:'fica a de hoje', tx:'Revisto (20/10): fica como está. Dos sons, é o único que não vai ser refeito.'},
  'hv-contorno':   {st:'fechado', tx:'Aprovado (20/10). O contorno acende em 120 ms e apaga em 350 ms, sem piscar ao passar por vários cards.'},
  'hm-cartas':     {st:'fechado', tx:'Aprovada (17/10): carta de frente por nível, carta de figura no dia mais forte, verso no dia vazio e Coringa no dia salvo.'},
  'hp-cristal':    {st:'fechado', tx:'Refeito em código (21/10): cristais lapidados chapados, ponta quebrada e engastes vazios na vida perdida; o reflexo passa com o mouse. O Caio achou melhor que o de antes, mas não sabe se gostou: em aberto, esperando o outro dev.'},
  'hm-pegadas':    {st:'fechado', tx:'Refeita em código (21/10): um rastro de pés descalços, esquerdo e direito alternando pela semana; dia fraco só a sola, dia forte com terra. Provando, "pisar hoje" mostra o passo. O Caio achou melhor que a de antes, mas não sabe se gostou: em aberto, esperando o outro dev.'},
  'hm-gungi':      {st:'fechado', tx:'Nova (21/10), só em código: o tabuleiro de madeira do Gungi, como no anime. Cada dia jogado é uma peça redonda e branca (兵), empilhada até três conforme a força do dia, com a cor do hábito na lateral; o dia salvo é a peça preta do rei (帥). Provando, "jogar hoje" mostra a peça caindo. Aprovada pelo Caio, falta o outro dev ver.'},
  'hm-chamas':     {st:'fechado', tx:'Aprovada (20/10): chama maior por nível, cinza no dia vazio, nen no dia salvo, fogo laranja. Provando, "acender hoje" mostra o acender.'},
  'lic-exame':     {st:'fechado', tx:'Carimbo 念 com anel duplo (16/10).'},
  'lic-chefao':    {st:'fechado', tx:'Selo da torre de tijolos com coroa e folhas (16/10).'},
  'lg-exame':      {st:'fechado', tx:'Selo quadrado tipo hanko, vermelho, com um nó entalhado (16/10).'},
  'lic-emb-aranha':{st:'fechado', tx:'Aranha de 12 patas, solta no painel preto, sem a caixa branca (16/10).'},
  'lg-rei':        {st:'fechado', sem:true, tx:'A coroa feita no Gemini não agradou. Falta um desenho novo, e a nova ainda é a coroa de hoje.'},
  'lic-ouro':      {st:'fechado', tx:'Três dourados chapados para escolher: filete, chanfro e losangos. O provador da nova mostra os três.'},
  'lic-estojo':    {st:'fechado', tx:'Couro preto com costura, em volta do cartão novo. Aprovado, mas ainda provisório.'},
  'lic-corrente':  {st:'fechado', tx:'A corrente do Kurapika dando a volta no estojo. Aprovada, mas ainda provisória.'},
  'tr-deslizar':   {st:'fechado', tx:'Lapidada (20/10): desliza no sentido da barra de abas, e a velha sai enquanto a nova entra. Aprovada pelo Caio; falta o outro dev ver.'},
  'tr-glitch':     {st:'fechado', tx:'Lapidada (20/10): a velha separa as cores, rasga em faixas com a nova pelos rasgos, e a nova se firma com um tranco. Aprovada pelo Caio; falta o outro dev ver.'},
  'fx-soco':       {st:'fechado', tx:'Novo (20/10), só em código: no andar novo, um portal de nen abre ao lado do card, o punho do Leorio sai dele, acerta a borda e volta, em meio segundo. Aprovado pelo Caio; falta o outro dev ver.'},
  'fx-dragao':     {st:'fechado', tx:'Novo (21/10), só em código: no andar novo, o dragão de aura do Zeno sai do card, dá a volta no alto com 龍星群 e se desfaz em dragõezinhos que mergulham na tela. Aprovado pelo Caio; falta o outro dev ver.'},
  'fx-costura':    {st:'fechado', tx:'Aprovada (20/10). Nova, só em código: o card racha de verdade, a agulha da Machi costura em zigue-zague e o fio é puxado; o card fecha com um estalo e 念糸縫合 entra letra por letra.'},
  'tr-fumaca':     {st:'fechado', tx:'Nova (20/10): a fumaça roxa sai de onde você clicou, cobre a tela e se desfaz já na aba nova. Só existe em código. Aprovada pelo Caio; falta o outro dev ver.'},
  'tr-aspira':     {st:'fechado', tx:'Nova (20/10): os cards da aba velha são sugados para o canto mais perto do clique, com um redemoinho. Só existe em código. Aprovada pelo Caio; falta o outro dev ver.'},
  'tx-manga':      {st:'fechado', tx:'Refeita em código (21/10): retícula de verdade, com os pontos crescendo até o canto de baixo, e linhas de foco saindo da moldura. Aprovada pelo Caio; falta o outro dev ver.'},
  'tx-grao':       {st:'fechado', tx:'Refeita em código (21/10): grão, fibras, manchas de umidade e a borda da tela queimada; fica melhor no Pergaminho. Aprovada pelo Caio; falta o outro dev ver.'},
  'tx-scan':       {st:'fechado', tx:'Refeita em código (21/10): a tela do Joystation, com cantos curvos, moldura, linhas, RGB e uma faixa de luz que rola. Aprovada pelo Caio; falta o outro dev ver.'},
  'tx-hex':        {st:'fechado', tx:'Refeita em código (21/10): o ninho das Quimeras, favos irregulares saindo do canto com ovos que pulsam. Aprovada pelo Caio; falta o outro dev ver.'},
  'tx-cartas':     {st:'fechado', tx:'Refeita em código (21/10): a tela vira o verso de uma carta, com a treliça de naipes, os cantos e o filete duplo. Aprovada pelo Caio; falta o outro dev ver.'},
  'tx-arena':      {st:'fechado', tx:'Refeita em código (21/10): o piso do ringue em perspectiva no pé da tela, com a borda dourada. Aprovada pelo Caio; falta o outro dev ver.'},
  'tx-nen':        {st:'fechado', tx:'Refeita em código (21/10), vira a Aura do dia (épico): a aura do seu tipo contorna a tela e engrossa para dentro conforme o XP de hoje chega na meta; as pontas se encontram no alto quando ela fecha, e cada XP novo dá um pulso. Provando, "passar o dia" mostra o dia inteiro. Aprovada pelo Caio; falta o outro dev ver.'},
  'fx-aura':       {st:'fechado', sem:true, fixo:'na loja do grupo', tx:'Revisto (21/10): foi para a Loja da Associação, onde é a Aura do avatar; quem tem continua com ela.'},
  'fx-digita':     {st:'fechado', tx:'Aprovado (21/10). Feito em código: ao trocar de aba, os títulos são digitados letra por letra, mais devagar, com o cursor em bloco e o ritmo de quem digita (pausa no espaço, um tropeço de vez em quando).'},
  'fx-ascensao':   {st:'fechado', tx:'Aprovada (21/10). Feita em código: cortinas de aurora boreal descendo até 80% da tela, com a barra de baixo acesa e os raios sumindo para cima; de tempos em tempos uma onda de luz corre uma cortina. Substitui o borrão que girava, que lia como a Aura ambiente.'},
  'fx-confete':    {st:'fechado', tx:'Aprovado (21/10), agora comum. Feito em código: dois canhões estouram dos cantos de baixo e o papel desce flutuando, girando, virando de face e balançando. O ▶ da nova mostra.'},
  'fx-fogos':      {st:'fechado', tx:'Aprovados (21/10). Feitos em código: foguetes sobem com rastro e estouram com clarão em cinco tipos (peônia, anel, salgueiro, crisântemo, palmeira), com um trio no final. O ▶ da nova mostra.'},
  'fx-shake':      {st:'fechado', tx:'Aprovada (21/10), agora rara. Feita em código: o chefão em fúria solta o Ren, fogo em duas camadas preso ao retrato, línguas que se soltam e brasas; a cada ~2,8 s um acesso com a onda de choque, a veia 💢 e um tranco. Provando, "enfurecer" põe todos os chefões em fúria para ver na aba Chefões.'},
  'fx-zap':        {st:'fechado', sem:true, fixo:'fica a de hoje', tx:'Revisto (21/10): fica como está. A ideia de virar o aviso de perigo (fúria, prazo, Ten apagando) foi arquivada junto com as marcas de prazo: volta quando o jogo passar de 8 jogadores ativos.'},
  'bd-dupla':      {st:'fechado', sem:true, fixo:'fica a de hoje', tx:'Revista (21/10): fica como está.'},
  'tx-ceu':        {st:'fechado', sem:true, tx:'Fica para depois (21/10): vai ser refeito junto com os temas, no futuro.'},
  'bd-costura':    {st:'fechado', tx:'Nova (21/10), só em código: o fio de nen da Machi dá a volta no card em zigue-zague, faz a curva nos cantos e dá um nó em cada um. Parada; o card não muda de tamanho. Aprovada pelo Caio; falta o outro dev ver.'},
  'tt-medico':     {st:'fechado', sem:true, fixo:'já no jogo', tx:'Novo (21/10): o título Futuro Médico, do Leorio, para quem estuda. É só o texto embaixo do seu andar, como os outros títulos. Falta o Caio aprovar.'},
  'emb-naipe':     {st:'fechado', tx:'Aprovados (20/10): os quatro naipes com os traços do cursor da carta e o Coringa com a estrela e a lágrima.'},
};
/* revisão de 21/10: paletas, fontes, títulos e sons ficam como estão (fontes e sons novos só quando o jogo passar de 8 jogadores
   ativos); o mundo pixel foi arquivado (arq no motor.js) */
const FICA = {pal:'Revista (21/10): fica como está.', title:'Revisto (21/10): fica como está.',
  font:'Revista (21/10): fica como está. Fontes novas chegam quando o jogo passar de 8 jogadores ativos.',
  som:'Revisto (21/10): fica como está. Sons novos chegam quando o jogo passar de 8 jogadores ativos.',
  px:'Arquivado (21/10): o mundo pixel saiu da loja. Quem tem continua com ele; ninguém mais compra.',
  full:'Revisto (21/10): inteiro, todas as peças existem e estão à venda; a arte de cada peça é revista no próprio item.'};
/* as molduras do avatar ficam como estão */
for(const it of GB.COS) if(it.cat === 'frame' && !ARTE[it.id]) ARTE[it.id] = {st:'fechado', sem:true, tx:'Fica como está (21/10).'};
for(const it of GB.COS) if(FICA[it.cat] && !ARTE[it.id]) ARTE[it.id] = {st:'fechado', sem:true, fixo: it.arq ? 'arquivado' : it.cat === 'full' ? 'peças revistas' : 'fica a de hoje', tx: FICA[it.cat]};
/* ideias da fila ainda sem arte: [id, prateleira (cat; ev = na hora da conquista), faixa decidida ('' = a decidir), de quem,
   nome, descrição, status, o que falta]. A Marca de prazo (at-*, fx-hakoware) foi arquivada em 21/10 com o aviso de perigo do
   Raio: volta quando o jogo passar de 8 jogadores ativos (FILA.md, status pulado) */
const IDEIAS = [
];
const ITENS_DEV = IDEIAS.map(([id, c, fa, quem, n, d, st, tx]) => {
  ARTE[id] = {st, tx, sem: true, ideia: true};
  return {id, cat: c === 'ev' ? 'fx' : c, ...(c === 'ev' ? {ev: 1} : {}), fa, hxh: 1, quem, n, d, dev: 1, prova: 1, p: 0};   // prova: não é "vem com o jogo" nem se compra
});

/* a licença inteira (o cartão novo), que não é item da loja: aparece no provador da Associação */
const CARTAO = {st:'finalizar', tx:'O cartão novo, fiel ao do anime, com lugar para as estrelas, o carimbo e o emblema, foi aprovado como provisório. Falta decidir como a versão em pé entra no placar.'};
/* efeitos (data-fx, uma lista) com versão nova: provando com a nova, o efeito vira "X-nova" no <html> e na prévia (a nova
   é só CSS, ou um módulo em código que liga por esse nome, como o Gyo) */
const FX_NOVA = ['fx-corrente', 'fx-shim', 'fx-gyo', 'fx-rastro', 'fx-estrelas', 'fx-drift', 'fx-digita', 'fx-ascensao', 'fx-shake'];
/* a corrente do Kurapika (web/arte/corrente.js): as imagens saem do gerador, a borda com a Dowsing Chain, a barra de XP
   com a Judgment Chain e a vida do chefão escarlate */
const CH = window.GB_CORRENTE, CHP = CH && CH.pendulo(2), CHL = CH && CH.lamina(), CHU = s => CH ? CH.uri(s) : 'none';
/* a barra elétrica do Killua (web/arte/eletrica.js): os quadros do raio e da faísca, trocados aos saltos */
const EL = window.GB_ELETRICA, ELF = EL && EL.faisca();
const tem = id => !!ARTE[id];
const nova = id => tem(id) && !ARTE[id].sem;   // tem versão nova (sem = ficou a de hoje)

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
/* a cor do status (o cartão novo da Associação, no grupo.js) */
:root{--ok7:#2EA043;--ouro7:#E3B341;--nao7:#E5534B}
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
/* fundo em código (web/arte/poeira.js e aura-ambiente.js): o canvas fica atrás das telas; na prévia do card, grãos de várias cores e as duas nuvens */
:root:is([data-fx~="estrelas-nova"],[data-fx~="drift-nova"],[data-fx~="ascensao-nova"]) .wrap{position:relative;z-index:1}
/* Terminal vivo, Ascensão e Fúria novos (web/arte/digita.js, aurora.js, furia.js): na prévia do card, o cursor em bloco, as cortinas e o fogo */
.fxd.digita-nova .mini b::after{content:"";display:inline-block;width:.55em;height:1em;margin-left:2px;vertical-align:-.15em;background:var(--prompt);animation:hjCursor .9s steps(1) infinite}
.fxd.ascensao-nova{background-image:repeating-linear-gradient(90deg,transparent 0 3px,color-mix(in srgb,var(--grn) 14%,transparent) 3px 5px),linear-gradient(transparent 20%,color-mix(in srgb,var(--grn) 30%,transparent) 55%,color-mix(in srgb,var(--aura) 22%,transparent) 62%,transparent 70%)}
.fxd.shake-nova .ring{box-shadow:0 0 0 2px color-mix(in srgb,var(--red) 40%,transparent),0 -6px 12px -2px var(--red)}
.fxd.estrelas-nova{background-image:radial-gradient(2.5px 2.5px at 18% 72%,var(--aura),transparent),radial-gradient(2px 2px at 62% 38%,var(--volt),transparent),radial-gradient(2px 2px at 84% 78%,var(--amb),transparent),radial-gradient(1.5px 1.5px at 40% 22%,var(--grn),transparent),radial-gradient(5px 5px at 30% 45%,color-mix(in srgb,var(--acc) 45%,transparent),transparent),radial-gradient(1.5px 1.5px at 72% 12%,var(--red),transparent);animation:hjSobe 5s linear infinite}
.fxd.drift-nova{background-image:radial-gradient(circle at 78% 22%,color-mix(in srgb,var(--aura) 32%,transparent),transparent 45%),radial-gradient(circle at 18% 85%,color-mix(in srgb,var(--volt) 20%,transparent),transparent 40%);background-size:160% 160%;animation:drift2 6s ease-in-out infinite alternate}
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
/* heatmaps, a vida de cristal e a costura de nen em CSS: o mesmo CSS dos módulos, com o seletor do jogo e o da prévia */
if(window.CURSORES){
  const C = CURSORES, h = document.createElement('style'); h.id = 'gb-arte-heat';
  const es = C.cartas.naipe('espadas');
  h.textContent = C.cartas.css(':root[data-heat="cartas-nova"]') + C.cartas.css('.hm-cartas-nova')
    + `\n:root[data-heat="cartas-nova"],.hm-cartas-nova{--naipe:${es}}\n` + C.chamas.css(':root[data-heat="chamas-nova"]') + C.chamas.css('.hm-chamas-nova')
    + C.pegadas.css(':root[data-heat="pegadas-nova"]') + C.pegadas.css('.hm-pegadas-nova')
    + C.gungi.css(':root:is([data-heat="gungi"],[data-heat="gungi-nova"])') + C.gungi.css('.hm-gungi-nova')
    + C.cristal.css(':root[data-hp="cristal-nova"]') + C.cristal.css('.hp-cristal-nova')
    + C['costura-borda'].css(':root:is([data-borda="costura"],[data-borda="costura-nova"]) .card') + C['costura-borda'].css('.bd-costura-nova .mc');
  document.head.appendChild(h);
}

/* texturas de fundo em código (web/arte/texturas.js): pintam o ::before e o ::after do <html> (os do body já são da Aura
   ambiente e da Ascensão) e da prévia do card */
const TEX_NOVA = ['manga', 'grao', 'scan', 'hex', 'cartas', 'arena', 'nen'];
if(window.GB_TEXTURAS){
  const t = document.createElement('style'); t.id = 'gb-arte-tex';
  t.textContent = TEX_NOVA.map(k => GB_TEXTURAS.css('tx-' + k, `:root[data-bg="${k}-nova"]`, 'fixed') + GB_TEXTURAS.css('tx-' + k, `.pv.tex-${k}-nova`, 'absolute')).join('\n')
    + `\n.pv:is(${TEX_NOVA.map(k => '.tex-' + k + '-nova').join(',')}){isolation:isolate;--alto:96px;--larg:300px}\n.pv.tex-nen-nova{--dia:.6}`;
  document.head.appendChild(t);
}
let auraXP = null, auraSim = null;
const pulso = () => { const r = document.documentElement; r.classList.remove('tx-pulso'); void r.offsetWidth; r.classList.add('tx-pulso'); };
/* "passar o dia" no provar: a aura sai do zero e avança um oitavo a cada 1,6 s até fechar; depois volta ao XP de verdade */
function passaDia(){
  const r = document.documentElement; clearInterval(auraSim); let n = 0;
  r.style.setProperty('--dia', 0); r.style.setProperty('--cheio', 0);
  auraSim = setInterval(() => {
    n++; r.style.setProperty('--dia', n / 8); r.style.setProperty('--cheio', n >= 8 ? 1 : 0); pulso();
    if(n >= 8){ clearInterval(auraSim); setTimeout(() => { auraSim = null; auraXP = null; render(); }, 4000); }
  }, 1600);
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
/* ---------- fundo em código: a Poeira de Nen nova ("estrelas-nova") e a Aura ambiente nova ("drift-nova"); o tema muda as
   cores, e os dois módulos leem a paleta sozinhos a cada segundo ---------- */
const FUNDO = {'estrelas-nova': () => window.GB_POEIRA, 'drift-nova': () => window.GB_AURA_AMB, 'ascensao-nova': () => window.GB_AURORA}, fundos = {};
function fundo(){
  const fx = (document.documentElement.getAttribute('data-fx') || '').split(' ');
  for(const k in FUNDO){
    const on = fx.includes(k), M = FUNDO[k]();
    if(on && !fundos[k] && M) fundos[k] = M.liga({});
    else if(!on && fundos[k]){ fundos[k].para(); delete fundos[k]; }
  }
}
/* ---------- a Fúria nova ("shake-nova"): o fogo nos chefões em fúria; "enfurecer" no provar (.gb-fu-teste) põe todos ---------- */
let furia = null;
function furiaNova(){
  const on = (document.documentElement.getAttribute('data-fx') || '').split(' ').includes('shake-nova');
  if(on && !furia && window.GB_FURIA) furia = GB_FURIA.cola({sel: '.av.bs.hurt,.ring.fury,.gb-fu-teste .av.bs:not(.dead),.gb-fu-teste .ring:not(.dead)'});
  else if(!on && furia){ furia.para(); furia = null; document.documentElement.classList.remove('gb-fu-teste'); }
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
  GB_FX.aplica = function(){ aplica.apply(this, arguments); cursor(); hover(); gyoNovo(); rastro(); fundo(); furiaNova(); };
  /* o Terminal vivo novo: digita os títulos da aba que acabou de abrir (depois do render, que reescreve a aba) */
  const aba = GB_FX.aba;
  GB_FX.aba = function(){ aba.apply(this, arguments);
    if((document.documentElement.getAttribute('data-fx') || '').split(' ').includes('digita-nova') && window.GB_DIGITA) requestAnimationFrame(() => GB_DIGITA.aba(document, {sel: 'h1,h2,h3'})); };
  /* os efeitos de evento em código: ao concluir (godspeed, jajanken, costura), no andar novo e no chefão derrotado (confete,
     fogos, soco, dragao) e no ▶ da loja. r é o retângulo onde cai, el o card que leva o tranco. Devolve true quando tratou;
     o que não tem versão em código (baralho) fica com o efeitos.js */
  let mao = 0, ultimoR = null;
  /* o card no ponto onde a tarefa foi concluída (o render() já trocou o botão, então vale o retângulo) */
  const cardEm = r => { const e = r && document.elementFromPoint(r.left + r.width/2, r.top + r.height/2); return e && e.closest('.card,li,.l-row'); };
  const ev = (k, r, el) => {
    if(k === 'confete' && window.GB_CONFETE){ GB_CONFETE.dispara({}); return true; }
    if(k === 'fogos' && window.GB_FOGOS){ GB_FOGOS.dispara({}); return true; }
    if(!['godspeed', 'jajanken', 'costura', 'soco', 'dragao'].includes(k) || !window.CURSORES || !CURSORES[k]) return false;
    if(!el || !el.isConnected) el = cardEm(r) || document.querySelector('.card');   // o andar novo sem card de tarefa (caçada, marco): o primeiro da tela
    const rr = el ? el.getBoundingClientRect() : r;
    if(!rr) return false;
    if(k === 'soco') CURSORES.soco.dispara(rr, {el});
    else if(k === 'jajanken'){ const m = ['pedra', 'papel', 'tesoura'][mao++ % 3]; fonte().then(() => CURSORES.jajanken.dispara(rr, {el, mao: m})); }
    else fonte().then(() => CURSORES[k].dispara(rr, {el}));
    return true;
  };
  GB_FX.novo = (k, r, el) => { if(r) ultimoR = r; return ev(k, r || ultimoR, el); };   // a festa (sem r) cai onde foi a última tarefa
  GB_FX.ver = function(id, r){
    const it = GB.COS.find(i => i.id === id), b = document.querySelector(`[data-fxver="${id}"]`), card = b && b.closest('.it7');
    if(it && it.fx && ev(it.fx, r, card)) return;
    return ver.apply(this, arguments);
  };
}

/* ---------- o que o index.html e o grupo.js chamam ---------- */
window.GB_ARTE = {
  ARTE, CARTAO, ST, tem, nova, naipe, fonte, aba,
  /* os cards em desenvolvimento da vitrine (não se compram nem se provam) e a prévia deles */
  ideias: ITENS_DEV,
  pvDev(it){
    if(it.id === 'at-countdown' && window.CURSORES && CURSORES.countdown) return `<div class="pv at7">${[5, 1, 0, -2].map(k => CURSORES.countdown.marca(k, 40)).join('')}</div>`;
    return `<div class="pv dev7"><b>em desenvolvimento</b><span>${esc(it.quem)}</span></div>`;
  },
  /* o item com arte nova: o valor do atributo ganha "-nova" (vista() no index.html, no que está equipado e no provar) */
  vista(v, it){
    if(nova(it.id) && it.eq && v[it.cat] === it.eq[it.cat] && ['borda','cursor','hp','heat','hover','trans'].includes(it.cat)) v[it.cat] += '-nova';
    if(FX_NOVA.includes(it.id) && nova(it.id)) v.fx = v.fx.map(f => f === it.fx ? f + '-nova' : f);
    if(it.cat === 'tex' && nova(it.id) && v.bg === it.eq.bg) v.bg += '-nova';
  },
  oficial(v){ for(const it of GB.COS) if(nova(it.id)) this.vista(v, it); },
  /* a Aura do dia nova: --dia é o XP de hoje sobre a meta do dia; XP novo dá um pulso (render() no index.html) */
  aura(S){
    const r = document.documentElement;
    if(r.getAttribute('data-bg') !== 'nen-nova'){ auraXP = null; return; }
    if(auraSim) return;
    const d = Math.min(1, S.hojeXP / Math.max(1, S.metaDia));
    r.style.setProperty('--dia', d.toFixed(3)); r.style.setProperty('--cheio', d >= 1 ? 1 : 0);
    if(auraXP !== null && S.hojeXP > auraXP) pulso();
    auraXP = S.hojeXP;
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
  /* sem aviso nem borda de status: a arte está fechada (#77); a Associação (grupo.js) ainda chama o aviso */
  aviso(){ return ''; },
  borda(){ return ''; },
  /* na faixa do provar: nas chamas, nas pegadas, no Gungi, na Aura do dia e na Fúria, o momento de hoje */
  faixa(id){ const hoje = nova(id) && {'hm-chamas': ['chamas', 'acender hoje'], 'hm-pegadas': ['pegadas', 'pisar hoje'], 'hm-gungi': ['gungi', 'jogar hoje'], 'tx-nen': ['aura', 'passar o dia'], 'fx-shake': ['furia', 'enfurecer']}[id];
    return hoje ? `<button type="button" class="btn" data-artehoje="${hoje[0]}" style="background:#0b0d12;color:#fff;border-color:#0b0d12">${hoje[1]}</button>` : ''; },
};

/* desenha os cursores novos nas prévias dos cards (canvas que acabou de entrar na página) */
function pinta(){
  if(!window.CURSORES) return;
  for(const c of document.querySelectorAll('canvas[data-arte-cur]:not([data-ok])')){
    c.dataset.ok = 1; const g = c.getContext('2d'), k = c.dataset.arteCur; g.scale(2, 2);
    if(k === 'carta') CURSORES.carta.desenha(g, {n:'K', s:'c'}, 36, 36, 40, -.22);
    if(k === 'ioio'){ g.strokeStyle = '#E8ECF4'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(36, 2); g.lineTo(36, 40); g.stroke(); CURSORES.ioio.desenha(g, 36, 48, 15, -.3); }
    if(k === 'agulha') CURSORES.agulha.desenha(g, 15, 57, 60, 3 * Math.PI / 4);
    if(k === 'vara') CURSORES.vara.desenha(g, 22, 8, 46, {comprimento: 18});
  }
}
new MutationObserver(pinta).observe(document.documentElement, {childList:true, subtree:true});

document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-artehoje]'); if(!t) return;
  if(t.dataset.artehoje === 'aura'){ passaDia(); return; }
  else if(t.dataset.artehoje === 'furia'){ const r = document.documentElement; r.classList.toggle('gb-fu-teste');
    toast(r.classList.contains('gb-fu-teste') ? 'Todos os chefões em fúria, só para ver: abra a aba Chefões.' : 'Fúria de teste desligada.'); return; }
  else { const hj = document.querySelector('.l-hg i.hj'); if(hj) ({pegadas: () => CURSORES.pegadas.pisa(hj), gungi: () => CURSORES.gungi.joga(hj)}[t.dataset.artehoje] || (() => CURSORES.chamas.acende(hj)))(); else toast('O dia de hoje fica na Lista, no heatmap da constância: abra a aba e tente de novo.'); return; }
  render();
});
})();
