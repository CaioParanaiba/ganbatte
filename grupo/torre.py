"""Ganbatte · as contas da Torre Trick (#42) e dos placares do grupo (#67), feitas pelo servidor do grupo a partir dos fatos.
Funções puras, sem banco: o servidor_grupo.py monta o retrato do grupo (membros, dias, catálogo, períodos fechados,
calibração) e chama calcula(); os testes chamam direto. Regras no docs/COLETIVO.md (decididas em 14/10/2026):

- 1 andar = 1 teto. Por dia, min(XP, teto) ÷ teto; cada hábito do grupo cumprido vale CALIB["hab"] andar.
- Teto do mês = a mediana do XP diário de todos no mês anterior (contando os dias com 0), congelada quando o mês fecha.
  No 1º mês do grupo, a mediana do próprio mês até agora (provisória). Mediana 0 (o grupo jogou menos da metade dos dias):
  vale a mediana dos dias com XP, para o teto nunca zerar os pontos de todo mundo.
- Superação (contra a própria média): XP no mês, Codeforces na semana (base mínima CALIB["cf_min"]), hábitos no mês, cada
  uma valendo até S andares (S em tetos). Hábito mantido em 100% conta como superação máxima. O 1º período de cada um não
  dá bônus (ele vira a base). O bônus entra nos andares quando o período fecha (#40); antes disso, aparece como projeção.
- Férias não quebram sequência nem constância.
"""
import random
from datetime import date, timedelta

CALIB = {"sup_xp": 5.0, "sup_cf": 1.0, "sup_hab": 3.0, "hab": 0.2, "sup_max": 0.5, "cf_min": 3.0, "frase_max": 80,
         # a tabela do dia do Codeforces (#171, grupo/cf_dia.py): ligada, valor da faixa A e quanto sobe por faixa, bônus do 1º,
         # problemas que pontuam por pessoa por dia e quantas faixas abaixo da sua ainda pontuam
         "cf_tabela": 1, "cf_valor": 2, "cf_passo": 1, "cf_bonus": 2, "cf_teto": 2, "cf_piso": 1,
         # Trick Coin (#43, 22/10): a marca da semana batida e o chefão do mês (base para quem passa do mínimo, até +50%
         # para quem chega ao teto); a tabela do dia paga os próprios pontos (cf_*). A posição no placar não paga moeda.
         "tc_marca": 50, "tc_chefao": 80,
         # redesenho de 21/10 (#170, #172): a marca da semana (15% sobre a média das últimas semanas, ou +5 pontos, nunca
         # abaixo de 20 de 100), o chefão (vida = 100% de um mês normal de cada um, que tira até 150% da própria meta e ganha
         # a base passando de 50% dela) e o pacto de hábito (TC por dia; os dois cumprindo, o dobro para cada um)
         "marca": 0.15, "marca_min": 20, "chefao": 1.0, "chefao_teto": 1.5, "chefao_min": 0.5, "pacto_base": 2}
CALIB_LIMITES = {"sup_xp": (0, 50), "sup_cf": (0, 20), "sup_hab": (0, 30), "hab": (0, 2), "sup_max": (0.1, 2), "cf_min": (0, 50),
                 "frase_max": (20, 200), "cf_tabela": (0, 1), "cf_valor": (0, 100), "cf_passo": (0, 50), "cf_bonus": (0, 50),
                 "cf_teto": (1, 7), "cf_piso": (0, 6), "tc_marca": (0, 500), "tc_chefao": (0, 1000),
                 "marca": (0, 1), "marca_min": (0, 100), "chefao": (0.2, 3), "chefao_teto": (1.1, 3), "chefao_min": (0, 1), "pacto_base": (0, 50)}
CALIB_INT = {"frase_max", "cf_tabela", "cf_valor", "cf_passo", "cf_bonus", "cf_teto", "cf_piso", "tc_marca", "tc_chefao", "marca_min", "pacto_base"}
SEMANAS_EVOLUCAO = 6
# redesenho de 21/10 (#170, #172); os números a calibrar ficam em CALIB, no administrar
BLOCOS = ["ritmo", "prazos", "habitos", "superacao"]   # os 4 blocos fixos do Geral
# a modalidade é um 5º bloco que só existe naquela semana (22/10): um dos 4 (conta em dobro) ou outro sinal que o grupo já
# mede; "hab:<id>" é um hábito do grupo específico. Prazos fica de fora até o protocolo mandar as entregas no prazo.
MODALIDADES = BLOCOS + ["constancia", "cf", "missao"]
OPCOES = 3             # quantas o 1º da semana vê para escolher a próxima


