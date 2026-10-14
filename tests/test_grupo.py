"""Testes do modo em grupo (#38–#42, #67, #76): o servidor do grupo (grupo/servidor_grupo.py), as contas da Torre Trick
(grupo/torre.py) e o lado do jogo (servidor.py).

Cada teste usa pastas temporárias; nada vai para a internet (as chamadas do jogo ao servidor do grupo são trocadas por
chamadas diretas às funções dele).
"""
import json
import sys
import tempfile
import time
import unittest
from datetime import date, timedelta
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "grupo"))
import servidor as s  # noqa: E402
import servidor_grupo as sg  # noqa: E402
import torre  # noqa: E402


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        sg.DADOS = Path(self.tmp.name)
        sg.abre_banco()
        self.addCleanup(sg.CON.close)
        sg.LIGADO["id"] = None
        sg.falhas.clear()
        self.dono = sg.token_dono()

    def grupo(self, nome="Amigos"):
        r = sg.cria_grupo({"nome": nome, "fuso": "-03:00"})
        return r["grupo"]["id"], r["convite"]

    def entra(self, gid, codigo, nome="Ana"):
        return sg.entrar(gid, {"codigo": codigo, "nome": nome})


class Convites(Base):
    def test_cria_grupo_e_entra_como_admin(self):
        gid, cod = self.grupo("Amigos da Facul")
        self.assertEqual(gid, "amigos-da-facul")
        r = self.entra(gid, cod)
        self.assertTrue(r["admin"])
        self.assertEqual(sg.membro_do(gid, r["token"])["nome"], "Ana")

    def test_banco_guarda_so_o_hash(self):
        gid, cod = self.grupo()
        r = self.entra(gid, cod)
        tokens = [x["token"] for x in sg.q("SELECT token FROM membros")]
        self.assertNotIn(r["token"], tokens)
        self.assertEqual(tokens, [sg.hash_de(r["token"])])
        self.assertFalse(sg.q("SELECT 1 FROM convites WHERE hash = ?", (cod,)))

    def test_convite_de_uso_unico_e_cancelado(self):
        gid, cod = self.grupo()
        self.entra(gid, cod)
        with self.assertRaises(sg.Erro):
            self.entra(gid, cod, "Bia")
        adm = sg.q1("SELECT * FROM membros")
        tk = self.entra(*self.grupo("Outro"))["token"]   # um admin de outro grupo não convida neste
        with self.assertRaises(sg.Erro):
            sg.admin_convite(gid, tk, {})
        self.assertTrue(adm["admin"])

    def test_convite_vencido(self):
        gid, cod = self.grupo()
        sg.q("UPDATE convites SET vence = ?", (time.time() - 1,))
        with self.assertRaises(sg.Erro):
            self.entra(gid, cod)

    def test_reconvite_liga_ao_mesmo_perfil(self):
        gid, cod = self.grupo()
        adm = self.entra(gid, cod)["token"]
        c2 = sg.admin_convite(gid, adm, {})["codigo"]
        bia = self.entra(gid, c2, "Bia")
        sg.envio(gid, bia["token"], {"protocolo": 1, "dias": [{"dia": "2026-10-01", "xp": 10}]})
        c3 = sg.admin_convite(gid, adm, {"membro": bia["membro"]})["codigo"]
        nova = self.entra(gid, c3, "Bia")
        self.assertEqual(nova["membro"], bia["membro"])
        with self.assertRaises(sg.Erro):
            sg.membro_do(gid, bia["token"])   # o token antigo não vale mais
        self.assertEqual(len(sg.q("SELECT * FROM dias")), 1)

    def test_forca_bruta_trava(self):
        gid, _ = self.grupo()
        for _ in range(20):
            with self.assertRaises(sg.Erro):
                self.entra(gid, "AAAAAAAA")
        with self.assertRaises(sg.Erro) as e:
            self.entra(gid, "AAAAAAAA")
        self.assertEqual(e.exception.code, 429)

    def test_grupo_precisa_de_um_admin(self):
        gid, cod = self.grupo()
        a = self.entra(gid, cod)
        b = self.entra(gid, sg.admin_convite(gid, a["token"], {})["codigo"], "Bia")
        with self.assertRaises(sg.Erro):
            sg.admin_membro(gid, a["token"], {"membro": a["membro"], "admin": False})
        with self.assertRaises(sg.Erro):
            sg.sair(gid, a["token"])
        sg.admin_membro(gid, a["token"], {"membro": b["membro"], "admin": True})
        sg.sair(gid, a["token"])
        self.assertTrue(sg.membro_do(gid, b["token"], admin=True))


