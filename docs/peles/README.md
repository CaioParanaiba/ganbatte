# Peles guardadas para a loja

Testes de visual de 13/10/2026 que não viraram o padrão, guardados para virar itens da Masadora (#17). O padrão desde a
0.6.6-beta3 é o **Nen seco** (bloco `gb-visual` no fim do `web/index.html`); o visual de antes continua em Configurações →
"visual: clássico".

| arquivo | o que muda |
|---|---|
| `licenca.css` | **Licença Hunter.** Cantos retos com marcas douradas em dois cantos opostos (cartão de identidade), títulos em caixa alta espaçada com losango, abas como divisórias de fichário, barras segmentadas (tarja magnética), marca d'água "HUNTER" na ficha do topo, fundo com trama diagonal. |
| `nen-aura.css` | **Nen com aura.** O Nen seco com os efeitos: cantos de chama maiores, fio de aura no topo e brilho por fora dos painéis, aba atual em hexágono com degradê, letreiro do título em degradê, Ten (anéis) em volta do avatar, fundo com duas manchas de aura, barras com brilho. |

Cada arquivo só mexe em forma (borda, canto, título, abas, cabeçalhos, caixinhas, barras, fundo); as cores vêm dos tokens
da paleta (`--aura`, `--volt`, `--amb`…), então valem com qualquer paleta comprada.

## Para virar item da loja

Os seletores estão soltos (foram escritos como camada por cima da página). Para entrar no jogo:

1. Prefixar cada seletor com `:where(:root[data-pele="licenca"])` (ou `nen-aura`), como o `:where(.vis-nen)` do Nen seco:
   `:where()` não soma especificidade, então paleta, moldura, fundo e fonte da loja continuam valendo por cima.
2. Pôr o bloco depois do `gb-visual` (fim do `<body>`), para ganhar do Nen seco.
3. Catálogo em `motor.js` com uma categoria nova (ex.: `pele`) e `aplicaTema()` gravando `data-pele` no `<html>`, como já
   faz com `data-bg`, `data-frame` e `data-font`. Dá para provar na loja como as paletas (`PROVAVEL`).
4. O título: as duas foram feitas quando o jogo ainda era Hunter.todo. A Licença escreve "ASSOCIAÇÃO HUNTER · LICENÇA"
   embaixo do nome; a de aura usa o selo 念 (que já está no Nen seco).
