"""Fila de arte das lojas: prepara as imagens que o gerador salvou e registra o que o Caio achou.

  python3 docs/lojas/arte/arte.py prepara ID [--espelha]   limpa entrada/ID/* (tira o magenta, recorta) e mostra o link da bancada
  python3 docs/lojas/arte/arte.py gostei ID N [nota]       guarda a variação N em aprovadas/ID/ (não é a decisão final)
  python3 docs/lojas/arte/arte.py refazer ID "o que mudar"  volta para o gerador com a nota
  python3 docs/lojas/arte/arte.py pular ID [motivo]        fica para depois

Os tipos e as cores de teste vêm da FILA.md. --espelha (só tira): usa a metade de cima e espelha, quando a de baixo
veio suja. Precisa de Pillow e numpy."""
import shutil, sys
from datetime import date
from pathlib import Path

import numpy as np
from PIL import Image

AQUI = Path(__file__).resolve().parent
FILA = AQUI / 'FILA.md'
HOJE = date.today().strftime('%d/%m')


def linha(ident):
    for ln in FILA.read_text(encoding='utf-8').splitlines():
        c = [x.strip() for x in ln.strip('|').split('|')]
        if len(c) == 5 and c[0] == ident:
            return {'id': c[0], 'tipo': c[1], 'cor': c[2], 'status': c[3], 'nota': c[4]}
    sys.exit(f'{ident} não está na FILA.md')


def marca(ident, status, nota=None):
    txt = FILA.read_text(encoding='utf-8').splitlines()
    for i, ln in enumerate(txt):
        c = [x.strip() for x in ln.strip('|').split('|')]
        if len(c) == 5 and c[0] == ident:
            c[3] = status
            if nota:
                c[4] = (c[4] + '; ' if c[4] else '') + f'{HOJE}: {nota}'
            txt[i] = '| ' + ' | '.join(c) + ' |'
    FILA.write_text('\n'.join(txt) + '\n', encoding='utf-8')


def sem_magenta(im):
    a = np.asarray(im.convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r > 150) & (b > 150) & (g < 130)
    borda = (r - g > 40) & (b - g > 40) & ~mag          # halo rosado do jpg: vira cinza
    a[borda] = np.repeat(a[borda][:, 1:2], 3, axis=1)
    return Image.fromarray(np.dstack([a.clip(0, 255), np.where(mag, 0, 255)]).astype(np.uint8), 'RGBA')


def tira(im, espelha):
    """Recorta a faixa da corrente e corta num número inteiro de períodos, com a emenda onde menos aparece."""
    im = im.crop(im.getbbox())
    a = np.asarray(im).astype(float)
    if espelha:
        meio = a.shape[0] // 2
        a = np.concatenate([a[:meio], a[:meio][::-1]], axis=0)
    sig = a[..., 1].mean(axis=0) * (a[..., 3].mean(axis=0) / 255)
    sig = sig - sig.mean()
    W = len(sig)
    p = max(range(W // 12, W // 2), key=lambda p: np.dot(sig[:-p], sig[p:]) / (W - p))
    L = p * max(1, (W // 2) // p)
    x0 = min(range(0, W - L - 1), key=lambda x: np.abs(a[:, x] - a[:, x + L]).mean())
    out = Image.fromarray(a[:, x0:x0 + L].astype(np.uint8), 'RGBA')
    return out.resize((round(out.width * 192 / out.height), 192), Image.LANCZOS)


def quadrado(im, lado=512):
    im = im.crop(im.getbbox())
    im.thumbnail((lado, lado), Image.LANCZOS)
    q = Image.new('RGBA', (max(im.size),) * 2)
    q.paste(im, ((q.width - im.width) // 2, (q.height - im.height) // 2))
    return q


def prepara(ident, espelha):
    info, pasta = linha(ident), AQUI / 'entrada' / ident
    cruas = sorted(f for f in pasta.glob('*') if f.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp') and not f.name.startswith('pronto-'))
    if not cruas:
        sys.exit(f'nada em {pasta}')
    saidas = []
    for n, f in enumerate(cruas, 1):
        im = Image.open(f)
        t = info['tipo']
        if t == 'textura':
            out = im.convert('RGB').resize((512, 512), Image.LANCZOS)
        elif t == 'tira':
            out = tira(sem_magenta(im), espelha)
        elif t in ('borda', 'moldura'):
            out = sem_magenta(im)
            out = out.crop(out.getbbox())
            out.thumbnail((768, 768), Image.LANCZOS)
        else:
            out = quadrado(sem_magenta(im))
        destino = pasta / f'pronto-{n}.png'
        out.save(destino, optimize=True)
        saidas.append(destino.relative_to(AQUI).as_posix())
        print(f'{n}: {f.name} -> {destino.name} {out.size}')
    marca(ident, 'gerado')
    url = f"{(AQUI / 'bancada.html').as_uri()}?id={ident}&tipo={info['tipo']}&cor={info['cor'].lstrip('#')}&img={','.join(saidas)}"
    print('\nbancada:', url)


def gostei(ident, n, nota):
    src = AQUI / 'entrada' / ident / f'pronto-{n}.png'
    if not src.exists():
        sys.exit(f'não achei {src}')
    dst = AQUI / 'aprovadas' / ident
    dst.mkdir(parents=True, exist_ok=True)
    shutil.copy(src, dst / f'{ident}.png')
    marca(ident, 'gostei', nota or f'variação {n}')
    print('guardada em', (dst / f'{ident}.png').relative_to(AQUI.parent.parent.parent))


if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    cmd, ident = a[0], a[1]
    if cmd == 'prepara':
        prepara(ident, '--espelha' in a)
    elif cmd == 'gostei':
        gostei(ident, a[2] if len(a) > 2 else '1', ' '.join(a[3:]))
    elif cmd == 'refazer':
        marca(ident, 'refazer', ' '.join(a[2:]) or 'refazer')
    elif cmd == 'pular':
        marca(ident, 'pulado', ' '.join(a[2:]) or 'para depois')
    else:
        sys.exit(__doc__)
