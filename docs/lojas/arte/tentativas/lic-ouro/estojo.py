"""Estojo dourado da licença em SVG, do tamanho exato da licença do jogo (lic-ouro, #134).
Gera claude-1.svg (guilhochê), claude-2.svg (filete) e claude-3.svg (serrilha): python3 estojo.py <pasta>

viewBox 1560x1000 = a caixa da licença (.tt-lf, proporção 1.56). Em 520 px de largura, 1 unidade = 1/3 px.
A borda que a licença já tem (1px + padding 2cqw) dá ~34 unidades; o furo fica em 37 para cobrir também o filete
de 1px do miolo (.in) e desenhar o nosso no lugar. Raio de fora 4cqw = 62, raio do miolo 2.6cqw ~ 40.
"""
import math, sys
from pathlib import Path

W, H = 1560, 1000
R_FORA, FURO, R_FURO = 62, 37, 38
MEIO = FURO / 2                      # linha do meio da faixa
OURO, ESCURO, CLARO, CONTORNO, RUBI = '#E6B75A', '#A8741A', '#F6DC97', '#2B1D14', '#7A1E2C'


def retang(i, r):
    """Retângulo arredondado com inset i e raio r, como path."""
    x0, y0, x1, y1 = i, i, W - i, H - i
    return (f'M{x0 + r},{y0} H{x1 - r} A{r},{r} 0 0 1 {x1},{y0 + r} V{y1 - r} A{r},{r} 0 0 1 {x1 - r},{y1} '
            f'H{x0 + r} A{r},{r} 0 0 1 {x0},{y1 - r} V{y0 + r} A{r},{r} 0 0 1 {x0 + r},{y0} Z')


def onda(a, b, fixo, horiz, amp, per_alvo, fase):
    """Senoide ao longo de um lado reto, de a a b, cruzando o meio nas pontas."""
    n = max(1, round((b - a) / per_alvo))
    per = (b - a) / n
    pts = []
    passos = n * 16
    for k in range(passos + 1):
        t = a + (b - a) * k / passos
        d = amp * math.sin(2 * math.pi * (t - a) / per + fase)
        pts.append((t, fixo + d) if horiz else (fixo + d, t))
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)


def lados(fn):
    """Aplica fn(a, b, fixo, horiz) nos 4 lados retos, na linha do meio da faixa."""
    m = R_FORA + 10
    return [fn(m, W - m, MEIO, True), fn(m, W - m, H - MEIO, True),
            fn(m, H - m, MEIO, False), fn(m, H - m, W - MEIO, False)]


def cantos(tam, cor, miolo=None):
    """Losango em cada canto, a 45° sobre a linha do meio (ecoa o ◆ do emblema hunter)."""
    rc = R_FORA - MEIO
    off = R_FORA - rc * math.cos(math.pi / 4)
    out = []
    for cx, cy in ((off, off), (W - off, off), (off, H - off), (W - off, H - off)):
        out.append(f'<path d="M{cx},{cy - tam} L{cx + tam},{cy} L{cx},{cy + tam} L{cx - tam},{cy} Z" fill="{cor}" stroke="{CONTORNO}" stroke-width="1.6"/>')
        if miolo:
            t = tam * .45
            out.append(f'<path d="M{cx},{cy - t} L{cx + t},{cy} L{cx},{cy + t} L{cx - t},{cy} Z" fill="{miolo}"/>')
    return out


def base():
    """Faixa lisa: ouro chapado, filete claro por fora (como aresta polida), filete escuro na boca do furo."""
    return [
        f'<path d="{retang(0, R_FORA)} {retang(FURO, R_FURO)}" fill="{OURO}" fill-rule="evenodd"/>',
        f'<path d="{retang(4.5, R_FORA - 4.5)}" fill="none" stroke="{CLARO}" stroke-width="2.4"/>',
        f'<path d="{retang(1.2, R_FORA - 1.2)}" fill="none" stroke="{ESCURO}" stroke-width="2.4"/>',
        f'<path d="{retang(FURO - 1.4, R_FURO + 1.4)}" fill="none" stroke="{ESCURO}" stroke-width="2.8"/>',
    ]


def guilloche():
    el = base()
    for fase in (0, math.pi):
        el += [f'<path d="{d}" fill="none" stroke="{ESCURO}" stroke-width="2.2" stroke-linecap="round"/>'
               for d in lados(lambda a, b, f, h: onda(a, b, f, h, 7.5, 30, fase))]
    return el + cantos(11, ESCURO, CLARO)


def filete():
    el = base()
    el.append(f'<path d="{retang(MEIO, R_FORA - MEIO)}" fill="none" stroke="{ESCURO}" stroke-width="2.4"/>')
    return el + cantos(12, OURO, RUBI)


def serrilha():
    el = base()
    m = R_FORA + 10
    tracos = []
    for a, b, fixo, horiz in ((m, W - m, MEIO, True), (m, W - m, H - MEIO, True), (m, H - m, MEIO, False), (m, H - m, W - MEIO, False)):
        n = round((b - a) / 9)
        for k in range(n + 1):
            t = a + (b - a) * k / n
            tracos.append(f'M{t:.1f},{fixo - 8} V{fixo + 8}' if horiz else f'M{fixo - 8},{t:.1f} H{fixo + 8}')
    el.append(f'<path d="{" ".join(tracos)}" stroke="{ESCURO}" stroke-width="2.4"/>')
    return el + cantos(11, ESCURO, CLARO)


def svg(el):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">\n'
            + '\n'.join(el) + '\n</svg>\n')


if __name__ == '__main__':
    destino = Path(sys.argv[1])
    destino.mkdir(parents=True, exist_ok=True)
    for i, fn in enumerate((guilloche, filete, serrilha), 1):
        (destino / f'claude-{i}.svg').write_text(svg(fn()), encoding='utf-8')
        print(destino / f'claude-{i}.svg')
