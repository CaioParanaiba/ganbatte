# Pendências e ideias (template)

Lista viva do que falta e do que foi pensado para as próximas versões. O desenho do modo em grupo (placar Torre Trick)
tem as pendências dele em [`COLETIVO.md`](COLETIVO.md).

## Onde estamos

**Issue #57 — Jenny por tarefa:** a Lista mostra o dinheiro ao lado do XP, inclusive na criação e na edição.
`valeL()` usa `estado().valeTarefa()`, com a mesma conta da conclusão (prazo, missão, fúria, férias, nível dos hábitos e
feitiços), e converte o XP final em Jenny ×10. As regras de ganho e os recibos permanecem iguais.
Teste da prévia contra o ganho real: `node tests/test_jenny.mjs`.

**v0.3** publicada em 09/10/2026 (tag `v0.3`, testada no Linux pelos amigos com foco em usabilidade). Entraram nela:
ligação tarefa → avaliação pelo prazo e com várias palavras-chave (`liga()`/`ligaCom()` em `web/motor.js`, com o
`→ P2` e o motivo nos Chefões), aba Torre Trick explicando o modo em grupo, backup em ZIP (`GET /api/backup`, aba Regras),
prêmios reais editáveis com régua de esforço (Masadora; `premios` e `cofreMes` no `estado.json`), lembrete da caixa de
entrada marcado como aplicado pela página, conquistas 000–099 genéricas (gerais + quatro por disciplina, 060 em diante)
e tutoriais do Book (feitiços) e da Masadora que trocam de sub-aba sozinhos (`vai()` em `web/guia.js`).

**Como testar sem mexer nos dados reais:** `python3 servidor.py --porta 8799 --dados PASTA_DE_TESTE --sem-navegador`
e `node ferramentas/navegador.mjs URL roteiro.json` (Firefox headless com perfil próprio; roteiro com `js`, `log`, `shot`).
O `guia.js` roda num escopo fechado: no roteiro, abra o tutorial clicando em `[data-trq]`. Pare o servidor com `pkill`
numa chamada separada. Depois de mexer em `web/`, rode `python3 ferramentas/standalone.py` (gera o `docs/prototipo.html`);
o Pages atualiza a cada push.

