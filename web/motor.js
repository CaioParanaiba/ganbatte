/* Ganbatte · motor do jogo (regras e cálculo). Um arquivo só, usado pela página do jogo (/jogo) e pelo painel.
 *
 * Não grava nada: recebe o que o servidor manda em GET /api/jogo (todo.txt, done.txt, avaliacoes.txt, notas.txt,
 * estado.json, Codeforces) e devolve o estado do jogo. Tudo fica dentro de window.GB para não colidir com os
 * scripts do painel. Regras explicadas em jogo/README.md; mudou uma regra aqui, atualize o README.
 */
(function(){
'use strict';

/* ---------- regras fixas ---------- */
const MEDIA = 6;                                  // média para derrotar o chefão
const DIF = {facil:.7, normal:1, dificil:1.4};    // dificuldade da torre (custo dos andares)
const COFRE_MES = 150;                            // R$ por mês para prêmios que custam dinheiro (acumula)
const ALLFX = ['shim','aura','shake','zap','drift','confete'];

const NEN = [
  {k:'int', n:'Intensificação', c:'estudo',   f:'@estudo · disciplina sem tag', s:'Força de base: estudo e revisão, com ou sem disciplina. Tarefa de disciplina sem tag cai aqui.'},
  {k:'tra', n:'Transmutação',   c:'treino',   f:'+treino · Codeforces',            s:'Prática e Codeforces: transformar teoria em código rápido.'},
  {k:'con', n:'Conjuração',     c:'projeto',  f:'+projeto · issues do Ganbatte',   s:'Criar do zero: o seu app, site, bot ou projeto.'},
  {k:'esp', n:'Especialização', c:'vida',     f:'o resto (sem tag nem disciplina)', s:'O que é só seu: casa, família, saúde, pessoas. Tarefa sem tag e sem disciplina cai aqui.'},
  {k:'man', n:'Manipulação',    c:'hábitos',  f:'+rotina',         s:'Controle de si: os hábitos que você marca e repete todo dia ou toda semana.'},
  {k:'emi', n:'Emissão',        c:'entregas', f:'@entrega',              s:'Pôr para fora: trabalho que alguém cobra ou avalia, como listas, trabalhos e relatórios.'},
];
const GUARDA = [{ic:'cat',n:'Neferpitou',r:'Ten de 14 dias'},{ic:'wing',n:'Shaiapouf',r:'2 semanas sem atraso'},{ic:'horn',n:'Menthuthuyoupi',r:'uma semana acima de 300 XP'},{ic:'crown',n:'Meruem',r:'todos os chefões derrotados'}];
const SPELLS = [
  {k:'zetsu',   n:'Zetsu',       e:'Salva hoje ou ontem: o Ten ou um hábito (que não cai de nível).', p:1200, ic:'moon'},
  {k:'ko',      n:'Ko',          e:'A próxima tarefa vale XP ×2.',                   p:2000, ic:'int'},
  {k:'gyo',     n:'Gyo',         e:'Você escolhe o atributo da missão da semana.',   p:1500, ic:'esp'},
  {k:'acomp',   n:'Acompanhar',  e:'A próxima entrega vale XP ×2.',                  p:1800, ic:'emi'},
  {k:'retorno', n:'Retorno',     e:'Conta a meta do Codeforces de ontem, se faltou.', p:1000, ic:'tra'},
  {k:'ken',     n:'Ken',         e:'Adia um due: em 1 dia sem perder o ×1,5.',       p:1600, ic:'con'},
  {k:'escolha', n:'Feitiço à escolha', e:'Vira qualquer feitiço quando você usar. Vem da preparação completa.', p:0, ic:'card', noshop:1},
];

/* ---------- aparência (loja) ---------- */
const TK = 'bg panel panel2 ink soft faint hair track prompt red amb grn volt aura n1 n2 n3 n4 n5 n6'.split(' ');
const PALS = {
  painel:  ['dark','#13141B','#1B1D28','#222536','#E6E8F0','#9197AD','#5A6078','#2A2D3C','#252838','#7AA2F7','#F7768E','#E0AF68','#73C991','#9FD3FF','#B4A0FF','#F7768E','#7DCFFF','#73C991','#FF9E64','#BB9AF7','#E0AF68'],
  simples: ['dark','#16181D','#1D2027','#24282F','#E2E5EB','#9BA1AD','#60666F','#2C3038','#272B33','#9FB2CF','#DB8A93','#CDB384','#8DBF9F','#B4C1D3','#A6AFC0','#DB8A93','#A6C3DA','#8DBF9F','#D3A27E','#ADA3CC','#CDB384'],
  leorio:  ['dark','#0D1424','#132038','#1A2945','#E8EEF8','#97A6C2','#5A6A8A','#24345A','#1D2B4B','#4FC3D9','#FF7A7A','#F2C46D','#6FD6A8','#5FD3E6','#4F8FE0','#FF7A7A','#5FD3E6','#6FD6A8','#F2A65A','#9F9BF5','#F2C46D'],
  gon:     ['dark','#0D1710','#132118','#1A2B20','#ECF5E8','#9DB5A0','#5E7863','#24392A','#1E3125','#9BE15D','#FF6B5B','#F2C14E','#9BE15D','#C6F27A','#3FBF7F','#FF6B5B','#7DD3FC','#9BE15D','#F2994A','#B794F6','#F2C14E'],
  biscuit: ['dark','#1C1220','#26182B','#301E36','#FFF0F7','#C9A3BB','#80637A','#432A48','#38243D','#FFE08A','#FF7EB0','#FFE08A','#7EE0B5','#FF9EC7','#C3A6FF','#FF7EB0','#8FD3FF','#7EE0B5','#FFB07A','#C3A6FF','#FFE08A'],
  netero:  ['dark','#17110C','#211810','#2B2016','#FFF5EA','#C8B19A','#86705A','#3F2F22','#33261B','#FF9A3C','#FF5E4D','#FFC861','#86D49A','#FFB25E','#F2E6D0','#FF5E4D','#8CCFF0','#86D49A','#FF9A3C','#C7A6E8','#FFC861'],
  kurapika:['dark','#140D12','#1D1219','#261822','#F6EAF0','#B49BA8','#76606C','#3A2632','#2E1E28','#F5C26B','#FF3D5E','#F5C26B','#7DD8A4','#FF4D6D','#F5C26B','#FF3D5E','#7FC8F8','#7DD8A4','#F59E5B','#C9A2FF','#F5C26B'],
  killua:  ['dark','#0C1120','#121A2E','#18223A','#EAF2FF','#93A3C4','#56648A','#22304F','#1C2742','#8CC8FF','#FF7A90','#FFD27A','#7CE0B0','#B6ECFF','#7FA8FF','#FF7A90','#B6ECFF','#7CE0B0','#FFB07A','#B9A2FF','#FFD27A'],
  hisoka:  ['dark','#160C1A','#211128','#2A1633','#FFEFFA','#C39BC0','#7E5C7F','#3D2346','#331C3B','#FFD23F','#FF5C8A','#FFD23F','#6EE7B7','#FF6FB5','#FFD23F','#FF5C8A','#7DD3FC','#6EE7B7','#FB923C','#E879F9','#FFD23F'],
  meruem:  ['dark','#0B110D','#111A14','#17231B','#EEF3E6','#A3B29A','#64725E','#24331F','#1D2A1C','#C9B458','#E0605A','#C9B458','#5DBB8A','#E3CF6E','#5DBB8A','#E0605A','#8FC9D9','#5DBB8A','#D99A4E','#A99AD0','#C9B458'],
  zoldyck: ['dark','#100D16','#17131F','#1E1928','#ECE8F4','#A39CB5','#655E78','#2B2438','#241E30','#B9C4D6','#E5566F','#D8C08A','#7FCFA8','#9FE3FF','#A78BFA','#E5566F','#9FE3FF','#7FCFA8','#E8A06A','#A78BFA','#D8C08A'],
  ryodan:  ['dark','#0E0A0B','#161012','#1E1618','#F3E9EA','#B09A9D','#6E5A5D','#2E2124','#261B1E','#FF4A5A','#FF3347','#E3B25B','#6FCF97','#FF6B6B','#C0394B','#FF3347','#8AB4F8','#6FCF97','#F2994A','#B57EDC','#E3B25B'],
  greed:   ['dark','#0A1512','#0F1E19','#152720','#E9F5EE','#93B5A6','#58776A','#1F3A30','#1A3229','#E8C35A','#F2696B','#E8C35A','#5FD6A0','#7DF0C9','#E8C35A','#F2696B','#7FC8F8','#5FD6A0','#F2A65A','#B79CF2','#E8C35A'],
  abismo:  ['dark','#05080C','#0A1016','#0F1720','#DDF3F2','#86A6A8','#4D6668','#162229','#121C23','#3EE6D0','#FF5D7A','#E7C46A','#3EE6A0','#3EE6D0','#7B6CFF','#FF5D7A','#3EC9E6','#3EE6A0','#FF9F5A','#9B8CFF','#E7C46A'],
  aurora:  ['dark','#070914','#0D1020','#13172C','#EEF0FF','#A4A9CC','#61678C','#21264A','#1A1F3C','#7CF5C4','#FF6FA8','#FFD27A','#7CF5C4','#8FB8FF','#C58BFF','#FF6FA8','#8FB8FF','#7CF5C4','#FFB27A','#C58BFF','#FFD27A'],
  pergaminho:['light','#EFE6D2','#FBF5E6','#F3EAD5','#2B1D14','#6B5544','#A08B76','#DCCDB0','#E5D8BC','#8A4B1F','#B3362F','#A8741A','#4F7A3A','#2F6A8A','#7A4E9C','#B3362F','#2F6A8A','#4F7A3A','#B4521E','#7A4E9C','#A8741A'],
  grafite: ['dark','#141414','#1C1C1C','#232323','#EDEDED','#A0A0A0','#666666','#2E2E2E','#262626','#D0D0D0','#E06C6C','#D8B36A','#7CC08F','#C8C8C8','#B0B0B0','#E06C6C','#9CC4E0','#7CC08F','#D99A6A','#B5A5D6','#D8B36A'],
  sepia:   ['dark','#1A140F','#231B14','#2C2219','#F1E6D6','#BBA88F','#7D6B56','#3A2E22','#30261C','#D9A86A','#D9705A','#D9A86A','#93B07A','#E0C08A','#C99A6A','#D9705A','#A8B8C0','#93B07A','#D98A5A','#B49AB0','#D9A86A'],
  contraste:['dark','#000000','#0A0A0A','#141414','#FFFFFF','#E0E0E0','#9A9A9A','#3A3A3A','#262626','#FFE600','#FF4D4D','#FFE600','#3DFF8A','#00E5FF','#FFFFFF','#FF4D4D','#00E5FF','#3DFF8A','#FF9A3D','#C78BFF','#FFE600'],
  nevoa:   ['light','#E9ECEF','#F7F8F9','#EEF0F2','#22262B','#5E6670','#98A0A8','#D5DAE0','#DDE2E7','#4A6A8A','#C0505A','#A88440','#4A8A64','#4A7FB0','#6A62B8','#C0505A','#3E8AB0','#4A8A64','#C07040','#7A62B0','#A88440'],
  claro:   ['light','#F4F5F9','#FFFFFF','#F3F4FA','#1B1E2E','#5B6180','#989EB6','#E1E4EE','#E8EAF2','#2F5FD0','#D6455D','#B7812A','#2F8A55','#1F78C8','#6B4FD8','#D6455D','#1F86B8','#2F8A55','#D0661F','#7E57C2','#B7812A'],
};
const palStyle = k => { const p = PALS[k] || PALS.painel; return TK.map((t,i) => `--${t}:${p[i+1]}`).join(';') + `;color-scheme:${p[0]}`; };
const COS = [
  {id:'pal-simples', cat:'pal', n:'Simples', d:'Cinza-azulado, sem brilho. É onde todo Hunter começa.', p:0, eq:{theme:'simples'}},
  {id:'pal-leorio', cat:'pal', n:'Leorio', d:'Azul-marinho do terno, detalhes em turquesa.', p:600, eq:{theme:'leorio'}},
  {id:'pal-claro', cat:'pal', n:'Claro', d:'Fundo claro, para o dia.', p:700, eq:{theme:'claro'}},
  {id:'pal-gon', cat:'pal', n:'Gon', d:'Verde de floresta e vara de pescar.', p:800, eq:{theme:'gon'}},
  {id:'pal-biscuit', cat:'pal', n:'Biscuit', d:'Rosa e dourado, mais forte do que parece.', p:900, eq:{theme:'biscuit'}},
  {id:'pal-kurapika', cat:'pal', n:'Kurapika', d:'Olhos escarlates e correntes de ouro.', p:1000, eq:{theme:'kurapika'}},
  {id:'pal-netero', cat:'pal', n:'Netero', d:'Laranja e marfim do presidente da Associação.', p:1100, eq:{theme:'netero'}},
  {id:'pal-killua', cat:'pal', n:'Killua', d:'Azul elétrico. Só a paleta, sem efeitos.', p:1200, eq:{theme:'killua'}},
  {id:'pal-hisoka', cat:'pal', n:'Hisoka', d:'Rosa e amarelo. Só vem no pacote Hisoka.', p:0, excl:'th-hisoka', eq:{theme:'hisoka'}},
  {id:'pal-meruem', cat:'pal', n:'Meruem', d:'Verde-escuro e ouro real. Só vem no pacote Meruem.', p:0, excl:'th-meruem', eq:{theme:'meruem'}},
  {id:'pal-pergaminho', cat:'pal', n:'Pergaminho', d:'Papel envelhecido e tinta sépia. Clara, para estudar de dia.', p:1100, eq:{theme:'pergaminho'}},
  {id:'pal-zoldyck', cat:'pal', n:'Zoldyck', d:'Roxo-noite e prata da mansão, com olhos azul-gelo.', p:1300, eq:{theme:'zoldyck'}},
  {id:'pal-ryodan', cat:'pal', n:'Genei Ryodan', d:'Preto e vermelho-sangue. A aranha de doze patas.', p:1400, eq:{theme:'ryodan'}},
  {id:'pal-greed', cat:'pal', n:'Greed Island', d:'Verde de cartão e o dourado do console Joystation.', p:1400, eq:{theme:'greed'}},
  {id:'pal-abismo', cat:'pal', n:'Continente Negro', d:'Preto abissal com turquesa bioluminescente.', p:1600, eq:{theme:'abismo'}},
  {id:'pal-aurora', cat:'pal', n:'Aurora', d:'Índigo profundo com verde e rosa de aurora. Só vem no pacote Ascensão.', p:0, excl:'th-ascensao', eq:{theme:'aurora'}},
  {id:'tx-manga', cat:'tex', n:'Retícula de mangá', d:'Pontinhos de retícula no fundo de todas as telas.', p:2000, eq:{bg:'manga'}},
  {id:'tx-arena', cat:'tex', n:'Ladrilhos da Arena', d:'O piso quadriculado do ringue, bem discreto.', p:2200, eq:{bg:'arena'}},
  {id:'tx-ceu', cat:'tex', n:'Céu da Arena', d:'Um clarão no topo, como o céu visto do andar 200.', p:2500, eq:{bg:'ceu'}},
  {id:'tx-nen', cat:'tex', n:'Névoa de Nen', d:'Duas manchas de aura nos cantos.', p:3000, eq:{bg:'nen'}},
  {id:'tx-scan', cat:'tex', n:'Tela de fliperama', d:'Linhas de tubo de TV e os cantos escurecidos, como num arcade.', p:1800, eq:{bg:'scan'}},
  {id:'tx-grao', cat:'tex', n:'Papel antigo', d:'Grão fino de papel em todas as telas. Fica ótimo com o Pergaminho.', p:2000, eq:{bg:'grao'}},
  {id:'tx-hex', cat:'tex', n:'Colmeia das Quimeras', d:'Favos hexagonais do ninho das Formigas Quimera.', p:2400, eq:{bg:'hex'}},
  {id:'tx-teia', cat:'tex', n:'Teia da Aranha', d:'Uma teia enorme saindo do canto da tela.', p:2800, eq:{bg:'teia'}},
  {id:'tx-cartas', cat:'tex', n:'Baralho', d:'Losangos de baralho no fundo. Só vem no pacote Hisoka.', p:0, excl:'th-hisoka', eq:{bg:'cartas'}},
  {id:'fx-shake', cat:'fx', n:'Fúria visível', d:'O chefão em fúria treme de raiva.', p:1000, fx:'shake'},
  {id:'fx-shim', cat:'fx', n:'Barra elétrica', d:'A barra de XP corre como eletricidade.', p:1200, fx:'shim'},
  {id:'fx-aura', cat:'fx', n:'Aura do avatar', d:'O seu avatar pulsa com a aura.', p:1500, fx:'aura', grupo:1},
  {id:'fx-zap', cat:'fx', n:'Raio no aviso', d:'Os avisos chegam com um clarão.', p:2000, fx:'zap'},
  {id:'fx-drift', cat:'fx', n:'Aura ambiente', d:'Uma névoa de Nen passeia devagar no fundo.', p:3000, fx:'drift'},
  {id:'fx-digita', cat:'fx', n:'Terminal vivo', d:'Ao trocar de aba, os títulos aparecem digitados, letra por letra.', p:1500, fx:'digita'},
  {id:'fx-corrente', cat:'fx', n:'Corrente de Kurapika', d:'A barra de XP vira uma corrente de elos dourados correndo.', p:1800, fx:'corrente'},
  {id:'fx-gyo', cat:'fx', sec:'hover', n:'Gyo', d:'Os cards acendem com aura exatamente onde o mouse passa.', p:2800, fx:'gyo'},
  {id:'fx-estrelas', cat:'fx', n:'Poeira de Nen', d:'Partículas de aura sobem devagar pelo fundo de todas as telas.', p:3200, fx:'estrelas'},
  {id:'fx-rastro', cat:'fx', n:'Rastro de aura', d:'O cursor deixa um rastro de aura por onde passa.', p:3500, fx:'rastro'},
  {id:'fx-ascensao', cat:'fx', n:'Ascensão', d:'Uma aurora gira devagar atrás da página inteira. Só vem no pacote Ascensão.', p:0, excl:'th-ascensao', fx:'ascensao'},
  {id:'fx-jajanken', cat:'fx', ev:1, n:'Jajanken', d:'Concluiu? PEDRA! em letra de mangá, com onda de choque.', p:2000, fx:'jajanken'},
  {id:'fx-baralho', cat:'fx', ev:1, n:'Cartas do Hisoka', d:'Cada tarefa concluída solta um leque de cartas de baralho girando.', p:2200, fx:'baralho'},
  {id:'fx-confete', cat:'fx', ev:1, n:'Confete no andar novo', d:'Subiu de andar ou derrotou um chefão? Chove confete.', p:2500, fx:'confete'},
  {id:'fx-fogos', cat:'fx', ev:1, n:'Fogos no andar novo', d:'Subiu de andar ou derrotou um chefão? Fogos de artifício na tela toda.', p:2800, fx:'fogos'},
  {id:'fx-godspeed', cat:'fx', ev:1, n:'Godspeed', d:'Cada tarefa concluída dispara um raio azul que corta a tela, com clarão.', p:3000, fx:'godspeed'},
  {id:'fr-hunter', cat:'frame', n:'Moldura Hunter ★', d:'Aro dourado de quem tem licença.', p:500, eq:{frame:'hunter'}, grupo:1},
  {id:'fr-volt', cat:'frame', n:'Moldura elétrica', d:'Aro tracejado com brilho azul.', p:900, eq:{frame:'volt'}},
  {id:'fr-nen', cat:'frame', n:'Moldura de aura', d:'O aro ganha a cor do seu tipo de Nen.', p:1200, eq:{frame:'nen'}},
  {id:'fr-carta', cat:'frame', n:'Carta de Greed Island', d:'O avatar vira uma carta: cantos retos e borda dourada dupla.', p:1600, eq:{frame:'carta'}, grupo:1},
  {id:'fr-escarlate', cat:'frame', n:'Olhos escarlates', d:'Um brilho vermelho que pulsa devagar, como a raiva do Kurapika.', p:2000, eq:{frame:'escarlate'}, grupo:1},
  {id:'fr-giro', cat:'frame', n:'Anel de aura', d:'Um anel com as cores da paleta gira sem parar em volta do avatar.', p:3500, eq:{frame:'giro'}, grupo:1},
  {id:'fr-aranha', cat:'frame', n:'Moldura da Aranha', d:'Aro duplo vermelho. Só depois de derrotar um chefão.', p:1500, eq:{frame:'aranha'}, grupo:1, lock:S => !S.bs.some(b => b.dead), why:'derrote um chefão'},
  {id:'tt-transm', cat:'title', n:'Título: Transmutador', d:'Aparece embaixo do seu andar.', p:300, eq:{title:'Transmutador'}},
  {id:'tt-cacador', cat:'title', n:'Título: Caçador de Aranhas', d:'Para a temporada do Genei Ryodan.', p:300, eq:{title:'Caçador de Aranhas'}},
  {id:'tt-zetsu', cat:'title', n:'Título: Mestre do Zetsu', d:'Para quem sabe descansar sem perder o ritmo.', p:500, eq:{title:'Mestre do Zetsu'}},
  {id:'tt-godspeed', cat:'title', n:'Título: Segunda Natureza', d:'Grátis para quem tem a carta Segunda natureza (um hábito em 30 dias).', p:0, eq:{title:'Segunda Natureza'}, lock:S => S.hab.max < 30, why:'carta Segunda natureza'},
  {id:'tt-silencio', cat:'title', n:'Título: Passos Silenciosos', d:'Para quem estuda sem fazer barulho.', p:400, eq:{title:'Passos Silenciosos'}},
  {id:'tt-guarda', cat:'title', n:'Título: Guarda Real', d:'Leal ao próprio plano de estudos.', p:600, eq:{title:'Guarda Real'}},
  {id:'tt-ten', cat:'title', n:'Título: Ten Inabalável', d:'Grátis para quem já manteve o Ten por 21 dias.', p:0, eq:{title:'Ten Inabalável'}, lock:S => S.ten.max < 21, why:'Ten de 21 dias'},
  {id:'tt-estrela2', cat:'title', n:'Título: Hunter Duas Estrelas', d:'Grátis para quem derrotou dois chefões na temporada.', p:0, eq:{title:'Hunter ★★'}, lock:S => S.bs.filter(b => b.dead).length < 2, why:'derrote 2 chefões'},
  {id:'tt-mestre', cat:'title', n:'Título: Mestre de Nen', d:'Grátis para quem chegou ao andar 100.', p:0, eq:{title:'Mestre de Nen'}, lock:S => S.a.n < 100, why:'chegue ao andar 100'},
  {id:'tt-floor', cat:'title', n:'Título: Floor Master', d:'Grátis para quem chegou ao andar 200.', p:0, eq:{title:'Floor Master'}, lock:S => S.a.n < 200, why:'chegue ao andar 200'},
  {id:'ft-maquina', cat:'font', n:'Máquina de escrever', d:'A página inteira em letra de terminal. Modo hacker.', p:900, eq:{font:'maquina'}},
  {id:'ft-manga', cat:'font', n:'Mangá', d:'Títulos em letra de capa de mangá e números de onomatopeia.', p:1200, eq:{font:'manga'}},
  {id:'ft-pixel', cat:'font', n:'Pixel', d:'Títulos e números em letra de videogame antigo.', p:1500, eq:{font:'pixel'}},
  {id:'ft-arcade', cat:'font', n:'Arcade japonês', d:'Letra de fliperama japonês nos títulos e números.', p:1500, eq:{font:'arcade'}},
  {id:'sm-moeda', cat:'som', n:'Moeda', d:'Um plim de moeda a cada tarefa; uma escadinha de notas no andar novo.', p:1000, eq:{som:'moeda'}},
  {id:'sm-golpe', cat:'som', n:'Golpe', d:'Um soco seco a cada tarefa; dois golpes no andar novo.', p:1200, eq:{som:'golpe'}},
  {id:'sm-sino', cat:'som', n:'Sino do templo', d:'Um sino longo e calmo, como no treino com a Biscuit.', p:1400, eq:{som:'sino'}},
  {id:'sm-fanfarra', cat:'som', n:'Fanfarra 8-bit', d:'Blips de videogame a cada tarefa e uma fanfarra inteira no andar novo.', p:2500, eq:{som:'fanfarra'}},
  {id:'th-killua', cat:'full', n:'Pacote Killua', d:'Paleta Killua, céu da Arena e barra elétrica.', p:6000, eq:{theme:'killua', bg:'ceu'}, fxs:['shim'], parts:['pal-killua','tx-ceu','fx-shim'], antes:['fx-aura']},
  {id:'th-hisoka', cat:'full', n:'Pacote Hisoka', d:'Rosa e amarelo, losangos de baralho no fundo, fúria que treme e avisos com clarão.', p:8000, eq:{theme:'hisoka', bg:'cartas'}, fxs:['shake','zap'], parts:['pal-hisoka','tx-cartas','fx-shake','fx-zap']},
  {id:'th-meruem', cat:'full', n:'Pacote Meruem', d:'Verde-escuro e ouro real, névoa de Nen e aura ambiente.', p:10000, eq:{theme:'meruem', bg:'nen'}, fxs:['drift'], parts:['pal-meruem','tx-nen','fx-drift'], antes:['fx-aura']},
  {id:'th-ryodan', cat:'full', n:'Pacote Genei Ryodan', d:'Preto e vermelho, a teia no canto, cartas a cada tarefa e o Gyo nos cards.', p:8500, eq:{theme:'ryodan', bg:'teia'}, fxs:['baralho','gyo'], parts:['pal-ryodan','tx-teia','fx-baralho','fx-gyo']},
  {id:'th-greed', cat:'full', n:'Pacote Greed Island', d:'Verde de cartão, tela de fliperama, letra de arcade, terminal vivo e poeira de Nen.', p:8800, eq:{theme:'greed', bg:'scan', font:'arcade'}, fxs:['digita','estrelas'], parts:['pal-greed','tx-scan','ft-arcade','fx-digita','fx-estrelas']},
  {id:'th-zoldyck', cat:'full', n:'Pacote Zoldyck', d:'Roxo e prata, papel antigo, Godspeed a cada tarefa e o rastro de aura no cursor.', p:9000, eq:{theme:'zoldyck', bg:'grao'}, fxs:['godspeed','rastro'], parts:['pal-zoldyck','tx-grao','fx-godspeed','fx-rastro']},
  {id:'th-ascensao', cat:'full', n:'Pacote Ascensão', d:'Paleta Aurora e a aurora girando atrás de tudo (só aqui), poeira de Nen, fogos e o sino do templo.', p:25000, eq:{theme:'aurora', bg:'', som:'sino'}, fxs:['ascensao','estrelas','fogos'], parts:['pal-aurora','fx-ascensao','fx-estrelas','fx-fogos','sm-sino'], antes:['fr-giro']},
  {id:'px-unlock', cat:'px', n:'Mundo pixel', d:'Abre o mapa, a ficha, o Greed Island e a Masadora pixel, com as peles padrão.', p:8000, sw:['#5FA35A','#3E7CC9','#F3E6C8','#EFEAF7','#2A2140']},
  {id:'px-map-tarde', cat:'px', n:'Mapa · Tarde', d:'Pele do mapa.', p:1500, need:'px-unlock', skin:['map','tarde'], sw:['#E8A35A','#C9974A','#C7517A','#F3D9A0','#2A1830']},
  {id:'px-map-noite', cat:'px', n:'Mapa · Noite', d:'Pele do mapa.', p:1500, need:'px-unlock', skin:['map','noite'], sw:['#1F3A3A','#14205A','#7C8BB8','#070A18','#FFD45E']},
  {id:'px-p1-gb', cat:'px', n:'Ficha · Game Boy', d:'Pele da ficha.', p:1500, need:'px-unlock', skin:['p1','gameboy'], sw:['#9BBC0F','#8BAC0F','#306230','#0F380F','#C4DE6B']},
  {id:'px-p1-noite', cat:'px', n:'Ficha · Noite', d:'Pele da ficha.', p:1500, need:'px-unlock', skin:['p1','noite'], sw:['#151229','#3B2E6E','#7FE0A0','#B49CFF','#E8E2FF']},
  {id:'px-gi-joy', cat:'px', n:'Greed Island · Joystation', d:'Pele do Book pixel.', p:1500, need:'px-unlock', skin:['p3','joy'], sw:['#2B2346','#0F0E1A','#FF6FB5','#6FE3FF','#FFD166']},
  {id:'px-gi-noite', cat:'px', n:'Greed Island · Noite', d:'Pele do Book pixel.', p:1500, need:'px-unlock', skin:['p3','noite'], sw:['#0B1026','#141B3A','#FFB547','#7FD1FF','#C9A2FF']},
  {id:'px-ms-neon', cat:'px', n:'Masadora · Neon', d:'Pele da loja pixel.', p:1500, need:'px-unlock', skin:['p3b','neon'], sw:['#0E0B1F','#1D1840','#FF5FA2','#6FE3FF','#E9E6FF']},
  /* itens novos (#135): só para provar até os preços da #77 */
  {id:'pal-grafite', cat:'pal', prova:1, n:'Grafite', d:'Cinza puro, sem matiz.', p:0, eq:{theme:'grafite'}},
  {id:'pal-sepia', cat:'pal', prova:1, n:'Sépia', d:'Marrom de fotografia antiga, escuro.', p:0, eq:{theme:'sepia'}},
  {id:'pal-contraste', cat:'pal', prova:1, n:'Alto contraste', d:'Preto, branco e cores puras. Para ler sem esforço.', p:0, eq:{theme:'contraste'}},
  {id:'pal-nevoa', cat:'pal', prova:1, n:'Névoa', d:'Cinza-claro frio, para o dia.', p:0, eq:{theme:'nevoa'}},
  {id:'fr-fina', cat:'frame', prova:1, n:'Moldura fina', d:'Um aro fino na cor do texto.', p:0, eq:{frame:'fina'}},
  {id:'fr-dupla', cat:'frame', prova:1, n:'Moldura dupla', d:'Aro duplo discreto.', p:0, eq:{frame:'dupla'}},
  {id:'sm-clique', cat:'som', prova:1, n:'Clique', d:'Um clique seco de teclado a cada tarefa.', p:0, eq:{som:'clique'}},
  {id:'sm-gota', cat:'som', prova:1, n:'Gota', d:'Uma gota d’água a cada tarefa.', p:0, eq:{som:'gota'}},
  {id:'bd-dupla', cat:'borda', prova:1, n:'Borda dupla', d:'Os cards ganham borda dupla.', p:0, eq:{borda:'dupla'}},
  {id:'bd-corte', cat:'borda', prova:1, n:'Canto cortado', d:'Borda fina com dois cantos cortados em diagonal.', p:0, eq:{borda:'corte'}},
  {id:'bd-cantos', cat:'borda', prova:1, n:'Cantos', d:'Os quatro cantos marcados, como um visor, e o resto da borda bem fraco.', p:0, eq:{borda:'cantos'}},
  {id:'bd-corrente', cat:'borda', prova:1, n:'Corrente do Kurapika', d:'A borda vira uma corrente de elos dourados.', p:0, eq:{borda:'corrente'}},
  {id:'bd-aura', cat:'borda', prova:1, n:'Borda de aura viva', d:'A borda respira na cor do seu tipo de Nen.', p:0, eq:{borda:'aura'}},
  {id:'hv-contorno', cat:'hover', prova:1, n:'Contorno', d:'O card ganha contorno quando o mouse passa.', p:0, eq:{hover:'contorno'}},
  {id:'hv-shu', cat:'hover', prova:1, n:'Shu', d:'O card se cobre de aura, como um objeto reforçado com Shu.', p:0, eq:{hover:'shu'}},
  {id:'hv-vira', cat:'hover', prova:1, n:'Carta que vira', d:'O card dá uma volta, como uma carta de Greed Island.', p:0, eq:{hover:'vira'}},
  {id:'hv-en', cat:'hover', prova:1, n:'En', d:'Um círculo de aura se espalha a partir do cursor.', p:0, eq:{hover:'en'}},
  {id:'hv-bungee', cat:'hover', prova:1, n:'Bungee Gum', d:'O card estica e volta, como o chiclete do Hisoka.', p:0, eq:{hover:'bungee'}},
  {id:'cr-ioio', cat:'cursor', prova:1, n:'Ioiô do Killua', d:'O cursor vira o ioiô.', p:0, eq:{cursor:'ioio'}},
  {id:'cr-carta', cat:'cursor', prova:1, n:'Carta do Hisoka', d:'O cursor vira uma carta.', p:0, eq:{cursor:'carta'}},
  {id:'cr-agulha', cat:'cursor', prova:1, n:'Agulha do Illumi', d:'O cursor vira uma agulha.', p:0, eq:{cursor:'agulha'}},
  {id:'hp-corrente', cat:'hp', prova:1, n:'HP de corrente', d:'A vida do chefão vira uma corrente.', p:0, eq:{hp:'corrente'}},
  {id:'hp-cristal', cat:'hp', prova:1, n:'HP de cristal', d:'A vida do chefão vira cristal.', p:0, eq:{hp:'cristal'}},
  {id:'hm-cartas', cat:'heat', prova:1, n:'Constância em cartas', d:'Os quadradinhos do heatmap viram cartas.', p:0, eq:{heat:'cartas'}},
  {id:'hm-pegadas', cat:'heat', prova:1, n:'Constância em pegadas', d:'Os quadradinhos viram pegadas.', p:0, eq:{heat:'pegadas'}},
  {id:'hm-chamas', cat:'heat', prova:1, n:'Constância em chamas', d:'Os dias jogados viram chamas acesas.', p:0, eq:{heat:'chamas'}},
  {id:'hm-gungi', cat:'heat', prova:1, n:'Constância no Gungi', d:'O heatmap vira o tabuleiro do Meruem e da Komugi: cada dia jogado é uma peça, empilhada até três; o dia salvo é o rei.', p:0, eq:{heat:'gungi'}},
  {id:'tr-deslizar', cat:'trans', prova:1, n:'Deslizar', d:'As abas deslizam ao trocar.', p:0, eq:{trans:'deslizar'}},
  {id:'tr-glitch', cat:'trans', prova:1, n:'Glitch', d:'A tela falha por um instante ao trocar de aba.', p:0, eq:{trans:'glitch'}},
  {id:'tr-fumaca', cat:'trans', prova:1, n:'Fumaça do Morel', d:'Ao trocar de aba, a fumaça do Deep Purple cobre a tela e se desfaz já na aba nova.', p:0, eq:{trans:'fumaca'}},
  {id:'fx-costura', cat:'fx', ev:1, prova:1, n:'Costura da Machi', d:'Ao concluir, o card racha no meio e os fios de nen da Machi o costuram de volta, ponto a ponto, até o fio ser puxado.', p:0, fx:'costura'},
  {id:'fx-soco', cat:'fx', ev:1, prova:1, n:'Soco remoto do Leorio', d:'Subiu de andar? Um portal de nen abre ao lado do card e o punho do Leorio sai dele e acerta a borda.', p:0, fx:'soco'},
  {id:'fx-dragao', cat:'fx', ev:1, prova:1, n:'Dragon Dive', d:'Subiu de andar? O dragão de aura do Zeno sobe do card, dá a volta no alto e desce em chuva de dragõezinhos.', p:0, fx:'dragao'},
  {id:'fx-rastro-fio', cat:'fx', prova:1, n:'Fio de aura', d:'Uma fita de aura presa ao cursor, que chicoteia nas viradas e se recolhe quando ele para.', p:0, fx:'rastro-fio'},
  {id:'fx-rastro-eco', cat:'fx', prova:1, n:'Eco do Killua', d:'Rápido, o cursor deixa ecos de si, como o Rhythm Echo; ao parar, eles o alcançam num lampejo.', p:0, fx:'rastro-eco'},
  {id:'tr-aspira', cat:'trans', prova:1, n:'Deme-chan', d:'Ao trocar de aba, a aba velha é sugada para o canto, como pelo bocal da Deme-chan.', p:0, eq:{trans:'aspira'}},
  {id:'px-ms-papel', cat:'px', n:'Masadora · Papel', d:'Pele da loja pixel.', p:1500, need:'px-unlock', skin:['p3b','papel'], sw:['#EFE6D2','#D8C7A3','#FFFBF1','#B4521E','#2B1D14']},
];
/* fotos de perfil: cada PNG de web/a/ (o banco do repositório) vira um item da loja. Preço padrão 1.000 J; estas são grátis. */
const AV_GRATIS = ['logo','hunter-x-hunter','killua-2'];
const avNome = f => f.replace(/[-_]+/g,' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
/* nomes das fotos antes do banco web/a/ (0.6.2-beta5): o que foi comprado ou equipado com o nome antigo passa para o novo */
const AV_ANTIGO = {'gon':'gon-1', 'gon-olhaputo':'gon-2', 'killua':'killua-1', 'killua-png':'killua-2', 'kulluaface':'killua-3',
  '702-7023783_transparent-killua-png-png-d':'killua-4', 'kurapika':'kurapika-1', 'leorio':'leorio-1', 'leorio2':'leorio-2',
  'leorio-png':'leorio-3', 'leorio-png-leorio':'leorio-4', 'hunter-x-hunter-logo-png-image':'hunter-x-hunter'};
/* fotos marcadas como chefão (#33): web/chefoes/SLUG.png. Quem desenvolve decide quais fotos entram nesta lista. Cada uma é
   vendida como retrato de chefão (ch-SLUG): o ícone do avaliacoes.txt é o padrão e é sempre do jogador; o retrato comprado vai
   para a coleção, e em Loja → Comprados ele escolhe o chefão (um dono por retrato). Na compra, vai sozinho para o chefão de
   mesmo nome (alvo), se houver. A versão de perfil (av-ch-SLUG) não se compra: vem de graça quando o chefão que está com o
   retrato é derrotado, e a imagem desse chefão fica travada (travas no estado.json), mesmo se ele voltar à vida.
   [slug, nome, alvo] */
const RETRATOS = [['chrollo','Chrollo Lucilfer','Chrollo'],['feitan','Feitan Portor','Feitan'],['machi','Machi Komacine','Machi'],['uvogin','Uvogin','Uvogin'],
  ['nobunaga','Nobunaga Hazama','Nobunaga'],['shalnark','Shalnark','Shalnark'],['phinks','Phinks Magcub','Phinks'],['pakunoda','Pakunoda','Pakunoda'],
  ['hisoka','Hisoka Morow','Hisoka'],['illumi','Illumi Zoldyck','Illumi'],['genthru','Genthru','Genthru'],['neferpitou','Neferpitou','Neferpitou'],
  ['shaiapouf','Shaiapouf','Shaiapouf'],['youpi','Menthuthuyoupi','Youpi'],['meruem','Meruem','Meruem']];
const RETRATO_PRECO = 1500;   // até a 0.9.1; desde a #135 são grátis, e quem comprou recebe a Jenny de volta (retratosJ)
COS.push(...RETRATOS.map(([s, n, alvo]) => ({id:'ch-'+s, cat:'chefe', n, d:'Retrato para o card de um chefão. Derrote esse chefão e ele vira foto de perfil.', p:0, img:'chefoes/'+s+'.png', alvo})),
  ...RETRATOS.map(([s, n]) => ({id:'av-ch-'+s, cat:'avatar', n, d:'Foto de perfil liberada ao derrotar o chefão que estava com este retrato.', p:0, eq:{avatar:'ch-'+s}, img:'chefoes/'+s+'.png', chefao:'ch-'+s})));
/* faixa (fa) e tema (hxh) de cada item da Masadora (#135, regra na #17). Comum: muda uma coisa só, sem animação. Raro: a tela
   toda sem animação, ou um efeito pontual. Épico: animação contínua ou a cada tarefa. Lendário: exclusivo e marcante.
   Os pacotes (cat full) e as peças que só vêm num pacote (excl) ficam sem faixa. HxH = o visual remete ao anime; nome com
   Nen ou Arena não conta, porque esses nomes trocam com o tema. Os preços por faixa saem da #77 */
const FAIXA = {
  comum: 'pal-leorio pal-claro pal-gon pal-biscuit pal-kurapika pal-netero pal-pergaminho pal-killua pal-zoldyck pal-ryodan pal-greed pal-abismo pal-grafite pal-sepia pal-contraste pal-nevoa fx-shake fx-zap fr-hunter fr-volt fr-nen fr-carta fr-fina fr-dupla tt-transm tt-cacador tt-silencio tt-zetsu tt-guarda sm-moeda sm-golpe sm-sino sm-clique sm-gota px-map-tarde px-map-noite px-p1-gb px-p1-noite px-gi-joy px-gi-noite px-ms-neon px-ms-papel bd-dupla bd-corte bd-cantos hv-contorno tr-deslizar',
  raro: 'hm-gungi tx-scan tx-manga tx-grao tx-arena tx-hex tx-ceu tx-teia tx-nen fx-aura fx-digita fx-corrente fx-shim fx-confete fx-fogos fx-soco fx-drift fr-aranha fr-escarlate fr-giro tt-godspeed tt-floor tt-ten tt-estrela2 tt-mestre ft-maquina ft-manga ft-pixel ft-arcade sm-fanfarra bd-corrente hv-shu hv-vira cr-ioio cr-carta cr-agulha hp-corrente hp-cristal hm-cartas hm-pegadas tr-glitch tr-fumaca tr-aspira',
  epico: 'fx-costura fx-dragao fx-gyo fx-jajanken fx-baralho fx-godspeed fx-estrelas fx-rastro fx-rastro-fio fx-rastro-eco px-unlock bd-aura hv-en hv-bungee hm-chamas',
};
const HXH = new Set(('pal-leorio pal-gon pal-biscuit pal-kurapika pal-netero pal-killua pal-zoldyck pal-ryodan pal-greed pal-abismo pal-hisoka pal-meruem tx-hex tx-teia tx-cartas ' +
  'fx-corrente fx-shim fx-costura fx-soco fx-dragao fx-gyo fx-jajanken fx-baralho fx-godspeed fx-rastro-eco fr-hunter fr-carta fr-aranha fr-escarlate tt-transm tt-cacador tt-silencio tt-zetsu tt-guarda tt-floor tt-ten tt-estrela2 tt-mestre ' +
  'px-gi-joy px-gi-noite th-killua th-hisoka th-meruem th-ryodan th-greed th-zoldyck bd-corrente hv-shu hv-vira hv-en hv-bungee cr-ioio cr-carta cr-agulha hp-corrente hm-cartas hm-gungi tr-fumaca tr-aspira').split(' '));
for(const [fa, ids] of Object.entries(FAIXA)) for(const id of ids.split(' ')){ const it = COS.find(i => i.id === id); if(it) it.fa = fa; }
for(const it of COS){ if(it.cat === 'chefe'){ it.fa = 'raro'; it.hxh = 1; } else if(HXH.has(it.id)) it.hxh = 1; }
const FAIXAS_LOJA = [['comum','Comum'],['raro','Raro'],['epico','Épico'],['lenda','Lendário']];
/* pacote (ex-tema completo): comprar o pacote dá cada peça (paleta, textura, efeitos) para usar e misturar separado.
   antes = peças que saíram do pacote (foram para a loja do grupo, #43): só quem comprou o pacote antes da #135 continua com
   elas: a compra do pacote desde a #135 fica registrada com pacote:1 (estado.json → compras) */
function expandeOwn(own, compras){
  const novos = new Set((compras || []).filter(c => c && c.tipo === 'cos' && c.pacote).map(c => c.id));
  for(const it of COS) if(it.parts && own.has(it.id)){ it.parts.forEach(p => own.add(p)); if(it.antes && !novos.has(it.id)) it.antes.forEach(p => own.add(p)); }
  return own;
}
/* preço do pacote: sem nenhuma peça, o de hoje (it.p). Cada peça que o jogador já tem desconta na proporção do valor dela;
   a peça exclusiva (só vem no pacote) vale a média das avulsas, e a que saiu do pacote (antes) conta como já descontada.
   Até a #77 os pacotes mantêm o preço da 0.9.1; lá, o p de cada pacote vira a soma das peças com 20% de desconto */
function pacote(it, own){
  const todas = it.parts.concat(it.antes || []), item = id => COS.find(i => i.id === id) || {p:0};
  const avulsas = todas.map(item).filter(i => i.p > 0), media = avulsas.reduce((s, i) => s + i.p, 0) / Math.max(1, avulsas.length);
  const peso = id => { const i = item(id); return i.p > 0 ? i.p : media; }, total = todas.reduce((s, id) => s + peso(id), 0);
  const faltam = it.parts.filter(id => !own.has(id)), tem = it.parts.length - faltam.length;
  const p = own.has(it.id) || !faltam.length ? 0 : Math.round(it.p * faltam.reduce((s, id) => s + peso(id), 0) / total / 100) * 100;
  return {p, tem, n:it.parts.length, completo:!faltam.length || own.has(it.id)};
}
/* a loja: os itens do jogo, as fotos de web/a/ e o que está na coleção permanente do jogador (colecao/ dos dados, #33) mas
   não está mais na loja desta versão (fora: continua dele, mesmo que a loja mude de temporada) */
function catalogo(avatares, colecao){
  const cat = COS.concat(['logo'].concat((avatares||[]).filter(f => f !== 'logo')).map(f => ({id:'av-'+f, cat:'avatar', n:avNome(f), d:'Foto de perfil das páginas do jogo.', p: AV_GRATIS.includes(f) ? 0 : 1000, eq:{avatar:f}, fa:'comum', ...(f === 'logo' ? {} : {hxh:1}), ...(f === 'logo' ? {} : {img:'a/'+f+'.png'})})));
  const ja = new Set(cat.map(i => i.id));
  for(const it of Object.values((colecao && colecao.itens) || {})) if(it && typeof it.id === 'string' && !ja.has(it.id)) cat.push({...it, fora:1});
  return cat;
}
/* item que vem com o jogo: grátis e sem trava (a Simples, as fotos grátis). Fica sempre em Comprados, nunca na vitrine */
const padrao = it => !it.p && !it.excl && !it.lend && !it.fora && !it.chefao && !it.lock && !it.prova && !it.grupo;
/* a cópia do item que vai para a coleção permanente: só os campos que bastam para mostrar e equipar sem a loja, e de onde
   ele veio (como: compra | chefao | migracao; origem: masadora | grupo; temporada). O servidor dá a cada item um uid e
   começa o histórico dele (hist), para um dia dar para trocar ou vender itens pelo grupo */
const CAMPOS_COLECAO = ['id','cat','n','d','p','img','eq','fx','fxs','parts','skin','ev','sw','chefao'];
const itemColecao = (it, quando, extra) => Object.assign(Object.fromEntries(CAMPOS_COLECAO.filter(k => it[k] != null).map(k => [k, it[k]])), {quando, origem:'masadora', como:'compra'}, extra || {});
/* chave da trava de um chefão derrotado: temporada + sigla (a sigla pode voltar em outra temporada) */
const travaChave = (T, d) => nomeTemporada(T) + ':' + d;
/* imagem de um item: a cópia da coleção (pasta de dados) quando já está lá; senão a do jogo (web/) */
const imgDe = (it, colecao) => { const c = colecao && colecao.itens && colecao.itens[it.id]; return c && c.arquivo ? 'colecao/' + c.arquivo : it.img || ''; };
/* prêmios reais padrão, por faixa [faixa, preço em J, [[nome, ícone, R$ do cofre]]]. Cada jogador troca os seus na Masadora
   (editar meus prêmios), que grava a lista em estado.json (premios: [{n, p, rs, ic}]) e o cofre por mês (cofreMes). */
const REAIS = [
  ['pequeno',250,[['1h de videogame num dia de semana','tra',0],['Contest virtual só por diversão','tra',0],['30 min de leitura de lazer','scroll',0],['1h de série ou vídeo sem culpa','esp',0]]],
  ['médio',1300,[['Pular uma recorrente sem perder o Ten','moon',0],['Manhã de sábado livre','moon',0],['Tarde de projeto 100% pessoal','con',0],['2–3h de videogame no fim de semana','tra',0],['Item pequeno','coin',20]]],
  ['grande',5000,[['Dia inteiro de projeto pessoal','con',0],['Sábado inteiro de videogame','tra',0],['Livro ou mangá físico','scroll',60],['Jogo novo','tra',60],['Upgrade pequeno de setup','coin',80]]],
  ['épico',20000,[['Upgrade grande de setup (cofre acumulado)','coin',500],['Curso por gosto','int',300],['Uma semana sem nenhuma tarefa','moon',0]]],
];

const PREMIOS_PADRAO = REAIS.flatMap(([, p, list]) => list.map(([n, ic, rs]) => ({n, p, rs, ic})));
const premios = EST => Array.isArray(EST && EST.premios) ? EST.premios.filter(x => x && x.n) : PREMIOS_PADRAO;
/* cofre do mês opcional (0.6.6, #34): desligado por padrão, liga em Configurações (cofreMes > 0). Sem cofreMes gravado, quem já
   tinha gastado do cofre continua com ele, no valor padrão */
const cofreMes = EST => EST && typeof EST.cofreMes === 'number' ? Math.max(0, EST.cofreMes) : EST && EST.cofreUsado > 0 ? COFRE_MES : 0;
/* régua de esforço em Jenny, tirada do próprio jogo (últimas 4 semanas): um dia produtivo = a média dos dias com XP;
   uma semana boa = a melhor das últimas 4; um mês = 4 semanas na média das jogadas. Com menos de 5 dias jogados, uma estimativa. */
function esforco(xpDia, HOJE){
  const ds = Array.from({length:28}, (_,i) => addD(HOJE, -i)), ativos = ds.filter(d => xpDia[d] > 0);
  if(ativos.length < 5) return {dia:1000, semana:5000, mes:20000, est:true};
  const r50 = x => Math.max(50, Math.round(x/50)*50);
  const sem = [0,1,2,3].map(k => ds.slice(k*7, k*7+7).reduce((s,d) => s + (xpDia[d]||0)*10, 0));
  const dia = r50(ativos.reduce((s,d) => s + xpDia[d]*10, 0) / ativos.length);
  const semana = Math.max(dia, r50(Math.max(...sem)));
  const jogadas = sem.filter(x => x > 0);   // semanas sem nada não puxam o mês para baixo (quem começou agora)
  return {dia, semana, mes: Math.max(semana, r50(jogadas.reduce((a,b) => a+b, 0) / jogadas.length * 4)), est:false};
}
/* quanto esforço um preço representa, em palavras, e a faixa em que o prêmio aparece na loja */
function esforcoTxt(p, E){
  if(p <= E.dia*.6) return 'menos de um dia';
  if(p <= E.dia*1.2) return '≈ um dia produtivo';
  if(p < E.semana*.8) return `≈ ${Math.max(2, Math.round(p/E.dia))} dias produtivos`;
  if(p <= E.semana*1.3) return '≈ uma semana boa';
  if(p < E.mes*.8) return `≈ ${Math.max(2, Math.round(p/E.semana))} semanas boas`;
  if(p <= E.mes*1.3) return '≈ um mês';
  return Math.round(p/E.mes) < 2 ? 'mais de um mês' : `≈ ${Math.round(p/E.mes)} meses`;
}
const faixaDe = (p, E) => p <= E.dia*1.2 ? 0 : p <= E.semana*1.3 ? 1 : p <= E.mes*1.3 ? 2 : 3;
const FAIXAS = ['Até um dia', 'Até uma semana', 'Até um mês', 'Mais de um mês'];

/* ---------- utilidades ---------- */
const mins = e => { if(!e) return 0; const m = String(e).match(/^(?:(\d+)h)?(?:(\d+)m?)?$/); return m ? (+(m[1]||0))*60 + (+(m[2]||0)) : 0; };
const has = (t,k,v) => (t[k]||[]).includes(v);
/* tags de cada tipo: padrão do template + as do jogador (jogador.conf, seção [tags]; o servidor manda em api.jogador.tags).
   ctx = @contexto, proj = +projeto. Disciplina é sempre +fac.SIGLA. */
const TAGS_PADRAO = {ent:'@entrega @teams @atividade', est:'@estudo @livro @caderno', tre:'+treino +mrt', pro:'+projeto', hab:'+rotina'};
const TAGS = {};
function configura(extra){
  for(const k in TAGS_PADRAO){
    TAGS[k] = {ctx:[], proj:[]};
    for(const tg of (((extra||{})[k]||'') + ' ' + TAGS_PADRAO[k]).split(/[\s,]+/)){   // as do jogador primeiro: a 1ª é a que o formulário usa
      const w = tg[0] === '@' ? 'ctx' : tg[0] === '+' ? 'proj' : null, v = tg.slice(1).toLowerCase();
      if(w && v && !TAGS[k][w].includes(v)) TAGS[k][w].push(v);
    }
  }
}
configura();
const tem = (t,k) => ['ctx','proj'].some(w => (TAGS[k][w]||[]).some(v => has(t,w,v)));
const isRec = t => !!t.rec || tem(t,'hab');
const isFac = t => (t.proj||[]).some(p => p.startsWith('fac.'));
const isEst = t => tem(t,'est');
const isEnt = t => tem(t,'ent');
const isTre = t => tem(t,'tre');
/* projeto (#121): a tag de projeto, a tarefa de dev de uma issue (gh) ou um +treino de antes da #121 com palavra de projeto
   no texto (até a #121 treino e projeto eram um tipo só; criada a partir de TIPOS_DESDE, vale a tag que o jogador escolheu) */
const TIPOS_DESDE = '2026-10-16', TIPOS_MIGRA = 'tipos';   // estado.json → migra.tipos: {em, antes, depois}
const PRO_ANTIGO = /#\d|\b(issue|pr|beta|lan[cç]ar|publicar|vers[aã]o|ganbatte|hunter\.todo|todo-engine|app|site|bot|github|reposit[oó]rio|projeto|desenvolv\w*)\b/i;
const isPro = t => !!t.gh || tem(t,'pro') || (isTre(t) && !(t.cri >= TIPOS_DESDE) && PRO_ANTIGO.test(t.txt || ''));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const addD = (iso,k) => { const d = new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+k); return d.toISOString().slice(0,10); };
const dias = (a,b) => Math.round((new Date(b+'T12:00:00Z') - new Date(a+'T12:00:00Z'))/864e5);
const dow = iso => (new Date(iso+'T12:00:00Z').getUTCDay()+6)%7;
const semanaISO = iso => { const d = new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay()+6)%7); const y = d.getUTCFullYear(), w1 = new Date(Date.UTC(y,0,4)); return y + '-W' + String(1 + Math.round(((d - w1)/864e5 - 3 + (w1.getUTCDay()+6)%7)/7)).padStart(2,'0'); };
const numBR = s => parseFloat(String(s).replace(',','.'));
/* nota lançada de 0 a 10, ou em pontos ("4/5" = 4 de 5 → 8), com até 2 casas */
const nota10 = s => { const m = /^\s*([\d.,]+)\s*\/\s*([\d.,]+)\s*$/.exec(String(s)); const v = m ? numBR(m[1]) / numBR(m[2]) * 10 : numBR(s); return isFinite(v) ? Math.round(v * 100) / 100 : NaN; };
/* datas na tela: dd/mm/aaaa (padrão) ou mm/dd/aaaa, à escolha do jogador (jogador.json, "datas": "dmy" | "mdy", aba Regras).
   Nos arquivos continuam AAAA-MM-DD (formato do todo.txt). */
