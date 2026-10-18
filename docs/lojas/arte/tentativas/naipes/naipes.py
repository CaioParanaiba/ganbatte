"""Emblemas de naipe em SVG (naipe-espadas, -copas, -ouros, -paus e -coringa, #134), feitos pelo Claude.
Gera classico-*.svg, afiado-*.svg e coringa.svg: python3 naipes.py <pasta>

classico = os mesmos traços dos naipes do cursor da carta (cursores/carta.js, função naipe), para o emblema e o cursor
serem o mesmo conjunto do Hisoka. afiado = a versão "grossa e um pouco afiada" que a ficha pedia: ponta de cima mais
longa, pé em espinho, ouros com os lados cavados e paus de três folhas pontudas. coringa = a estrela e a lágrima do
rosto do Hisoka, como o Coringa do baralho do cursor.

Cores de baralho: ♥ e ♦ em vermelho; ♠ e ♣ na cor do texto do placar (claros no escuro, escuros no claro, como os
baralhos em modo escuro). No jogo, o ♠ e o ♣ entram como máscara (mask-image) pintada com a cor do texto; o preto do
arquivo é só para ver o SVG sozinho. Sem contorno: com contorno claro, o ♠ preto no escuro virava um naipe vazado.
Caixa -0.6..0.6 (o naipe ocupa de -0.5 a 0.5, como no carta.js com t = 1).
"""
import math, sys
from pathlib import Path

VERMELHO, PRETO, PAPEL, TINTA, OURO, ROSA = '#E0365A', '#1D2030', '#FBF7EE', '#11131A', '#FFD23F', '#FF5C8A'
CONTORNO = .16          # o traço claro em volta do coringa (metade fica por baixo): ~1 px por fora num emblema de 14 px


def circ(cx, cy, r):
    return f'M{cx + r:.3f} {cy:.3f} A{r} {r} 0 1 0 {cx - r:.3f} {cy:.3f} A{r} {r} 0 1 0 {cx + r:.3f} {cy:.3f} Z'


CLASSICO = {
    'copas': 'M0 .42 C-.1 .3 -.5 .06 -.5 -.16 C-.5 -.43 -.16 -.5 0 -.26 C.16 -.5 .5 -.43 .5 -.16 C.5 .06 .1 .3 0 .42 Z',
    'ouros': 'M0 -.5 Q.14 -.17 .38 0 Q.14 .17 0 .5 Q-.14 .17 -.38 0 Q-.14 -.17 0 -.5 Z',
    'espadas': ('M0 -.48 C.1 -.33 .5 -.12 .5 .1 C.5 .32 .2 .38 .05 .22 Q.07 .42 .2 .5 L-.2 .5 Q-.07 .42 -.05 .22 '
                'C-.2 .38 -.5 .32 -.5 .1 C-.5 -.12 -.1 -.33 0 -.48 Z'),
    'paus': (' '.join(circ(x, y, .21) for x, y in [(0, -.25), (-.25, .05), (.25, .05)])
             + ' M-.06 0 Q-.06 .4 -.2 .5 L.2 .5 Q.06 .4 .06 0 Z'),
}


def folha(ang):
    """Uma folha pontuda do paus afiado, saindo do centro na direção ang (graus)."""
    pts = [(0, .04), (-.24, -.1), (-.2, -.42), (0, -.54), (.2, -.42), (.24, -.1)]
    a = math.radians(ang + 90)
    r = [(x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a)) for x, y in pts]
    f = lambda p: f'{p[0]:.3f} {p[1]:.3f}'
    return f'M{f(r[0])} C{f(r[1])} {f(r[2])} {f(r[3])} C{f(r[4])} {f(r[5])} {f(r[0])} Z'


AFIADO = {
    'copas': 'M0 .54 C-.12 .34 -.5 .1 -.5 -.15 C-.5 -.44 -.17 -.5 0 -.25 C.17 -.5 .5 -.44 .5 -.15 C.5 .1 .12 .34 0 .54 Z',
    'ouros': 'M0 -.56 Q.06 -.12 .37 0 Q.06 .12 0 .56 Q-.06 .12 -.37 0 Q-.06 -.12 0 -.56 Z',
    'espadas': ('M0 -.57 C.12 -.37 .5 -.16 .5 .08 C.5 .3 .26 .38 .08 .24 L.21 .55 L-.21 .55 L-.08 .24 '
                'C-.26 .38 -.5 .3 -.5 .08 C-.5 -.16 -.12 -.37 0 -.57 Z'),
    'paus': ' '.join(folha(a) for a in (-90, 165, 15)) + ' M-.04 .06 L.19 .55 L-.19 .55 L.04 .06 Z',
}


def svg(corpo):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.6 -0.6 1.2 1.2" width="120" height="120">'
            + corpo + '</svg>\n')


def naipe(d, cor):
    return svg(f'<path d="{d}" fill="{cor}"/>')


def estrela(cx, cy, r):
    pts = []
    for i in range(10):
        a, q = -math.pi / 2 + i * math.pi / 5, (r * .45 if i % 2 else r)
        pts.append(f'{cx + math.cos(a) * q:.3f} {cy + math.sin(a) * q:.3f}')
    return 'M' + ' L'.join(pts) + ' Z'


def gota(x, y, t):
    return (f'M{x:.3f} {y - .55 * t:.3f} C{x + .12 * t:.3f} {y - .3 * t:.3f} {x + .36 * t:.3f} {y - .05 * t:.3f} {x + .36 * t:.3f} {y + .17 * t:.3f} '
            f'A{.36 * t:.3f} {.36 * t:.3f} 0 0 1 {x - .36 * t:.3f} {y + .17 * t:.3f} '
            f'C{x - .36 * t:.3f} {y - .05 * t:.3f} {x - .12 * t:.3f} {y - .3 * t:.3f} {x:.3f} {y - .55 * t:.3f} Z')


def coringa():
    # a estrela e a lágrima do Coringa do cursor, aqui sem a carta em volta: contorno claro por fora, tinta por dentro
    e, g = estrela(-.13, -.1, .38), gota(.2, .14, .58)
    fora = f'stroke="{PAPEL}" stroke-width="{CONTORNO + .1}" stroke-linejoin="round"'
    dentro = f'stroke="{TINTA}" stroke-width=".05" stroke-linejoin="round"'
    return svg(f'<path d="{e}" fill="{PAPEL}" {fora}/><path d="{g}" fill="{PAPEL}" {fora}/>'
               f'<path d="{e}" fill="{OURO}" {dentro}/><path d="{g}" fill="{ROSA}" {dentro}/>')


if __name__ == '__main__':
    out = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
    for nome, formas in (('classico', CLASSICO), ('afiado', AFIADO)):
        for s, d in formas.items():
            (out / f'{nome}-{s}.svg').write_text(naipe(d, VERMELHO if s in ('copas', 'ouros') else PRETO))
    (out / 'coringa.svg').write_text(coringa())
    print('feito:', ', '.join(sorted(f.name for f in out.glob('*.svg'))))