# ---------- datas ----------
def d_(s):
    return s if isinstance(s, date) else date.fromisoformat(s)


def semana_de(d):
    ini = d - timedelta(days=d.isoweekday() - 1)
    return ini, ini + timedelta(days=6)


def mes_de(d):
    ini = d.replace(day=1)
    return ini, date(ini.year + (ini.month == 12), ini.month % 12 + 1, 1) - timedelta(days=1)


def chave_semana(d):
    a, s, _ = d.isocalendar()
    return f"semana:{a}-W{s:02d}"


def chave_mes(d):
    return f"mes:{d.year}-{d.month:02d}"


def dias_entre(a, b):
    while a <= b:
        yield a
        a += timedelta(days=1)


def periodos(tipo, ini, fim):
    """[(início, fim)] das semanas ou meses que tocam [ini, fim], em ordem."""
    corta = semana_de if tipo == "semana" else mes_de
    out, d = [], ini
    while d <= fim:
        a, b = corta(d)
        out.append((a, b))
        d = b + timedelta(days=1)
    return out


def mediana(v):
    v = sorted(v)
    if not v:
        return 0
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


def num(x, casas=1):
    """Número em português: 1,5 · 12 · 1.234."""
    s = f"{x:,.{casas}f}" if casas else f"{round(x):,}"
    s = s.replace(",", "§").replace(".", ",").replace("§", ".")
    return s[:-2] if casas == 1 and s.endswith(",0") else s


def bonus(r, s, smax):
    return s * min(r - 1, smax) / smax if r > 1 else 0.0


