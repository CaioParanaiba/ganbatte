"""Fila de arte das lojas: prepara as imagens que o gerador salvou e registra o que o Caio achou.

  python3 docs/lojas/arte/arte.py gera ID [--espelha] [--so 1,3,4]   pede ao Antigravity (agy -p), espera, copia as imagens e prepara (--so: só esses conceitos da `Variations:`)
  python3 docs/lojas/arte/arte.py proximo                  acha o próximo item (refazer, senão pendente) e monta a pasta dele
  python3 docs/lojas/arte/arte.py pasta ID [--so 1,3,4]    monta ~/Downloads/ganbatte-arte/ID/ com o(s) prompt(s) e as refs, para o Caio levar ao Gemini
  python3 docs/lojas/arte/arte.py importa ID [--espelha]   pega da pasta as imagens novas que o Caio pôs lá, copia para entrada/ID/ e prepara
  python3 docs/lojas/arte/arte.py prepara ID [--espelha]   limpa entrada/ID/* (tira o magenta, recorta) e abre a bancada no navegador
  python3 docs/lojas/arte/arte.py gostei ID N [nota]       guarda a variação N em aprovadas/ID/ (não é a decisão final); N pode ser 1,2,3
  python3 docs/lojas/arte/arte.py refazer ID "o que mudar"  volta para o gerador com a nota
  python3 docs/lojas/arte/arte.py pular ID [motivo]        fica para depois

Os tipos e as cores de teste vêm da FILA.md. --espelha (só tira): usa a metade de cima e espelha, quando a de baixo
veio suja. Precisa de Pillow e numpy."""
import json, re, shutil, subprocess, sys, webbrowser
from datetime import date
from pathlib import Path

import numpy as np
from PIL import Image

AQUI = Path(__file__).resolve().parent
FILA = AQUI / 'FILA.md'
HOJE = date.today().strftime('%d/%m')
DOWNLOADS = Path.home() / 'Downloads' / 'ganbatte-arte'   # uma pasta por item: prompt(s), referências e o que o Gemini devolveu
IMGS = ('.png', '.jpg', '.jpeg', '.webp')


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


def licenca_css():
    """Copia o CSS da licença hunter do jogo (web/grupo.js) para licenca.css: a bancada mostra emblemas e carimbos na
    licença de verdade, não num quadro de teste."""
    L = (AQUI.parent.parent.parent / 'web' / 'grupo.js').read_text(encoding='utf-8').split('\n')
    a = next(i for i, l in enumerate(L) if '/* licença hunter: um objeto' in l)
    b = next(i for i, l in enumerate(L) if '.tl-pv .tt-lic{width:100%}' in l)
    (AQUI / 'licenca.css').write_text('/* gerado pelo arte.py a partir de web/grupo.js: não edite à mão */\n' + '\n'.join(L[a:b + 1]) + '\n', encoding='utf-8')


def prepara(ident, espelha):
    info, pasta = linha(ident), AQUI / 'entrada' / ident
    licenca_css()
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
    abre(url)