class Envio(Base):
    def setUp(self):
        super().setUp()
        gid, cod = self.grupo()
        self.gid, self.tk = gid, self.entra(gid, cod)["token"]

    def test_sobrescreve_por_dia(self):
        sg.envio(self.gid, self.tk, {"protocolo": 1, "dias": [{"dia": "2026-10-01", "xp": 10, "hab": {"cf": 2}}]})
        sg.envio(self.gid, self.tk, {"protocolo": 1, "dias": [{"dia": "2026-10-01", "xp": 30, "hab": {"cf": 3}}]})
        r = sg.q("SELECT xp, hab FROM dias")
        self.assertEqual([(x["xp"], json.loads(x["hab"])) for x in r], [(30, {"cf": 3})])

    def test_protocolo_antigo(self):
        with self.assertRaises(sg.Erro) as e:
            sg.envio(self.gid, self.tk, {"protocolo": 0, "dias": []})
        self.assertEqual(e.exception.code, 426)

    def test_fora_da_temporada_do_grupo_fica_de_fora(self):
        sg.admin_config(self.gid, self.tk, {"ini": "2026-10-01", "fim": "2026-12-15"})
        r = sg.envio(self.gid, self.tk, {"protocolo": 1, "dias": [{"dia": "2026-09-30", "xp": 5}, {"dia": "2026-10-02", "xp": 5}]})
        self.assertEqual((r["gravados"], r["ignorados"]), (1, 1))

    def test_dado_ruim(self):
        for dia in ({"dia": "ontem"}, {"dia": "2026-10-01", "xp": -1}, {"dia": "2026-10-01", "hab": {"Nome Pessoal": 1}}):
            with self.assertRaises(sg.Erro):
                sg.envio(self.gid, self.tk, {"protocolo": 1, "dias": [dia]})

    def test_placar_so_com_fatos(self):
        hoje = sg.hoje_no(-180)
        dias = [{"dia": (hoje - timedelta(days=i)).isoformat(), "xp": 40, "hab": {"cf": 1}} for i in range(3)]
        sg.envio(self.gid, self.tk, {"protocolo": 1, "dias": dias})
        m = sg.placar(self.gid, self.tk)["membros"][0]
        self.assertEqual(m["sequencia"], 3)
        self.assertNotIn("xp", json.dumps(m["dias"]))   # o XP de cada um não sai no placar
        self.assertEqual(m["dias"][hoje.isoformat()], {"a": 1, "cf": 1})


class Fechamento(Base):
    def setUp(self):
        super().setUp()
        gid, cod = self.grupo()
        self.gid, self.tk = gid, self.entra(gid, cod)["token"]
        self.dia = sg.hoje_no(-180) - timedelta(days=3)
        sg.envio(self.gid, self.tk, {"protocolo": 1, "dias": [{"dia": self.dia.isoformat(), "xp": 50}]})
        self.prazo = sg.instante(self.dia + timedelta(days=1), -180)

    def ligado(self, ini, fim):
        sg.q("INSERT INTO ligado (ini, fim) VALUES (?, ?)", (ini, fim))

    def fechados(self):
        return {r["periodo"] for r in sg.q("SELECT periodo FROM fechados")}

    def test_so_fecha_com_12h_ligado_depois_do_prazo(self):
        self.ligado(self.prazo - 3600, self.prazo + 11 * 3600)   # o notebook desligou 11h depois do prazo
        sg.fecha_periodos(self.prazo + 20 * 3600)
        self.assertNotIn("dia:" + self.dia.isoformat(), self.fechados())
        self.ligado(self.prazo + 15 * 3600, self.prazo + 17 * 3600)   # voltou e ficou mais 2h: 13h no total
        sg.fecha_periodos(self.prazo + 17 * 3600)
        self.assertIn("dia:" + self.dia.isoformat(), self.fechados())
        n = json.loads(sg.q1("SELECT dados FROM fechados WHERE periodo = ?", ("dia:" + self.dia.isoformat(),))["dados"])
        self.assertEqual((n["membros"], n["dias_com_xp"], n["mediana_xp"]), (1, 1, 50))

    def test_fecha_as_6h_no_fuso_do_grupo(self):
        self.assertEqual(sg.instante(date(2026, 10, 14), -180) - sg.instante(date(2026, 10, 14), 0), 3 * 3600)
        self.assertEqual(sg.fuso_de("-03:00"), -180)
        self.assertEqual(sg.fuso_txt(330), "+05:30")
        with self.assertRaises(sg.Erro):
            sg.fuso_de("3")

    def test_semana_e_mes(self):
        self.assertEqual(sg.dias_do("semana:2026-W42"), (date(2026, 10, 12), date(2026, 10, 18)))
        self.assertEqual(sg.dias_do("mes:2026-12"), (date(2026, 12, 1), date(2026, 12, 31)))
        self.assertEqual([k for k, _ in sg.periodos_do(date(2026, 10, 31))], ["dia:2026-10-31", "mes:2026-10"])

    def test_copia_do_banco(self):
        sg.copia_do_dia()
        f = list((sg.DADOS / "copias").glob("grupo-*.db"))
        self.assertEqual(len(f), 1)
        import sqlite3
        c = sqlite3.connect(str(f[0]))
        self.addCleanup(c.close)
        self.assertEqual(c.execute("SELECT COUNT(*) FROM membros").fetchone()[0], 1)