# ---------- o retrato do grupo ----------
class Grupo:
    """membros [{id, nome}] (os que estão no grupo) · dias {membro: {"AAAA-MM-DD": {"xp", "hab", "f"}}} · catalogo [{id, nome,
    fonte, desde}] (ativos) · fechados {periodo: dados} · calib {} (sobre CALIB) · placares {id: {on, per}} · hoje · ini/fim
    (temporada; vazio = desde o primeiro dia que chegou)."""

    def __init__(self, membros, dias, catalogo, fechados, hoje, ini="", fim="", calib=None, placares=None, escolhas=None, desde=""):
        self.escolhas = escolhas or {}   # {semana: {membro, mod}}: a modalidade que o 1º escolheu para a semana seguinte
        self.desde = desde               # a 1ª semana em que a escolha vale (antes dela, o sistema rotacionava)
        self.membros = membros
        self.ids = [m["id"] for m in membros]
        self.dias = {m: {d_(k): v for k, v in dias.get(m, {}).items()} for m in self.ids}
        self.catalogo = catalogo
        self.fechados = fechados
        self.hoje = d_(hoje)
        todos = [d for m in self.ids for d in self.dias[m]]
        self.ini = d_(ini) if ini else (min(todos) if todos else self.hoje)
        self.fim = min(d_(fim), self.hoje) if fim else self.hoje
        self.calib = {**CALIB, **{k: v for k, v in (calib or {}).items() if k in CALIB}}
        self.cfg = placares or {}
        self._teto = {}

    def dia(self, m, d):
        return self.dias[m].get(d)

    def na_temporada(self, d):
        return self.ini <= d <= self.fim

    def fechado(self, chave):
        return chave in self.fechados

    # ---------- teto ----------
    def mediana_viva(self, a, b):
        b = min(b, self.hoje)
        v = [(self.dia(m, d) or {}).get("xp", 0) for m in self.ids for d in dias_entre(a, b)]
        return mediana(v), mediana([x for x in v if x > 0])

    def teto(self, d):
        """(XP do teto, provisório?) do mês de d."""
        ini, _ = mes_de(d)
        if ini in self._teto:
            return self._teto[ini]
        ant = mes_de(ini - timedelta(days=1))
        ja_tinha = any(dd < ini for m in self.ids for dd in self.dias[m])

        def de(chave, a, b):
            f = self.fechados.get(chave)
            if f is not None:   # congelado no fechamento (#40)
                t = f.get("mediana_xp") or f.get("mediana_ativos")
                if not t and "mediana_ativos" not in f:   # fechado na 0.9.0-beta1, antes da mediana dos dias com XP
                    t = self.mediana_viva(a, b)[1]
                return t, False
            z, ativos = self.mediana_viva(a, b)
            return z or ativos, True

        if ja_tinha:
            t, prov = de(chave_mes(ant[0]), max(ant[0], self.ini), ant[1])
        else:   # 1º mês do grupo: a mediana do próprio mês, até o mês fechar
            t, prov = de(chave_mes(ini), max(ini, self.ini), mes_de(ini)[1])
        self._teto[ini] = (max(float(t or 0), 1.0), prov)
        return self._teto[ini]

    # ---------- pedaços dos andares ----------
    def dia_andares(self, m, d):
        """(XP com teto, hábitos) em andares, num dia."""
        x = self.dia(m, d)
        if not x or not self.na_temporada(d):
            return 0.0, 0.0
        t, _ = self.teto(d)
        hab = sum(1 for v in (x.get("hab") or {}).values() if v)
        return min(x.get("xp", 0), t) / t, hab * self.calib["hab"]

    def soma(self, m, a, b, f):
        return sum(f(self.dia(m, d)) for d in dias_entre(max(a, self.ini), min(b, self.fim)) if self.dia(m, d))

    # ---------- superação ----------
    def razao(self, m, tipo, a, b, valor, participou, base_min=0.0):
        """r do período [a, b] contra a média dos anteriores (até 3 meses ou 4 semanas) e da temporada, com a projeção do
        período em curso. None: é o 1º período do jogador (vira a base)."""
        fim = min(b, self.fim)
        if fim < a:
            return None
        ant = [p for p in periodos(tipo, self.ini, a - timedelta(days=1)) if participou(p[0], p[1])]
        if not ant:
            return None
        vals = [valor(p[0], p[1]) for p in ant]
        n = 3 if tipo == "mes" else 4
        base = max(sum(vals[-n:]) / len(vals[-n:]), sum(vals) / len(vals), base_min)
        v = valor(a, fim)
        dias, passou = (b - max(a, self.ini)).days + 1, (fim - max(a, self.ini)).days + 1
        if fim < b and passou > 0:
            v = v * dias / passou
        if base <= 0:
            return 1 + self.calib["sup_max"] if v > 0 else 1.0
        return v / base

    def xp_total(self, m):
        return lambda a, b: self.soma(m, a, b, lambda x: x.get("xp", 0))

    def tem_xp(self, m):
        return lambda a, b: any(self.dia(m, d) for d in dias_entre(max(a, self.ini), min(b, self.fim)))

    def hab_feito(self, m, chave=None):
        return lambda a, b: self.soma(m, a, b, lambda x: sum(1 for k, v in (x.get("hab") or {}).items() if v and (chave is None or k == chave)))

    def hab_participou(self, m, chave=None):
        return lambda a, b: self.soma(m, a, b, lambda x: sum(1 for k in (x.get("hab") or {}) if chave is None or k == chave))

    def hab_razao(self, m, a, b, chave=None):
        """Superação de hábitos (dias cumpridos) no período; 100% mantido = máximo."""
        part = self.hab_participou(m, chave)
        if not part(a, b):
            return None
        feito = self.hab_feito(m, chave)
        r = self.razao(m, "mes" if chave is None or chave != "cf" else "semana", a, b, feito, lambda x, y: part(x, y) > 0)
        if r is not None and feito(a, b) == part(a, b):   # o 1º período não dá bônus nem com 100%: ele vira a base
            r = max(r, 1 + self.calib["sup_max"])
        return r

    def bonus_de(self, m):
        """[(chave do período, andares, creditado?)] de cada superação de m na temporada."""
        c, out = self.calib, []
        for a, b in periodos("mes", self.ini, self.fim):
            fecha = self.fechado(chave_mes(a))
            r = self.razao(m, "mes", a, b, self.xp_total(m), self.tem_xp(m))
            if r:
                out.append((chave_mes(a), bonus(r, c["sup_xp"], c["sup_max"]), fecha))
            r = self.hab_razao(m, a, b)
            if r:
                out.append((chave_mes(a), bonus(r, c["sup_hab"], c["sup_max"]), fecha))
        if any(h["id"] == "cf" for h in self.catalogo):
            for a, b in periodos("semana", self.ini, self.fim):
                part = self.hab_participou(m, "cf")
                r = self.razao(m, "semana", a, b, self.cf_total(m), lambda x, y: part(x, y) > 0, c["cf_min"])
                if r:
                    out.append((chave_semana(a), bonus(r, c["sup_cf"], c["sup_max"]), self.fechado(chave_semana(a))))
        return out

    def cf_total(self, m, chave="cf"):
        return lambda a, b: self.soma(m, a, b, lambda x: (x.get("hab") or {}).get(chave, 0))

    # ---------- andares ----------
    def andares(self, m, ate=None):
        """{andares, teto, habitos, superacao, projecao} até a data (o bônus só de período fechado e já terminado)."""
        ate = min(ate or self.fim, self.fim)
        teto = habs = 0.0
        for d in dias_entre(self.ini, ate):
            a, b = self.dia_andares(m, d)
            teto, habs = teto + a, habs + b
        sup = proj = 0.0
        for chave, v, creditado in self.bonus_de(m):
            fim = (mes_de if chave.startswith("mes") else semana_de)(_inicio(chave))[1]
            if creditado and fim <= ate:
                sup += v
            elif not creditado and ate == self.fim:
                proj += v
        return {"andares": round(teto + habs + sup, 1), "teto": round(teto, 1), "habitos": round(habs, 1), "superacao": round(sup, 1), "projecao": round(proj, 1)}

    def andares_semana(self, m, a, b):
        """Andares descidos numa semana: os dias e o bônus do Codeforces daquela semana (a frase do líder, #76)."""
        v = sum(sum(self.dia_andares(m, d)) for d in dias_entre(a, min(b, self.fim)))
        part = self.hab_participou(m, "cf")
        if any(h["id"] == "cf" for h in self.catalogo):
            r = self.razao(m, "semana", a, b, self.cf_total(m), lambda x, y: part(x, y) > 0, self.calib["cf_min"])
            if r:
                v += bonus(r, self.calib["sup_cf"], self.calib["sup_max"])
        return round(v, 1)

    # ---------- placares específicos ----------
    def specs(self):
        """Os placares que o catálogo gera (#67): quantidade → volume, constância (sequência) e superação; fez/não fez →
        constância e superação; mais hábitos e superação total. O admin liga, desliga e muda o período de cada um."""
        out = []
        for h in self.catalogo:
            q = h.get("fonte") == "automatico"
            nome = h["nome"]
            if q:
                out += [{"id": f"{h['id']}:volume", "habito": h["id"], "tipo": "volume", "nome": f"{nome} · mais questões" if h["id"] == "cf" else f"{nome} · volume", "per": "semana", "pers": ["semana", "mes", "temporada"]},
                        {"id": f"{h['id']}:sequencia", "habito": h["id"], "tipo": "sequencia", "nome": f"{nome} · constância + questões", "per": "sequencia", "pers": ["sequencia"]},
                        {"id": f"{h['id']}:superacao", "habito": h["id"], "tipo": "superacao", "nome": f"{nome} · superação", "per": "semana", "pers": ["semana", "mes"]}]
            else:
                out += [{"id": f"{h['id']}:constancia", "habito": h["id"], "tipo": "constancia", "nome": f"{nome} · constância", "per": "temporada", "pers": ["semana", "mes", "temporada"]},
                        {"id": f"{h['id']}:superacao", "habito": h["id"], "tipo": "superacao", "nome": f"{nome} · superação", "per": "mes", "pers": ["semana", "mes"]}]
        out += [{"id": "habitos", "habito": "", "tipo": "habitos", "nome": "hábitos", "per": "temporada", "pers": ["semana", "mes", "temporada"]},
                {"id": "superacao", "habito": "", "tipo": "total", "nome": "superação total", "per": "temporada", "pers": ["mes", "temporada"]}]
        for s in out:
            c = self.cfg.get(s["id"]) or {}
            s["on"] = c.get("on", True) is not False
            if c.get("per") in s["pers"]:
                s["per"] = c["per"]
        return out

    def faixa(self, per, ate):
        if per == "semana":
            a, b = semana_de(ate)
        elif per == "mes":
            a, b = mes_de(ate)
        else:
            a, b = self.ini, ate
        return max(a, self.ini), b

    def constancia(self, m, chave, a, ate):
        """(feitos, contados) de um hábito: conta os dias de a até ate em que ele estava ligado; hoje só conta se já foi
        feito, e um dia de férias sem o hábito não conta (férias não quebram)."""
        feito = cont = 0
        for d in dias_entre(a, min(ate, self.fim)):
            x = self.dia(m, d) or {}
            hab = x.get("hab") or {}
            if chave not in hab:
                continue
            if hab[chave]:
                feito, cont = feito + 1, cont + 1
            elif d != self.hoje and not x.get("f"):
                cont += 1
        return feito, cont

    def sequencia_cf(self, m, chave, ate):
        """Soma dos problemas dentro da sequência atual: um dia sem resolver zera, com 1 folga por semana; férias não quebram."""
        x = (self.dia(m, ate) or {}).get("hab") or {}
        d = ate if x.get(chave) else ate - timedelta(days=1)
        soma = dias = 0
        folga = set()
        while d >= self.ini:
            x = self.dia(m, d) or {}
            v = (x.get("hab") or {}).get(chave)
            if v:
                soma, dias = soma + v, dias + 1
            elif x.get("f"):
                pass
            elif chave_semana(d) not in folga:
                folga.add(chave_semana(d))
            else:
                break
            d -= timedelta(days=1)
        return soma, dias

    def participa(self, m, chave, ate):
        return any(chave in ((self.dia(m, d) or {}).get("hab") or {}) for d in dias_entre(self.ini, ate))

    def valor(self, s, m, ate):
        """(número para ordenar, texto, detalhe) de m no placar s até a data; None = não participa."""
        tipo, h = s["tipo"], s["habito"]
        a, _ = self.faixa(s["per"], ate)
        if tipo in ("volume", "sequencia", "superacao", "constancia") and not self.participa(m, h, ate):
            return None
        if tipo == "volume":
            v = self.cf_total(m, h)(a, ate)
            return v, num(v, 0), "problemas" if h == "cf" else ""
        if tipo == "sequencia":
            v, dias = self.sequencia_cf(m, h, ate)
            return v, num(v, 0), f"{dias} {'dia seguido' if dias == 1 else 'dias seguidos'}"
        if tipo == "constancia":
            f, c = self.constancia(m, h, a, ate)
            return (f / c if c else 0), f"{round(100 * f / c) if c else 0}%", f"{f} de {c} dias"
        if tipo == "superacao":
            b = (semana_de if s["per"] == "semana" else mes_de)(ate)[1]
            if any(x.get("fonte") == "automatico" and x["id"] == h for x in self.catalogo):
                part = self.hab_participou(m, h)
                r = self.razao(m, s["per"], a, b, self.cf_total(m, h), lambda x, y: part(x, y) > 0, self.calib["cf_min"] if h == "cf" else 0)
            else:
                r = self.razao(m, s["per"], a, b, self.hab_feito(m, h), lambda x, y: self.hab_participou(m, h)(x, y) > 0)
                f, c = self.constancia(m, h, a, ate)
                if r is not None and c and f == c:
                    return max(r, 1 + self.calib["sup_max"]), "100%", "mantido"
            if r is None:
                return 0.0, "—", "primeiro período: vira a base"
            return r, "×" + num(r, 2), "contra a sua média"
        if tipo == "habitos":
            hs = [x["id"] for x in self.catalogo if self.participa(m, x["id"], ate)]
            if not hs:
                return None
            v = 0.0
            for k in hs:
                f, c = self.constancia(m, k, a, ate)
                v += f / c if c else 0
            return v, num(v, 2), f"{len(hs)} {'hábito' if len(hs) == 1 else 'hábitos'}"
        # superação total: a média, por dimensão, da superação (0–100%) de cada período da faixa
        smax, dims, nomes = self.calib["sup_max"], [], []
        pct = lambda r: min(max(r - 1, 0), smax) / smax
        rs = [self.razao(m, "mes", p[0], p[1], self.xp_total(m), self.tem_xp(m)) for p in periodos("mes", a, ate)]
        rs = [r for r in rs if r]
        if rs:
            dims.append(sum(map(pct, rs)) / len(rs))
            nomes.append("XP")
        for x in self.catalogo:
            k = x["id"]
            if not self.participa(m, k, ate):
                continue
            tipo_p = "semana" if x.get("fonte") == "automatico" else "mes"
            rs = []
            for p in periodos(tipo_p, a, ate):
                if x.get("fonte") == "automatico":
                    part = self.hab_participou(m, k)
                    r = self.razao(m, tipo_p, p[0], p[1], self.cf_total(m, k), lambda u, w: part(u, w) > 0, self.calib["cf_min"] if k == "cf" else 0)
                else:
                    r = self.hab_razao(m, p[0], p[1], k)
                if r:
                    rs.append(r)
            if rs:
                dims.append(sum(map(pct, rs)) / len(rs))
                nomes.append("CF" if k == "cf" else x["nome"])
        if not dims:
            return None
        v = sum(dims) / len(dims)
        return v, f"{round(100 * v)}%", ", ".join(nomes)

    def ranking(self, s, ate):
        linhas = []
        for m in self.ids:
            r = self.valor(s, m, ate)
            if r is not None:
                linhas.append({"membro": m, "v": round(r[0], 4), "txt": r[1], "det": r[2]})
        linhas.sort(key=lambda x: (-x["v"], self.ids.index(x["membro"])))
        return linhas

    def ranking_geral(self, ate=None):
        out = [{"membro": m, **self.andares(m, ate)} for m in self.ids]
        out.sort(key=lambda x: (-x["andares"], self.ids.index(x["membro"])))
        return out

    # ---------- Geral semanal e card da semana (redesenho de 21/10, docs/COLETIVO-REDESENHO.md, #170) ----------
    def sup_100(self, r):
        return None if r is None else round(min(max(r - 1, 0), self.calib["sup_max"]) / self.calib["sup_max"] * 100)

    def blocos(self, m, a, b):
        """Os 4 blocos do Geral (0 a 100) da semana [a, b]; a semana em curso conta só os dias que já passaram. Prazos é
        None até o protocolo mandar as entregas no prazo; Hábitos é None para quem não liga nenhum hábito do grupo;
        Superação é None na 1ª semana de cada um (ela vira a base)."""
        dias = list(dias_entre(max(a, self.ini), min(b, self.fim)))
        if not dias:
            return None
        rit = sum(self.dia_andares(m, d)[0] for d in dias) / len(dias)
        hp = self.hab_participou(m)
        part, feito = hp(a, b), self.hab_feito(m)(a, b)
        rs = [self.razao(m, "semana", a, b, self.xp_total(m), self.tem_xp(m))]
        if part:
            r = self.razao(m, "semana", a, b, self.hab_feito(m), lambda x, y: hp(x, y) > 0)
            rs.append(max(r, 1 + self.calib["sup_max"]) if r is not None and feito == part else r)
        if any(h["id"] == "cf" for h in self.catalogo) and self.hab_participou(m, "cf")(a, b):
            cp = self.hab_participou(m, "cf")
            rs.append(self.razao(m, "semana", a, b, self.cf_total(m), lambda x, y: cp(x, y) > 0, self.calib["cf_min"]))
        sup = [self.sup_100(r) for r in rs if r is not None]
        pz = [(self.dia(m, d) or {}).get("pz") or (0, 0) for d in dias]   # [venceram, no prazo] por dia (protocolo 2)
        n_pz = sum(x[0] for x in pz)
        return {"ritmo": round(rit * 100), "prazos": round(sum(x[1] for x in pz) / n_pz * 100) if n_pz else None,
                "habitos": round(feito / part * 100) if part else None,
                "superacao": round(sum(sup) / len(sup)) if sup else None}

    @staticmethod
    def total(bl, mod):
        return sum(v * (2 if k == mod else 1) for k, v in bl.items() if v is not None)

    def modalidades(self):
        """As modalidades que este grupo pode ter: as de sempre que têm dado e cada hábito do grupo (um por vez)."""
        cat = {h["id"] for h in self.catalogo}
        base = [k for k in MODALIDADES if k != "prazos" and (k != "cf" or "cf" in cat)]
        return base + [f"hab:{h['id']}" for h in self.catalogo if h["id"] != "cf"]

    def mod_valor(self, m, mod, a, b, bl):
        """O 5º bloco (0 a 100) da semana [a, b] para m. None = a pessoa não tem esse dado (não ligou o hábito)."""
        if mod in bl:
            return bl[mod]
        dias = list(dias_entre(max(a, self.ini), min(b, self.fim)))
        if not dias:
            return None
        if mod == "constancia":
            return round(sum(1 for d in dias if (self.dia(m, d) or {}).get("xp", 0) > 0) / len(dias) * 100)
        if mod == "missao":   # a missão da semana pede 3 dias
            return round(min(3, sum(1 for d in dias if (self.dia(m, d) or {}).get("m"))) / 3 * 100)
        chave = "cf" if mod == "cf" else mod[4:]
        if not self.hab_participou(m, chave)(a, b):
            return None
        return round(sum(1 for d in dias if ((self.dia(m, d) or {}).get("hab") or {}).get(chave)) / len(dias) * 100)

    def semanal(self):
        """O Geral de cada semana da temporada (a última é a em curso): os 4 blocos, a modalidade (dobra um deles ou entra
        como 5º), os valores de todas as modalidades (mods), o pódio de superação, a marca da semana e a temporada em
        rodadas ganhas e medalhas. A modalidade de cada semana: a que o 1º da anterior escolheu entre as 3 opções; sem
        escolha, uma delas sorteada. Antes de `desde`, o sistema rotacionava (as semanas antigas não mudam)."""
        rot = self.modalidades()
        semanas, temporada = [], {m: {"rodadas": 0, "medalhas": [0, 0, 0], "superacao": 0, "marcas": 0} for m in self.ids}
        for i, (a, b) in enumerate(periodos("semana", self.ini, self.fim)):
            chave, quem = chave_semana(a)[7:], None
            p = semanas[-1] if semanas else None
            if p and self.desde and p["semana"] >= self.desde and p["opcoes"]:
                e = self.escolhas.get(p["semana"])
                if e and e["membro"] == p["escolhe"] and e["mod"] in p["opcoes"]:
                    mod, quem = e["mod"], e["membro"]
                else:
                    mod = random.Random(f"sorteio:{p['semana']}").choice(p["opcoes"])
            else:
                mod = rot[i % len(rot)]
            linhas = []
            for m in self.ids:
                bl = self.blocos(m, a, b)
                if bl:
                    mods = {k: self.mod_valor(m, k, a, b, bl) for k in rot if k not in bl}
                    mv = bl[mod] if mod in bl else mods.get(mod)
                    linhas.append({"membro": m, "blocos": bl, "mods": mods, "mod": mv, "total": sum(v for v in bl.values() if v is not None) + (mv or 0)})
            linhas.sort(key=lambda x: (-x["total"], -(x["blocos"]["superacao"] or 0), -(x["blocos"]["prazos"] or 0), self.ids.index(x["membro"])))
            sup = sorted([x for x in linhas if x["blocos"]["superacao"] is not None], key=lambda x: (-x["blocos"]["superacao"], -x["total"]))
            # quem escolhe a próxima: o 1º desta semana, a não ser que tenha ganhado as 2 anteriores
            ult = [s["geral"][0]["membro"] for s in semanas if s["geral"]][-2:]
            escolhe = next((x["membro"] for x in linhas if not (len(ult) == 2 and ult[0] == ult[1] == x["membro"])), None)
            resto = [k for k in rot if k != mod]
            semanas.append({"semana": chave, "ini": a.isoformat(), "fim": b.isoformat(), "fechada": b < self.fim, "modalidade": mod,
                            "escolhida_por": quem, "geral": linhas, "superacao": [x["membro"] for x in sup], "escolhe": escolhe,
                            "opcoes": random.Random(chave).sample(resto, min(OPCOES, len(resto))),
                            "escolha": (self.escolhas.get(chave) or {}).get("mod") if (self.escolhas.get(chave) or {}).get("membro") == escolhe else None})
        # marca da semana: calib["marca"] sobre a média das últimas 4 semanas da pessoa na modalidade desta semana (até 100)
        for i, s in enumerate(semanas):
            for x in s["geral"]:
                if x["mod"] is None:
                    continue
                base = [self.mod_valor(x["membro"], s["modalidade"], d_(p["ini"]), d_(p["fim"]), y["blocos"])
                        for p in semanas[max(0, i - 4):i] for y in p["geral"] if y["membro"] == x["membro"]]
                base = [v for v in base if v is not None]
                if base:
                    med = sum(base) / len(base)
                    x["marca"] = min(100, max(round(med * (1 + self.calib["marca"])), round(med) + 5, self.calib["marca_min"]))
                    x["bateu"] = x["mod"] >= x["marca"]
            if s["fechada"]:
                for k, x in enumerate(s["geral"][:3]):
                    temporada[x["membro"]]["medalhas"][k] += 1
                if s["geral"]:
                    temporada[s["geral"][0]["membro"]]["rodadas"] += 1
                if s["superacao"]:
                    temporada[s["superacao"][0]]["superacao"] += 1
                for x in s["geral"]:
                    temporada[x["membro"]]["marcas"] += bool(x.get("bateu"))
        ult = semanas[-1] if semanas else {}
        return {"semanas": semanas, "temporada": temporada, "escolhe": ult.get("escolhe"), "opcoes": ult.get("opcoes", []),
                "escolha": ult.get("escolha"), "modalidades": rot, "marca": self.calib["marca"], "habitos": {h["id"]: h["nome"] for h in self.catalogo}}

    def chefao(self, ref=None):
        """O chefão do mês de ref (padrão: o de hoje): vida = a soma das metas (calib["chefao"] × o XP com teto de um mês normal de
        cada um, pelas 4 semanas com XP antes, ou pelas 2 últimas se for maior; sem histórico, a mediana das metas dos outros; nunca menos de 2 dias cheios).
        O dano é em andares (1 = um dia com o XP no teto do grupo), e cada um tira até calib["chefao_teto"] × a própria meta."""
        c = self.calib
        a, b = mes_de(ref or self.fim)
        fim = min(b, self.fim)
        n = (b - a).days + 1
        sems = [p for p in periodos("semana", self.ini, fim) if p[1] < semana_de(fim)[0]][-4:]
        metas = {}
        for m in self.ids:
            v = [sum(self.dia_andares(m, d)[0] for d in dias_entre(max(p[0], self.ini), p[1])) for p in sems if self.tem_xp(m)(p[0], p[1])]
            if v:   # a média das 4 semanas ou a das 2 últimas, a maior: quem acabou de pegar ritmo não fica com a meta das semanas paradas
                metas[m] = max(max(sum(v) / len(v), sum(v[-2:]) / len(v[-2:])) * n / 7 * c["chefao"], 2.0)
        med = mediana(list(metas.values())) or 10.0
        out = []
        for m in self.ids:
            meta = metas.get(m, med)
            feito = sum(self.dia_andares(m, d)[0] for d in dias_entre(max(a, self.ini), fim))
            out.append({"membro": m, "meta": round(meta, 1), "feito": round(feito, 1), "conta": round(min(feito, meta * c["chefao_teto"]), 1)})
        vida = sum(x["meta"] for x in out)
        return {"mes": a.strftime("%Y-%m"), "fim": b.isoformat(), "vida": round(vida, 1), "dano": round(min(vida, sum(x["conta"] for x in out)), 1),
                "minimo": c["chefao_min"], "teto": c["chefao_teto"], "fator": c["chefao"], "membros": out}

    @staticmethod
    def chefao_paga(ch, base):
        """A Trick Coin do chefão derrotado: base para quem passou do mínimo da própria meta, subindo até +50% no teto."""
        if ch["dano"] < ch["vida"] - 0.05:
            return {}
        out = {}
        for x in ch["membros"]:
            p = x["conta"] / x["meta"] if x["meta"] else 0
            if p >= ch["minimo"]:
                out[x["membro"]] = round(base * (1 + 0.5 * min(1, max(0, (p - 1) / (ch["teto"] - 1)))))
        return out


