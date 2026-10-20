# Japonês na arte

Tudo que for desenhado em japonês (kanji, kana) entra aqui, com a leitura, o significado e onde aparece. Quem escreve o
prompt confere antes se a palavra diz mesmo o que a peça quer dizer.

| texto | leitura | significado | onde | observação |
|---|---|---|---|---|
| 念 | nen (ねん) | pensamento, atenção, intenção, desejo. Em Hunter x Hunter, é o Nen, a energia vital que os personagens aprendem a controlar | `lic-exame` (variação 1, **escolhida em 16/10**; guardada em `aprovadas/lic-exame/lic-exame.png`) | Sozinho **não** quer dizer "aprovado": é uma referência à série. Para "passou no exame" o certo é 合格 (gōkaku) |
| 合格 | gōkaku (ごうかく) | passar, ser aprovado (em exame ou seleção) | ainda não usado | opção se o carimbo do exame quiser dizer "aprovado" de verdade |
| 判子 | hanko (はんこ) | carimbo ou selo pessoal japonês, feito de um bloco entalhado e usado com tinta vermelha | `lg-exame` (final) | só o estilo: a imagem não tem caracteres, é um nó geométrico entalhado |
| カタカタ | kata kata (かたかた) | onomatopeia de coisa dura chacoalhando, batendo de leve e repetido | `cr-agulha` (a agulha treme sozinha quando o mouse fica parado; desenhado em traços no `cursores/agulha.js`, sem fonte) | É o barulho do Illumi disfarçado de Gittarackur no Exame Hunter; diz mesmo "chacoalhar". Na bancada e na legenda aparece escrito "kata kata", porque a máquina pode não ter fonte japonesa |
| グー！ | guu (ぐー) | "pedra" no jankenpon japonês (o punho fechado); é o que o Gon grita no golpe: "Saisho wa guu… Jan, ken… GUU!" | `fx-jajanken-pedra` (o grito do soco, em Dela Gothic One, só em japonês; `efeitos/jajanken.js`) | Diz mesmo "pedra". A fonte vem do Google Fonts só com as letras do grito (`&text=`), então aparece mesmo sem fonte japonesa instalada; o jogo precisa pôr a Dela Gothic One no `<link>` do `index.html` |
| パー！ | paa (ぱー) | "papel" no jankenpon (a mão aberta) | `fx-jajanken-papel` (o grito do golpe; `efeitos/jajanken.js`) | o golpe de emissão do Gon (a aura sai da mão como uma bola) |
| チー！ | chii (ちー) | "tesoura" no jankenpon, na forma que o Gon usa (o comum é チョキ, choki) | `fx-jajanken-tesoura` (o grito do golpe; `efeitos/jajanken.js`) | no anime o Gon grita "chii"; チョキ seria o jeito padrão de dizer tesoura |
| ボッ | bo(t) (ぼっ) | onomatopeia de fogo pegando de uma vez, o "fuuump" de algo que acende; o ッ pequeno no fim corta o som seco | `hm-chamas` (o acender do dia de hoje, em Dela Gothic One; `heatmap/chamas.js`) | É o efeito sonoro clássico de mangá para chama acendendo. Como os gritos do Jajanken, vem do Google Fonts só com essas letras; no jogo, juntar ボッ ao `&text=` da Dela Gothic One do `index.html` |
| 神速 (カンムル) | kanmuru (かんむる) | "velocidade divina": o nome da técnica do Killua que no Brasil é Godspeed; no mangá se escreve 神速 com a leitura カンムル em cima (furigana), e é assim que vai | `fx-godspeed` (entra no impacto, em Dela Gothic One; `efeitos/godspeed.js`) | Diz mesmo o nome da técnica (a leitura comum de 神速 seria shinsoku; カンムル é a do Togashi). Como os gritos, vem do Google Fonts só com essas letras; no jogo, 神速ンムル foi juntado ao `&text=` do `GB_ARTE.fonte()` |