let MDY = false;
const fmtData = f => { MDY = f === 'mdy'; };
const fmtTxt = () => MDY ? 'mm/dd/aaaa' : 'dd/mm/aaaa';
const curta = iso => MDY ? iso.slice(5,7)+'/'+iso.slice(8,10) : iso.slice(8,10)+'/'+iso.slice(5,7);
const brData = iso => /^\d{4}-\d\d-\d\d/.test(iso || '') ? `${curta(iso)}/${iso.slice(0,4)}` : (iso || '');
const brDatas = s => String(s || '').replace(/\b(\d{4})-(\d\d)-(\d\d)\b/g, (x, a, m, d) => MDY ? `${m}/${d}/${a}` : `${d}/${m}/${a}`);
const dataRuim = x => `Data inválida${x ? `: "${x}"` : ''}. Use ${MDY ? 'mês/dia/ano' : 'dia/mês/ano'}, por exemplo ${brData('2026-10-09')}.`;
function isoData(br, hoje){   // "9/10/2026", "09/10/26" ou "9/10" (ano de hoje) -> "2026-10-09" (ou 10 de setembro, em mm/dd); inválida -> ''
  const m = String(br || '').trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/); if(!m) return /^\d{4}-\d\d-\d\d$/.test(String(br||'').trim()) ? String(br).trim() : '';
  const a = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : String(hoje || new Date().toISOString()).slice(0,4);
  const [dia, mes] = MDY ? [m[2], m[1]] : [m[1], m[2]];
  const iso = `${a}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`, d = new Date(iso + 'T12:00:00Z');
  return isNaN(d) || d.toISOString().slice(0,10) !== iso ? '' : iso;
}
/* hábitos semanais: {id, n, semana:N} = N vezes por semana (seg a dom); sem "semana" = todo dia */
const semanalDe = (jog, id) => { const h = ((jog && jog.habitos) || []).find(x => x.id === id); return h && h.semana ? +h.semana : 0; };

