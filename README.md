# Hunter.todo

Um jogo (tema Hunter x Hunter) em cima do [todo.txt](https://github.com/todotxt/todo.txt): você conclui tarefas e sobe a
**Arena Celestial**, enfrenta as disciplinas como **chefões** (vida = nota), mantém o **Ten** (dias seguidos) e gasta
**Jenny** na loja. Roda no seu computador, sem conta e quase sem internet: só o Codeforces e o Duolingo (se você ligar) e a
conferência de versão nova (uma leitura do GitHub a cada 6 horas) saem do computador.
Precisa apenas do Python 3.8 ou mais novo, no Linux, Windows ou Mac.

> **Versão 0.6.3.** A 0.3 foi testada no Linux por amigos, com foco em usabilidade. No Windows e no Mac ainda não foi testada
> (inclusive o instalador e o início automático): se algo der errado, avise. O que está planejado fica em [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).
> O desenho do modo em grupo (placar **Torre Trick**) está em [`docs/COLETIVO.md`](docs/COLETIVO.md) e ainda não existe.

## Instalação rápida (um comando)

Precisa do Python 3 (veja abaixo como conferir). Abra um terminal e rode:

| Sistema | Comando |
|---|---|
| Linux / Mac | `curl -fsSL https://raw.githubusercontent.com/CaioParanaiba/todo-engine/main/instalar.sh \| sh` |
| Windows (PowerShell) | `irm https://raw.githubusercontent.com/CaioParanaiba/todo-engine/main/instalar.ps1 \| iex` |

Ele baixa o jogo na pasta `todo-engine` dentro da sua pasta de usuário (ou atualiza, se já estiver lá) e abre o jogo. Na
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

- **Com git:** `git clone https://github.com/CaioParanaiba/todo-engine.git`
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
as tags, os hábitos e as disciplinas do semestre, e no fim oferece um tour por cada aba.

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
| Linux / Mac | `~/.hunter-todo/` |
| Windows | `C:\Users\SEU_USUARIO\.hunter-todo\` |

| Arquivo | O que tem |
|---|---|
| `todo.txt`, `done.txt` | suas tarefas, no formato todo.txt (as concluídas vão para o `done.txt` no dia seguinte) |
| `jogador.json` | nome, tags, hábitos, disciplinas, Codeforces e Duolingo |
| `avaliacoes.txt`, `notas.txt` | plano de avaliação das disciplinas e notas lançadas (o editor do chefão guarda a versão anterior em `.bak`) |
| `narradas.json` | cartas narradas do Book |
| `conquistas.json` | conquistas criadas pela IA (Book, 200 em diante) e o que você resgatou |
| `estado.json` | loja, Jenny gasta (com o registro de compras, desde a 0.6.3-beta2) e o que está equipado |
| `cf.json`, `duo.json`, `contrib.json` | o que o jogo leu do Codeforces, do Duolingo e das suas issues no GitHub |
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

### Versões de teste (beta e grupo)

As novidades saem primeiro na branch `beta` e passam para a `main` (a versão normal) depois de testadas. O modo em grupo
(0.9) é construído na branch `grupo`, que recebe também tudo o que sai na versão normal. Em **Configurações → servidor**,
**Versão** escolhe entre **Estável** (`main`), **Beta** e **Grupo**; o aviso de versão nova e o **atualizar agora** seguem
a escolhida.

Pelo terminal é o mesmo: `git -C ~/todo-engine switch beta` (ou `grupo`; `switch main` para voltar). Só funciona no jogo instalado
com git; o instalado pelo ZIP fica sempre na versão normal.

A beta pode ter erros que ainda não foram corrigidos. Os dados continuam na mesma pasta, mas uma versão de teste pode
gravar coisas novas neles que a versão normal ainda não conhece. Baixe os seus dados (Configurações → backup) antes de
trocar. Achou um problema? O balão de feedback no canto da tela abre uma issue já preenchida.

## Sem instalar: modo demonstração

**Online:** https://caioparanaiba.github.io/todo-engine/ (atualiza sozinho a cada mudança na página).
**No computador:** abra o arquivo `web/index.html` direto no navegador (dois cliques).

Entra um jogador de exemplo, com histórico, e nada é gravado: recarregar a página volta ao começo.

## Problemas comuns

- **"python3 não é reconhecido" / "py não é reconhecido" (Windows):** o Python foi instalado sem marcar "Add to PATH".
  Rode o instalador de novo, escolha **Modify** e marque a opção.
- **"A porta 8642 está ocupada":** outro programa usa essa porta. Rode com outra: `python3 servidor.py --porta 8643`.
- **O navegador não abriu:** abra http://127.0.0.1:8642/ à mão.
- **Aviso amarelo "o servidor do jogo ainda está na versão...":** o servidor antigo continua ligado. Rode o instalador de
  novo ou reinicie o computador (Linux: `systemctl --user restart hunter-todo`) e recarregue a página.
- **A IA não aparece em Configurações → IA:** instale e entre na conta da IA pelo terminal (`codex login`, `claude`,
  `gemini`) e clique em **procurar de novo**. O jogo procura no PATH do seu terminal e nas pastas comuns (npm, nvm, ~/.local/bin).
- **Esqueci de marcar um hábito ontem:** no card "hábitos de hoje", clique em **esqueci de marcar ontem**. Ele conta
  para ontem (XP, nível do hábito e heatmap). Só vale para o dia anterior.
- **Codeforces não conta:** confira o handle na aba Configurações. A contagem atualiza a cada 10 minutos e precisa de internet.
  Problema feito onde a API não enxerga (ITMO Academy, contest de grupo privado): clique no ✋ ao lado de "Codeforces" no
  heatmap da Lista e confirme; cada confirmação soma 1 problema hoje.
- **Recompensa de bug ou ideia não veio:** confira o usuário do GitHub em Configurações. O jogo confere a cada 6 horas e só
  conta a issue que você abriu e que foi fechada como resolvida (bug corrigido, ideia feita); repetida ou recusada não conta.
- **Duolingo não conta:** confira o usuário na aba Configurações (o nome do perfil, sem senha). O jogo lê a ofensiva do
  perfil a cada 10 minutos e precisa de internet. O dia salvo pelo bloqueio de ofensiva não conta, de propósito: no jogo,
  quem guarda folga é o Zetsu. Os dias da ofensiva de antes de ligar ficam no heatmap e nas conquistas, sem XP nem Ten. Com o jogo fechado vários dias e um bloqueio no meio, o Duolingo diz quantos dias você fez,
  não quais: o jogo marca os mais recentes.
- **Não sei qual tipo escolher para a tarefa:** o jogo sugere pelas palavras do texto; o **?** ao lado dos tipos mostra o
  que encaixa em quê, e com a IA ligada o **IA?** pergunta a ela.

## Como funciona por dentro

- `servidor.py`: servidor local (só a biblioteca padrão do Python). Lê e grava os seus arquivos, cria os hábitos de cada dia
  e consulta o Codeforces e o Duolingo. Só aceita conexões do próprio computador.
- `web/index.html`: a página do jogo. `web/motor.js`: todas as regras e contas. `web/guia.js`: assistente e tutorial.
  `web/chefes.js`: editor de avaliações e notas. `web/ia.js`: pedidos para a IA e a IA ligada. `web/conquistas.js`:
  conquistas criadas pela IA (as regras ficam no motor). `web/novidades.js`: aba Novidades, com a lista de versões que o
  servidor lê do GitHub para avisar de versão nova (ao lançar uma, ponha-a no topo). `web/feedback.js`: bug, ideia ou
  dúvida vira uma issue preenchida pelos formulários de `.github/ISSUE_TEMPLATE/`. `web/temporadas.js`: guarda a temporada que acabou em `temporadas/NOME/` (a cápsula é `HJ.capsula` no motor; `TEMA` no motor
  tem os nomes temáticos das funções). `web/efeitos.js`: o que os itens
  da Masadora fazem na tela (texturas, molduras, fontes, animações e sons; os itens e preços ficam no `COS` do motor). `web/demo.js`: o servidor de mentira do
  modo demonstração (também usado no GitHub Pages). `web/a/`: o banco de fotos de perfil; cada PNG (256×256, nome com
  letras, números, `-`, `_` ou `.`) vira um item da Masadora por 1.000 J (os grátis ficam no `AV_GRATIS` do motor). O
  jogador não envia fotos: quem desenvolve põe aqui, e só imagens que podem ser distribuídas. Não renomeie uma foto que já
  saiu: o nome é o id do item comprado e equipado.
- **Testes:** `python3 -m unittest discover tests` (pasta de dados temporária e a internet simulada; ver `tests/test_servidor.py`).
- **Balanceamento:** `node ferramentas/simulador.mjs` joga uma temporada com três jogadores inventados pelo `web/motor.js` e
  mostra XP, andar, Jenny e quanto da loja cada um compra; `--comparar relatorio.json` põe ao lado o relatório de um
  jogador de verdade (Configurações → balanceamento). Os perfis ficam no topo do arquivo.
- **IA opcional.** O jogo funciona sem IA. Com uma IA de terminal instalada (Claude Code, Codex ou Gemini CLI), ligue-a
  em **Configurações → IA**: o jogo passa a ler os planos de ensino (pasta `~/.hunter-todo/planos/`), aplicar a caixa de entrada
  e escrever as cartas do Book sozinho, e propõe conquistas feitas para você (no Book); você confere antes de salvar. Sem ela, o jogo monta os pedidos e você cola
  numa IA de chat. Veja [`IA.md`](IA.md).

## Versões

| Versão | Nome | O que trouxe |
|---|---|---|
| 0.6.4-beta5 | atualização das expedições | Preparação do modo em grupo: o canal de atualização segue a branch da cópia (`CANAIS`: main, beta, grupo; #36) e Configurações → servidor escolhe entre Estável, Beta e Grupo (#46; o modo teste da Masadora vale na beta e no grupo). `HJ.resumoGrupo` (#37): por dia, o XP, os hábitos do grupo (Codeforces, Duolingo) e os dias da missão, exportável em Configurações → balanceamento |
| 0.6.4-beta4 | atualização das expedições | Regras reescritas (#50): seções com índice, tabelas e contas de exemplo, com os números do motor e um resumo do jogador; a aba vai para o fim do menu, depois de Novidades. Cards da lateral da Lista abrem e fecham pelo título (`<details data-lado>`, guardado em `localStorage` → `hj-lado`) |
| 0.6.4-beta3 | atualização das expedições | Book reorganizado (#49): Conquistas sem casas vazias, três cartas por hábito pelo nível (3, 6, 10, nos números livres de 000–099), Ten de 60 dias e os desafios da IA resgatados; Desafios da IA com 10 vagas por rank (`CONQ_VAGAS`: 4 D, 3 C, 2 B, 1 A), conferidas também no servidor (#6) |
| 0.6.4-beta2 | atualização das expedições | **Rebalanceamento, com aviso grande** (#47) (`"aviso"` no `novidades.js`, janela que mostra a cada um quanto mudou): contribuições menores (bug 15 XP + 150 J, ideia 10 XP + 50 J); Duolingo de antes de ligar sem XP, Jenny e Ten (`duo.json` → `desde`); Ten só com tarefa que não é hábito; nível por hábito de 1 a 10 (3 a 12 XP, `niveisHab()`); carta Zetsu salva hoje ou ontem, o Ten ou um hábito; bônus de nota pelo peso normalizado da disciplina. Acerto único `MIGRA` no `estado()`: tira dos `xpDias` o que a regra antiga dava, guarda o recorde do Ten (`tenRec`) e não deixa a carteira negativa |
| 0.6.4-beta1 | atualização das expedições | Temporada guardada (#7): na volta às aulas, `HJ.capsula()` congela os números finais em `temporadas/NOME/resumo.json` (chaves neutras e os nomes do tema em `TEMA`), com cópia dos arquivos (`POST /api/temporada`); também antes de o assistente trocar a temporada e pelo card em Configurações |
| 0.6.3 | atualização das expedições | **Junta as betas 0.6.3** (as duas linhas abaixo): férias (#31), recompensa por contribuição (#23), reabrir etapa (#27), testes do servidor (#12) e o balanceamento: relatório, registro de compras e simulador (#32) |
| 0.6.3-beta2 | atualização das expedições | Relatório de balanceamento em Configurações (`HJ.relatorio()`: XP e Jenny por dia e por origem, em .json ou .csv, sem texto de tarefa); registro de compras (`estado.json` → `compras`); simulador de temporada com jogadores inventados (`node ferramentas/simulador.mjs`) |
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
