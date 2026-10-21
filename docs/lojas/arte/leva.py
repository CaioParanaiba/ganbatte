"""Leva a arte da fila para o jogo (web/arte/), para os devs provarem na beta: os módulos em código (cursores, efeitos,
heatmaps, vida do chefão) copiados como estão e as imagens aprovadas reduzidas (precisa do ImageMagick, `magick`).
Rode de novo sempre que um módulo ou uma imagem aprovada mudar:  python3 docs/lojas/arte/leva.py
O que cada item é no jogo e o status dele ficam no web/arte.js (ARTE), escrito à mão."""
import shutil
import subprocess
from pathlib import Path

ARTE = Path(__file__).resolve().parent
WEB = ARTE.parent.parent.parent / "web" / "arte"
WEB.mkdir(exist_ok=True)

for pasta, nome in [("cursores", "carta"), ("cursores", "agulha"), ("cursores", "ioio"), ("cursores", "vara"), ("efeitos", "godspeed"),
                    ("efeitos", "jajanken"), ("efeitos", "costura"), ("efeitos", "rastro"), ("efeitos", "soco"), ("efeitos", "dragao"), ("efeitos", "poeira"), ("efeitos", "aura-ambiente"), ("heatmap", "cartas"), ("heatmap", "chamas"), ("hover", "bungee"),
                    ("hover", "en"), ("hover", "vira"), ("hover", "shu"), ("hover", "contorno"), ("hover", "gyo"), ("prazo", "countdown"),
                    ("correntes", "corrente"), ("eletrica", "eletrica"), ("heatmap", "pegadas"), ("hp", "cristal"), ("heatmap", "gungi"), ("texturas", "texturas"),
                    ("efeitos", "digita"), ("efeitos", "aurora"), ("efeitos", "confete"), ("efeitos", "fogos"), ("efeitos", "furia"),
                    ("bordas", "costura-borda")]:
    shutil.copyfile(ARTE / pasta / f"{nome}.js", WEB / f"{nome}.js")
# transições de aba: a base vai como tr-base.js (o palco.js é o jogo de mentira da bancada, não vai)
shutil.copyfile(ARTE / "transicoes" / "base.js", WEB / "tr-base.js")
for nome in ["fumaca", "aspira", "deslizar", "glitch"]:
    shutil.copyfile(ARTE / "transicoes" / f"{nome}.js", WEB / f"{nome}.js")

# [id da fila, largura no jogo]: os carimbos e o emblema aparecem a ~100 px na licença grande (as correntes são desenhadas no correntes/corrente.js)
for id_, larg in [("lic-exame", 200), ("lic-chefao", 200), ("lg-exame", 200),
                  ("lic-emb-aranha", 240)]:
    subprocess.run(["magick", str(ARTE / "aprovadas" / id_ / f"{id_}.png"), "-resize", f"{larg}x", "-strip",
                    "-define", "png:compression-level=9", str(WEB / f"{id_}.png")], check=True)
print("\n".join(sorted(f.name for f in WEB.iterdir())))
