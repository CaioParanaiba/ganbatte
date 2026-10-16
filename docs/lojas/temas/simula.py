"""Simulação de um tema exclusivo (#137): a página do jogo num arquivo só, com os dados de um jogador e a camada do tema
por cima (tema-TEMA.css e tema-TEMA.js, nesta pasta). Nada é gravado: roda o modo demonstração com os dados no lugar do
jogador de exemplo.

  curl -s http://127.0.0.1:PORTA/api/jogo -o /tmp/snap.json      (a porta do seu jogo)
  python3 docs/lojas/temas/simula.py arena /tmp/snap.json

Gera docs/lojas/temas/sim-TEMA.html, que fica fora do git (leva os seus dados)."""
import base64, json, re, sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
WEB = AQUI.parent.parent.parent / 'web'
NOMES = {'arena': 'Arena Celestial simulada'}
tema, arq = sys.argv[1], Path(sys.argv[2])
snap = json.loads(arq.read_text(encoding='utf-8'))
snap.pop('servidor', None)

html = (WEB / 'index.html').read_text(encoding='utf-8')
av = {f.stem: 'data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted((WEB / 'a').glob('*.png'))}
ch = {'ch-' + f.stem: 'data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted((WEB / 'chefoes').glob('*.png'))}

demo = (WEB / 'demo.js').read_text(encoding='utf-8')
def troca(velho, novo):
    global demo
    assert velho in demo, velho[:60]
    demo = demo.replace(velho, novo, 1)
troca("if(location.protocol !== 'file:'", "if(false && location.protocol !== 'file:'")
troca("const HOJE = iso(new Date());", "const HOJE = window.GB_SNAP.hoje;")
troca("const undo = [];", """const undo = [];
{ const S = window.GB_SNAP;   // simulação: os dados do jogador no lugar do jogador de exemplo
  todo = S.todo.slice(); done.splice(0, done.length, ...S.done); AVALIACOES = S.avaliacoes; notas = S.notas; ajustes = S.ajustes;
  estado = S.estado; colecao = S.colecao; jogador = S.jogador; narradas.splice(0, narradas.length, ...S.narradas);
  conquistas.splice(0, conquistas.length, ...S.conquistas); for(const k in cfDia) delete cfDia[k]; Object.assign(cfDia, (S.cf && S.cf.por_dia) || {}); }""")
troca("const real = window.fetch", """{ const r0 = rota; rota = (u, b) => { const j = r0(u, b); if(u === '/api/jogo') Object.assign(j, {duo:window.GB_SNAP.duo, contrib:window.GB_SNAP.contrib, temporadas:window.GB_SNAP.temporadas, cf:Object.assign({}, window.GB_SNAP.cf, {por_dia:cfDia})}); return j; }; }
const real = window.fetch""")

html = html.replace('<script src="demo.js"></script>', '<script>window.GB_AV = ' + json.dumps(av) + ';\nwindow.GB_CH = ' + json.dumps(ch) +
    ';\nwindow.GB_SNAP = ' + json.dumps(snap, ensure_ascii=False) + ';</script>\n<script>\n' + demo + '\n</script>')
for nome in ('motor.js', 'guia.js', 'chefes.js', 'ia.js', 'conquistas.js', 'expedicoes.js', 'temporadas.js', 'novidades.js', 'feedback.js', 'efeitos.js', 'grupo.js'):
    tag = f'<script src="{nome}"></script>'
    assert tag in html, nome
    html = html.replace(tag, '<script>\n' + (WEB / nome).read_text(encoding='utf-8') + '\n</script>')
css = (AQUI / f'tema-{tema}.css').read_text(encoding='utf-8')
js = (AQUI / f'tema-{tema}.js').read_text(encoding='utf-8')
assert '</body>' in html
html = html.replace('</body>', f'<style id="tema-{tema}">\n{css}\n</style>\n<script>\n{js}\n</script>\n</body>')
html = re.sub(r'<title>.*?</title>', f'<title>{NOMES.get(tema, tema)}</title>', html, count=1)
saida = AQUI / f'sim-{tema}.html'
saida.write_text(html, encoding='utf-8')
print(saida, round(len(html) / 1e6, 2), 'MB')
