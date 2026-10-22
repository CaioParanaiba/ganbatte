"""A tabela do dia do Codeforces (#171, fase 2 do redesenho): as contas, sem rede nem banco (o servidor_grupo.py busca a API e
guarda). Todo dia, às 6h do fuso do grupo, sai um problema por faixa de rating, sorteado entre os que ninguém do grupo
resolveu. Cada faixa é um intervalo (o problema da faixa D tem rating de 1700 a 1900, qualquer um deles), não um número.

Quem resolve ganha o valor da faixa; o 1º a resolver cada problema leva um bônus. O piso: quem é forte não pontua nas
faixas bem abaixo da sua. O teto: a partir do N-ésimo problema que pontua no dia, os outros não pontuam para a pessoa, e o
bônus do 1º passa, pela metade, ao primeiro que ainda pontua. Os números ficam na calibração do grupo (torre.CALIB, cf_*).

O duelo 1×1 usa as mesmas faixas e os mesmos valores: 3 problemas em volta da faixa do mais fraco dos dois (uma abaixo,
a dele e uma acima), cada problema resolvido paga o valor da faixa, sem piso (o mais forte aceitou jogar na faixa do outro)
e sem teto. Vence quem resolver mais; no empate, quem chegou antes ao último que resolveu.
"""
import random

FAIXAS = [(800, 1000), (1100, 1300), (1400, 1600), (1700, 1900), (2000, 2200), (2300, 2600), (2700, 3000)]
LETRAS = "ABCDEFG"
GYM = 100000   # contestId de gym começa aqui: sem rating oficial, fica de fora


def chave(p):
    return f"{p['contestId']}{p['index']}"


def faixa_de(rating):
    """A faixa de quem tem esse rating: a última cujo começo ele já passou (None para quem não tem rating: sem piso)."""
    if not rating:
        return None
    f = [i for i, (lo, _) in enumerate(FAIXAS) if rating >= lo]
    return f[-1] if f else 0


def sorteia(problemas, resolvidos, semente, faixas=None):
    """Um problema por faixa, do problemset do Codeforces (problemset.problems → result.problems), fora os que alguém do
    grupo já resolveu. A semente (grupo e dia) faz o sorteio sair igual se for refeito. faixas: só essas (o duelo)."""
    rnd = random.Random(semente)
    out = []
    for i, (lo, hi) in enumerate(FAIXAS):
        if faixas is not None and i not in faixas:
            continue
        cand = sorted((p for p in problemas if isinstance(p.get("rating"), int) and lo <= p["rating"] <= hi
                       and 0 < p.get("contestId", 0) < GYM and chave(p) not in resolvidos and "*special" not in (p.get("tags") or [])), key=chave)
        if cand:
            p = rnd.choice(cand)
            out.append({"faixa": i, "letra": LETRAS[i], "id": chave(p), "contest": p["contestId"], "index": p["index"],
                        "nome": p.get("name", ""), "rating": p["rating"]})
    return out


def valor(faixa, cal):
    return int(cal["cf_valor"] + cal["cf_passo"] * faixa)


def pontua(problemas, feitos, ratings, cal):
    """feitos: [(membro, id do problema, instante)]. Devolve (linhas, pontos): cada resolução com os pontos e o motivo
    (primeiro, normal, abaixo do piso, teto), na ordem em que aconteceram, e os pontos do dia de cada membro."""
    fx = {p["id"]: p["faixa"] for p in problemas}
    teto, piso, bonus = int(cal["cf_teto"]), int(cal["cf_piso"]), int(cal["cf_bonus"])
    conta, pontos, levou, alguem = {}, {}, set(), set()
    linhas = []
    for m, pid, t in sorted(feitos, key=lambda x: (x[2], x[0])):
        if pid not in fx:
            continue
        f, pf = fx[pid], faixa_de(ratings.get(m))
        pts, motivo = 0, "normal"
        if pf is not None and f < pf - piso:
            motivo = "piso"
        elif conta.get(m, 0) >= teto:
            motivo = "teto"
        else:
            conta[m] = conta.get(m, 0) + 1
            pts = valor(f, cal)
            if pid not in levou:
                pts += bonus if pid not in alguem else bonus // 2
                motivo = "primeiro"
                levou.add(pid)
        alguem.add(pid)
        pontos[m] = pontos.get(m, 0) + pts
        linhas.append({"membro": m, "id": pid, "t": t, "pts": pts, "motivo": motivo})
    return linhas, pontos


# ---------- duelo 1×1 ----------
def faixas_duelo(ratings):
    """As 3 faixas do duelo: a do mais fraco (sem rating conta como a A), uma abaixo e uma acima, sem sair da tabela."""
    f = min(faixa_de(r) or 0 for r in ratings)
    ini = max(0, min(f - 1, len(FAIXAS) - 3))
    return list(range(ini, ini + 3))


def duelo(problemas, feitos, membros, ini, cal):
    """feitos: [(membro, id, instante)]. Devolve, para cada membro, os problemas que resolveu (com o tempo desde o início),
    quantos, o tempo do último e os pontos; e o vencedor (None no empate ou se ninguém resolveu nada)."""
    fx = {p["id"]: p["faixa"] for p in problemas}
    out = {m: {"feitos": {}, "n": 0, "t": 0, "pts": 0} for m in membros}
    for m, pid, t in sorted(feitos, key=lambda x: x[2]):
        if m in out and pid in fx and pid not in out[m]["feitos"]:
            x = out[m]
            x["feitos"][pid] = int(t - ini)
            x["n"] += 1
            x["t"] = int(t - ini)
            x["pts"] += valor(fx[pid], cal)
    a, b = (out[m] for m in membros)
    if (a["n"], -a["t"]) == (b["n"], -b["t"]) or not (a["n"] or b["n"]):
        venceu = None
    else:
        venceu = membros[0] if (a["n"], -a["t"]) > (b["n"], -b["t"]) else membros[1]
    return out, venceu