def pasta(ident, so=None):
    """Monta a pasta do item para o Caio levar ao Gemini: prompt.txt (ou prompt-N.txt, um por conceito, se a ficha tem
    `Variations:`) e as imagens de referência como ref-*. Pode rodar de novo (depois de um refazer): reescreve os prompts
    e as refs e não mexe nas imagens que o Caio já pôs lá."""
    info = linha(ident)
    estilo = (AQUI / 'prompts' / '_estilo.txt').read_text(encoding='utf-8').strip()
    ficha = (AQUI / 'prompts' / f'{ident}.md').read_text(encoding='utf-8').strip()
    destino = DOWNLOADS / ident
    destino.mkdir(parents=True, exist_ok=True)
    for f in destino.glob('prompt*.txt'):
        f.unlink()
    for f in destino.glob('ref-*'):
        f.unlink()
    m = re.search(r'^Variations:.*$', ficha, re.M)
    textos = {}
    if m:
        base = ficha[:m.start()].rstrip()
        conceitos = {int(n): c for n, c in re.findall(r'^(\d+)\. (.+)$', ficha[m.end():], re.M)}
        quais = [int(x) for x in so.split(',')] if so else sorted(conceitos)
        base = base.replace('(see Variations)', '(see Concept)').replace('from the Variations list', 'from the Concept line')
        for n in quais:
            textos[f'prompt-{n}.txt'] = f'{estilo}\n\n{base}\n- Concept (draw ONLY this one, a single image): {conceitos[n]}\n'
    else:
        extra = ''
        if info['status'] == 'refazer':
            notas = re.split(r'(?:^|; )\d\d/\d\d: ', info['nota'])
            if notas[-1].strip():
                extra = f'Changes requested: {notas[-1].strip()}\n'
        textos['prompt.txt'] = f'{estilo}\n\n{ficha}\n' + (f'\n{extra}' if extra else '')
    refs = sorted(f for f in (AQUI / 'refs' / ident).glob('*') if f.suffix.lower() in IMGS)
    anexos = ('\nAttached reference images (in this order): ' + ', '.join(f'ref-{f.name}' for f in refs) + '\n') if refs else ''
    for nome, txt in textos.items():
        (destino / nome).write_text(txt + anexos, encoding='utf-8')
    for f in refs:
        shutil.copy(f, destino / f'ref-{f.name}')
    print(f'pasta: {destino}')
    print('prompts:', ', '.join(textos), '| referências:', len(refs))


def importa(ident, espelha):
    """Pega da pasta do item as imagens novas (o que não é ref-* e ainda não foi importado), copia para entrada/ID/
    continuando a numeração e prepara."""
    origem = DOWNLOADS / ident
    if not origem.is_dir():
        sys.exit(f'não achei {origem}: rode `arte.py pasta {ident}` antes')
    diario = origem / '.importadas'
    feitas = diario.read_text(encoding='utf-8').splitlines() if diario.exists() else []
    ja = {x.split(' -> ')[0] for x in feitas}
    novas = sorted((f for f in origem.glob('*') if f.suffix.lower() in IMGS and not f.name.startswith('ref-') and f.name not in ja),
                   key=lambda f: f.stat().st_mtime)
    if not novas:
        sys.exit(f'nenhuma imagem nova em {origem}')
    entrada = AQUI / 'entrada' / ident
    entrada.mkdir(parents=True, exist_ok=True)
    n = len(list(entrada.glob(f'{ident}-*')))
    for f in novas:
        n += 1
        dst = entrada / f'{ident}-{n}{f.suffix.lower()}'
        shutil.copy(f, dst)
        feitas.append(f'{f.name} -> {dst.name}')
        print(f'{f.name} -> entrada/{ident}/{dst.name}')
    diario.write_text('\n'.join(feitas) + '\n', encoding='utf-8')
    prepara(ident, espelha)


