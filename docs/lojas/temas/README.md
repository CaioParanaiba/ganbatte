# Temas exclusivos (#137)

Trabalho em andamento. Nada daqui entra no jogo ainda.

| arquivo | o que é |
|---|---|
| `epicos.html` | Primeira prévia dos três épicos (Arena Celestial, Yorknew à noite, Mapa de Greed Island) numa tela de jogo de mentira. Boa para as ideias; não mostra o encaixe no jogo de verdade. |
| `tema-arena.css`, `tema-arena.js` | O tema Arena Celestial como camada por cima da página real, tudo preso a `:root[data-tema="arena"]`. É a base para o código do jogo. |
| `simula.py` | Gera `sim-TEMA.html`: o jogo inteiro num arquivo, com os dados de um jogador e o tema aplicado (ver o topo do arquivo). O resultado fica fora do git porque leva os dados. |

## Decidido (15/10/2026, comentado na #137)

- No teste inicial o tema não se mistura com outras peças. A ideia depois: o tema é um conjunto de peças únicas e dá para trocar outras por cima.
- Ascensão: quem comprou o pacote recebe a Jenny de volta; o pacote some e vira o tema lendário refeito.
- Tema de quem derrotou a torre: por ora, chegar ao andar 251. Precisa de avaliação mais funda.
- Continente Negro: som ambiente contínuo, com botão de mutar.
- Primeiro os três épicos, um por vez, com simulação no jogo real; depois os lendários.
- A estrutura das abas não muda: o tema troca paleta, fundo e algumas peças únicas.

## Arena Celestial (simulação de 15/10)

- **Em todas as abas:** andar no topo como visor de elevador (pisca e toca o sino ao subir), cards de aço com rebites e um pouco translúcidos, aba atual acesa como botão de elevador, concluir como botão redondo que acende, barras de XP em luzes de andar.
- **Fundo por aba:** Lista e as demais = o céu da altura do seu andar (cidade no fim de tarde lá embaixo, nuvens no andar 90, mar de nuvens acima, noite estrelada perto do 251), e a ficha da Lista vira a janela do quarto; Progresso = o trilho vira a torre com as janelas acesas até o seu andar e você na cabine, com a torre ao longe no fundo; Chefões = o ringue com plateia e holofotes.

## Em aberto

- O encaixe da Arena na prática (o que está demais ou de menos).
- Projetos, Calendário, Conquistas e Loja usam o céu da Lista; ganham algo próprio?
- "Não mistura" também desliga os efeitos já equipados (barra elétrica, Godspeed…)? Hoje o tema só esconde a textura.
- O visor de elevador do tema repete o evento lendário "Elevador da Arena Celestial".
- Yorknew: as luzes contam as tarefas do dia ou acumulam? Janelas por tarefa fixas ou pelo XP?
- Greed Island: mais chefões que cidades; cidade pela data da prova ou escolhida pelo jogador.
- Próximos passos: simulação de Yorknew e de Greed Island no jogo real, cada uma numa página própria.
