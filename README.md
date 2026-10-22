# Ganbatte

Um jogo (tema Hunter x Hunter) em cima do [todo.txt](https://github.com/todotxt/todo.txt): você conclui tarefas e sobe a
**Arena Celestial**, enfrenta as disciplinas como **chefões** (vida = nota), mantém o **Ten** (dias seguidos) e gasta
**Jenny** na loja. Roda no seu computador, sem conta e quase sem internet: só o Codeforces e o Duolingo (se você ligar) e a
conferência de versão nova (uma leitura do GitHub a cada 6 horas) saem do computador.
Precisa apenas do Python 3.8 ou mais novo, no Linux, Windows ou Mac.

> **Versão 0.6.5.** A 0.3 foi testada no Linux por amigos, com foco em usabilidade. No Windows e no Mac ainda não foi testada
> (inclusive o instalador e o início automático): se algo der errado, avise. O que está planejado fica em [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).
> O desenho do modo em grupo (placar **Torre Trick**) está em [`docs/COLETIVO.md`](docs/COLETIVO.md) e ainda não existe.

## Instalação rápida (um comando)

Precisa do Python 3 (veja abaixo como conferir). Abra um terminal e rode:

| Sistema | Comando |
|---|---|
| Linux / Mac | `curl -fsSL https://raw.githubusercontent.com/CaioParanaiba/ganbatte/main/instalar.sh \| sh` |
| Windows (PowerShell) | `irm https://raw.githubusercontent.com/CaioParanaiba/ganbatte/main/instalar.ps1 \| iex` |

Ele baixa o jogo na pasta `ganbatte` dentro da sua pasta de usuário (ou atualiza, se já estiver lá; quem instalou antes na `todo-engine` continua nela) e abre o jogo. Na
primeira vez, o terminal explica o que é o servidor e pergunta se ele deve **iniciar sempre com o computador**; dizendo
sim, é só abrir http://127.0.0.1:8642/ quando quiser jogar. Rodar o mesmo comando de novo atualiza o jogo (e reinicia o
servidor que estiver em segundo plano; com `git pull`, o servidor percebe o código novo e se reinicia sozinho em até 20 s).

Prefere fazer à mão? Siga os passos abaixo.

## Instalação passo a passo

### 1. Tenha o Python 3

