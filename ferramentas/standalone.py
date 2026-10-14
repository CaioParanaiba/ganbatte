"""Gera docs/prototipo.html: a página do jogo num arquivo só (motor e demonstração embutidos), para abrir com dois cliques."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
html = (WEB / "index.html").read_text(encoding="utf-8")
import base64, json
av = {f.stem: "data:image/png;base64," + base64.b64encode(f.read_bytes()).decode() for f in sorted((WEB / "a").glob("*.png"))}
ch = {"ch-" + f.stem: "data:image/png;base64," + base64.b64encode(f.read_bytes()).decode() for f in sorted((WEB / "chefoes").glob("*.png"))}   # retratos dos chefões (#33)
html = html.replace('<script src="demo.js"></script>', "<script>window.GB_AV = " + json.dumps(av) + ";\nwindow.GB_CH = " + json.dumps(ch) + ";</script>\n<script src=\"demo.js\"></script>")
for nome in ("demo.js", "motor.js", "guia.js", "chefes.js", "ia.js", "conquistas.js", "expedicoes.js", "temporadas.js", "novidades.js", "feedback.js", "efeitos.js"):
    tag = f'<script src="{nome}"></script>'
    assert tag in html, nome
    html = html.replace(tag, "<script>\n" + (WEB / nome).read_text(encoding="utf-8") + "\n</script>")
saida = RAIZ / "docs" / "prototipo.html"
saida.write_text(html, encoding="utf-8")
print(saida)