**Branch `grupo`** (desde 13/10/2026): o modo em grupo (0.9, issues no índice #16), com versões `0.9.0-betaN`. Recebe
merge da `beta` a cada versão nova, **sempre junto com uma 0.9.0-betaN nova** cuja entrada nas novidades diz o que veio
(só o merge não avisa ninguém: o jogo só avisa versão maior que a atual). O caminho contrário só com a 0.9 pronta
(`grupo` → `beta` → uso real → `main`). Na pasta de dados, a `grupo` só acrescenta (`grupo.json`, `enviado.json`, `grupo/`).

**Branches: `main` e `beta`.** A `main` é a versão estável: é a que o instalador baixa e a que o botão "Atualizar agora"
confere. A `beta` é onde as versões novas são testadas em uso real antes de sair, e pode quebrar; nenhum instalador
aponta para ela (uma cópia git na branch beta confere as novidades da beta: `canal()` no `servidor.py`).
Fluxo de uma versão: desenvolver e testar na `beta` → push na `beta` → usar a versão de verdade por 1 ou 2 dias →
merge da `beta` na `main` + tag `vX.Y`. Só o merge na `main` avisa os jogadores. Nunca dar push de trabalho novo direto na `main`.
**Ao lançar:** `VERSAO` (servidor.py) + `VERSAO_PAGINA` (web/index.html) + topo do `web/novidades.js` + tabela de versões do README.
**Aviso de pontos ao juntar as betas:** se alguma beta tem `"aviso": "X.Y.Z"`, a entrada final da `X.Y.Z` leva o mesmo
`"aviso"` (e os itens dele primeiro): quem viu na beta não vê de novo (`tour["nv:aviso:X.Y.Z"]`) e quem vem da `main` vê uma vez.
**Nome das versões (desde a 0.5.8):** na `beta`, `X.Y.Z-betaN` (0.5.8-beta1, 0.5.8-beta2...); o merge na `main` sai como
`X.Y.Z` (0.5.8), com uma entrada só no `novidades.js` que junta o que as betas trouxeram (tire as entradas `-betaN`).
**Versão grande (desde a 0.6):** `X.Y` com nome de série novo (`VERSAO_NOME`). No `novidades.js` vira uma entrada só, com
os destaques em `itens` e as versões que levaram até ela em `versoes` (a aba mostra recolhidas; a 0.5 e a 0.4 guardam as
suas X.Y.Z do mesmo jeito). Quem atualiza para ela vê os destaques numa janela grande, uma vez. As `X.Y.Z` seguintes ficam
soltas no topo até a próxima versão grande, quando entram no `versoes` dela.
`vtupla()` no `servidor.py` põe toda `-betaN` antes da versão normal de mesmo número, e a beta2 depois da beta1.

**v0.3.1** publicada em 09/10/2026: prioridade no formulário e seta de descer na Lista, e o `IA.md` com o modo agente.

**v0.4 · "atualização da IA"** publicada em 09/10/2026 (tag `v0.4`, falta o teste dos amigos). Entraram nela:
1. **Prioridade das tarefas.** O formulário tem os botões `o jogo decide · A · B · C · sem` (`(A)` digitado no começo do
   texto passa na frente dos botões). "O jogo decide" usa `sugerePri()` em `web/motor.js`: avaliação ligada chegando
   (até 3 dias 50, até 7 dias 35, até 14 dias 15), prazo (até 1 dia 50, até 3 dias 35, até 7 dias 15), chefão em fúria
   20, 2+ atrasadas na disciplina 15, entrega 10; 70+ = A, 40+ = B, 20+ = C. Na Lista, ▲ sobe e ▼ desce (do C, tira a
   prioridade); cada seta some no limite. Pesos **a calibrar** com o uso.
2. **IA integrada ao jogo** (seção abaixo), com *ler todos os planos* e nota em pontos (`4/5`).
3. **Tipos das tarefas na linha do campo** (Lista). O tipo segue a sugestão do texto (`sugereTipo()` em `web/motor.js`,
   listas de palavras em `TIPO_PAL`, ordem entrega > treino e projetos > estudo > faculdade > vida) até o jogador clicar
   num tipo; a prévia diz o motivo ("pela palavra lista"). Cada tipo tem descrição e exemplos ao passar o mouse, o **?**
   abre a tabela "o que encaixa em quê", e com a IA ligada o **IA?** pergunta à IA (`leve: true`: `--model haiku` no
   Claude Code, esforço baixo no Codex, `gemini-2.5-flash` no Gemini). **Treino** virou **treino e projetos**:
   programação e projetos pessoais fora da matéria (ex.: ajudar no desenvolvimento do Hunter.todo). Trabalho e estágio
   continuam em vida, por enquanto.
4. **Codeforces à mão** (ITMO Academy, grupos privados, que a API não enxerga): o ✋ discreto ao lado de "Codeforces" no
   heatmap pede confirmação e soma 1 problema hoje (`POST /api/cf/mao`; `manual` no `cf.json`, somado ao `por_dia` em
   `cf_soma()`). Sem limite nem conferência: vale a palavra do jogador. Conta igual para a meta do dia e o XP; o
   heatmap mostra "(n à mão)" no dia. O aviso tem *desfazer*. No modo em grupo vale o combinado entre amigos.

**v0.4.1** (09/10/2026, ainda da "atualização da IA", depois do teste de um amigo em que a IA não apareceu, mesmo com Codex e Gemini instalados).
Causa: o instalador rodava `servidor.py`, que via o servidor antigo ligado em segundo plano e só abria o navegador; a
página vinha nova (lida do disco) e o servidor ficava velho, sem as rotas da IA. Correções:
- **Troca do servidor antigo** (`troca_antigo()`): versão diferente na porta → reinicia o serviço (systemd, LaunchAgent)
  ou derruba o processo (pid do `/api/ping`, ou `ss`/`lsof` para os antigos) e o novo assume.
- **Servidor se reinicia sozinho** quando o `servidor.py` muda (`vigia_codigo()`, a cada 20 s, com `os.execv`).
- **Aviso amarelo na página** quando a versão do servidor difere da página (`VERSAO_PAGINA` no `index.html`: **mude junto
  com o `VERSAO` do servidor**).
- **IA achada pelo PATH do terminal** (`path_shell()`: o serviço não carrega o `.bashrc`/`.zshrc`), mais pastas do
  cargo, pnpm, yarn, fnm, snap e linuxbrew.
- **Aba Configurações** separada de Regras: seu jogo, IA, servidor, efeitos e backup. Regras ficou só com as regras.
- **✋ do Codeforces também no card "hábitos de hoje"**; "quanto vale" no topo da lateral, ao lado do formulário.
- **Tutoriais:** o da Lista explica o Codeforces automático e o ✋; a aba Configurações tem tutorial próprio; ao ligar
  uma IA aparece "ver o que a IA faz" (tutorial `ia` em `web/guia.js`, que passa por Configurações, Chefões, Lista e
  Book), também no botão *tutorial da IA*.

**v0.4.2** (09/10/2026, ainda da "atualização da IA"):
- **Soma acima de 100%:** no editor do chefão, "pode passar de 100% (pontos extras)" grava `# soma livre: ...` no bloco
  (`LIVRE` em `web/chefes.js`); a validação passa a pedir 100 ou mais, e o pedido da IA avisa que há ponto extra. A vida
  do chefão não fica negativa (`rest` com `Math.max(0, ...)` no motor).
- **Salvar vários planos de uma vez:** em "ler todos os planos", caixa em cada resultado pronto, *selecionar todos* e
  *salvar selecionados* (`aplicaVarios()` em `web/chefes.js`, um POST só). A disciplina que apagaria uma avaliação com
  nota lançada ou não passa na validação fica marcada para revisar no editor.
- **✋ do Codeforces também na Arena** (meta do dia), pelo `cfMaoBtn()` comum às três telas.
- **Hábito semanal acima da meta:** com a meta da semana cumprida, o card "semana completa" tem *fiz de novo*
  (`POST /api/denovo`: o hábito concluído hoje no todo.txt, uma vez por dia, com desfazer). No motor, da (meta+1)ª vez
  na semana em diante vale `HAB_EXTRA` = ×2 (**a calibrar**).

**v0.5 · "atualização das conquistas"** (09/10/2026, ainda não publicada). Entraram nela:
1. **Conquistas criadas pela IA** (Book → *Conquistas da IA*, 200 em diante, em `conquistas.json`). A IA só preenche um
   molde da lista fechada do motor (`avaliaConq()` em `web/motor.js`): `contagem` (n tarefas com palavra, disciplina,
   tipo e/ou no prazo), `sequencia` (hábito em n dias seguidos; semanal = n semanas com a meta; `cf` = Codeforces),
   `nota` (pontos garantidos na disciplina ou nota de uma avaliação), `constancia` (Ten de n dias) e `semana` (XP numa
   semana, até o dobro da melhor). Tudo conta a partir do dia em que a conquista foi aceita. O motor recusa regra
   desconhecida, alvo inexistente, o que já está cumprido, o repetido e o impossível (semana acima do dobro da melhor,
   nota acima de 10 no que falta).
   - **Rank e recompensa** saem da estimativa de dias no ritmo das últimas 4 semanas (`CONQ_RK`): D até 7 dias (800 J
     ou Zetsu extra), C até 14 (1.500 J ou Gyo), B até 30 (3.000 J ou Ko), A acima (6.000 J ou feitiço à escolha).
     **A calibrar** com o uso. Ao conquistar, os dois botões aparecem embaixo da carta; depois, "resgatada" (a Jenny
     entra em `ganho`, o feitiço na bolsa).
   - **Pedido** em `web/conquistas.js` (o mesmo texto no `IA.md`, pedido 3): ritmo, Ten, tarefas por tipo, disciplinas
     com pontos e avaliações sem nota, hábitos com frequência e maior sequência, Codeforces, as 25 palavras mais comuns
     das tarefas (60 dias) e as conquistas abertas. Funciona com a IA ligada (*propor conquistas com IA*) e no copiar e
     colar (*conferir resposta*). Revisão com caixas; o jogador aceita as que quiser.
   - **Limite de 5 abertas** (não resgatadas; o servidor confere em `POST /api/conquistas`). Descartar libera a vaga, e
     o número não volta. Cada conquista guarda a `temporada`.
2. **Aba Novidades** (`web/novidades.js`): versão instalada, aviso de versão nova e a lista do que mudou em cada versão.
   A lista entre `/*NOVIDADES*/` e `/*FIM*/` é JSON: o servidor lê a do GitHub (`GET /api/atualizacao`, no máximo a cada
   6 h; `?agora` na hora; `HUNTER_RAW` troca o endereço para testar). *atualizar agora* = `POST /api/atualizar`:
   `git pull --ff-only` ou, sem git, o ZIP do `main` copiado por cima; depois o servidor reinicia (`os.execv`) e a
   página recarrega quando o `/api/ping` mostra a versão nova. Ponto amarelo no menu (versão nova ou novidade não vista,
   `visto` no `estado.json`) e aviso "jogo atualizado" uma vez.
3. **Instaladores sem git atualizam:** `instalar.sh` e `instalar.ps1` baixam por cima quando a pasta já tem o
   `servidor.py` (antes diziam "a pasta já existe"). O `.ps1` não foi testado.
4. **Tutoriais conferidos** com o Firefox headless, passo a passo em todas as abas (nenhum passo some). O do Book ganhou
   três passos das conquistas da IA; a aba Novidades tem o seu; quem escolhe "começar sem tutorial" também deixa de
   ver o de Configurações e o de Novidades.

**Ao lançar uma versão:** `VERSAO` (servidor.py) e `VERSAO_PAGINA` (web/index.html) juntos, a versão nova no topo do
`web/novidades.js` (é ela que avisa os amigos) e a linha da tabela de versões no README.

**v0.5.1** publicada em 10/10/2026 (tag `v0.5.1`): feedback pelo jogo.
- **`web/feedback.js`:** o balão fixo no canto direito (ícone `fb`, em qualquer aba) abre um painel com o tipo (bug ·
  ideia · dúvida, ícones `bug`, `ideia`, `duvida`), resumo, texto (bug: + "o que esperava"; ideia: + "por que ajudaria")
  e a aba de origem → `issues/new?template=X.yml&title=...&<id do campo>=...` com versão (`(beta)` pelo
  `HJ_NOV.canal()`), sistema e navegador. Sem token: o jogador confere e clica em *Create*. *Copiar texto* para quem não
  tem conta. A aba Feedback testada na beta saiu: ficou só o balão.
- **Tipo em português, label em inglês:** os formulários de `.github/ISSUE_TEMPLATE/` aplicam as labels que já existem
  (`bug.yml` → `bug`, `ideia.yml` → `enhancement`, `duvida.yml` → `question`); o link com `labels=` só valeria para quem
  tem escrita no repositório. **O GitHub só lê os formulários da `main`**: na beta o link abria uma issue vazia.
- **Conferir agora** forçava nada (o `parse_qs` descartava `?agora`); corrigido. Quem está na 0.5 só vê a 0.5.1 quando
  o cache de 6 h vencer.

**v0.5.2** (10/10/2026): recibos da carteira. Um amigo ficou com −58 J: a IA reescreveu o plano e baixou pesos
(COMP2 P1 de 40 para 20, ENGR P1 de 18 para 8) depois que ele gastou, e o bônus de notas, refeito a cada abertura com o
peso atual, caiu de 2502 para 1212 J. O gasto (`spent`) fica gravado; o ganho era todo recalculado.
- **`recibos()` em `web/motor.js`:** `estado.json` guarda `notasJ` (`{"DISC:aval": {nota, w, j, em}}`: o bônus usa o
  peso do dia em que a nota apareceu; corrigir a nota recalcula com esse peso; avaliação renomeada com a mesma nota herda
  o recibo órfão, sem bônus em dobro; recibo nunca é apagado) e `furias` (`{DISC: [[início, fim|null]]}`: abre no dia da
  última nota quando o chefão entra em fúria, fecha no dia da nota que tirou dele, ou hoje; tarefa dentro de um período
  ganha ×1,5 para sempre). A página grava em `sync()` → `guardaRecibos()` quando `S.rec.mudou`.
- **`acertos["0.5.2"]`:** na 1ª abertura, se `spent` > ganho, credita a diferença uma vez (linha "acerto da 0.5.2" na
  carteira da Masadora).
- **Servidor:** `notasJ`, `furias` e `acertos` aceitos no `POST /api/jogo/estado` e mesclados com o que já está gravado
  (uma aba antiga aberta não apaga recibos).

**v0.5.3** (10/10/2026): o resto da família.
- **`xpDias`:** o XP de cada dia anterior a hoje (tarefas + Codeforces, depois dos multiplicadores) fica gravado e só
  sobe: a conta usa o maior entre o gravado e o refeito. Linha concluída que some não tira XP do passado; "esqueci de
  marcar ontem" e o bônus atrasado do Codeforces ainda somam. Hoje continua livre. Nen, heatmap de contagem e chefões
  ainda saem das linhas. O servidor mescla `xpDias` pelo maior valor de cada dia.
- **Nota corrigida para menos:** `recibos()` devolve `cortes`; se a correção deixaria a carteira negativa, o excedente
  vira `acertos["nota:DISC:aval:dia"]`. Na Masadora a linha passou a se chamar "acertos".
- Ainda recalculado: Codeforces além das últimas 2000 submissões (`cf.json` é trocado inteiro) e a missão da semana.
- **Ao balancear:** baixar um valor não muda o passado (os `xpDias` seguram os dias fechados; marcos, notas e conquistas
  têm recibo). **Subir** um valor recalculado (XP por tipo em `xpDe()`, multiplicadores, `HAB_EXTRA`, `CF_*`, `CONTRIB`)
  infla os dias antigos: ponha uma data, como o `CF_DESDE` (regra antiga antes dela). Se muitos valores ganharem data,
  junte-os numa tabela de eras (decidido em 13/10/2026 não fazer antes de precisar). Mexeu em pontos já ganhos: aviso grande
  na Novidades (ver a seção abaixo).

## Balanceamento (análise de 13/10/2026, relatórios do Caio e de um amigo)

O que se viu: a Jenny do amigo (15.262) veio 37% de contribuições (5 issues antigas creditadas de uma vez no dia em que ele
pôs o GitHub: 190 XP + 3.800 J), 19% do Duolingo de antes (58 dias da ofensiva creditados ao ligar: 290 XP), 18% de notas e
só ~26% de jogar. O Ten dele ficou "on" em todos esses dias.

**Feito na 0.6.4-beta2** (decidido em 13/10/2026):
- **Nível por hábito (1 a 10)**: cada hábito tem o seu, vale nível + 2 XP (3 a 12). Do 1 ao 6, sobe a cada 7 dias seguidos;
  depois cada nível pede uma semana a mais (6→7: 2 semanas ... 9→10: 5). Falhar cai um nível, sem zerar. Semanal: o mesmo
  em semanas com a meta. `niveisHab()` no motor; a tabela paga a partir de `HAB_DESDE` (antes, os 5 fixos). Ao lado do
  heatmap de hábitos da Lista: nível, XP e a barra até o próximo nível de cada um.
- **Contribuições** menores: bug 15 XP + 150 J, ideia 10 XP + 50 J (valem também para as issues já creditadas).
- **Duolingo de antes de ligar** (`duo.json` → `desde`; sem ele, `DUO_LEGADO`): heatmap e conquistas, sem XP, Jenny, nível e Ten.
- **Ten** só com tarefa que não é hábito, para a temporada inteira; o recorde pela regra antiga fica em `tenRec` (conquistas
  do Ten já ganhas não somem).
- **Carta Zetsu**: salva hoje ou ontem, o Ten ou um hábito (`zalvo`/`zdia` no uso); as usadas antes continuam como folga.
- **Bônus de nota** pelo peso normalizado da disciplina (soma dos pesos ≠ 100 não distorce mais).
- **Acerto único `MIGRA`** no `estado()`: tira dos `xpDias` o que a regra antiga dava ao Duolingo de antes e às contribuições,
  grava quanto mudou (`migra`) e não deixa a carteira negativa (`acertos`).
- **Regra (13/10/2026): toda mudança em XP, Jenny ou pontos já ganhos sai com aviso grande** (`"aviso"` no `novidades.js`):
  janela como a da 0.6, com o que mudou e quanto mudou no jogo de cada um. Também corrigido: Gyo usado direto (sem ser
  "à escolha") gravava o atributo errado.

**Feito na 0.6.4-beta3** (#49): Book → Conquistas sem casas vazias, três cartas por hábito pelo nível (3, 6, 10) nos números
livres de 000–099, Ten de 60 dias e os desafios da IA resgatados; Desafios da IA com 10 vagas por rank (`CONQ_VAGAS`). O
que melhorar no Book (numeração, organização, validade dos desafios) está na #48.

**Falta decidir:**
1. **Caçadas e expedições** (#28): calibrar `MARCO_ETAPA`, `MARCO_DIA`, `EXP_SEMANA` (marco vale até 120 XP). Esperar o
   relatório do jogador que mais usa expedições.
2. Codeforces é hábito para o Ten (não acende sozinho). Confirmar com o uso se é o que se quer.
3. Simulador: os perfis jogam bem mais que os jogadores reais (leve: 46 XP por dia jogado; o amigo: 14); ajustar os perfis.

## Planejado para a v0.6

1. Testar Codex e Gemini CLI com a IA ligada (e o Windows: `.cmd` do npm). Os nomes de modelo do pedido leve podem mudar.
2. Calibrar as palavras de `TIPO_PAL`, os pesos do `sugerePri()` e o rank/recompensa das conquistas da IA (`CONQ_RK`) com o uso dos amigos.
3. Conquistas da IA: confirmar o limite de 5 abertas e decidir a validade no fim da temporada (expiram com ela ou ficam).

## Arquivado (decidir depois, em outra temporada)

- **Calendário do Semestre:** os meses da aba Semestre estão fixos (ago/2026 a fev/2027); devem sair da temporada.
- **Temporadas antigas:** em andamento na issue #7 (cápsula da temporada em `temporadas/NOME/`, ver o comentário de 13/10/2026).

## IA integrada ao jogo (v0.4)

**Por quê.** Teste de 09/10/2026: um amigo pediu ao Codex "crie as automações que o IA.md exige", e o agente inventou um
controlador em Python, um timer do systemd a cada 15 min, uma skill própria e 35 cartas antigas de uma vez, perguntando
coisas que o jogo deveria decidir. Cada computador ficaria de um jeito. Decisão: **o jogo chama o agente de terminal
que o jogador já tem; a IA só devolve texto, e o jogo confere e grava.**

O que entrou:
- **Configurações → IA** (`iaHTML()` em `web/ia.js`): o servidor acha `claude`, `codex`, `gemini` e `agy` (PATH + pastas comuns, porque
  o serviço do início automático roda com PATH curto), o jogador escolhe e clica em *testar*. Fica em `jogador.json` →
  `"ia": {"agente", "desde", "cartas"}` (`POST /api/ia/config`; o `/api/config` do assistente preserva o campo).
- **Rota única** `POST /api/ia/rodar {pedido, anexo?}` → `{id}`; a página consulta `GET /api/ia/rodar?id=`. Um pedido por
  vez, 10 min de limite, pasta temporária só com o anexo, pedido pela entrada padrão. Comandos em `comando_agente()`:
  `claude -p --tools Read --permission-mode dontAsk` (testado de verdade), `codex exec --sandbox read-only` e
  `gemini -p` (**não testados**: conferir num computador com eles). Erro de login vira "rode `X` no terminal".
  **#60 (14/10/2026):** o Gemini CLI 0.64 recusa pasta não confiável no modo sem perguntas (a temporária é nova a cada
  pedido); o servidor passa `GEMINI_CLI_TRUST_WORKSPACE=true` (a `--skip-trust` não existe em versão velha). Mas o Google
  parou de aceitar o Gemini CLI com conta pessoal gratuita (`IneligibleTierError`, "migrate to the Antigravity"): o erro
  vira um aviso em português. No lugar entrou o **Antigravity CLI** (`agy`, testado de verdade na 1.3.5): ele não lê a
  entrada padrão (responde vazio), então o pedido vai no arquivo `.pedido.txt` da pasta temporária; sem `--mode plan` ele
  grava arquivos, com ele não. Termina com código 0 e saída vazia quando nega uma ferramenta (vira erro). Pedido leve
  usa o modelo de sempre (os nomes, tipo `gemini-3.8-flash-low`, mudam a cada versão). Cada pedido fica nas conversas
  do agy (`~/.gemini/antigravity-cli/conversations`): não há flag para não guardar.
- **Plano de ensino:** pasta `~/.hunter-todo/planos/` (`POST /api/ia/plano` para *enviar arquivo*). No editor do chefão,
  *ler plano com IA* (o arquivo com a sigla ou o nome da disciplina vem escolhido). As linhas `#` da resposta aparecem
  como "Observações da IA" e ficam no bloco como `# (IA) ...` (trocadas a cada nova resposta).
- **Caixa de entrada:** *aplicar lembretes com IA* no editor (o pedido 1 sem anexo); ao salvar, os lembretes ficam aplicados.
- **Mais liberdade no pedido 1:** a IA resolve o que dá para deduzir (`?` + linha `#`) e só deixa de fechar 100 se não
  houver jeito. **Nota em pontos:** a nota aceita `4/5` (`HJ.nota10()` em `web/motor.js`), no quadro e no editor.
- **Cartas sozinhas:** `faltando()` lista os períodos fechados sem carta e com alguma atividade; ao abrir o jogo, as de
  depois de ligar a IA são escritas uma por vez (indicador no canto). As de antes, pelo botão *escrever cartas antigas*.
  Regras fixas: semana fecha na segunda, mês no dia 1, semestre no dia seguinte ao fim, ano em 1º/jan.
- **`IA.md`** (seção "Se o jogador pedir para configurar": proíbe rotinas próprias), **`AGENTS.md`** (+ `CLAUDE.md` que o
  importa): `docs/` não é do jogo.

- **Ler todos os planos** (aba Chefões, card "planos de ensino · IA"): um pedido liga cada arquivo da pasta a uma
  disciplina (`arquivo | SIGLA`, `arquivo | NOVA | sigla | nome` ou `arquivo | NADA`) e depois um pedido por disciplina.
  Cada resultado fica "pronto para revisar": *revisar e salvar* abre o editor com as linhas; disciplina nova abre o
  cadastro de Regras já preenchido (`HJ_GUIA.abreDisciplinas({d, n})`).

O que falta da IA está em "Planejado para a v0.5" e em "Arquivado".

**Preparação do modo em grupo** (0.6.4-beta5, 13/10/2026, issues #36, #46, #37; índice em #16):
- `CANAIS = ("main", "beta", "grupo")` no `servidor.py`: `canal()` devolve a branch da cópia git se for um deles (senão
  `main`) e o `api_canal()` troca para qualquer um. Configurações → servidor tem **Versão: Estável · Beta · Grupo**
  (`CANAIS` e `betaHTML()` em `web/guia.js`). `podeTeste()` (modo teste da Masadora) vale na beta e no grupo.
- `HJ.resumoGrupo(C, S)` no motor (`protocolo: 1`): um dia por linha da temporada (`TEMP.ini` até hoje ou o fim) com
  `xp`, `hab` (só os `HAB_GRUPO` ligados: `cf` = problemas, `duo` = 0/1), `missao` (o dia contou para a missão da semana:
  `S.missaoDias`) e `ferias`. Nunca leva texto, tag, disciplina nem hábito pessoal. Botão em Configurações → balanceamento.

**Cápsula da temporada** (0.6.4-beta1, 13/10/2026, issue #7): `HJ.capsula(api)` no motor calcula a temporada como o
jogo mostrava no último dia (`fimTemporada`: véspera da volta; antes disso, uma foto até hoje): roda `carregar` com `hoje`
no corte e tira tarefas, compras (e o `spent` delas) e `xpDias` de depois. Resumo com chaves neutras (`moeda`, `sequencia`,
`chefoes`, `atributos` pelas categorias do NEN) e `tema` (o `TEMA` do motor, único lugar com os nomes temáticos; a página
ainda não o usa). `POST /api/temporada` grava `temporadas/NOME/resumo.json` e copia `COPIAS_TEMP`; nunca troca uma foto por
outra com `ate` menor. `GET /api/jogo` → `temporadas` ([{nome, ate, guardada}]). `web/temporadas.js`: guarda sozinho ao
abrir depois do fim (uma tentativa por aba), antes de o assistente gravar outra temporada (`antesDeTrocar`, nas duas
gravações do `guia.js`) e pelo card *temporada* em Configurações (foto parcial). Falta: a tela de histórico e decidir o que
zera na temporada nova (hoje nada zera: o motor conta todo o `done.txt`).

**Coleção permanente e retratos dos chefões** (issue #33, PR #74, decidido com o Caio em 14/10/2026):
- O comprado vai para `colecao/` dos dados (`api_colecao`: só acrescenta e copia a imagem de `web/a/` ou `web/chefoes/` para
  `colecao/arquivos/`; `GET /api/jogo` → `colecao`). A página manda o que falta em `guardaColecao()` (na carga, que migra o
  `own` antigo, e a cada compra); `OWN` = `own` do `estado.json` + a coleção. `GB.catalogo(avatares, colecao)` põe de volta,
  com `fora`, o item da coleção que saiu da loja; `GB.padrao` = o que vem com o jogo, que fica só em **Comprados**.
- **Rastreio:** cada item tem `uid` e `hist` (quando, como: compra | chefao | migracao, origem, temporada, preço). Sem
  devolução nem venda por enquanto; o `hist` está pronto para trocas e vendas pelo grupo (itens raros, de temporadas passadas).
- **Loja pública do grupo:** segue a mesma regra (`origem: "grupo"`): o que o jogador compra é dele e entra nesta coleção,
  não compra repetido em outro grupo e não perde nada quando o grupo troca de temporada ou de itens. Ver `COLETIVO.md`.
- **Itens de código** (paleta, textura, efeito, fonte, som): a coleção guarda a ficha; o código do efeito nunca sai do jogo
  depois de vendido, só sai da vitrine.
- **Fotos marcadas como chefão** (`RETRATOS` no motor, quem desenvolve escolhe; hoje as 15 de `web/chefoes/`): vendidas
  como retrato de chefão (`ch-SLUG`, 1.500 J). Um dono por retrato (`poeRetrato`). Ao derrotar o chefão que está com o
  retrato, ele vira foto de perfil de graça (`av-ch-SLUG`, `como: chefao`) e a imagem desse chefão trava em
  `estado.json` → `travas["TEMPORADA:SIGLA"]` (id do retrato ou `""` se era o ícone padrão; o servidor mantém a primeira),
  mesmo se uma nota corrigida trouxer o chefão de volta. Os guardas da torre continuam com o ícone.
- Falta: o equilíbrio de preços da loja inteira (issue própria).

**0.7 · atualização do Ganbatte** (13/10/2026): lançada na `main`, juntando a 0.6.6-beta1 a beta3 (issues #15, #34, #35,
#54): nome Ganbatte com repositório e Pages novos, visual Nen (clássico em Configurações), nomes base das abas, prazo da
caçada, tarefa vira caçada e cofre opcional. A janela grande escolhe o visual na hora e agradece a quem contribuiu.

**0.6.5** (13/10/2026): lançada na `main`, juntando a 0.6.5-beta1 (issue #51): o estado volta a salvar (a 0.6.4 recusava `migra`
e `tenRec`), nível do Duolingo pela ofensiva, ids de hábito preservados e religados, devolução das compras do rebalanceamento.
A janela grande junta a 0.6.4 e a 0.6.5.

**0.6.4** (13/10/2026): lançada na `main`, juntando a 0.6.4-beta1 a beta5 (issues #6, #7, #36, #37, #46, #47, #49, #50).
A tela do histórico de temporadas, que faltava da #7, virou a #52.

**0.6.3** (13/10/2026): lançada na `main`, juntando a 0.6.3-beta1 e a beta2 (issues #12, #23, #27, #31, #32).

**0.6.3-beta2** (13/10/2026, issue #32): balanceamento. O motor guarda o XP de cada dia por origem (`S.fonteDia`: tipo da tarefa,
hábito, Codeforces, caçadas/expedições, contribuições, `bonus` = o que os multiplicadores somaram, `gravado` = dias
fechados) e `HJ.relatorio(C, S)` monta resumo, semanas e dias (Jenny ganha pelo dia do recibo; gasto pelo `compras`).
`compras` no `estado.json` (`{d, h, tipo: cos|feitico|premio, id, j}`, prêmio real sem o nome): o servidor junta o
registro das duas abas (só cresce, até 3000) e o limite do `estado.json` subiu para 500 KB. `ferramentas/simulador.mjs`
roda o motor no Node com três perfis (leve, médio, pesado) e uma loja comprada do mais barato ao mais caro.
Primeira rodada do simulador (temporada de 132 dias): a torre chega ao topo (251) no dia 59 para o perfil médio e no
dia 21 para o pesado, e o pesado compra a loja inteira no dia 90. Falta decidir as metas (andar no fim, dias por prêmio) antes de mexer nas fórmulas.

**0.6.2-beta5** (12/10/2026, issue #13): as fotos de perfil são o banco de `web/a/`, versionado (o autor garante os
direitos de cada imagem que entra). `avatares()` e a rota `/a/` leem só de lá; a pasta `avatares/` dos dados deixou de
existir para o jogo (quem tinha fotos lá não as vê mais). As 12 primeiras vieram da pasta do autor, renomeadas para
`personagem-N` (`hunter-x-hunter` é o logo); o `AV_ANTIGO` do motor passa o `own` e o `equip.avatar` dos nomes antigos
para os novos ao carregar (grava na próxima vez que o estado for salvo).

**0.6.2-beta4** (12/10/2026, issue #14): `resumo(v, cab)` à direita de cada grade (`.l-hrow` = grade + `.l-hres` de
290px): média de `v(d)` por dia da semana nos dias já vividos do semestre (`VIVIDOS`; hoje só se já tem algo) e o número
da temporada; some com `@container (max-width:860px)`. A grade vai até a véspera de `TEMP.volta` (`FIMG`); os dias de
`fer()` ficam com `.fer` (verde tracejado) quando vazios e não entram nas médias nem nas semanas na meta.

**0.6.2-beta3** (12/10/2026, issue #14): heatmaps da Lista de `TEMP.ini` a `TEMP.fim` (da segunda da semana do início
ao domingo da do fim, `NS` colunas); dias fora da temporada com `.fora` (ocultos), o `hd` ignora o feito antes do `ini`.
`.l-hg` com `grid-template-columns:repeat(var(--n),minmax(12px,26px))` e `aspect-ratio:1`. Título com `TEMP.nome`.

**0.6.2-beta2** (12/10/2026, issues #1, #2): `UI.prova` vira o id do item (`provavel()`: `pal`, `full`, `tex`, `fx` sem
`ev`, `frame`, `font`); `vista()` junta o equipado e o provado, e `aplicaTema()`/`temFx` (efeitos.js, via `fxVisiveis()`)
leem dela. `travaProva()` em captura (click, pointerdown, mousedown, submit, keydown, beforeinput) barra tudo fora de
`LIVRE_NA_PROVA` (navegar, loja, faixa). Semestre: `mesesTemporada()` do `ini` à `volta`, até 12 meses. Codeforces:
`cf_envios()` diz se chegou ao início; se não, `cf_atualiza()` mantém os dias antigos do `por_dia` (o do corte pelo maior).

**0.6.2-beta1** (12/10/2026, issue #29): provar paleta. `UI.prova` (não grava) troca a paleta em `aplicaTema()`;
botão `data-prova` nos itens `pal` e `full` com `eq.theme` ainda não comprados, faixa `faixaProva()` para voltar; comprar
limpa. Codeforces: `cf_envios()` pagina o `user.status` de 1000 em 1000 (até 10 páginas, 2 s entre elas) até passar de
`inicio_temporada()` (linha `temporada` do `avaliacoes.txt`; sem ela, 183 dias), no lugar do `count=2000` fixo.
Limite conhecido: problema resolvido antes da temporada e reenviado nela conta como novo.

**0.6.1** (12/10/2026): a janela de destaques não aparecia para quem atualizava pela aba Novidades (a página volta
em `#nv`, e `rNV` gastava o `visto` antes de `boasNovas`). Agora a janela tem marca própria, `tour["nv:X.Y"]`, e o
"jogador novo" olha o `visto` de quando a página abriu (`VISTO0`).

**0.6 · atualização das expedições** (12/10/2026): lançada na `main`, juntando 0.5.4 a 0.5.9-beta2 (issues #19 a #26).
Novidades agrupadas por versão grande (`versoes`, `subHTML`) e janela de destaques ao atualizar (`janelaGrande`).

**0.5.9-beta2** (12/10/2026, issues #25, #26): as cinco visões das Expedições ficam (formas de ver), tutorial da aba
(`TOURS.x`), "quanto vale" da Lista em `<details>` fechado (`#l-valec`). Próximo passo: a 0.5.9 na `main`.

**0.5.9-beta1** (12/10/2026, issue #20): editor completo da tarefa.
- `abreEd(t)` separa a linha em texto + tipo/disciplina/prazo/prioridade (`LE`); `linhaEd()` monta de volta e só põe a
  tag do tipo se ele mudou (senão devolve as tags originais, `LE.tags0`). `edHTML(S)` desenha a caixa; `dataEd()` não
  redesenha (comeria o clique no salvar). `/api/act` edit com `pri`.

**0.5.8-beta2** (12/10/2026, issues #24, #22, #21): correções.
- Mundo pixel: `pxNome()`, `pxFoto()` e `NEN_QUEM` no lugar do CAIO/Transmutador/Killua escritos no código (o boneco do
  mapa continua o sprite do Killua). Fúria: `.bcard .bars` com `padding-top` para o rótulo "aprovação". Lista:
  `UI.ledit = edKey(t)` (linha + texto), qualquer outra ação fecha a edição, botão cancelar.

**0.5.8-beta1** (12/10/2026, issue #19): caçadas e expedições.
- **Caçada** = as linhas com `+cac.NOME` (`grupos()` em `web/motor.js`). Só agrupa: cada etapa vale o XP normal e não há
  bônus. Na Lista vira um bloco no grupo da etapa mais urgente, com a vida (etapas que faltam), "+ etapa" e ✎.
- **Expedição** = projeto longo (`estado.json` → `expedicoes`), feito de marcos (caçadas com `exp`) e tarefas soltas
  (`+exp.NOME`). Fechar um marco: `MARCO_ETAPA` × etapas (até 12) + `MARCO_DIA` × dias diferentes com etapa feita (até 10);
  concluir: `EXP_SEMANA` × semanas ativas (até 20). Os bônus ficam gravados (`bonus` e `fim`) e entram no XP do dia em
  que fecharam (`somaG` em `estado()`). Números **a calibrar**.
- **Aba Expedições** em `web/expedicoes.js`, com cinco formas de ver (cards, trilha, quadro, foco, cronograma;
  `localStorage` `hj-expv`). Decidido na 0.5.9-beta2 (#25): **ficam as cinco**, como formas de visualização.
- **Registrar:** campo limpo (o resto em "detalhes"), tecla N (o mesmo `#l-add` numa janela), tecla C (caçada com uma
  etapa por linha). Topo da Lista num bloco só, com a missão da semana no canto.
- Tutorial da aba Expedições na 0.5.9-beta2 (#26, `TOURS.x` em `web/guia.js`). Editar o ícone de uma caçada não existe (é sempre o alvo, de propósito).

## Ideias para depois (sem versão definida)

1. **Textos pessoais viram escolha do jogador, sem ficar genéricos.** Muitos textos ainda são do jogo pessoal do autor
   (Killua, "transmutação estilo Killua", nomes e falas de personagens). Ideia: o jogador escolhe o personagem favorito
   no começo (assistente) ou compra na loja, e os textos se adaptam a ele. Falta decidir o formato: lista fixa de
   personagens com textos prontos, textos escritos pelo jogador ou textos gerados por IA.
2. **Personagem conselheiro na aba Chefões, só para quem usa IA.** Um personagem de anime que lê as disciplinas, as
   tarefas de cada uma e o plano de ensino e dá dicas soltas. O personagem é escolhido (ou comprado) na loja. A IA
   entra pela rota da seção "IA integrada ao jogo".
3. **Tradução para mais de um idioma.** Textos da página, do assistente, do servidor e dos pedidos para a IA. A opção de
   formato de data (dd/mm ou mm/dd) já existe e serviria de base.
4. ~~**Duolingo, como o Codeforces (ideia de um amigo).** Para quem usa: ligar a conta e o jogo conta os dias de
   Duolingo sozinho (hábito automático, heatmap e conquistas), opcional como o handle do Codeforces. As dificuldades
   (o Duolingo não tem API pública oficial; ver o que dá para ler e se é estável) ficam para avaliar depois.~~ Feito na 0.6.2
   (#11): só o usuário, pelo perfil público (`streakData`); o XP por dia precisaria de login e ficou de fora.
5. **Ideias guardadas, fora do template para não complicar** (avaliar se interessam aos amigos):
   - gravar o áudio da aula e transcrever no computador, gerando resumo e tarefas (o jogo do autor faz);
   - conferir datas de prova na agenda do Google.
6. **Peles na loja (#17).** O visual Nen seco virou o padrão na 0.6.6-beta3; duas peles testadas junto ficaram guardadas
   em `docs/peles/` (Licença Hunter e Nen com aura), com o passo a passo para virarem itens da Masadora.

## Técnico

- **Testar no Windows e no Mac:** `instalar.ps1`, início automático (`.vbs` na pasta Inicializar, LaunchAgent no Mac),
  `pythonw` sem janela, boas-vindas no terminal. Precisa de um amigo em cada sistema.
- **GitHub Pages:** no ar em https://caioparanaiba.github.io/ganbatte/ (atualiza a cada push que mexe em `web/`).
- **Testes automáticos** do `servidor.py` (hoje os testes são scripts soltos e o Firefox controlado por script).
- **Aba Lista, bloco "constância":** sobra muito espaço entre os heatmaps (20 semanas) e a borda direita. Avaliar: mais
  semanas conforme a largura, quadradinhos maiores, ou outra coisa ao lado (resumo dos números, por exemplo).

## Renomear para `ganbatte` (nome decidido em 13/10/2026, #15)

O nome definitivo é **Ganbatte** (no código, pastas e serviços, `ganbatte`), sem depender do tema. Um repositório só; o servidor
do modo em grupo entra como pasta (`grupo/`, serviço `ganbatte-grupo`). O que muda:

Feito na 0.6.6-beta2 (detalhes na tabela de versões do README): pasta de dados com migração automática, variáveis
`GANBATTE_*` (as `HUNTER_*` ainda valem), início automático `ganbatte`, instalador em `~/ganbatte` (quem tem `~/todo-engine`
continua nela), `/api/ping`, User-Agent e ZIP de backup, textos "Hunter.todo", prefixos `GB`/`GB_`/`GBx`/`gb-` e os
nomes base das abas (`NOMES` no motor).

Repositório renomeado para `ganbatte` e endereços trocados na 0.7 (o Pages novo é `caioparanaiba.github.io/ganbatte`; o
antigo não redireciona). Falta:
- tirar o suporte a `HUNTER_*`, `hj-` e `APP_ANTIGO` depois que todo mundo passar da 0.6.6.

Cuidado para não repetir a migração: no código, nomes neutros (`grupo`, `placar`, `moeda`); os nomes do tema
(Associação Hunter, Torre Trick, Trick Coin) ficam só no texto que aparece na tela.

## Issue #75: exigência das novas conquistas da IA

Implementação para avaliação, ainda sem lançamento: mantém 800/1.500/3.000/6.000 J, mas novas cartas têm `versao: 2`.
D/C/B/A: contagem com piso de 14/35/90/180 tarefas e 7/14/30/60 dias diferentes, ou volume de 125% do ritmo filtrado
nesses dias; sequência diária e constância de 7/14/30/60 dias; hábito semanal por 2/4/8/12 semanas; XP em 2/4/6/8 semanas
completas consecutivas, cada uma acima do recorde em 10%/20%/35%/50%; nota 8/9/9,5/10 com pelo menos 25%/40%/60%/80%
do peso normalizado (para média final, peso ainda em aberto). Piso de 1 tarefa/dia e recorde mínimo de 100 XP.

Constância requer tarefa feita: Zetsu continua salvando o Ten, mas não substitui atividade nesse novo desafio; férias
vazias pausam. Atividades começam no dia seguinte à aceitação, notas podem contar hoje. O motor recusa metas que não
cabem no semestre e cartas com o mesmo alvo aberto, mesmo com números diferentes. Cartas existentes, suas regras,
feitiços e Jenny já resgatada ficam preservados. Ainda é possível uma tarefa servir a alvos diferentes (estudo e disciplina,
por exemplo); o bloqueio é por alvo, não por consumo exclusivo da tarefa.

`tests/test_conquistas.mjs` cobre as regressões e `ferramentas/simulador-conquistas.mjs` executa cenários fictícios no
motor real, comparando com a revisão anterior via `--antes REF`. Os resultados estão em `ISSUE-75-SIMULACOES.md`.
A escolha dos números precisa da avaliação do contribuidor e revisão do Caio. Avisar nas Novidades que novas metas
ficaram mais exigentes; não muda saldo já ganho, preços ou regras de XP das tarefas.
