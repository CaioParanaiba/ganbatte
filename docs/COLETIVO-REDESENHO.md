# Ganbatte em grupo: redesenho (decidido em 21/10/2026)

Conversa do Caio com a IA sobre refazer a estrutura de avaliação do modo em grupo (Torre Trick) e, por consequência, o
desenho. **Só desenho: nada disto está no código.** Substitui as partes do [`COLETIVO.md`](COLETIVO.md) (v6) indicadas na
seção "O que muda no COLETIVO.md". `⏳` = pendente; todo número é **a calibrar** e fica no administrar do grupo, como a
calibração de hoje.

## Por que refazer

Medido no código (`grupo/torre.py`) e no banco do grupo (6 membros, dados desde 01/08/2026):

1. **Os placares são o mesmo dado em cinco aparências.** `specs()` gera 3 placares por hábito de quantidade (volume,
   constância, superação), mais "hábitos" e "superação total". O catálogo só tem o Codeforces, então os 5 saem do CF e quem
   é forte nele ganha tudo.
2. **Os placares acumulam e não zeram.** Constância, hábitos e superação total valem pela temporada inteira: o líder
   foge e os outros param de olhar.
3. **A única fonte prevista de Trick Coin era a posição (#69).** A moeda ia para quem já lidera e comprava ainda mais
   vantagem. A recompensa devia compensar o monopólio, e ela o alimentava.
4. **Os desafios de item da loja se medem pela própria Torre** ("liderar 3 semanas", "subir 3 posições", "pódio"), então
   dão item a quem já lidera.
5. **A sub-aba desafios (#71) estava "depois da 1.0"**, sem desenho.

## Princípios

- **Rivalidade que premia a competição, mas todos avançam.** Quem lidera ganha prestígio e voz; quem completa ganha a
  recompensa. O jogo não pode parecer uma corrida que só um vence.
- **Posição não paga moeda.** Trick Coin só por completar desafios, com valor fixo e igual para todos.
- **Cada placar responde a uma pergunta diferente:** quem foi melhor esta semana (Geral), quem evoluiu (Superação), o
  que fazemos juntos (cooperativo, sem posição).
- **Não sobrecarregar.** No máximo **3 coisas visíveis** de uma vez. O que não pede decisão é automático; o que pede uma
  escolha (duelo, pacto) chega por **convite** e só entra se a pessoa aceitar.
- **Mantêm-se** os princípios do `COLETIVO.md`: tarefas e XP bruto nunca saem da máquina; compara-se só o difícil de
  inflar (XP com teto, hábitos, superação, evolução); combinado entre amigos, não anti-fraude; nada pune.

## Placares

Dois pódios. Os placares por hábito (CF, Duolingo...) **deixam de ser placares** e viram detalhe do perfil do jogador.

### Geral (semanal, zera toda semana)

Soma de **4 blocos de 0 a 100, cada um com teto**, calculados sobre a semana fechada:

| Bloco | Como mede |
|---|---|
| **Ritmo** | `Σ min(XP do dia, teto) ÷ (7 × teto)`: a regra A do `COLETIVO.md`, que não muda |
| **Prazos** | % das tarefas com prazo na semana entregues no prazo |
| **Hábitos** | média da constância dos hábitos **que a pessoa liga** (quem não tem CF não perde por isso) |
| **Superação** | o bônus contra a própria base (regra D abaixo) da semana, levado a 0–100 |

- A **modalidade da semana** (card abaixo) dobra um bloco: ele passa a valer até 200.
- O **Codeforces** aparece no Geral só como **fez / não fez dentro de Hábitos**. O volume de problemas vive na tabela do
  dia, para o CF não dominar o Geral.
- **Notas** ficam fora do Geral semanal (só saem quando uma avaliação fecha). Entram na Superação do semestre e no Exame
  Hunter.
- **Empates:** com o teto na mediana, metade do grupo bate 100 em Ritmo toda semana. Desempata a **Superação**, depois os
  **Prazos**. A disputa fica entre quem mais evoluiu e quem mais cumpriu prazo, não entre quem fez mais.
- **A temporada soma rodadas ganhas e medalhas**, não pontos corridos. Uma semana ruim não condena ninguém.

### Superação (contra a própria base)

Mantém a regra D do `COLETIVO.md` (`bônus = S × min(r − 1, 0,5) ÷ 0,5`, base = maior entre a média dos períodos
anteriores e a da temporada, hábito mantido em 100% conta como máximo). O pódio compara quem mais evoluiu, nunca quem
tem mais.

### Recompensas de posição (sem moeda)

- Medalha e título da semana, que contam no Exame Hunter.
- A frase do líder (#76, já decidida).
- **O 1º da semana escolhe a modalidade da semana seguinte** (regras abaixo).

Nada de Trick Coin, XP ou Jenny por posição.

## O card único da semana

Um card só por semana, com **dois efeitos automáticos**, sem nada a configurar:

> **Semana de Prazos.** Entregue tudo no prazo ou ganhe 10% sobre a sua média.

1. **Marca pessoal:** calibrada pela base de cada um (nunca igual para todos). Quem bate a marca ganha uma **recompensa
   fixa em Trick Coin**, igual para qualquer um que cumprir. A marca não depende de pódio.
2. **Modalidade:** dobra no Geral o bloco da semana.

**Modalidade** não é categoria de tarefa (estudo, vida): tarefas não se comparam entre pessoas. É **qual bloco do Geral
conta em dobro** naquela semana: Ritmo, Prazos, Hábitos ou Superação. Em Hábitos o card pode apontar um hábito (CF,
Duolingo...) ⏳. As notas não são modalidade, porque não têm bloco semanal.

### Quem escolhe a modalidade

- Ao fechar a semana, o sistema oferece **3 opções**, nunca a modalidade da semana que passou, e o **1º do Geral**
  escolhe uma. O card mostra "escolhida por Fulano".
- **Freio:** quem ganhou as **duas últimas semanas seguidas** não escolhe. O direito passa para o melhor colocado seguinte
  que possa escolher. Se ele ganhar a terceira seguida, continua sem escolher; só volta quando uma semana passar sem ele
  no 1º lugar.
- **Segundo freio:** a marca é medida contra a base de cada um, então escolher a modalidade em que é forte não dá
  vantagem direta.
- ⏳ Primeira semana (ninguém ganhou ainda): o sistema rotaciona.

## Desafios

Só aparece na tela o que não exige decisão ou o que chega por convite.

| Tipo | Como aparece | Precisa de ação? | Recompensa |
|---|---|---|---|
| **Card da semana** | automático, 1 por semana | não | Trick Coin fixa pela marca |
| **Chefão do grupo** | barra mensal | não | base igual + extra por contribuição |
| **Tabela do dia (CF)** | só para quem tem o hábito | opcional | Trick Coin fixa por faixa + bônus pequeno do primeiro |
| **Duelo (CF)** | caixa de convites | aceitar | Trick Coin fixa |
| **Pacto de hábito** | caixa de convites | aceitar | XP fixo e pequeno |

A corrida deixou de ser um tipo separado: é o bônus do primeiro na tabela do dia.

### Tabela do dia (CF, #71)

- **3 problemas por dia, um por faixa de rating**, sorteados entre os que **ninguém do grupo resolveu**.
- Todo mundo que resolve a faixa dele ganha o **valor fixo**. Quem resolve primeiro ganha um **bônus pequeno**.
- **Piso:** quem é de nível alto não pontua nas faixas baixas (rating atual ou maior nível já resolvido, regra fixa).
- **Teto por pessoa por dia** (sugestão: 2). Acima do teto a pessoa pode resolver, mas **não ganha ponto naquela questão**.
  Se outro membro resolver depois, ele ganha o valor normal, igual a todos, e o **bônus do primeiro passa para o primeiro
  que ainda pontua**, em valor menor, para ainda valer a pena.
- Tudo isso sai da API pública do Codeforces, sem IA: `problemset.problems`, `user.status` e o horário da submissão aceita.
  A IA pode entrar só como extra (dicas, tema da semana), como descrito na #71 e na #99.
- Os números (3 problemas, teto 2, tamanho do bônus, faixas) ficam no administrar.

### Duelo 1×1 (CF)

- Um convida o outro. O problema é sorteado na faixa do **mais fraco** dos dois (handicap) e vence quem resolver
  primeiro. Quem perde também resolveu um problema, então também avançou.
- Recompensa de Trick Coin fixa. ⏳ Aposta e valor.

### Chefão do grupo (mensal)

- **Vida = a soma da meta de cada um**, calibrada abaixo do que o grupo faz normalmente (sugestão: ~80% das bases
  somadas).
- Todo dia de todo mundo tira um pedaço. Cada pessoa tem **teto de contribuição**, para ninguém carregar o grupo sozinho.
- Se a barra zerar até o fim do mês, todos que passaram do **mínimo de contribuição** ganham a **recompensa base** igual.
  Quem contribuiu mais ganha um **extra de 100% a 150%** da base, medido **contra a base de cada um**: o mais fraco que deu
  o máximo dele ganha o mesmo extra que o forte que deu o máximo dele.
- Título "Carregou o grupo nas costas" (já existe no catálogo) para quem mais contribuiu.
- ⏳ O que a contribuição mede (XP com teto? o Geral inteiro?) e a recompensa coletiva (item coletivo grátis, como previsto
  em "Lojas").

### Pacto de hábito

- Um membro **propõe um hábito**; se os dois seguirem por X dias, os dois ganham **XP fixo e pequeno** (o XP é do jogo
  pessoal de cada um). É a versão de dois do catálogo de hábitos: sem admin.
- Limites: **1 ou 2 pactos ativos por pessoa**; XP fixo (senão dois amigos criam "beber água" e inflam o XP).
- Só **fez / não fez** sai da máquina; o nome do hábito pessoal nunca sai.
- **Sem punição.** Cada um ganha pelos próprios dias e há um bônus de dupla se os dois completarem.
- ⏳ X dias e o valor do XP. Mexe em XP: ver "Cuidados".

## Fases

1. **Fase 1:** placar enxuto (Geral e Superação semanais, placares por hábito saem) e o card da semana com a escolha da
   modalidade. Resolve o monopólio e é tudo automático.
2. **Fase 2:** tabela do dia e duelo do CF (o handle do CF vai para o servidor do grupo, que passa a consultar a API).
3. **Fase 3:** chefão do grupo e pacto de hábito.

Decidido na ordem do Caio: o CF vem na fase 2, antes do chefão e do pacto.

## Licença e prestígio (decidido em 21/10/2026, segunda conversa)

- **A licença hunter fica, e na tela inicial da aba.** É a carteira que cada um monta com o que ganhou e comprou; o Caio
  quer que ela fique à vista, não escondida no perfil. A frente passa a mostrar a posição na semana, as rodadas ganhas e
  as medalhas; o verso, as medalhas por posição, os números por hábito (os antigos placares) e o registro.
- **Liderança vira prestígio grátis, não item.** As estrelas da licença saem das rodadas ganhas (★ na primeira, ★★ na
  quarta; ★★★ continua o lendário Hunter Três Estrelas) e os títulos de liderança ("Top 1 desde 1999", "Presidente da
  Associação") são dados automaticamente. Saem da loja como itens de desafio: **Estrela ★**, **Estrelas ★★**, **Top 1
  desde 1999**, **Ren no pódio** e **Entrada no pódio** (os dois últimos viram efeito de quem ganhou a semana, ou saem).
- **Os desafios de item** passam a sair do que todos podem cumprir: marca da semana, chefão, tabela do dia e pacto.

## A aba (protótipo na beta, atrás do botão antiga | nova)

Sub-abas: **semana** · **desafios** · **temporada** · **hunters** · **loja** (· administrar). No máximo 3 coisas por tela.

- **semana** (a inicial): a licença (vira com um clique) e um resumo (posição na semana, rodadas, marcas batidas); o
  card da semana (modalidade, marca pessoal com barra, quem escolhe a próxima); o placar da semana com a troca
  **Geral | Superação**, os 4 blocos de cada um (o da modalidade em dobro) e a frase do líder no rodapé.
- **desafios**: tabela do dia do CF e convites (duelo, pacto), à esquerda; chefão do mês (barra de vida e a contribuição
  de cada um contra a própria meta, com o mínimo e o teto) e as suas marcas semana a semana, à direita.
- **temporada**: rodadas ganhas, medalhas, pódios de superação, marcas batidas e estrelas; a grade semana a semana com a
  posição de cada um e a modalidade de cada semana.
- **hunters**: a licença de cada um, frente e verso, os blocos da semana e os números por hábito (sem posição).

O servidor do grupo já calcula de verdade (em `torre.py`, `semanal()` e `chefao()`): o Geral semanal com Ritmo, Hábitos
e Superação, o pódio de superação, a marca pessoal (10% sobre a média das últimas 4 semanas, ou +5, com piso de 20), a
temporada em rodadas e medalhas e o chefão do mês (meta = 80% do XP com teto de um mês normal de cada um, pelas últimas 4
semanas; teto 150%; mínimo 50%). **Prévia** (marcado na tela): Prazos (falta no protocolo), a escolha da modalidade (o
sistema rotaciona Ritmo, Hábitos e Superação), a tabela do dia, o duelo, o pacto e a Trick Coin.

Primeira leitura com os dados reais (21/10): com 80%, o grupo derrotou o chefão de outubro já no dia 21; a vida precisa
subir. A frase do líder ainda segue o líder dos andares, não o 1º do Geral semanal.

## O que muda no COLETIVO.md

| Seção do COLETIVO.md | Situação |
|---|---|
| Princípios, Nomes, Arquitetura, Servidor da Associação | **ficam** |
| A. XP do dia com teto, Calibração automática | **ficam** (viram o bloco Ritmo e a base da calibração) |
| B. Hábitos coletivos (catálogo, vínculo) | **ficam**; os "pontos por hábito" (0,2× o teto) saem: o bloco Hábitos é constância |
| C. Missão da semana | continua para depois |
| D. Superação | **fica**, com período semanal no Geral |
| E. Notas pela evolução | **ficam**, fora do Geral semanal (Superação do semestre e Exame Hunter) |
| F. Cooperativo | **vira** o chefão do grupo desta seção; o Ten do grupo segue ⏳ |
| A aba Torre Trick e os placares: placares gerados pelo catálogo (volume, constância, superação por hábito, hábitos, superação total) | **saem**; ficam Geral e Superação |
| Recompensas por posição (medalhas, Trick Coin) | **medalha, título e escolha da modalidade**; moeda não |
| Lojas (Masadora, Associação) | **ficam**; ver "Cuidados" |
| Baú de ideias: batalha 1×1 e problemas sugeridos do CF | **entram** como duelo e tabela do dia |

## O que muda nos dados e no servidor

- **Prazos:** o resumo do jogo (`resumoGrupo`, `protocolo: 1`) leva hoje `xp`, `hab`, `missao` e `ferias`. Entregas no
  prazo não vão. Precisa de **um fato novo no protocolo** (versão do jogo e do servidor).
- **Handle do CF:** hoje só a contagem diária vai. O handle (público) precisa ir para o servidor do grupo na fase 2.
- **Tabelas novas no servidor:** convites de duelo e pacto, tabela do dia, escolha da modalidade, chefão do mês.
- **`torre.py`:** `specs()` deixa de gerar placares por hábito; o Geral passa a ser calculado por semana fechada.

## Cuidados

- **Mexe em pontos:** a mudança de XP, Jenny ou pontos sai com janela grande na Novidades, como a 0.6 (regra do Caio). O
  Geral novo e o XP do pacto entram nisso.
- **Desafios de item que dependem de liderar:** decidido em 21/10 (ver "Licença e prestígio"). Falta trocar, na lista
  da loja (`LOJA_TT` em `web/grupo.js`), os desafios dos itens que sobram pelos do desenho novo.
- **Andares** (a unidade "andar descido" da Torre Trick, acumulada): ⏳ não foi decidido o que acontece com ela. Hipótese:
  segue acumulando os pontos semanais do Geral como progressão individual, sem ser pódio.
- **Trick Coin sem posição:** a fonte passa a ser completar desafios. ⏳ Valores, para não ficar sem moeda nem inflar.

## Pendências (⏳)

1. Percentual da marca pessoal (10% sobre a média é só o exemplo) e valor da recompensa em Trick Coin.
2. Teto e piso da tabela do dia (sugestão: 3 problemas, teto 2) e tamanho do bônus do primeiro.
3. Aposta e valor do duelo.
4. O que a contribuição do chefão mede, o mínimo de participação e a recompensa coletiva.
5. X dias e XP do pacto.
6. O que acontece com os andares.
7. Primeira semana da escolha de modalidade; escolha de hábito dentro da modalidade Hábitos.
8. ~~Revisar os desafios de item da loja que dependem de liderança~~: decidido em 21/10 (prestígio grátis); falta trocar
   os desafios dos outros itens na `LOJA_TT`.
9. Os 4 blocos do Geral foram aceitos sem avaliação completa (o Caio não conseguiu julgar tudo em 21/10): **rever com o
   uso real** quando a fase 1 estiver na beta; o Prazos é o único que pede dado novo.
