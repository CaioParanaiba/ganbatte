# Contribuindo com o Ganbatte

Para quem vai mexer no código do jogo, pessoa ou IA de terminal (Codex, Claude Code, Gemini CLI). Quem só joga não
precisa deste arquivo: o caminho dele é o [`IA.md`](IA.md).

O dono do repositório é o **Caio** (`CaioParanaiba`). Ele revisa e junta os PRs, numera as versões e decide quando a
`beta` vai para a `main`. Quem contribui faz o código de uma issue e abre um PR; o resto fica com ele.

## Preparar uma vez

1. **GitHub CLI** instalado e com login: `gh auth login`, e depois `gh auth setup-git` (o git passa a usar esse login
   no `git push`, sem pedir senha).
2. **Uma pasta só para desenvolver**, clonada com git (a cópia do ZIP não serve). Rode na sua pasta de usuário, fora da
   pasta em que joga:
   ```
   cd ~
   git clone https://github.com/CaioParanaiba/ganbatte.git ganbatte-dev
   ```
   Se você também joga, não use a cópia em que joga: trocar de branch nela muda o seu jogo. Já clonou pelo endereço
   `git@github.com:...` e deu `Permission denied (publickey)`? Troque para o HTTPS dentro da pasta, sem clonar de novo:
   `git remote set-url origin https://github.com/CaioParanaiba/ganbatte.git`.
3. **Internet para a IA.** O `git push` e o `gh` saem para a internet; aprove quando a IA pedir, ou libere a rede nas
   configurações dela.
4. Python 3.8+ (o servidor e os testes) e Node (o simulador e o navegador de teste, só se precisar).
5. **Seu usuário do GitHub em Configurações** (no jogo em que você joga). A issue em que você é o responsável vira uma
   tarefa na sua Lista (projeto `+ganbatte`) e se conclui sozinha quando entra no beta: é assim que o trabalho de dev
   rende XP. Não crie tarefa à mão para issue, senão conta duas vezes. A recompensa de bug/ideia é de quem relatou: issue
   que você abriu e você mesmo fez paga só pela tarefa.

## Para a IA: como trabalhar uma issue

O pedido normal é **"pega a issue N"**. Siga as duas fases, nesta ordem.

### Fase 1: levantamento (não mexa em nada)

1. Leia a issue e os comentários: `gh issue view N --comments`.
2. Leia o que importa para ela: o trecho do `README.md` ("Como funciona por dentro"), o `docs/PENDENCIAS.md` (o que já
   foi decidido) e o código que a issue toca.
3. Responda ao contribuidor com um resumo curto:
   - o que a issue pede, com as suas palavras;
   - como o código está hoje nesse ponto (arquivos e funções);
   - como você faria, em poucos passos;
   - dúvidas e pontos em aberto (o que a issue não diz, o que pode quebrar, o que mexe em pontos);
   - o tamanho: rápido, médio ou demorado. **Ponha o label de esforço na issue** (`esforço: rápido`, `esforço: médio` ou
     `esforço: demorado`), trocando o que estiver lá se a sua avaliação for outra: é ele que decide quanto XP a tarefa de
     dev vale (10, 15 ou 25). Ex.: `gh issue edit N --remove-label "esforço: rápido" --add-label "esforço: médio"`.
4. Pergunte se ele quer um **levantamento mais fundo** de algum ponto (por exemplo: onde mais isso aparece no jogo, o
   impacto no balanceamento, outras formas de fazer) e se quer **mudar ou acrescentar ideias**.
5. **Pare e espere.** Não crie branch nem escreva código até ele pedir ("pode fazer", "faz assim", "começa").

Se ele mudar o plano, ajuste e mostre de novo. Se a ideia dele contradiz a issue ou o `PENDENCIAS.md`, diga isso; a
decisão final de desenho é do Caio (veja "Quando parar e perguntar").

### Fase 2: fazer (só depois do ok)

1. Marque-se na issue: `gh issue edit N --add-assignee @me`.
2. Branch a partir da base atualizada. A base é a `beta`, também para as issues com o label `grupo`.
   ```
   git fetch origin
   git switch -c issue-N origin/beta
   ```
3. Faça o código, seguindo as regras abaixo. Commits pequenos, mensagem em português dizendo o que mudou.
   Se a issue complicar (ou simplificar) bem além do esforço do label, troque o label e diga no PR por quê.
4. Teste (seção "Testar"). Se não deu para testar algo, diga no PR.
5. Envie e abra o PR para a mesma base:
   ```
   git push -u origin issue-N
   gh pr create --base beta --title "Issue N: RESUMO" --body-file CORPO.md
   ```
   O corpo do PR tem:
   - `Fecha #N` na primeira linha;
   - o que mudou e onde (arquivos e funções);
   - como foi testado;
   - **rascunho para as Novidades**: uma ou duas frases para o jogador, no tom do `web/novidades.js`;
   - se mexe em XP, Jenny ou pontos já ganhos, diga com destaque (o Caio monta a janela grande).
6. Avise o contribuidor que o PR está aberto e esperando a revisão do Caio. Fim.

### Quando o Caio pede ajustes no PR

O pedido normal é **"corrige o que o Caio pediu no PR"**. Leia os comentários (`gh pr view --comments` e
`gh api repos/CaioParanaiba/ganbatte/pulls/NUMERO/comments` para os comentários nas linhas), mostre ao contribuidor o que
vai mudar, corrija na mesma branch e dê push. Não abra outro PR.

