# Ganbatte em grupo: desenho (v6, 14/10/2026)

Modo em grupo do Ganbatte (0.9, branch `grupo`, índice na issue #16), ideia do Caio e de um amigo. Foco: deixar o placar
**público e balanceado**. `⏳` = pendente; toda pontuação está **a calibrar** com 2–3 semanas de dados reais
(os números que aparecem aqui só ilustram as contas).

**Ordem:** a 0.9.0 traz a estrutura (servidor #38, convite #39, sincronização #40) com um placar **só de fatos, sem
pontos**: membros, última sincronização, dias com XP, Codeforces e hábitos. O servidor junta esses fatos e eles calibram a
pontuação da Torre Trick (#41, #42), que só entra depois, já com números de uso real.

## Princípios

- **Não se compara XP de tarefa entre pessoas.** As tarefas são subjetivas: quem fatia tarefas ou escreve mais tarefas
  numa matéria ganha mais. Nem uma IA ponderando resolve (ela vê o texto, não o esforço). O público compara só
  sinais difíceis de inflar: XP **com teto**, hábitos, **superação contra si mesmo** e **evolução** de nota.
- **Duas camadas.** A individual fica como é (subjetiva, só a pessoa joga contra si). A coletiva recebe só um resumo.
- **Tarefas e XP bruto nunca saem da máquina do jogador.**
- **Combinado entre amigos, não anti-fraude.** Dá para marcar ✓ numa tarefa boba para manter o dia; isso é aceito.
- Nada pune (como no individual): nota abaixo da referência dá 0, não negativo.

## Nomes

| O quê | Nome |
|---|---|
| Torre individual (já existe) | **Arena Celestial**: você **sobe** andares com o seu XP |
| Placar público | **Torre Trick**: você **desce** (no Exame Hunter os candidatos descem a Torre Trick, cada um por um caminho). Unidade: andar descido |
| Moeda pública | **Trick Coin** |
| Servidor central | **Associação Hunter** |
| Evento de fim de temporada | **Exame Hunter** (desenvolver depois) |

Tema: **HxH para todos** nesta temporada.

## Arquitetura

- Cada jogador roda o próprio Ganbatte, com o `jogador.json` (nome, disciplinas, **mapa de tags** → categorias do motor,
  handle do CF; a exposição de notas entra com a #45).
- **Associação Hunter**: qualquer jogador pode ser host (botão **Criar grupo**, serviço `ganbatte-grupo` separado do jogo).
  Um servidor atende vários grupos e um jogador pode estar em vários. Exposto de preferência por **Tailscale Funnel**
  (grátis, só o host instala, endereço fixo com qualquer IP); o servidor não depende dele. Convite = link com endereço e
  código. Direto no servidor, sem passar pelo GitHub (o GitHub serve só para distribuir o código do template).
- O jogo local manda um **resumo por POST** e guarda numa fila quando estiver offline. O jogo nunca depende do servidor para funcionar.
- A Associação calcula a Torre Trick e serve a página do placar, o catálogo da loja pública e as imagens.

## Servidor da Associação (decidido em 13/10/2026, #38–#40)

- Código em `grupo/` no mesmo repositório, só a biblioteca padrão do Python; dados em **SQLite**, numa pasta própria
  (`~/.ganbatte-grupo/`), separada da do jogo: o servidor pode rodar numa máquina sem jogador.
- **Porta 8643** (a do jogo é a 8642), trocável com `--porta`. Só escuta em `localhost`; quem expõe é o host.
- **Tailscale Funnel, modo misto:** o botão *Criar grupo* tenta ligar o Funnel sozinho; se travar na autorização da
  primeira vez ou no `sudo` do Linux, mostra o link ou o comando e *tentar de novo*. Sem Tailscale, o host cola o endereço
  (outro túnel, VPS, rede local).
- **Dono do servidor por token no disco** (`dono.token` na pasta do servidor), nunca por "veio de localhost": o Funnel
  entrega os pedidos da internet como se viessem da própria máquina. O jogo do host lê o arquivo e manda o token.
- **Tokens no cabeçalho** (`Authorization: Bearer`), e o servidor guarda **só o hash** (de jogadores, admins e
  convites). Token perdido = reconvite.
- **Fechamento dos períodos pelo fuso do grupo**, guardado como deslocamento fixo (ex.: `-03:00`, o Python 3.8 não tem
  `zoneinfo`); o padrão é o do host ao criar. Dia às 6h do dia seguinte, semana +3 dias, mês +7 dias, **e só depois de o
  servidor somar 12h ligado depois do prazo** (constante ajustável): o host pode ser um notebook que desliga.
- **Backup:** cópia diária automática do banco (`copias/`, as últimas 14, pela função de backup do `sqlite3`) e o botão
  *baixar cópia do servidor* para o dono.

## Pontos da Torre Trick

### A. XP do dia com teto
- Por dia conta `min(XP do dia, teto)`. Ex.: com teto 75: 100 → 75, 50 → 50, 300 → 75.
- **Teto = mediana do XP diário de todos os jogadores no mês anterior, contando todos os dias** (inclusive os dias com 0).
- **1º mês** (sem histórico): o teto é a mediana dos dias que já chegaram **no próprio mês**, recalculada até o mês fechar;
  os andares do 1º mês aparecem como **provisórios**. Quando o mês fecha, a regra normal assume sozinha (decidido em 14/10, #42).

### Calibração automática (decidido em 14/10, #42)
- Tudo que não é o XP do dia é medido em **dias de teto** (os multiplicadores abaixo). Como o teto acompanha o XP do grupo,
  a escala se ajusta sozinha: não precisa esperar dados para lançar, e os números da 0.9 já são os de verdade.
- Os **multiplicadores** (e o +50% e a base mínima do CF) ficam em **Grupo → administrar → calibração**, com os valores daqui
  como padrão: o admin ajusta sem lançar versão. Mudar um número recalcula os períodos abertos; os fechados ficam como estão (#40).

### B. Hábitos coletivos
- **Codeforces:** verificado pela API do CF. O placar mostra o **heatmap do Codeforces** de cada jogador.
- **Catálogo por grupo** (#41, decidido em 14/10): os admins editam em Grupo → administrar. O **Codeforces** é o único
  automático (o jogo mede sozinho) e já vem no grupo novo; o host pode tirá-lo. Os outros são de **vínculo**: o jogador liga
  um hábito pessoal ao do grupo em Configurações → grupo (o Duolingo entra assim, como hábito pessoal). O público recebe só
  **fez / não fez** por dia, e o nome do hábito pessoal nunca sai da máquina. Hábito novo conta a partir do dia em que foi
  criado; remover arquiva.
- **Pontos por hábito:** cada dia cumprido de um hábito do grupo vale **0,2× o teto** (decidido em 14/10, #42).

### C. Missão da semana
- Cumprir a missão (3 dias no atributo mais fraco) dá pontos. **Fica para depois da 0.9** (decidido em 14/10, #42).

### D. Superação
- `base` = o maior valor entre a média dos períodos anteriores e a média da temporada.
- `r` = (período atual) ÷ base.
- `bônus = S × min(r − 1, 0,5) ÷ 0,5`, e 0 se `r ≤ 1`.
- **S = o prêmio máximo.** Cada 1% acima da própria média vale 2% do S, e +50% leva o S inteiro.
  "Contínuo" quer dizer sem degraus, não quer dizer pouco.
  Ex. com S = 1000: +10% → 200 · +25% → 500 · +50% ou mais → 1000.
- O S **não precisa ser enorme**. O XP com teto continua sendo o principal.
- Dimensões, cada uma com o próprio S em dias de teto (decidido em 14/10, #42):

| Dimensão | Período | Base | S |
|---|---|---|---|
| XP (**sem teto**, contra si mesmo) | **mês**: projeção visível durante o mês e bônus creditado no dia 1º como "descida especial" | últimos 3 meses / temporada | **5× o teto** |
| Codeforces (problemas distintos) | **semana**, para ver o resultado logo | últimas 4 semanas / temporada, com **base mínima de 3** | **1× o teto** |
| Hábitos (dias cumpridos) | **mês** (na semana, um hábito vai de 0 a 7 e um dia a mais já daria o bônus inteiro) | últimos 3 meses / temporada | **3× o teto** |

- Primeiro período do jogador: sem bônus (ele vira a base).
- **Hábito mantido em 100%** conta como superação máxima, como a nota 10 mantida: quem já faz todo dia não tem como passar da
  própria média e não pode ficar sem o bônus por isso.
- ⏳ Risco: inflar o XP de um mês para pegar o bônus. As proteções já previstas são a base pela média da temporada e o r limitado a 1,5. Se não bastar, a dimensão XP passa a usar o XP com teto.

### E. Notas, pela evolução (nunca pela nota em si)
- **Ganho = a fração do caminho até o 10 que a pessoa percorreu** (decidido em 14/10, #67):
  `ganho = (nota − referência) ÷ (10 − referência)`. Quem já está no 10 e mantém conta 100%; queda conta 0.
  Ex.: 6 → 8 = 50% · 7,9 → 8,4 = 24% · 7,5 → 8 = 20% · 10 → 10 = 100% (9 → 9,5 também dá 50%: subir perto do 10 é mais difícil).
- As matérias se juntam pela **média do ganho ponderada pela carga horária**: não há placar por matéria, e ninguém precisa
  ter as mesmas matérias. `pontos = k × ganho`.
- Referência = CR do semestre anterior, ou a média das avaliações já feitas na temporada.
- Exposição em Configurações → Grupo: `notas = publico` (mostra nota e ganha pontos) · `evolucao` (só os pontos) · `privado` (sem pontos de nota).
- ⏳ k · ⏳ referência de quem está no 1º semestre.

### F. Cooperativo
- **Chefão do grupo mensal:** vida = meta somada do grupo. Se o grupo derrubar, todos ganham a mesma recompensa.
- **Ten do grupo:** dias seguidos com todos ativos, com 1 Zetsu coletivo por semana.
- ⏳ metas e recompensas.

## A aba Torre Trick e os placares (decidido em 14/10/2026, #67)

**Sub-abas:** uma aba só no topo do jogo, com `placar · placares · jogadores · loja · desafios · administrar` dentro. O que
é do jogador fica nas abas do topo; o que é do grupo, dentro da Torre Trick. **administrar** só aparece para admins; **loja**
(a loja pública) e **desafios** (#71) ficam com o espaço reservado. Sempre o placar atual, sem filtro de período nem
histórico (#68). Visual Nen do jogo. Desenho aprovado no protótipo do #67.

**Navegação:** clicar num **nome** abre a sub-aba jogadores com aquele jogador em foco; clicar no **nome de um placar** abre a
sub-aba placares com ele em foco.

**Sub-aba placar**, de cima para baixo:
1. À esquerda, a **licença hunter** do jogador (frente; clicar vira a carta), quanto falta para passar quem está à frente
   (com barra) e os botões *meu perfil* e *minha evolução*. À direita, o **pódio herói** (o 1º com a vantagem sobre o 2º;
   o 2º e o 3º menores ao lado) e, embaixo dele, a **frase do líder da semana** (#76), terminando na altura dos botões.
2. **Do 4º em diante**, na largura toda: posição, ícone, barra teto/hábitos/superação, sequência, últimos dias e andares,
   com a linha do jogador sempre destacada. A sequência (dias seguidos jogando) é só uma coluna, não um placar.
3. Os **placares específicos**, que **o jogador escolhe** ver como **campeões** (o 1º de cada placar, numa faixa) ou **quem
   lidera** (por pessoa, com os títulos).

**Sub-aba placares:** à esquerda, todos os placares com o mini-pódio e a posição do jogador; à direita, o placar em foco
(como é calculado, pódio, lista completa) e a **evolução**: posição de 6 semanas atrás até agora, melhor posição, quanto
subiu ou caiu, o gráfico da posição de cada um por semana (o jogador destacado, o líder em dourado) e a tabela.

**Sub-aba jogadores:** o perfil é a **licença hunter horizontal**, frente e verso, no formato da licença do mangá. Frente: o
principal (foto grande, nome, nº da licença, grupo e temporada, posição no geral, andares, sequência, títulos). Verso: o
resto (medalhas, posição em cada placar, conquistas, registro), com a tarja magnética e o número em quadradinhos. Cores
básicas (preto, branco e azul-claro); **personalizar a licença** (cor, holográfico, brilho, borda) é item da loja pública.
Avatar (#70), armas e habilidades entram depois. A sub-aba substitui a antiga ideia de "hunters".

**Ícone** (no lugar do avatar, até o #70): a foto com **moldura** e **animação** compradas na loja pública, e o nickname
embaixo.

**Placares específicos, gerados pelo catálogo (#41):** cada hábito diz o seu tipo, e o tipo gera os placares; hábito novo
(digitação...) ganha placares sem código novo. Quem não ligou o hábito não aparece nos placares dele (nem com zero), e um
placar só aparece com 2 ou mais participantes.

| Tipo de hábito | Exemplos | Placares |
|---|---|---|
| quantidade (um número por dia) | Codeforces, minutos de digitação | volume · constância · superação |
| fez / não fez | Duolingo | constância · superação |

| Placar | Ordena por |
|---|---|
| **Volume** (ex.: CF, mais questões) | a soma no período (no CF, problemas distintos) |
| **Constância** (ex.: CF, constância + questões) | a soma dentro da sequência atual; um dia sem fazer zera, com **1 folga por semana** (como o Zetsu do Ten), e as férias não quebram |
| **Superação** de um hábito | a razão contra a própria base (D), com **base mínima** ⏳ (ex.: 3 problemas por semana) para a razão não explodir. Ex.: 21 → 25 < 21 → 30 < 1 → 20. O placar **ordena sem teto**; os andares mantêm o teto de +50% |
| **Hábitos** (todos juntos) | a **soma da constância de cada hábito**: 3 hábitos a 70% = 2,1 > 1 a 100% = 1,0 > 3 a 20% = 0,6 |
| **Superação de notas** | o ganho de E. Respeita a exposição: `privado` não entra, `evolucao` mostra só a porcentagem |
| **Superação total** | a média das superações de cada dimensão de que a pessoa participa (XP, cada hábito, notas), todas em 0–100%: quem não tem CF não perde por isso |

**Período de cada placar** (padrão): volume na semana; constância na sequência atual; superação na semana no CF e no mês nos
outros; constância de hábito, hábitos, notas e superação total na temporada. O admin **liga, desliga e muda o período** de
cada placar em Grupo → administrar, sem lançar versão.

**Recompensas:** as posições dão **medalhas e títulos**, nunca andares (andar por posição, estilo F1, amplificaria quem já
domina). **Na 0.9 só os títulos** (quem lidera agora); medalhas, conquistas e Trick Coin por posição ficam para depois (#69).

**Frase do líder da semana** (#76, decidido em 14/10): o 1º do geral na **última semana fechada** escreve **uma frase**, **uma
vez só** (não dá para mudar), até **80 caracteres**; fica embaixo do pódio até o fim da semana. Sem frase, o card mostra "o
líder da semana ainda não escreveu". O admin pode apagar uma frase. O servidor guarda as frases antigas desde já; mostrar o
histórico fica com o #68.

## Lojas

| | **Masadora (individual)** | **Loja da Associação (pública)** |
|---|---|---|
| Moeda | **Jenny**, do XP pessoal | **Trick Coin**, ganha **só pela Torre Trick** |
| Vende | o que só o jogador vê: paletas, texturas, efeitos, mundo pixel, prêmios reais (cofre) | o que os outros veem: **foto de perfil**, moldura, título, emblema no placar |
| Onde | máquina do jogador | catálogo e imagens no servidor |

- Duas moedas porque o XP pessoal é subjetivo: o visual público só pode vir de pontos balanceados.
- **Avatares vão para a loja pública.** O avatar é **do jogador**, em camadas (corpo, roupa, arma): o mesmo em todos os
  grupos e também no jogo pessoal, customizado só pela loja pública (#70).
- Avatares novos são decididos **antes de cada temporada**. Nesta primeira, o **host (Caio)** adiciona durante a temporada.
- **IDs de item independentes do tema** (`av.killua`, `pal.simples`). Tema e temporada são atributos, para as compras continuarem valendo quando o tema mudar, como no Fortnite.
- **Itens únicos:** só 1 no grupo, com o dono registrado no servidor. ⏳ como se conquistam.

## IA

- **Do jogador:** opcional e a cargo dele. O template traz o `IA.md` com prompts prontos (plano de ensino uma vez por semestre,
  cartas narradas). Sem IA, o plano de ensino se cadastra pelo formulário da aba Chefões.
- **Do servidor (host):** uma IA na Associação para narrar o **cenário público geral** (crônicas da temporada, da semana do grupo)
  e outras decisões ⏳.

## Baú de ideias (futuro)

- Temas por temporada (Naruto, Pokémon...), com as compras continuando a valer.
- **Trocas, compra e venda de itens entre jogadores.**
- Problemas do CF sugeridos ao grupo (dificuldades variadas em torno da média), com bônus para quem resolver primeiro. Precisa do handle de cada um para filtrar o que a pessoa já resolveu (#71, sub-aba desafios).
- **Batalha 1×1 com problemas do Codeforces** (#71).
- Exame Hunter (fim de temporada): campeão e cartas como "maior superação" e "maior Ten".

## Pendências (⏳)

1. Pontos da missão (depois da 0.9)
2. k das notas · referência do 1º semestre
3. Metas e recompensas do chefão do grupo
4. Itens únicos
5. O que mais a IA do servidor decide
6. Conferir os multiplicadores com o uso real (ajuste no administrar, sem versão nova)
7. Recompensas dos placares: medalhas, conquistas e Trick Coin por posição (#69)