CF = {"id": "cf", "nome": "Codeforces", "fonte": "automatico", "desde": ""}
DUO = {"id": "duo", "nome": "Duolingo", "fonte": "vinculo", "desde": "2026-08-01"}


def dias_de(ini, n, f):
    """{dia: fato} de n dias a partir de ini, com f(i) → (xp, hab) ou None (o dia não chegou)."""
    out = {}
    for i in range(n):
        x = f(i)
        if x is not None:
            out[(ini + timedelta(days=i)).isoformat()] = {"xp": x[0], "hab": x[1] if len(x) > 1 else {}, "f": len(x) > 2 and x[2]}
    return out


class Torre(unittest.TestCase):
    """As contas da Torre Trick (#42), com as regras decididas em 14/10/2026 (docs/COLETIVO.md)."""

    def g(self, dias, hoje, fechados=None, cat=(CF, DUO), calib=None, placares=None, ini=""):
        ms = [{"id": m, "nome": f"m{m}"} for m in sorted(dias)]
        return torre.Grupo(ms, dias, list(cat), fechados or {}, hoje, ini=ini, calib=calib, placares=placares)

    def test_teto_do_primeiro_mes_e_a_mediana_do_proprio_mes(self):
        g = self.g({1: dias_de(date(2026, 8, 1), 4, lambda i: (40,)), 2: dias_de(date(2026, 8, 1), 4, lambda i: (80,))}, "2026-08-04")
        self.assertEqual(g.teto(date(2026, 8, 3)), (60.0, True))

    def test_teto_do_mes_seguinte_congela_o_anterior(self):
        dias = {1: dias_de(date(2026, 8, 1), 45, lambda i: (40,))}
        g = self.g(dias, "2026-09-14", {"mes:2026-08": {"mediana_xp": 30, "mediana_ativos": 40}})
        self.assertEqual(g.teto(date(2026, 9, 10)), (30.0, False))
        self.assertEqual(self.g(dias, "2026-09-14").teto(date(2026, 9, 10)), (40.0, True))   # agosto ainda aberto

    def test_mediana_zero_usa_os_dias_com_xp(self):
        g = self.g({1: dias_de(date(2026, 8, 1), 4, lambda i: (90 if i == 0 else 0,))}, "2026-08-04")
        self.assertEqual(g.teto(date(2026, 8, 2))[0], 90.0)

    def test_um_andar_e_um_teto_e_habito_vale_0_2(self):
        g = self.g({1: dias_de(date(2026, 8, 1), 2, lambda i: (100,)), 2: dias_de(date(2026, 8, 1), 2, lambda i: (20, {"duo": 1}))}, "2026-08-02")
        self.assertEqual(g.teto(date(2026, 8, 1))[0], 60.0)
        self.assertEqual(g.andares(1)["andares"], 2.0)            # acima do teto conta 1 andar por dia
        a = g.andares(2)
        self.assertEqual((a["teto"], a["habitos"]), (0.7, 0.4))  # 20/60 por dia e 0,2 por hábito cumprido

    def test_superacao_do_xp_so_entra_quando_o_mes_fecha(self):
        f = lambda i: (10 if i < 31 else 20,)   # agosto 10/dia, setembro 20/dia: +100%
        dias = {1: dias_de(date(2026, 8, 1), 61, f)}
        aberto = self.g(dias, "2026-09-30").andares(1)
        self.assertEqual((aberto["superacao"], aberto["projecao"]), (0.0, 5.0))
        fechado = self.g(dias, "2026-09-30", {"mes:2026-09": {}}).andares(1)
        self.assertEqual((fechado["superacao"], fechado["projecao"]), (5.0, 0.0))   # o máximo: 5 tetos

    def test_primeiro_periodo_nao_da_bonus(self):
        g = self.g({1: dias_de(date(2026, 8, 1), 31, lambda i: (50, {"cf": 2}))}, "2026-08-31", {"mes:2026-08": {}})
        self.assertEqual(g.andares(1)["superacao"], 0.0)

    def test_base_minima_do_codeforces(self):
        # 1 problema por semana; na semana seguinte, 6: contra a base mínima de 3, +100% (e não +500%)
        f = lambda i: (0, {"cf": (1 if i % 7 == 0 else 0) if i < 7 else (6 if i == 7 else 0)})
        g = self.g({1: dias_de(date(2026, 8, 3), 14, f)}, "2026-08-16", {"semana:2026-W33": {}})
        r = g.razao(1, "semana", date(2026, 8, 10), date(2026, 8, 16), g.cf_total(1), lambda a, b: True, 3)
        self.assertEqual(r, 2.0)
        self.assertEqual(g.andares(1)["superacao"], 1.0)

    def test_habito_mantido_em_100_e_superacao_maxima(self):
        dias = {1: dias_de(date(2026, 8, 1), 61, lambda i: (0, {"duo": 1}))}
        g = self.g(dias, "2026-09-30", {"mes:2026-09": {}}, cat=(DUO,))
        self.assertEqual(g.andares(1)["superacao"], 3.0)   # setembro igual a agosto, mas tudo feito: o máximo (3 tetos)

    def test_ferias_e_folga_nao_quebram_a_sequencia_do_codeforces(self):
        # seg 2, ter 0 (folga da semana), qua 3 (férias no dia seguinte), qui férias, sex 4; hoje sex
        hab = [(0, {"cf": 2}), (0, {"cf": 0}), (0, {"cf": 3}), (0, {"cf": 0}, True), (0, {"cf": 4})]
        g = self.g({1: dias_de(date(2026, 10, 12), 5, lambda i: hab[i])}, "2026-10-16")
        self.assertEqual(g.sequencia_cf(1, "cf", date(2026, 10, 16)), (9, 3))
        hab[1] = (0, {"cf": 0})
        hab[0] = (0, {"cf": 0})   # segundo dia sem resolver na mesma semana: zera
        g = self.g({1: dias_de(date(2026, 10, 12), 5, lambda i: hab[i])}, "2026-10-16")
        self.assertEqual(g.sequencia_cf(1, "cf", date(2026, 10, 16)), (7, 2))

    def test_placar_so_com_quem_participa_e_dois_ou_mais(self):
        dias = {1: dias_de(date(2026, 10, 12), 3, lambda i: (10, {"cf": 1})), 2: dias_de(date(2026, 10, 12), 3, lambda i: (10, {"cf": 2})),
                3: dias_de(date(2026, 10, 12), 3, lambda i: (10, {"duo": 1}))}
        r = torre.calcula(self.g(dias, "2026-10-14"))
        ids = {p["id"] for p in r["placares"]}
        self.assertIn("cf:volume", ids)
        self.assertNotIn("duo:constancia", ids)   # só um jogador ligou o Duolingo
        vol = next(p for p in r["placares"] if p["id"] == "cf:volume")
        self.assertEqual([x["membro"] for x in vol["linhas"]], [2, 1])   # o 3 não ligou o Codeforces: nem aparece com zero
        self.assertEqual(r["titulos"][2][0], "cf:volume")

    def test_admin_desliga_e_muda_o_periodo(self):
        dias = {m: dias_de(date(2026, 9, 1), 44, lambda i: (10, {"cf": 1})) for m in (1, 2)}
        r = torre.calcula(self.g(dias, "2026-10-14", placares={"cf:volume": {"on": False}, "habitos": {"per": "mes"}}))
        self.assertNotIn("cf:volume", {p["id"] for p in r["placares"]})
        self.assertEqual(next(p for p in r["placares"] if p["id"] == "habitos")["per"], "mes")

    def test_evolucao_das_ultimas_semanas(self):
        dias = {1: dias_de(date(2026, 9, 1), 44, lambda i: (50,)), 2: dias_de(date(2026, 9, 1), 44, lambda i: (50 if i > 30 else 0,))}
        r = torre.calcula(self.g(dias, "2026-10-14"))
        self.assertEqual(len(r["evolucao"]["semanas"]), 6)
        self.assertEqual(r["evolucao"]["pos"]["geral"][1], [1] * 6)


