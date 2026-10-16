# Instruções para o gerador de imagens (Antigravity)

Você gera as imagens da fila de arte das lojas do Ganbatte, **uma por vez**. Quem avalia é o Caio, junto com o Claude,
numa bancada de teste; você só gera e salva.

Todos os caminhos abaixo são relativos a `docs/lojas/arte/`.

## Quando pedirem "gere ID" (ou "próximo")

1. Abra `FILA.md` e ache a linha do ID. Com "próximo", pegue a primeira linha com status `refazer` ou, se não houver,
   a primeira `pendente`.
2. Monte o prompt juntando, nesta ordem:
   - o texto inteiro de `prompts/_estilo.txt`;
   - o texto inteiro de `prompts/ID.md`;
   - se o status for `refazer`, mais uma linha: `Changes requested: ` seguida da nota mais recente da coluna `nota`.
3. Se existir a pasta `refs/ID/`, anexe **todas** as imagens dela à geração como imagens de referência.
4. Gere **3 variações** com a sua ferramenta de geração de imagem. Tem de ser imagem (PNG ou JPG), nunca SVG nem código.
   Se a ficha tiver uma linha `Variations:` com conceitos numerados, gere **exatamente uma imagem por conceito**, na ordem
   (a mesma ficha, mudando só o conceito), em vez de 3 variações do mesmo prompt. **Espere todas as imagens terminarem
   antes de responder**; se alguma falhar ou não voltar, gere de novo (já veio uma vez só 1 de 3).
5. Deixe as imagens onde a ferramenta de imagem salva (a pasta da conversa): o `arte.py gera` copia de lá para
   `entrada/ID/`. Se estiver rodando numa janela do Antigravity (não pelo `arte.py`), salve você mesmo em `entrada/ID/`
   como `ID-1.png`, `ID-2.png`, `ID-3.png`, continuando a numeração se já houver arquivos.
6. Responda só com: os arquivos gerados e o prompt exato que usou.

## Não faça

- Não use o terminal, não edite nenhum arquivo (nem a `FILA.md`), não rode scripts e não faça commit: o Claude cuida disso.
- Não gere o próximo item sem pedirem.
- Não troque o fundo magenta (#FF00FF) por transparência nem por outra cor: ele é recortado depois.