/* ---------- tarefas recorrentes (#113): rep:REGRA, as mesmas regras do servidor.py ----------
   fixa (calendário): sem-seg, mes-1, 6mes-1, ano-12-25; depois de concluir: +10d, +2sem, +3mes. Uma aberta por vez: concluir
   cria a próxima (o servidor). Ela fica guardada (fora da Lista, só na janela ↻ recorrentes) até alguns dias antes do prazo. */
const SEM_REP = ['seg','ter','qua','qui','sex','sab','dom'], SEM_NOME = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
const diasMes = (a, m) => new Date(Date.UTC(a, m, 0)).getUTCDate();   // m de 1 a 12
const diaDoMes = (a, m, d) => `${a}-${String(m).padStart(2,'0')}-${String(Math.min(d, diasMes(a, m))).padStart(2,'0')}`;   // dia 31 em novembro vira 30: sempre para baixo
const somaMeses = (iso, n, dia) => { const m = +iso.slice(5,7) - 1 + n; return diaDoMes(+iso.slice(0,4) + Math.floor(m / 12), m % 12 + 1, dia || +iso.slice(8,10)); };
function repRegra(s){
  s = String(s || '').toLowerCase(); let m;
  if((m = s.match(/^sem-(seg|ter|qua|qui|sex|sab|dom)$/))) return {tipo:'sem', dia:SEM_REP.indexOf(m[1])};
  if((m = s.match(/^(\d{0,2})mes-(\d{1,2})$/)) && +(m[1] || 1) >= 1 && +(m[1] || 1) <= 12 && +m[2] >= 1 && +m[2] <= 31) return {tipo:'mes', n:+(m[1] || 1), dia:+m[2]};
  if((m = s.match(/^ano-(\d\d)-(\d\d)$/)) && +m[1] >= 1 && +m[1] <= 12 && +m[2] >= 1 && +m[2] <= diasMes(2000, +m[1])) return {tipo:'ano', mes:+m[1], dia:+m[2]};
  if((m = s.match(/^\+(\d{1,3})(d|sem|mes)$/)) && +m[1] >= 1) return {tipo:'depois', n:+m[1], un:m[2]};
  return null;
}
/* a primeira data da regra fixa depois do dia d */
function repPasso(r, d){
  if(r.tipo === 'sem') return addD(d, ((r.dia - dow(d) - 1) % 7 + 7) % 7 + 1);
  const a = +d.slice(0,4);
  if(r.tipo === 'mes'){ const x = diaDoMes(a, +d.slice(5,7), r.dia); return x > d ? x : somaMeses(d, r.n, r.dia); }
  const x = diaDoMes(a, r.mes, r.dia); return x > d ? x : diaDoMes(a + 1, r.mes, r.dia);
}
/* o prazo da próxima vez: a fixa conta do prazo, a de depois de concluir conta do dia da conclusão */
function repProxima(r, due, feita){
  if(r.tipo === 'depois') return r.un === 'mes' ? somaMeses(feita, r.n) : addD(feita, r.n * (r.un === 'sem' ? 7 : 1));
  let x = repPasso(r, due || feita); while(x <= feita) x = repPasso(r, x); return x;
}
/* a linha da próxima vez (o modo demonstração usa; o jogo de verdade, o servidor) */
function repSucessora(l, feita){
  const m = l.match(/(?:^|\s)rep:(\S+)/), r = m && repRegra(m[1]); if(!r) return null;
  const d = l.match(/(?:^|\s)due:(\d{4}-\d\d-\d\d)/), prox = repProxima(r, d ? d[1] : feita, feita);
  return (d ? l.replace(/((?:^|\s)due:)\d{4}-\d\d-\d\d/, '$1' + prox) : `${l} due:${prox}`).replace(/^(\([A-Z]\) )?\d{4}-\d\d-\d\d /, (x, p) => (p || '') + feita + ' ');
}
/* fixa atrasada: quantas datas da regra já chegaram desde o prazo, contando ele (2 = "#2"; só visual, um concluir quita tudo) */
function repAcum(t, HOJE){
  const r = repRegra(t.rep); if(!r || r.tipo === 'depois' || !t.due || t.due >= HOJE) return 1;
  let n = 1, x = repPasso(r, t.due); while(x <= HOJE && n < 99){ n++; x = repPasso(r, x); } return n;
}
/* quantos dias antes do prazo ela entra na Lista: 1 (semanal), 3 (mensal), 7 (até 3 meses), 14 (semestral, anual) */
function repAntes(r){
  const p = r.tipo === 'sem' ? 7 : r.tipo === 'mes' ? 30 * r.n : r.tipo === 'ano' ? 365 : r.n * (r.un === 'd' ? 1 : r.un === 'sem' ? 7 : 30);
  return p <= 7 ? 1 : p <= 31 ? 3 : p <= 92 ? 7 : 14;
}
const repVisivel = (t, HOJE) => { const r = t.rep && repRegra(t.rep); return !r || !t.due || dias(HOJE, t.due) <= repAntes(r); };
const repEntra = t => { const r = repRegra(t.rep); return r && t.due ? addD(t.due, -repAntes(r)) : ''; };   // o dia em que ela aparece na Lista
function repFrase(rep){
  const r = repRegra(rep); if(!r) return '';
  if(r.tipo === 'sem') return `${r.dia >= 5 ? 'todo' : 'toda'} ${SEM_NOME[r.dia]}`;
  if(r.tipo === 'mes') return r.n === 1 ? `todo mês no dia ${r.dia}` : `a cada ${r.n} meses no dia ${r.dia}`;
  if(r.tipo === 'ano') return `todo ano em ${curta(diaDoMes(2000, r.mes, r.dia))}`;
  const un = r.un === 'd' ? ['dia','dias'] : r.un === 'sem' ? ['semana','semanas'] : ['mês','meses'];
  return `${r.n} ${un[r.n === 1 ? 0 : 1]} depois de concluir`;
}