class TorreNoServidor(Base):
    """A Torre Trick pelo servidor: o placar, a calibração e a frase do líder (#76)."""

    def setUp(self):
        super().setUp()
        gid, cod = self.grupo()
        self.gid, self.a = gid, self.entra(gid, cod)["token"]
        self.b = self.entra(gid, sg.admin_convite(gid, self.a, {})["codigo"], "Bia")["token"]
        hoje = sg.hoje_no(-180)
        self.sem = hoje - timedelta(days=hoje.isoweekday() + 6)   # segunda da semana passada
        for tk, xp in ((self.a, 5), (self.b, 90)):   # a Ana joga um dia só; a Bia, a semana toda
            sg.envio(gid, tk, {"protocolo": 1, "dias": [{"dia": (self.sem + timedelta(days=i)).isoformat(), "xp": xp if tk == self.b or i == 0 else 0}
                                                        for i in range(7)]})

    def fecha_semana(self):
        a, s, _ = self.sem.isocalendar()
        sg.q("INSERT INTO fechados (grupo, periodo, fechado, dados) VALUES (?, ?, ?, '{}')", (self.gid, f"semana:{a}-W{s:02d}", time.time()))

    def test_placar_traz_os_andares_sem_o_xp(self):
        t = sg.placar(self.gid, self.a)["torre"]
        self.assertEqual([x["membro"] for x in t["geral"]], [2, 1])
        self.assertNotIn('"xp"', json.dumps(t["geral"]))

    def test_frase_so_do_lider_e_uma_vez(self):
        self.assertIsNone(sg.placar(self.gid, self.b)["torre"]["frase"]["lider"])   # nenhuma semana fechada ainda
        self.fecha_semana()
        f = sg.placar(self.gid, self.b)["torre"]["frase"]
        self.assertEqual((f["lider"], f["pode_escrever"], f["limite"]), (2, True, 80))
        with self.assertRaises(sg.Erro) as e:
            sg.frase(self.gid, self.a, {"texto": "eu também quero"})
        self.assertEqual(e.exception.code, 403)
        with self.assertRaises(sg.Erro):
            sg.frase(self.gid, self.b, {"texto": "x" * 81})
        self.assertEqual(sg.frase(self.gid, self.b, {"texto": "  semana que vem   tem mais "})["frase"]["texto"], "semana que vem tem mais")
        with self.assertRaises(sg.Erro) as e:
            sg.frase(self.gid, self.b, {"texto": "mudei de ideia"})
        self.assertEqual(e.exception.code, 409)

    def test_admin_apaga_a_frase(self):
        self.fecha_semana()
        sg.frase(self.gid, self.b, {"texto": "oi"})
        semana = sg.placar(self.gid, self.a)["torre"]["frase"]["semana"]
        with self.assertRaises(sg.Erro):
            sg.admin_frase(self.gid, self.b, {"semana": semana})   # a Bia não é admin
        sg.admin_frase(self.gid, self.a, {"semana": semana})
        f = sg.placar(self.gid, self.b)["torre"]["frase"]
        self.assertEqual((f["texto"], f["apagada"], f["pode_escrever"]), ("", True, False))

    def test_calibracao_no_administrar(self):
        r = sg.admin_calibracao(self.gid, self.a, {"valores": {"sup_xp": 4, "frase_max": 60}})
        self.assertEqual((r["calibracao"]["valores"]["sup_xp"], r["calibracao"]["valores"]["frase_max"]), (4.0, 60))
        for ruim in ({"sup_xp": 99}, {"nada": 1}, {"hab": True}):
            with self.assertRaises(sg.Erro):
                sg.admin_calibracao(self.gid, self.a, {"valores": ruim})
        with self.assertRaises(sg.Erro):
            sg.admin_calibracao(self.gid, self.b, {"valores": {"sup_xp": 4}})

    def test_placares_no_administrar(self):
        r = sg.admin_placar(self.gid, self.a, {"id": "cf:volume", "per": "mes"})
        self.assertEqual(next(p for p in r["placares"] if p["id"] == "cf:volume")["per"], "mes")
        with self.assertRaises(sg.Erro):
            sg.admin_placar(self.gid, self.a, {"id": "cf:volume", "per": "ano"})

    def test_banco_da_beta1_ganha_as_colunas(self):
        sg.CON.close()
        import sqlite3
        c = sqlite3.connect(str(sg.DADOS / "grupo.db"))
        c.execute("CREATE TABLE g2 AS SELECT id, nome, fuso, ini, fim, criado FROM grupos")
        c.execute("DROP TABLE grupos")
        c.execute("ALTER TABLE g2 RENAME TO grupos")
        c.commit()
        c.close()
        sg.abre_banco()
        self.assertEqual(sg.q1("SELECT calib FROM grupos")["calib"], "{}")
        self.assertIn("torre", sg.placar(self.gid, self.a))


