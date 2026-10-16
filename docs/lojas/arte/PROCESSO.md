# Processo da fila de arte (para o Claude)

O Caio gera as imagens no Antigravity (que segue o `AGY.md`), e o Claude prepara, mostra numa bancada e registra o que
ele achou. Um item por vez. "Gostei" guarda a imagem em `aprovadas/` para os outros devs verem; **não** é a decisão
final do item, nem leva nada para o jogo.

Tudo roda na pasta `~/ganbatte-arte` (git worktree do branch `issue-134-arte`, PR #148), nunca na `~/todo-engine`,
que é o jogo real do Caio.

## Um ciclo

1. O Caio diz qual item quer (ou "o próximo": a primeira linha `refazer` ou `pendente` da `FILA.md`).
2. Gere e prepare: `python3 docs/lojas/arte/arte.py gera ID` (rode em segundo plano; o Antigravity leva 1 a 3 minutos).
   Ele chama o `agy -p`, que lê o `AGY.md`, gera 3 variações com as referências, e o script copia da pasta da conversa
   do agy para `entrada/ID/` e já prepara. Se o Caio gerou à mão, use só `arte.py prepara ID`.
   O preparo (na tira, `--espelha` se só uma metade veio limpa). O script
   tira o magenta, recorta, acerta a emenda das tiras, salva `entrada/ID/pronto-N.png`, marca `gerado` e abre a
   bancada.
3. O `arte.py` já **abre a bancada no navegador do Caio** (Firefox, em aba nova) ao preparar; ele não deve ter que copiar
   link nenhum. Se for preparar de outro jeito, abra você: `firefox --new-tab "<link>"`. Diga na resposta que abriu (e
   deixe o link só como reserva). Ela já tem as variações lado a lado, cor do teste, e o pedaço
   do jogo certo para o tipo: tira = barras de XP e HP animadas; borda = cards com controle de espessura e fatia;
   cursor = tela preta com o cursor seguindo o mouse; efeito = um box de tarefa que solta o efeito ao concluir;
   carimbo = na licença; emblema = tamanhos e card; moldura = em volta da licença; textura = fundo repetido.
   Para economizar, **não** monte o jogo inteiro e não tire captura sem necessidade: o Caio olha a bancada.
4. Pergunte o que ele achou e registre:
   - gostou: `arte.py gostei ID N "nota curta"` (N = variação; `1,2,3` guarda várias para analisar depois). Na borda, anote a espessura e a fatia que ele usou.
   - não gostou: pergunte se quer **refazer** ou **pular**.
     - refazer: `arte.py refazer ID "o que mudar"`; se fizer sentido, ajuste também `prompts/ID.md` ou ponha
       referências em `refs/ID/`. O Antigravity lê a nota na próxima geração.
     - pular: `arte.py pular ID "motivo"`.
5. A cada item fechado (gostei ou pulado), faça commit no `~/ganbatte-arte` com `FILA.md`, `aprovadas/ID/` e os
   prompts mudados (adicione os arquivos pelo nome; `entrada/` fica fora do git) e dê push no branch.

## Itens que se melhoram em vez de refazer

Ponha em `refs/ID/` a imagem do item como está hoje (recorte da vitrine `docs/lojas/masadora.html` ou
`associacao.html`, ou do jogo) e escreva no `prompts/ID.md`: "Improve the attached reference: keep X, change Y".

## Item novo na fila

Crie `prompts/ID.md` no formato dos outros (tipos e liberdade no `GUIA.md`) e uma linha na `FILA.md`.

## Japonês na arte

Se o prompt ou a imagem trouxer japonês (kanji, kana), ponha em `JAPONES.md` o texto, a leitura, o significado, o item e
se ele diz mesmo o que a peça quer dizer. Faça isso ao escrever o prompt, e de novo ao registrar o `gostei`.
