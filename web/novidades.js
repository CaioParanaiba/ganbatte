/* Ganbatte · aba Novidades: o que mudou em cada versão e o aviso de versão nova.
 * A lista entre os marcadores abaixo é JSON puro: o servidor lê a do GitHub (GET /api/atualizacao, no máximo a cada 6 h)
 * para saber se saiu versão nova. Ao lançar uma versão, ponha a nova no topo (a mesma do VERSAO do servidor.py).
 * Versão grande (X.Y, com nome novo): uma entrada só, com os destaques em "itens" e as versões que levaram até ela em
 * "versoes" (mesmo formato, recolhidas na aba). As X.Y.Z seguintes ficam soltas no topo até a próxima versão grande.
 * O servidor e as páginas antigas só leem as entradas de fora, então "versoes" não atrapalha quem ainda vai atualizar.
 * Quem atualiza para uma versão grande vê os destaques numa janela grande, uma vez (boasNovas). A marca dela fica em
 * estado.json → tour["nv:X.Y"], separada do visto: abrir a aba Novidades (onde fica o atualizar) não a gasta.
 * Aviso de pontos ("aviso": "X.Y.Z", desde a 0.6.4): toda versão que mexe em XP, Jenny ou pontos já ganhos abre a mesma janela
 * grande, uma vez, explicando o que mudou e quanto mudou no jogo de cada um (S.rec.migra). A marca é tour["nv:aviso:X.Y.Z"]:
 * a chave sobrevive à junção das betas na versão final, então quem viu na beta não vê de novo.
 * "janela": {"de", "resumo", "itens"} (0.6.5): a janela grande junta outra versão, de "de" até esta, com os destaques das duas
 * e o "no seu jogo" de cada uma; a linha do tempo da aba continua com os "itens" da própria versão.
 * Versão grande (0.7): "cap" troca a linha de cima da janela, "visual": true põe a escolha Nen/clássico nela e "obrigado":
 * {"t", "d", "quem": [{"n": usuário do GitHub (vazio = sem link), "o": o que a pessoa fez}]} agradece no fim.
 * Versão épica (0.9.0-beta2): "epica": {"chave", "cap", "lema", "chips", "fatos", "mais", "pontos": {"t", "d", "itens"}, "ajustes",
 * "ir": {"aba", "t"}} abre a janela com efeitos (janelaEpica), uma vez, com a marca tour["nv:" + chave]. A mesma marca da versão
 * grande de mesmo número (0.9), então quem viu na beta não vê de novo na main. Os destaques vão em ordem de impacto: o
 * primeiro dos "itens" é o principal, os outros "itens" os destaques, depois "mais", os pontos e os "ajustes", cada vez menores.
 * "marca" (0.9.0-beta3): a marca do tour, quando não é a "chave" (que é o número mostrado na janela). A beta3 traz a janela
 * definitiva da 0.9 com a marca "0.9-final": quem viu a da beta2 vê de novo, e a main usa a mesma marca, então não repete.
 * A janela abre só na entrada da versão instalada: a beta4 a herdou (mesma marca), para quem pulou a beta3 não perder, e a
 * 0.9 da main também, com as betas em "versoes".
 * "atributos" (0.9.1-beta1, #121): {"t", "d", "troca": {"i", "de", "para"}} põe na janela grande o hexágono de Nen de quem lê
 * passando do antes para o depois (S.rec.migra.tipos), com o nome do vértice "i" trocado; "cap" troca também a linha do aviso.
 * 0.9.2-beta1 (#135): o "no seu jogo" do aviso mostra a Jenny dos retratos de chefão devolvida (acertos.retratos).
 * "atualizar agora" chama POST /api/atualizar (git pull ou o ZIP do GitHub) e espera o servidor reiniciar.
 * Carregado depois de conquistas.js: usa CTX, EST, UI, cur, tab, render, post, recarrega, esc, ic, toast, salvaUI, gnav, VERSAO_PAGINA.
 */