def abre(url):
    """Abre a bancada no navegador do Caio, para ele não ter que copiar o link."""
    fx = shutil.which('firefox')
    if fx:
        subprocess.Popen([fx, '--new-tab', url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    else:
        webbrowser.open(url)


def gera(ident, so=None):
    """O agy salva as imagens na pasta da conversa dele (~/.gemini/antigravity-cli/brain/ID-DA-CONVERSA/); daqui elas
    são copiadas para entrada/ID/, continuando a numeração."""
    linha(ident)
    pasta = AQUI / 'entrada' / ident
    pasta.mkdir(parents=True, exist_ok=True)
    pedido = (f'Leia docs/lojas/arte/AGY.md e siga as instruções dele: gere {ident}. '
              'Não use o terminal (nenhum comando): só leitura de arquivos e a sua ferramenta de gerar imagem.')
    if so:   # item com `Variations:` na ficha: gera só alguns conceitos (os outros já existem)
        pedido += f' Gere SÓ os conceitos {so} da linha Variations (os outros já existem), uma imagem por conceito, e espere todas terminarem.'
    refs = sorted(f for f in (AQUI / 'refs' / ident).glob('*') if f.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'))
    if refs:   # o agy já tentou abrir a pasta como se fosse um arquivo e parou sem gerar: dá os caminhos prontos
        pedido += (' As imagens de referência deste item são (abra cada arquivo pelo caminho, nunca a pasta): '
                   + ', '.join(str(f.relative_to(AQUI.parent.parent.parent)) for f in refs) + '.')
    r = subprocess.run(['agy', '-p', pedido, '--mode', 'accept-edits', '--output-format', 'stream-json', '--print-timeout', '900s'],
                       cwd=AQUI.parent.parent.parent, capture_output=True, text=True, timeout=960)
    conv = None
    for ln in r.stdout.splitlines():
        try:
            ev = json.loads(ln)
        except ValueError:
            continue
        if ev.get('event') == 'result':
            conv = ev['result'].get('conversation_id')
            print(ev['result'].get('status'), '·', ev['result'].get('response', '')[:300].replace('\n', ' '))
    if not conv:
        sys.exit('o agy não respondeu:\n' + (r.stderr or r.stdout)[-800:])
    brain = Path.home() / '.gemini' / 'antigravity-cli' / 'brain' / conv
    novas = sorted((f for f in brain.glob('*') if f.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp')), key=lambda f: f.stat().st_mtime)
    if not novas:
        sys.exit(f'nenhuma imagem em {brain}')
    n = len([f for f in pasta.glob(f'{ident}-*')])
    for f in novas:
        n += 1
        shutil.copy(f, pasta / f'{ident}-{n}{f.suffix.lower()}')
    print(f'{len(novas)} imagem(ns) copiada(s) para {pasta.relative_to(AQUI)}')


def proximo():
    """O próximo item da fila: a primeira linha `refazer` ou, se não houver, a primeira `pendente`."""
    linhas = [[x.strip() for x in ln.strip('|').split('|')] for ln in FILA.read_text(encoding='utf-8').splitlines()]
    linhas = [c for c in linhas if len(c) == 5 and c[0] not in ('id', '---')]
    for st in ('refazer', 'pendente'):
        for c in linhas:
            if c[3] == st:
                return c[0]
    sys.exit('a fila acabou: nada em refazer nem pendente')


def gostei(ident, n, nota):
    """n = uma variação (guarda como ID.png) ou várias separadas por vírgula (guarda como ID-N.png, para analisar depois)."""
    ns = [x.strip() for x in str(n).split(',') if x.strip()]
    dst = AQUI / 'aprovadas' / ident
    dst.mkdir(parents=True, exist_ok=True)
    for x in ns:
        src = AQUI / 'entrada' / ident / f'pronto-{x}.png'
        if not src.exists():
            sys.exit(f'não achei {src}')
        alvo = dst / (f'{ident}.png' if len(ns) == 1 else f'{ident}-{x}.png')
        shutil.copy(src, alvo)
        print('guardada em', alvo.relative_to(AQUI.parent.parent.parent))
    marca(ident, 'gostei', nota or ('variação ' + ' e '.join(ns)))


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['proximo']:   # monta a pasta do próximo item para o Gemini
        ident = proximo()
        print('próximo:', ident)
        pasta(ident)
        sys.exit()
    if len(a) < 2:
        sys.exit(__doc__)
    cmd, ident = a[0], a[1]
    if cmd == 'gera':
        gera(ident, a[a.index('--so') + 1] if '--so' in a else None)
        prepara(ident, '--espelha' in a)
    elif cmd == 'pasta':
        pasta(ident, a[a.index('--so') + 1] if '--so' in a else None)
    elif cmd == 'importa':
        importa(ident, '--espelha' in a)
    elif cmd == 'prepara':
        prepara(ident, '--espelha' in a)
    elif cmd == 'gostei':
        gostei(ident, a[2] if len(a) > 2 else '1', ' '.join(a[3:]))
    elif cmd == 'refazer':
        marca(ident, 'refazer', ' '.join(a[2:]) or 'refazer')
    elif cmd == 'pular':
        marca(ident, 'pulado', ' '.join(a[2:]) or 'para depois')
    else:
        sys.exit(__doc__)
