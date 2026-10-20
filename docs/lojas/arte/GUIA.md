# Arte das lojas: guia para pedir desenhos

Desenhos (emblemas, carimbos, bordas, peças de cursor, texturas) feitos fora do código, no Gemini ou por outra
pessoa, e depois aplicados nos itens das lojas. O objetivo é que qualquer desenho chegue num formato que dê para usar
sem refazer. Decidido em 16/10/2026, a partir da reavaliação das vitrines (#134).

## Como usar

O jeito normal é pela **fila**: `FILA.md` lista os itens, `prompts/` tem o prompt pronto de cada um (`_estilo.txt` +
`ID.md`), `refs/ID/` tem as imagens de referência. O Antigravity gera seguindo o `AGY.md`; o Claude prepara e mostra
na `bancada.html` seguindo o `PROCESSO.md`; o que o Caio gostar fica em `aprovadas/`.

À mão (Gemini ou outra pessoa): cole `prompts/_estilo.txt` e, logo abaixo, `prompts/ID.md`, anexe o que houver em
`refs/ID/`, peça 3 variações e salve como `entrada/ID/ID-1.png`, `-2`, `-3`.

## O que aprendemos no primeiro teste (16/10, corrente)

- Peça **imagem**. Pedindo SVG, o Gemini escreve código com retângulos e arcos, e sai seco como o que já existia.
- Ele ignora o tamanho pedido (a tira veio com 5856×704) e costuma entregar JPG. Tudo bem: o `arte.py` recorta,
  tira o magenta e acerta a emenda. Os tamanhos da tabela abaixo valem como **proporção**.
- Ele tende a repetir o objeto (a tira veio com duas correntes empilhadas). O `_estilo.txt` já pede uma cópia só.
- Para tingir pela cor do tema, o branco do desenho pega a cor e o contorno escuro fica (multiplicar), senão vira mancha.
- Borda montada a partir da tira não ficou boa: a borda de card é pedida inteira, com cantos desenhados (`bd-corrente`).

O prompt está em inglês porque o Gemini segue melhor as regras técnicas assim. As fichas podem ser escritas em
português, se for mais fácil.

## Guia de estilo (colar sempre igual)

```
STYLE GUIDE (always apply):
Game asset for a dark-themed productivity game inspired by Hunter x Hunter (2011 anime).
Clean bold linework, flat cel shading with at most 2 shadow tones, no gradients,
no glow, no lens flare, no 3D render look. Must read clearly when shrunk to 48 px.
Original design inspired by the theme: do not copy official logos or trace anime frames.
Solid flat #FF00FF magenta background filling everything outside the object
(no shadow on the background, no vignette, no texture on it).
No text, no letters, no signature, no watermark, no border around the image.
Follow the ASSET SHEET below. "Freedom" says how much you may invent beyond the description.
```

## Formato da ficha

```
ASSET SHEET:
- Item: <nome>   (file: <id>.png)
- Type: <emblem | stamp | frame-fixed | border-stretch | texture | strip | cursor | sprite>
- Canvas: <tamanho> — <regra do tipo, da tabela abaixo>
- Color: <"tintable: pure white with light-grey shading only" | "fixed palette: #..., #...">
- Freedom: <low | medium | high>
- Description: <o que é, em 1 ou 2 frases>
- Avoid: <o que deu errado antes ou não pode aparecer>
```

## Tipos e o que cada um permite

| Tipo | Tela | Regra técnica | Liberdade |
|---|---|---|---|
| `emblem`: emblema, ícone | 1024×1024 | objeto centralizado, 12% de margem vazia | alta |
| `stamp`: carimbo, selo | 1024×1024 | uma cor de tinta, falhas de tinta, borda irregular; reto (a rotação é aplicada no jogo) | média |
| `frame-fixed`: moldura de algo de tamanho fixo (avatar, licença, retrato) | 1024×1024 | a área do conteúdo fica magenta; a moldura pode ser assimétrica e sair do quadro até 10% (pendurar, vazar) | alta |
| `border-stretch`: borda de algo que estica (cards, painéis) | 1024×1024 | os **cantos** são livres e podem ser elaborados; os **lados** têm de ser um padrão que repete, com espessura fixa de 10% do lado | cantos alta, lados baixa |
| `texture`: fundo | 1024×1024 | sem emenda nos quatro lados (repete lado a lado), escura e de baixo contraste, porque fica atrás de texto | média |
| `strip`: tira (corrente, barra) | 1024×128 | repete na horizontal sem emenda; a altura do desenho ocupa a tira toda | baixa |
| `cursor`: peça de cursor | 512×512 | a ponta ativa no canto superior esquerdo; silhueta forte, porque vira 32–48 px | média |
| `sprite`: peça solta para animar | 1024×1024 | uma peça por imagem, centralizada; quem anima é o código | média |

A liberdade só é baixa onde o código precisa repetir ou esticar o desenho. Em peças de tamanho fixo (avatar, licença,
retrato), a arte entra por cima como camada, então pode ser tão livre quanto quiser.

## Faixa: o gatilho decide (20/10, com o Caio)

O que separa raro de épico é **quando o efeito aparece**, não o quanto ele é bonito (a regra da #17 vista do desenho):

- **Comum**: muda uma coisa só, parado (paleta, título, moldura fina).
- **Raro**: desenho, não movimento. Parado, ou um disparo curto (menos de meio segundo) num momento que não é toda hora:
  trocar de aba, tarefa atrasada, andar novo. CSS ou SVG, sem física; cabe numa sessão.
- **Épico**: o personagem em ação. Em código, com física, a cada tarefa ou o tempo todo (cursores, efeitos de concluir,
  fundos animados).
- **Lendário**: uma cena, exclusiva de pacote ou conquista.

Para não diluir os épicos: ideia nova entra como raro na versão simples, e só vira épico quando a ação é o item. Quando
der, cada personagem ganha um par raro + épico (a Machi: borda costurada + costura ao concluir).

## Cores

- **Tingível** (`tintable`): desenho em branco puro com sombras em cinza-claro. O jogo aplica a cor do tema ou da aura
  por cima, então o mesmo desenho serve para todas as paletas. Use em aura, corrente, moldura e tudo o que deve seguir
  o tema.
- **Cor fixa** (`fixed palette`): para o que tem cor própria (aranha, coroa, carimbo vermelho). A ficha lista os hex.

## Entrega

- Um PNG por imagem, nome do arquivo = id do item (`lic-emb-aranha.png`); variações com sufixo (`-2`, `-3`).
- Fundo magenta chapado, sem transparência (o Gemini não gera transparência confiável; o fundo é recortado depois).
- Aprovação: o desenho tem de continuar legível reduzido a 48 px. Detalhe fino demais vira mancha no jogo.

## O que não vem daqui

Movimento e física ficam no código: aura fluida, fogos, ioiô com física, Bungee Gum, raio do Godspeed, transições.
Nesses itens, o desenho fornece no máximo as peças (`sprite`), e o código anima.

## Fichas

Itens marcados com "execução ruim" ou "pode melhorar" na reavaliação de 16/10 cujo problema é o desenho. As versões
que valem para gerar são as de `prompts/` (já com as lições acima); estas ficam como explicação de cada item.

### Elo de corrente (serve a 4 itens)
Corrente de Kurapika, cursor de corrente, HP de corrente e Borda de corrente da licença. Na reavaliação: "ou bugadas ou
secas, muito png básico".
```
- Item: Chain links (files: corrente-tira.png, corrente-elo.png)
- Type: strip (tira) + sprite (one single link, for the cursor and the license border)
- Canvas: strip 1024×128, seamless horizontal; sprite 1024×1024 centered
- Color: tintable
- Freedom: low
- Description: Kurapika's chain: heavy oval steel links alternating flat and side-on, thick outline, chunky and readable.
- Avoid: thin wire look, realistic metal reflections, links that don't connect at the seam.
```

### Carimbo: Exame aprovado (`lic-exame`)
Na reavaliação: "não parece um carimbo, parece só um texto".
```
- Item: Hunter Exam approved stamp (file: lic-exame.png)
- Type: stamp
- Canvas: 1024×1024, centered, 12% margin
- Color: fixed palette: #C0303A ink
- Freedom: medium
- Description: a round rubber stamp with a double ring and a bold central mark meaning "approved" (a check or the 念 kanji). Uneven ink, worn edges, some gaps where the ink failed.
- Avoid: clean vector look, letters or words (the game writes the text if needed).
```

### Selo: chefão do grupo (`lic-chefao`)
"Mesma coisa do outro selo, a melhorar." Mesma família visual do carimbo acima.
```
- Item: Group boss seal (file: lic-chefao.png)
- Type: stamp
- Canvas: 1024×1024, centered, 12% margin
- Color: fixed palette: #2F6FB8 ink
- Freedom: medium
- Description: a rectangular official seal with a crown-and-skull or broken-tower motif, same rubber-stamp style as the exam stamp.
- Avoid: words, clean vector look.
```

### Licença do Exame Hunter (`lg-exame`, lendário)
"Não é tão épico para um desafio em grupo, e não parece carimbo." A 1ª tentativa (selo de cera dourado) foi refeita em
16/10: a textura destoava da licença e o Caio prefere carimbo; a ficha atual pede 4 conceitos bem diferentes (carimbo
queimado, carimbo redondo pesado, selo quadrado estilo hanko, estêncil). Ficha completa em `prompts/lg-exame.md`.

### Emblema da Aranha (`lic-emb-aranha`)
"Refazer aranha."
```
- Item: Spider emblem (file: lic-emb-aranha.png)
- Type: emblem
- Canvas: 1024×1024, centered, 12% margin
- Color: fixed palette: #1A1416 body, #C0394B accent
- Freedom: high
- Description: a stylized twelve-legged spider seen from above, menacing but simple, like a tattoo emblem.
- Avoid: numbers on the body, cute or cartoon style, realistic hairs, thin legs that disappear at small size.
```

### Emblema do Rei (`lg-rei`, lendário)
"Desenho precisa ser refeito."
```
- Item: King emblem (file: lg-rei.png)
- Type: emblem
- Canvas: 1024×1024, centered, 12% margin
- Color: fixed palette: #E6B75A gold, #2B1D14 outline, #7A1E2C jewel
- Freedom: high
- Description: a crown for the Chimera Ant King: organic, slightly insectoid shapes in place of classic fleur-de-lis, regal and alien at once.
- Avoid: generic European crown, glow, sparkles.
```

### Estojo dourado (`lic-ouro`)
"Não parece raro."
```
- Item: Gold license case (file: lic-ouro.png)
- Type: frame-fixed (the license card is a fixed size; the content area stays magenta)
- Canvas: 1024×1024, a horizontal card shape 85.6×54 proportion in the middle
- Color: fixed palette: #E6B75A, #A8741A, #2B1D14
- Freedom: high
- Description: an engraved gold case around the license card, with corner ornaments and fine guilloché engraving.
- Avoid: shiny gradient metal, glow.
```

### Cursores: carta do Hisoka, agulha do Illumi, ioiô do Killua
Os três sobem de raridade com animação, que fica no código. Daqui saem só as peças.
**Desde 16/10 os cursores são feitos em código pelo Claude, com física (`cursores/*.js`), sem o Gemini; a ficha abaixo
fica só como registro.**
```
- Item: Hisoka card / Illumi needle / Killua yo-yo (files: cr-carta.png, cr-agulha.png, cr-ioio.png)
- Type: cursor (card and needle) and sprite (yo-yo body, separate from the string)
- Canvas: 512×512, active tip at the top-left corner (cursor); centered (sprite)
- Color: fixed palette per item (card: white with #FF5C8A and #FFD23F suits; needle: #B9C4D6 steel with a dark round head; yo-yo: #8CC8FF and #EAF2FF)
- Freedom: medium
- Description: the card is a real playing card seen at an angle, with a visible suit; the needle is a long thin pin with a round head; the yo-yo is a chunky, readable disc.
- Avoid: a flat symbol in place of a card, details that vanish at 32 px.
```

### Jajanken (`fx-jajanken`)
"Não parece HxH, parece cartoon; gostei muito da ideia, temos que lapidar."
```
- Item: Jajanken hands (files: fx-jajanken-pedra.png, fx-jajanken-papel.png, fx-jajanken-tesoura.png)
- Type: sprite (one hand per image)
- Canvas: 1024×1024, centered
- Color: tintable
- Freedom: medium
- Description: Gon's Jajanken hands in 2011-anime style: rock (clenched fist), paper (open palm), scissors (two fingers), with strong anatomy and nen energy lines.
- Avoid: cartoon gloves, rounded cute fingers, emoji look.
```

### Chamas da constância (`hm-chamas`)
"Melhorar as chamas em si, estão muito emoji."
```
- Item: Streak flames (file: hm-chamas.png)
- Type: sprite (sheet with 3 sizes: small, medium, large flame side by side)
- Canvas: 1024×512, three flames evenly spaced
- Color: fixed palette: #FF6A1F, #FFB25E, #FFE08A
- Freedom: medium
- Description: anime-style flames with sharp flicking tongues, readable at 16–24 px.
- Avoid: emoji-like teardrop flame, glow.
```

### Naipes da constância em cartas (`hm-cartas`)
Cada dia vira uma carta com o naipe e a cor seguindo o nível do dia, e o dia de Zetsu vira o coringa.
```
- Item: Card suits for the streak grid (files: naipe-espadas.png, naipe-copas.png, naipe-ouros.png, naipe-paus.png, naipe-coringa.png)
- Type: emblem (one per image)
- Canvas: 1024×1024, centered, 12% margin
- Color: tintable (the game paints each day's level)
- Freedom: medium
- Description: the four suits in Hisoka's style, bold and slightly sharp; the joker is a jester-mask face meant for rest days (Zetsu).
- Avoid: thin outlines, letters.
```
