# Monta a página de mostrar cada cursor (para mandar a amigos, publicada como artifact do Claude): o molde com o código do
# cursor embutido. Uso: python3 docs/lojas/arte/cursores/vitrine/monta.py PASTA_DE_SAIDA   (gera agulha.html e ioio.html)
# Publicadas em 17/10: agulha https://claude.ai/artifact/REZWFJruRBip5JupXcVYfA · ioiô https://claude.ai/artifact/5QHBsDUa5ShaQiZqNkSU6f
import pathlib, sys
AQUI = pathlib.Path(__file__).resolve().parent; C = AQUI.parent; V = pathlib.Path(sys.argv[1]); V.mkdir(parents=True, exist_ok=True)
molde = (AQUI / 'molde.html').read_text()
def li(g): return '\n'.join(f'    <li><b>{a}</b><span>{b}</span></li>' for a, b in g)
def dl(f): return '\n'.join(f'      <div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in f)
paginas = {
 'agulha': dict(TITULO='Agulha do Illumi', ACENTO='#B79CFF',
  ABRE='O cursor do mouse vira a agulha do Illumi Zoldyck: aço, cabeça redonda e física de verdade. <b>Mexa o mouse no quadro preto</b> (no celular, toque e arraste).',
  COMECA='mexa o mouse aqui',
  GESTOS=li([('Mexa', 'A ponta aponta para onde você vai, como um cata-vento. É assim que se mira.'),
             ('Clique', 'Atira a agulha. De ponta e rápida, ela crava na borda e vibra.'),
             ('Segure', 'O nen chama as agulhas de volta e abre um leque entre os dedos.'),
             ('Solte', 'Atira o leque inteiro, cada agulha no seu ângulo.'),
             ('Espere', 'Fique parado uns segundos e veja o que acontece.')]),
  FISICA=dl([('Mira de cata-vento', 'O ar vira a agulha com força proporcional ao quadrado da velocidade do mouse. Parada, uma mola a leva de volta para cima e para a esquerda, como a seta do sistema.'),
             ('Só a ponta crava', 'Crava se bater a mais de <span class="num">360 px/s</span> e quase de frente. De lado ou devagar, ricocheteia como uma barra que gira e cai rolando; se cair de ponta, crava no chão.'),
             ('A haste vibra', 'Cravada, ela enverga e vibra a <span class="num">14 Hz</span>, como uma régua presa na mesa. As vizinhas cravadas na mesma borda tremem junto.'),
             ('Chamada pelo nen', 'As cravadas tremem e saem da borda uma depois da outra, a mais perto primeiro, e voltam puxadas pela cabeça, fazendo a curva.'),
             ('O arremesso', 'Sai a <span class="num">2600 px/s</span>, a ponta na frente, e cai só um pouco. Rápida, quase não sente a gravidade; devagar, sente toda.'),
             ('Kata kata', 'A onomatopeia カタカタ do Gittarackur é desenhada em traços, como em mangá, para aparecer até onde não há fonte japonesa.')])),
 'ioio': dict(TITULO='Ioiô do Killua', ACENTO='#8CC8FF',
  ABRE='O cursor do mouse vira o ioiô de aço do Killua, pendurado num fio de verdade. <b>Mexa o mouse no quadro preto</b> (no celular, toque e arraste).',
  COMECA='mexa o mouse aqui',
  GESTOS=li([('Clique', 'Joga o ioiô para baixo, desenrolando e girando.'),
             ('Segure', 'Ele fica dormindo na ponta do fio esticado, girando sem parar.'),
             ('Solte', 'Dá o tranco e ele sobe enrolando, mais forte quanto mais giro sobrou.'),
             ('Volta ao mundo', 'Segurando, gire o mouse em círculos e o ioiô dá a volta inteira.'),
             ('Passear com o cachorro', 'Segurando, encoste o ioiô no chão: ele anda gastando o giro.')]),
  FISICA=dl([('Um fio de verdade', 'Uma corda Verlet de <span class="num">16 nós</span>, calculada a <span class="num">240 passos por segundo</span>, presa no cursor. O ioiô é o peso da ponta.'),
             ('Balanço e folga', 'O fio balança com o mouse e afrouxa se o mouse desce mais rápido que o ioiô.'),
             ('O giro manda', 'A subida usa o giro que sobrou: girando rápido, ele volta com força; quase parado, mal sobe.'),
             ('Os truques saem da física', 'A volta ao mundo e o passear com o cachorro não são animações prontas: acontecem quando a física deixa.'),
             ('O borrão', 'O borrão do giro é a média de várias cópias do ioiô girado dentro do mesmo quadro, como numa foto.')])),
}
for nome, p in paginas.items():
    js = (C / f'{nome}.js').read_text()
    if nome == 'ioio':   # a página aceita o dedo no celular (a cópia do jogo continua só com o mouse)
        assert js.count("e.pointerType === 'touch'") == 2
        js = js.replace("e.pointerType === 'touch'", "(e.pointerType === 'touch' && !cfg.toque)")
    assert '</script' not in js
    h = molde
    for k, v in {**p, 'MODULO': js, 'NOME': nome}.items(): h = h.replace('{{' + k + '}}', v)
    assert '{{' not in h
    (V / f'{nome}.html').write_text(h)
    print(nome, len(h))