### Quando parar e perguntar

Pergunte ao contribuidor (ou sugira um comentário na issue para o Caio) em vez de decidir sozinho quando:

- a issue tem o label `precisa decidir`, `espera uso real` ou `para o futuro`;
- a mudança mexe em XP, Jenny, pontos ou preços;
- algo contradiz o `docs/PENDENCIAS.md` ou outra issue;
- a issue é vaga ou dá para fazer de dois jeitos bem diferentes;
- precisaria mexer em arquivo de versão (lista abaixo).

## O que o PR não leva

Só o Caio mexe nisto, ao lançar a versão (assim duas pessoas nunca criam a mesma versão):

- `VERSAO` e `VERSAO_NOME` no `servidor.py`;
- `VERSAO_PAGINA` no `web/index.html`;
- as entradas de versão no `web/novidades.js` (o rascunho vai no texto do PR);
- a tabela "Versões" do `README.md`;
- labels das issues (fora o de esforço, que a IA põe e acerta), merge, tags e qualquer push na `beta` ou na `main`.

Fora isso, pode atualizar o README (a parte "Como funciona por dentro") e o `docs/PENDENCIAS.md` quando o PR muda o
que eles descrevem.

## Regras do projeto

- **Dados do jogador são sagrados.** Ficam em `~/.ganbatte/`, nunca na pasta do código. O código novo precisa aceitar os
  arquivos de quem já joga (campo que falta = valor padrão) e nunca apagar o que não conhece.
- **Mexeu em pontos, avisa grande.** Toda mudança que altera XP, Jenny ou pontos já ganhos sai com a janela grande nas
  Novidades, explicando o que mudou e por quê: saldo que muda sem explicação parece bug. Diga no PR; o Caio monta a janela.
- **Visual padrão seco.** Formas do tema (hexágono do Nen, selo 念) sim; brilho, degradê, sombra colorida e fundo animado
  não. Efeito vira item da loja (Masadora, issue #17). A opção "visual: clássico" em Configurações tem que continuar
  funcionando.
- **Servidor só com a biblioteca padrão do Python** (3.8+), sem `pip install`. A página sem build nem framework.
- **Linux, Windows e Mac.** Caminhos com `pathlib`/`os.path`, nada de comando só de um sistema sem alternativa.
- **Textos em português**, curtos, falando com o jogador. Nada de automação própria (cron, serviço, script agendado): o
  jogo já tem a IA ligada em Configurações → IA.
- **Siga o estilo do arquivo** que está mexendo: nomes, comentários e jeito de escrever iguais aos do código em volta.

## Testar

- **Testes automáticos:** `python3 -m unittest discover tests`. Mudou o servidor? Acrescente um teste em
  `tests/test_servidor.py`.
- **O jogo de verdade, sem tocar nos seus dados:**
  `python3 servidor.py --porta 8799 --dados /tmp/ganbatte-teste --sem-navegador` e abra http://127.0.0.1:8799/.
  Nunca rode o código em teste com a pasta de dados real.
- **Navegador automático:** `node ferramentas/navegador.mjs URL roteiro.json` (Firefox headless; detalhes no
  `docs/PENDENCIAS.md`, "Como testar").
- **Formulário de tarefas:** configure um jogador no servidor de teste e rode
  `node tests/test_formulario.mjs http://127.0.0.1:8799/`. O teste fecha o tutorial aberto e grava os tutoriais como vistos
  antes de recarregar os dados. Confere os atalhos N/C, os cadastros seguidos de tarefas e caçadas, o fechamento,
  a confirmação de dois segundos, os envios repetidos e as falhas de gravação. Cria tarefas e caçadas e marca os tutoriais
  como vistos na pasta de teste.
- **Balanceamento:** mexeu em XP ou Jenny? Rode `node ferramentas/simulador.mjs` e ponha o antes e o depois no PR.
- **Mexeu em `web/`?** Rode `python3 ferramentas/standalone.py` (gera o modo demonstração, que não vai para o git) e
  confira se ele abre.

## Onde achar as coisas

- `README.md`, seção "Como funciona por dentro": o que cada arquivo faz.
- `docs/PENDENCIAS.md`: o que falta, o que já foi decidido e por quê. Leia a parte da issue antes de propor.
- `docs/COLETIVO.md`: o desenho do modo em grupo (issues com o label `grupo`).
- `IA.md`: como a IA ligada no jogo funciona para o jogador.

## Só para o dono (lançar versão)

Fica aqui para consulta; quem contribui não faz.

1. Juntar os PRs na `beta`.
2. Versão `X.Y.Z-betaN`: `VERSAO` (servidor.py), `VERSAO_PAGINA` (web/index.html), topo do `web/novidades.js` e tabela do
   README. Issues que entraram ganham o label `no beta` e perdem `esforço`, `pronto pra fazer`, `precisa decidir` e
   `prioridade`.
3. Usar de verdade por 1 ou 2 dias. Depois, merge da `beta` na `main` como `X.Y.Z` (uma entrada só no `novidades.js`),
   tag `vX.Y.Z`, `fixes #N` no commit, e as issues perdem o `no beta`.

Detalhes no `docs/PENDENCIAS.md` ("Branches" e "Nome das versões").