/* ---------- leitura dos arquivos ---------- */
function parseLinha(raw, n){
  const t = {n, raw}; let s = raw.trim(), m;
  if((m = s.match(/^x (\d{4}-\d\d-\d\d) (?:(\d{4}-\d\d-\d\d) )?(.*)$/))){ t.done = m[1]; t.cri = m[2]; s = m[3]; }
  else { if((m = s.match(/^\(([A-Z])\) (.*)$/))){ t.pri = m[1]; s = m[2]; } if((m = s.match(/^(\d{4}-\d\d-\d\d) (.*)$/))){ t.cri = m[1]; s = m[2]; } }
  t.proj = (s.match(/(?:^|\s)\+(\S+)/g)||[]).map(x => x.trim().slice(1).toLowerCase());
  t.ctx = (s.match(/(?:^|\s)@(\S+)/g)||[]).map(x => x.trim().slice(1).toLowerCase());
  for(const k of ['est','due','prova','rec','aula','av','gh','esf','rep']){ const r = s.match(new RegExp('(?:^|\\s)'+k+':(\\S+)')); if(r) t[k] = r[1]; }
  t.txt = s.replace(/\s(?:\+|@|\w+:)\S+/g,'').replace(/^\(([A-Z])\) /,'').trim();
  return t;
}
function parseAvaliacoes(txt){
  const out = {temp:null, bosses:[], aval:{}};
  let cur = null;
  for(const l0 of String(txt||'').split('\n')){
    const l = l0.trim(); if(!l || l.startsWith('#')) continue;
    if(/^temporada\s*\|/i.test(l)){ const p = l.split('|').map(x => x.trim()); const est = p.slice(2).some(x => x.includes('?')); const c = x => (x||'').replace('?','');
      out.temp = {nome:'Temporada ' + p[1], ini:c(p[2]), fim:c(p[3]), volta:c(p[4]), est}; continue; }
    const h = l.match(/^\[(\w+)\]\s*(.*)$/);
    if(h){ const p = h[2].split('|').map(x => x.trim()); cur = h[1].toUpperCase(); out.bosses.push({d:cur, n:p[0]||cur, ic:p[1]||'spider', why:p[2]||''}); out.aval[cur] = []; continue; }
    if(!cur) continue;
    const p = l.split('|').map(x => x.trim());
    if(p.length < 4) continue;
    out.aval[cur].push({k:p[0], n:p[1], w:numBR(p[2]), dt:p[3].replace('?',''), real: !p[2].includes('?') && !p[3].includes('?'), kw: p[4] ? norm(p[4]) : '', kws: norm(p[4]||'').split(/[,;]/).map(x => x.trim()).filter(Boolean), cont: /cont/i.test(p[5]||'')});
  }
  return out;
}
function parseNotas(txt){
  const NOTAS = {}, PARC = {}, NDATA = {};
  for(const l0 of String(txt||'').split('\n')){
    const l = l0.trim(); if(!l || l.startsWith('#')) continue;
    const p = l.split('|').map(x => x.trim()); if(p.length < 4) continue;
    const key = p[1].toUpperCase()+':'+p[2], v = numBR(p[3]); if(isNaN(v)) continue;
    if(/parcial/i.test(p[4]||'')) (PARC[key] = PARC[key] || []).push(v); else NOTAS[key] = v;
    NDATA[key] = p[0];
  }
  return {NOTAS, PARC, NDATA};
}
function parseAjustes(txt){
  return String(txt||'').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => { const p = l.split('|').map(x => x.trim()); return {d:p[0], st: /aplic/i.test(p[1]) ? 'ok' : 'p', t:p[2]||'', r:p[3]||''}; });
}
/* monta o contexto a partir da resposta do GET /api/jogo */
function carregar(api){
  fmtData(api.jogador && api.jogador.datas);
  configura(api.jogador && api.jogador.tags);
  const todo = (api.todo||[]).map((l,i) => ({l, n:i+1})).filter(o => o.l.trim());
  const feitas = (api.done||[]).filter(l => l.trim()).map(l => parseLinha(l, 0)).concat(todo.filter(o => o.l.startsWith('x ')).map(o => parseLinha(o.l, o.n)));
  const hoje = api.hoje || new Date().toISOString().slice(0,10);
  const todas = todo.filter(o => !o.l.startsWith('x ')).map(o => parseLinha(o.l, o.n));
  const abertas = todas.filter(t => repVisivel(t, hoje)), guardadas = todas.filter(t => !repVisivel(t, hoje));   // recorrentes longe do prazo (#113)
  const av = parseAvaliacoes(api.avaliacoes), nt = parseNotas(api.notas);
  const est = Object.assign({spent:0, cofreUsado:0, own:[], resg:[], bought:{}, equip:{}}, api.estado||{});
  est.own = [...new Set((est.own||[]).map(k => k.startsWith('av-') && AV_ANTIGO[k.slice(3)] ? 'av-' + AV_ANTIGO[k.slice(3)] : k))];
  if(est.equip && AV_ANTIGO[est.equip.avatar]) est.equip = Object.assign({}, est.equip, {avatar: AV_ANTIGO[est.equip.avatar]});
  est.equip = Object.assign({theme:'simples', fx:[], bg:'', frame:'', title:'', avatar:'logo', lic:'l2', hud:'logo', chefes:{}, skin:{map:'dia', p1:'lilas', p3:'couro', p3b:'madeira'}}, est.equip||{});
  return {D:{feitas, abertas, guardadas, cf:api.cf||null, duo:api.duo||null, contrib:api.contrib||null}, HOJE:hoje, TEMP: av.temp || {nome:'Temporada', ini:addD(hoje,-60), fim:addD(hoje,60), volta:addD(hoje,120)},
    BOSSES: av.bosses, AVAL: av.aval, COLECAO: api.colecao && api.colecao.itens && typeof api.colecao.itens === 'object' ? api.colecao : {itens:{}}, NOTAS: nt.NOTAS, PARC: nt.PARC, NDATA: nt.NDATA, INBOX: parseAjustes(api.ajustes), EST: est, AVATARES: api.avatares||[],
    NARRADAS: Array.isArray(api.narradas) ? api.narradas : [], TEMPORADAS: Array.isArray(api.temporadas) ? api.temporadas : [], CONQ: Array.isArray(api.conquistas) ? api.conquistas : [], JOG: Object.assign({nome:'Hunter'}, api.jogador||{}), SRV: api.servidor||null, AV_TXT: String(api.avaliacoes||''), NT_TXT: String(api.notas||''), dif:'normal'};
}

/* ---------- regras ---------- */
/* recompensa por contribuição (#23): só quando a issue do jogador entra no beta (bug corrigido, ideia feita; #96); repetida,
   recusada ou dúvida não conta, nem a issue que o próprio autor fez (essa paga a tarefa de dev). Além da Jenny do próprio XP (×10) */
const CONTRIB = {bug:{xp:15, j:150}, ideia:{xp:10, j:50}};
const CONTRIB_ANTES = {bug:{xp:50, j:1000}, ideia:{xp:30, j:600}};   // até a 0.6.4-beta1: o acerto da 0.6.4 tira a diferença dos dias fechados
/* tarefa de dev (#97): a issue do GitHub em que o jogador é o responsável (gh:N, criada e concluída pelo servidor) vale pelo
   label de esforço (esf:), nas mesmas faixas das tarefas (vida, estudo, entrega); sem esforço visto, médio */
const ESF_XP = {rapido:10, medio:15, demorado:25};
/* Duolingo (0.6.4): os dias da ofensiva de antes de ligar entram no heatmap e nas conquistas do Duolingo, mas sem XP, sem Jenny,
   sem Ten (o nível sobe, #51). duo.json → desde é o dia em que o usuário foi ligado; quem ligou antes da 0.6.4 não tem: vale o dia em
   que o Duolingo automático saiu */
const DUO_LEGADO = '2026-10-12';
const duoDesde = C => (C.D.duo && C.D.duo.desde) || DUO_LEGADO;
const duoAntes = (t, de) => /^duo:/.test(t.rec || '') && String(t.rec).split(':')[1] < de;
/* corte do XP (#126): só conta o que foi feito a partir do início da temporada. O dia fica gravado no recálculo (estado.json →
   migra.recalculo.ini) e não anda sozinho na temporada seguinte: o que zera na troca de temporada ainda não foi decidido */
const RECALC = 'recalculo';
const xpDesde = C => (C.EST && C.EST.migra && C.EST.migra[RECALC] && C.EST.migra[RECALC].ini) || C.TEMP.ini;
const antesDe = (t, ini) => !!t.done && t.done < ini;
/* nível por hábito (0.6.4): cada hábito tem o seu, de 1 a 10, e vale nível + 2 XP (3 a 12). Do 1 ao 6 sobe a cada 7 dias seguidos
   feitos; depois cada nível pede uma semana a mais (6→7: 14 dias, 7→8: 21, 8→9: 28, 9→10: 35). Falhar um dia cai um nível (nunca
   zera) e a contagem recomeça. Hábito semanal: o mesmo em semanas com a meta batida. O nível sai do histórico inteiro; a tabela
   paga a partir de HAB_DESDE (antes, os 5 XP fixos, para não inflar os dias passados). Férias não derrubam. */
const HAB_DESDE = '2026-10-13', HAB_NV_MAX = 10;
const habPede = (nv, sem) => (nv < 6 ? 1 : nv - 4) * (sem ? 1 : 7);
const habXP = nv => nv + 2;
const HAB_EXTRA = 2;   // hábito semanal feito acima da meta da semana: XP ×2 (a calibrar)
function xpDe(t){ if((t.rec||'').startsWith('cf') && !(t.done && t.done < CF_DESDE)) return CF_BONUS; let x = t.gh ? ESF_XP[t.esf] || ESF_XP.medio : isRec(t) ? 10 : isEnt(t) ? 25 : isEst(t) ? 15 : isFac(t) ? 15 : 10; if(isRec(t)) x *= .5; if(t.due && t.done && t.done <= t.due) x *= 1.5; return Math.round(x); }
/* tipo de Nen (#121): treino → Transmutação; projeto → Conjuração; hábito → Manipulação; entrega → Emissão; estudo →
   Intensificação (com ou sem disciplina; tarefa da disciplina sem tag também é estudo); o resto → Especialização (vida) */
function nenDe(t){ const r = t.rec || ''; if(r.startsWith('cf') || r.startsWith('atc') || /codeforces|atcoder/i.test(t.txt)) return 1; if(isPro(t)) return 2; if(isTre(t)) return 1;
  if(isRec(t)) return 4; if(isEnt(t)) return 5; if(isEst(t) || isFac(t)) return 0; return 3; }
/* a regra de antes da #121 (faculdade sem tag → Conjuração; projeto junto com treino): só para a missão das semanas que
   começaram antes de o jogador abrir a versão nova, para o XP e a Jenny já ganhos não mudarem */
function nenAntes(t){ const r = t.rec || ''; if(r.startsWith('cf') || r.startsWith('atc') || isTre(t) || /codeforces|atcoder/i.test(t.txt)) return 1; if(isRec(t)) return 4; if(isEnt(t)) return 5; if(isEst(t)) return 0; if(isFac(t)) return 2; return 3; }
function discOf(t, C){
  const p = (t.proj||[]).find(p => p.startsWith('fac.')); if(!p) return null;
  const x = p.slice(4).toUpperCase(); const ds = (C && C.BOSSES || []).map(b => b.d);
  return ds.includes(x) ? x : (ds.find(d => d.startsWith(x) || x.startsWith(d)) || x);
}
const custo = (n, dif='normal') => Math.max(1, Math.round((n < 100 ? 8 : n < 200 ? 16 : 40) * DIF[dif]));
function andar(xp, dif){ let n = 1, r = xp; while(n < 251){ const c = custo(n,dif); if(r < c) return {n, into:r, need:c}; r -= c; n++; } return {n:251, into:1, need:1, topo:true}; }
const xpAte = (n, dif) => { let s = 0; for(let i=1;i<n;i++) s += custo(i,dif); return s; };
/* férias (#31): do dia seguinte ao fim das aulas até a véspera da volta (linha temporada do avaliacoes.txt). A temporada só
   fecha na volta; as estatísticas e a projeção do andar vão até o fim das aulas */
const feriasDe = TEMP => d => !!(TEMP && TEMP.volta && TEMP.volta > TEMP.fim && d > TEMP.fim && d < TEMP.volta);
/* Ten (0.6.4): o dia conta com uma tarefa que não seja hábito (set, montado no estado()); o hábito sozinho não acende.
   salvo: dias salvos pela carta Zetsu (hoje ou ontem, escolhendo o Ten), que contam sem gastar a folga automática */
function ten(set, first, HOJE, zetsuExtra, fer, salvo){
  const st = {}; let cur = 0, max = 0, zet = 1, seq = 0;
  if(!first) return {cur:0, max:0, zet:1, st};
  const extra = Object.assign({}, zetsuExtra||{});            // carta Zetsu de antes da 0.6.4: +1 folga a partir do dia do uso
  for(let d = first; d <= HOJE; d = addD(d,1)){
    if(extra[d]){ zet = Math.min(zet + extra[d], 3); delete extra[d]; }
    if(!set.has(d) && fer && fer(d)){ st[d] = 'f'; continue; }   // férias: o Ten sobe com dia feito, mas dia vazio não o derruba nem gasta Zetsu
    if(set.has(d)){ cur++; seq++; st[d] = 'on'; if(seq % 7 === 0) zet = Math.min(zet+1, Math.max(2, zet)); }
    else if(salvo && salvo[d]){ cur++; st[d] = 'z'; }
    else if(d === HOJE){}
    else if(zet > 0 && cur > 0){ zet--; cur++; st[d] = 'z'; }
    else { if(cur > 0) st[d] = 'x'; cur = 0; seq = 0; zet = 1; }
    max = Math.max(max,cur);
  }
  return {cur, max, zet, st};
}
/* Duolingo (#51): os dias da ofensiva atual que não estão no done.txt também sobem o nível do hábito, sem XP: a ofensiva lida
   (duo.json → ult) menos os dias dela que já estão na lista. Só os dias a partir do corte (#126), não a ofensiva inteira */
function duoPre(C, feitos){
  const o = C.D.duo; if(!o || !o.ini || !(o.ofensiva > 0)) return 0;
  const ini = xpDesde(C), de = o.ini > ini ? o.ini : ini, n = o.ofensiva - Math.max(0, dias(o.ini, ini));
  return Math.max(0, n - new Set(feitos.filter(d => d >= de)).size);
}
/* nível de cada hábito (ver habPede): linha concluída → XP pela tabela, e por hábito o nível de hoje.
   salvos: {id: Set(dias)} da carta Zetsu escolhendo um hábito (o dia conta como feito, sem dar XP) */
function niveisHab(C, feitas, fer, salvos){
  const {HOJE} = C, de = duoDesde(C), ini = xpDesde(C), xp = new Map(), hoje = {}, porId = {};
  for(const t of feitas){ const r = String(t.rec || '').split(':');   // o Duolingo de antes de ligar sobe o nível, sem XP (#51)
    if(!t.done || !r[1] || r[0].startsWith('cf') || antesDe(t, ini)) continue;   // antes do corte (#126): nem nível
    (porId[r[0]] = porId[r[0]] || []).push([r[1], duoAntes(t, de) ? null : t]); }
  for(const id of new Set([...Object.keys(porId), ...Object.keys(salvos || {})])){
    const L = porId[id] || [], sal = (salvos || {})[id] || new Set(), meta = semanalDe(C.JOG, id);
    const dias0 = L.map(x => x[0]).concat([...sal]).sort(); if(!dias0.length) continue;
    let nv = 1, s = 0, nvHoje = 1, top = 1;   // top: o maior nível já alcançado (as cartas do hábito no Book)
    const sobe = () => { s++; if(nv < HAB_NV_MAX && s >= habPede(nv, meta)){ nv++; s = 0; top = Math.max(top, nv); } }, cai = () => { nv = Math.max(1, nv - 1); s = 0; };
    if(id === 'duo' && !meta) for(let i = duoPre(C, dias0); i > 0; i--) sobe();
    if(meta){   // semanal: a semana (seg a dom) com a meta batida sobe; a que já passou sem a meta cai
      const SEG = addD(HOJE, -dow(HOJE)), noDia = d => addD(d, -dow(d));
      for(let w = noDia(dias0[0]); w <= SEG; w = addD(w, 7)){
        const fim = addD(w, 6), naSem = L.filter(x => x[0] >= w && x[0] <= fim), salva = [...sal].some(d => d >= w && d <= fim);
        if(w === SEG) nvHoje = nv;
        for(const [, t] of naSem) if(t) xp.set(t, habXP(nv));
        if(naSem.length >= meta || salva) sobe(); else if(w < SEG && !fer(w)) cai();
      }
    } else {
      const ds = new Set(L.map(x => x[0]));
      for(let d = dias0[0]; d <= HOJE; d = addD(d, 1)){
        if(d === HOJE) nvHoje = nv;
        if(ds.has(d)){ for(const [dd, t] of L) if(dd === d && t) xp.set(t, habXP(nv)); sobe(); }
        else if(sal.has(d)) sobe();
        else if(d < HOJE && !fer(d)) cai();
      }
    }
    // nv/xp: o nível agora e quanto a próxima vez vale; s de pede: o caminho até o próximo; nvHoje: o nível que pagou hoje
    hoje[id] = {nv, xp: habXP(nv), s, pede: habPede(nv, meta), max: nv >= HAB_NV_MAX, nvHoje, top, sem: !!meta};
  }
  return {xp, hoje};
}
/* liga uma tarefa da disciplina a uma avaliação e diz por quê: av:CHAVE · prova:DATA · palavra-chave do plano · entrega → contínua ·
   a próxima avaliação a partir da referência (o dia em que foi feita; aberta: o prazo, se houver, senão hoje) */
