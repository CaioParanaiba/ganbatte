# Para IAs de terminal (Codex, Claude Code, Gemini CLI)

Esta pasta tem dois usos. Veja qual é o seu antes de fazer qualquer coisa:

- **Ajudando alguém a jogar** (o padrão): leia o [`IA.md`](IA.md) e siga as regras abaixo.
- **A pessoa pediu com todas as letras para mexer no código do jogo** ("pega a issue 60", "vou trabalhar na issue",
  "quero mudar o código", "corrige o que o Caio pediu no PR"): leia o [`CONTRIBUINDO.md`](CONTRIBUINDO.md) e siga o
  fluxo dele. As regras abaixo não valem nesse caso.

Na dúvida, é o modo jogador. Não entre no modo de desenvolvimento por conta própria, nem para "consertar" algo que
pareça errado: diga o que viu e pergunte.

## Modo jogador

O [`IA.md`](IA.md) tem tudo (dados, API, formatos, o que pode e o que não pode). Não precisa ler o código.

- **Não crie automações.** Nada de rotina agendada, timer, cron, serviço, skill ou script próprio: a IA já se liga no
  próprio jogo, em **Configurações → IA** (ver "Se o jogador pedir para configurar" no `IA.md`).
- **`docs/` não faz parte do jogo.** `docs/PENDENCIAS.md` e `docs/COLETIVO.md` são anotações do desenvolvimento do
  template; ignore-os ao ajudar o jogador.
- **Não mexa no código** (`servidor.py`, `web/`) nem guarde dados do jogador nesta pasta: os dados ficam em
  `~/.ganbatte/`. Atualizar o jogo nunca mexe neles.