- **Linux:** quase sempre já vem instalado. Confira com `python3 --version`.
- **Mac:** abra o Terminal e rode `python3 --version`. Se não tiver, o próprio Mac oferece instalar.
- **Windows:** baixe em [python.org/downloads](https://www.python.org/downloads/). Na primeira tela do instalador, **marque
  "Add python.exe to PATH"** antes de clicar em Install.

### 2. Baixe o jogo

- **Com git:** `git clone https://github.com/CaioParanaiba/ganbatte.git`
- **Sem git:** no topo desta página, clique em **Code → Download ZIP** e extraia a pasta onde quiser.

### 3. Rode

Abra um terminal **dentro da pasta do jogo** e rode:

| Sistema | Comando |
|---|---|
| Linux / Mac | `python3 servidor.py` |
| Windows | `py servidor.py` |

No Windows, um jeito fácil de abrir o terminal na pasta certa: abra a pasta no Explorador, clique na barra de endereço,
digite `cmd` e aperte Enter.

O navegador abre sozinho em **http://127.0.0.1:8642/**. Na primeira vez aparece um assistente que pergunta seu nome,
mostra como o jogo funciona e os 6 tipos de Nen, pergunta os hábitos e se você tem matérias (elas se cadastram depois,
na aba Chefões, à mão ou com a IA), e no fim oferece um tour por cada aba.

**Deixe a janela do terminal aberta enquanto joga.** Para parar, aperte `Ctrl+C` nela. Para jogar de novo, rode o mesmo
comando.

### 4. (Opcional) Iniciar com o computador

Para não precisar rodar o comando toda vez, ligue **"Iniciar com o computador"** na aba **Configurações**. O servidor passa a
rodar em segundo plano (pode fechar o terminal) e a iniciar sozinho quando você liga o PC. Depois é só abrir
**http://127.0.0.1:8642/**; vale salvar nos favoritos. Parado, ele gasta quase nada.

Para desligar, desmarque a mesma opção. Pelo terminal também dá: `python3 servidor.py --instalar` e
`python3 servidor.py --desinstalar` (no Windows, `py` no lugar de `python3`).

Se mudar a pasta do jogo de lugar, desligue e ligue de novo para o início automático achar o caminho novo.

## Onde ficam os seus dados

Tudo o que é seu fica numa pasta separada do código:

| Sistema | Pasta |
|---|---|
| Linux / Mac | `~/.ganbatte/` |
| Windows | `C:\Users\SEU_USUARIO\.ganbatte\` |

| Arquivo | O que tem |
|---|---|
| `todo.txt`, `done.txt` | suas tarefas, no formato todo.txt (as concluídas vão para o `done.txt` no dia seguinte) |
| `jogador.json` | nome, tags, hábitos, disciplinas, Codeforces e Duolingo |
| `avaliacoes.txt`, `notas.txt` | plano de avaliação das disciplinas e notas lançadas (o editor do chefão guarda a versão anterior em `.bak`) |
| `narradas.json` | cartas narradas do Book |
| `conquistas.json` | conquistas criadas pela IA (Book, 200 em diante) e o que você resgatou |
| `estado.json` | loja, Jenny gasta (com o registro de compras, desde a 0.6.3-beta2) e o que está equipado |
| `cf.json`, `duo.json`, `contrib.json` | o que o jogo leu do Codeforces, do Duolingo e das suas issues no GitHub |
| `colecao/` | coleção permanente (#33): `colecao.json` com uma cópia de cada item comprado (nome, categoria, como equipar, origem e dia) e `arquivos/` com a imagem dele. Só cresce; a temporada nova e as versões novas do jogo não mexem nela |
| `temporadas/` | cada temporada que acabou (`2026-2/`...): `resumo.json` com os números finais congelados e uma cópia dos arquivos daquele momento |
| `servidor.log` | o que o servidor anotou quando roda em segundo plano |

Para fazer backup, use o botão **baixar meus dados** na aba Configurações (um ZIP da pasta) ou copie a pasta. Para usar outra pasta: `python3 servidor.py --dados CAMINHO`. Se você já tem um todo.txt em outra pasta (com o todo.sh ou outro app), use `--todo PASTA`: o jogo lê e grava o `todo.txt` e o `done.txt` de lá, e o resto continua na pasta de dados.

## Atualizar

O jogo confere sozinho se saiu versão nova e avisa na aba **Novidades** (com um ponto amarelo no menu). Lá, o botão
**atualizar agora** baixa a versão nova (pelo git ou, sem git, pelo ZIP do GitHub) e reinicia o jogo. A mesma aba
explica o que mudou em cada versão.

À mão também dá:

- **Com git:** `git pull` dentro da pasta do jogo.
- **Sem git:** rode de novo o comando da instalação rápida (ele baixa por cima) ou baixe o ZIP e substitua a pasta do jogo.

Atualizar nunca mexe nos seus dados, porque eles ficam fora da pasta do código.

### Versão de teste (beta)

As novidades saem primeiro na branch `beta` e passam para a `main` (a versão normal) depois de testadas. Em
**Configurações → servidor**, **Versão** escolhe entre **Estável** (`main`) e **Beta**; o aviso de versão nova e o
**atualizar agora** seguem a escolhida. O modo em grupo (0.9) nasceu na branch `grupo`, que entrou na `beta` na
0.9.0-beta2 e ficou parada; quem ainda está nela passa para a `beta` no próximo **atualizar agora**.

Pelo terminal é o mesmo: `git -C ~/ganbatte switch beta` (`switch main` para voltar). Só funciona no jogo instalado
com git; o instalado pelo ZIP fica sempre na versão normal.

A beta pode ter erros que ainda não foram corrigidos. Os dados continuam na mesma pasta, mas uma versão de teste pode
gravar coisas novas neles que a versão normal ainda não conhece. Baixe os seus dados (Configurações → backup) antes de
trocar. Achou um problema? O balão de feedback no canto da tela abre uma issue já preenchida.

## Sem instalar: modo demonstração

**Online:** https://caioparanaiba.github.io/ganbatte/ (atualiza sozinho a cada mudança na página).
**No computador:** abra o arquivo `web/index.html` direto no navegador (dois cliques).

Entra um jogador de exemplo, com histórico, e nada é gravado: recarregar a página volta ao começo.

## Problemas comuns

- **"python3 não é reconhecido" / "py não é reconhecido" (Windows):** o Python foi instalado sem marcar "Add to PATH".
  Rode o instalador de novo, escolha **Modify** e marque a opção.
- **"A porta 8642 está ocupada":** outro programa usa essa porta. Rode com outra: `python3 servidor.py --porta 8643`.
- **O navegador não abriu:** abra http://127.0.0.1:8642/ à mão.
- **Aviso amarelo "o servidor do jogo ainda está na versão...":** o servidor antigo continua ligado. Rode o instalador de
  novo ou reinicie o computador (Linux: `systemctl --user restart ganbatte`) e recarregue a página.
- **A IA não aparece em Configurações → IA:** instale e entre na conta da IA pelo terminal (`codex login`, `claude`,
  `agy`, `gemini`) e clique em **procurar de novo**. O jogo procura no PATH do seu terminal e nas pastas comuns (npm, nvm, ~/.local/bin).
- **Esqueci de marcar um hábito ontem:** no card "hábitos de hoje", clique em **esqueci de marcar ontem**. Ele conta
  para ontem (XP, nível do hábito e heatmap). Só vale para o dia anterior.
- **Codeforces não conta:** confira o handle na aba Configurações. A contagem atualiza a cada 10 minutos e precisa de internet.
  Problema feito onde a API não enxerga (ITMO Academy, contest de grupo privado): clique no ✋ ao lado de "Codeforces" no
  heatmap da Lista e confirme; cada confirmação soma 1 problema hoje. Cada problema vale pela cor dele comparada à sua
  faixa (Book → Regras); problema de contest recente vale por uma estimativa até o Codeforces dar o rating.
- **Recompensa de bug ou ideia não veio:** confira o usuário do GitHub em Configurações. O jogo confere a cada 6 horas e só
  conta a issue que você abriu e que foi fechada como resolvida (bug corrigido, ideia feita); repetida ou recusada não conta.
- **Duolingo não conta:** confira o usuário na aba Configurações (o nome do perfil, sem senha). O jogo lê a ofensiva do
  perfil a cada 10 minutos e precisa de internet. O dia salvo pelo bloqueio de ofensiva não conta, de propósito: no jogo,
  quem guarda folga é o Zetsu. Os dias da ofensiva de antes de ligar ficam no heatmap e nas conquistas e sobem o nível do hábito (até os de antes da temporada, pela ofensiva lida; #51), sem XP nem Ten. Com o jogo fechado vários dias e um bloqueio no meio, o Duolingo diz quantos dias você fez,
  não quais: o jogo marca os mais recentes.
- **Não sei qual tipo escolher para a tarefa:** o jogo sugere pelas palavras do texto; o **?** ao lado dos tipos mostra o
  que encaixa em quê, e com a IA ligada o **IA?** pergunta a ela.

## Como funciona por dentro

- `servidor.py`: servidor local (só a biblioteca padrão do Python). Lê e grava os seus arquivos, cria os hábitos de cada dia
  e consulta o Codeforces e o Duolingo. Só aceita conexões do próprio computador.
- `web/index.html`: a página do jogo. `web/motor.js`: todas as regras e contas. `web/guia.js`: assistente e tutorial.
  `web/chefes.js`: editor de avaliações e notas. `web/ia.js`: pedidos para a IA e a IA ligada. `web/conquistas.js`:
  conquistas criadas pela IA (as regras ficam no motor). Novas cartas exigem mínimos de volume e dias de atividade,
  sequências, semanas completas de XP e nota com peso mínimo, sem promover o rank pela falta de histórico (#75).
  `node tests/test_conquistas.mjs` confere as regras; `node ferramentas/simulador-conquistas.mjs --antes REF`
  simula os resgates dia a dia e compara com uma revisão anterior. Cartas antigas conservam suas regras. `web/novidades.js`: aba Novidades, com a lista de versões que o
  servidor lê do GitHub para avisar de versão nova (ao lançar uma, ponha-a no topo). `web/feedback.js`: bug, ideia ou
  dúvida vira uma issue preenchida pelos formulários de `.github/ISSUE_TEMPLATE/`. `web/temporadas.js`: guarda a temporada que acabou em `temporadas/NOME/` (a cápsula é `GB.capsula` no motor; `TEMA` no motor
  tem os nomes temáticos das funções). `web/efeitos.js`: o que os itens
  da Masadora fazem na tela (texturas, molduras, fontes, animações, sons, bordas e hover dos cards, cursores, barra de HP, heatmap e troca de aba; os itens e preços ficam no `COS` do motor, a faixa e o tema HxH de cada um no `FAIXA` e no `HXH`, e o preço dos pacotes em `pacote()`). `web/demo.js`: o servidor de mentira do
  modo demonstração (também usado no GitHub Pages). `web/a/`: o banco de fotos de perfil; cada PNG (256×256, nome com
  letras, números, `-`, `_` ou `.`) vira um item da Masadora por 1.000 J (os grátis ficam no `AV_GRATIS` do motor). O
  jogador não envia fotos: quem desenvolve põe aqui, e só imagens que podem ser distribuídas. Não renomeie uma foto que já
  saiu: o nome é o id do item comprado e equipado.
  `web/chefoes/`: as fotos marcadas como chefão (#33), 256×256 (`RETRATOS` no motor). Cada uma é vendida como retrato de
  chefão; o ícone do `avaliacoes.txt` continua o padrão, e o retrato escolhido fica em `estado.json` → `equip.chefes`
  (sigla → item, um chefão por retrato). A versão de perfil só vem ao derrotar o chefão que está com ela, e a imagem dele
  trava (`travas`). A origem de cada imagem fica no [`CREDITOS.md`](CREDITOS.md).
- **Modo em grupo** (0.9): `grupo/servidor_grupo.py` é o servidor do grupo (Associação), separado do
  jogo: SQLite, porta 8643, dados em `~/.ganbatte-grupo/`, serviço `ganbatte-grupo`; `grupo/torre.py` faz as contas da
  Torre Trick (andares, placares específicos, títulos, evolução) a partir dos fatos. `web/grupo.js` faz a aba do grupo
  (sub-abas *placar*, *placares* e *jogadores*, com a licença hunter, e *administrar*) e o card *grupo* em Configurações; o `servidor.py` (rotas `/api/grupo/*`) guarda o
  token e manda ao servidor do grupo só os dias que mudaram. Desenho e decisões em `docs/COLETIVO.md`.
- **Testes:** `python3 -m unittest discover tests` (pasta de dados temporária e a internet simulada; ver `tests/test_servidor.py`
  e, do modo em grupo, `tests/test_grupo.py`).
- **Balanceamento:** `node ferramentas/simulador.mjs` joga uma temporada com três jogadores inventados pelo `web/motor.js` e
  mostra XP, andar, Jenny e quanto da loja cada um compra; `--comparar relatorio.json` põe ao lado o relatório de um
  jogador de verdade (Configurações → balanceamento). Os perfis ficam no topo do arquivo.
- **IA opcional.** O jogo funciona sem IA. Com uma IA de terminal instalada (Claude Code, Codex, Antigravity CLI ou Gemini CLI), ligue-a
  em **Configurações → IA**: o jogo passa a ler os planos de ensino (pasta `~/.ganbatte/planos/`), aplicar a caixa de entrada
  e escrever as cartas do Book sozinho, e propõe conquistas feitas para você (no Book); você confere antes de salvar. Sem ela, o jogo monta os pedidos e você cola
  numa IA de chat. Veja [`IA.md`](IA.md).

## Versões

| Versão | Nome | O que trouxe |
|---|---|---|
| 0.9.2-beta9 | atualização da Torre Trick | Compras da Aparência pausadas até o balanceamento dos preços (`LOJA_TRAVADA` no motor; provar, o que é seu, feitiços e prêmios reais seguem normais) (#77). |
| 0.9.2-beta8 | atualização da Torre Trick | Torre com custo dobrado (16/32/80, `TORRE` no motor; `migra.torre` guarda o andar antigo e `S.andarRec` mantém conquistas e títulos de andar), itens `prova:1` à venda por `PRECO_FAIXA` e arte das lojas fechada: a nova vira a oficial (`GB_ARTE.oficial`), sem troca, aviso nem borda de status, e os efeitos de evento em código ligam no jogo (`GB_FX.novo`) (#77, #134, PR #190). A janela grande da Novidades vem depois. |
| 0.9.2-beta7 | atualização da Torre Trick | Codeforces pela cor do problema e contribuições só em Jenny, com o aviso grande na Novidades (#180, PR #182). Aba nova do grupo atrás do botão antiga \| nova, com o Geral semanal, a Superação, a marca, o chefão do mês e a temporada calculados no servidor do grupo (`grupo/torre.py`, `semanal()` e `chefao()`, #170, PR #187). Lista nova atrás de um botão (#178, PR #179). Lojas (#134, PRs #174 a #177, #181, #183 e #175): Terminal vivo, Ascensão, Confete, Fogos, Fúria, Poeira de Nen, Aura ambiente, texturas, Costura de nen e Futuro Médico; mundo pixel arquivado; paletas, fontes, títulos e sons fechados. |
| 0.9.2-beta6 | atualização da Torre Trick | Lojas (#134, PRs #163 a #167 e este). Vara de pescar do Gon em código, cursor épico HxH (`web/arte/vara.js`, #167). Rastro de aura em três modelos: Aura nova, Fio de aura e Eco do Killua (`web/arte/rastro.js`, #163). HP de cristal e Constância em pegadas refeitos em código (#164). Gyo novo, Soco remoto e Dragon Dive para provar; borda de status da vitrine no card inteiro, com cores fixas (#165). Constância no Gungi (`web/arte/gungi.js`, #166) |
| 0.9.2-beta5 | atualização da Torre Trick | Lojas (#134, PRs #160, #161 e este). Na beta, a borda do card da vitrine mostra o status da arte (`GB_ARTE.borda`): verde fechado, dourada aprovada pelo Caio com o outro dev faltando, vermelha em aberto ou ainda não revisto; legenda no quadro da arte nova, e `fixo` na tabela `ARTE` para o que já está no jogo ou fica como hoje. Costura da Machi em código, épico, no jogo para provar (`web/arte/costura.js`, #161). Barra elétrica do Killua refeita, raro HxH (#160). Soco remoto do Leorio e Borboletas do Pouf em prévia na bancada; Cartas do Hisoka ficam no formato original |
| 0.9.2-beta4 | atualização da Torre Trick | Lojas (#134, PRs #154 a #158). Masadora em famílias (Perfil, Cores e fundo, Cards e telas, Efeitos e sons; `FAM7`), card enxuto com detalhe ao lado, filtros numa linha e "esconder o que já tenho" (#157). Transições de aba em código (`docs/lojas/arte/transicoes/`, `GB_ARTE.aba` em volta do `tab()`): Fumaça do Morel e Deme-chan novas, Deslizar e Glitch lapidados com `-nova` (#158). Correntes do Kurapika num gerador só (`web/arte/corrente.js`), bordas Canto cortado e Cantos, sem Carta e Teia, Aura na cor do tipo (#156). Retratos de chefão escolhidos na aba Chefões e fora da loja (#155). Carta que vira em código, cursores sem selecionar texto, En menor, ioiô único, Fogos raro (#154) |
| 0.9.2-beta3 | atualização da Torre Trick | Lojas (#134, PRs #151, #152 e este). Masadora: o que é do jogador volta à vitrine com o selo "já comprado" (e segue em Comprados) e a Aparência ganha a vista por raridade ao lado da por categoria (`UI.vis7`); os filtros valem nas duas. Hovers em código (Bungee Gum, En, Carta que vira, Shu, Contorno) no provar, colados pelo `web/arte.js` quando o `data-hover` ganha `-nova`. Godspeed refeito; agulha, ioiô, Jajanken e chamas fechados. Ideias da fila sem arte entram como card "em desenvolvimento" (`IDEIAS` no `web/arte.js`), com a categoria Marca de prazo em teste (Countdown do Genthru) |
| 0.9.2-beta2 | atualização da Torre Trick | Arte nova das lojas em teste (#134, PR #148): a fila de arte (`docs/lojas/arte/`) entra no jogo para os devs provarem. `web/arte.js` põe em cada item com arte nova o status (fechado, falta finalizar, em aberto), o que falta e a troca antiga/nova; a nova só aparece no provar, no ▶ e no provador (o atributo do `<html>` ganha `-nova`), nada dela se compra. Módulos em código (cursores, Godspeed, Jajanken, heatmaps) e imagens aprovadas em `web/arte/`, levados pelo `docs/lojas/arte/leva.py`; o cartão novo da licença no provador da Associação (`web/arte/licenca.js`). Rota `/arte/` no servidor |
| 0.9.2-beta1 | atualização da Torre Trick | Lojas (#134). Masadora (#135, PR #139): faixa e selo HxH em cada item (`FAIXA`, `HXH` no motor), filtros, temas viram pacotes com preço pelas peças que faltam (`pacote()`), 30 itens novos só para provar (bordas, hover, cursor, HP, heatmap, troca de aba), molduras especiais e Aura vão para o grupo, retratos e títulos de conquista grátis, Jenny dos retratos devolvida (`acertos.retratos`). Loja da Associação (#136, PR #140): sub-aba loja da Torre Trick com vitrine e provador da licença. Vitrines em `docs/lojas/` (PR #138). Janela de aviso pela Jenny dos retratos e pelos pacotes |
| **0.9.1** | **atualização da Torre Trick** | **Junta a 0.9.1-beta1 e a beta2** (as linhas abaixo): tipos das tarefas novos (#121, #5), tarefas recorrentes (#113), janela do N recolhida (#111), Enter depois das opções (#112), foto nova no grupo (#109), primeira entrada refeita (#127), tutoriais enxutos e a frase de cada tipo de Nen na regra nova (#131, direto na `main`, sem beta). A entrada leva o `"aviso": "0.9.1-beta1"` com o hexágono de Nen: quem viu na beta não vê de novo; quem vem da 0.9 na `main` vê uma vez |
| 0.9.1-beta2 | atualização da Torre Trick | Primeira entrada refeita (#127, PR #128): licença ao vivo, hexágono dos tipos, passo "tarefa, caçada ou projeto", matérias na aba Chefões. Tutoriais enxutos (PR #129): passos com `se()` pulam o que o jogador não tem, aba Chefões vazia sem tour, passo do Codeforces corrigido, tipo projeto na janela de caçada |
| 0.9.1-beta1 | atualização da Torre Trick | Tipos das tarefas (#121): faculdade sai, treino e projeto (`+projeto`, Conjuração) se separam; sugestões de tipo e prioridade novas (#5). Tarefas recorrentes com `rep:` (#113). Janela do N recolhida (#111), Enter depois das opções (#112), foto nova no grupo (#109). Janela de aviso com o hexágono de Nen de cada um passando do antes para o depois (`"atributos"` no `novidades.js`, `migra.tipos`) |
| **0.9** | **atualização da Torre Trick** | **A maior atualização do Ganbatte. Junta a 0.7.1-beta1 e a 0.9.0-beta1 a beta4** (as linhas abaixo): modo em grupo com a Torre Trick, a licença hunter e os placares (#38 a #42, #67, #76, #84, #91), caçadas dentro de caçadas (#92), retratos dos chefões e coleção permanente (#33), Jenny de cada tarefa (#57), desafios da IA mais justos (#75), cadastros seguidos (#58, #59), Antigravity na IA (#60), contribuição paga no beta e tarefa de dev (#96, #97). Janela épica com a marca `0.9-final`, a mesma das betas, e o agradecimento a quem contribuiu |
| 0.9.0-beta4 | atualização da Torre Trick | Tarefa de dev na expedição Ganbatte aberta (`projeto_dev()`, PR #102), para todos os devs ficarem com a automação. A janela épica da 0.9 passa para a beta4 com a mesma marca (`0.9-final`): quem pulou a beta3 vê, quem viu não vê de novo. |
| 0.9.0-beta3 | atualização da Torre Trick | Entrar no grupo pela aba Torre Trick (#84), mudar o servidor do grupo de computador (#91), caçadas dentro de caçadas (#92), contribuição paga no beta e tarefa de dev pelo responsável (#96, #97). **Janela épica definitiva da 0.9** (`"marca": "0.9-final"` no `novidades.js`): quem viu a da beta2 vê de novo, e a main usa a mesma marca. |
| 0.9.0-beta2 | atualização da Torre Trick | **A grupo entra na beta.** Junta a branch `grupo` (0.9.0-beta1, #41, #42, #67, #76) com a beta (0.7.1-beta1, #57, #59, #60, #75): modo em grupo, Torre Trick e a aba dela para todos da beta. O canal `grupo` some de `CANAIS`: a cópia que ainda está nela passa para a `beta` ao atualizar (`api_atualizar`). Novidades com a janela grande da 0.9. |
| 0.9.0-beta1 | atualização do grupo | Só na branch `grupo`. **Modo em grupo, estrutura** (#38, #39, #40): `grupo/servidor_grupo.py` (serviço `ganbatte-grupo`, porta 8643, SQLite em `~/.ganbatte-grupo/`, tokens só com hash, `dono.token`, fechamento às 6h no fuso do grupo com 12h ligado, cópia diária), rotas `/api/grupo/*` no `servidor.py` (`grupo.json`, `enviado.json`, `grupo/`), `web/grupo.js` (aba Grupo com o placar só de fatos e *administrar*; card *grupo* em Configurações com o Funnel em modo misto). Pontos da Torre Trick ficam para a #42 |
| 0.7.1-beta1 | atualização do Ganbatte | Retratos dos chefões e coleção permanente (#33): fotos marcadas como chefão (`RETRATOS` no motor, `web/chefoes/`, créditos no `CREDITOS.md`) vendidas como retrato (`ch-SLUG`, 1.500 J, um dono por retrato, `equip.chefes`); o chefão derrotado trava a imagem (`travas`) e libera a foto de perfil (`av-ch-SLUG`). Loja → Comprados: o que é do jogador sai da vitrine. `colecao/` nos dados (`POST /api/colecao`): cópia de cada item comprado e da imagem, com `uid` e `hist`, só cresce |
| **0.7** | **atualização do Ganbatte** | **Junta a 0.6.6-beta1 a beta3** (as linhas abaixo): o nome Ganbatte com os links novos (repositório `CaioParanaiba/ganbatte`, Pages em `caioparanaiba.github.io/ganbatte`; o GitHub redireciona o git, o ZIP e o raw do nome antigo, então as cópias instaladas continuam atualizando), o visual Nen, os nomes base das abas, prazo da caçada, tarefa vira caçada e cofre opcional. Janela grande com `"cap"`, a escolha do visual (`"visual"`, Nen ou clássico na hora) e o agradecimento a quem contribuiu (`"obrigado"`) |
| 0.6.6-beta3 | atualização das expedições | Visual Nen como padrão (bloco `gb-visual` com `:where(.vis-nen)`, clássico em Configurações → configurações deste computador, `localStorage` → `gb-visual`), marca do jogo (`MARCA`) no cabeçalho, no favicon e no assistente, XP sempre na ponta da linha da Lista e o modo demonstração esperando os scripts de baixo |
| 0.6.6-beta2 | atualização das expedições | **Nome Ganbatte** (#15): pasta de dados `~/.ganbatte` (`migra_pasta()` move a `~/.hunter-todo` na primeira vez e deixa um atalho; outra pasta escolhida fica onde está), variáveis `GANBATTE_*` (as `HUNTER_*` valem por um tempo, `env()`), início automático `ganbatte` (`migra_servico()` grava o novo e apaga o `hunter-todo`; o servidor que está rodando continua até o próximo login), `/api/ping` com `"app": "ganbatte"` (o `ping()` aceita os dois), instalador em `~/ganbatte` (quem tem `~/todo-engine` continua nela), prefixos `GB`/`GB_`/`GBx` e `gb-` no código (o `localStorage` copia os `hj-`). Nomes base das abas (`NOMES` no motor, `ABA` na página): o menu usa Progresso, Projetos, Calendário, Conquistas, Loja e Grupo, e o nome do `TEMA` fica no `title`. O repositório ainda é `todo-engine` |
| 0.6.6-beta1 | atualização das expedições | Prazo da caçada (#54): `prazo` em `estado.json` → `cacadas`, escolhido nas janelas de criar e editar. Só organiza: `grupos()` usa o prazo no `due` da caçada (ordem da Lista) e conta as etapas com prazo depois dele (`depois`); aparece na Lista, nos marcos, na trilha, no quadro e como marca no cronograma. Não mexe no XP. Tarefa vira caçada (#35): campo caçada no editor da tarefa (`GB_EXP.opcoesCac`, `criaCac`), aberta, nenhuma ou nova com a tarefa como 1ª etapa. Cofre do mês opcional (#34): desligado por padrão, liga em Configurações → cofre do mês (`cofreMes` > 0; sem valor gravado, só quem já gastou do cofre fica com ele); desligado, sem card na Masadora e sem limite em R$ no resgate (`cofreOn()`) |
| 0.6.5 | atualização das expedições | **Junta a 0.6.5-beta1** (a linha abaixo), as correções da 0.6.4 (#51). A janela grande junta a 0.6.4 e a 0.6.5 (`"janela"` no `novidades.js`), com o "no seu jogo" das duas |
| 0.6.5-beta1 | atualização das expedições | **Corrige o estado da 0.6.4**: o servidor recusava o `estado.json` com `migra` e `tenRec`, e nada da loja, do tour e dos recibos ficava salvo. **Aviso grande** (`"aviso": "0.6.5"`). Nível do Duolingo pela ofensiva inteira (#51): os dias de antes de ligar sobem o nível, sem XP; os de antes da temporada pela ofensiva lida (`duoPre()`, `ini` no `/api/jogo`). Devolução única (`devolucao()`, `estado.json` → `devolve`): quem teve a carteira zerada pelo acerto da 0.6.4 perde as aparências e os feitiços na bolsa comprados em 13/10 e recebe só o que passou do perdão; o servidor não deixa uma aba antiga devolvê-los (`devolve_filtra`). Renomear um hábito (Configurações ou o assistente) mantém o id (`habsJSON`), e com ele o nível e o histórico; quem já tinha o histórico preso num id antigo pelo bug volta a ele sozinho (`religa_habitos()` no `arruma_dia`: mesmo nome, id que ninguém usa, um só candidato) |
| 0.6.4 | atualização das expedições | **Junta as betas 0.6.4** (as cinco linhas abaixo): rebalanceamento com aviso grande (#47), temporada guardada (#7), Book reorganizado e 10 desafios da IA (#49, #6), Regras reescritas e lateral da Lista (#50), canal estável/beta/grupo e resumo para o grupo (#36, #46, #37) |
| 0.6.4-beta5 | atualização das expedições | Preparação do modo em grupo: o canal de atualização segue a branch da cópia (`CANAIS`: main, beta, grupo; #36) e Configurações → servidor escolhe entre Estável, Beta e Grupo (#46; o modo teste da Masadora vale na beta e no grupo). `GB.resumoGrupo` (#37): por dia, o XP, os hábitos do grupo (Codeforces, Duolingo) e os dias da missão, exportável em Configurações → balanceamento |
| 0.6.4-beta4 | atualização das expedições | Regras reescritas (#50): seções com índice, tabelas e contas de exemplo, com os números do motor e um resumo do jogador; a aba vai para o fim do menu, depois de Novidades. Cards da lateral da Lista abrem e fecham pelo título (`<details data-lado>`, guardado em `localStorage` → `gb-lado`) |
| 0.6.4-beta3 | atualização das expedições | Book reorganizado (#49): Conquistas sem casas vazias, três cartas por hábito pelo nível (3, 6, 10, nos números livres de 000–099), Ten de 60 dias e os desafios da IA resgatados; Desafios da IA com 10 vagas por rank (`CONQ_VAGAS`: 4 D, 3 C, 2 B, 1 A), conferidas também no servidor (#6) |
| 0.6.4-beta2 | atualização das expedições | **Rebalanceamento, com aviso grande** (#47) (`"aviso"` no `novidades.js`, janela que mostra a cada um quanto mudou): contribuições menores (bug 15 XP + 150 J, ideia 10 XP + 50 J); Duolingo de antes de ligar sem XP, Jenny e Ten (`duo.json` → `desde`); Ten só com tarefa que não é hábito; nível por hábito de 1 a 10 (3 a 12 XP, `niveisHab()`); carta Zetsu salva hoje ou ontem, o Ten ou um hábito; bônus de nota pelo peso normalizado da disciplina. Acerto único `MIGRA` no `estado()`: tira dos `xpDias` o que a regra antiga dava, guarda o recorde do Ten (`tenRec`) e não deixa a carteira negativa |
| 0.6.4-beta1 | atualização das expedições | Temporada guardada (#7): na volta às aulas, `GB.capsula()` congela os números finais em `temporadas/NOME/resumo.json` (chaves neutras e os nomes do tema em `TEMA`), com cópia dos arquivos (`POST /api/temporada`); também antes de o assistente trocar a temporada e pelo card em Configurações |
| 0.6.3 | atualização das expedições | **Junta as betas 0.6.3** (as duas linhas abaixo): férias (#31), recompensa por contribuição (#23), reabrir etapa (#27), testes do servidor (#12) e o balanceamento: relatório, registro de compras e simulador (#32) |
| 0.6.3-beta2 | atualização das expedições | Relatório de balanceamento em Configurações (`GB.relatorio()`: XP e Jenny por dia e por origem, em .json ou .csv, sem texto de tarefa); registro de compras (`estado.json` → `compras`); simulador de temporada com jogadores inventados (`node ferramentas/simulador.mjs`) |
| 0.6.3-beta1 | atualização das expedições | Férias (#31): Ten não cai, missão e fúria pausadas, XP normal; recompensa por bug corrigido e ideia feita pelo usuário do GitHub (#23, `contrib.json`); reabrir etapa do `done.txt` (`POST /api/reabre`, #27); testes do servidor em `tests/` (#12) |
| 0.6.2 | atualização das expedições | **Junta as betas 0.6.2** (as cinco linhas abaixo) e traz o **Duolingo automático** (#11): só o usuário, sem senha; o servidor lê a ofensiva do perfil público, conclui a `rec:duo` do dia com lição e credita os dias da ofensiva desde o início da temporada (`duo.json`); o dia do bloqueio de ofensiva não conta |
| 0.6.2-beta5 | atualização das expedições | Fotos de perfil vêm do banco do repositório (`web/a/`), para todos os jogadores; o jogador não coloca mais fotos na pasta de dados (#13) |
| 0.6.2-beta4 | atualização das expedições | Resumo ao lado dos heatmaps da Lista (barra por dia da semana e número da temporada) e as férias no fim da grade |
| 0.6.2-beta3 | atualização das expedições | Heatmaps da Lista do início ao fim da temporada, com quadradinhos que ocupam a largura (#14) |
| 0.6.2-beta2 | atualização das expedições | Provar temas, fundos, efeitos, molduras e fontes, com o jogo travado durante a prova; Semestre com os meses da temporada (#2); Codeforces não perde dias além de 10 mil envios (#1) |
| 0.6.2-beta1 | atualização das expedições | Provar paleta na Masadora antes de comprar (#29); Codeforces lido só desde o início da temporada, com paginação da API |
| 0.6.1 | atualização das expedições | A janela de destaques da 0.6 aparece mesmo para quem atualizou pela aba Novidades (marca própria em `tour["nv:0.6"]`) |
| **0.6** | **atualização das expedições** | **Junta tudo desde a 0.5.3** (as linhas abaixo, até a 0.5.4): caçadas, aba Expedições com cinco formas de ver e tutorial, editor completo da tarefa, 40 itens na Masadora, versões de teste e correções. Novidades agrupadas por versão grande, com janela de destaques ao atualizar |
| 0.5.9-beta2 | atualização das conquistas | Expedições: as cinco visões ficam como formas de ver (#25) e a aba ganha tutorial (#26); "quanto vale" da Lista recolhível |
| 0.5.9-beta1 | atualização das conquistas | Editor completo da tarefa no ✎: tipo, disciplina, prazo e prioridade (#20); `POST /api/act` edit aceita `pri` |
| 0.5.8-beta2 | atualização das conquistas | Correções: mundo pixel com o nome, o Nen e a foto do jogador (#24); fúria visível no cartão do chefão (#22); edição de tarefa presa à linha e texto, com cancelar (#21) |
| 0.5.8-beta1 | atualização das conquistas | Caçadas (`+cac.NOME`: etapas agrupadas na Lista, sem bônus) e aba Expedições (`+exp.NOME`; marcos = caçadas, com bônus gravado no `estado.json`), com cinco visões para testar; campo limpo + tecla N; topo da Lista num bloco só; versões da beta como `X.Y.Z-betaN` |
| 0.5.7 | atualização das conquistas | Modo teste da Masadora, só no canal beta: Jenny infinita para experimentar itens; nada é gravado e tudo volta ao sair ou recarregar |
| 0.5.6 | atualização das conquistas | Versões de teste: Configurações → servidor troca o jogo entre a versão normal (`main`) e a beta (`POST /api/canal`, só em cópia git) |
| 0.5.5 | atualização das conquistas | Botão de atualizar funciona numa cópia clonada por SSH: se o `git pull` falhar sem o agente SSH, puxa a mesma branch pelo HTTPS público |
| 0.5.4 | atualização das conquistas | Masadora com 40 itens novos: efeitos ao concluir tarefa, sons sintetizados, fontes, paletas, texturas, molduras e quatro temas completos (`web/efeitos.js`) |
| 0.5.3 | atualização das conquistas | XP dos dias passados guardado (linha concluída que some não tira mais XP); nota corrigida para menos não deixa a carteira negativa |
| 0.5.2 | atualização das conquistas | bônus de nota e fúria guardados: mudar o plano não tira mais Jenny nem XP; carteira negativa zerada uma vez |
| 0.5.1 | atualização das conquistas | feedback pelo jogo: bug, ideia ou dúvida vira uma issue já preenchida no GitHub (balão no canto da tela) |
| 0.5 | **atualização das conquistas** | conquistas criadas pela IA (recompensa em Jenny ou feitiço), aba Novidades com aviso de versão nova e atualizar com um clique, instalador sem git que atualiza |
| 0.4 · 0.4.1 · 0.4.2 | **atualização da IA** | IA de terminal ligada no próprio jogo (planos de ensino, caixa de entrada, cartas do Book, tipo da tarefa), tipos ao lado do campo, Codeforces à mão, aba Configurações, pesos acima de 100%, salvar vários planos de uma vez, "fiz de novo" nos hábitos semanais |
| 0.3 · 0.3.1 | | ligação tarefa → avaliação, Torre Trick (explicação), backup, prêmios reais, prioridade sugerida |
| 0.2 | | hábitos semanais, editor de avaliações e notas, instalador de um comando |

O que vem depois está em [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).

## Licença

[MIT](LICENSE): pode usar, modificar e distribuir, mantendo o aviso de copyright.