window.GB_NOVIDADES = /*NOVIDADES*/[
  {"versao": "0.9.2-beta9", "nome": "atualização da Torre Trick", "data": "2026-10-22",
   "cap": "loja pausada para o balanceamento",
   "resumo": "As compras da Aparência estão pausadas enquanto os preços são balanceados com a regra nova. Dá para provar tudo, e o que já é seu continua seu.",
   "itens": [
     {"ic": "coin", "t": "Loja pausada para o balanceamento", "d": "Com o Codeforces pela cor e a torre nova, a Jenny da temporada mudou, e os preços vão ser ajustados com os relatórios dos jogadores. Até lá a Aparência não vende: provar continua, o que é seu continua equipável, e feitiços e prêmios reais seguem normais. Ajude mandando o seu relatório (Configurações → balanceamento → baixar relatório) (#77)."}
   ]},
  {"versao": "0.9.2-beta8", "nome": "atualização da Torre Trick", "data": "2026-10-21",
   "cap": "torre mais alta · loja completa",
   "resumo": "A Arena Celestial ficou mais alta: cada andar custa o dobro, para o topo ficar perto do fim das aulas. A arte nova das lojas está fechada e os itens que eram só para provar estão à venda.",
   "itens": [
     {"ic": "tower", "t": "Torre mais alta", "d": "Cada andar custa o dobro (16, 32 e 80 XP; o topo, 8.864 XP). O seu XP e a sua Jenny não mudaram, só o andar em que eles caem. Conquistas de andar e os títulos Mestre de Nen e Floor Master que você já tinha continuam seus (#77)."},
     {"ic": "coin", "t": "Loja completa", "d": "Os itens que eram só para provar estão à venda pelo preço da faixa: comum 1.000 J, raro 2.200 J, épico 3.200 J, título 500 J. Os preços de antes não mudaram (#77)."},
     {"ic": "spider", "t": "Arte nova fechada", "d": "O que você já tem ganhou o desenho novo, sem a troca antiga | nova. Godspeed, Jajanken, Costura, Soco, Dragon Dive, Confete e Fogos agora aparecem no jogo de verdade, não só no ▶ da loja (#134)."}
   ]},
  {"versao": "0.9.2-beta7", "nome": "atualização da Torre Trick", "data": "2026-10-21", "aviso": "0.9.2-beta7",
   "cap": "Codeforces pela cor do problema · aba nova do grupo",
   "resumo": "O Codeforces agora vale pela cor de cada problema, e o XP dele na temporada foi recalculado. As contribuições pagam só em Jenny. Para testar, a aba Grupo e a Lista ganharam uma versão nova atrás de um botão, e chegaram efeitos novos para provar.",
   "itens": [
     {"ic": "flame", "t": "Codeforces pela cor do problema", "d": "Cada problema vale pela cor do rating comparada com a sua faixa: 15 XP na faixa, 25 e 35 acima, 8 e 3 abaixo, e +20 por contest ao vivo, sem teto no dia. A sua faixa sai do seu maior rating e do seu nível nos últimos problemas, e aparece no card do Codeforces e na aba Regras. O XP do Codeforces da temporada foi recalculado com a regra nova, e nenhum dia fechado perde XP (#180)."},
     {"ic": "coin", "t": "Contribuições só em Jenny", "d": "Relatar um bug vale 300 J e uma ideia, 150 J, sem XP. O XP que as contribuições antigas davam saiu dos dias fechados, mas a Jenny tinha subido na mesma medida: a carteira fica igual (#180)."},
     {"ic": "tower", "t": "Aba nova do grupo, para testar", "d": "Em Grupo, o botão \"experimentar a aba nova\" abre o redesenho: o Geral e a Superação da semana, que zeram toda segunda, o card da semana com a modalidade e a sua marca, os desafios com o chefão do mês, a temporada em rodadas e medalhas e a licença de cada um. O que ainda não existe aparece marcado como prévia. A aba antiga continua a padrão (#170)."},
     {"ic": "card", "t": "Lista nova, para testar", "d": "No topo da Lista, um botão troca para a Lista redesenhada, na largura toda, com os hábitos em cima e o XP discreto em cada linha. O mesmo botão volta para a antiga (#178)."},
     {"ic": "spider", "t": "Efeitos novos para provar", "d": "Terminal vivo, Ascensão (a aurora), Confete, Fogos e a Fúria dos chefões, a Poeira de Nen e a Aura ambiente refeitas, as texturas de fundo refeitas em código, a Costura de nen na borda dos cards e o título Futuro Médico, do Leorio (#134)."},
     {"ic": "antenna", "t": "Loja mais enxuta", "d": "O mundo pixel saiu da loja (quem tem continua com ele). Paletas, fontes, títulos e sons ficam como estão; fontes e sons novos chegam quando o jogo passar de 8 jogadores ativos (#134)."}
   ]},
  {"versao": "0.9.2-beta6", "nome": "atualização da Torre Trick", "data": "2026-10-21",
   "resumo": "Chegaram para provar a vara de pescar do Gon, o Rastro de aura em três modelos, a Constância no Gungi e em pegadas, o HP de cristal, o Soco remoto do Leorio e o Dragon Dive do Zeno. Na beta, a borda de status da vitrine agora pinta o card inteiro, em verde, amarelo ou vermelho.",
   "itens": [
     {"ic": "alvo", "t": "Vara de pescar do Gon", "d": "Cursor épico: a ponta da vara é o ponteiro. Clique para lançar a linha, fisgue um card e puxe; segure para recolher. Parado um tempo, um peixe morde o anzol. Prove no provar da vitrine (#134)."},
     {"ic": "flame", "t": "Rastro de aura em três modelos", "d": "O Rastro de aura foi refeito (vapor de Ten e Ren) e ganhou dois irmãos épicos: o Fio de aura, uma fita com física de corda, e o Eco do Killua, o Rhythm Echo. Mais leve que a primeira versão (#134)."},
     {"ic": "tower", "t": "Constância no Gungi e em pegadas", "d": "Dois heatmaps novos para provar: o tabuleiro de Gungi do Meruem e da Komugi, com peças empilhadas pela força do dia, e o rastro de pés descalços, com pegada de nen no dia salvo (#134)."},
     {"ic": "crown", "t": "HP de cristal", "d": "A vida do chefão vira uma fileira de cristais lapidados, com os engastes vazios na vida perdida. Refeito do zero, ainda em aberto (#134)."},
     {"ic": "spider", "t": "Soco, Dragon Dive e Gyo", "d": "O Soco remoto do Leorio e o Dragon Dive do Zeno viraram itens para provar pelo ▶, e o Gyo ganhou a versão nova, uma lente que revela fios e selos no card. Os três estão aprovados e esperando o outro dev (#134)."},
     {"ic": "coin", "t": "Borda de status de uma cor só", "d": "Na beta, a cor do status da arte vai no card inteiro da vitrine, com cores fixas que não somem em nenhum tema: verde fechado, amarelo aprovado e esperando o outro dev, vermelho em aberto."}
   ]},
  {"versao": "0.9.2-beta5", "nome": "atualização da Torre Trick", "data": "2026-10-20",
   "resumo": "Chegaram para provar a Costura da Machi e a Barra elétrica do Killua refeita. Na beta, a borda de cada item da Masadora mostra em que pé está a arte dele: verde fechado, dourada aprovado e esperando o outro dev, vermelha em aberto ou ainda não revisto.",
   "itens": [
     {"ic": "coin", "t": "Status da arte na borda", "d": "Na beta, cada card da vitrine ganha a borda do status da arte nova (#134): verde fechado, dourada o Caio aprovou e falta o outro dev ver, vermelha em aberto ou ainda não revisto. A legenda, com quantos há de cada, fica no quadro \"arte nova em teste\". O alto do card continua com a cor da raridade."},
     {"ic": "spider", "t": "Costura da Machi", "d": "Efeito épico ao concluir uma tarefa: o card racha de verdade, a agulha da Machi o costura em zigue-zague e o fio é puxado, com 念糸縫合 no fim. Prove no ▶ da vitrine (#134)."},
     {"ic": "card", "t": "Barra elétrica do Killua", "d": "A Barra elétrica passou a raro e virou a eletricidade do Killua: um raio estala dentro da barra de XP, a ponta solta faíscas e de vez em quando a barra dá uma descarga. A versão nova está no provar (#134)."},
     {"ic": "tower", "t": "Na fila de arte", "d": "O Soco remoto do Leorio está aprovado e esperando o outro dev; as Borboletas do Pouf seguem em aberto; as Cartas do Hisoka ficam no formato de hoje. Nenhum dos três muda o jogo ainda (#134)."}
   ]},
  {"versao": "0.9.2-beta4", "nome": "atualização da Torre Trick", "data": "2026-10-20",
   "resumo": "A Masadora ficou mais fácil de navegar: a Aparência agora vem em quatro famílias, o card é enxuto e o detalhe abre ao lado. Chegaram para provar as transições de aba novas (a fumaça do Morel e a aba sugada da Deme-chan) e as correntes do Kurapika refeitas, e várias bordas, hovers e cursores foram ajustados.",
   "itens": [
     {"ic": "coin", "t": "Loja em famílias", "d": "A Aparência agora tem quatro famílias (Perfil, Cores e fundo, Cards e telas, Efeitos e sons), com um chip por prateleira. O card mostra só prévia, nome, preço e o botão; clique nele para ver o detalhe ao lado. Uma busca e os filtros numa linha só, e o que você já tem fica escondido de início (continua em Comprados)."},
     {"ic": "card", "t": "Transições de aba novas", "d": "Prove em Troca de aba: a Fumaça do Morel cobre a tela e se desfaz já na aba nova, e na Deme-chan a aba velha é sugada para o canto. O Deslizar agora vai no sentido das abas e o Glitch rasga a tela de verdade (na versão nova). A aba troca na hora do clique, a animação não atrasa nada (#134)."},
     {"ic": "spider", "t": "Correntes do Kurapika e bordas", "d": "A corrente virou uma família só: na borda, com a esfera da Dowsing Chain balançando; na barra de XP, com a Judgment Chain; e escarlate na vida do chefão. A corrente que você usa não vaza mais para as prévias da loja. Bordas: Canto cortado no lugar da tracejada, Cantos nos quatro lados, e a Aura viva na cor do seu tipo de Nen; a Carta de baralho e a Teia saíram para serem repensadas (#134, #142)."},
     {"ic": "tower", "t": "Ajustes rápidos", "d": "A Carta que vira não reinicia o giro quando você mexe o mouse. Segurar o clique com a agulha, a carta ou o ioiô não marca mais o texto. O En ficou mais contido, o ioiô voltou a ser um só (o raio carrega segurando parado) e os Fogos passaram a raro. Os ícones dos chefões saíram da loja: escolha cada um direto na aba Chefões (#134, #142)."}
   ]},
  {"versao": "0.9.2-beta3", "nome": "atualização da Torre Trick", "data": "2026-10-20",
   "resumo": "A Masadora mostra tudo de novo: o que você já comprou continua na vitrine com o selo \"já comprado\" (e segue em Comprados), e dá para ver a loja por categoria ou por raridade. Os hovers ganharam arte nova para provar, o Godspeed foi refeito, a agulha, o ioiô, o Jajanken e as chamas fecharam, e as ideias que ainda não têm arte aparecem como \"em desenvolvimento\".",
   "itens": [
     {"ic": "coin", "t": "Vitrine inteira, por categoria ou raridade", "d": "O que é seu não some mais da Masadora: fica no lugar, com o selo \"já comprado\", e continua em Comprados. Em \"ver\", escolha por categoria (as prateleiras de sempre) ou por raridade (comum, raro, épico, lendário e o que não tem faixa, cada card com a prateleira dele). Os filtros de faixa, tema e arte nova valem nas duas."},
     {"ic": "card", "t": "Hovers novos para provar", "d": "Bungee Gum, En da Pitou, Carta que vira, Shu e Contorno foram refeitos: o card é o protagonista e nada se desenha no cursor. Prove em Hover nos cards com a troca na nova; painéis grandes ganham a versão leve (#134)."},
     {"ic": "tower", "t": "Godspeed refeito e mais itens fechados", "d": "O Godspeed ganhou o Kanmuru, o quadro negativo e a marca do raio no card. A agulha (com o fio de nen), os dois ioiôs do Killua, as três mãos do Jajanken e as chamas fecharam (#134)."},
     {"ic": "antenna", "t": "Em desenvolvimento", "d": "Ideias aprovadas que ainda não têm arte entram na vitrine com o aviso \"em desenvolvimento\": a vara do Gon, as borboletas do Pouf, a costura da Machi, o Dragon Dive do Zeno, o Gungi, a fumaça do Morel e outras. A Marca de prazo é uma categoria nova em teste, com a bomba do Countdown do Genthru para ver (#134)."}
   ]},
  {"versao": "0.9.2-beta2", "nome": "atualização da Torre Trick", "data": "2026-10-17",
   "resumo": "A arte nova das lojas chegou para provar: cursores com física, efeitos refeitos, heatmaps em cartas e chamas, carimbos desenhados e a licença hunter redesenhada. Cada item mostra se a arte já está fechada ou o que ainda falta, e dá para comparar a versão de hoje com a nova. Nada da arte nova se compra ainda, e o que você já tem continua igual.",
   "itens": [
     {"ic": "card", "t": "Antiga ou nova, lado a lado", "d": "Na Masadora, os itens com arte nova ganham o aviso \"arte\" (fechado, falta finalizar ou em aberto), uma frase do que falta e a troca antiga | nova. Com a nova escolhida, o provar e o ▶ mostram o desenho novo. O botão no alto da loja mostra só esses itens (#134)."},
     {"ic": "antenna", "t": "Cursores com física", "d": "A carta do Hisoka atira e gruda na Bungee Gum, a agulha do Illumi crava e volta em leque, e o ioiô do Killua desce, dorme e volta. Prove na Masadora, em Cursores (#134)."},
     {"ic": "tower", "t": "Godspeed, Jajanken, cartas e chamas", "d": "O Godspeed virou um raio de verdade caindo no card, e o Jajanken tem as três mãos com o grito em japonês: o ▶ da nova passa por pedra, papel e tesoura. A constância ganhou as cartas de baralho e as chamas de anime; provando as chamas, \"acender hoje\" mostra o acender. Quem tem o Godspeed ou o Jajanken continua com a versão de hoje (#134)."},
     {"ic": "crown", "t": "A licença redesenhada", "d": "No provador da Loja da Associação, a troca antiga | nova mostra o cartão novo, fiel ao do anime, com os estojos de couro, de corrente e os três dourados para escolher, os carimbos desenhados, a Aranha e os naipes novos. Só na sua tela, como o resto do provador (#134)."}
   ]},
  {"versao": "0.9.2-beta1", "nome": "atualização da Torre Trick", "data": "2026-10-15", "aviso": "0.9.2-beta1",
   "cap": "lojas em faixas · retratos de chefão grátis",
   "resumo": "As duas lojas foram reorganizadas. Os retratos de chefão ficaram grátis, e quem comprou recebe a Jenny de volta. Três pacotes ficaram mais baratos porque perderam peças que foram para a loja do grupo. O resto do seu XP e da sua Jenny continua igual, e o que você comprou continua seu.",
   "itens": [
     {"ic": "coin", "t": "Retratos de chefão grátis", "d": "Os 15 retratos de chefão agora vêm com o jogo: escolha o de cada chefão em Loja → Comprados. Quem comprou recebe os 1.500 J de cada retrato de volta, uma vez, na linha \"retratos devolvidos\" da carteira, e continua com o retrato (#135)."},
     {"ic": "card", "t": "Masadora em faixas", "d": "Cada item tem uma faixa (comum, raro, épico) e o selo 念 HxH quando é do tema, com filtros no alto da loja. Os títulos de conquista (Floor Master, Mestre de Nen, Ten Inabalável, Segunda Natureza, Hunter ★★) ficam grátis quando você bate a conquista; quem já comprou um continua com ele (#135)."},
     {"ic": "tower", "t": "Temas viraram pacotes", "d": "Os temas completos agora são pacotes: o preço desconta as peças que você já tem e, com tudo seu, o pacote equipa tudo de uma vez. A Aura do avatar e o Anel de aura saíram dos pacotes, por isso o Killua caiu de 6.000 para 4.600 J, o Meruem de 10.000 para 8.500 J e a Ascensão de 25.000 para 19.600 J. Quem comprou o pacote antes continua com a Aura e o Anel (#135)."},
     {"ic": "antenna", "t": "Itens novos para provar", "d": "Bordas e hover dos cards, cursores, barra de HP dos chefões, heatmaps da constância, troca de aba, quatro paletas neutras, molduras simples e os sons Clique e Gota. Por enquanto, só para provar: os preços chegam com o balanceamento das lojas (#135, #77)."},
     {"ic": "crown", "t": "Loja da Associação", "d": "Na Torre Trick, a sub-aba loja mostra o que vai sair na loja do grupo e como cada item vai ser liberado. O provador aplica os itens na sua licença, frente e verso, e só você vê. As molduras especiais e a Aura do avatar não se compram mais na Masadora, porque vão para lá; quem já tem continua usando (#136)."}
   ]},
  {"versao": "0.9.1", "nome": "atualização da Torre Trick", "data": "2026-10-15", "aviso": "0.9.1-beta1",
   "cap": "tipos novos · o seu hexágono de Nen foi refeito",
   "resumo": "Os tipos das tarefas ficaram mais claros: faculdade saiu, treino e projeto se separaram, e o seu hexágono de Nen foi refeito com a regra nova. Chegaram as tarefas que repetem, e quem começa agora tem uma primeira entrada nova e um tutorial mais curto. O seu XP, a sua Jenny e os feitiços continuam exatamente iguais.",
   "atributos": {"t": "Conjuração agora é projeto", "d": "Conjuração deixou de ser \"outras coisas da faculdade\" e passou a ser criar algo seu: um app, um site, as issues do Ganbatte. O que era faculdade virou estudo (Intensificação), e o treino (Transmutação) ficou só com Codeforces e prática. O XP de cada tarefa é o mesmo; só mudou em que tipo ele cai. A missão da semana segue a regra antiga até domingo, para o ×1,5 e os feitiços que você já ganhou não mudarem, e passa para a nova na segunda.",
    "troca": {"i": 2, "de": "criação", "para": "projeto"}},
   "itens": [
     {"ic": "con", "t": "Tipos novos", "d": "O tipo diz o que você faz; a disciplina, de onde vem. Tarefa da disciplina sem tag agora é estudo (os mesmos 15 XP). Treino é Codeforces e prática; projeto, com +projeto, é criar algo seu (10 XP). Entrega é trabalho que alguém cobra ou avalia: ter prazo não basta. Conquista da IA de tipo faculdade ainda não cumprida foi descartada, e a vaga abriu (#121)."},
     {"ic": "copy", "t": "Tarefas que repetem", "d": "Pagar o aluguel todo dia 1, trocar a escova a cada 3 meses: em detalhes → repete, a tarefa volta sozinha quando você conclui. A que está longe do prazo fica guardada em ↻ recorrentes e só entra na Lista perto da data. Se atrasar, ela continua uma só e mostra #2, #3; um concluir quita tudo (#113)."},
     {"ic": "alvo", "t": "O jogo decide mais justo", "d": "A prioridade sugerida conta motivos: um dá C, dois dão B, três (ou dois muito urgentes) dão A. Antes quase tudo com prazo virava B. A sugestão de tipo também melhorou: lista é estudo, #12 é projeto e, numa disciplina, o jogo sugere estudo (#5)."},
     {"ic": "scroll", "t": "Janela do N mais enxuta", "d": "N abre só com o texto e quanto vale; tipo, prazo e caçada ficam em detalhes, e a janela lembra se você os deixou abertos. Enter adiciona a tarefa mesmo depois de mexer nas opções (#111, #112)."},
     {"ic": "card", "t": "Foto nova no grupo", "d": "Trocou a foto de perfil? Ela aparece no grupo e na Torre Trick na próxima atualização do placar (#109)."},
     {"ic": "card", "t": "Primeira entrada nova", "d": "Quem chega agora monta a licença hunter enquanto escreve o nome, conhece os 6 tipos num hexágono e aprende a diferença entre tarefa, caçada e projeto. Não precisa cadastrar matéria nenhuma: elas ficam para a aba Chefões, à mão ou com a IA, quando der (#127)."},
     {"ic": "scroll", "t": "Tutorial mais curto", "d": "O tutorial de cada aba ficou com menos passos e textos de uma ou duas frases, e pula o que você ainda não tem (chefões sem matéria, Codeforces desligado). A dica do Codeforces não aparece mais em cima do hábito errado."},
     {"ic": "alvo", "t": "Caçada com o tipo projeto", "d": "Na janela de nova caçada, o tipo das etapas agora separa treino de projeto, como no resto do jogo."},
     {"ic": "scroll", "t": "Tipos bem explicados", "d": "A frase de cada tipo de Nen, no Progresso e no Book, segue a regra nova: tarefa de disciplina sem tag é estudo, treino é prática e Codeforces, entrega é o que alguém cobra ou avalia (#131)."}
   ],
   "versoes": [
      {"versao": "0.9.1-beta2", "nome": "atualização da Torre Trick", "data": "2026-10-15",
       "resumo": "Uma primeira entrada nova para quem chega e um tutorial mais curto, que só mostra o que você já tem. O seu XP, a sua Jenny e tudo o que você já ganhou continuam iguais.",
       "itens": [
         {"ic": "card", "t": "Primeira entrada nova", "d": "Quem chega agora monta a licença hunter enquanto escreve o nome, conhece os 6 tipos num hexágono e aprende a diferença entre tarefa, caçada e projeto. Não precisa cadastrar matéria nenhuma: elas ficam para a aba Chefões, à mão ou com a IA, quando der (#127)."},
         {"ic": "scroll", "t": "Tutorial mais curto", "d": "O tutorial de cada aba ficou com menos passos e textos de uma ou duas frases, e pula o que você ainda não tem (chefões sem matéria, Codeforces desligado). A dica do Codeforces não aparece mais em cima do hábito errado."},
         {"ic": "alvo", "t": "Caçada com o tipo projeto", "d": "Na janela de nova caçada, o tipo das etapas agora separa treino de projeto, como no resto do jogo."}
       ]},
      {"versao": "0.9.1-beta1", "nome": "atualização da Torre Trick", "data": "2026-10-15", "aviso": "0.9.1-beta1",
       "cap": "tipos novos · o seu hexágono de Nen foi refeito",
       "resumo": "Os tipos das tarefas ficaram mais claros: faculdade saiu, treino e projeto se separaram, e o seu hexágono de Nen foi refeito com a regra nova. O seu XP, a sua Jenny e os feitiços continuam exatamente iguais. E chegaram as tarefas que repetem.",
       "atributos": {"t": "Conjuração agora é projeto", "d": "Conjuração deixou de ser \"outras coisas da faculdade\" e passou a ser criar algo seu: um app, um site, as issues do Ganbatte. O que era faculdade virou estudo (Intensificação), e o treino (Transmutação) ficou só com Codeforces e prática. O XP de cada tarefa é o mesmo; só mudou em que tipo ele cai. A missão da semana segue a regra antiga até domingo, para o ×1,5 e os feitiços que você já ganhou não mudarem, e passa para a nova na segunda.",
        "troca": {"i": 2, "de": "criação", "para": "projeto"}},
       "itens": [
         {"ic": "con", "t": "Tipos novos", "d": "O tipo diz o que você faz; a disciplina, de onde vem. Tarefa da disciplina sem tag agora é estudo (os mesmos 15 XP). Treino é Codeforces e prática; projeto, com +projeto, é criar algo seu (10 XP). Entrega é trabalho que alguém cobra ou avalia: ter prazo não basta. Conquista da IA de tipo faculdade ainda não cumprida foi descartada, e a vaga abriu (#121)."},
         {"ic": "copy", "t": "Tarefas que repetem", "d": "Pagar o aluguel todo dia 1, trocar a escova a cada 3 meses: em detalhes → repete, a tarefa volta sozinha quando você conclui. A que está longe do prazo fica guardada em ↻ recorrentes e só entra na Lista perto da data. Se atrasar, ela continua uma só e mostra #2, #3; um concluir quita tudo (#113)."},
         {"ic": "alvo", "t": "O jogo decide mais justo", "d": "A prioridade sugerida conta motivos: um dá C, dois dão B, três (ou dois muito urgentes) dão A. Antes quase tudo com prazo virava B. A sugestão de tipo também melhorou: lista é estudo, #12 é projeto e, numa disciplina, o jogo sugere estudo (#5)."},
         {"ic": "scroll", "t": "Janela do N mais enxuta", "d": "N abre só com o texto e quanto vale; tipo, prazo e caçada ficam em detalhes, e a janela lembra se você os deixou abertos. Enter adiciona a tarefa mesmo depois de mexer nas opções (#111, #112)."},
         {"ic": "card", "t": "Foto nova no grupo", "d": "Trocou a foto de perfil? Ela aparece no grupo e na Torre Trick na próxima atualização do placar (#109)."}
       ]}
   ]},
  {"versao": "0.9", "nome": "atualização da Torre Trick", "data": "2026-10-14",
   "resumo": "A maior atualização do Ganbatte: o modo em grupo com a Torre Trick, caçadas dentro de caçadas, retratos dos chefões, uma coleção que nunca se perde e, para quem contribui, a recompensa assim que a correção entra no beta. O seu XP, a sua Jenny e tudo o que você já ganhou continuam exatamente iguais.",
   "itens": [
     {"ic": "tower", "t": "A Torre Trick", "d": "O modo em grupo chegou. Um amigo vira o servidor, manda um convite, e a aba Torre Trick vira o placar de vocês: cada dia vale até 1 andar descido (o seu XP até o teto do grupo, que é a mediana do mês anterior), cada hábito do grupo cumprido vale 0,2, e superar a sua própria média rende andares extras quando o período fecha. Ninguém vê o XP nem as tarefas de ninguém: do seu computador só saem os andares e se você jogou no dia (#38, #42, #67)."},
     {"ic": "card", "t": "Licença hunter", "d": "Cada jogador tem a sua licença, que vira com um clique: na frente, a posição e os andares; no verso, a posição em cada placar e a superação em curso. Clique no nome de alguém para abrir a licença da pessoa (#67)."},
     {"ic": "crown", "t": "Placares e evolução", "d": "Além do placar geral com pódio, cada hábito do grupo, o Codeforces e a superação ganham placar próprio, com quem lidera cada um. A sua posição semana a semana aparece num gráfico, com o líder em dourado (#42, #67)."},
     {"ic": "alvo", "t": "Caçadas dentro de caçadas", "d": "Uma caçada grande (a v1.0 de um projeto, um semestre inteiro) pode ter outras dentro. Escolha em \"dentro da caçada\" ao criar ou no ✎, ou use \"+ caçada dentro\". Cada uma fecha com o bônus das próprias etapas, e a de cima só fecha depois das de dentro (#92)."},
     {"ic": "flame", "t": "Hábitos do grupo", "d": "Os admins montam a lista em Torre Trick → administrar. O Codeforces vem sozinho; os outros (Digitação, Duolingo...) cada um liga a um hábito seu em Configurações → grupo, e o grupo vê só se você cumpriu no dia (#41)."},
     {"ic": "antenna", "t": "Convite e servidor em casa", "d": "Sem conta e sem senha: o admin gera um link de uso único e você cola na própria aba Torre Trick. Quem cria o grupo liga o servidor no próprio computador, aberto pela internet com o Tailscale Funnel (grátis), e pode levá-lo para outra máquina sem ninguém perder um dia. Sem internet, a aba mostra o último placar e o seu jogo segue igual (#38, #39, #40, #84, #91)."}
   ],
   "epica": {"chave": "0.9", "marca": "0.9-final", "cap": "a maior atualização do Ganbatte",
    "lema": "O Ganbatte deixa de ser só seu. Junte os amigos, desçam a Torre Trick andar por andar e vejam quem lidera cada placar, sem ninguém ver as tarefas de ninguém.",
    "chips": ["modo em grupo", "Torre Trick", "licença hunter", "placares", "caçadas dentro de caçadas", "retratos dos chefões", "coleção permanente", "contribuição no beta"],
    "fatos": [{"n": "1", "t": "andar por dia, no máximo"}, {"n": "0,2", "t": "andar por hábito do grupo"}, {"n": "+", "t": "andares por superar a si mesmo"}],
    "mais": [
     {"ic": "spider", "t": "Retratos dos chefões", "d": "15 retratos na Loja, em Aparência, para pôr no lugar do ícone de cada chefão. Derrote o chefão que está com um retrato e ele vira foto de perfil, de graça (#33)."},
     {"ic": "bag", "t": "Coleção permanente", "d": "Tudo o que você compra fica guardado na pasta colecao/ dos seus dados e numa aba Comprados na Loja. Trocar de temporada ou atualizar o jogo não tira nada (#33)."},
     {"ic": "coin", "t": "Jenny de cada tarefa", "d": "Ao lado do XP, cada tarefa mostra quanto Jenny rende ao concluir, também ao criar e ao editar, já com os bônus que valem hoje (#57)."},
     {"ic": "scroll", "t": "Frase do líder", "d": "Quem liderar a semana escreve a frase que fica no topo do placar até a próxima semana fechar. Uma vez só, até 80 letras: escolha bem (#76)."},
     {"ic": "antenna", "t": "Antigravity na IA", "d": "O Google parou de aceitar o Gemini CLI com conta gratuita. No lugar, o jogo agora usa o Antigravity CLI (agy): instale, entre na conta pelo terminal e escolha-o em Configurações → IA (#60)."}
    ],
    "pontos": {"t": "O que muda nos pontos", "d": "O seu XP, a sua Jenny e tudo o que você já ganhou continuam exatamente iguais. O que muda é o que vem daqui para a frente.",
     "itens": [
      {"ic": "tower", "t": "Andares são pontos novos", "d": "Existem só na Torre Trick, para quem está num grupo. Ninguém perde nada: é a primeira vez que eles existem."},
      {"ic": "card", "t": "Desafios da IA mais exigentes", "d": "As cartas novas pedem tarefas em vários dias, sequências mais longas, semanas completas de XP e notas com peso na disciplina. As recompensas continuam 800, 1.500, 3.000 e 6.000 J, e as cartas que você já aceitou mantêm as regras delas (#75)."},
      {"ic": "bug", "t": "Contribuição paga no beta", "d": "Bug corrigido (+15 XP e +150 J) ou ideia feita (+10 XP e +50 J) que você abriu no GitHub rende assim que entra no beta, sem esperar a versão normal. Quem joga na versão normal recebe um aviso de que a correção já está a caminho, e em Configurações o botão \"conferir agora\" busca na hora (#96)."},
      {"ic": "scroll", "t": "Para quem desenvolve", "d": "A issue em que você é o responsável vira tarefa na Lista e se conclui sozinha quando entra no beta, valendo pelo esforço: 10, 15 ou 25 XP. Quem abriu e fez a própria issue ganha pela tarefa, não pela recompensa de relatar (#97)."}
     ]},
    "ajustes": [
     {"t": "Cadastros seguidos", "d": "as janelas de tarefa (N) e caçada (C) confirmam o envio e continuam abertas para a próxima; Enter vazio, Esc ou clique fora fecham, e na caçada Shift+Enter separa as etapas (#59)."},
     {"t": "Um aviso por vez", "d": "ao provar um item da Loja, segurar uma tecla mostra só um aviso de bloqueio, não uma pilha deles (#58)."},
     {"t": "Gemini CLI", "d": "roda numa pasta temporária sem pedir confiança, e os erros dele aparecem em português (#60)."},
     {"t": "GitHub a cada hora", "d": "as suas contribuições são conferidas a cada 1 h, não mais a cada 6 h (#96)."},
     {"t": "Tarefa de dev no projeto certo", "d": "para quem desenvolve: a tarefa da issue entra na sua expedição Ganbatte, se você tiver uma aberta, em vez de num projeto solto."},
     {"t": "Versão Grupo agora é a Beta", "d": "em Configurações → servidor ficam só Estável e Beta. Quem estava na Grupo passa para a Beta sozinho no próximo atualizar."}
    ],
    "ir": {"aba": "tt", "t": "descer a Torre Trick"}},
   "obrigado": {"t": "Obrigado a quem jogou junto",
    "d": "Metade desta versão nasceu de issues e PRs de quem joga. A outra metade, de quem testou as primeiras versões do grupo e disse o que queria ver no placar.",
    "quem": [
      {"n": "luy121314", "o": "5 issues e 4 PRs: os retratos dos chefões, a Jenny de cada tarefa, os desafios da IA mais justos, as janelas de cadastro e o aviso único ao provar. E agora o segundo dev do Ganbatte"},
      {"n": "Caduyz", "o": "achou o erro do Gemini CLI que trouxe o Antigravity para o jogo"},
      {"n": "", "o": "quem testou a primeira versão do grupo e opinou sobre os placares, a licença e a frase do líder"}
    ]},
   "versoes": [
     {"versao": "0.9.0-beta4", "nome": "atualização da Torre Trick", "data": "2026-10-14",
      "resumo": "A tarefa de dev entra na expedição Ganbatte, para todos os devs, e a janela da 0.9 como vai chegar na versão normal.",
      "itens": [
        {"ic": "scroll", "t": "Tarefa de dev no projeto certo", "d": "Para quem desenvolve: a tarefa da issue em que você é o responsável entra na sua expedição Ganbatte, se você tiver uma aberta, em vez de num projeto solto (PR #102)."}
      ]},
     {"versao": "0.9.0-beta3", "nome": "atualização da Torre Trick", "data": "2026-10-14",
      "resumo": "Caçadas dentro de caçadas, o convite colado na própria aba Torre Trick, o servidor do grupo que muda de computador e a contribuição paga assim que entra no beta.",
      "itens": [
        {"ic": "alvo", "t": "Caçadas dentro de caçadas", "d": "Uma caçada grande pode ter outras dentro: escolha em \"dentro da caçada\" ao criar ou no ✎, ou use \"+ caçada dentro\". Cada uma fecha com o bônus das próprias etapas, e a de cima só fecha depois das de dentro (#92)."},
        {"ic": "tower", "t": "Entrar pela Torre Trick", "d": "O convite agora se cola na própria aba Torre Trick, tanto no primeiro grupo quanto em outro depois, pelo + entrar em outro grupo (#84)."},
        {"ic": "antenna", "t": "Mudar o grupo de computador", "d": "Quem é o servidor do grupo pode levá-lo para outra máquina: baixe a cópia, restaure no computador novo e avise os membros. O jogo de cada um troca de endereço sozinho, sem perder nenhum dia (#91)."},
        {"ic": "bug", "t": "Contribuição paga no beta", "d": "Bug corrigido ou ideia feita rende assim que entra no beta. Para quem desenvolve, a issue em que é o responsável vira tarefa e se conclui sozinha, valendo pelo esforço (#96, #97)."}
      ]},
     {"versao": "0.9.0-beta2", "nome": "atualização da Torre Trick", "data": "2026-10-14",
      "resumo": "A maior atualização do Ganbatte: o modo em grupo chega para todos da beta, com a Torre Trick, a licença hunter e os placares. E também retratos para os chefões, uma coleção que nunca se perde e a Jenny de cada tarefa à vista.",
      "itens": [
        {"ic": "tower", "t": "A Torre Trick", "d": "O modo em grupo chegou. Um amigo vira o servidor, manda um convite, e a aba Torre Trick vira o placar de vocês: cada dia vale até 1 andar descido (o seu XP até o teto do grupo, que é a mediana do mês anterior), cada hábito do grupo cumprido vale 0,2, e superar a sua própria média rende andares extras quando o período fecha. Ninguém vê o XP nem as tarefas de ninguém: do seu computador só saem os andares e se você jogou no dia (#38, #42, #67)."},
        {"ic": "card", "t": "Licença hunter", "d": "Cada jogador tem a sua licença, que vira com um clique: na frente, a posição e os andares; no verso, a posição em cada placar e a superação em curso. Clique no nome de alguém para abrir a licença da pessoa (#67)."},
        {"ic": "crown", "t": "Placares e evolução", "d": "Além do placar geral com pódio, cada hábito do grupo, o Codeforces e a superação ganham placar próprio, com quem lidera cada um. A sua posição semana a semana aparece num gráfico, com o líder em dourado (#42, #67)."},
        {"ic": "scroll", "t": "Frase do líder", "d": "Quem liderar a semana escreve a frase que fica no topo do placar até a próxima semana fechar. Uma vez só, até 80 letras: escolha bem (#76)."},
        {"ic": "flame", "t": "Hábitos do grupo", "d": "Os admins montam a lista em Torre Trick → administrar. O Codeforces vem sozinho; os outros (Digitação, Duolingo...) cada um liga a um hábito seu em Configurações → grupo, e o grupo vê só se você cumpriu no dia (#41)."},
        {"ic": "antenna", "t": "Convite e servidor em casa", "d": "Sem conta e sem senha: o admin gera um link de uso único e você cola em Configurações → grupo. Quem cria o grupo liga o servidor no próprio computador, aberto pela internet com o Tailscale Funnel (grátis). Sem internet, a aba mostra o último placar e o seu jogo segue igual (#38, #39, #40)."}
      ]},
     {"versao": "0.9.0-beta1", "nome": "atualização do grupo", "data": "2026-10-14",
      "resumo": "Primeiro teste do modo em grupo: um amigo vira o servidor, manda um convite, e a aba Grupo mostra quem jogou em cada dia. Por enquanto são só fatos; os pontos da Torre Trick entram depois, calibrados com o uso de vocês.",
      "itens": [
        {"ic": "tower", "t": "Aba Grupo", "d": "Um placar entre amigos com quem jogou em cada dia, a sequência de dias seguidos, o Codeforces e o Duolingo das últimas cinco semanas e quando cada um sincronizou. O seu XP e as suas tarefas não aparecem: o grupo vê só se você jogou no dia (#38, #40)."},
        {"ic": "scroll", "t": "Convite por link", "d": "Sem conta e sem senha: o admin do grupo gera um link de uso único (vale 7 dias), e você cola em Configurações → grupo. Dá para estar em mais de um grupo, sair quando quiser e, se trocar de computador, pedir um reconvite que volta com o seu histórico (#39)."},
        {"ic": "antenna", "t": "Seu computador como servidor", "d": "Em Configurações → grupo → criar um grupo, o jogo liga o servidor do grupo e tenta abrir o acesso pela internet com o Tailscale Funnel (grátis). Os admins convidam, cancelam convites e cuidam dos membros e das datas da temporada na aba Grupo → administrar (#38)."},
        {"ic": "esp", "t": "Funciona offline", "d": "Sem internet, ou com o servidor do grupo desligado, a aba mostra o último placar recebido e o seu jogo segue igual. O que você fizer nesse tempo vai junto na próxima vez que o jogo conseguir falar com o servidor (#40)."}
      ]},
     {"versao": "0.7.1-beta1", "nome": "atualização do Ganbatte", "data": "2026-10-14",
      "resumo": "Retratos para os chefões, uma aba Comprados na loja e tudo o que você compra guardado para sempre, numa pasta só sua.",
      "itens": [
        {"ic": "spider", "t": "Retratos dos chefões", "d": "15 retratos na Loja, em Aparência, para pôr no lugar do ícone de cada chefão. O retrato vai sozinho para o chefão de mesmo nome, e em Comprados dá para trocar. O card de chefões da Lista também ganhou o ícone. Ideia de #33."},
        {"ic": "crown", "t": "Derrotou, ganhou", "d": "Derrote o chefão que está com um retrato e ele vira foto de perfil, de graça. Depois da derrota, a imagem desse chefão fica para sempre, mesmo que uma nota corrigida o traga de volta. Cada retrato fica em um chefão por vez."},
        {"ic": "bag", "t": "Aba Comprados", "d": "O que é seu sai da vitrine e fica numa aba própria da Loja, junto com o que vem com o jogo (o emblema, a paleta Simples e as fotos grátis)."},
        {"ic": "scroll", "t": "Coleção permanente", "d": "Tudo o que você compra fica guardado na pasta colecao/ dos seus dados, separado da loja: trocar de temporada ou atualizar o jogo não tira nada. O que você já tinha vai para lá sozinho na primeira vez que abrir esta versão."}
      ]}
   ]},
  {"versao": "0.7", "nome": "atualização do Ganbatte", "data": "2026-10-13", "visual": true,
   "cap": "nova série · o Hunter.todo agora é Ganbatte",
   "resumo": "Ganbatte: força, vai lá, você consegue. O jogo ganhou nome próprio, um visual novo com a cara do Nen e abas que não mudam quando o tema mudar. As suas tarefas, o seu XP, a sua Jenny e tudo o que você comprou continuam exatamente iguais.",
   "itens": [
     {"ic": "crown", "t": "Agora é Ganbatte", "d": "O Hunter.todo cresceu e ganhou nome próprio. Hunter x Hunter continua sendo o tema desta temporada, com a Arena Celestial, o Genei Ryodan e a Masadora; a próxima temporada pode ter outro anime, e o nome do jogo fica (#15)."},
     {"ic": "esp", "t": "Visual Nen", "d": "Linhas finas, cantos quase retos, hexágonos nos marcadores e na caixa de concluir, o selo 念 ao lado do nome e a marca nova na aba do navegador. A sua paleta, moldura, fundo e fonte continuam valendo. Gostava mais do de antes? Ele não foi embora: escolha clássico logo abaixo ou em Configurações → configurações deste computador → visual."},
     {"ic": "scroll", "t": "Abas com nome fixo", "d": "O menu usa nomes que valem para qualquer temporada: Progresso, Chefões, Projetos, Calendário, Conquistas, Loja e Grupo. O nome do tema (Arena Celestial, Expedições, Semestre, Book, Masadora, Torre Trick) aparece ao passar o mouse e continua dentro de cada aba."},
     {"ic": "alvo", "t": "Caçadas com prazo", "d": "A caçada inteira pode ter um prazo, que aparece na Lista, nos marcos e no cronograma. E uma tarefa comum vira caçada pelo editor (✎): ela vira a primeira etapa e o resto entra com + etapa (#54, #35)."},
     {"ic": "coin", "t": "Cofre do mês opcional", "d": "O cofre do mês vem desligado: o R$ dos prêmios reais vira só um lembrete. Quem usa continua com ele; para ligar, Configurações → cofre do mês (#34)."},
     {"ic": "antenna", "t": "Endereços novos", "d": "O jogo mora em github.com/CaioParanaiba/ganbatte e a demonstração em caioparanaiba.github.io/ganbatte. Os seus dados passam sozinhos para a pasta ~/.ganbatte, e o jogo continua atualizando por aqui como sempre."}
   ],
   "obrigado": {"t": "Obrigado a quem jogou junto",
    "d": "O Ganbatte começou como a lista de tarefas de uma pessoa só. Virou jogo porque amigos testaram, acharam bugs, tiraram dúvidas e pediram coisas, e quase tudo desta série nasceu de uma conversa assim. Valeu demais.",
    "quem": [
      {"n": "luy121314", "o": "14 ideias e bugs: o Duolingo no jogo, caçadas por etapas, pontos para quem contribui, prazo da caçada, tarefa vira caçada e o cofre opcional"},
      {"n": "Caduyz", "o": "a prévia das paletas na loja e a ficha do Mundo Pixel"},
      {"n": "", "o": "quem perguntou, testou e opinou fora do GitHub, inclusive a ideia dos nomes fixos das abas"}
    ]},
   "versoes": [
     {"versao": "0.6.6-beta3", "nome": "atualização das expedições", "data": "2026-10-13",
      "resumo": "Visual novo, mais seco e com a cara do Nen, e a marca do Ganbatte. O visual de antes continua em Configurações.",
      "itens": [
        {"ic": "esp", "t": "Visual Nen", "d": "Linhas finas, cantos quase retos, hexágonos nos marcadores e na caixa de concluir, abas com um traço embaixo e o selo 念 ao lado do nome. Sem brilho nem degradê: efeito fica para a loja. A sua paleta, moldura, fundo e fonte continuam valendo. Prefere o de antes? Configurações → configurações deste computador → visual: clássico."},
        {"ic": "crown", "t": "Marca do Ganbatte", "d": "O hexágono com H×H no cabeçalho, na aba do navegador e no assistente. A sua foto de perfil não muda."},
        {"ic": "scroll", "t": "XP alinhado na Lista", "d": "O XP de cada tarefa fica sempre na ponta da linha; antes ele andava conforme os botões de prioridade que a tarefa tinha. No modo demonstração, a aba Projetos não abre mais vazia."}
      ]},
     {"versao": "0.6.6-beta2", "nome": "atualização das expedições", "data": "2026-10-13",
      "resumo": "O jogo agora se chama Ganbatte, e as abas ganharam nomes fixos que não mudam quando o tema da temporada mudar.",
      "itens": [
        {"ic": "crown", "t": "Ganbatte", "d": "O Hunter.todo virou Ganbatte. Hunter x Hunter continua sendo o tema desta temporada: a próxima pode ter outro, e o nome do jogo fica. Nada do seu jogo muda: tarefas, XP, Jenny e compras continuam iguais (#15)."},
        {"ic": "scroll", "t": "Abas com nome fixo", "d": "O menu usa nomes que valem para qualquer temporada: Progresso (Arena Celestial), Projetos (Expedições), Calendário (Semestre), Conquistas (Book), Loja (Masadora) e Grupo (Torre Trick). O nome do tema aparece ao passar o mouse e continua dentro de cada aba."},
        {"ic": "esp", "t": "Pasta de dados nova", "d": "Os seus dados passam de ~/.hunter-todo para ~/.ganbatte, sozinhos, na primeira vez que o jogo abre. No Linux e no Mac fica um atalho no lugar da pasta antiga. O início automático também troca de nome sem você precisar fazer nada."}
      ]},
     {"versao": "0.6.6-beta1", "nome": "atualização das expedições", "data": "2026-10-13",
      "resumo": "A caçada inteira pode ter um prazo, uma tarefa comum vira caçada pelo editor e o cofre do mês agora é opcional.",
      "itens": [
        {"ic": "alvo", "t": "Prazo da caçada", "d": "Ao criar ou editar uma caçada, dá para escolher um prazo para ela toda. Ele aparece na Lista, nos marcos e no cronograma das Expedições, fica vermelho quando vence com etapas abertas e avisa quando alguma etapa tem prazo depois dele. Uma caçada com prazo próximo sobe na Lista. É só para organizar: o XP continua pelo prazo de cada etapa. Ideia de luy121314 (#54)."},
        {"ic": "alvo", "t": "Tarefa vira caçada", "d": "No editor da tarefa (✎), o campo caçada põe a tarefa numa caçada aberta, tira ela de uma, ou cria uma caçada nova com a própria tarefa como primeira etapa: depois é só adicionar as outras com + etapa. Ideia de luy121314 (#35)."},
        {"ic": "coin", "t": "Cofre do mês opcional", "d": "O cofre do mês agora vem desligado: a Masadora fica sem o card dele, e o R$ dos prêmios reais é só um lembrete, sem travar o resgate. Para usar, ligue em Configurações → cofre do mês, onde também fica o valor por mês. Quem já tinha gastado do cofre continua com ele ligado. Ideia de luy121314 (#34)."}
      ]}
   ]},
  {"versao": "0.6.5", "nome": "atualização das expedições", "data": "2026-10-13", "aviso": "0.6.5",
   "resumo": "Correções da 0.6.4: a loja volta a salvar, o nível do Duolingo segue a sua ofensiva, os hábitos não perdem mais o histórico e as compras feitas com a Jenny que o rebalanceamento tirou voltam para a loja.",
   "itens": [
     {"ic": "bug", "t": "A loja volta a salvar", "d": "Na 0.6.4, o jogo não conseguia guardar a carteira: compras, o que você equipou e o tour se perdiam ao recarregar a página. Agora fica tudo salvo. As caçadas que você recolhe na Lista também ficam recolhidas."},
     {"ic": "scroll", "t": "Nível do Duolingo pela ofensiva", "d": "Os dias da sua ofensiva de antes de ligar o Duolingo, até os de antes da temporada, agora sobem o nível do hábito. Quem tem uma ofensiva longa já começa num nível alto e ganha o XP dele daqui para frente; os dias passados continuam sem XP e sem Jenny."},
     {"ic": "tower", "t": "Renomear um hábito", "d": "Salvar Configurações às vezes trocava o código interno dos hábitos, e o hábito voltava ao nível 1 sem o histórico. Agora mudar o nome não zera mais nada, e quem já tinha perdido o histórico assim o recupera sozinho ao abrir o jogo. Para começar um hábito do zero, remova o antigo e adicione um novo."},
     {"ic": "coin", "t": "Compras do dia do rebalanceamento", "d": "Na 0.6.4, quem tinha gastado mais do que ficou depois do rebalanceamento teve a carteira parada no zero. O que essa pessoa comprou em 13/10 (aparências e feitiços ainda na bolsa) volta para a loja, e a carteira recebe só a parte que foi paga com Jenny ganha jogando. Prêmios reais e feitiços já usados ficam. Para quem não estava nesse caso, nada muda."}
   ],
   "janela": {"de": "0.6.4", "resumo": "A 0.6.4 rebalanceou os pontos e a 0.6.5 corrige o que ela deixou quebrado. Se você pulou alguma das duas, este é o resumo do que mudou no seu jogo.",
    "itens": [
     {"ic": "coin", "t": "Rebalanceamento (0.6.4)", "d": "As contribuições valem menos (bug: +15 XP e +150 J; ideia: +10 XP e +50 J) e os dias do Duolingo de antes de ligar não dão XP nem Jenny. Isso foi recalculado também para o que já tinha entrado, por isso a torre e a carteira podem ter caído. O que você comprou continua seu."},
     {"ic": "tower", "t": "Nível dos hábitos (0.6.4)", "d": "Cada hábito tem o próprio nível, de 1 a 10, valendo de 3 a 12 XP. Sobe com os dias seguidos e cai um nível a cada dia perdido, sem zerar."},
     {"ic": "flame", "t": "O Ten pede uma tarefa (0.6.4)", "d": "Um dia só acende o Ten com pelo menos uma tarefa que não seja hábito. O seu recorde e as conquistas do Ten que você já tinha ficam."},
     {"ic": "bug", "t": "A loja volta a salvar (0.6.5)", "d": "Na 0.6.4, compras, o que você equipou e o tour se perdiam ao recarregar a página. Agora fica tudo salvo."},
     {"ic": "scroll", "t": "Duolingo e hábitos (0.6.5)", "d": "A sua ofensiva inteira do Duolingo, até a de antes de ligar, sobe o nível do hábito (sem XP pelos dias passados). Hábitos que voltaram ao nível 1 depois de salvar Configurações recuperam o histórico sozinhos, e renomear não zera mais nada."},
     {"ic": "coin", "t": "Compras do dia do rebalanceamento (0.6.5)", "d": "Quem gastou em 13/10 a Jenny que o rebalanceamento tirou recebe de volta só a parte paga com Jenny ganha jogando; as aparências e os feitiços na bolsa comprados nesse dia voltam para a loja. Para quem não estava nesse caso, nada muda."},
     {"ic": "antenna", "t": "Também na 0.6.4", "d": "Temporada guardada no fim das aulas, Book e Regras reorganizados, e em Configurações → servidor a escolha entre as versões Estável, Beta e Grupo. Tudo na aba Novidades."}
    ]},
   "versoes": [
     {"versao": "0.6.5-beta1", "nome": "atualização das expedições", "data": "2026-10-13", "aviso": "0.6.5",
      "resumo": "O nível do Duolingo segue a sua ofensiva inteira, e o que foi comprado com a Jenny que o rebalanceamento tirou volta para a loja.",
      "itens": [
        {"ic": "bug", "t": "A loja volta a salvar", "d": "Na 0.6.4, o jogo não conseguia guardar a carteira: compras, o que você equipou e o tour se perdiam ao recarregar a página. Agora fica tudo salvo. As caçadas que você recolhe na Lista também ficam recolhidas."},
        {"ic": "scroll", "t": "Nível do Duolingo pela ofensiva", "d": "Os dias da sua ofensiva de antes de ligar o Duolingo, até os de antes da temporada, agora sobem o nível do hábito. Quem tem uma ofensiva longa já começa num nível alto e ganha o XP dele daqui para frente; os dias passados continuam sem XP e sem Jenny."},
        {"ic": "tower", "t": "Renomear um hábito", "d": "Salvar Configurações às vezes trocava o código interno dos hábitos, e o hábito voltava ao nível 1 sem o histórico. Agora mudar o nome não zera mais nada, e quem já tinha perdido o histórico assim o recupera sozinho ao abrir o jogo. Para começar um hábito do zero, remova o antigo e adicione um novo."},
        {"ic": "coin", "t": "Compras do dia do rebalanceamento", "d": "Na 0.6.4, quem tinha gastado mais do que ficou depois do rebalanceamento teve a carteira parada no zero. O que essa pessoa comprou em 13/10 (aparências e feitiços ainda na bolsa) volta para a loja, e a carteira recebe só a parte que foi paga com Jenny ganha jogando. Prêmios reais e feitiços já usados ficam. Para quem não estava nesse caso, nada muda."}
      ]}
   ]},
  {"versao": "0.6.4", "nome": "atualização das expedições", "data": "2026-10-13", "aviso": "0.6.4",
   "resumo": "Rebalanceamento (o seu XP e a sua Jenny podem ter diminuído), hábitos com nível, temporada guardada, Book e Regras reorganizados e a preparação do modo em grupo.",
   "itens": [
     {"ic": "coin", "t": "Por que os números mudaram", "d": "Os relatórios de balanceamento mostraram duas fontes dando muito mais que jogar: as contribuições (um bug valia 1.500 J, quase uma semana de jogo) e os dias do Duolingo de antes de ligar, que entravam todos de uma vez com XP e Ten. Elas foram recalculadas para todo mundo, inclusive para o que já tinha entrado: por isso a torre e a carteira podem ter caído. O que você comprou continua seu, e a carteira nunca fica negativa."},
     {"ic": "bug", "t": "Contribuições", "d": "Bug corrigido: +15 XP e +150 J (antes +50 XP e +1.000 J). Ideia feita: +10 XP e +50 J (antes +30 XP e +600 J)."},
     {"ic": "scroll", "t": "Duolingo de antes de ligar", "d": "Os dias da ofensiva de antes de você ligar o Duolingo continuam no heatmap e nas conquistas, mas não dão XP, Jenny nem Ten."},
     {"ic": "flame", "t": "O Ten pede uma tarefa", "d": "Um dia só acende o Ten com pelo menos uma tarefa que não seja hábito. O recorde e as conquistas do Ten que você já tinha ficam."},
     {"ic": "tower", "t": "Nível dos hábitos", "d": "Cada hábito tem o próprio nível, de 1 a 10: começa valendo 3 XP e sobe com os dias seguidos. Falhar um dia cai um nível, sem zerar. A carta Zetsu salva hoje ou ontem, o Ten ou um hábito."},
     {"ic": "card", "t": "Nota pela parte da nota final", "d": "O bônus de cada nota segue o peso da avaliação na nota final da disciplina."},
     {"ic": "scroll", "t": "Temporada guardada", "d": "Quando a temporada acaba, na volta às aulas, o jogo guarda sozinho os números dela, congelados, na pasta temporadas/ dos seus dados."},
     {"ic": "card", "t": "Book e Regras", "d": "Book → Conquistas sem casas vazias, três cartas por hábito e 10 vagas para os desafios da IA. A aba Regras explica com tabelas e contas quanto vale cada coisa, e a lateral da Lista abre e fecha."},
     {"ic": "antenna", "t": "Escolha a versão e resumo para o grupo", "d": "Em Configurações → servidor, Versão escolhe entre Estável, Beta e Grupo. Em Configurações → balanceamento, exporte o resumo para o grupo (XP do dia, Codeforces, Duolingo e missão, sem tarefas) e mande ao host para calibrar a Torre Trick."}
   ],
   "versoes": [
     {"versao": "0.6.4-beta5", "nome": "atualização das expedições", "data": "2026-10-13",
      "resumo": "Preparação para o modo em grupo: escolha de versão (estável, beta ou grupo) e o resumo para o grupo.",
      "itens": [
        {"ic": "antenna", "t": "Escolha a versão", "d": "Em Configurações → servidor, Versão escolhe entre Estável (a normal), Beta (as novidades antes) e Grupo (o modo em grupo em construção, para quem testa com os amigos). O aviso de versão nova segue a escolhida. Só no jogo instalado com git."},
        {"ic": "tower", "t": "Resumo para o grupo", "d": "Em Configurações → balanceamento, exporte o que o modo em grupo vai enviar: o XP de cada dia, o Codeforces e o Duolingo (se ligados) e os dias da missão da semana. Nada de tarefas, disciplinas nem dos seus outros hábitos. Mande ao host do grupo para calibrar a Torre Trick antes de o servidor existir."}
      ]},
     {"versao": "0.6.4-beta4", "nome": "atualização das expedições", "data": "2026-10-13",
      "resumo": "Regras reescritas, com o XP de cada coisa e as contas, e a lateral da Lista que abre e fecha.",
      "itens": [
        {"ic": "crown", "t": "Regras novas", "d": "A aba Regras explica, com tabelas e contas de exemplo, quanto vale cada tarefa, os multiplicadores, o nível dos hábitos, o Ten, a torre, a Jenny, os chefões e os feitiços. Os números vêm do próprio jogo, e o topo mostra os seus. A aba agora fica no fim do menu, depois de Novidades."},
        {"ic": "scroll", "t": "Lateral da Lista", "d": "Cada card ao lado da Lista (quanto vale, rende mais agora, chefões, expedições e hábitos de hoje) abre e fecha pelo título, e o jogo lembra o que você deixou aberto."}
      ]},
     {"versao": "0.6.4-beta3", "nome": "atualização das expedições", "data": "2026-10-13",
      "resumo": "O Book reorganizado: a coleção sem casas vazias, três cartas para cada hábito e 10 vagas para os desafios da IA.",
      "itens": [
        {"ic": "card", "t": "Coleção de conquistas", "d": "Book → Conquistas mostra só as cartas do seu jogo, sem casas vazias: primeiro as conquistadas, depois as que faltam. Cada hábito ganha três cartas, pelo nível (3, 6 e 10), e o Ten ganha a de 60 dias. Os desafios da IA que você resgata entram aqui."},
        {"ic": "crown", "t": "10 desafios da IA", "d": "A aba Desafios da IA tem 10 vagas: 4 fáceis, 3 médias, 2 difíceis e 1 lendária. O pedido diz à IA quantos de cada dificuldade faltam. Resgatado, o desafio vai para a coleção e a vaga abre para outro."}
      ]},
     {"versao": "0.6.4-beta2", "nome": "atualização das expedições", "data": "2026-10-13", "aviso": "0.6.4",
      "resumo": "Rebalanceamento: o seu XP e a sua Jenny podem ter diminuído. Hábitos ganham nível, o Ten passa a pedir uma tarefa de verdade, e as contribuições e o Duolingo de antes de ligar valem menos.",
      "itens": [
        {"ic": "coin", "t": "Por que os números mudaram", "d": "Os relatórios de balanceamento mostraram duas fontes dando muito mais que jogar: as contribuições (um bug valia 1.500 J, quase uma semana de jogo) e os dias do Duolingo de antes de ligar, que entravam todos de uma vez com XP e Ten. Elas foram recalculadas para todo mundo, inclusive para o que já tinha entrado: por isso a torre e a carteira podem ter caído. O que você comprou continua seu, e a carteira nunca fica negativa."},
        {"ic": "bug", "t": "Contribuições", "d": "Bug corrigido: +15 XP e +150 J (antes +50 XP e +1.000 J). Ideia feita: +10 XP e +50 J (antes +30 XP e +600 J). Com a Jenny do próprio XP, um bug vale 300 J e uma ideia, 150 J."},
        {"ic": "scroll", "t": "Duolingo de antes de ligar", "d": "Os dias da ofensiva de antes de você ligar o Duolingo continuam no heatmap e nas conquistas do Duolingo, mas não dão XP, Jenny nem Ten. Do dia em que ligou em diante, conta normal."},
        {"ic": "flame", "t": "O Ten pede uma tarefa", "d": "Um dia só acende o Ten com pelo menos uma tarefa que não seja hábito. Vale para a temporada inteira, então o seu Ten atual pode ter mudado; o recorde e as conquistas do Ten que você já tinha ficam."},
        {"ic": "tower", "t": "Nível dos hábitos", "d": "Cada hábito tem o próprio nível, de 1 a 10: começa valendo 3 XP e sobe 1 XP por nível (até 12). Do 1 ao 6, sobe a cada 7 dias seguidos; depois cada nível pede uma semana a mais. Falhar um dia cai um nível, sem zerar. O nível e o XP de cada hábito aparecem ao lado do heatmap, na Lista."},
        {"ic": "moon", "t": "Carta Zetsu", "d": "A carta agora salva hoje ou ontem, e você escolhe o quê: o Ten ou um hábito (que não cai de nível). Ontem só aparece quando de fato quebrou. As folgas automáticas do Ten continuam iguais."},
        {"ic": "card", "t": "Nota pela parte da nota final", "d": "O bônus de cada nota segue o peso da avaliação na nota final da disciplina, mesmo que o plano esteja em outra escala: um 10 numa prova de 10% vale menos que um 6 numa de 50%."}
      ]},
     {"versao": "0.6.4-beta1", "nome": "atualização das expedições", "data": "2026-10-13",
      "resumo": "A temporada que acaba fica guardada, com os números finais congelados.",
      "itens": [
        {"ic": "scroll", "t": "Temporada guardada", "d": "Quando a temporada acaba, na volta às aulas, o jogo guarda sozinho os números dela (XP, andar, Ten, Jenny, chefões, cartas e compras) na pasta temporadas/ dos seus dados. Eles ficam congelados: nenhuma mudança do jogo nem um tema novo mexe neles depois. Também guarda antes de você trocar o semestre no assistente, e em Configurações → temporada dá para guardar uma foto antes do fim. A tela para ver as temporadas antigas vem depois."}
      ]}
   ]},
  {"versao": "0.6.3", "nome": "atualização das expedições", "data": "2026-10-13",
   "resumo": "Férias de verdade, recompensa por bug corrigido e ideia feita, e um relatório dos seus números de XP e Jenny.",
   "itens": [
     {"ic": "moon", "t": "Férias", "d": "Do fim das aulas até a volta, dia vazio não derruba o Ten (e dia feito ainda soma), a missão da semana e a fúria dos chefões ficam pausadas, e o XP continua subindo a torre. A temporada só fecha na volta às aulas."},
     {"ic": "bug", "t": "Recompensa por contribuição", "d": "Ponha o seu usuário do GitHub em Configurações: bug que você reportou e foi corrigido vale +50 XP e +1.000 J; ideia que entrou no jogo, +30 XP e +600 J. Só conta quando a issue é fechada como resolvida."},
     {"ic": "coin", "t": "Relatório de balanceamento", "d": "Em Configurações, ao lado do backup: quanto XP você faz, de onde ele vem, quanto da Jenny fica parada e quanto da loja a temporada compra. Baixe em .json ou .csv (sem o texto das tarefas) e, se quiser ajudar a calibrar o jogo, anexe numa issue. As compras da Masadora passam a ser registradas com o dia."},
     {"ic": "card", "t": "Reabrir etapa antiga", "d": "Na aba Expedições, a etapa feita que já foi para o done.txt agora se reabre pelo ✓, e o XP dela sai do dia em que foi feita."}
   ],
   "versoes": [
     {"versao": "0.6.3-beta2", "nome": "atualização das expedições", "data": "2026-10-13",
      "resumo": "Um relatório dos seus números de XP e Jenny para ajudar a calibrar o jogo, e as compras passam a ser registradas.",
      "itens": [
        {"ic": "coin", "t": "Relatório de balanceamento", "d": "Em Configurações, ao lado do backup: quanto XP você faz por dia e por semana, de onde ele vem (hábitos, estudo, entregas, Codeforces...), quanto da Jenny fica parada e quanto da loja a temporada compra. Baixe o relatório (.json) ou a planilha por dia (.csv). Não leva o texto das tarefas nem o nome dos prêmios: se quiser ajudar a calibrar o XP e a Jenny, anexe numa issue."},
        {"ic": "scroll", "t": "Registro de compras", "d": "Cada compra na Masadora (aparência, feitiço ou prêmio real) fica guardada com o dia, para o relatório mostrar quando a Jenny sai. O que você gastou antes desta versão aparece como gasto sem data."},
        {"ic": "tower", "t": "Simulador", "d": "Para quem desenvolve: node ferramentas/simulador.mjs joga uma temporada com três jogadores inventados (leve, médio e pesado) e mostra andar, Jenny e quanto da loja cada um compra. Com --comparar relatorio.json, põe um jogador de verdade ao lado."}
      ]},
     {"versao": "0.6.3-beta1", "nome": "atualização das expedições", "data": "2026-10-12",
      "resumo": "Férias de verdade, recompensa por bug corrigido e ideia feita, e etapa antiga que se reabre.",
      "itens": [
        {"ic": "moon", "t": "Férias", "d": "Do fim das aulas até a volta, dia vazio não derruba o Ten (e dia feito ainda soma), a missão da semana e a fúria dos chefões ficam pausadas, e o XP continua subindo a torre. A temporada só fecha na volta às aulas; a projeção do andar e as médias vão até o fim das aulas."},
        {"ic": "bug", "t": "Recompensa por contribuição", "d": "Ponha o seu usuário do GitHub em Configurações: bug que você reportou e foi corrigido vale +50 XP e +1.000 J; ideia que entrou no jogo, +30 XP e +600 J. Só conta quando a issue é fechada como resolvida: repetida ou recusada não rende nada."},
        {"ic": "card", "t": "Reabrir etapa antiga", "d": "Na aba Expedições, a etapa feita que já foi para o done.txt agora se reabre pelo ✓, e o XP dela sai do dia em que foi feita."},
        {"ic": "tower", "t": "Testes do servidor", "d": "Para quem desenvolve: python3 -m unittest discover tests confere a virada do dia, os hábitos, o Codeforces, o Duolingo e as rotas principais."}
      ]}
   ]},
  {"versao": "0.6.2", "nome": "atualização das expedições", "data": "2026-10-12",
   "resumo": "O Duolingo conta sozinho, como o Codeforces, e os heatmaps mostram a temporada inteira.",
   "itens": [
     {"ic": "scroll", "t": "Duolingo automático", "d": "Em Configurações, ligue o Duolingo só com o seu usuário, sem senha. O jogo lê a ofensiva do seu perfil e marca sozinho o hábito no dia em que você faz a lição (+5 XP, conta para o Ten), com heatmap e duas conquistas. Ao ligar, os dias da ofensiva atual desde o início da temporada já entram. O dia salvo pelo bloqueio de ofensiva não conta: aqui, a folga é o Zetsu."},
     {"ic": "flame", "t": "Constância da temporada", "d": "Os heatmaps da Lista vão do primeiro ao último dia da temporada, com as férias no fim, e ao lado mostram quanto você cumpre em cada dia da semana."},
     {"ic": "coin", "t": "Provar antes de comprar", "d": "Na Masadora, prove paletas, temas, fundos, efeitos, molduras e fontes no jogo todo. Enquanto prova, o jogo fica travado; a faixa no topo volta ao que é seu."},
     {"ic": "bag", "t": "Fotos de perfil para todos", "d": "As fotos da Masadora vêm com o jogo, e as novas chegam com as atualizações."},
     {"ic": "tra", "t": "Semestre e Codeforces pela temporada", "d": "A aba Semestre mostra os meses da sua temporada, e o Codeforces lê todos os seus envios desde o início dela."}
   ],
   "versoes": [
     {"versao": "0.6.2-beta5", "nome": "atualização das expedições", "data": "2026-10-12",
      "resumo": "As fotos de perfil agora vêm com o jogo.",
      "itens": [
        {"ic": "bag", "t": "Fotos de perfil para todos", "d": "Gon, Killua, Kurapika, Leorio e o logo do Hunter x Hunter estão na Masadora de todo mundo, sem precisar copiar arquivo nenhum. Fotos novas chegam com as atualizações; a pasta avatares/ dos seus dados não é mais usada."}
      ]},
     {"versao": "0.6.2-beta4", "nome": "atualização das expedições", "data": "2026-10-12",
      "resumo": "Ao lado de cada heatmap, como você vai em cada dia da semana; e as férias aparecem no fim da grade.",
      "itens": [
        {"ic": "flame", "t": "Resumo da constância", "d": "À direita de cada heatmap da Lista, uma barra por dia da semana mostra quanto você cumpre em cada um (o mais fraco em destaque), com o número da temporada: % de dias com o Ten, % dos hábitos, semanas na meta, problemas do Codeforces. Em tela estreita, só o heatmap."},
        {"ic": "scroll", "t": "Férias no heatmap", "d": "A grade vai até a volta às aulas, com as férias em verde tracejado, como no Semestre. Dia de férias sem nada não é falha, e as médias contam só o semestre."}
      ]},
     {"versao": "0.6.2-beta3", "nome": "atualização das expedições", "data": "2026-10-12",
      "resumo": "Os heatmaps da Lista mostram a sua temporada inteira.",
      "itens": [
        {"ic": "flame", "t": "Constância da temporada", "d": "Os heatmaps da Lista vão do primeiro ao último dia da temporada, e não mais as últimas 20 semanas: nada de antes dela aparece, e os dias que ainda vêm ficam tracejados. Os quadradinhos crescem para ocupar a largura do bloco."}
      ]},
     {"versao": "0.6.2-beta2", "nome": "atualização das expedições", "data": "2026-10-12",
      "resumo": "Prove qualquer aparência antes de comprar (o jogo trava enquanto isso), e o Semestre segue a temporada.",
      "itens": [
        {"ic": "coin", "t": "Provar mais coisas", "d": "Além das paletas, dá para provar temas, fundos, efeitos, molduras e fontes. Enquanto prova, o jogo fica travado: dá para andar pelas abas e olhar, mas não concluir, criar nem editar nada. A faixa no topo volta ao que é seu."},
        {"ic": "scroll", "t": "Calendário da temporada", "d": "A aba Semestre mostra os meses da sua temporada (do início até a volta às aulas), e não mais agosto a fevereiro fixos."},
        {"ic": "tra", "t": "Codeforces sem perder dias", "d": "Para quem passa de 10 mil envios na temporada, os dias mais antigos ficam como estavam em vez de sumir."}
      ]},
     {"versao": "0.6.2-beta1", "nome": "atualização das expedições", "data": "2026-10-12",
      "resumo": "Prove uma paleta antes de comprar, e o Codeforces conta só a temporada.",
      "itens": [
        {"ic": "coin", "t": "Provar paleta", "d": "Na Masadora, o botão provar pinta o jogo todo com a paleta (ou a do tema completo) sem comprar nada. Ande pelas abas para ver como fica; a faixa no topo volta para a sua."},
        {"ic": "tra", "t": "Codeforces da temporada", "d": "O jogo lê os seus envios só desde o início da temporada, todos eles, e não mais os 2000 últimos. O que você fez antes não entra no heatmap (e já não dava XP)."}
      ]}
   ]},
  {"versao": "0.6.1", "nome": "atualização das expedições", "data": "2026-10-12",
   "resumo": "A janela com as novidades da 0.6 agora aparece depois de atualizar.",
   "itens": [
     {"ic": "antenna", "t": "Janela da 0.6", "d": "Quem atualizava pela aba Novidades não via a janela com os destaques da 0.6: a página voltava nessa aba e ela já contava como vista. Agora a janela aparece uma vez, também para quem já estava na 0.6."}
   ]},
  {"versao": "0.6", "nome": "atualização das expedições", "data": "2026-10-12",
   "resumo": "Tarefas simples na Lista, projetos grandes nas Expedições. A maior atualização desde a 0.5: caçadas, uma aba nova para projetos longos, editar tarefa por completo e 40 itens novos na Masadora.",
   "itens": [
     {"ic": "island", "t": "Expedições", "d": "Uma aba nova para projetos que duram semanas ou meses, fora das disciplinas: TCC, um app seu, iniciação científica. Cada marco é uma caçada; fechar um marco dá bônus por etapa e por dia trabalhado, e concluir a expedição paga cada semana ativa. Dá para ver de cinco jeitos (cards, trilha, quadro, foco e cronograma), e a aba tem tutorial."},
     {"ic": "card", "t": "Caçadas", "d": "Uma tarefa grande vira uma caçada: as etapas ficam juntas na Lista, com uma barra de quantas faltam, e cada uma vale o XP normal. Crie em detalhes → caçada, ou aperte C e escreva uma etapa por linha."},
     {"ic": "coin", "t": "40 itens novos na Masadora", "d": "Efeitos na hora da conquista (Godspeed, Cartas do Hisoka, Jajanken, fogos no andar novo), sons, fontes, seis paletas, texturas, molduras, títulos e quatro temas completos, entre eles a Ascensão, o lendário de 25.000 J."},
     {"ic": "scroll", "t": "Editar tarefa por completo", "d": "O ✎ abre os detalhes da tarefa já preenchidos: texto, tipo, disciplina, prazo e prioridade, mostrando quanto ela passa a valer. O que fica escondido na linha (avaliação, caçada, rotina) não se perde."},
     {"ic": "tower", "t": "Lista mais limpa", "d": "O campo de tarefa nova mostra só o texto e quanto vale; o resto fica em detalhes. A tecla N abre o formulário de qualquer aba, o topo virou um bloco só e o quanto vale fica recolhido na lateral."},
     {"ic": "antenna", "t": "Versões de teste", "d": "Em Configurações → servidor, receba as novidades antes, ainda em teste (beta). E o botão de atualizar não falha mais quando o jogo foi baixado por SSH."},
     {"ic": "spider", "t": "Correções", "d": "O mundo pixel mostra o seu nome, o seu Nen e a sua foto (não mais os de quem fez o jogo); o selo de fúria do chefão não fica escondido; editar uma tarefa não abre outra sozinha."}
   ],
   "versoes": [
     {"versao": "0.5.9-beta2", "nome": "atualização das conquistas", "data": "2026-10-12",
      "resumo": "A aba Expedições ganha tutorial e as cinco formas de ver ficam de vez; o quanto vale da Lista abre só quando você quer.",
      "itens": [
        {"ic": "island", "t": "Expedições: formas de ver", "d": "Cards, trilha, quadro, foco e cronograma deixam de ser teste e ficam todas: é a mesma expedição desenhada de cinco jeitos, escolha em \"ver como\". A aba ganhou o seu ? tutorial, que explica marcos, tarefas soltas, semanas ativas e o bônus de concluir."},
        {"ic": "scroll", "t": "Quanto vale recolhido", "d": "Na lateral da Lista, o quanto vale fica fechado, só com o título. Um clique abre a tabela de sempre."}
      ]},
     {"versao": "0.5.9-beta1", "nome": "atualização das conquistas", "data": "2026-10-12",
      "resumo": "Editar uma tarefa agora muda o tipo, a disciplina, o prazo e a prioridade, não só o texto.",
      "itens": [
        {"ic": "scroll", "t": "Editar tarefa por completo", "d": "O ✎ abre os detalhes da tarefa já preenchidos: texto, tipo (entrega, estudo, treino...), disciplina, prazo e prioridade, com quanto ela passa a valer. Enter salva, Esc cancela. O que fica escondido na linha (avaliação, caçada, rotina) não se perde."}
      ]},
     {"versao": "0.5.8-beta2", "nome": "atualização das conquistas", "data": "2026-10-12",
      "resumo": "Correções: o mundo pixel mostra o seu nome, a fúria do chefão aparece inteira e a edição de tarefa não abre sozinha.",
      "itens": [
        {"ic": "tower", "t": "Mundo pixel com o seu nome", "d": "O mapa, a ficha e a licença do Book mostravam o nome de quem fez o jogo. Agora mostram o seu nome, o seu tipo de Nen mais forte e a sua foto de perfil."},
        {"ic": "spider", "t": "Fúria visível", "d": "No cartão do chefão, o selo de fúria não fica mais embaixo da marca de aprovação da barra de vida."},
        {"ic": "scroll", "t": "Editar tarefa", "d": "Apagar ou adicionar uma tarefa com a edição aberta fazia outra tarefa abrir sozinha para editar. Corrigido, e a edição ganhou um botão cancelar."}
      ]},
     {"versao": "0.5.8-beta1", "nome": "atualização das conquistas", "data": "2026-10-12",
      "resumo": "Caçadas para dividir uma tarefa grande em etapas, a aba Expedições para projetos longos e a Lista mais limpa.",
      "itens": [
        {"ic": "card", "t": "Caçadas", "d": "Uma tarefa grande vira uma caçada: as etapas ficam juntas na Lista, com uma barra de quantas faltam, e cada uma vale o XP normal. Para criar, escolha \"+ nova caçada\" em detalhes, ou aperte C e escreva uma etapa por linha (\"amanhã\" ou uma data no fim da linha vira o prazo)."},
        {"ic": "island", "t": "Expedições", "d": "Uma aba nova para projetos que duram semanas, fora das disciplinas (TCC, app, iniciação científica). Cada marco é uma caçada: fechar um marco dá 5 XP por etapa e 6 por dia diferente em que você trabalhou nele; concluir a expedição dá +10 XP por semana ativa. Na beta dá para trocar entre cinco visões (cards, trilha, quadro, foco e cronograma) e escolher a melhor."},
        {"ic": "scroll", "t": "Lista mais limpa", "d": "O campo de tarefa nova mostra só o texto e quanto ela vale; tipo, disciplina, prazo, prioridade e caçada ficam em detalhes. A tecla N abre o formulário completo de qualquer aba. O topo virou um bloco só, com a missão da semana no canto."},
        {"ic": "antenna", "t": "Versões de teste com nome de teste", "d": "As versões da beta passam a se chamar 0.5.8-beta1, 0.5.8-beta2 e assim por diante. A versão normal recebe tudo de uma vez, como 0.5.8."}
      ]},
     {"versao": "0.5.7", "nome": "atualização das conquistas", "data": "2026-10-11",
      "resumo": "Na versão de teste, a Masadora ganhou um modo teste com Jenny infinita.",
      "itens": [
        {"ic": "coin", "t": "Modo teste (só na beta)", "d": "Na carteira da Masadora, o botão modo teste dá Jenny infinita para experimentar qualquer item. É temporário: nada do que você comprar ou equipar fica guardado, e sair, recarregar a página ou voltar para a versão normal devolve a sua loja como estava. Feitiços e prêmios reais ficam fora."}
      ]},
     {"versao": "0.5.6", "nome": "atualização das conquistas", "data": "2026-10-11",
      "resumo": "Dá para receber as versões novas antes, ainda em teste.",
      "itens": [
        {"ic": "antenna", "t": "Versões de teste", "d": "Em Configurações → servidor, marque Receber versões de teste (beta) para ganhar as novidades antes da versão normal. Podem vir com erros; desmarcar volta para a normal. Só no jogo instalado com git."}
      ]},
     {"versao": "0.5.5", "nome": "atualização das conquistas", "data": "2026-10-11",
      "resumo": "O botão de atualizar não falha mais quando o jogo foi baixado por SSH.",
      "itens": [
        {"ic": "antenna", "t": "Atualizar", "d": "Se o git não consegue usar a sua chave SSH (o jogo liga antes dela), a atualização baixa a versão nova pelo endereço público do GitHub."}
      ]},
     {"versao": "0.5.4", "nome": "atualização das conquistas", "data": "2026-10-11",
      "resumo": "A Masadora ganhou 40 itens novos: animações ao concluir tarefas, sons, fontes e quatro temas completos.",
      "itens": [
        {"ic": "spider", "t": "Na hora da conquista", "d": "Efeitos que disparam ao concluir uma tarefa: Godspeed (um raio que corta a tela), Cartas do Hisoka, Jajanken (PEDRA!) e fogos de artifício no andar novo. O botão ▶ mostra cada um antes de comprar."},
        {"ic": "antenna", "t": "Sons", "d": "Moeda, Golpe, Sino do templo e Fanfarra 8-bit tocam ao concluir uma tarefa e no andar novo. Dá para deixar mudo em Configurações."},
        {"ic": "scroll", "t": "Fontes", "d": "Máquina de escrever, Mangá, Pixel e Arcade japonês mudam a letra dos títulos e dos números."},
        {"ic": "coin", "t": "Mais aparência", "d": "Seis paletas (Pergaminho, Zoldyck, Genei Ryodan, Greed Island, Continente Negro e a Aurora), quatro texturas (teia, colmeia, fliperama, papel), Gyo, Poeira de Nen, Rastro de aura, Terminal vivo, Corrente de Kurapika, três molduras e títulos que só abrem com conquistas."},
        {"ic": "tower", "t": "Temas completos", "d": "Genei Ryodan, Greed Island e Zoldyck, mais baratos que as peças separadas, e Ascensão, o tema lendário de 25.000 J, com uma aurora girando atrás da página inteira."}
      ]}
   ]},
  {"versao": "0.5", "nome": "atualização das conquistas", "data": "2026-10-09",
   "resumo": "A IA passa a criar desafios feitos para você, e o jogo agora avisa quando sai versão nova.",
   "itens": [
     {"ic": "card", "t": "Conquistas criadas pela IA", "d": "No Book, a aba Conquistas da IA pede desafios pensados para o seu ritmo: 10 tarefas de uma matéria no prazo, um hábito em 14 dias seguidos, uma nota alvo. Você aceita os que quiser, e o jogo confere sozinho. Ao conquistar, você escolhe a recompensa: Jenny ou um feitiço."},
     {"ic": "antenna", "t": "Aviso de versão nova", "d": "O jogo confere no GitHub, no máximo a cada 6 horas, se saiu uma versão nova. Quando sai, esta aba avisa, mostra o que muda e tem o botão atualizar agora, que baixa a versão e reinicia o jogo sem mexer nos seus dados."},
     {"ic": "scroll", "t": "Esta aba de novidades", "d": "Cada versão daqui para frente vem explicada aqui, em poucas linhas, com o que muda para você."},
     {"ic": "tower", "t": "Instalador sem git atualiza", "d": "Quem instalou sem git e rodava o comando de instalação de novo recebia \"a pasta já existe\". Agora o mesmo comando atualiza o jogo por cima."},
     {"ic": "man", "t": "Tutoriais conferidos", "d": "Todos os tutoriais foram conferidos passo a passo. O do Book explica as conquistas da IA, e esta aba tem o seu."}
   ],
   "versoes": [
     {"versao": "0.5.3", "nome": "atualização das conquistas", "data": "2026-10-10",
      "resumo": "O XP dos dias passados fica guardado, e corrigir uma nota não deixa mais a carteira negativa.",
      "itens": [
        {"ic": "tower", "t": "Dias passados guardados", "d": "O XP de cada dia que já acabou fica guardado. Se uma tarefa concluída sumir do todo.txt ou do done.txt (uma IA reescrevendo os arquivos, um archive, uma linha apagada), o XP e a Jenny daquele dia continuam. Marcar algo que você esqueceu ontem ainda soma, e desmarcar uma tarefa de hoje ainda tira."},
        {"ic": "coin", "t": "Nota corrigida sem dívida", "d": "Corrigir uma nota para menos tira o bônus de diferença só até zerar a carteira. O que passar disso é perdoado e aparece em acertos, na carteira da Masadora."}
      ]},
     {"versao": "0.5.2", "nome": "atualização das conquistas", "data": "2026-10-10",
      "resumo": "A Jenny e o XP que você ganhou não somem mais quando o plano de avaliações muda.",
      "itens": [
        {"ic": "coin", "t": "Bônus de nota guardado", "d": "O bônus de cada nota agora fica com o peso do dia em que a nota entrou. Antes ele era refeito com o peso atual: se você ou a IA corrigiam um peso para menos depois de você gastar, a carteira ficava negativa. Mudar o plano não tira mais Jenny; corrigir a própria nota ajusta só a diferença."},
        {"ic": "spider", "t": "Fúria guardada", "d": "As tarefas feitas com o chefão em fúria ficam com o ×1,5 para sempre. Antes, quando o chefão saía da fúria ou entrava outra nota, o bônus sumia das tarefas antigas, e com ele XP e Jenny."},
        {"ic": "scroll", "t": "Carteira negativa zerada", "d": "Se a sua carteira tinha ficado negativa por esse problema, o jogo devolveu uma vez o que faltava para zerar. Aparece como acerto da 0.5.2 na carteira da Masadora."}
      ]},
     {"versao": "0.5.1", "nome": "atualização das conquistas", "data": "2026-10-10",
      "resumo": "Achou um bug ou teve uma ideia? Agora dá para mandar direto do jogo.",
      "itens": [
        {"ic": "fb", "t": "Feedback pelo jogo", "d": "O balão no canto direito da tela, em qualquer aba, manda um bug, uma ideia ou uma dúvida. O jogo abre a página do GitHub já preenchida com a sua versão, o sistema e a aba; é só conferir e clicar em Create. Sem conta no GitHub, copie o texto e mande por mensagem."}
      ]}
   ]},
  {"versao": "0.4", "nome": "atualização da IA", "data": "2026-10-09",
   "resumo": "A IA de terminal do seu computador passa a trabalhar dentro do jogo.",
   "itens": [
     {"ic": "int", "t": "IA ligada no jogo", "d": "Em Configurações → IA, o jogo usa o Claude Code, o Codex ou o Gemini CLI para ler planos de ensino, aplicar lembretes e escrever as cartas do Book."},
     {"ic": "crown", "t": "O jogo decide a prioridade", "d": "Ao adicionar uma tarefa, a prioridade pode sair da prova chegando, do prazo e da fúria do chefão."},
     {"ic": "card", "t": "Tipo da tarefa sugerido", "d": "O tipo segue as palavras do texto; o ? explica cada um, e o IA? pergunta à IA."},
     {"ic": "tra", "t": "Codeforces à mão", "d": "O ✋ soma um problema feito onde o site não mostra (ITMO Academy, grupo privado)."}
   ],
   "versoes": [
     {"versao": "0.4.2", "nome": "atualização da IA", "data": "2026-10-09",
      "resumo": "Ajustes pedidos depois do primeiro teste com a IA.",
      "itens": [
        {"ic": "spider", "t": "Pontos extras", "d": "No editor do chefão, uma disciplina pode passar de 100% quando o professor dá ponto extra."},
        {"ic": "scroll", "t": "Vários planos de uma vez", "d": "Em ler todos os planos, marque os resultados e salve todos de uma vez."},
        {"ic": "tra", "t": "Codeforces à mão na Arena", "d": "O ✋ também aparece na meta do dia da Arena."},
        {"ic": "man", "t": "Fiz de novo", "d": "Hábito semanal com a meta cumprida pode ser feito de novo, e cada vez acima da meta vale XP em dobro."}
      ]},
     {"versao": "0.4.1", "nome": "atualização da IA", "data": "2026-10-09",
      "resumo": "A IA não aparecia para quem atualizava com o jogo ligado. Corrigido.",
      "itens": [
        {"ic": "tower", "t": "Servidor trocado na atualização", "d": "O servidor antigo, rodando em segundo plano, é reiniciado sozinho quando o jogo atualiza. Um aviso amarelo aparece se página e servidor ficarem em versões diferentes."},
        {"ic": "esp", "t": "Aba Configurações", "d": "Nome, hábitos, IA, servidor e backup saíram de Regras e ganharam uma aba própria."},
        {"ic": "int", "t": "Tutorial da IA", "d": "Ao ligar uma IA, o tutorial mostra tudo o que ela faz no jogo."}
      ]}
   ]},
  {"versao": "0.3", "nome": "", "data": "2026-10-09",
   "resumo": "A primeira versão testada pelos amigos.",
   "itens": [
     {"ic": "spider", "t": "Tarefa ligada à avaliação", "d": "Cada tarefa da disciplina se liga a uma avaliação pelo prazo e por palavras-chave."},
     {"ic": "coin", "t": "Prêmios reais editáveis", "d": "Na Masadora você escreve os seus prêmios, com uma régua de esforço para o preço."},
     {"ic": "bag", "t": "Backup", "d": "Um ZIP com todos os seus dados, em Configurações."}
   ]}
]/*FIM*/;
(function(){
'use strict';
const NOV = window.GB_NOVIDADES, GB = window.GB;

document.head.insertAdjacentHTML('beforeend', `<style>
.nv{display:flex;flex-direction:column;gap:16px}
.nv-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:0;padding:0!important;overflow:hidden}
.nv-hero > div{padding:22px 24px}
.nv-ver{background:radial-gradient(120% 120% at 0% 0%,color-mix(in srgb,var(--volt) 20%,transparent),transparent 60%),var(--panel)}
.nv-ver .cap{margin:0}
.nv-ver .num{font:800 64px/1 var(--f-hud);letter-spacing:-.02em;margin:8px 0 4px;color:var(--ink)} .nv-ver .num span{color:var(--volt)}
.nv-ver .nome{font:600 15px var(--f-hud);color:var(--soft);text-transform:lowercase}
.nv-ver p{margin:12px 0 0;font-size:14px;color:var(--soft);max-width:44ch}
.nv-st{border-left:1px solid var(--hair);display:flex;flex-direction:column;gap:10px;justify-content:center}
.nv-st .pill{align-self:flex-start;display:inline-flex;gap:8px;align-items:center;border-radius:99px;padding:5px 12px;font:700 12.5px var(--f-mono);border:1px solid var(--grn);color:var(--grn);background:color-mix(in srgb,var(--grn) 10%,transparent)}
.nv-st .pill.nova{border-color:var(--amb);color:var(--amb);background:color-mix(in srgb,var(--amb) 12%,transparent)}
.nv-st .pill.erro{border-color:var(--faint);color:var(--soft);background:transparent}
.nv-st h3{margin:0;font:700 20px var(--f-hud)} .nv-st p{margin:0;font-size:14px;color:var(--soft)}
.nv-st ul{margin:0;padding-left:18px;list-style:disc;font-size:13.5px;color:var(--ink)} .nv-st li{margin:3px 0}
.nv-st .acao{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.nv-st .grande{padding:9px 18px;font:700 14px var(--f-hud);border-radius:10px}
.nv-tl{position:relative;display:flex;flex-direction:column;gap:14px;padding-left:34px}
.nv-tl::before{content:"";position:absolute;left:11px;top:8px;bottom:8px;width:2px;background:linear-gradient(var(--volt),var(--hair) 40%)}
.nv-v{position:relative}
.nv-v::before{content:"";position:absolute;left:-29px;top:20px;width:12px;height:12px;border-radius:50%;background:var(--panel);border:2px solid var(--faint)}
.nv-v.ultima::before{border-color:var(--volt);background:var(--volt);box-shadow:0 0 0 5px color-mix(in srgb,var(--volt) 20%,transparent)}
.nv-v .topo{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px}
.nv-v .topo b{font:800 22px var(--f-hud)} .nv-v .topo span{font:600 12px var(--f-mono);color:var(--soft);text-transform:uppercase;letter-spacing:.08em}
.nv-v .topo em{font:700 11px var(--f-mono);font-style:normal;color:var(--bg);background:var(--volt);border-radius:99px;padding:2px 9px}
.nv-v .topo em.tua{background:var(--grn)}
.nv-v > p{margin:0 0 12px;font-size:14.5px}
.nv-itens{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.nv-it{display:grid;grid-template-columns:34px minmax(0,1fr);align-content:start;gap:4px 12px;padding:12px;border:1px solid var(--hair);border-radius:12px;background:var(--panel2)}
.nv-it .ic{grid-row:span 2;font-size:22px;color:var(--volt);margin-top:2px}
.nv-it b{font:700 14.5px var(--f-hud)} .nv-it span{font-size:13px;color:var(--soft);line-height:1.45}
.nv-v.velha .nv-itens{display:flex;flex-direction:column;gap:2px}
.nv-v.velha .nv-it{display:block;border:0;background:none;padding:2px 0} .nv-v.velha .nv-it .ic{display:none} .nv-v.velha .nv-it b{font:600 13.5px var(--f-ui)} .nv-v.velha .nv-it b::after{content:" · "} .nv-v.velha .nv-it span{font-size:13px}
.nv-pon{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:color-mix(in srgb,var(--bg) 85%,transparent);backdrop-filter:blur(6px)}
.nv-pon > div{background:var(--panel);border:1px solid var(--volt);border-radius:16px;padding:24px 28px;max-width:420px;text-align:center;box-shadow:0 30px 80px -30px rgba(0,0,0,.6)}
.nv-pon .ic{font-size:36px;color:var(--volt)}
.nv-pon h3{margin:10px 0 6px;font:700 20px var(--f-hud)} .nv-pon p{margin:0;color:var(--soft);font-size:14px}
.nv-sub{margin-top:12px;border-top:1px dashed var(--hair);padding-top:10px}
.nv-sub summary{cursor:pointer;list-style:none;font:600 12.5px var(--f-mono);color:var(--soft)} .nv-sub summary::-webkit-details-marker{display:none}
.nv-sub summary::before{content:"▸ ";color:var(--faint)} .nv-sub[open] summary::before{content:"▾ "}
.nv-sub .nv-mi{padding:10px 0 4px;border-top:1px solid var(--hair);margin-top:10px} .nv-sub .nv-mi:first-of-type{border-top:0;margin-top:4px}
.nv-sub .nv-mi .topo b{font:700 15px var(--f-hud)} .nv-sub .nv-mi > p{margin:0 0 4px;font-size:13.5px}
.nv-sub .nv-mi ul{margin:0;padding-left:18px;font-size:13px;color:var(--soft)} .nv-sub .nv-mi li{margin:2px 0} .nv-sub .nv-mi li b{color:var(--ink);font-weight:600}
.nv-big{position:fixed;inset:0;z-index:85;display:grid;place-items:center;padding:16px;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(6px)}
.nv-big > div{width:min(920px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--panel);border:1px solid var(--volt);border-radius:18px;box-shadow:0 40px 120px -40px rgba(0,0,0,.7)}
.nv-big .cab{padding:26px 30px 18px;background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--volt) 22%,transparent),transparent 60%)}
.nv-big .cap{margin:0;font:600 12px var(--f-mono);color:var(--soft);text-transform:uppercase;letter-spacing:.12em}
.nv-big h2{margin:6px 0 2px;font:800 clamp(30px,5vw,46px)/1.05 var(--f-hud);letter-spacing:-.01em} .nv-big h2 span{color:var(--volt)}
.nv-big .nome{font:600 16px var(--f-hud);color:var(--soft);text-transform:lowercase}
.nv-big .cab p{margin:12px 0 0;font-size:15px;max-width:62ch}
.nv-big .nv-itens{padding:4px 30px 8px}
.nv-big .nv-it:first-child{grid-column:1/-1;border-color:color-mix(in srgb,var(--volt) 55%,var(--hair));background:color-mix(in srgb,var(--volt) 8%,var(--panel2))}
.nv-big .pe{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:16px 30px 24px} .nv-big .pe .sp{flex:1}
.nv-big .grande{padding:10px 18px;font:700 14px var(--f-hud);border-radius:10px}
.nv-big .nv-marca{float:right;width:84px;height:84px;margin:0 0 8px 16px}
.nv-vis{margin:6px 30px 4px;padding:14px 16px;border:1px solid var(--hair);border-radius:12px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;background:var(--panel2)}
.nv-vis > div:first-child{flex:1;min-width:220px} .nv-vis b{display:block;font:700 15px var(--f-hud)} .nv-vis span{font-size:13.5px;color:var(--soft)}
.nv-vis-b{display:flex;gap:8px} .nv-vis-b [aria-pressed="true"]{border-color:#E0364F;color:var(--ink);background:color-mix(in srgb,#E0364F 14%,transparent)}
.nv-obg{margin:14px 30px 4px;padding:18px 20px;border:1px solid color-mix(in srgb,var(--amb) 45%,var(--hair));border-radius:14px;background:radial-gradient(120% 160% at 100% 0%,color-mix(in srgb,var(--amb) 14%,transparent),transparent 60%),var(--panel2)}
.nv-obg h3{margin:0 0 6px;font:700 19px var(--f-hud);display:flex;gap:8px;align-items:center;color:var(--amb)} .nv-obg p{margin:0 0 12px;font-size:14px;max-width:70ch}
.nv-obg-l{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.nv-obg-l > *{display:flex;flex-direction:column;gap:3px;padding:10px 12px;border:1px solid var(--hair);border-radius:10px;background:var(--panel);color:var(--ink);text-decoration:none}
.nv-nen{margin:6px 30px 4px;padding:16px 18px;border:1px solid var(--hair);border-radius:14px;background:var(--panel2);display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:6px 22px;align-items:center}
.nv-nen > header{grid-column:1/-1} .nv-nen h3{margin:0;font:700 19px var(--f-hud)} .nv-nen > header p{margin:4px 0 0;font-size:13.5px;color:var(--soft);max-width:72ch}
.nv-nen .hx{display:block;max-width:380px;margin:0 auto} .nv-nen .hx .ant{fill:none;stroke:var(--faint);stroke-dasharray:3 3;opacity:0;transition:opacity .6s}
.nv-nen.fim .hx .ant{opacity:1} .nv-nen .hx text.tr{transition:opacity .5s} .nv-nen .hx text.velho{text-decoration:line-through}
.nv-nen .hx text.novo{opacity:0;fill:var(--volt);font-weight:700} .nv-nen.fim .hx text.velho{opacity:0} .nv-nen.fim .hx text.novo{opacity:1}
.nv-nen-l{display:grid;gap:2px} .nv-nen-l > div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:0 10px;padding:5px 8px;border-radius:8px}
.nv-nen-l b{font:700 13.5px var(--f-hud)} .nv-nen-l span{grid-row:2;font-size:12px;color:var(--faint)} .nv-nen-l em{grid-row:1/3;grid-column:2;align-self:center;font:600 12.5px var(--f-mono);font-style:normal;color:var(--soft)}
.nv-nen-l em strong{color:var(--ink)} .nv-nen-l .tr{border:1px solid color-mix(in srgb,var(--volt) 55%,var(--hair));background:color-mix(in srgb,var(--volt) 8%,var(--panel))}
.nv-nen-l .tr span s{color:var(--faint)} .nv-nen-l .tr span i{font-style:normal;font-weight:700;color:var(--volt)}
.nv-nen-pe{grid-column:1/-1;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12.5px;color:var(--faint)} .nv-nen-pe .sp{flex:1}
.nv-obg-l a:hover{border-color:var(--amb)} .nv-obg-l b{font:700 14px var(--f-mono);color:var(--amb)} .nv-obg-l span{font-size:13px;color:var(--soft)}
.nv-big.aviso > div{border-color:var(--amb)} .nv-big.aviso .cab{background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--amb) 24%,transparent),transparent 60%)} .nv-big.aviso h2 span{color:var(--amb)}
.nv-seu{margin-top:16px;display:grid;gap:4px;padding:14px 16px;border:1px solid var(--amb);border-radius:12px;background:color-mix(in srgb,var(--amb) 10%,var(--panel2));max-width:70ch}
.nv-seu b{font:700 12px var(--f-mono);text-transform:uppercase;letter-spacing:.1em;color:var(--amb)} .nv-seu span{font-size:15px} .nv-seu strong{color:var(--ink)}
.nv-seu.ok{border-color:var(--grn);background:color-mix(in srgb,var(--grn) 8%,var(--panel2))} .nv-seu.ok b{color:var(--grn)}
.gnav .nv-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--amb);margin-left:4px;vertical-align:top}
.nv-v.epica{border-color:color-mix(in srgb,var(--volt) 45%,var(--hair))}
.nv-v.epica > .nv-itens .nv-it:first-child{grid-column:1/-1;border-color:color-mix(in srgb,var(--volt) 55%,var(--hair));background:color-mix(in srgb,var(--volt) 8%,var(--panel2))}
.nv-v.epica > .nv-itens .nv-it:first-child b{font-size:17px}
.nv-tier{margin:14px 0 8px;font:600 11.5px var(--f-mono);color:var(--soft);text-transform:uppercase;letter-spacing:.12em}
.nv-itens.mini .nv-it{padding:9px 11px} .nv-itens.mini .nv-it .ic{font-size:18px}
.nv-pts{margin-top:12px;padding:12px 14px;border:1px solid color-mix(in srgb,var(--amb) 50%,var(--hair));border-radius:12px;background:color-mix(in srgb,var(--amb) 6%,var(--panel2))}
.nv-pts > b{font:700 12px var(--f-mono);text-transform:uppercase;letter-spacing:.1em;color:var(--amb)} .nv-pts > p{margin:4px 0 8px;font-size:13.5px}
.nv-pts ul,.nv-aj{margin:0;padding-left:18px;font-size:13px;color:var(--soft)} .nv-pts li,.nv-aj li{margin:3px 0} .nv-pts li b,.nv-aj li b{color:var(--ink);font-weight:600}
.nv-v.epica .rever{margin-top:12px}
/* janela épica (0.9.0-beta2): só nesta janela, fora do visual seco do resto do jogo */
.nv-ep{padding:0;background:color-mix(in srgb,var(--bg) 70%,#000);backdrop-filter:blur(8px);overflow:hidden}
.ep-fundo{position:absolute;inset:0;display:block;pointer-events:none;overflow:hidden}
.nv-ep .nv-it:first-child{grid-column:auto;border-color:var(--hair);background:var(--panel2)}
.ep-fundo::before{content:"";position:absolute;inset:-100% 0 0;background:repeating-linear-gradient(0deg,transparent 0 58px,color-mix(in srgb,var(--volt) 16%,transparent) 58px 60px);animation:ep-desce 2.4s linear infinite;mask-image:linear-gradient(90deg,transparent,#000 30%,#000 70%,transparent)}
.ep-fundo::after{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 0%,color-mix(in srgb,var(--aura) 30%,transparent),transparent 70%),radial-gradient(40% 40% at 50% 100%,color-mix(in srgb,var(--volt) 18%,transparent),transparent 70%);animation:ep-pulsa 4s ease-in-out infinite}
.ep-fundo i{position:absolute;bottom:-12px;width:4px;height:4px;border-radius:50%;background:var(--volt);box-shadow:0 0 10px 2px var(--volt);opacity:0;animation:ep-sobe var(--d,7s) linear var(--a,0s) infinite}
@keyframes ep-desce{to{transform:translateY(60px)}}
@keyframes ep-pulsa{50%{opacity:.55}}
@keyframes ep-sobe{10%{opacity:.9}80%{opacity:.5}to{transform:translate(var(--x,0),-105vh);opacity:0}}
.nv-ep > .ep-caixa{position:relative;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--volt) 40%,transparent) transparent;width:min(980px,100%);max-height:calc(100vh - 32px);overflow:auto;background:color-mix(in srgb,var(--panel) 94%,transparent);border:1px solid var(--volt);border-radius:20px;box-shadow:0 0 0 1px color-mix(in srgb,var(--volt) 25%,transparent),0 0 80px -10px color-mix(in srgb,var(--volt) 45%,transparent),0 40px 120px -40px #000;animation:ep-entra .7s cubic-bezier(.2,.9,.2,1.1) both}
@keyframes ep-entra{from{opacity:0;transform:translateY(40px) scale(.94)}}
.ep-cab{position:relative;padding:34px 34px 22px;text-align:center;overflow:hidden;background:radial-gradient(80% 120% at 50% 0%,color-mix(in srgb,var(--volt) 20%,transparent),transparent 70%)}
.ep-cab::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(100deg,transparent,color-mix(in srgb,#fff 14%,transparent),transparent);transform:skewX(-20deg);animation:ep-brilho 1.4s ease-out 1.1s both}
@keyframes ep-brilho{from{left:-60%}to{left:130%}}
.ep-selo{width:92px;height:92px;margin:0 auto 6px;animation:ep-gira 1.1s cubic-bezier(.2,.9,.2,1) .15s both}
.ep-selo svg{width:100%;height:100%;overflow:visible}
.ep-selo .hx{fill:none;stroke:var(--volt);stroke-width:2.5;stroke-dasharray:240;stroke-dashoffset:240;animation:ep-traco 1.2s ease-out .2s forwards;filter:drop-shadow(0 0 6px var(--volt))}
.ep-selo .hx2{fill:color-mix(in srgb,var(--volt) 12%,transparent);stroke:none;animation:ep-pulsa 2.4s ease-in-out infinite}
.ep-selo text{font:800 30px var(--f-hud);fill:var(--ink);text-anchor:middle;dominant-baseline:central}
@keyframes ep-traco{to{stroke-dashoffset:0}}
@keyframes ep-gira{from{opacity:0;transform:rotate(-90deg) scale(.4)}}
.ep-cap{margin:0;font:700 12px var(--f-mono);color:var(--volt);text-transform:uppercase;letter-spacing:.32em;animation:ep-sobeT .6s ease-out .5s both}
.ep-num{margin:4px 0 0;font:800 clamp(64px,13vw,128px)/.95 var(--f-hud);letter-spacing:-.04em;color:var(--ink);text-shadow:0 0 30px color-mix(in srgb,var(--volt) 55%,transparent);animation:ep-num .9s cubic-bezier(.2,.9,.2,1.15) .65s both}
.ep-num span{color:var(--volt)}
@keyframes ep-num{from{opacity:0;transform:scale(1.6);filter:blur(12px);letter-spacing:.3em}}
.ep-nome{font:700 clamp(17px,2.6vw,22px) var(--f-hud);color:var(--soft);text-transform:lowercase;animation:ep-sobeT .6s ease-out 1s both}
.ep-lema{margin:14px auto 0;max-width:60ch;font-size:15.5px;line-height:1.5;animation:ep-sobeT .6s ease-out 1.15s both}
.ep-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px}
.ep-chips span{padding:4px 11px;border:1px solid color-mix(in srgb,var(--volt) 45%,var(--hair));border-radius:99px;font:600 12px var(--f-mono);color:var(--ink);background:color-mix(in srgb,var(--volt) 8%,transparent);animation:ep-sobeT .45s ease-out both}
@keyframes ep-sobeT{from{opacity:0;transform:translateY(14px)}}
.ep-sec{margin:22px 34px 10px;display:flex;align-items:center;gap:12px;font:700 11.5px var(--f-mono);color:var(--soft);text-transform:uppercase;letter-spacing:.16em}
.ep-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--hair),transparent)}
.ep-pri{margin:6px 34px 0;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);border:1px solid var(--volt);border-radius:16px;overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--volt) 12%,var(--panel2)),var(--panel2) 60%);animation:ep-sobeT .6s ease-out 1.3s both}
.ep-pri > div{padding:22px 24px}
.ep-pri h3{margin:0 0 8px;display:flex;gap:10px;align-items:center;font:800 26px var(--f-hud)} .ep-pri h3 .ic{color:var(--volt);font-size:30px}
.ep-pri p{margin:0;font-size:14.5px;line-height:1.55;color:var(--soft)}
.ep-fatos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px}
.ep-fatos div{padding:10px 8px;border:1px solid var(--hair);border-radius:10px;background:var(--panel);text-align:center}
.ep-fatos b{display:block;font:800 26px var(--f-hud);color:var(--volt)} .ep-fatos span{font-size:12px;color:var(--soft)}
.ep-torre{position:relative;border-left:1px solid var(--hair);display:flex;flex-direction:column;justify-content:center;gap:5px;background:repeating-linear-gradient(90deg,transparent 0 22px,color-mix(in srgb,var(--hair) 50%,transparent) 22px 23px)}
.ep-torre div{display:flex;align-items:center;gap:10px;font:600 11.5px var(--f-mono);color:var(--faint)}
.ep-torre div::after{content:"";flex:1;height:8px;border-radius:3px;background:var(--track);border:1px solid var(--hair)}
.ep-torre div.vc{color:var(--volt)} .ep-torre div.vc::after{background:color-mix(in srgb,var(--volt) 55%,transparent);border-color:var(--volt);box-shadow:0 0 14px color-mix(in srgb,var(--volt) 60%,transparent)}
.ep-dest{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;padding:0 34px}
.ep-dest .nv-it{padding:16px;border-radius:14px;transition:transform .2s,border-color .2s;animation:ep-sobeT .5s ease-out both}
.ep-dest .nv-it:hover{transform:translateY(-3px);border-color:var(--volt)}
.ep-dest .nv-it .ic{font-size:26px} .ep-dest .nv-it b{font-size:16px}
.ep-mais{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;padding:0 34px}
.ep-mais .nv-it{grid-template-columns:24px minmax(0,1fr);padding:10px 12px;animation:ep-sobeT .5s ease-out both} .ep-mais .nv-it .ic{font-size:18px;color:var(--soft)} .ep-mais .nv-it b{font-size:13.5px} .ep-mais .nv-it span{font-size:12.5px}
.nv-ep .nv-pts{margin:18px 34px 0}
.nv-ep .nv-aj{margin:0 34px;padding-left:18px;font-size:12.5px;color:var(--faint)} .nv-ep .nv-aj li b{color:var(--soft)}
.nv-ep .nv-obg{margin:22px 34px 4px}
.nv-ep .pe{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:20px 34px 26px} .nv-ep .pe .sp{flex:1}
.nv-ep .ir{padding:12px 22px;font:800 15px var(--f-hud);border-radius:12px;box-shadow:0 0 24px -4px color-mix(in srgb,var(--volt) 70%,transparent);animation:ep-chama 2.2s ease-in-out 2s infinite}
@keyframes ep-chama{50%{box-shadow:0 0 34px 2px color-mix(in srgb,var(--volt) 80%,transparent)}}
@media (prefers-reduced-motion:reduce){ .nv-ep *,.nv-ep *::before,.nv-ep *::after{animation:none!important;transition:none!important} .ep-selo .hx{stroke-dashoffset:0} .ep-fundo i{display:none} }
@media (max-width:820px){ .ep-cab{padding:26px 18px 18px} .ep-pri{margin:6px 18px 0;grid-template-columns:minmax(0,1fr)} .ep-torre{display:none} .ep-sec{margin-left:18px;margin-right:18px} .ep-dest,.ep-mais{padding:0 18px} .nv-ep .nv-pts,.nv-ep .nv-obg{margin-left:18px;margin-right:18px} .nv-ep .nv-aj{margin:0 18px} .nv-ep .pe{padding:18px} }
@media (max-width:820px){ .nv-big .nv-marca{width:56px;height:56px} .nv-big .cab,.nv-big .nv-itens,.nv-big .pe{padding-left:18px;padding-right:18px} .nv-vis,.nv-obg,.nv-nen{margin-left:18px;margin-right:18px} .nv-nen{grid-template-columns:minmax(0,1fr)} .nv-hero{grid-template-columns:minmax(0,1fr)} .nv-st{border-left:0;border-top:1px solid var(--hair)} .nv-ver .num{font-size:52px} }
</style>`);

let AT = null;   // GET /api/atualizacao: {versao, novas:[...], erro, metodo, conferido}; null = conferindo
let ATUALIZANDO = false;
const curta = d => d ? GB.brData(d) : '';
const temNova = () => !!(AT && AT.ok && AT.novas && AT.novas.length);
const naoVista = () => CTX && EST && EST.visto !== VERSAO_PAGINA;
const grande = v => /^\d+\.\d+$/.test(String(v.versao));   // 0.6, 0.7: versão grande, com nome novo e as menores dentro
const nIt = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

async function confere(agora){
  if(!CTX || !CTX.SRV) return;
  if(agora){ AT = null; if(cur === 'nv') render(); }
  try { AT = await (await fetch('/api/atualizacao' + (agora ? '?agora' : ''), {cache:'no-store'})).json(); }
  catch(e){ AT = {ok:false, error:'o servidor não respondeu'}; }
  if(AT && AT.ok === undefined) AT = {ok:false, error:'servidor antigo, sem a conferência de versões'};
  render();
  if(temNova() && !confere.avisou && cur !== 'nv' && !document.querySelector('.toast')){ confere.avisou = true; const v = AT.novas[0];
    const to = document.createElement('div'); to.className = 'toast'; to.innerHTML = `${ic('antenna')} Saiu a versão ${esc(v.versao)} <small>${esc(v.resumo || v.nome || '')}</small><button class="l-undo" data-go="nv">ver</button>`;
    document.body.appendChild(to); setTimeout(() => to.remove(), 10000); }
}

function statusHTML(){
  if(!CTX.SRV) return `<span class="pill erro">modo demonstração</span><h3>Aqui só se vê o que mudou</h3><p>Instalado no computador, o jogo confere sozinho se saiu versão nova e atualiza com um clique.</p>`;
  if(!AT) return `<span class="pill erro">conferindo...</span><h3>Procurando versão nova</h3><p>O jogo pergunta ao GitHub qual é a última versão publicada.</p>`;
  if(!AT.ok) return `<span class="pill erro">não deu para conferir</span><h3>Versão nova: não sei</h3><p>${esc(AT.error || 'erro')}.</p>`;
  const quando = AT.conferido ? `conferido em ${esc(curta(AT.conferido.slice(0, 10)))} às ${esc(AT.conferido.slice(11))}` : '';
  if(temNova()){ const v = AT.novas[0], it = AT.novas.flatMap(x => x.itens || []).slice(0, 5);
    return `<span class="pill nova">${ic('antenna')} versão nova</span><h3>Saiu a ${esc(v.versao)}${v.nome ? ` · ${esc(v.nome)}` : ''}</h3>
      ${v.resumo ? `<p>${esc(v.resumo)}</p>` : ''}${it.length ? `<ul>${it.map(x => `<li>${esc(x.t)}</li>`).join('')}</ul>` : ''}
      <div class="acao"><button type="button" class="btn v grande" data-nvatualiza${ATUALIZANDO ? ' disabled' : ''}>atualizar agora</button>
        <span class="sub">${AT.metodo === 'git' ? 'baixa pelo git' : 'baixa o ZIP do GitHub'} e reinicia o jogo. Seus dados não mudam.</span></div>`; }
  return `<span class="pill">✓ em dia</span><h3>Você está na versão mais nova</h3><p>${AT.erro ? esc(AT.erro) + '. ' : ''}O jogo confere sozinho a cada 6 horas e avisa aqui quando sair outra.</p>
    <div class="acao"><button type="button" class="btn" data-nvconfere>conferir agora</button><span class="sub">${quando}</span></div>`;
}
const itensHTML = v => (v.itens || []).map(x => `<div class="nv-it">${ic(x.ic || 'scroll')}<b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('');
/* as versões que levaram até uma versão grande: recolhidas, uma linha por item */
function subHTML(v){
  const L = v.versoes || []; if(!L.length) return '';
  const depois = String(L[0].versao).startsWith(v.versao + '.');   // 0.5.1 a 0.5.3 vieram depois da 0.5; 0.5.4 a 0.5.9 levaram à 0.6
  return `<details class="nv-sub"><summary>${nIt(L.length, 'versão', 'versões')} ${depois ? 'depois da' : 'até a'} ${esc(v.versao)} (da ${esc(L[L.length - 1].versao)} à ${esc(L[0].versao)})</summary>
    ${L.map(x => `<div class="nv-mi"><div class="topo"><b>${esc(x.versao)}</b><span>${esc(curta(x.data))}</span>${x.versao === VERSAO_PAGINA ? '<em class="tua">a sua</em>' : ''}</div>
      ${x.resumo ? `<p>${esc(x.resumo)}</p>` : ''}${(x.itens || []).length ? `<ul>${x.itens.map(t => `<li><b>${esc(t.t)}</b>: ${esc(t.d)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</details>`;
}
/* versão épica na linha do tempo: o principal e os destaques grandes, depois "mais", os pontos e os ajustes, cada vez menores */
const ajHTML = L => `<ul class="nv-aj">${L.map(x => `<li><b>${esc(x.t)}</b>: ${esc(x.d)}</li>`).join('')}</ul>`;
const ptsHTML = P => `<div class="nv-pts"><b>${ic('coin')} ${esc(P.t)}</b>${P.d ? `<p>${esc(P.d)}</p>` : ''}<ul>${(P.itens || []).map(x => `<li><b>${esc(x.t)}</b>: ${esc(x.d)}</li>`).join('')}</ul></div>`;
function epicaHTML(v){
  const E = v.epica;
  return `${(E.mais || []).length ? `<p class="nv-tier">também nesta versão</p><div class="nv-itens mini">${itensHTML({itens: E.mais})}</div>` : ''}
    ${E.pontos ? ptsHTML(E.pontos) : ''}${(E.ajustes || []).length ? `<p class="nv-tier">ajustes</p>${ajHTML(E.ajustes)}` : ''}
    ${v.futura ? '' : '<button type="button" class="btn rever" data-nvep>rever a apresentação</button>'}`;
}
function versaoHTML(v, i, velha){
  const tua = v.versao === VERSAO_PAGINA;
  velha = velha && !v.epica;
  return `<article class="card nv-v${i === 0 ? ' ultima' : ''}${velha ? ' velha' : ''}${v.epica ? ' epica' : ''}">
    <div class="topo"><b>${esc(v.versao)}</b>${v.nome ? `<span>${esc(v.nome)}</span>` : ''}<span>${esc(curta(v.data))}</span>${tua ? `<em class="tua">a sua</em>` : ''}${tua && naoVista() ? '<em>nova</em>' : ''}</div>
    ${v.resumo ? `<p>${esc(v.resumo)}</p>` : ''}
    <div class="nv-itens">${itensHTML(v)}</div>${v.epica ? epicaHTML(v) : ''}${v.atributos && !v.futura ? '<button type="button" class="btn rever" data-nvatr>ver o seu hexágono antes e depois</button>' : ''}${subHTML(v)}</article>`;
}
function rNV(){
  const v = NOV.find(x => x.versao === VERSAO_PAGINA) || NOV[0], [a, b] = String(v.versao).split(/\.(.*)/s);
  const novas = temNova() ? AT.novas.map(x => ({...x, futura:true})) : [];
  const ultG = Math.max(0, NOV.findIndex(grande));   // até ela, aberto; depois, compacto
  document.getElementById('nv-root').innerHTML = `<div class="nv">
    <div class="card nv-hero" id="nv-hero"><div class="nv-ver"><p class="cap">sua versão</p><div class="num">${esc(a)}<span>.${esc(b || '0')}</span></div><div class="nome">${esc(v.nome || '')}${AT && AT.canal && AT.canal !== 'main' ? ' · canal ' + esc(AT.canal) : ''}</div><p>${esc(v.resumo || '')}</p></div>
      <div class="nv-st" id="nv-st">${statusHTML()}</div></div>
    <h2 class="h" style="font:700 20px var(--f-hud);margin:8px 0 0">O que mudou em cada versão</h2>
    <div class="nv-tl" id="nv-lista">${novas.map((x, i) => versaoHTML(x, i, false).replace('<div class="topo">', '<div class="topo"><em>ainda não instalada</em>')).join('')}${NOV.map((x, i) => versaoHTML(x, i + (novas.length ? 1 : 0), i > ultG)).join('')}</div></div>`;
  if(naoVista()){ EST.visto = VERSAO_PAGINA; salvaUI(); }
}

async function atualiza(){
  ATUALIZANDO = true; render();
  const alvo = AT.novas[0].versao;
  document.body.insertAdjacentHTML('beforeend', `<div class="nv-pon" id="nv-pon" role="alertdialog" aria-live="polite"><div>${ic('antenna')}<h3>Atualizando para a ${esc(alvo)}</h3><p id="nv-pon-t">Baixando a versão nova...</p></div></div>`);
  const fala = t => { const e = document.getElementById('nv-pon-t'); if(e) e.textContent = t; };
  try { await post('/api/atualizar', {}); }
  catch(err){ document.getElementById('nv-pon').remove(); ATUALIZANDO = false; render(); toast('Não atualizou: ' + esc(err.message)); return; }
  fala('Reiniciando o jogo com a versão nova...');
  for(let i = 0; i < 60; i++){
    await new Promise(r => setTimeout(r, 1500));
    try { const p = await (await fetch('/api/ping', {cache:'no-store'})).json(); if(p.versao && p.versao !== CTX.SRV.versao){ fala('Pronto! Abrindo...'); location.reload(); return; } } catch(e){}
  }
  fala('O jogo está demorando para voltar. Recarregue a página em alguns segundos (ou reinicie o computador).');
}

/* ponto quando há versão nova ou novidade que você ainda não viu */
window.nvTemDot = () => temNova() || naoVista();   // o ponto no botão Sistema e na sub-aba Novidades (index.html)
RENDER.nv = rNV;
document.addEventListener('click', e => {
  if(e.target.closest('[data-nvconfere]')){ confere(true); return; }
  if(e.target.closest('[data-nvatualiza]')){ atualiza(); return; }
  if(e.target.closest('[data-nvatr]') && !document.getElementById('nv-big')){ const v = NOV.find(x => x.atributos); if(v) janelaGrande(v); return; }
  const ep = e.target.closest('[data-nvep]'); if(ep && !document.getElementById('nv-big')){ const v = NOV.find(x => x.epica); if(v) janelaEpica(v); return; }
});
/* quem acabou de atualizar vê o aviso uma vez; quem está começando agora (sem nada feito) não.
   A janela da última versão grande tem marca própria: a página volta na aba Novidades depois de atualizar, e ela marca o visto */
let VISTO0 = null;   // o visto de quando a página abriu (a aba Novidades o preenche antes de boasNovas rodar)
const chaveG = g => g.aviso ? 'nv:aviso:' + g.aviso : 'nv:' + (g.epica ? g.epica.marca || g.epica.chave : g.versao), viuG = g => !!(EST.tour || {})[chaveG(g)];
function marcaG(g){ if(g) EST.tour = Object.assign({}, EST.tour, {[chaveG(g)]:1}); }
function boasNovas(){
  if(!CTX || !(CTX.JOG && CTX.JOG.configurado)) return;
  const g = NOV.find(grande), av = NOV.find(x => x.aviso), ep = NOV.find(x => x.epica && x.versao === VERSAO_PAGINA);
  if(!VISTO0 && !D.feitas.length){ EST.visto = VERSAO_PAGINA; marcaG(g); marcaG(av); marcaG(ep); salvaUI(); return; }
  if(av && !viuG(av) && !document.getElementById('nv-big')){ janelaGrande(av); return; }   // aviso de pontos primeiro
  if(ep && !viuG(ep) && !document.getElementById('nv-big')){ janelaEpica(ep); return; }
  if(g && !viuG(g) && !document.getElementById('nv-big')){ janelaGrande(g); return; }
  if(!naoVista()) return;
  const v = NOV.find(x => x.versao === VERSAO_PAGINA); if(!v) return;
  const to = document.createElement('div'); to.className = 'toast';
  to.innerHTML = `${ic('antenna')} Jogo atualizado para a ${esc(v.versao)} <small>${esc(v.resumo || '')}</small><button class="l-undo" data-go="nv">ver o que mudou</button>`;
  document.body.appendChild(to); setTimeout(() => to.remove(), 12000);
}
/* o que o acerto de uma versão com aviso mudou no jogo de quem lê (motor: rec.migra[versão] = {xp, j, ten}) */
function seuAviso(v){
  let r = null; try { r = estado().rec; } catch(e){}
  if(!r) return '';
  const partes = [], ok = [];
  for(const k of [v.janela && v.janela.de, v.aviso].filter(Boolean)){   // o acerto de cada versão (motor: rec.migra[versão] = {xp, j, ten})
    const m = (r.migra || {})[k]; if(!m) continue;
    const ac = +(r.acertos || {})[k] || 0, tirou = m.xp > 0 || m.j > 0;
    (tirou ? partes : ok).push((tirou ? `na ${esc(k)}, a torre ficou com <strong>${m.xp.toLocaleString('pt-BR')} XP a menos</strong> e a carteira com <strong>${(m.j).toLocaleString('pt-BR')} J a menos</strong>.${ac > 0 ? ' Como o saldo ficaria negativo, ele parou no zero.' : ''}` : `na ${esc(k)}, nada do XP e da Jenny que você já tinha mudou.`)
      + (m.ten ? ` O seu recorde do Ten (${m.ten} dias) e as conquistas que você já tinha ficam.` : ''));
  }
  const dv = EST.devolve;
  if(dv && v.aviso === '0.6.5'){   // devolução (#51): o que voltou para a loja e o que a carteira recebeu
    const nome = c => c.tipo === 'feitico' ? 'feitiço ' + ((GBx.SPELLS.find(s => s.k === c.id) || {}).n || c.id) : ((COS.find(i => i.id === c.id) || {}).n || c.id);
    partes.push(`Na 0.6.5, voltaram para a loja: <strong>${esc((dv.itens || []).map(nome).join(', '))}</strong>${dv.j > 0 ? `, e a carteira recebeu <strong>${(+dv.j).toLocaleString('pt-BR')} J</strong>, a parte paga com Jenny ganha jogando` : ''}.`);
  }
  if(v.aviso === '0.9.2-beta1'){   // retratos de chefão (#135): a Jenny que voltou, gravada em acertos.retratos
    const rj = +(r.acertos || {}).retratos || 0;
    if(rj > 0) partes.push(`a carteira recebeu <strong>${rj.toLocaleString('pt-BR')} J</strong> pelos retratos de chefão que você tinha comprado, e eles continuam seus.`);
    else ok.push('você não tinha comprado retratos, então a sua carteira não mudou.');
  }
  if(v.aviso === '0.9.2-beta7'){   // #180: as contribuições saíram do XP dos dias fechados (migra contrib-xp) e o Codeforces foi recalculado
    const m = (r.migra || {})['contrib-xp'], cf = (() => { try { return Math.round(+estado().cfXP || 0); } catch(e){ return 0; } })();
    if(m && m.xp > 0) partes.push(`a torre ficou com <strong>${m.xp.toLocaleString('pt-BR')} XP a menos</strong> das contribuições antigas, e a carteira ficou igual.`);
    else ok.push('nenhum XP de contribuição saiu da sua torre.');
    if(cf > 0) ok.push(`o Codeforces vale agora <strong>${cf.toLocaleString('pt-BR')} XP</strong> na temporada, pela regra nova.`);
  }
  const todas = partes.concat(ok); if(!todas.length) return '';
  return `<div class="nv-seu${partes.length ? '' : ' ok'}"><b>No seu jogo</b><span>${todas.map(t => t[0].toUpperCase() + t.slice(1)).join(' ')}</span></div>`;
}
/* 0.9.1-beta1 (#121): o hexágono de Nen de quem lê passando da regra antiga para a nova, com o nome trocado no vértice.
   "atributos": {"t", "d", "troca": {"i", "de", "para"}}; os números vêm do motor (rec.migra.tipos = {em, antes, depois}).
   Sem o antes e o depois gravados, o hexágono é o de agora e só o nome muda. O resto da janela é a do aviso. */
const NEN_R = 88, nenPt = (i, k) => { const a = -Math.PI/2 + i*Math.PI/3; return [Math.cos(a)*NEN_R*k, Math.sin(a)*NEN_R*k]; };
const nenKs = v => { const mx = Math.max(...v, 1); return v.map(x => .08 + .92*x/mx); };   // como o hex() da página: cada um pelo seu maior
const nenPol = ks => ks.map((k, i) => nenPt(i, k).map(n => n.toFixed(1)).join(',')).join(' ');
let NEN_AD = null;   // [antes, depois] da janela aberta
function atributosHTML(A){
  let r = null, S = null; try { S = estado(); r = S.rec; } catch(e){}
  const m = r && (r.migra || {}).tipos, T = A.troca || {}, NEN = GBx.NEN;
  const antes = m && m.antes ? m.antes : S ? S.attr.map(Math.round) : [0,0,0,0,0,0], depois = m && m.depois ? m.depois : antes;
  NEN_AD = [antes, depois];
  const W = NEN_R + 92, H = NEN_R + 44, n = x => (+x || 0).toLocaleString('pt-BR');
  let s = `<svg class="hx" viewBox="${-W} ${-H} ${2*W} ${2*H}" width="100%" role="img" aria-label="hexágono de Nen antes e depois dos tipos novos">`;
  for(const k of [.33,.66,1]) s += `<polygon class="g" points="${nenPol([k,k,k,k,k,k])}"/>`;
  for(let i = 0; i < 6; i++){ const p = nenPt(i, 1); s += `<line class="g" x1="0" y1="0" x2="${p[0]}" y2="${p[1]}"/>`; }
  s += `<polygon class="ant" points="${nenPol(nenKs(antes))}"/><polygon class="a" id="nv-nen-a" points="${nenPol(nenKs(antes))}"/>`;
  nenKs(antes).forEach((k, i) => { const p = nenPt(i, k); s += `<circle class="p" data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="2.6"/>`; });
  NEN.forEach((l, i) => { const p = nenPt(i, 1.16), an = Math.abs(p[0]) < 4 ? 'middle' : p[0] > 0 ? 'start' : 'end', y = p[1] + (p[1] > 4 ? 10 : p[1] < -4 ? -12 : 0);
    s += `<text x="${p[0]}" y="${y}" text-anchor="${an}">${esc(l.n)}</text>`;
    s += i === T.i ? `<text class="s tr velho" x="${p[0]}" y="${y+11}" text-anchor="${an}">${esc(T.de)}</text><text class="s tr novo" x="${p[0]}" y="${y+11}" text-anchor="${an}">${esc(T.para)}</text>`
      : `<text class="s" x="${p[0]}" y="${y+11}" text-anchor="${an}">${esc(l.c)}</text>`; });
  s += '</svg>';
  const linhas = NEN.map((l, i) => `<div${i === T.i ? ' class="tr"' : ''}><b>${esc(l.n)}</b><span>${i === T.i ? `<s>${esc(T.de)}</s> → <i>${esc(T.para)}</i>` : esc(l.c)}</span>
    <em>${m ? (antes[i] === depois[i] ? n(depois[i]) : `${n(antes[i])} → <strong>${n(depois[i])}</strong>`) + ' XP' : ''}</em></div>`).join('');
  return `<section class="nv-nen" id="nv-nen"><header><h3>${esc(A.t)}</h3>${A.d ? `<p>${esc(A.d)}</p>` : ''}</header>${s}<div class="nv-nen-l">${linhas}</div>
    <div class="nv-nen-pe"><span>${m ? 'a linha tracejada é o seu hexágono de antes; o XP de cada tipo foi só redistribuído' : 'o nome muda; o seu hexágono continua o mesmo'}</span><span class="sp"></span><button type="button" class="btn" data-nvnen>ver de novo</button></div></section>`;
}
function animaNen(){
  const el = document.getElementById('nv-nen'), pol = document.getElementById('nv-nen-a'); if(!el || !pol || !NEN_AD) return;
  const [k0, k1] = NEN_AD.map(nenKs), pts = el.querySelectorAll('circle.p'), lento = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const poe = f => { const ks = k0.map((k, i) => k + (k1[i] - k)*f); pol.setAttribute('points', nenPol(ks));
    pts.forEach((c, i) => { const p = nenPt(i, ks[i]); c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); }); };
  el.classList.remove('fim'); poe(0);
  if(lento){ poe(1); el.classList.add('fim'); return; }
  const dur = 1600, ini = performance.now() + 900, vez = el.dataset.vez = String(+(el.dataset.vez || 0) + 1);
  const passo = t => { if(!el.isConnected || el.dataset.vez !== vez) return;
    const f = Math.min(1, Math.max(0, (t - ini) / dur)), e = f < .5 ? 4*f*f*f : 1 - Math.pow(-2*f + 2, 3)/2;
    poe(e); if(f >= .45) el.classList.add('fim'); if(f < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}
document.addEventListener('click', e => { if(e.target.closest('#nv-big [data-nvnen]')) animaNen(); });
/* versão grande e aviso de pontos: os destaques numa janela que cobre a tela, uma vez (fechar marca como vista) */
/* 0.7: a escolha do visual dentro da janela (o clique em [data-visual] é tratado pela página) e o agradecimento */
const visualHTML = () => { const nen = document.documentElement.classList.contains('vis-nen');
  return `<div class="nv-vis"><div><b>Qual visual?</b><span>Dá para trocar aqui e ver na hora. Depois, em Configurações → configurações deste computador.</span></div>
    <div class="nv-vis-b"><button type="button" class="btn" data-visual="nen" aria-pressed="${nen}">Nen (novo)</button><button type="button" class="btn" data-visual="classico" aria-pressed="${!nen}">clássico</button></div></div>`; };
const obrigadoHTML = o => `<div class="nv-obg"><h3>${ic('crown')} ${esc(o.t)}</h3><p>${esc(o.d)}</p><div class="nv-obg-l">${(o.quem || []).map(q => q.n
  ? `<a href="https://github.com/${encodeURIComponent(q.n)}" target="_blank" rel="noopener"><b>@${esc(q.n)}</b><span>${esc(q.o)}</span></a>`
  : `<div><b>e você</b><span>${esc(q.o)}</span></div>`).join('')}</div></div>`;
document.addEventListener('click', e => { if(e.target.closest('#nv-big [data-visual]')) setTimeout(() => { const nen = document.documentElement.classList.contains('vis-nen');
  document.querySelectorAll('#nv-big [data-visual]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.visual === 'nen') === nen))); }, 0); });
function janelaGrande(v){
  const [a, b] = String(v.versao).split(/\.(.*)/s), exp = !v.aviso && (v.itens || []).some(x => x.ic === 'island') && RENDER.x;
  const J = v.janela, w = J ? {...v, resumo: J.resumo || v.resumo, itens: J.itens || v.itens} : v;   // "janela": a janela junta outra versão (0.6.4 → 0.6.5)
  document.body.insertAdjacentHTML('beforeend', `<div class="nv-big${v.aviso ? ' aviso' : ''}" id="nv-big" data-chave="${esc(chaveG(v))}" role="dialog" aria-modal="true" aria-labelledby="nv-big-t"><div>
    <div class="cab">${v.cap && !v.aviso && typeof MARCA === 'string' ? `<img class="nv-marca" src="${MARCA}" alt="">` : ''}<p class="cap">${esc(v.cap || (v.aviso ? 'mudança nos pontos · leia antes de jogar' : 'o jogo foi atualizado'))}</p><h2 id="nv-big-t">${J && J.de ? `${esc(J.de)}<span> → ${esc(v.versao)}</span>` : `${esc(a)}<span>.${esc(b)}</span>`}</h2><div class="nome">${esc(v.nome || '')}</div>${w.resumo ? `<p>${esc(w.resumo)}</p>` : ''}${v.aviso ? seuAviso(v) : ''}</div>
    ${v.atributos ? atributosHTML(v.atributos) : ''}<div class="nv-itens">${itensHTML(w)}</div>${v.visual ? visualHTML() : ''}${v.obrigado ? obrigadoHTML(v.obrigado) : ''}
    <div class="pe">${exp ? '<button type="button" class="btn v grande" data-nvbig="x">conhecer as Expedições</button>' : ''}<button type="button" class="btn grande" data-nvbig="nv">ver tudo o que mudou</button><span class="sp"></span><button type="button" class="btn" data-nvbig="">fechar</button></div>
  </div></div>`);
  if(v.atributos) animaNen();
  document.querySelector('#nv-big [data-nvbig]').focus({preventScroll:true});   // o foco no botão do pé não rola a janela: o topo (e o "no seu jogo") aparece primeiro
}
/* 0.9.0-beta2: a janela épica, com os efeitos só nela. A torre ao lado do principal desce um andar por vez */
function janelaEpica(v){
  const E = v.epica, [a, b] = String(E.chave).split(/\.(.*)/s), [pri, ...dest] = v.itens || [];
  const fundo = Array.from({length: 26}, () => `<i style="left:${(Math.random() * 100).toFixed(1)}%;--d:${(5 + Math.random() * 6).toFixed(1)}s;--a:${(Math.random() * 6).toFixed(1)}s;--x:${(Math.random() * 80 - 40).toFixed(0)}px"></i>`).join('');
  const atraso = (i, base) => ` style="animation-delay:${(base + i * .08).toFixed(2)}s"`;
  document.body.insertAdjacentHTML('beforeend', `<div class="nv-big nv-ep" id="nv-big" data-chave="${esc(chaveG(v))}" role="dialog" aria-modal="true" aria-labelledby="nv-big-t"><span class="ep-fundo" aria-hidden="true">${fundo}</span><div class="ep-caixa">
    <header class="ep-cab"><div class="ep-selo" aria-hidden="true"><svg viewBox="0 0 100 100"><path class="hx2" d="M50 6 88 28v44L50 94 12 72V28z"/><path class="hx" d="M50 6 88 28v44L50 94 12 72V28z"/><text x="50" y="52">念</text></svg></div>
      <p class="ep-cap">${esc(E.cap || 'o jogo foi atualizado')}</p><h2 class="ep-num" id="nv-big-t">${esc(a)}<span>.${esc(b || '0')}</span></h2><div class="ep-nome">${esc(v.nome || '')} · ${esc(v.versao)}</div>
      ${E.lema ? `<p class="ep-lema">${esc(E.lema)}</p>` : ''}${(E.chips || []).length ? `<div class="ep-chips">${E.chips.map((c, i) => `<span${atraso(i, 1.3)}>${esc(c)}</span>`).join('')}</div>` : ''}</header>
    ${pri ? `<section class="ep-pri"><div><h3>${ic(pri.ic || 'tower')}${esc(pri.t)}</h3><p>${esc(pri.d)}</p>${(E.fatos || []).length ? `<div class="ep-fatos">${E.fatos.map(f => `<div><b>${esc(f.n)}</b><span>${esc(f.t)}</span></div>`).join('')}</div>` : ''}</div>
      <div class="ep-torre" aria-hidden="true">${Array.from({length: 9}, (_, i) => `<div data-andar="${i}">${String(i + 1).padStart(2, '0')}F</div>`).join('')}</div></section>` : ''}
    ${dest.length ? `<p class="ep-sec">os destaques</p><div class="ep-dest">${dest.map((x, i) => `<div class="nv-it"${atraso(i, 1.5)}>${ic(x.ic || 'scroll')}<b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('')}</div>` : ''}
    ${(E.mais || []).length ? `<p class="ep-sec">também nesta versão</p><div class="ep-mais">${E.mais.map((x, i) => `<div class="nv-it"${atraso(i, 1.9)}>${ic(x.ic || 'scroll')}<b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('')}</div>` : ''}
    ${E.pontos ? ptsHTML(E.pontos) : ''}
    ${(E.ajustes || []).length ? `<p class="ep-sec">e uns ajustes</p>${ajHTML(E.ajustes)}` : ''}
    ${v.obrigado ? obrigadoHTML(v.obrigado) : ''}
    <div class="pe">${E.ir && RENDER[E.ir.aba] ? `<button type="button" class="btn v ir" data-nvbig="${esc(E.ir.aba)}">${ic('tower')} ${esc(E.ir.t)}</button>` : ''}<button type="button" class="btn grande" data-nvbig="nv">ver tudo o que mudou</button><span class="sp"></span><button type="button" class="btn" data-nvbig="">fechar</button></div>
  </div></div>`);
  let andar = 0; const torre = document.querySelectorAll('#nv-big .ep-torre div');
  const desce = () => { if(!document.getElementById('nv-big')) return clearInterval(t); torre.forEach((d, i) => d.classList.toggle('vc', i <= andar)); andar = (andar + 1) % (torre.length + 2); };
  const t = torre.length ? setInterval(desce, 420) : 0; desce();
  document.querySelector('#nv-big [data-nvbig]').focus({preventScroll:true});
}
function fechaGrande(ir){
  const el = document.getElementById('nv-big'); if(!el) return;
  el.remove(); EST.visto = VERSAO_PAGINA; EST.tour = Object.assign({}, EST.tour, {[el.dataset.chave]:1}); salvaUI();
  if(ir) tab(ir); else render();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-nvbig]'); if(b){ fechaGrande(b.dataset.nvbig); return; }
  if(e.target.id === 'nv-big' || e.target.classList.contains('ep-fundo')) fechaGrande('');
});
document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.getElementById('nv-big')) fechaGrande(''); });
window.GB_NOV = {confere, canal: () => AT && AT.canal};
(function tenta(){ if(!CTX){ setTimeout(tenta, 500); return; } VISTO0 = EST.visto || ''; if(cur === 'nv') render(); setTimeout(boasNovas, 1500); setTimeout(() => confere(false), 1800); })();
})();
