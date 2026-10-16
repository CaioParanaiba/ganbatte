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
5. Salve em `entrada/ID/` (crie a pasta) como `ID-1.png`, `ID-2.png`, `ID-3.png`. Se já existirem arquivos lá, continue
   a numeração; não sobrescreva nem apague nada.
6. Responda só com: os arquivos salvos e o prompt exato que usou.

## Não faça

- Não edite nenhum arquivo (nem a `FILA.md`), não rode scripts e não faça commit: o Claude cuida disso.
- Não gere o próximo item sem pedirem.
- Não troque o fundo magenta (#FF00FF) por transparência nem por outra cor: ele é recortado depois.