def _inicio(chave):
    tipo, v = chave.split(":", 1)
    if tipo == "semana":
        a, s = v.split("-W")
        return date.fromisocalendar(int(a), int(s), 1)
    a, mm = v.split("-")
    return date(int(a), int(mm), 1)


def calcula(g):
    """Tudo que o placar do grupo mostra além dos fatos (#42, #67): o teto, o geral em andares, os placares específicos,
    os títulos (quem lidera cada um agora) e a posição de cada um nas últimas semanas."""
    teto, prov = g.teto(g.fim)
    geral = g.ranking_geral()
    sem = g.semanal()
    sem["semanas"] = sem["semanas"][-SEMANAS_EVOLUCAO:]
    s0, s1 = semana_de(g.fim)
    for x in geral:
        x["semana"] = g.andares_semana(x["membro"], s0, s1)
    specs = g.specs()
    placares, titulos = [], {}
    for s in specs:
        if not s["on"]:
            continue
        linhas = g.ranking(s, g.fim)
        if len(linhas) < 2:
            continue
        placares.append({**s, "linhas": linhas})
        if linhas[0]["v"] > 0:
            titulos.setdefault(linhas[0]["membro"], []).append(s["id"])
    # evolução: a posição em cada placar no fim de cada uma das últimas semanas (a última é hoje)
    fins = [g.fim] + [semana_de(g.fim)[0] - timedelta(days=1 + 7 * i) for i in range(SEMANAS_EVOLUCAO - 1)]
    fins = sorted(d for d in fins if d >= g.ini)
    evol = {"semanas": [chave_semana(d)[7:] for d in fins], "pos": {}}
    for p in [{"id": "geral"}] + placares:
        pos = {m: [] for m in g.ids}
        for d in fins:
            linhas = [{"membro": x["membro"]} for x in g.ranking_geral(d)] if p["id"] == "geral" else g.ranking(p, d)
            k = {x["membro"]: i + 1 for i, x in enumerate(linhas)}
            for m in g.ids:
                pos[m].append(k.get(m))
        evol["pos"][p["id"]] = {m: v for m, v in pos.items() if any(v)}
    return {"teto": {"mes": g.fim.strftime("%Y-%m"), "xp": round(teto, 1), "provisorio": prov}, "geral": geral,
            "placares": placares, "config": specs, "titulos": titulos, "evolucao": evol, "semanal": sem, "chefao": g.chefao()}