class Jogo(Base):
    """O lado do jogo: grupo.json, enviado.json e o placar guardado, com o servidor do grupo chamado direto."""

    def setUp(self):
        super().setUp()
        self.jt = tempfile.TemporaryDirectory()
        self.addCleanup(self.jt.cleanup)
        s.DADOS = s.TODO_DIR = Path(self.jt.name)
        s.gravar_json("jogador.json", {"configurado": True, "nome": "Caio", "nick": "caio"})
        self.fora = False
        self.chamadas = []
        p = mock.patch.object(s, "grupo_pede", self.pede)
        p.start()
        self.addCleanup(p.stop)
        self.gid, cod = self.grupo()
        p2 = mock.patch.object(s, "ping_grupo", lambda: False)
        p2.start()
        self.addCleanup(p2.stop)
        self.chave = s.api_grupo_entrar({"link": f"https://pc.tail1.ts.net/g/{self.gid}#{cod}"})["chave"]

    def pede(self, url, metodo, rota, corpo=None, token="", tempo=15, bruto=False):
        if self.fora:
            raise s.GrupoFora("fora do ar", 502)
        self.chamadas.append(rota)
        p = rota.strip("/").split("/")
        try:
            if p[2] == "entrar":
                return sg.entrar(p[1], corpo)
            if p[2] == "envio":
                return sg.envio(p[1], token, corpo)
            if p[2] == "placar":
                return sg.placar(p[1], token)
        except sg.Erro as e:
            raise s.Erro(str(e), e.code)
        raise AssertionError(rota)

    def resumo(self, xp):
        return {"resumo": {"protocolo": 1, "dias": [{"dia": "2026-10-01", "xp": xp, "hab": {}}, {"dia": "2026-10-02", "xp": 5, "hab": {}}]}}

    def test_link_do_convite(self):
        g = s.grupos()[0]
        self.assertEqual((g["url"], g["id"], g["nome"]), ("https://pc.tail1.ts.net", self.gid, "Amigos"))
        self.assertEqual(sg.q1("SELECT nome FROM membros")["nome"], "caio")
        for ruim in ("https://pc.ts.net/g/x", "pc.ts.net/g/amigos#ABCDEFGH", "https://pc.ts.net/g/amigos#AB"):
            with self.assertRaises(s.Erro):
                s.api_grupo_entrar({"link": ruim})

    def test_manda_so_o_que_mudou(self):
        r = s.api_grupo_sincronizar(self.resumo(10))
        self.assertEqual(r["grupos"][self.chave]["enviados"], 2)
        r = s.api_grupo_sincronizar(self.resumo(10))
        self.assertEqual(r["grupos"][self.chave]["enviados"], 0)
        r = s.api_grupo_sincronizar(self.resumo(20))   # editou um dia antigo
        self.assertEqual(r["grupos"][self.chave]["enviados"], 1)
        self.assertEqual(sg.q1("SELECT xp FROM dias WHERE dia = '2026-10-01'")["xp"], 20)

    def test_offline_mostra_o_ultimo_placar_e_manda_depois(self):
        s.api_grupo_sincronizar(self.resumo(10))
        self.fora = True
        r = s.api_grupo_sincronizar(self.resumo(30))["grupos"][self.chave]
        self.assertTrue(r["offline"])
        self.assertEqual(r["placar"]["grupo"]["id"], self.gid)
        self.fora = False
        self.assertEqual(s.api_grupo_sincronizar(self.resumo(30))["grupos"][self.chave]["enviados"], 1)

    def test_sair_apaga_o_vinculo(self):
        with mock.patch.object(s, "grupo_pede", side_effect=s.GrupoFora("fora", 502)):
            s.api_grupo_sair({"chave": self.chave})
        self.assertEqual(s.grupos(), [])
        self.assertNotIn(self.chave, s.ler_json("enviado.json", {}))


if __name__ == "__main__":
    unittest.main()