const palavra = (s, kw) => new RegExp('(^|[^a-z0-9])' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(s);
function ligaCom(t, avs, ref){
  if(t.av){ const a = avs.find(a => norm(a.k) === norm(t.av)); if(a) return [a, 'av:' + a.k]; }
  if(t.prova){ const a = avs.find(a => a.dt === t.prova); if(a) return [a, 'prova:']; }
  const s = norm(t.txt);
  const kws = avs.map(a => [a, (a.kws||[]).find(k => palavra(s, k))]).filter(x => x[1]);   // a mesma palavra em N1 e N2: vale a do período da tarefa
  if(kws.length){ const x = kws.find(x => x[0].dt >= ref) || kws[kws.length-1]; return [x[0], `palavra "${x[1]}"`]; }
  if(isEnt(t)){ const c = avs.find(a => a.cont); if(c) return [c, 'entrega → contínua']; }
  const provas = avs.filter(a => !a.cont && !/^AI$/i.test(a.k));    // reserva: a próxima avaliação pontual (nunca a AI)
  const prox = l => l.filter(a => a.dt >= ref).sort((p,q) => p.dt.localeCompare(q.dt))[0];
  const por = !t.done && t.due && t.due === ref ? 'a próxima a partir do prazo' : 'a próxima';
  return [prox(provas) || prox(avs.filter(a => a.cont)) || provas[provas.length-1] || avs[avs.length-1], por];   // sem prova no plano: a contínua do período
}
const refDe = (t, HOJE) => t.done || (t.due && t.due > HOJE ? t.due : HOJE);
/* tipo sugerido pelo texto da tarefa (formulário da Lista, "o jogo sugere"), #5 e #121: palavras de cada tipo, na ordem
   projeto > treino > entrega > estudo > vida, e "#12" (número de issue) é projeto. Com disciplina, treino e projeto não valem
   (a fronteira é a disciplina: o exercício de programação de POO é estudo) e, sem palavra, é estudo. Sem disciplina, entrega
   vira vida (entregar a roupa para alguém não é trabalho cobrado) e, sem palavra, não sugere (fica o que estava).
   "lista" é estudo: entrega é entregar o trabalho para alguém cobrar, não ter prazo. */
const TIPO_PAL = [
  ['pro', 'issue,pr,beta,lancar,publicar,versao,deploy,commit,branch,ganbatte,hunter.todo,todo-engine,app,site,bot,github,repositorio,desenvolver,desenvolvimento,projeto pessoal,meu projeto'],
  ['tre', 'codeforces,contest,leetcode,atcoder,cses,beecrowd,uri,maratona,icpc,obi,treino,treinar,upsolve,programar'],
  ['ent', 'entregar,entrega,enviar,submeter,trabalho,relatorio,atividade,apresentacao,seminario,artigo,tp,ep,questionario'],
  ['est', 'lista,listas,revisar,revisao,estudar,estudo,ler,leitura,resumo,resumir,consolidar,mapear,caderno,slide,slides,cap,capitulo,aula,exercicio,exercicios,refazer,prova,simulado,videoaula,assistir aula,flashcard,anki'],
  ['vid', 'medico,consulta,dentista,exame de sangue,compras,comprar,mercado,farmacia,pagar,conta de,boleto,banco,documento,rg,cpf,carteirinha,matricula,secretaria,coordenacao,limpar,lavar,arrumar,cozinhar,casa,familia,mae,pai,aniversario,presente,cabelo,academia,correr,viagem,passagem,igreja,missa,catequese,email,e-mail'],
].map(([k, ps]) => [k, ps.split(',')]);
function sugereTipo(txt, temDisc){
  if(!temDisc && /#\d/.test(txt)) return {k:'pro', por:'#'};
  const t = ' ' + norm(txt).replace(/[^a-z0-9.+-]+/g, ' ') + ' ';
  for(const [k, ps] of TIPO_PAL){
    if(temDisc && (k === 'pro' || k === 'tre')) continue;
    const p = ps.find(p => t.includes(' ' + p + ' '));
    if(p) return k === 'ent' && !temDisc ? {k:'vid', por:p} : {k, por:p};
  }
  return temDisc && t.trim() ? {k:'est', por:'', disc:true} : null;
}
/* "o jogo decide" (#5): prioridade sugerida para uma tarefa nova, com os motivos. Cada fator importante vale 2 pontos e cada
   fator muito importante, 3: um fator = C, dois = B, três (ou dois muito importantes) = A; nenhum = sem prioridade.
   Muito importantes: avaliação ligada em até 3 dias, prazo até amanhã (ou vencido), chefão em fúria.
   Importantes: avaliação ligada em até 14 dias, prazo em até 7 dias, 2+ atrasadas na disciplina, entrega. */
const PRI_IMP = 2, PRI_SUPER = 3;
function sugerePri(t, bs, HOJE, C){
  let sc = 0; const por = [], d = discOf(t, C), b = bs.find(b => b.d === d);
  if(b && b.avs.length){ const a = liga(t, b.avs, refDe(t, HOJE)), k = a && a.dt >= HOJE ? dias(HOJE, a.dt) : null;
    const p = k == null ? 0 : k <= 3 ? PRI_SUPER : k <= 14 ? PRI_IMP : 0;
    if(p){ sc += p; por.push(`${a.k} ${k === 0 ? 'hoje' : k === 1 ? 'amanhã' : 'em ' + k + ' dias'}`); } }
  if(t.due){ const k = dias(HOJE, t.due), p = k <= 1 ? PRI_SUPER : k <= 7 ? PRI_IMP : 0;
    if(p) { sc += p; por.push(k < 0 ? 'prazo vencido' : k === 0 ? 'prazo hoje' : k === 1 ? 'prazo amanhã' : `prazo em ${k} dias`); } }
  if(b && b.fury){ sc += PRI_SUPER; por.push(`${b.d} em fúria`); }
  const atr = b ? b.open.filter(x => x.due && x.due < HOJE).length : 0;
  if(atr >= 2){ sc += PRI_IMP; por.push(`${atr} atrasadas em ${b.d}`); }
  if(isEnt(t)){ sc += PRI_IMP; por.push('entrega'); }
  return {pri: sc >= 3*PRI_IMP ? 'A' : sc >= 2*PRI_IMP ? 'B' : sc >= PRI_IMP ? 'C' : null, sc, por};
}
const liga = (t, avs, ref) => ligaCom(t, avs, ref)[0];
function chefoes(C, feitas, abertas){
  return C.BOSSES.map(B => {
    const avs = (C.AVAL[B.d]||[]).map(a => ({...a, feitas:[], abertas:[]})).sort((p,q) => p.dt.localeCompare(q.dt));
    if(!avs.length) return {...B, avs, pts:0, rest:1000, tot:1000, dead:false, fury:false, need:null, st:'', open:[], lig:new Map()};
    const lig = new Map();   // tarefa aberta → {k, por}: a página mostra a que avaliação cada uma ficou ligada e por quê
    for(const t of feitas) if(discOf(t,C) === B.d) liga(t, avs, t.done).feitas.push(t);
    for(const t of abertas) if(discOf(t,C) === B.d){ const [a, por] = ligaCom(t, avs, refDe(t, C.HOJE)); a.abertas.push(t); lig.set(t, {k:a.k, por}); }
    let pts = 0, wrest = 0;
    for(const a of avs){
      a.tot = a.feitas.length + a.abertas.length; a.ok = a.feitas.length;
      a.prepFull = a.tot > 0 && a.abertas.length === 0 && a.feitas.every(t => t.done <= a.dt);
      a.prepOk = a.prepFull && a.dt <= C.HOJE;            // o bônus sai no dia da avaliação
      a.parts = C.PARC[B.d+':'+a.k] || [];
      a.nota = a.cont ? (a.parts.length ? a.parts.reduce((x,y) => x+y, 0)/a.parts.length : null) : C.NOTAS[B.d+':'+a.k];
      a.prov = a.cont && a.parts.length > 0;
      if(a.nota != null){ pts += a.w*a.nota/10; a.st = a.nota >= MEDIA ? 'ok' : 'low'; }
      else { wrest += a.w; a.st = a.dt < C.HOJE ? 'wait' : a.dt === C.HOJE ? 'hoje' : 'fut'; }
    }
    const need = wrest ? (60 - pts)/wrest*10 : null;
    const dead = pts >= 60, fury = !dead && avs.some(a => a.nota != null) && need > MEDIA;
    return {...B, avs, pts, rest: Math.max(0, 1000 - pts*10), tot:1000, dead, fury, need, st: dead ? 'dead' : fury ? 'hurt' : '', open: avs.flatMap(a => a.abertas), lig};
  });
}
/* ---------- caçadas e expedições (0.5.8) ----------
   Caçada: as tarefas com +cac.NOME. Só agrupa: cada etapa vale o XP normal dela.
   Expedição: projeto longo, feito de caçadas (os marcos: estado.json → cacadas[NOME].exp) e de tarefas soltas (+exp.NOME).
   Fechar um marco (todas as etapas feitas) dá o bônus dele; concluir a expedição dá +10 XP por semana ativa. Os dois ficam
   gravados no estado.json como recibo, com o dia em que fecharam, e entram no XP daquele dia.
   No todo.txt o nome vai em minúsculas e sem espaço (+cac.trabalho-mae); o nome de verdade e o ícone ficam no estado.json.
   Sem nada no estado.json, a caçada aparece com o nome do arquivo e fica avulsa. */
const MARCO_ETAPA = 5, MARCO_DIA = 6, EXP_SEMANA = 10;   // bônus por etapa (até 12), por dia diferente com etapa feita (até 10) e por semana ativa (até 20): a calibrar
const slugDe = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const nomeDeSlug = s => { const t = String(s).replace(/-/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
const grupoDe = (t, p) => { const x = (t.proj || []).find(q => q.startsWith(p + '.')); return x ? x.slice(p.length + 1) : null; };
const cacDe = t => grupoDe(t, 'cac'), expDe = t => grupoDe(t, 'exp');
const bonusMarco = c => MARCO_ETAPA * Math.min(c.etapas.length, 12) + MARCO_DIA * Math.min(new Set(c.etapas.filter(t => t.done).map(t => t.done)).size, 10);
const bonusExp = e => EXP_SEMANA * Math.min(e.semAtivas, 20);
function grupos(C, feitas, abertas){
  const MC = C.EST.cacadas || {}, ME = C.EST.expedicoes || {}, cac = {}, exp = {};
  const nc = s => { if(cac[s]) return cac[s]; const m = MC[s] || {};
    return cac[s] = {slug:s, n:m.n || nomeDeSlug(s), exp:m.exp || null, criada:m.criada || '', fim:m.fim || null, bonus:+m.bonus || 0, prazo:m.prazo || null, pai:null, filhas:[], etapas:[]}; };
  const ne = s => { if(exp[s]) return exp[s]; const m = ME[s] || {};
    return exp[s] = {slug:s, n:m.n || nomeDeSlug(s), ic:m.ic || 'island', sub:m.sub || '', ini:m.ini || '', fim:m.fim || null, bonus:+m.bonus || 0, marcos:[], soltas:[]}; };
  for(const s in MC) nc(s);
  for(const s in ME) ne(s);
  for(const t of feitas.concat(abertas)){ const c = cacDe(t), e = expDe(t); if(c) nc(c).etapas.push(t); else if(e) ne(e).soltas.push(t); }
  /* caçada dentro de caçada (#92): só dois níveis. A de dentro aponta para a de cima (cacadas[NOME].pai), fica na expedição
     dela e não é marco: aparece dentro da de cima. Cada uma fecha com o bônus das próprias etapas; a de cima só fecha
     depois das de dentro. Pai que não existe, que é ela mesma ou que já está dentro de outra é ignorado. */
  for(const c of Object.values(cac)){ const p = (MC[c.slug] || {}).pai;
    if(p && p !== c.slug && cac[p] && !(MC[p] || {}).pai){ c.pai = p; cac[p].filhas.push(c); } }
  for(const c of Object.values(cac)){
    if(c.pai) c.exp = cac[c.pai].exp;
    c.abertas = c.etapas.filter(t => !t.done); c.feitas = c.etapas.length - c.abertas.length;
    if(!c.criada) c.criada = c.etapas.map(t => t.cri || t.done).filter(Boolean).sort()[0] || C.HOJE;
    // prazo da caçada (0.6.6, #54): só organiza (Lista, cronograma, aviso); o XP continua pelo prazo de cada etapa
    c.due = c.abertas.map(t => t.due).concat(c.fim ? [] : [c.prazo]).filter(Boolean).sort()[0] || null;
    c.depois = c.prazo && !c.fim ? c.abertas.filter(t => t.due && t.due > c.prazo).length : 0;   // etapas com prazo depois do da caçada
    if(c.exp && !c.pai) ne(c.exp).marcos.push(c);
  }
  for(const c of Object.values(cac)){
    c.filhas.sort((p, q) => p.criada.localeCompare(q.criada) || p.slug.localeCompare(q.slug));
    c.tudo = c.etapas.concat(c.filhas.flatMap(f => f.etapas));   // as etapas dela e as das de dentro: só para mostrar o progresso
    c.tudoFeitas = c.tudo.filter(t => t.done).length;
    c.filhasAbertas = c.filhas.filter(f => !f.fim || f.abertas.length).length;
    if(c.filhas.length) c.due = [c.due].concat(c.filhas.filter(f => !f.fim).map(f => f.due)).filter(Boolean).sort()[0] || null;
  }
  const seg = addD(C.HOJE, -dow(C.HOJE));
  for(const e of Object.values(exp)){
    e.marcos.sort((p, q) => p.criada.localeCompare(q.criada) || p.slug.localeCompare(q.slug));
    const ts = e.marcos.flatMap(c => c.tudo).concat(e.soltas), ds = ts.filter(t => t.done).map(t => t.done);
    if(!e.ini) e.ini = ts.map(t => t.cri || t.done).filter(Boolean).sort()[0] || C.HOJE;
    e.semAtivas = new Set(ds.map(d => addD(d, -dow(d)))).size;   // semanas (seg a dom) com pelo menos uma tarefa feita
    e.semanas = Array.from({length:12}, (_, i) => { const w = addD(seg, -7*(11 - i)); return ds.filter(d => d >= w && d <= addD(w, 6)).length; });
    e.ok = e.marcos.filter(c => c.fim).length; e.atual = e.marcos.find(c => !c.fim) || null;
    e.ganho = e.marcos.flatMap(c => [c].concat(c.filhas)).filter(c => c.fim).reduce((s, c) => s + c.bonus, 0);
    e.tarefas = ts;
  }
  return {cac, exp};
}
/* recibos (0.5.2): o bônus de cada nota e os períodos de fúria ficam gravados no estado.json quando aparecem, para que mudar
   um peso, reescrever o plano ou sair da fúria nunca tire Jenny ou XP já dados. Antes tudo era recalculado a cada abertura
   e o gasto ficava gravado: um peso menor deixava a carteira negativa. A página grava o que mudou (S.rec.mudou).
   notasJ: {"DISC:aval": {nota, w, j, em}} · furias: {DISC: [[início, fim ou null]]} · acertos: {versão: J creditados uma vez} */
const ACERTO = '0.5.2';
const MIGRA = '0.6.4';    // acerto do balanceamento da 0.6.4 (estado(): migra, tenRec e acertos)   // na 1ª abertura desta versão, a carteira negativa pelo bug antigo volta a zero
const jNota = (n, w) => n >= MEDIA ? Math.round(n*(+w||0)*5) : 0;
function recibos(C, bs){
  const notasJ = JSON.parse(JSON.stringify(C.EST.notasJ || {})), furias = JSON.parse(JSON.stringify(C.EST.furias || {}));
  let mudou = false; const cortes = [];   // notas corrigidas para menos: quanto cada uma tirou (o estado() perdoa o que passar da carteira)
  // peso pela parte da nota final (0.6.4): os pesos de cada disciplina deveriam somar 100; se não somam (escala de 10, plano
  // incompleto), o bônus usa a proporção, para uma prova de 50% valer o mesmo em qualquer escala
  const pesoN = b => { const soma = b.avs.reduce((s, a) => s + (+a.w || 0), 0); return a => soma > 0 ? Math.round((+a.w || 0) * 1000 / soma) / 10 : 0; };
  const com = bs.flatMap(b => { const pn = pesoN(b); return b.avs.filter(a => !a.cont && a.nota != null).map(a => [b.d, a, pn(a)]); });
  const vivas = new Set(com.map(([d, a]) => d+':'+a.k));
  for(const [d, a, wN] of com){
    const k = d+':'+a.k, r = notasJ[k];
    if(r){ if(r.nota !== a.nota){ const antes = +r.j || 0; r.nota = a.nota; r.j = jNota(a.nota, r.w); mudou = true;   // nota corrigida: vale o peso do recibo
      if(r.j < antes) cortes.push({k, j: antes - r.j}); } continue; }
    // avaliação renomeada (a IA trocou P1 por N1): o recibo órfão da mesma disciplina e com a mesma nota passa para a chave nova
    const orf = Object.keys(notasJ).find(o => o.startsWith(d+':') && !vivas.has(o) && notasJ[o].nota === a.nota);
    if(orf){ notasJ[k] = notasJ[orf]; delete notasJ[orf]; }
    else notasJ[k] = {nota:a.nota, w:wN, j:jNota(a.nota, wN), em:C.HOJE};
    mudou = true;
  }
  for(const b of bs){
    const ps = furias[b.d] || [], aberto = ps.find(p => !p[1]);
    const ult = b.avs.map(a => C.NDATA[b.d+':'+a.k]).filter(Boolean).sort().pop() || '';
    if(b.fury && !aberto){ furias[b.d] = ps.concat([[ult || C.HOJE, null]]); mudou = true; }   // começa no dia da nota que causou a fúria
    else if(!b.fury && aberto){ aberto[1] = ult > aberto[0] ? ult : C.HOJE; mudou = true; }    // termina no dia da nota que tirou dela
  }
  return {notasJ, furias, cortes, mudou};
}
/* marca curta de uma linha do todo (para lembrar o que já estava feito quando um feitiço foi usado) */
const marca = raw => { let h = 5381; for(const c of String(raw)) h = ((h << 5) + h + c.codePointAt(0)) >>> 0; return h.toString(36); };
/* XP extra do Codeforces: do 4º ao 6º problema resolvido no dia, +1 cada; depois, nada (a meta é 3: a recorrente paga o resto) */
const CF_XP = 5, CF_MAX = 6, CF_BONUS = 10, CF_DESDE = '2026-10-06';   // Codeforces: 5 XP por problema distinto no dia (até 6); bater os 3 (a recorrente rec:cf) dá o bônus
// antes de CF_DESDE vale a regra antiga (só +1 do 4º ao 6º; recorrente 5), para não inflar a torre e a carteira de uma vez
const cfExtra = (n, d) => d && d < CF_DESDE ? Math.min(Math.max((n||0) - 3, 0), 3) : Math.min(n||0, CF_MAX) * CF_XP;
/* usos de feitiço guardados em estado.json (usos: [{k, d, n0, como?, alvo?}]); "escolha" vira o feitiço de "como" */
function efeitos(C, feitas){
  const usos = (C.EST.usos || []).map(u => ({...u, ef: u.k === 'escolha' ? u.como : u.k}));
  const mult = new Map(), ken = new Map(), zetsu = {}, gyo = {}, extras = [], salvoTen = {}, salvoHab = {};
  // alvo = a primeira tarefa concluída DEPOIS do uso: dia posterior, ou o mesmo dia sem estar na lista "ja" (marcas das já feitas no momento do uso)
  const alvo = (u, f) => { const ja = new Set(String(u.ja||'').split(',').filter(Boolean)); let melhor = -1;
    feitas.forEach((t,i) => { if(mult.has(i) || !f(t) || !t.done || t.done < u.d || (t.done === u.d && ja.has(marca(t.raw)))) return;
      if(melhor < 0 || t.done < feitas[melhor].done) melhor = i; });
    return melhor; };
  for(const u of usos){
    if(u.ef === 'ko'){ const i = alvo(u, t => !isRec(t)); if(i >= 0) mult.set(i, 2); }
    else if(u.ef === 'acomp'){ const i = alvo(u, isEnt); if(i >= 0) mult.set(i, 2); }
    else if(u.ef === 'zetsu' && u.zalvo){ const dia = u.zdia || u.d;   // 0.6.4: salva hoje ou ontem, o Ten ou um hábito
      if(u.zalvo === 'ten') salvoTen[dia] = 1; else (salvoHab[u.zalvo] = salvoHab[u.zalvo] || new Set()).add(dia); }
    else if(u.ef === 'zetsu') zetsu[u.d] = (zetsu[u.d]||0) + 1;   // de antes: +1 folga guardada no Ten
    else if(u.ef === 'gyo' && u.alvo !== undefined) gyo[semanaISO(u.d)] = +u.alvo;
    else if(u.ef === 'ken' && u.alvo) ken.set(norm(u.alvo), (ken.get(norm(u.alvo))||0) + 1);
    else if(u.ef === 'retorno') extras.push({done: addD(u.d,-1), rec:'cf:retorno', proj:['rotina'], ctx:[], txt:'Codeforces (feitiço Retorno)', raw:''});
  }
  return {usos, mult, ken, zetsu, gyo, extras, salvoTen, salvoHab};
}
function estado(C){
  const {D, HOJE, TEMP, EST} = C;
  const F = efeitos(C, D.feitas), fer = feriasDe(TEMP);   // nas férias a missão da semana e a fúria dos chefões ficam pausadas
  const feitas = D.feitas.concat(F.extras), abertas = D.abertas.filter(t => !t.done);
  const bs = chefoes(C, feitas, abertas);
  const rec = recibos(C, bs), naFuria = (d, dia) => (rec.furias[d] || []).some(([i, f]) => dia >= i && (!f || dia <= f));
  // hábito: XP pelo nível (a partir de HAB_DESDE); Duolingo de antes de ligar e o feito antes do corte (#126): nada
  const duoDe = duoDesde(C), ini = xpDesde(C), NV = niveisHab(C, feitas, fer, F.salvoHab);
  const xpBase = (t, nv = NV, ef = F, prazo = true) => { if(duoAntes(t, duoDe) || antesDe(t, ini)) return 0; if(nv.xp.has(t) && t.done >= HAB_DESDE) return nv.xp.get(t);
    const k = ef.ken.get(norm(t.txt)) || 0; return xpDe(!prazo ? {...t, due:null} : k && t.due ? {...t, due: addD(t.due, k)} : t); };
  // tipos novos (#121): a missão até a semana em que o jogador abriu a versão segue a regra antiga (nenAntes),
  // para o ×1,5 já dado e os feitiços das missões não mudarem; o gráfico de atributos usa a regra nova em tudo
  const diaTipos = (EST.migra && EST.migra[TIPOS_MIGRA] && EST.migra[TIPOS_MIGRA].em) || HOJE, wsCorte = addD(diaTipos, -dow(diaTipos));
  const nenNa = d => addD(d, -dow(d)) <= wsCorte ? nenAntes : nenDe;   // a regra da semana do dia d (a da troca ainda é a antiga)
  // missão da semana: o atributo mais fraco ANTES da semana começar (fixo durante a semana; Gyo escolhe outro)
  const fracoDa = ws => { if(F.gyo[semanaISO(ws)] !== undefined) return F.gyo[semanaISO(ws)];
    const nen = nenNa(ws), at = [0,0,0,0,0,0]; for(const t of feitas) if(t.done < ws) at[nen(t)] += xpBase(t); return at.indexOf(Math.min(...at)); };
  const fracoCache = {}, fracoSem = d => { const ws = addD(d,-dow(d)); return fracoCache[ws] ?? (fracoCache[ws] = fracoDa(ws)); };
  const naMissao = (t, d = t.done) => nenNa(d)(t) === fracoSem(d);
  const porDia = {}, xpDia = {}, attr = [0,0,0,0,0,0], attrAntes = [0,0,0,0,0,0], xs = [];
  /* hábito semanal acima da meta ("fiz de novo"): da (meta+1)ª vez na semana em diante, pelo dia do hábito, vale ×2 */
  const metaSem = Object.fromEntries(((C.JOG && C.JOG.habitos) || []).filter(h => h.semana).map(h => [h.id, +h.semana]));
  const extrasHab = ts => { const extra = new Set(), contaSem = {};
    ts.map((t, i) => [String(t.rec || '').split(':'), i]).filter(([r]) => metaSem[r[0]] && r[1]).sort((a, b) => a[0][1].localeCompare(b[0][1]))
      .forEach(([[id, dia], i]) => { const k = id + '@' + addD(dia, -dow(dia)); contaSem[k] = (contaSem[k] || 0) + 1; if(contaSem[k] > metaSem[id]) extra.add(i); });
    return extra; };
  const extraHab = extrasHab(feitas);
  /* A prévia e a conclusão usam esta mesma conta: prazo arredondado no xpDe(), depois os multiplicadores,
     arredondamento final e Jenny = XP ×10. Nenhum recibo ou saldo é alterado pela prévia. */
  const valorFeita = (t, i, nv = NV, ef = F, extra = extraHab.has(i)) => {
    const base = xpBase(t, nv, ef, false), ms = []; let x = xpBase(t, nv, ef);
    if(x !== base) ms.push('prazo');
    if(extra){ x *= HAB_EXTRA; ms.push('acima da meta'); }
    if(!fer(t.done) && naMissao(t)){ x *= 1.5; ms.push('missão'); }
    const d = discOf(t,C); if(d && t.done && !fer(t.done) && naFuria(d, t.done)){ x *= 1.5; ms.push('fúria'); }
    if(ef.mult.has(i)){ x *= ef.mult.get(i); ms.push('feitiço'); }
    x = Math.round(x); return {x, j:x*10, base, ms};
  };
  const previas = new Map(), valeTarefa = t => {
    if(previas.has(t)) return previas.get(t);
    const feita = {...t, done:HOJE}, ts = D.feitas.concat(feita), ef = efeitos(C, ts);
    const todas = feitas.concat(feita), nv = isRec(t) ? niveisHab(C, todas, fer, ef.salvoHab) : NV;
    const v = valorFeita(feita, ts.length - 1, nv, ef, isRec(t) && extrasHab(todas).has(todas.length - 1));
    previas.set(t, v); return v;
  };
  let total = 0; const duoAntesXP = {};   // o que o Duolingo de antes de ligar dava pela regra antiga (acerto da 0.6.4)
  // XP de cada dia por origem, para o relatório de balanceamento (relatorio): o XP base de cada tipo e, à parte, o que os
  // multiplicadores somaram (missão, fúria, Ko/Acompanhar, hábito acima da meta)
  const fonteDia = {}, somaF = (d, k, x) => { if(!d || !x) return; const f = fonteDia[d] = fonteDia[d] || {}; f[k] = (f[k]||0) + x; };
  feitas.forEach((t,i) => {
    if(antesDe(t, ini)) return;   // antes do corte (#126): só o heatmap e o histórico
    if(duoAntes(t, duoDe)){ let x = xpDe(t); if(!fer(t.done) && naMissao(t)) x *= 1.5; duoAntesXP[t.done] = (duoAntesXP[t.done]||0) + Math.round(x); return; }
    const {x} = valorFeita(t, i), base = xpBase(t);
    total += x; xs.push({t,x});
    somaF(t.done, (t.rec||'').startsWith('cf') ? 'cf' : isRec(t) ? 'hab' : tipoDe(t), base); somaF(t.done, 'bonus', x - base);
    porDia[t.done] = (porDia[t.done]||0)+1; xpDia[t.done] = (xpDia[t.done]||0)+x; attr[nenDe(t)] += x; attrAntes[nenAntes(t)] += x;
  });
  // Codeforces: 5 XP por problema do dia, até 6 (dados.json/codeforces.por_dia), a partir do início da temporada; missão da semana ×1,5
  const cfDia = (D.cf && D.cf.por_dia) || {}; let cfXP = 0;
  for(const d in cfDia){ if(d < TEMP.ini || d > HOJE) continue; const e = Math.round(cfExtra(cfDia[d], d) * (d >= CF_DESDE && !fer(d) && fracoSem(d) === 1 ? 1.5 : 1)); if(e){ cfXP += e; total += e; xpDia[d] = (xpDia[d]||0)+e; attr[1] += e; attrAntes[1] += e; somaF(d, 'cf', cfExtra(cfDia[d], d)); somaF(d, 'bonus', e - cfExtra(cfDia[d], d)); } }
  // caçadas e expedições (0.5.8): marco fechado e expedição concluída somam o bônus gravado no dia em que fecharam
  const G = grupos(C, D.feitas, abertas), xpDe2 = new Map(xs.map(o => [o.t, o.x]));
  let gXP = 0;
  const somaG = (d, x) => { if(!d || !(x > 0) || d > HOJE || d < ini) return; gXP += x; total += x; xpDia[d] = (xpDia[d]||0) + x; somaF(d, 'exp', x); };
  for(const c of Object.values(G.cac)) if(c.fim && c.exp) somaG(c.fim, c.bonus);
  for(const e of Object.values(G.exp)){ if(e.fim) somaG(e.fim, e.bonus); e.xp = e.tarefas.reduce((s, t) => s + (xpDe2.get(t) || 0), 0); }
  // contribuições (#23): bug corrigido ou ideia feita, aberta pelo jogador no GitHub, dá XP no dia em que o jogo viu a issue fechada
  const contrib = ((D.contrib && D.contrib.issues) || []).filter(i => CONTRIB[i.tipo] && i.dia && i.dia <= HOJE && i.dia >= ini);
  let contribXP = 0; for(const i of contrib){ const x = CONTRIB[i.tipo].xp; contribXP += x; total += x; xpDia[i.dia] = (xpDia[i.dia]||0) + x; somaF(i.dia, 'contrib', x); }
  const contribJ = contrib.reduce((s, i) => s + CONTRIB[i.tipo].j, 0);
  // dias fechados (0.5.3): o XP de cada dia anterior fica gravado no estado.json (xpDias) e só sobe. Linha concluída que some
  // do todo/done (IA reescrevendo, todo.sh archive) não tira mais XP do passado; "esqueci de marcar ontem" ainda soma.
  rec.xpDias = {...(EST.xpDias || {})};
  const first = feitas.filter(t => !duoAntes(t, duoDe) && !antesDe(t, ini)).map(t => t.done).filter(Boolean).sort()[0];
  /* acerto da 0.6.4 (uma vez): tira dos dias fechados o que a regra antiga dava ao Duolingo de antes de ligar e às contribuições,
     e guarda o recorde do Ten pela regra antiga (sem o Duolingo de antes), para a regra nova não tomar conquista já ganha.
     migra[MIGRA] guarda quanto mudou, para a janela da versão mostrar a cada um */
  rec.migra = {...(EST.migra || {})}; rec.tenRec = +EST.tenRec || 0;
  if(!rec.migra[MIGRA]){
    const tira = {...duoAntesXP}; let dXP = Object.values(duoAntesXP).reduce((a, b) => a + b, 0), dJ = dXP*10;
    for(const i of contrib){ const a = CONTRIB_ANTES[i.tipo], n = CONTRIB[i.tipo], x = a.xp - n.xp;
      tira[i.dia] = (tira[i.dia]||0) + x; dXP += x; dJ += x*10 + a.j - n.j; }
    for(const d in tira) if(d < HOJE && rec.xpDias[d] != null) rec.xpDias[d] = Math.max(0, rec.xpDias[d] - tira[d]);
    const T0 = ten(new Set(Object.keys(porDia)), first, HOJE, F.zetsu, fer);
    rec.tenRec = Math.max(rec.tenRec, T0.max);
    rec.migra[MIGRA] = {xp:dXP, j:dJ, ten:T0.max, em:HOJE}; rec.mudou = true;
  }
  // #121: o dia em que o jogador abriu os tipos novos e os atributos pela regra antiga e pela nova (para a janela da versão)
  if(!rec.migra[TIPOS_MIGRA]){ rec.migra[TIPOS_MIGRA] = {em:HOJE, antes:attrAntes.map(Math.round), depois:attr.map(Math.round)}; rec.mudou = true; }
  /* recálculo do zero (#126, uma vez): os dias fechados passam a ser o que as regras de agora dão (sem o feito antes do corte e
     sem o nível do Duolingo pela ofensiva inteira). Linha que sumiu do done.txt perde o XP gravado. migra.recalculo guarda o
     corte (ini) e o XP dos dias fechados antes e depois, para a janela da versão */
  if(!rec.migra[RECALC]){
    const soma = o => Object.entries(o).reduce((s, [d, x]) => s + (d < HOJE ? +x || 0 : 0), 0), antes = soma(rec.xpDias);
    rec.xpDias = Object.fromEntries(Object.entries(xpDia).filter(([d, x]) => d < HOJE && x > 0));
    rec.migra[RECALC] = {ini, em:HOJE, antes, depois:soma(rec.xpDias)}; rec.mudou = true;
  }
  for(const d of new Set([...Object.keys(xpDia), ...Object.keys(rec.xpDias)])){
    if(!(d < HOJE)) continue;
    const g = +rec.xpDias[d] || 0, x = xpDia[d] || 0;
    if(x > g){ rec.xpDias[d] = x; rec.mudou = true; } else if(g > x){ total += g - x; xpDia[d] = g; somaF(d, 'gravado', g - x); }
  }
  const set = new Set(feitas.filter(t => t.done && !isRec(t) && !antesDe(t, ini)).map(t => t.done));   // Ten: só tarefa que não é hábito
  const T = ten(set, first, HOJE, F.zetsu, fer, F.salvoTen); T.max = Math.max(T.max, rec.tenRec);
  const ritmo = first ? total/Math.max(1, dias(first,HOJE)/7) : 0;
  const fraco = fracoSem(HOJE), pausa = fer(HOJE);   // nas férias nenhum atributo rende ×1,5
  const ws = addD(HOJE,-dow(HOJE)); let missDias = 0; for(let i=0;i<7;i++){ const d = addD(ws,i); if(!fer(d) && feitas.some(t => t.done === d && naMissao(t))) missDias++; }
  // recompensa da missão: cada semana com 3+ dias do atributo da semana dá 1 feitiço à escolha
  let missoes = 0; const missaoDias = new Set();   // missaoDias: os dias que contaram para a missão da sua semana (resumo do grupo)
  if(first) for(let w = addD(first,-dow(first)); w <= HOJE; w = addD(w,7)){ const fr = fracoSem(w); let k = 0; for(let i=0;i<7;i++){ const d = addD(w,i); if(d <= HOJE && !fer(d) && feitas.some(t => t.done === d && naMissao(t))){ k++; missaoDias.add(d); } } if(k >= 3) missoes++; }
  const cfHoje = cfDia[HOJE] || 0;
  const rot = abertas.filter(isRec).map(t => ({...t, ok:false})).concat(feitas.filter(t => isRec(t) && t.done === HOJE && t.raw).map(t => ({...t, ok:true})));
  const golpes = abertas.filter(t => !isRec(t)).map(t => {
    const b = bs.find(b => b.d === discOf(t,C)), av = b ? b.avs.find(a => a.abertas.includes(t)) : null;
    let sc = 0; if(t.prova === HOJE) sc += 150; else if(av && dias(HOJE,av.dt) >= 0 && dias(HOJE,av.dt) <= 7) sc += 60;
    if(t.due){ const k = dias(HOJE,t.due); sc += k <= 1 ? 60 : k <= 3 ? 40 : k <= 7 ? 20 : 0; }
    const fu = !pausa && !!(b && b.fury);
    const mis = !pausa && naMissao(t, HOJE);
    if(mis) sc += 15; if(fu) sc += 25; if(t.pri === 'A') sc += 10;
    let x = xpBase({...t, done:HOJE}); if(mis) x *= 1.5; if(fu) x *= 1.5;
    return {t, sc, x: Math.round(x), b, av, bonus: mis, fury: fu};
  }).sort((a,b) => b.sc - a.sc);
  const bonusNotas = Object.values(rec.notasJ).reduce((s, r) => s + (+r.j || 0), 0);   // pelos recibos: o peso do dia em que a nota entrou
  const resg = (C.CONQ || []).filter(c => c && c.resgate && !c.descartada);   // conquistas da IA resgatadas: Jenny ou um feitiço
  const conqJ = resg.reduce((s, c) => s + (c.resgate.como === 'jenny' ? +c.resgate.j || 0 : 0), 0);
  rec.acertos = {...(EST.acertos || {})};
  if(rec.acertos[ACERTO] === undefined){ rec.acertos[ACERTO] = Math.max(0, (EST.spent||0) - (total*10 + bonusNotas + conqJ + contribJ)); rec.mudou = true; }
  // 0.6.4: se o acerto (Duolingo de antes, contribuições) deixar a carteira negativa, ela fica em zero
  if(rec.acertos[MIGRA] === undefined){ const a0 = Object.values(rec.acertos).reduce((s, j) => s + (+j || 0), 0);
    rec.acertos[MIGRA] = Math.max(0, (EST.spent||0) - (total*10 + bonusNotas + conqJ + contribJ + a0)); rec.mudou = true; }
  // #126: se o recálculo deixar a carteira negativa, ela fica em zero (o que foi gasto continua gasto)
  if(rec.acertos[RECALC] === undefined){ const a0 = Object.entries(rec.acertos).reduce((s, [k, j]) => s + (k === RETRATOS_K ? 0 : +j || 0), 0);
    const r0 = rec.acertos[RETRATOS_K] === undefined ? retratosJ(EST.compras) : +rec.acertos[RETRATOS_K] || 0;
    rec.acertos[RECALC] = Math.max(0, (EST.spent||0) - (total*10 + bonusNotas + conqJ + contribJ + a0 + r0 + (EST.devolve && +EST.devolve.j || 0))); rec.mudou = true; }
  // retratos de chefão (#135): a Jenny paga volta uma vez, gravada em acertos (o registro de compras perde as mais antigas)
  if(rec.acertos[RETRATOS_K] === undefined){ rec.acertos[RETRATOS_K] = retratosJ(EST.compras); rec.mudou = true; }
  const retJ = +rec.acertos[RETRATOS_K] || 0;
  // devolução (#51): os itens do dia voltaram para a loja sem tirar do gasto; a carteira recebe o que passou do perdão da 0.6.4
  const acerto = Object.entries(rec.acertos).reduce((s, [k, j]) => s + (k === RETRATOS_K ? 0 : +j || 0), 0) + (EST.devolve && +EST.devolve.j || 0);
  let ganho = total*10 + bonusNotas + conqJ + contribJ + acerto + retJ;
  // nota corrigida para menos (0.5.3): tira no máximo o que há na carteira; o resto fica perdoado em acertos
  const corte = rec.cortes.reduce((s, c) => s + c.j, 0), falta = (EST.spent||0) - ganho;
  if(corte && falta > 0){ const p = Math.min(corte, falta), k = 'nota:' + rec.cortes.map(c => c.k).join(',') + ':' + HOJE;
    rec.acertos[k] = (rec.acertos[k] || 0) + p; ganho += p; }
  const prepBonus = bs.reduce((s,b) => s + b.avs.filter(a => a.prepOk).length, 0);
  // bolsa: comprados + preparação completa + missões − usados
  const inv = {}; for(const w in EST.bought) for(const k of EST.bought[w]) inv[k] = (inv[k]||0) + 1;
  if(prepBonus + missoes) inv.escolha = (inv.escolha||0) + prepBonus + missoes;
  for(const c of resg) if(c.resgate.como === 'feitico' && SPELLS.some(s => s.k === c.resgate.k)) inv[c.resgate.k] = (inv[c.resgate.k]||0) + 1;
  for(const k in (EST.usados||{})) inv[k] = (inv[k]||0) - EST.usados[k];
  for(const u of F.usos) inv[u.k] = (inv[u.k]||0) - 1;
  for(const k in inv) if(inv[k] <= 0) delete inv[k];
  const espera = bs.flatMap(b => b.avs.filter(a => a.st === 'wait' && !a.cont).map(a => ({b,a})));
  // hábitos: em quantos dias diferentes cada um foi feito (o Codeforces conta à parte); as conquistas usam o maior
  const habDias = {}; for(const t of feitas) if(isRec(t) && t.done && !(t.rec||'').startsWith('cf')){ const k = t.rec ? t.rec.split(':')[0] : norm(t.txt);
    (habDias[k] = habDias[k] || {n:t.txt, d:new Set()}).d.add(t.done); }
  const hab = Object.values(habDias).reduce((m,h) => h.d.size > m.max ? {max:h.d.size, nome:h.n} : m, {max:0, nome:''});
  const sem = {n: Math.floor(dias(TEMP.ini,HOJE)/7)+1, tot: Math.ceil(dias(TEMP.ini,TEMP.fim)/7)};
  return {total, a:andar(total, C.dif), attr, porDia, xpDia, set, first, ten:T, nv:NV.hoje, duoDe, hojeXP: xpDia[HOJE]||0, xs, n:D.feitas.length, ritmo,
    proj: andar(Math.round(total + ritmo*Math.max(0,dias(HOJE,TEMP.fim))/7), C.dif), bs, fraco, pausa, missDias, missoes, rot, golpes, ganho, bonusNotas, conqJ, contrib, contribXP, contribJ, acerto: acerto + Math.max(0, ganho - (total*10 + bonusNotas + conqJ + contribJ + acerto + retJ)), retJ, rec, jenny: ganho - (EST.spent||0),
    inv, prepBonus, espera, hab, sem, cfHoje, cfXP, usos: F.usos, valeTarefa, grupos: G, gXP, fonteDia, missaoDias, metaDia: Math.max(20, Math.round(ritmo/5/5)*5),
    cofre: cofreMes(EST)*(Math.floor(Math.max(0,dias(TEMP.ini,HOJE))/30)+1) - (EST.cofreUsado||0)};
}
/* devolução (#51): quem teve a carteira zerada pelo acerto da 0.6.4 (acertos[MIGRA] > 0) gastou, no dia do rebalanceamento, a
   Jenny que ele tirou. As aparências e os feitiços ainda na bolsa comprados nesse dia voltam para a loja, sem sair do gasto; a
   carteira recebe só o que passou do perdão (a parte paga com Jenny ganha jogando). Uma vez: estado.json → devolve.
   Prêmio real e feitiço já usado ficam. Peças de um tema devolvido saem junto, menos as compradas à parte */
const DEVOLVE_DIA = '2026-10-13';
/* retratos de chefão (#135): viraram grátis; a Jenny de cada compra registrada (estado.json → compras) volta para a
   carteira, e o retrato continua do jogador. Conta uma vez só, na primeira abertura, e fica em acertos[RETRATOS_K] */
const RETRATOS_K = 'retratos';
const retratosJ = compras => (compras || []).filter(c => c && c.tipo === 'cos' && /^ch-/.test(c.id) && c.j > 0).reduce((s, c) => s + c.j, 0);
function devolucao(C, S){
  const E = C.EST, F = +((S.rec.acertos || {})[MIGRA]) || 0;   // pelo estado calculado: a 0.6.4 não conseguia gravar o acerto (migra fora do servidor)
  if(E.devolve || !(F > 0)) return null;
  const own = new Set(E.own || []), cat = catalogo(C.AVATARES), bolsa = {...S.inv}, sem = (E.bought || {})[semanaISO(DEVOLVE_DIA)] || [];
  const avulsas = new Set((E.compras || []).filter(c => c && c.tipo === 'cos' && c.d !== DEVOLVE_DIA).map(c => c.id));
  const itens = [], ids = [], feiticos = [];
  for(const c of (E.compras || []).filter(c => c && c.d === DEVOLVE_DIA && c.j > 0)){
    if(c.tipo === 'cos' && own.has(c.id)){ const it = cat.find(i => i.id === c.id);
      itens.push(c); ids.push(c.id, ...((it && it.parts) || []).filter(p => !avulsas.has(p))); own.delete(c.id); }
    else if(c.tipo === 'feitico' && bolsa[c.id] > 0 && sem.includes(c.id) && !feiticos.includes(c.id)){ bolsa[c.id]--; itens.push(c); feiticos.push(c.id); }
  }
  if(!itens.length) return null;
  const T = itens.reduce((s, c) => s + c.j, 0);
  return {v:DEVOLVE_DIA, em:C.HOJE, itens, own:[...new Set(ids)], feiticos, semana:semanaISO(DEVOLVE_DIA), total:T, perdao:F, j:Math.max(0, T - F)};
}
/* conquistas 000–099: regras fixas, conferidas pelo motor. Gerais (001–059, 090–099) e, para cada disciplina do plano
   de avaliação, quatro geradas pela sigla (060–087, até 7 disciplinas). As narradas (100+) vêm da IA, em narradas.json. */
function cartas(C, S){
  const {D, HOJE} = C, feitas = D.feitas, maxDia = Math.max(0, ...Object.values(S.porDia));
  const noPrazo = feitas.filter(t => t.due && t.done <= t.due).length;
  const notas = S.bs.flatMap(b => b.avs.filter(a => a.nota != null && !a.cont).map(a => a.nota));
  const atrib = S.attr.filter(x => x >= 100).length;
  // semana (seg–dom) com mais XP
  const xpSem = {}; for(const d in S.xpDia){ const w = addD(d, -dow(d)); xpSem[w] = (xpSem[w]||0) + S.xpDia[d]; }
  const melhorSem = Math.max(0, ...Object.values(xpSem));
  // 14 dias seguidos sem atraso (com pelo menos 3 tarefas com prazo dentro deles): atraso = prazo vencido sem a tarefa feita
  const atraso = new Set(feitas.filter(t => t.due && t.done > t.due).map(t => t.due).concat(D.abertas.filter(t => t.due && t.due < HOJE).map(t => t.due)));
  let semAtraso = false;
  if(S.first) for(let d = addD(S.first, 13); d <= HOJE && !semAtraso; d = addD(d, 1)){
    const ini = addD(d, -13); let ok = true, k = 0;
    for(let x = ini; x <= d; x = addD(x, 1)) if(atraso.has(x)){ ok = false; break; }
    if(ok) k = feitas.filter(t => t.due && t.due >= ini && t.due <= d).length;
    semAtraso = ok && k >= 3;
  }
  // Codeforces (só aparece com o handle ligado): maior sequência de dias com problema aceito e o total
  const cfDia = (D.cf && D.cf.por_dia) || {}, cfOn = !!(C.JOG && C.JOG.cf && C.JOG.cf.handle);
  let cfSeq = 0; { let cur = 0, ant = ''; for(const d of Object.keys(cfDia).filter(d => cfDia[d] > 0).sort()){ cur = ant && addD(ant, 1) === d ? cur + 1 : 1; ant = d; cfSeq = Math.max(cfSeq, cur); } }
  const cfTot = Object.values(cfDia).reduce((a,b) => a + (b||0), 0);
  // Duolingo (só com o usuário ligado): maior sequência de dias com lição feita (rec:duo, que o servidor conclui sozinho)
  const duoOn = !!(C.JOG && C.JOG.duo && C.JOG.duo.usuario), duoDias = [...diasHab(C, 'duo')].sort();
  let duoSeq = 0; { let cur = 0, ant = ''; for(const d of duoDias){ cur = ant && addD(ant, 1) === d ? cur + 1 : 1; ant = d; duoSeq = Math.max(duoSeq, cur); } }
  const todos = S.bs.length > 0 && S.bs.every(b => b.dead);
  const h = S.hab, hn = h.nome ? ` Seu melhor: ${h.nome}, ${h.max}.` : '';
  const c = (no, rk, n, d, on, ic) => ({no, rk, o:'slot', n, d, on:!!on, ic});
  const gerais = [
    c('001','H','Primeiro passo','Concluir a primeira tarefa.', S.n > 0, 'card'),
    c('002','H','Dez feitas',`10 tarefas concluídas. Você tem ${S.n}.`, S.n >= 10, 'card'),
    c('003','E','Cem feitas',`100 tarefas concluídas. Você tem ${S.n}.`, S.n >= 100, 'scroll'),
    c('004','B','Quinhentas',`500 tarefas concluídas. Você tem ${S.n}.`, S.n >= 500, 'crown'),
    c('007','G','Dia cheio',`5 tarefas num dia. Recorde: ${maxDia}.`, maxDia >= 5, 'flame'),
    c('008','D','Maratona',`10 tarefas num dia. Recorde: ${maxDia}.`, maxDia >= 10, 'flame'),
    c('021','E','Ten de 7 dias',`7 dias seguidos. Recorde: ${S.ten.max}.`, S.ten.max >= 7, 'flame'),
    c('022','D','Ten de 14 dias',`14 dias seguidos. Recorde: ${S.ten.max}.`, S.ten.max >= 14, 'flame'),
    c('023','B','Ten de 30 dias',`30 dias seguidos. Recorde: ${S.ten.max}.`, S.ten.max >= 30, 'flame'),
    c('020','A','Ten de 60 dias',`60 dias seguidos. Recorde: ${S.ten.max}.`, S.ten.max >= 60, 'flame'),
    c('024','F','Constância','Um mesmo hábito feito em 7 dias.' + hn, h.max >= 7, 'man'),
    c('025','D','Segunda natureza','Um mesmo hábito feito em 30 dias.' + hn, h.max >= 30, 'man'),
    c('026','B','Parte de você','Um mesmo hábito feito em 100 dias.' + hn, h.max >= 100, 'man'),
  ].concat(cfOn ? [
    c('027','E','Codeforces: 10 dias seguidos',`10 dias seguidos com problema aceito. Recorde: ${cfSeq}.`, cfSeq >= 10, 'tra'),
    c('028','C','Codeforces: 30 dias seguidos',`30 dias seguidos com problema aceito. Recorde: ${cfSeq}.`, cfSeq >= 30, 'tra'),
    c('029','C','Codeforces: 100 problemas',`100 problemas aceitos na temporada. Você tem ${cfTot}.`, cfTot >= 100, 'tra'),
  ] : []).concat(duoOn ? [
    c('030','E','Duolingo: 14 dias seguidos',`14 dias seguidos com lição feita. Recorde: ${duoSeq}.`, duoSeq >= 14, 'scroll'),
    c('031','C','Duolingo: 60 dias seguidos',`60 dias seguidos com lição feita. Recorde: ${duoSeq}.`, duoSeq >= 60, 'scroll'),
  ] : []).concat([
    c('034','D','Pontual',`10 tarefas feitas até o prazo. Você tem ${noPrazo}.`, noPrazo >= 10, 'scroll'),
    c('035','B','Relógio suíço',`50 tarefas feitas até o prazo. Você tem ${noPrazo}.`, noPrazo >= 50, 'scroll'),
    c('040','D','Equilíbrio',`Os seis tipos de Nen com 100 XP ou mais. Você tem ${atrib} de 6.`, atrib >= 6, 'esp'),
    c('041','F','Missão cumprida','Cumprir uma missão da semana (3 dias no atributo mais fraco).', S.missoes >= 1, 'esp'),
    c('042','C','Preparado','Fechar toda a preparação de uma avaliação antes da data.', S.prepBonus > 0, 'int'),
    c('043','B','Sempre pronto',`Preparação completa em 5 avaliações. Você tem ${S.prepBonus}.`, S.prepBonus >= 5, 'int'),
    c('045','E','Andar 50','Passar do quinquagésimo andar.', S.a.n >= 50, 'tower'),
    c('050','B','Aranha abatida','Derrotar um chefão (média ≥ 6).', S.bs.some(b => b.dead), 'spider'),
    c('051','C','Acima da média',`5 notas de 6 para cima. Você tem ${notas.filter(n => n >= MEDIA).length}.`, notas.filter(n => n >= MEDIA).length >= 5, 'int'),
    c('052','A','Nota 10','Tirar 10 numa avaliação.', notas.some(n => n >= 10), 'crown'),
    c('055','B','Andar 100','Passar do centésimo andar.', S.a.n >= 100, 'tower'),
    c('077','A','Floor Master','Chegar ao andar 200.', S.a.n >= 200, 'tower'),
    c('090','A','Neferpitou',`Torneio: vencer a 1ª guarda (Ten de 14 dias). Recorde: ${S.ten.max}.`, S.ten.max >= 14, 'cat'),
    c('091','A','Shaiapouf','Torneio: vencer a 2ª guarda (14 dias seguidos sem atraso, com pelo menos 3 prazos neles).', semAtraso, 'wing'),
    c('092','A','Menthuthuyoupi',`Torneio: vencer a 3ª guarda (uma semana acima de 300 XP). Melhor semana: ${melhorSem}.`, melhorSem > 300, 'horn'),
    c('093','SS','Rei Meruem','Torneio: vencer o Rei (todos os chefões derrotados).', todos, 'crown'),
    c('099','SS','Licença Hunter','Derrotar todos os chefões no semestre.', todos, 'crown'),
  ]);
  // por disciplina: 060 + 4×i (estudante, mestre, preparado, derrotado)
  const porDisc = S.bs.slice(0, 7).flatMap((b, i) => {
    const n = feitas.filter(t => discOf(t, C) === b.d).length, no = k => String(60 + 4*i + k).padStart(3, '0');
    return [
      c(no(0),'G',`Estudante de ${b.d}`,`10 tarefas de ${b.n}. Você tem ${n}.`, n >= 10, 'card'),
      c(no(1),'C',`Mestre de ${b.d}`,`30 tarefas de ${b.n}. Você tem ${n}.`, n >= 30, 'copy'),
      c(no(2),'D',`Pronto para ${b.d}`,`Preparação completa de uma avaliação de ${b.n} antes da data.`, b.avs.some(a => a.prepOk), 'int'),
      c(no(3),'B',`${b.n} derrotado`,`Passar em ${b.n}: média 6 ou mais.`, b.dead, 'spider'),
    ];
  });
  /* por hábito (0.6.4): três cartas pelo nível (3, 6 e 10), nos números livres de 000–099 na ordem dos hábitos (a numeração
     fica por enquanto: ver a issue #48) */
  const usados = new Set(gerais.concat(porDisc).map(x => x.no).concat(Array.from({length:28}, (_, i) => String(60 + i).padStart(3, '0'))));
  const livres = Array.from({length:100}, (_, i) => String(i).padStart(3, '0')).filter(no => !usados.has(no) && no !== '000');
  const habsC = ((C.JOG && C.JOG.habitos) || []).map(x => [x.id, x.n]).concat(duoOn ? [['duo', 'Duolingo']] : []);
  const porHab = habsC.slice(0, Math.floor(livres.length / 3)).flatMap(([id, n], i) => { const top = ((S.nv || {})[id] || {}).top || 1;
    return [[3, 'E', 'firme', 'man'], [6, 'C', 'forte', 'man'], [10, 'A', 'lendário', 'crown']].map(([nv, rk, adj, icn], k) =>
      c(livres[3*i + k], rk, `${n}: hábito ${adj}`, `Chegar ao nível ${nv} em ${n}. Maior nível: ${top}.`, top >= nv, icn)); });
  return gerais.concat(porDisc, porHab).sort((p,q) => p.no.localeCompare(q.no))
    .concat((C.NARRADAS||[]).map(c => ({no:c.no, tipo:c.tipo, periodo:c.periodo, n:c.titulo, d:c.texto, cron:c.cronica||'', escrita:c.escrita, ic:c.ic||'scroll',
    rk:{semana:'C', mes:'B', semestre:'A', ano:'SS'}[c.tipo] || 'C', o:'claude', on:true}))).concat(conqIA(C, S));
}

/* ---------- conquistas criadas pela IA (200 em diante, em conquistas.json) ----------
   A IA só preenche um molde da lista fechada abaixo (o desafio, o número, o nome e o texto); quem confere é o motor, sempre
   a partir do dia em que a conquista foi criada. A dificuldade (rank) e a recompensa saem do jogo, nunca da IA:
     contagem   {n, palavra?, disc?, tipo?, prazo?}  n tarefas concluídas que batem com todos os filtros dados
     sequencia  {hab, n}                             o hábito em n dias seguidos (semanal: n semanas seguidas com a meta; 'cf' = Codeforces, 'duo' = Duolingo)
     nota       {disc, media} ou {disc, aval, nota}  pontos garantidos na disciplina ≥ media×10, ou a nota de uma avaliação
     constancia {n}                                  Ten de n dias seguidos
     semana     {xp}                                 uma semana (seg a dom) com xp ou mais */
/* conquistas da IA abertas (não resgatadas) ao mesmo tempo, por rank (0.6.4): 4 fáceis, 3 médias, 2 difíceis e 1 lendária.
   Resgatada, a carta vai para a coleção (Book → Conquistas) e a vaga abre */
const CONQ_VAGAS = {D:4, C:3, B:2, A:1}, CONQ_MAX = Object.values(CONQ_VAGAS).reduce((a, b) => a + b, 0);
// Valores por rank; as metas de novas cartas vêm de CONQ_METAS. A coluna dias é a régua antiga, para referência.
const CONQ_RK = [['D', 7, 800, 'zetsu', 'fácil'], ['C', 14, 1500, 'gyo', 'média'], ['B', 30, 3000, 'ko', 'difícil'], ['A', Infinity, 6000, 'escolha', 'lendária']]
  .map(([rk, dias, j, f, n]) => ({rk, dias, j, f, n}));
const conqRk = rk => CONQ_RK.find(x => x.rk === rk) || CONQ_RK[0];
/* Novas cartas (#75): o rank exige trabalho verificável, não a falta de histórico. Valores em Jenny preservados. */
const CONQ_METAS = [
  {rk:'D', dias:7, tarefas:14, semanasHab:2, semanasXP:2, fatorXP:1.1, nota:8, peso:25},
  {rk:'C', dias:14, tarefas:35, semanasHab:4, semanasXP:4, fatorXP:1.2, nota:9, peso:40},
  {rk:'B', dias:30, tarefas:90, semanasHab:8, semanasXP:6, fatorXP:1.35, nota:9.5, peso:60},
  {rk:'A', dias:60, tarefas:180, semanasHab:12, semanasXP:8, fatorXP:1.5, nota:10, peso:80},
];
/* Metas calculadas por filtro: a amostra começa no primeiro dia observado, nunca antes da temporada. */
function metasConq(C, S, filtro = {}){
  const datas = C.D.feitas.map(t => t.done).filter(d => d && d <= C.HOJE).sort();
  const de = [addD(C.HOJE, -27), C.TEMP.ini, datas[0] || C.HOJE].sort().pop();
  const janela = Math.max(1, dias(de, C.HOJE) + 1);
  const k = C.D.feitas.filter(t => t.done >= de && t.done <= C.HOJE && casaConq(t, filtro, C)).length;
  const ritmo = Math.max(1, k / janela);   // poucas tarefas não promovem uma carta a lendária
  let melhor = 0;
  for(let i = 1; i <= 8; i++){ const w = addD(C.HOJE, -dow(C.HOJE) - 7*i); let xp = 0;
    for(let j = 0; j < 7; j++) xp += S.xpDia[addD(w, j)] || 0; melhor = Math.max(melhor, xp); }
  return CONQ_METAS.map(m => ({...m, tarefas:Math.max(m.tarefas, Math.ceil(ritmo*m.dias*1.25 - 1e-9)), xp:Math.ceil(Math.max(100, melhor)*m.fatorXP - 1e-9), ritmo}));
}
const alvoConq = r => JSON.stringify(r.regra === 'contagem' ? [r.regra, r.palavra || '', r.disc || '', r.tipo || '', !!r.prazo]
  : r.regra === 'sequencia' ? [r.regra, r.hab] : r.regra === 'nota' ? [r.regra, r.disc] : [r.regra]);
const CONQ_TIPOS = {ent:'entrega', est:'estudo', tre:'treino', pro:'projeto', vid:'vida'};
const CONQ_ICS = 'int tra con esp man emi spider tower card flame moon island crown scroll'.split(' ');
const tipoDe = t => isEnt(t) ? 'ent' : isEst(t) ? 'est' : isPro(t) ? 'pro' : isTre(t) ? 'tre' : isFac(t) ? 'est' : 'vid';
const tipoAntes = t => isEnt(t) ? 'ent' : isEst(t) ? 'est' : isTre(t) ? 'tre' : isFac(t) ? 'fac' : 'vid';   // conquistas com tipo 'fac', de antes da #121
const casaConq = (t, r, C) => !isRec(t) && (!r.palavra || palavra(norm(t.txt), norm(r.palavra))) && (!r.disc || discOf(t, C) === r.disc)
  && (!r.tipo || (r.tipo === 'fac' ? tipoAntes(t) : tipoDe(t)) === r.tipo) && (!r.prazo || !!(t.due && t.done <= t.due));
/* dias em que um hábito foi feito (pelo dia do rec:, que pode ser ontem no "esqueci de marcar"); 'cf' = dias com problema aceito */
function diasHab(C, id){
  if(id === 'cf'){ const cf = (C.D.cf && C.D.cf.por_dia) || {}; return new Set(Object.keys(cf).filter(d => cf[d] > 0)); }
  return new Set(C.D.feitas.filter(t => String(t.rec || '').split(':')[0] === id).map(t => String(t.rec).split(':')[1] || t.done));
}
const maiorSeq = (de, ate, ok, neutro) => { let m = 0, cur = 0; for(let d = de; d <= ate; d = addD(d, 1)){ if(neutro && neutro(d)) continue; cur = ok(d) ? cur + 1 : 0; m = Math.max(m, cur); } return m; };
/* progresso de uma regra contado a partir de `de`: {at, meta, on} */
function progConq(r, C, S, de){
  const {HOJE} = C;
  if(r.regra === 'contagem'){ const ts = C.D.feitas.filter(t => t.done && t.done >= de && t.done <= HOJE && casaConq(t, r, C)), at = ts.length;
    const diasFeitos = new Set(ts.map(t => t.done)).size;
    return {at, meta:r.n, diasFeitos, diasMin:r.diasMin || 0, on: at >= r.n && diasFeitos >= (r.diasMin || 0)}; }
  if(r.regra === 'sequencia'){
    const sem = r.hab === 'cf' ? 0 : semanalDe(C.JOG, r.hab), ds = diasHab(C, r.hab);
    if(!sem){ const at = maiorSeq(de, HOJE, d => ds.has(d)); return {at, meta:r.n, on: at >= r.n}; }
    let m = 0, cur = 0;   // semanal: semanas seguidas (seg a dom) com a meta cumprida
    for(let w = r.versao === 2 ? addD(de, (7 - dow(de)) % 7) : addD(de, -dow(de)); w <= HOJE; w = addD(w, 7)){ let k = 0; for(let i = 0; i < 7; i++){ const d = addD(w, i); if(d >= de && d <= HOJE && ds.has(d)) k++; }
      cur = k >= sem ? cur + 1 : addD(w, 6) >= HOJE ? cur : 0; m = Math.max(m, cur); }   // a semana em curso não quebra a sequência
    return {at:m, meta:r.n, on: m >= r.n};
  }
  if(r.regra === 'constancia'){ const at = maiorSeq(de, HOJE, d => S.ten.st[d] === 'on' || (r.versao !== 2 && S.ten.st[d] === 'z'), d => S.ten.st[d] === 'f'); return {at, meta:r.n, on: at >= r.n}; }
  if(r.regra === 'semana'){
    if(r.versao === 2){ let m = 0, cur = 0; const primeira = addD(de, (7 - dow(de)) % 7);
      for(let w = primeira; addD(w, 6) < HOJE; w = addD(w, 7)){ let x = 0; for(let i = 0; i < 7; i++) x += S.xpDia[addD(w, i)] || 0;
        cur = x >= r.xp ? cur + 1 : 0; m = Math.max(m, cur); }
      return {at:m, meta:r.semanas, on:m >= r.semanas}; }
    let m = 0; for(let w = addD(de, -dow(de)); w <= HOJE; w = addD(w, 7)){ let x = 0; for(let i = 0; i < 7; i++){ const d = addD(w, i); if(d >= de) x += S.xpDia[d] || 0; } m = Math.max(m, x); }
    return {at:m, meta:r.xp, on: m >= r.xp}; }
  if(r.regra === 'nota'){ const b = S.bs.find(b => b.d === r.disc); if(!b) return {at:0, meta:r.media || r.nota, on:false};
    if(r.aval){ const a = b.avs.find(a => a.k === r.aval), n = a && a.nota != null ? a.nota : 0; return {at:Math.round(n*10)/10, meta:r.nota, on: !!a && a.nota != null && a.nota >= r.nota && (r.versao !== 2 || C.NDATA[r.disc+':'+r.aval] >= de)}; }
    if(r.versao === 2){ const soma = b.avs.reduce((s, a) => s + a.w, 0), at = soma ? b.pts / soma * 10 : 0; return {at:Math.round(at*10)/10, meta:r.media, on:at >= r.media - 1e-9}; }
    return {at:Math.round(b.pts)/10, meta:r.media, on: b.pts >= r.media*10 - 1e-9}; }
  return {at:0, meta:1, on:false};
}
/* a regra em palavras, escrita pelo jogo (o texto da IA é só o tema) */
function descConq(r, C){
  const nomeHab = id => id === 'cf' ? 'Codeforces (um problema aceito por dia)' : id === 'duo' ? 'Duolingo (lição feita no dia)' : (((C.JOG && C.JOG.habitos) || []).find(h => h.id === id) || {n:id}).n;
  if(r.regra === 'contagem') return `${r.n} tarefa${r.n > 1 ? 's' : ''}` + (r.tipo ? ` de ${CONQ_TIPOS[r.tipo === 'fac' ? 'est' : r.tipo]}` : '') + (r.disc ? ` de ${r.disc}` : '')
    + (r.palavra ? ` com a palavra "${r.palavra}"` : '') + (r.prazo ? ', feitas até o prazo' : '') + (r.diasMin ? `, em pelo menos ${r.diasMin} dias diferentes` : '') + '.';
  if(r.regra === 'sequencia') return semanalDe(C.JOG, r.hab) ? `${nomeHab(r.hab)}: ${r.n} semanas seguidas com a meta da semana cumprida.` : `${nomeHab(r.hab)} em ${r.n} dias seguidos.`;
  if(r.regra === 'nota' && r.versao === 2 && !r.aval) return `Garantir média final ${numTxt(r.media)} na disciplina ${r.disc}.`;
  if(r.regra === 'nota') return r.aval ? `Tirar ${numTxt(r.nota)} ou mais em ${r.aval} de ${r.disc}.` : `Garantir ${numTxt(r.media*10)} pontos em ${r.disc} (média ${numTxt(r.media)}).`;
  if(r.regra === 'constancia') return r.versao === 2 ? `${r.n} dias seguidos com tarefa feita; folgas não contam e férias vazias pausam.` : `Ten de ${r.n} dias seguidos.`;
  if(r.regra === 'semana') return r.versao === 2 ? `${r.semanas} semanas completas seguidas (seg a dom), cada uma com ${r.xp} XP ou mais.` : `Uma semana (seg a dom) com ${r.xp} XP ou mais.`;
  return '';
}
const numTxt = x => String(Math.round(x*10)/10).replace('.', ',');
/* confere a proposta, exige os mínimos por rank e estima o prazo: {r, rk, dias} ou {erro} */
function avaliaConq(p, C, S){
  const {HOJE} = C, int = (v, a, b) => Number.isInteger(+v) && +v >= a && +v <= b, r = {regra:p.regra};
  const habs = ((C.JOG && C.JOG.habitos) || []).map(h => h.id).concat(C.JOG && C.JOG.cf && C.JOG.cf.handle ? ['cf'] : []).concat(C.JOG && C.JOG.duo && C.JOG.duo.usuario ? ['duo'] : []);
  if(p.regra === 'contagem'){
    if(!int(p.n, 2, 5000)) return {erro:'número de tarefas fora de 2 a 5000'};
    r.n = +p.n;
    if(p.palavra){ r.palavra = String(p.palavra).trim().toLowerCase(); if(r.palavra.length < 2 || r.palavra.length > 30) return {erro:'palavra inválida'}; }
    if(p.disc){ r.disc = String(p.disc).toUpperCase(); if(!C.BOSSES.some(b => b.d === r.disc)) return {erro:`disciplina ${r.disc} não existe`}; }
    if(p.tipo){ if(!CONQ_TIPOS[p.tipo]) return {erro:`tipo ${p.tipo} não existe`}; r.tipo = p.tipo; }
    if(p.prazo === true) r.prazo = true;
    if(!r.palavra && !r.disc && !r.tipo && !r.prazo) return {erro:'escolha pelo menos um filtro de tarefas'};
  } else if(p.regra === 'sequencia'){
    if(!habs.includes(p.hab)) return {erro:`hábito ${p.hab} não existe`};
    const sem = p.hab === 'cf' ? 0 : semanalDe(C.JOG, p.hab);
    if(!int(p.n, sem ? 2 : 3, sem ? 20 : 120)) return {erro:'sequência fora do limite'};
    Object.assign(r, {hab:p.hab, n:+p.n});
  } else if(p.regra === 'constancia'){
    if(!int(p.n, 5, 120)) return {erro:'Ten fora de 5 a 120 dias'};
    r.n = +p.n;
  } else if(p.regra === 'semana'){
    if(!int(p.xp, 50, 5000)) return {erro:'XP da semana fora de 50 a 5000'};
    r.xp = +p.xp;
    if(!int(p.semanas, 2, 20)) return {erro:'escolha de 2 a 20 semanas seguidas'};
    r.semanas = +p.semanas;
  } else if(p.regra === 'nota'){
    r.disc = String(p.disc || '').toUpperCase(); const b = S.bs.find(b => b.d === r.disc);
    if(!b) return {erro:`disciplina ${r.disc} não existe`};
    if(p.aval){ const a = b.avs.find(a => a.k === p.aval); if(!a) return {erro:`avaliação ${p.aval} não existe em ${r.disc}`};
      if(a.nota != null && !a.cont) return {erro:`${p.aval} já tem nota`}; if(!(+p.nota >= 5 && +p.nota <= 10)) return {erro:'nota fora de 5 a 10'};
      Object.assign(r, {aval:a.k, nota:+p.nota}); }
    else { if(!(+p.media >= 6 && +p.media <= 10)) return {erro:'média fora de 6 a 10'}; r.media = Math.round(+p.media*10)/10; }
  } else return {erro:`regra ${p.regra} não existe`};
  if(progConq(r, C, S, HOJE).on) return {erro:'já está cumprida'};
  const metas = metasConq(C, S, r), sem = r.regra === 'sequencia' && r.hab !== 'cf' && semanalDe(C.JOG, r.hab);
  let peso = 0, need = 0, dataNota = HOJE;
  if(r.regra === 'nota'){
    const b = S.bs.find(b => b.d === r.disc), soma = b.avs.reduce((s, a) => s + a.w, 0), a = r.aval && b.avs.find(a => a.k === r.aval);
    if(!soma) return {erro:'o plano precisa ter pesos para calcular este desafio'};
    if(a){ peso = a.w / soma * 100; need = r.nota; dataNota = a.dt || HOJE;
      if(a.nota != null && !a.cont) return {erro:`${r.aval} já tem nota; escolha outra avaliação`};
      if(a.cont && a.nota != null && a.nota < 10 && r.nota === 10) return {erro:'as parciais já lançadas impedem média 10 nessa avaliação'}; }
    else { const pendentes = b.avs.filter(a => a.nota == null || a.cont), rest = pendentes.reduce((s, a) => s + a.w, 0);
      const parcial = pendentes.reduce((s, a) => s + (a.nota == null ? 0 : a.w*a.nota/10), 0);
      peso = rest / soma * 100; need = rest ? (r.media*soma/10 - (b.pts - parcial)) / rest * 10 : Infinity;
      dataNota = pendentes.map(a => a.dt).sort().pop() || HOJE;
      if(r.media === 10 && pendentes.some(a => a.nota != null && a.nota < 10)) return {erro:'as parciais já lançadas impedem média final 10'};
      if(b.pts / soma * 10 >= r.media) return {erro:'já está cumprida'}; }
    if(need > 10 + 1e-9) return {erro:'não dá mais para chegar lá com o que falta'};
  }
  const qualifica = m => r.regra === 'contagem' ? r.n >= m.tarefas
    : r.regra === 'sequencia' ? r.n >= (sem ? m.semanasHab : m.dias)
    : r.regra === 'constancia' ? r.n >= m.dias
    : r.regra === 'semana' ? r.xp >= m.xp && r.semanas >= m.semanasXP
    : (r.nota || r.media) >= m.nota && peso >= m.peso - 1e-9;
  if(p.rk && !CONQ_METAS.some(m => m.rk === p.rk)) return {erro:'rank desconhecido'};
  const t = metas.filter(m => (!p.rk || m.rk === p.rk) && qualifica(m)).pop();
  if(!t){ const m = metas.find(m => m.rk === p.rk) || metas[0];
    const alvo = r.regra === 'contagem' ? `${m.tarefas} tarefas em ${m.dias} dias diferentes`
      : r.regra === 'sequencia' ? `${sem ? m.semanasHab : m.dias} ${sem ? 'semanas' : 'dias'} seguidos`
      : r.regra === 'constancia' ? `${m.dias} dias seguidos com tarefa`
      : r.regra === 'semana' ? `${m.semanasXP} semanas seguidas de pelo menos ${m.xp} XP`
      : `nota ${numTxt(m.nota)} e pelo menos ${m.peso}% do peso da disciplina ainda por conquistar`;
    return {erro:`rank ${m.rk} exige ao menos ${alvo}`}; }
  r.versao = 2;
  r.inicio = r.regra === 'nota' ? HOJE : addD(HOJE, 1);   // não reutiliza as tarefas já feitas no dia da aceitação
  if(r.regra === 'contagem') r.diasMin = t.dias;
  const est = r.regra === 'contagem' ? Math.max(t.dias, Math.ceil(r.n / t.ritmo))
    : r.regra === 'sequencia' ? (sem ? r.n*7 + (7 - dow(r.inicio)) % 7 : r.n)
    : r.regra === 'constancia' ? r.n
    : r.regra === 'semana' ? r.semanas*7 + (7 - dow(r.inicio)) % 7 + 1
    : Math.max(1, dias(HOJE, dataNota) + 1);
  if(r.regra === 'nota' ? dataNota > C.TEMP.fim : addD(r.inicio, est - 1) > C.TEMP.fim) return {erro:'a meta não cabe no tempo restante da temporada no seu ritmo'};
  const aberta = (C.CONQ || []).some(c => c && !c.resgate && !c.descartada && alvoConq(c) === alvoConq(r));
  if(aberta) return {erro:'já existe uma conquista aberta para esse alvo; escolha outro'};
  return {r, rk:t.rk, dias:est};
}
/* as conquistas da IA (sem as descartadas) com o progresso, no formato das cartas do Book */
/* o tipo faculdade saiu na #121: a conquista de tipo 'fac' ainda não cumprida é cancelada (conqCancelar: a página descarta e a
   vaga abre); a cumprida fica, contada pela regra antiga, e aparece como de estudo */
const conqCancelar = (C, S) => (C.CONQ || []).filter(c => c && !c.descartada && c.regra && c.tipo === 'fac' && !c.resgate
  && !progConq(c, C, S, c.inicio || c.criada || C.HOJE).on).map(c => c.no);
function conqIA(C, S){
  const cancela = new Set(conqCancelar(C, S));
  return (C.CONQ || []).filter(c => c && !c.descartada && c.regra && !cancela.has(c.no)).map(c => {
    const p = progConq(c, C, S, c.inicio || c.criada || C.HOJE), rk = conqRk(c.rk);
    return {no:c.no, rk:rk.rk, o:'ia', rg:c.regra, n:c.nome, d:c.texto || '', regra:descConq(c, C), ic: CONQ_ICS.includes(c.ic) ? c.ic : 'card', on: p.on || !!c.resgate,
      at:p.at, meta:p.meta, diasFeitos:p.diasFeitos, diasMin:p.diasMin, inicio:c.inicio, criada:c.criada, resgate:c.resgate || null, dif:rk.n, j:rk.j, f:rk.f, temporada:c.temporada || ''};
  }).sort((p, q) => String(p.no).localeCompare(String(q.no)));
}

/* ---------- relatório de balanceamento (0.6.3-beta2, Configurações → balanceamento) ----------
   O XP e a Jenny de cada dia, por origem, e o que foi gasto (estado.json → compras, gravado desde a 0.6.3-beta2; o gasto
   de antes fica em gastoSemData). Não leva texto de tarefa nem nome de prêmio: dá para anexar numa issue. O simulador
   (ferramentas/simulador.mjs) gera o mesmo relatório para jogadores inventados, para comparar um com o outro. */
const FONTES = {hab:'hábitos', ent:'entregas', est:'estudo', tre:'treino', pro:'projetos', vid:'vida', cf:'Codeforces',
  exp:'caçadas e expedições', contrib:'contribuições', bonus:'multiplicadores', gravado:'dias fechados'};
const lojaTotal = () => COS.filter(it => it.p > 0 && !it.lend && !it.excl && !it.grupo).reduce((s, it) => s + it.p, 0);
function relatorio(C, S){
  const {HOJE, TEMP, EST} = C, E = esforco(S.xpDia, HOJE), r1 = x => Math.round(x*10)/10;
  const ini = [TEMP.ini, S.first].filter(d => d && d <= HOJE).sort()[0] || HOJE;
  const ganhoDia = {}, gastoDia = {}, soma = (o, d, x) => { if(d && x) o[d] = (o[d]||0) + x; };
  for(const d in S.xpDia) soma(ganhoDia, d, S.xpDia[d]*10);
  for(const r of Object.values(S.rec.notasJ || {})) soma(ganhoDia, r.em, +r.j || 0);
  for(const c of C.CONQ || []) if(c && c.resgate && !c.descartada && c.resgate.como === 'jenny') soma(ganhoDia, c.resgate.em || c.criada, +c.resgate.j || 0);
  for(const i of S.contrib) soma(ganhoDia, i.dia, CONTRIB[i.tipo].j);
  const compras = (EST.compras || []).filter(c => c && /^\d{4}-\d\d-\d\d$/.test(c.d) && c.j > 0);
  for(const c of compras) soma(gastoDia, c.d, c.j);
  const gastoReg = compras.reduce((s, c) => s + c.j, 0), gastoSemData = Math.max(0, (EST.spent||0) - gastoReg);
  // antes do primeiro dia do relatório: o que já vinha acumulado
  let xpAc = 0, ganhoAc = 0, gastoAc = 0;
  for(const d in S.xpDia) if(d < ini) xpAc += S.xpDia[d];
  for(const d in ganhoDia) if(d < ini) ganhoAc += ganhoDia[d];
  for(const d in gastoDia) if(d < ini) gastoAc += gastoDia[d];
  const linhas = [], sem = {};
  for(let d = ini; d <= HOJE; d = addD(d, 1)){
    const xp = S.xpDia[d] || 0, g = ganhoDia[d] || 0, q = gastoDia[d] || 0;
    xpAc += xp; ganhoAc += g; gastoAc += q;
    const f = {}; for(const k in FONTES) f[k] = (S.fonteDia[d] || {})[k] || 0;
    linhas.push({dia:d, xp, ...f, tarefas: S.porDia[d] || 0, jGanha:g, jGasta:q, saldo: ganhoAc - gastoAc, andar: andar(xpAc, C.dif).n, ten: S.ten.st[d] || ''});
    const w = addD(d, -dow(d)), s = sem[w] = sem[w] || {semana:w, xp:0, jGanha:0, jGasta:0, diasAtivos:0, tarefas:0};
    s.xp += xp; s.jGanha += g; s.jGasta += q; s.tarefas += S.porDia[d] || 0; if(xp > 0) s.diasAtivos++; s.andar = andar(xpAc, C.dif).n;
  }
  const semanas = Object.values(sem), ativos = linhas.filter(l => l.xp > 0), nSem = Math.max(1, (dias(ini, HOJE) + 1)/7);
  const origem = {}; for(const k in FONTES){ const x = linhas.reduce((s, l) => s + l[k], 0); if(x) origem[k] = r1(x/Math.max(1, S.total)*100); }
  const porTipo = {}, porFaixa = [0,0,0,0];
  for(const c of compras){ const t = porTipo[c.tipo] = porTipo[c.tipo] || {n:0, j:0}; t.n++; t.j += c.j; porFaixa[faixaDe(c.j, E)]++; }
  const diasCompra = [...new Set(compras.map(c => c.d))].sort(), gaps = diasCompra.slice(1).map((d, i) => dias(diasCompra[i], d));
  const fimAulas = TEMP.fim > HOJE ? TEMP.fim : HOJE, ganhoFim = S.ganho + S.ritmo*10*Math.max(0, dias(HOJE, fimAulas))/7;
  const resumo = {
    dias: linhas.length, diasAtivos: ativos.length, pctDiasAtivos: r1(ativos.length/Math.max(1, linhas.length)*100),
    xp: {total:S.total, porDiaAtivo: Math.round(S.total/Math.max(1, ativos.length)), porSemana: Math.round(S.total/nSem), melhorSemana: Math.max(0, ...semanas.map(s => s.xp))},
    origemXP: origem,
    jenny: {ganha:S.ganho, gasta:EST.spent||0, saldo:S.jenny, saldoEmDiasProdutivos: r1(S.jenny/E.dia), semData:S.acerto, gastoSemData},
    regua: E,
    compras: {n:compras.length, porTipo, porFaixa: Object.fromEntries(FAIXAS.map((n, i) => [n, porFaixa[i]])), diasEntreCompras: gaps.length ? r1(gaps.reduce((a, b) => a + b, 0)/gaps.length) : null},
    torre: {andar:S.a.n, projecaoFimDasAulas:S.proj.n, andaresPorSemana: r1((S.a.n - 1)/nSem)},
    loja: {catalogo: lojaTotal(), pctCompravelNaTemporada: r1(ganhoFim/lojaTotal()*100)},
  };
  const J = C.JOG || {};
  return {formato:1, gerado:HOJE, versao:(C.SRV && C.SRV.versao) || '', dif:C.dif,
    temporada:{ini:TEMP.ini, fim:TEMP.fim, volta:TEMP.volta}, jogo:{habitos:(J.habitos||[]).length, disciplinas:C.BOSSES.length, cf:!!(J.cf && J.cf.handle), duo:!!(J.duo && J.duo.usuario)},
    fontes:FONTES, resumo, semanas, dias:linhas};
}
/* os dias do relatório como planilha (CSV com ; e vírgula decimal, que o Excel e o LibreOffice em português abrem direto) */
function relatorioCSV(R){
  const cols = ['dia','xp',...Object.keys(R.fontes),'tarefas','jGanha','jGasta','saldo','andar','ten'];
  return [cols.join(';')].concat(R.dias.map(l => cols.map(c => String(l[c]).replace('.', ',')).join(';'))).join('\n') + '\n';
}
/* ---------- cápsula da temporada (#7) ----------
   Quando a temporada acaba (na volta às aulas), ela é congelada em temporadas/NOME/resumo.json (servidor.py): os números
   finais já calculados, com chaves neutras, e os nomes do tema daquela temporada. O histórico nunca é recalculado, então
   um balanceamento futuro não muda o passado, e um tema novo não apaga os nomes do antigo.
   TEMA é o único lugar com os nomes temáticos das funções; a página ainda tem esses nomes no próprio texto.
   NOMES (#15) são os nomes base, fixos entre temporadas: o menu usa eles, e o do tema aparece por cima (dentro da aba). */
const TEMA = {serie:'Hunter x Hunter', moeda:'Jenny', cartas:'Book', torre:'Arena Celestial', sequencia:'Ten', loja:'Masadora',
  chefoes:'Genei Ryodan', missao:'Missão Nen', poderes:'Feitiços', perfil:'Licença Hunter', grupo:'Torre Trick',
  projetos:'Expedições', calendario:'Semestre'};
const NOMES = {lista:'Lista', torre:'Progresso', chefoes:'Chefões', projetos:'Projetos', calendario:'Calendário', cartas:'Conquistas',
  loja:'Loja', config:'Configurações', grupo:'Grupo', moeda:'moedas', sequencia:'sequência', missao:'missão da semana',
  poderes:'poderes', perfil:'perfil', marcos:'marcos', cacada:'etapas'};
const nomeTemporada = T => String(T.nome || '').replace(/^Temporada /, '');
const fimTemporada = T => T.volta && T.volta > T.fim ? addD(T.volta, -1) : T.fim;   // último dia: a véspera da volta (as férias contam)
/* api = a resposta do GET /api/jogo. Calcula como o jogo mostrava no último dia da temporada (ou hoje, se ela ainda não
   acabou: uma foto parcial, que a da volta às aulas substitui). O que foi feito ou comprado depois fica de fora. */
function capsula(api){
  const T = carregar(api).TEMP, hoje = carregar(api).HOJE, ate = hoje < fimTemporada(T) ? hoje : fimTemporada(T);
  const C = carregar({...api, hoje: ate}), nome = nomeTemporada(T);
  C.D.feitas = C.D.feitas.filter(t => !t.done || t.done <= ate);
  const depois = (C.EST.compras || []).filter(c => c && c.d > ate);
  C.EST = {...C.EST, compras: (C.EST.compras || []).filter(c => !(c && c.d > ate)),
    spent: Math.max(0, (C.EST.spent || 0) - depois.reduce((s, c) => s + (+c.j || 0), 0)),
    xpDias: Object.fromEntries(Object.entries(C.EST.xpDias || {}).filter(([d]) => d <= ate))};
  const S = estado(C), r = relatorio(C, S).resumo, K = cartas(C, S);
  return {formato:1, nome, ini:T.ini, fim:T.fim, volta:T.volta || '', ate, guardada:hoje, versao:(C.SRV && C.SRV.versao) || '', tema:{...TEMA},
    jogador:{nome:C.JOG.nome || '', nick:C.JOG.nick || ''},
    xp:S.total, andar:S.a.n, topo:!!S.a.topo, dificuldade:C.dif, sequencia:{max:S.ten.max, final:S.ten.cur},
    moeda:{ganha:S.ganho, gasta:C.EST.spent || 0, saldo:S.jenny},
    tarefas:S.n, diasAtivos:r.diasAtivos, origemXP:r.origemXP,
    atributos:Object.fromEntries(NEN.map((n, i) => [n.c, S.attr[i]])),
    dias:Object.fromEntries(Object.keys(S.xpDia).filter(d => d <= ate).sort().map(d => [d, [S.xpDia[d], S.porDia[d] || 0]])),   // dia: [XP, tarefas]
    chefoes:S.bs.map(b => ({sigla:b.d, nome:b.n, icone:b.ic, frase:b.why, nota:Math.round(b.pts*10)/100, derrotado:b.dead,
      avaliacoes:b.avs.map(a => ({chave:a.k, nome:a.n, peso:a.w, data:a.dt, nota:a.nota ?? null}))})),
    conquistas:K.filter(k => k.o === 'slot').map(k => ({no:k.no, nome:k.n, rank:k.rk, feita:k.on})),
    conquistasIA:(C.CONQ || []).filter(c => c && (!c.temporada || c.temporada === T.nome))
      .map(c => ({nome:c.nome || '', rank:c.rk || '', resgatada:!!(c.resgate && !c.descartada), descartada:!!c.descartada})),
    cartas:C.NARRADAS.filter(c => c && ((c.tipo === 'semestre' && c.periodo === nome) || (c.escrita >= T.ini && c.escrita <= addD(ate, 7))))
      .map(c => ({tipo:c.tipo, periodo:c.periodo, titulo:c.titulo || '', texto:c.texto || '', cronica:c.cronica || '', icone:c.ic || 'scroll'})),
    compras:C.EST.compras, equipado:C.EST.equip};
}

/* ---------- resumo para o grupo (#37, #41) ----------
   Um dia por linha, só com o que pode sair da máquina no modo em grupo (#16): o XP do dia (o número), o Codeforces (o único
   hábito que o jogo mede sozinho) e se o dia contou para a missão da semana. Com pessoais = true (a sincronização), leva
   também `pes`: o sim/não de cada hábito pessoal (e do Duolingo, se ligado) pelo id. Esse campo não sai do computador: o
   servidor do jogo troca pelos hábitos do catálogo de cada grupo a que o jogador ligou um pessoal (envio_do_grupo) e manda
   só {chave do grupo: 0/1}. Nunca leva texto de tarefa, tag nem disciplina. O export (Configurações → balanceamento) vai sem `pes`. */
const HAB_GRUPO = ['cf'];
function resumoGrupo(C, S, pessoais){
  const {HOJE, TEMP, JOG} = C, J = JOG || {}, ate = HOJE < fimTemporada(TEMP) ? HOJE : fimTemporada(TEMP);
  const cfDia = (C.D.cf && C.D.cf.por_dia) || {}, ligaCf = !!(J.cf && J.cf.handle);
  const ids = pessoais ? (J.habitos || []).map(h => h.id).concat(J.duo && J.duo.usuario ? ['duo'] : []) : [];
  const feitos = ids.map(id => [id, diasHab(C, id)]);
  const habitos = ligaCf ? ['cf'] : [], fer = feriasDe(TEMP), linhas = [];
  for(let d = TEMP.ini; d <= ate; d = addD(d, 1)){
    const hab = {}; if(ligaCf) hab.cf = cfDia[d] || 0;
    const x = {dia:d, xp:S.xpDia[d] || 0, hab, missao:S.missaoDias.has(d), ferias:!!fer(d)};
    if(pessoais){ x.pes = {}; for(const [id, ds] of feitos) if(ds.has(d)) x.pes[id] = 1; }
    linhas.push(x);
  }
  return {formato:1, protocolo:1, gerado:HOJE, versao:(C.SRV && C.SRV.versao) || '', jogador:J.nick || J.nome || '',
    temporada:{nome:nomeTemporada(TEMP), ini:TEMP.ini, fim:TEMP.fim, volta:TEMP.volta || ''}, habitos, dias:linhas};
}

window.GB = {devolucao, FAIXAS_LOJA, pacote, retratosJ, HAB_DESDE, HAB_NV_MAX, habPede, habXP, MIGRA, CONTRIB_ANTES, duoAntes, TAGS, configura, isTre, MEDIA, DIF, COFRE_MES, ALLFX, NEN, GUARDA, SPELLS, TK, PALS, palStyle, COS, catalogo, RETRATOS, padrao, travaChave, itemColecao, imgDe, REAIS, PREMIOS_PADRAO, premios, cofreMes, esforco, esforcoTxt, faixaDe, FAIXAS,
  repRegra, repPasso, repProxima, repSucessora, repAcum, repAntes, repVisivel, repEntra, repFrase, SEM_REP,
  mins, has, isRec, isFac, isEst, isEnt, norm, addD, dias, dow, semanaISO, numBR, nota10, brData, brDatas, isoData, semanalDe, fmtData, fmtTxt, curta, dataRuim,
  expandeOwn, marca, cfExtra, efeitos, parseLinha, parseAvaliacoes, parseNotas, carregar, xpDe, nenDe, discOf, custo, andar, xpAte, ten, liga, ligaCom, refDe, sugerePri, HAB_EXTRA, sugereTipo, chefoes, estado, cartas,
  CONQ_MAX, CONQ_VAGAS, CONQ_RK, CONQ_METAS, metasConq, alvoConq, CONQ_TIPOS, CONQ_ICS, conqRk, progConq, descConq, avaliaConq, conqIA, conqCancelar, tipoDe, isPro, TIPOS_DESDE,
  MARCO_ETAPA, MARCO_DIA, EXP_SEMANA, slugDe, nomeDeSlug, cacDe, expDe, bonusMarco, bonusExp, grupos, CONTRIB, ESF_XP, feriasDe,
  FONTES, lojaTotal, relatorio, relatorioCSV, TEMA, NOMES, nomeTemporada, fimTemporada, capsula, HAB_GRUPO, resumoGrupo};
})();
