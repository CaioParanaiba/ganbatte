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
import cf_dia  # noqa: E402


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


class Mudanca(Base):
    """Levar o servidor do grupo para outro computador (#91): restaurar a cópia e avisar o endereço novo."""

    def setUp(self):
        super().setUp()
        self.gid, cod = self.grupo()
        self.tk = self.entra(self.gid, cod)["token"]
        sg.envio(self.gid, self.tk, {"protocolo": 1, "dias": [{"dia": "2026-10-01", "xp": 10}]})
        self.copia = sg.DADOS / "copia.db"
        sg.faz_copia(self.copia)

    def test_restaura_a_copia_e_o_token_continua_valendo(self):
        self.grupo("Outro")   # depois da cópia: some ao restaurar
        r = sg.restaura(self.copia.read_bytes())
        self.assertEqual([g["id"] for g in r["grupos"]], [self.gid])
        self.assertEqual(sg.membro_do(self.gid, self.tk)["nome"], "Ana")
        self.assertEqual(sg.q1("SELECT xp FROM dias")["xp"], 10)
        self.assertEqual(len(list((sg.DADOS / "copias").glob("antes-de-restaurar-*.db"))), 1)

    def test_recusa_arquivo_que_nao_e_copia(self):
        import sqlite3
        vazio = sg.DADOS / "vazio.db"
        sqlite3.connect(str(vazio)).close()
        sqlite3.connect(str(vazio)).execute("CREATE TABLE x (a)").connection.close()
        for ruim in (b"isto nao e um banco", vazio.read_bytes(), self.copia.read_bytes()[:2000]):
            with self.assertRaises(sg.Erro):
                sg.restaura(ruim)
        self.assertEqual(sg.membro_do(self.gid, self.tk)["nome"], "Ana")   # o banco atual ficou como estava

    def test_copia_baixada_depois_do_aviso_nao_manda_de_volta(self):
        sg.muda_para({"endereco": "https://novo.tail1.ts.net"})
        sg.faz_copia(self.copia)
        sg.restaura(self.copia.read_bytes())
        self.assertEqual(sg.mudou(), "")

    def test_aviso_responde_410_com_o_endereco_novo(self):
        import threading
        from http.server import ThreadingHTTPServer
        srv = ThreadingHTTPServer(("127.0.0.1", 0), sg.H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        self.addCleanup(srv.server_close)
        self.addCleanup(srv.shutdown)
        url = f"http://127.0.0.1:{srv.server_address[1]}"
        self.assertEqual(s.grupo_pede(url, "GET", f"/g/{self.gid}/placar", token=self.tk)["grupo"]["id"], self.gid)
        sg.muda_para({"endereco": "https://novo.tail1.ts.net/"})
        with self.assertRaises(s.GrupoMudou) as e:
            s.grupo_pede(url, "GET", f"/g/{self.gid}/placar", token=self.tk)
        self.assertEqual(e.exception.para, "https://novo.tail1.ts.net")
        self.assertEqual(s.grupo_pede(url, "GET", "/dono", token=self.dono)["mudou"], "https://novo.tail1.ts.net")
        with self.assertRaises(sg.Erro):
            sg.muda_para({"endereco": "novo.ts.net"})
        sg.muda_para({"endereco": ""})
        self.assertEqual(s.grupo_pede(url, "GET", f"/g/{self.gid}/placar", token=self.tk)["grupo"]["id"], self.gid)
        # o arquivo vai cru, como o jogo do host manda
        r = s.grupo_pede(url, "POST", "/dono/restaurar", token=self.dono, arquivo=self.copia.read_bytes())
        self.assertEqual([g["id"] for g in r["grupos"]], [self.gid])


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
        self.mudou = {}   # endereço antigo → novo (o servidor antigo responde 410)
        self.sem_acesso = set()
        p = mock.patch.object(s, "grupo_pede", self.pede)
        p.start()
        self.addCleanup(p.stop)
        self.gid, cod = self.grupo()
        p2 = mock.patch.object(s, "ping_grupo", lambda: False)
        p2.start()
        self.addCleanup(p2.stop)
        self.chave = s.api_grupo_entrar({"link": f"https://pc.tail1.ts.net/g/{self.gid}#{cod}"})["chave"]

    def pede(self, url, metodo, rota, corpo=None, token="", tempo=15, bruto=False, arquivo=None):
        if self.fora:
            raise s.GrupoFora("fora do ar", 502)
        if url in self.mudou:
            raise s.GrupoMudou("o grupo mudou de servidor", self.mudou[url])
        if url in self.sem_acesso:
            raise s.Erro("token inválido", 401)
        self.chamadas.append((url, rota))
        p = rota.strip("/").split("/")
        try:
            if p[2] == "entrar":
                return sg.entrar(p[1], corpo)
            if p[2] == "envio":
                return sg.envio(p[1], token, corpo)
            if p[2] == "placar":
                return sg.placar(p[1], token)
            if p[2] == "admin":
                return sg.admin_ver(p[1], token)
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

    def test_foto_nova_chega_ao_grupo(self):   # #109: a foto só ia na entrada
        foto = lambda: sg.q1("SELECT avatar FROM membros")["avatar"]
        s.api_grupo_sincronizar(self.resumo(10))
        self.assertEqual(foto(), "")
        r = s.api_grupo_sincronizar(dict(self.resumo(10), avatar="gon-1"))["grupos"][self.chave]
        self.assertEqual((foto(), r["enviados"]), ("gon-1", 0))
        n = len(self.chamadas)
        s.api_grupo_sincronizar(dict(self.resumo(10), avatar="gon-1"))   # já está lá: não manda de novo
        self.assertNotIn(f"/g/{self.gid}/envio", [rota for _, rota in self.chamadas[n:]])
        s.api_grupo_sincronizar(dict(self.resumo(10), avatar="../nao-existe"))   # inválida ou a do jogo: volta para o logo
        self.assertEqual(foto(), "")
        s.api_grupo_sincronizar(dict(self.resumo(10), avatar="gon-2"))
        s.api_grupo_sincronizar(self.resumo(10))   # jogo sem o campo (versão antiga): não mexe
        self.assertEqual(foto(), "gon-2")

    def test_offline_mostra_o_ultimo_placar_e_manda_depois(self):
        s.api_grupo_sincronizar(self.resumo(10))
        self.fora = True
        r = s.api_grupo_sincronizar(self.resumo(30))["grupos"][self.chave]
        self.assertTrue(r["offline"])
        self.assertEqual(r["placar"]["grupo"]["id"], self.gid)
        self.fora = False
        self.assertEqual(s.api_grupo_sincronizar(self.resumo(30))["grupos"][self.chave]["enviados"], 1)

    def test_segue_o_aviso_de_mudanca(self):
        s.api_grupo_sincronizar(self.resumo(10))
        self.mudou["https://pc.tail1.ts.net"] = "https://novo.tail1.ts.net"
        r = s.api_grupo_sincronizar(self.resumo(10))["grupos"]
        nova = f"https://novo.tail1.ts.net|{self.gid}"
        self.assertEqual(list(r), [nova])
        self.assertTrue(r[nova]["mudou"])
        self.assertEqual(r[nova]["enviados"], 2)   # o servidor novo recebe a temporada inteira de novo
        self.assertEqual(s.grupos()[0]["url"], "https://novo.tail1.ts.net")
        self.assertEqual(list(s.ler_json("enviado.json", {})), [nova])
        self.assertEqual(len(list((s.DADOS / "grupo").glob("*.json"))), 1)

    def test_admin_tambem_segue_o_aviso(self):
        self.mudou["https://pc.tail1.ts.net"] = "https://novo.tail1.ts.net"
        self.assertTrue(s.api_grupo_admin({"chave": self.chave, "acao": "ver"})["ok"])
        self.assertEqual(s.grupos()[0]["url"], "https://novo.tail1.ts.net")

    def test_servidor_novo_sem_o_token_nao_troca(self):
        self.mudou["https://pc.tail1.ts.net"] = "https://novo.tail1.ts.net"
        self.sem_acesso.add("https://novo.tail1.ts.net")
        r = s.api_grupo_sincronizar(self.resumo(10))["grupos"][self.chave]
        self.assertIn("reconvite", r["erro"])
        self.assertEqual(s.grupos()[0]["url"], "https://pc.tail1.ts.net")

    def test_link_sem_codigo_troca_o_endereco(self):
        r = s.api_grupo_entrar({"link": f"https://novo.tail1.ts.net/g/{self.gid}"})
        self.assertTrue(r["mudou"])
        self.assertEqual(s.grupos()[0]["url"], "https://novo.tail1.ts.net")
        self.assertEqual(len(s.grupos()), 1)
        with self.assertRaises(s.Erro):
            s.api_grupo_entrar({"link": "https://novo.tail1.ts.net/g/outro-grupo"})

    def test_sair_apaga_o_vinculo(self):
        with mock.patch.object(s, "grupo_pede", side_effect=s.GrupoFora("fora", 502)):
            s.api_grupo_sair({"chave": self.chave})
        self.assertEqual(s.grupos(), [])
        self.assertNotIn(self.chave, s.ler_json("enviado.json", {}))


class TabelaDoDia(Base):
    """A tabela do dia do Codeforces (#171): grupo/cf_dia.py e a volta do servidor do grupo, com a API trocada por dados fixos."""
    CAL = {**torre.CALIB}

    def prob(self, c, i, r):
        return {"contestId": c, "index": i, "rating": r, "name": f"P{c}{i}", "tags": []}

    def test_sorteia_um_por_faixa_dentro_do_intervalo_e_fora_dos_resolvidos(self):
        ps = [self.prob(1000 + r, "A", r) for r in range(800, 3100, 100)] + [self.prob(100500, "A", 900)]
        tab = cf_dia.sorteia(ps, {"1900A"}, "g:2026-10-22")
        self.assertEqual([p["letra"] for p in tab], list("ABCDEFG"))
        for p in tab:
            lo, hi = cf_dia.FAIXAS[p["faixa"]]
            self.assertTrue(lo <= p["rating"] <= hi)
        self.assertNotIn("1900A", [p["id"] for p in tab])
        self.assertEqual(tab, cf_dia.sorteia(ps, {"1900A"}, "g:2026-10-22"))   # a mesma semente, o mesmo sorteio

    def test_piso_teto_e_bonus(self):
        tab = [{"id": x, "faixa": f} for x, f in (("a", 0), ("b", 1), ("c", 3), ("d", 4))]
        feitos = [(1, "a", 10), (2, "a", 11), (1, "b", 12), (1, "c", 13), (2, "c", 14), (2, "d", 15)]
        linhas, pts = cf_dia.pontua(tab, feitos, {1: None, 2: 1750}, self.CAL)
        m = {(x["membro"], x["id"]): (x["pts"], x["motivo"]) for x in linhas}
        self.assertEqual(m[(1, "a")], (2 + 2, "primeiro"))
        self.assertEqual(m[(2, "a")], (0, "piso"))          # faixa D (1750): A fica 3 faixas abaixo, o piso deixa só 1
        self.assertEqual(m[(1, "c")], (0, "teto"))          # o 3º do dia passa do teto de 2
        self.assertEqual(m[(2, "c")], (5 + 1, "primeiro"))   # o bônus passa, pela metade, ao primeiro que pontua
        self.assertEqual(pts, {1: 4 + 5, 2: 6 + 6 + 2})

    def test_rodada_sorteia_e_confere(self):
        gid, cod = self.grupo()
        ana = self.entra(gid, cod)
        sg.envio(gid, ana["token"], {"protocolo": sg.PROTOCOLO, "dias": [], "cf": "ana_cf"})
        ps = [self.prob(1000 + r, "A", r) for r in range(800, 3100, 100)]
        envios = []

        def api(metodo, **kw):
            if metodo == "problemset.problems":
                return {"problems": ps}
            if metodo == "user.info":
                return [{"handle": "ana_cf", "rating": 1450}]
            return envios
        with mock.patch.object(sg, "cf_api", side_effect=api), mock.patch.object(sg.jogo, "cf_envios", return_value=([], True)), \
                mock.patch.object(sg, "CF_PAUSA", 0):
            sg.cf_rodada()
            tab = json.loads(sg.q1("SELECT dados FROM cf_dia WHERE grupo = ?", (gid,))["dados"])
            self.assertEqual(len(tab["problemas"]), 7)
            alvo = tab["problemas"][3]
            envios.append({"verdict": "OK", "problem": {"contestId": alvo["contest"], "index": alvo["index"]}, "creationTimeSeconds": int(time.time())})
            sg.cf_rodada()
        p = sg.placar(gid, ana["token"])["torre"]["cf_dia"]
        self.assertTrue(p["ligado"])
        self.assertEqual([(x["id"], x["motivo"]) for x in p["feitos"]], [(alvo["id"], "primeiro")])
        self.assertEqual(p["pontos"][ana["membro"]], 2 + 3 + 2)
        # o dia fecha e a tabela vira Trick Coin, uma vez só
        sg.paga({"id": gid}, f"dia:{p['dia']}")
        sg.paga({"id": gid}, f"dia:{p['dia']}")
        self.assertEqual(sg.carteira(gid, ana["membro"])["saldo"], 7)


class TrickCoin(Base):
    """A Trick Coin (#43): a marca da semana, o chefão derrotado e a modalidade como 5º bloco."""

    def test_chefao_paga_so_derrotado_e_ate_mais_50(self):
        ch = {"vida": 30, "dano": 30, "minimo": 0.5, "teto": 1.5,
              "membros": [{"membro": 1, "meta": 10, "conta": 15}, {"membro": 2, "meta": 10, "conta": 10}, {"membro": 3, "meta": 10, "conta": 4}]}
        self.assertEqual(torre.Grupo.chefao_paga(ch, 80), {1: 120, 2: 80})
        self.assertEqual(torre.Grupo.chefao_paga({**ch, "dano": 20}, 80), {})

    def test_marca_da_semana_paga_quem_bateu(self):
        gid, cod = self.grupo()
        ana = self.entra(gid, cod)
        seg = date.today() - timedelta(days=date.today().weekday() + 21)
        # 2 semanas de base com XP em 3 dias e a 3ª com XP todos os dias: na modalidade Constância, só a 3ª bate a marca
        dias = [{"dia": (seg + timedelta(days=k)).isoformat(), "xp": 100} for k in range(21) if k >= 14 or k % 7 < 3]
        sg.envio(gid, ana["token"], {"protocolo": sg.PROTOCOLO, "dias": dias})
        G = sg.retrato(sg.grupo_ou_404(gid))
        with mock.patch.object(torre.Grupo, "modalidades", lambda self: ["constancia"]):
            S = G.semanal()
            sem = S["semanas"][2]
            self.assertEqual(sem["geral"][0]["mod"], 100)
            self.assertTrue(sem["geral"][0]["bateu"])
            sg.paga({"id": gid}, "semana:" + sem["semana"])
        c = sg.carteira(gid, ana["membro"])
        self.assertEqual(c["saldo"], torre.CALIB["tc_marca"])
        self.assertEqual(c["extrato"][0]["motivo"], "marca da semana")

    def test_modalidades_tem_os_habitos_do_grupo(self):
        G = torre.Grupo([{"id": 1, "nome": "a"}], {}, [{"id": "cf", "nome": "Codeforces"}, {"id": "duo", "nome": "Duolingo"}], {}, date.today())
        self.assertEqual(G.modalidades(), ["ritmo", "habitos", "superacao", "constancia", "cf", "missao", "hab:duo"])
        self.assertEqual(len(G.semanal()["opcoes"]), 3)


class Fase1(Base):
    """Prazos no protocolo 2, a escolha da modalidade pelo 1º da semana e o relatório para calibrar (#170)."""

    def setUp(self):
        super().setUp()
        self.gid, cod = self.grupo()
        self.ana = self.entra(self.gid, cod)
        self.seg = date.today() - timedelta(days=date.today().weekday())

    def test_prazos_viram_o_bloco(self):
        d = self.seg.isoformat()
        sg.envio(self.gid, self.ana["token"], {"protocolo": 2, "dias": [{"dia": d, "xp": 50, "pz": [4, 3]}]})
        s = sg.retrato(sg.grupo_ou_404(self.gid)).semanal()["semanas"][-1]
        self.assertEqual(s["geral"][0]["blocos"]["prazos"], 75)
        with self.assertRaises(sg.Erro):
            sg.envio(self.gid, self.ana["token"], {"protocolo": 2, "dias": [{"dia": d, "xp": 50, "pz": [1, 2]}]})

    def test_escolha_da_modalidade(self):
        dias = [{"dia": (self.seg - timedelta(days=7) + timedelta(days=k)).isoformat(), "xp": 50} for k in range(7 + date.today().weekday() + 1)]
        sg.envio(self.gid, self.ana["token"], {"protocolo": 2, "dias": dias})
        G = sg.retrato(sg.grupo_ou_404(self.gid))
        s = G.semanal()["semanas"][-1]
        self.assertEqual(s["escolhe"], self.ana["membro"])
        with self.assertRaises(sg.Erro):
            sg.escolhe_modalidade(self.gid, self.ana["token"], {"mod": "nao-existe"})
        sg.escolhe_modalidade(self.gid, self.ana["token"], {"mod": s["opcoes"][1]})
        G = sg.retrato(sg.grupo_ou_404(self.gid))
        self.assertEqual(G.semanal()["escolha"], s["opcoes"][1])
        # na semana seguinte, a modalidade é a escolhida (e quem escolheu fica registrado)
        G2 = torre.Grupo(G.membros, {m: {k.isoformat(): v for k, v in G.dias[m].items()} for m in G.ids}, G.catalogo, {}, self.seg + timedelta(days=7),
                         escolhas=G.escolhas, desde=G.desde)
        prox = G2.semanal()["semanas"][-1]
        self.assertEqual((prox["modalidade"], prox["escolhida_por"]), (s["opcoes"][1], self.ana["membro"]))

    def test_relatorio_so_para_admin(self):
        sg.envio(self.gid, self.ana["token"], {"protocolo": 2, "dias": [{"dia": self.seg.isoformat(), "xp": 50}]})
        r = sg.admin_relatorio(self.gid, self.ana["token"])
        self.assertIn("semanas", r)
        self.assertNotIn("xp", json.dumps(r["dias"]))   # o XP bruto não sai, só os andares
        self.assertEqual(len(r["tabela_do_dia"]["faixas"]), 7)


class Duelo(Base):
    """O duelo 1×1 do Codeforces (#171): convite de 10 minutos, 3 problemas em volta da faixa do mais fraco, pago por problema."""
    CAL = {**torre.CALIB}

    def setUp(self):
        super().setUp()
        self.gid, cod = self.grupo()
        self.ana = self.entra(self.gid, cod)
        self.bia = self.entra(self.gid, sg.admin_convite(self.gid, self.ana["token"], {})["codigo"], "Bia")
        self.cris = self.entra(self.gid, sg.admin_convite(self.gid, self.ana["token"], {})["codigo"], "Cris")
        for x, h in ((self.ana, "ana_cf"), (self.bia, "bia_cf")):
            sg.envio(self.gid, x["token"], {"protocolo": sg.PROTOCOLO, "dias": [], "cf": h})
        self.envios = {"ana_cf": [], "bia_cf": []}
        ps = [{"contestId": 1000 + r, "index": "A", "rating": r, "name": f"P{r}", "tags": []} for r in range(800, 3100, 100)]

        def api(metodo, **kw):
            if metodo == "problemset.problems":
                return {"problems": ps}
            if metodo == "user.info":
                return [{"handle": "ana_cf", "rating": 2100}, {"handle": "bia_cf", "rating": 1450}]
            return self.envios[kw["handle"]]
        for p in (mock.patch.object(sg, "cf_api", side_effect=api), mock.patch.object(sg.jogo, "cf_envios", return_value=([], True)),
                  mock.patch.object(sg, "CF_PAUSA", 0)):
            p.start()
            self.addCleanup(p.stop)

    def d(self, quem, **kw):
        return sg.duelo(self.gid, quem["token"], kw)

    def test_faixas_em_volta_do_mais_fraco(self):
        self.assertEqual(cf_dia.faixas_duelo([2100, 1450]), [1, 2, 3])
        self.assertEqual(cf_dia.faixas_duelo([None, 1450]), [0, 1, 2])
        self.assertEqual(cf_dia.faixas_duelo([2900, 2800]), [4, 5, 6])

    def test_vencedor_resolve_mais_e_no_empate_o_mais_rapido(self):
        ps = [{"id": x, "faixa": f} for x, f in (("a", 1), ("b", 2), ("c", 3))]
        pl, v = cf_dia.duelo(ps, [(1, "a", 100), (2, "a", 50), (2, "b", 300), (1, "b", 200)], [1, 2], 0, self.CAL)
        self.assertEqual(v, 1)                                  # 2 a 2: a Ana chegou ao 2º antes
        self.assertEqual(pl[1]["pts"], cf_dia.valor(1, self.CAL) + cf_dia.valor(2, self.CAL))
        self.assertEqual(cf_dia.duelo(ps, [], [1, 2], 0, self.CAL)[1], None)

    def test_convite_regras(self):
        with self.assertRaises(sg.Erro):
            self.d(self.ana, acao="convidar", para=self.cris["membro"])   # a Cris não ligou o Codeforces
        r = self.d(self.ana, acao="convidar", para=self.bia["membro"])
        self.assertEqual(len(r["convites"]), 1)
        with self.assertRaises(sg.Erro):
            self.d(self.ana, acao="convidar", para=self.bia["membro"])    # um convite aberto por vez
        cid = r["convites"][0]["id"]
        with self.assertRaises(sg.Erro):
            self.d(self.ana, acao="aceitar", id=cid)                      # só quem foi convidado aceita
        self.assertEqual(sg.caixa_de(self.gid, self.bia["token"])["convites"][0]["de"], self.ana["membro"])
        # depois de 10 minutos o convite some
        with mock.patch.object(sg, "agora", return_value=time.time() + sg.DUELO_CONVITE + 1):
            self.assertEqual(sg.caixa_de(self.gid, self.bia["token"])["convites"], [])
            with self.assertRaises(sg.Erro):
                self.d(self.bia, acao="aceitar", id=cid)
        self.d(self.bia, acao="recusar", id=cid)
        self.assertEqual(sg.caixa_de(self.gid, self.ana["token"])["convites"], [])

    def test_duelo_inteiro(self):
        cid = self.d(self.ana, acao="convidar", para=self.bia["membro"])["convites"][0]["id"]
        r = self.d(self.bia, acao="aceitar", id=cid)
        self.assertEqual(r["duelo"]["estado"], "aceito")
        with self.assertRaises(sg.Erro):
            self.d(self.ana, acao="convidar", para=self.bia["membro"])    # os dois estão em duelo
        sg.duelo_rodada()
        du = sg.caixa_de(self.gid, self.ana["token"])["duelo"]
        self.assertEqual(du["estado"], "andamento")
        self.assertNotIn("problemas", du)                    # na contagem, os problemas ficam escondidos
        with mock.patch.object(sg, "agora", return_value=du["ini"]):
            du = sg.caixa_de(self.gid, self.ana["token"])["duelo"]
        self.assertEqual(sorted(p["faixa"] for p in du["problemas"]), [1, 2, 3])   # a Bia (1450) está na faixa C
        ini = du["ini"]
        ok = lambda p, t: {"verdict": "OK", "problem": {"contestId": p["contest"], "index": p["index"]}, "creationTimeSeconds": int(ini + t)}
        a, b, c = du["problemas"]
        self.envios["bia_cf"] += [ok(a, 60), ok(b, 300)]
        self.envios["ana_cf"] += [ok(a, -100), ok(a, 120)]   # o envio de antes do início não conta
        sg.duelo_rodada(ini + 400)
        with mock.patch.object(sg, "agora", return_value=ini + 400):
            du = sg.caixa_de(self.gid, self.ana["token"])["duelo"]
        self.assertEqual(du["estado"], "andamento")
        self.assertEqual([(j["membro"], j["n"]) for j in du["jogadores"]], [(self.ana["membro"], 1), (self.bia["membro"], 2)])
        self.envios["bia_cf"].append(ok(c, 900))
        sg.duelo_rodada(ini + 1000)                          # a Bia resolveu os 3: acaba antes da hora
        du = sg.caixa_de(self.gid, self.bia["token"])["duelo"]
        self.assertEqual((du["estado"], du["venceu"]), ("fim", self.bia["membro"]))
        self.assertEqual(sg.carteira(self.gid, self.bia["membro"])["saldo"], sum(cf_dia.valor(p["faixa"], self.CAL) for p in du["problemas"]))
        self.assertEqual(sg.carteira(self.gid, self.ana["membro"])["saldo"], cf_dia.valor(a["faixa"], self.CAL))
        sg.duelo_rodada(ini + 1100)                          # não paga duas vezes
        self.assertEqual(sg.carteira(self.gid, self.ana["membro"])["extrato"][0]["motivo"], "duelo")
        self.assertEqual(len(sg.carteira(self.gid, self.ana["membro"])["extrato"]), 1)
        h = sg.caixa_de(self.gid, self.bia["token"])["historico"]
        self.assertEqual((h["duelos"], h["vitorias"], h["derrotas"], h["empates"]), (1, 1, 0, 0))
        self.assertEqual(h["contra"], {str(self.ana["membro"]): {"v": 1, "d": 0, "e": 0}})
        self.assertEqual([(x["id"], x["venceu"], [j["n"] for j in x["jogadores"]]) for x in h["lista"]], [(cid, self.bia["membro"], [1, 3])])
        # o duelo inteiro, para abrir pelo histórico; o placar leva o retrospecto de cada um para a licença
        self.assertEqual(len(self.d(self.ana, acao="ver", id=cid)["duelo"]["problemas"]), 3)
        with self.assertRaises(sg.Erro):
            self.d(self.ana, acao="ver", id=cid + 99)
        ms = {m["id"]: m["duelos"] for m in sg.placar(self.gid, self.ana["token"])["membros"]}
        self.assertEqual((ms[self.ana["membro"]], ms[self.cris["membro"]]), ({"v": 0, "d": 1, "e": 0}, {"v": 0, "d": 0, "e": 0}))

    def test_aceitar_derruba_os_outros_convites(self):
        sg.envio(self.gid, self.cris["token"], {"protocolo": sg.PROTOCOLO, "dias": [], "cf": "cris_cf"})
        c1 = self.d(self.cris, acao="convidar", para=self.bia["membro"])["convites"][0]["id"]
        c2 = self.d(self.ana, acao="convidar", para=self.bia["membro"])["convites"][0]["id"]
        self.d(self.bia, acao="aceitar", id=c2)
        self.assertEqual(sg.q1("SELECT estado FROM duelos WHERE id = ?", (c1,))["estado"], "cancelado")


if __name__ == "__main__":
    unittest.main()
