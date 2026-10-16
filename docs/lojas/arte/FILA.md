# Fila de arte

Uma linha por imagem. Status: `pendente` → `gerado` (o gerador salvou em `entrada/`) → `gostei` (guardada em `aprovadas/`, para os outros devs verem; não é a decisão final) ou `refazer` (a nota diz o que mudar) ou `pulado` (fica para depois).
Nota com **⚠ PROVISÓRIO** = aprovado, mas ainda não 100% fechado (pode ser trocado). O `prepara.py` e o `aprova.py` atualizam esta tabela; a coluna `cor` é a cor de teste na bancada (vazio = cor própria do desenho).

| id | tipo | cor | status | nota |
|---|---|---|---|---|
| corrente-tira | tira | #F7768E | gostei | 16/10: tira do Gemini, metade de cima espelhada e cortada em 2 elos; boa na barra de XP e na vida do chefão |
| corrente-elo | emblema |  | gostei | 16/10: elo solto, usado nos cantos e no cursor |
| bd-corrente | borda |  | gostei | refs: a tira e o elo aprovados; 1ª tentativa (montada da tira) não agradou; 16/10: gostou das 3 (cadeados, argolas, argola+cadeado); guardadas para analisar com calma; espessura e fatia a definir; 16/10: melhorar as 3 aprovadas: corrente mais fina e tudo dentro da faixa externa (cadeados/argolas dos cantos não passam dela, sem pedaços de elo cortados ou pontudos invadindo o campo); 16/10: ⚠ PROVISÓRIO, NÃO 100% FECHADO: variação 1, espessura 11 px e fatia 12 %; a versão refeita com a faixa contida (pasta no Downloads) ainda pode substituir |
| lic-exame | carimbo |  | gostei | 16/10: aprovou as 3 variações (念 anel duplo, visto, 念 anel triplo); guardadas para analisar; escolha do 念, visto ou 合格 fica para depois; 16/10: FINAL: variação 1 (念, anel duplo) aceita pelo Caio; as outras 2 ficam como alternativas |
| lic-chefao | carimbo |  | gostei | 16/10: aprovou as 3 (1: caveira+torre rachada, miolo cinza; 2: torre de tijolos com coroa e folhas; 3: caveira coroada com torre, mais limpa); guardadas para analisar; 16/10: FINAL: variação 2 (torre de tijolos, coroa e folhas) aceita pelo Caio; as outras 2 ficam como alternativas |
| lg-exame | carimbo |  | gostei | 16/10: selo de cera destoava da licença (textura); vira carimbo liso, 4 conceitos bem diferentes (queimado, redondo de tinta, hanko, estêncil); ver Variations no prompt; 16/10: só o conceito 2 (redondo de tinta, ampulheta) saiu; faltam queimado, hanko e estêncil: cota de imagem do agy esgotada até ~16h30; 16/10: FINAL, 100% aprovado pelo Caio: conceito 3 (selo quadrado hanko, nó entalhado em vermelho); o carimbo redondo da ampulheta fica como alternativa |
| lic-emb-aranha | emblema |  | gostei | 16/10: na licença o emblema vai SEM a caixa branca do emblema hunter (a aranha já tem borda clara); no jogo, como o .emb.rei, precisa de um .emb.aranha sem fundo; 16/10: FINAL, aprovado pelo Caio: aranha de 12 patas com borda clara, na licença sem a caixa branca; o Caio está ciente de que ficou bem próxima do logo oficial da Trupe |
| lg-rei | emblema |  | pulado | 16/10: não agradou: dos 3 conceitos o Caio trouxe só o 1 (coroa de carapaça), o que mais gostou, e nem esse convenceu; saiu com cara de ícone de item (vários tons de dourado, brilho na joia, pontas finas) e destoa da aranha e dos carimbos chapados; guardada em tentativas/lg-rei/; vai SEM a placa escura com aro dourado (só a coroa), então no jogo precisa de um .emb sem fundo como a aranha |
| lic-ouro | moldura |  | gerado | 16/10: EM ABERTO (o Caio decide noutro chat): a do Gemini não agradou (faixa grossa demais, robusta, não encaixa na licença; guardada como tentativas/lic-ouro/gemini-1.png); o Claude desenhou 3 estojos em SVG na proporção exata da licença, ocupando só a borda que ela já tem (nada tampado, mesmo tamanho): claude-1 guilhochê (duas ondas), claude-2 filete (linha no meio, losango com ponto vermelho), claude-3 serrilha (borda de moeda); todos em tentativas/lic-ouro/ com o gerador estojo.py; ver na bancada com tipo=moldura, inteira=1 e img=tentativas/lic-ouro/claude-1.svg,tentativas/lic-ouro/claude-2.svg,tentativas/lic-ouro/claude-3.svg; no jogo o SVG entra por cima da .tt-lf (camada inteira, sem fatiar) |
| cr-carta | cursor |  | pendente |  |
| cr-agulha | cursor |  | pendente |  |
| cr-ioio | cursor |  | gostei | 16/10: feito em código pelo Claude, sem o Gemini, a pedido do Caio (cursores/ioio.js: desenho e física); a bancada carrega a física pela ficha (fisica:'ioio' no itens.js), sem imagem; 16/10: ⚠ PROVISÓRIO: aprovado como está pelo Caio; o tamanho do fio e do ioiô (hoje raio 15 e fio 170 px) ele decide depois; captura em aprovadas/cr-ioio/ (enrolado e dormindo) |
| fx-jajanken-pedra | efeito | #9BE15D | pendente |  |
| fx-jajanken-papel | efeito | #9BE15D | pendente |  |
| fx-jajanken-tesoura | efeito | #9BE15D | pendente |  |
| hm-chamas | efeito |  | pendente |  |
| naipe-espadas | emblema | #E0AF68 | pendente |  |
| naipe-copas | emblema | #E0AF68 | pendente |  |
| naipe-ouros | emblema | #E0AF68 | pendente |  |
| naipe-paus | emblema | #E0AF68 | pendente |  |
| naipe-coringa | emblema | #E0AF68 | pendente |  |
